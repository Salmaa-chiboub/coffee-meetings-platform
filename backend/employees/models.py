from django.db import models
from campaigns.models import Campaign

class Employee(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()  # Removed unique=True
    arrival_date = models.DateField()
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, null=True, blank=True)

    class Meta:
        # Unique constraint: same email can't exist twice in the same campaign
        unique_together = ['email', 'campaign']
        indexes = [
            models.Index(fields=['campaign', 'name']),
            models.Index(fields=['campaign', 'email']),
            models.Index(fields=['campaign', 'arrival_date']),
            models.Index(fields=['email']),
            models.Index(fields=['name']),
        ]
        ordering = ['name']

    def __str__(self):
        return self.name

    def get_attributes_dict(self):
        """Return employee attributes as a dictionary"""
        return {attr.attribute_key: attr.attribute_value for attr in self.employeeattribute_set.all()}

class EmployeeAttribute(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    campaign = models.ForeignKey(Campaign, on_delete=models.CASCADE, null=True, blank=True)
    attribute_key = models.CharField(max_length=100)
    attribute_value = models.CharField(max_length=100)

    class Meta:
        indexes = [
            models.Index(fields=['employee', 'attribute_key']),
            models.Index(fields=['campaign', 'attribute_key']),
            models.Index(fields=['attribute_key', 'attribute_value']),
            models.Index(fields=['employee']),
        ]
        unique_together = ['employee', 'attribute_key']

    def __str__(self):
        return f"{self.attribute_key}: {self.attribute_value}"
