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
from .permissions import IsMatchingOwner


class AvailableAttributesView(APIView):
    """
    Step 1: Get available employee attributes for criteria definition
    GET /matching/campaigns/{campaign_id}/available-attributes/
    """
    permission_classes = [IsAuthenticated, IsMatchingOwner]

    def get(self, request, campaign_id):
        """Get available employee attributes for a specific campaign"""
        try:
            # Verify the campaign belongs to the user
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)

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
    permission_classes = [IsAuthenticated, IsMatchingOwner]

    def post(self, request, campaign_id):
        """Save matching criteria for a campaign"""
        try:
            # Verify the campaign belongs to the user
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)

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
    permission_classes = [IsAuthenticated, IsMatchingOwner]

    def get(self, request, campaign_id):
        """Generate employee pairs based on saved criteria"""
        try:
            # Verify the campaign belongs to the user
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)

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
    permission_classes = [IsAuthenticated, IsMatchingOwner]

    def post(self, request, campaign_id):
        """Confirm and save selected pairs with optional email notifications"""
        try:
            # Verify the campaign belongs to the user
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)

            print(f"DEBUG: Received data for campaign {campaign_id}: {request.data}")

            # Validate request data
            request_serializer = PairConfirmationRequestSerializer(data=request.data)
            if not request_serializer.is_valid():
                print(f"DEBUG: Serializer errors: {request_serializer.errors}")
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

            # Bulk upsert pairs in batches for performance
            BATCH_SIZE = 500
            for batch_start in range(0, len(pairs_data), BATCH_SIZE):
                batch = pairs_data[batch_start: batch_start + BATCH_SIZE]
                # Collect employee ids in this batch
                emp_ids = set()
                for pd in batch:
                    emp_ids.add(pd['employee_1_id'])
                    emp_ids.add(pd['employee_2_id'])

                employees_map = {e.id: e for e in Employee.objects.filter(id__in=list(emp_ids))}

                to_create = []
                for pd in batch:
                    emp1 = employees_map.get(pd['employee_1_id'])
                    emp2 = employees_map.get(pd['employee_2_id'])
                    if not emp1 or not emp2:
                        errors.append(f"Employee with ID {pd['employee_1_id']} or {pd['employee_2_id']} not found")
                        continue

                    # Skip existing pairs
                    if EmployeePair.pair_exists(campaign, emp1, emp2):
                        errors.append(f"Pair {emp1.name} & {emp2.name} already exists")
                        continue

                    to_create.append(EmployeePair(
                        campaign=campaign,
                        employee1=emp1,
                        employee2=emp2,
                        created_by=created_by,
                        matching_criteria_snapshot=criteria_snapshot
                    ))

                if to_create:
                    # Use regular create instead of bulk_create to ensure IDs are assigned
                    for pair_obj in to_create:
                        try:
                            pair_obj.save()
                            saved_pairs.append({
                                'pair_id': pair_obj.id,
                                'employee_1_id': pair_obj.employee1_id,
                                'employee_1_name': employees_map[pair_obj.employee1_id].name,
                                'employee_2_id': pair_obj.employee2_id,
                                'employee_2_name': employees_map[pair_obj.employee2_id].name
                            })
                        except Exception as e:
                            errors.append(f"Failed to create pair: {str(e)}")

                # Lock criteria after successful pair creation
                if saved_pairs:
                    criteria.update(is_locked=True)

            # Send email notifications if requested
            email_results = None
            if send_emails and saved_pairs:
                try:
                    print(f"DEBUG: About to send emails for {len(saved_pairs)} saved pairs")
                    print(f"DEBUG: Saved pairs data: {saved_pairs}")
                    print(f"DEBUG: Pair IDs to notify: {[pair['pair_id'] for pair in saved_pairs]}")
                    
                    email_service = EmailNotificationService()
                    pairs_to_notify = EmployeePair.objects.filter(
                        id__in=[pair['pair_id'] for pair in saved_pairs]
                    )
                    
                    print(f"DEBUG: Found {pairs_to_notify.count()} pairs in database")
                    print(f"DEBUG: Pairs to notify: {list(pairs_to_notify.values('id', 'employee1__name', 'employee2__name'))}")
                    
                    if pairs_to_notify.exists():
                        print(f"DEBUG: Starting email service for {pairs_to_notify.count()} pairs")
                        email_results = email_service.send_pair_notifications(pairs_to_notify)
                        print(f"DEBUG: Email service completed with results: {email_results}")
                    else:
                        print(f"DEBUG: No pairs found in database for IDs: {[pair['pair_id'] for pair in saved_pairs]}")
                        # Check if pairs were actually created
                        all_pairs = EmployeePair.objects.filter(campaign=campaign)
                        print(f"DEBUG: Total pairs in campaign: {all_pairs.count()}")
                        print(f"DEBUG: All pairs: {list(all_pairs.values('id', 'employee1__name', 'employee2__name'))}")
                        
                        # Try to find pairs by employee IDs as fallback
                        fallback_pairs = []
                        for saved_pair in saved_pairs:
                            fallback_pair = EmployeePair.objects.filter(
                                campaign=campaign,
                                employee1_id=saved_pair['employee_1_id'],
                                employee2_id=saved_pair['employee_2_id']
                            ).first()
                            if fallback_pair:
                                fallback_pairs.append(fallback_pair)
                        
                        if fallback_pairs:
                            print(f"DEBUG: Found {len(fallback_pairs)} pairs using fallback method")
                            email_results = email_service.send_pair_notifications(fallback_pairs)
                            print(f"DEBUG: Fallback email service completed with results: {email_results}")
                        else:
                            print(f"DEBUG: No fallback pairs found either")
                except Exception as e:
                    errors.append(f"Email sending failed: {str(e)}")
                    print(f"DEBUG: Exception in email sending: {str(e)}")
                    import traceback
                    print(f"DEBUG: Full traceback: {traceback.format_exc()}")

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


class MatchingHistoryView(APIView):
    """
    Step 5: Get complete matching history for a campaign
    GET /matching/campaigns/{campaign_id}/history/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, campaign_id):
        """Get complete matching history with all information for HR display"""
        try:
            # Verify the campaign belongs to the user
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)

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
            # Verify the campaign belongs to the user
            campaign = get_object_or_404(Campaign, id=campaign_id, hr_manager=request.user)

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