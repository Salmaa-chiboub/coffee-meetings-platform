
from django.db import models
from users.models import HRManager 

class Campaign(models.Model):
    title = models.CharField(max_length=100)
    start_date = models.DateField()
    end_date = models.DateField()
    hr_manager_id = models.IntegerField()  
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title
