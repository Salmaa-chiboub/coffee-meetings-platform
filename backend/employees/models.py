from django.db import models

class Employee(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    arrival_date = models.DateField()

    def __str__(self):
        return self.name

class EmployeeAttribute(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    campaign_id = models.IntegerField()  # هادشي ممكن يتبدل ب FK من campaign فاش نصاوبوه
    attribute_key = models.CharField(max_length=100)
    attribute_value = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.attribute_key}: {self.attribute_value}"
