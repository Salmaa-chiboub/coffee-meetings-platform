from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import CampaignMatchingCriteria, EmployeePair
from .serializers import CampaignMatchingCriteriaSerializer, EmployeePairSerializer

from employees.models import Employee, EmployeeAttribute



from itertools import combinations
from random import shuffle
from rest_framework.request import Request
from django.utils import timezone
from django.db.models import Q

from evaluations.utils import create_evaluations_and_send_emails




# ✅ Existing viewsets
class CampaignMatchingCriteriaViewSet(viewsets.ModelViewSet):
    queryset = CampaignMatchingCriteria.objects.all()
    serializer_class = CampaignMatchingCriteriaSerializer
    permission_classes = [IsAuthenticated]

class EmployeePairViewSet(viewsets.ModelViewSet):
    queryset = EmployeePair.objects.all()
    serializer_class = EmployeePairSerializer
    permission_classes = [IsAuthenticated]




# to get all the attributes of employees in the excel 

class AvailableAttributesView(APIView):
    def get(self, request):
        attributes = EmployeeAttribute.objects.values_list('attribute_key', flat=True).distinct()
        return Response({"available_attributes": list(attributes)})
    





# send and save matching  criteria

class SaveMatchingCriteriaView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, campaign_id):
        criteria = request.data.get("criteria", [])

        if not criteria:
            return Response({"error": "No criteria provided."}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for item in criteria:
            key = item.get("attribute_key")
            rule = item.get("rule")

            if key and rule in ["same", "not_same"]:
                obj, created_obj = CampaignMatchingCriteria.objects.get_or_create(
                    campaign_id=campaign_id,
                    attribute_key=key,
                    defaults={"rule": rule}
                )
                if not created_obj:
                    obj.rule = rule
                    obj.save()
                created.append({"attribute_key": key, "rule": rule})

        return Response({"message": f"{len(created)} criteria saved.", "criteria": created})
   









# to match pairs
class GeneratePairsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request: Request, campaign_id: int):
        # 1. Optional limit
        limit_param = request.query_params.get('limit')
        limit = int(limit_param) if limit_param and limit_param.isdigit() else None

        # 2. Criteria
        criteria = CampaignMatchingCriteria.objects.filter(campaign_id=campaign_id)

        # 3. Employees in campaign
        employees = Employee.objects.filter(
            id__in=EmployeeAttribute.objects.filter(campaign_id=campaign_id)
            .values_list('employee_id', flat=True)
            .distinct()
        )

        if employees.count() < 2:
            return Response({"error": "Not enough employees to generate pairs."}, status=400)

        # ----------- 4. NO criteria → random ------------
        if not criteria.exists():
            employees_list = list(employees)
            shuffle(employees_list)

            valid_pairs = []
            for i in range(0, len(employees_list) - 1, 2):
                emp1 = employees_list[i]
                emp2 = employees_list[i + 1]
                valid_pairs.append({
                    "employee_1": {"id": emp1.id, "name": emp1.name, "email": emp1.email},
                    "employee_2": {"id": emp2.id, "name": emp2.name, "email": emp2.email}
                })

            if limit and len(valid_pairs) < limit:
                return Response({
                    "message": f"Only {len(valid_pairs)} valid pair(s) found, less than requested limit {limit}.",
                    "pairs": valid_pairs
                })

            if limit:
                valid_pairs = valid_pairs[:limit]

            return Response({"pairs": valid_pairs})

        # ------------ 5. WITH criteria ---------------
        employee_attributes = {
            emp.id: {
                attr.attribute_key: attr.attribute_value
                for attr in EmployeeAttribute.objects.filter(employee=emp, campaign_id=campaign_id)
            }
            for emp in employees
        }

        valid_pairs = []

        for emp1, emp2 in combinations(employees, 2):
            attrs1 = employee_attributes.get(emp1.id, {})
            attrs2 = employee_attributes.get(emp2.id, {})
            is_valid = True

            for crit in criteria:
                key = crit.attribute_key
                rule = crit.rule
                val1 = attrs1.get(key)
                val2 = attrs2.get(key)

                if rule == 'same' and val1 != val2:
                    is_valid = False
                    break
                elif rule == 'not_same' and val1 == val2:
                    is_valid = False
                    break

            if is_valid:
                valid_pairs.append({
                    "employee_1": {"id": emp1.id, "name": emp1.name, "email": emp1.email},
                    "employee_2": {"id": emp2.id, "name": emp2.name, "email": emp2.email}
                })

        # ✅ Add message if limit > available pairs
        if limit and len(valid_pairs) < limit:
            return Response({
                "message": f"Only {len(valid_pairs)} valid pair(s) found, less than requested limit {limit}.",
                "pairs": valid_pairs
            })

        if limit:
            valid_pairs = valid_pairs[:limit]

        return Response({"pairs": valid_pairs})
    




# to confirm pairs
class ConfirmPairsView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request: Request, campaign_id: int):
        pairs = request.data.get("pairs", [])

        if not pairs:
            return Response({"error": "No pairs provided."}, status=400)

        saved = []

        for pair in pairs:
            emp1_id = pair.get("employee_1_id")
            emp2_id = pair.get("employee_2_id")

            if not emp1_id or not emp2_id:
                continue

            emp1 = Employee.objects.filter(id=emp1_id).first()
            emp2 = Employee.objects.filter(id=emp2_id).first()

            if not emp1 or not emp2:
                continue

            # ✅ Avoid duplicates: even if reversed
            exists = EmployeePair.objects.filter(
                campaign_id=campaign_id
            ).filter(
                (Q(employee1=emp1) & Q(employee2=emp2)) |
                (Q(employee1=emp2) & Q(employee2=emp1))
            ).exists()

            if exists:
                continue

            # ✅ Save the pair
            pair = EmployeePair.objects.create(
                campaign_id=campaign_id,
                employee1=emp1,
                employee2=emp2,
                email_sent=True,
                created_at=timezone.now()
            )
            
            create_evaluations_and_send_emails(pair)

            saved.append({
                "employee_1_id": emp1.id,
                "employee_2_id": emp2.id
            })

        return Response({
            "message": f"{len(saved)} pairs saved successfully.",
            "saved_pairs": saved
        })