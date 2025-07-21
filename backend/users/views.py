from rest_framework import viewsets
from .models import HRManager
from .serializers import HRManagerSerializer

class HRManagerViewSet(viewsets.ModelViewSet):
    queryset = HRManager.objects.all()
    serializer_class = HRManagerSerializer

