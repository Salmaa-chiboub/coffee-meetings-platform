from django.db import models

class CampaignMatchingCriteria(models.Model):
    campaign_id = models.IntegerField()
    attribute_key = models.CharField(max_length=100)
    rule = models.CharField(max_length=20)

class EmployeePair(models.Model):
    campaign_id = models.IntegerField()
    employee1_id = models.IntegerField()
    employee2_id = models.IntegerField()
    email_sent = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
