# evaluation/utils.py
from .models import Evaluation
from django.core.mail import send_mail
import uuid
from django.conf import settings

def create_evaluations_and_send_emails(pair):
    emp1 = pair.employee1
    emp2 = pair.employee2

    eval1 = Evaluation.objects.create(
        employee=emp1,
        employee_pair=pair,
        token=uuid.uuid4()
    )

    eval2 = Evaluation.objects.create(
        employee=emp2,
        employee_pair=pair,
        token=uuid.uuid4()
    )

    # Send email to emp1
    send_mail(
        subject="Evaluation de votre rencontre",
        message=f"Bonjour {emp1.name}, merci de remplir ce formulaire: http://your-frontend.com/evaluation/{eval1.token}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[emp1.email],
    )

    # Send email to emp2
    send_mail(
        subject="Evaluation de votre rencontre",
        message=f"Bonjour {emp2.name}, merci de remplir ce formulaire: http://your-frontend.com/evaluation/{eval2.token}",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[emp2.email],
    )
