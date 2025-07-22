from django.db import models
from employees.models import Employee
from matching.models import EmployeePair

class Evaluation(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, null=True, blank=True)
    employee_pair = models.ForeignKey(EmployeePair, on_delete=models.CASCADE, null=True, blank=True)
    rating = models.IntegerField()
    comment = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    token = models.UUIDField()
    used = models.BooleanField(default=False)

    def __str__(self):
        return f"Eval {self.employee.name} - {self.rating}"
