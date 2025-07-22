from django.db import models
from campaigns.models import Campaign
from employees.models import Employee

class CampaignMatchingCriteria(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, null=True, blank=True)
    attribute_key = models.CharField(max_length=100)
    rule = models.CharField(max_length=20)

class EmployeePair(models.Model):
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, null=True, blank=True)
    employee1 = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='pairs_as_employee1', null=True, blank=True)
    employee2 = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='pairs_as_employee2', null=True, blank=True)
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
