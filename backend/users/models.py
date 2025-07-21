from django.db import models

# Create your models here.


class HRManager(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password_hash = models.TextField()
    company_name = models.CharField(max_length=255)

    def __str__(self):
        return self.name
