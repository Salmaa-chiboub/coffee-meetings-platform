from django.db import models

class Evaluation(models.Model):
    employee_id = models.IntegerField()
    employee_pair_id = models.IntegerField()
    rating = models.IntegerField()
    comment = models.TextField(blank=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    token = models.UUIDField()
    used = models.BooleanField(default=False)

    def __str__(self):
        return f"Eval {self.employee_id} - {self.rating}"
