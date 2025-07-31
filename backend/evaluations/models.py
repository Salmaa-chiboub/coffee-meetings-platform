from django.db import models
from employees.models import Employee
from matching.models import EmployeePair

class Evaluation(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, null=True, blank=True)
    employee_pair = models.ForeignKey(EmployeePair, on_delete=models.CASCADE, null=True, blank=True)
    rating = models.IntegerField(null=True, blank=True)
    comment = models.TextField(null=True, blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    token = models.UUIDField()
    used = models.BooleanField(default=False)

    class Meta:
        indexes = [
            models.Index(fields=['employee_pair', 'used']),
            models.Index(fields=['employee', 'submitted_at']),
            models.Index(fields=['token']),
            models.Index(fields=['used', 'submitted_at']),
            models.Index(fields=['rating']),
        ]
        ordering = ['-submitted_at']

    def __str__(self):
        return f"Eval {self.employee.name} - {self.rating}"
