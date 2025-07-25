from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404

from .models import CampaignMatchingCriteria, EmployeePair
from .serializers import (
    CampaignMatchingCriteriaSerializer, EmployeePairSerializer,
    AvailableAttributesSerializer, CriteriaSaveRequestSerializer,
    CriteriaSaveResponseSerializer, PairGenerationResponseSerializer,
    PairConfirmationRequestSerializer, PairConfirmationResponseSerializer,
    MatchingHistorySerializer, CriteriaHistorySerializer
)
from .services import MatchingAlgorithmService, EmailNotificationService
from employees.models import Employee, EmployeeAttribute
from campaigns.models import Campaign


class AvailableAttributesView(APIView):
    """
    Step 1: Get available employee attributes for criteria definition
    GET /matching/campaigns/{campaign_id}/available-attributes/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, campaign_id):
        """Get available employee attributes for a specific campaign"""
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id)

            # Get distinct attributes for this campaign
            attributes = EmployeeAttribute.objects.filter(
                campaign=campaign
            ).values_list('attribute_key', flat=True).distinct()

            response_data = {
                'available_attributes': list(attributes),
                'total_count': len(attributes),
                'campaign_id': campaign_id
            }

            serializer = AvailableAttributesSerializer(response_data)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve attributes: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    

class SaveMatchingCriteriaView(APIView):
    """
    Step 2: Save matching criteria for a campaign
    POST /matching/campaigns/{campaign_id}/criteria/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, campaign_id):
        """Save matching criteria for a campaign"""
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id)

            # Validate request data
            request_serializer = CriteriaSaveRequestSerializer(data=request.data)
            if not request_serializer.is_valid():
                return Response(
                    {'error': 'Invalid request data', 'details': request_serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            criteria_data = request_serializer.validated_data['criteria']

            # Check if criteria are already locked (pairs generated)
            if CampaignMatchingCriteria.objects.filter(
                campaign=campaign, is_locked=True
            ).exists():
                return Response(
                    {'error': 'Criteria are locked because pairs have already been generated'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Get user identifier for audit trail
            created_by = getattr(request.user, 'username', 'unknown')

            saved_criteria = []

            with transaction.atomic():
                # Clear existing criteria for this campaign
                CampaignMatchingCriteria.objects.filter(campaign=campaign).delete()

                # Create new criteria
                for criterion in criteria_data:
                    attribute_key = criterion['attribute_key']
                    rule = criterion['rule']

                    # Validate that attribute exists in campaign
                    if not EmployeeAttribute.objects.filter(
                        campaign=campaign, attribute_key=attribute_key
                    ).exists():
                        return Response(
                            {'error': f'Attribute "{attribute_key}" not found in campaign employees'},
                            status=status.HTTP_400_BAD_REQUEST
                        )

                    criteria_obj = CampaignMatchingCriteria.objects.create(
                        campaign=campaign,
                        attribute_key=attribute_key,
                        rule=rule,
                        created_by=created_by
                    )

                    saved_criteria.append({
                        'attribute_key': attribute_key,
                        'rule': rule,
                        'id': criteria_obj.id
                    })

            response_data = {
                'success': True,
                'message': f'{len(saved_criteria)} criteria saved successfully',
                'criteria_saved': saved_criteria,
                'total_saved': len(saved_criteria)
            }

            serializer = CriteriaSaveResponseSerializer(response_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Failed to save criteria: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
   





class GeneratePairsView(APIView):
    """
    Step 3: Generate employee pairs based on saved criteria
    GET /matching/campaigns/{campaign_id}/generate-pairs/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, campaign_id):
        """Generate employee pairs based on saved criteria"""
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id)

            # Get optional limit parameter
            limit_param = request.query_params.get('limit')
            limit = int(limit_param) if limit_param and limit_param.isdigit() else None

            # Get user identifier for audit trail
            created_by = getattr(request.user, 'username', 'unknown')

            # Use the enhanced matching service
            matching_service = MatchingAlgorithmService(campaign_id)
            result = matching_service.generate_pairs(limit=limit, created_by=created_by)

            if not result['success']:
                return Response(
                    {'error': result['error']},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Serialize the response
            serializer = PairGenerationResponseSerializer(result)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to generate pairs: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
class ConfirmPairsView(APIView):
    """
    Step 4: Confirm selected pairs and optionally send email notifications
    POST /matching/campaigns/{campaign_id}/confirm-pairs/
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, campaign_id):
        """Confirm and save selected pairs with optional email notifications"""
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id)

            # Validate request data
            request_serializer = PairConfirmationRequestSerializer(data=request.data)
            if not request_serializer.is_valid():
                return Response(
                    {'error': 'Invalid request data', 'details': request_serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )

            pairs_data = request_serializer.validated_data['pairs']
            send_emails = request_serializer.validated_data['send_emails']

            # Get user identifier for audit trail
            created_by = getattr(request.user, 'username', 'unknown')

            # Get current criteria for snapshot
            criteria = CampaignMatchingCriteria.objects.filter(campaign=campaign)
            criteria_snapshot = list(criteria.values('attribute_key', 'rule'))

            saved_pairs = []
            errors = []

            with transaction.atomic():
                for pair_data in pairs_data:
                    emp1_id = pair_data['employee_1_id']
                    emp2_id = pair_data['employee_2_id']

                    try:
                        emp1 = Employee.objects.get(id=emp1_id)
                        emp2 = Employee.objects.get(id=emp2_id)

                        # Check if pair already exists
                        if EmployeePair.pair_exists(campaign, emp1, emp2):
                            errors.append(f"Pair {emp1.name} & {emp2.name} already exists")
                            continue

                        # Create the pair
                        pair = EmployeePair.objects.create(
                            campaign=campaign,
                            employee1=emp1,
                            employee2=emp2,
                            created_by=created_by,
                            matching_criteria_snapshot=criteria_snapshot
                        )

                        saved_pairs.append({
                            'pair_id': pair.id,
                            'employee_1_id': emp1.id,
                            'employee_1_name': emp1.name,
                            'employee_2_id': emp2.id,
                            'employee_2_name': emp2.name
                        })

                    except Employee.DoesNotExist:
                        errors.append(f"Employee with ID {emp1_id} or {emp2_id} not found")
                        continue

                # Lock criteria after successful pair creation
                if saved_pairs:
                    criteria.update(is_locked=True)

            # Send email notifications if requested
            email_results = None
            if send_emails and saved_pairs:
                try:
                    email_service = EmailNotificationService()
                    pairs_to_notify = EmployeePair.objects.filter(
                        id__in=[pair['pair_id'] for pair in saved_pairs]
                    )
                    email_results = email_service.send_pair_notifications(pairs_to_notify)
                except Exception as e:
                    errors.append(f"Email sending failed: {str(e)}")

            response_data = {
                'success': True,
                'message': f'{len(saved_pairs)} pairs confirmed and saved successfully',
                'pairs_saved': saved_pairs,
                'total_saved': len(saved_pairs),
                'email_results': email_results,
                'errors': errors if errors else None
            }

            serializer = PairConfirmationResponseSerializer(response_data)
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {'error': f'Failed to confirm pairs: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
            
            create_evaluations_and_send_emails(pair)


class MatchingHistoryView(APIView):
    """
    Step 5: Get complete matching history for a campaign
    GET /matching/campaigns/{campaign_id}/history/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, campaign_id):
        """Get complete matching history with all information for HR display"""
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id)

            # Get all pairs for this campaign
            pairs = EmployeePair.objects.filter(campaign=campaign).select_related(
                'employee1', 'employee2'
            ).order_by('-created_at')

            # Get criteria history
            criteria = CampaignMatchingCriteria.objects.filter(campaign=campaign)

            # Get email summary
            email_service = EmailNotificationService()
            email_summary = email_service.get_email_status_summary(campaign_id)

            # Get last generation date
            last_generation_date = pairs.first().created_at if pairs.exists() else None

            response_data = {
                'campaign_id': campaign_id,
                'campaign_title': campaign.title,
                'total_pairs': pairs.count(),
                'pairs': pairs,
                'criteria_history': criteria,
                'email_summary': email_summary,
                'last_generation_date': last_generation_date
            }

            serializer = MatchingHistorySerializer(response_data)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve matching history: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class CriteriaHistoryView(APIView):
    """
    Step 6: Get criteria history for a campaign
    GET /matching/campaigns/{campaign_id}/criteria-history/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, campaign_id):
        """Get criteria history with complete information"""
        try:
            campaign = get_object_or_404(Campaign, id=campaign_id)

            # Get all criteria for this campaign
            criteria = CampaignMatchingCriteria.objects.filter(campaign=campaign)

            # Check if criteria are locked
            is_locked = criteria.filter(is_locked=True).exists()

            # Count pairs generated
            pairs_generated = EmployeePair.objects.filter(campaign=campaign).count()

            response_data = {
                'campaign_id': campaign_id,
                'campaign_title': campaign.title,
                'criteria': criteria,
                'total_criteria': criteria.count(),
                'is_locked': is_locked,
                'pairs_generated': pairs_generated
            }

            serializer = CriteriaHistorySerializer(response_data)
            return Response(serializer.data, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {'error': f'Failed to retrieve criteria history: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )