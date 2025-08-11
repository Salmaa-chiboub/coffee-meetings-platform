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

    # Create evaluation URLs
    base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    eval1_url = f"{base_url}/evaluation/{eval1.token}"
    eval2_url = f"{base_url}/evaluation/{eval2.token}"

    # Send email to emp1
    html_message = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Evaluation</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #2d3748;
                margin: 0;
                padding: 0;
                background-color: #f7fafc;
            }}
            .email-container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white;
                padding: 32px 24px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 600;
                letter-spacing: -0.025em;
            }}
            .content {{
                padding: 32px 24px;
            }}
            .greeting {{
                font-size: 18px;
                margin-bottom: 24px;
                color: #1a202c;
            }}
            .evaluation-section {{
                background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
                border: 1px solid #9ae6b4;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                text-align: center;
            }}
            .evaluation-button {{
                display: inline-block;
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(72, 187, 120, 0.2);
            }}
            .evaluation-button:hover {{
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(72, 187, 120, 0.3);
            }}
            .footer {{
                background-color: #f7fafc;
                padding: 24px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }}
            .footer p {{
                margin: 8px 0;
                color: #718096;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>📝 Meeting Evaluation</h1>
            </div>
            
            <div class="content">
                <p class="greeting">Hello <strong>{emp1.name}</strong>,</p>
                
                <p>Thank you for participating in the coffee meeting with <strong>{emp2.name}</strong>!</p>
                
                <p>We'd love to hear about your experience. Your feedback helps us improve our networking program and create better matches in the future.</p>
                
                <div class="evaluation-section">
                    <h3>Share Your Experience</h3>
                    <p>Please take a moment to evaluate your coffee meeting:</p>
                    <a href="{eval1_url}" class="evaluation-button">Complete Evaluation</a>
                    <p style="font-size: 12px; margin-top: 12px; color: #4a5568;">
                        This link will remain active until you submit your feedback.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p>Questions? Contact your HR team</p>
                <p><strong>Coffee Meetings Team</strong></p>
            </div>
        </div>
    </body>
    </html>
    """

    plain_message = f"""
📝 Meeting Evaluation

Hello {emp1.name},

Thank you for participating in the coffee meeting with {emp2.name}!

We'd love to hear about your experience. Your feedback helps us improve our networking program and create better matches in the future.

Please take a moment to evaluate your coffee meeting:
{eval1_url}

This link will remain active until you submit your feedback.

Questions? Contact your HR team.

Best regards,
Coffee Meetings Team
"""

    send_mail(
        subject="📝 Evaluate Your Coffee Meeting",
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[emp1.email],
        html_message=html_message,
    )

    # Send email to emp2
    html_message = f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Meeting Evaluation</title>
        <style>
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #2d3748;
                margin: 0;
                padding: 0;
                background-color: #f7fafc;
            }}
            .email-container {{
                max-width: 600px;
                margin: 0 auto;
                background-color: #ffffff;
                border-radius: 12px;
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
                overflow: hidden;
            }}
            .header {{
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white;
                padding: 32px 24px;
                text-align: center;
            }}
            .header h1 {{
                margin: 0;
                font-size: 28px;
                font-weight: 600;
                letter-spacing: -0.025em;
            }}
            .content {{
                padding: 32px 24px;
            }}
            .greeting {{
                font-size: 18px;
                margin-bottom: 24px;
                color: #1a202c;
            }}
            .evaluation-section {{
                background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
                border: 1px solid #9ae6b4;
                border-radius: 12px;
                padding: 24px;
                margin: 24px 0;
                text-align: center;
            }}
            .evaluation-button {{
                display: inline-block;
                background: linear-gradient(135deg, #48bb78 0%, #38a169 100%);
                color: white;
                padding: 14px 28px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                font-size: 16px;
                transition: all 0.2s ease;
                box-shadow: 0 2px 4px rgba(72, 187, 120, 0.2);
            }}
            .evaluation-button:hover {{
                transform: translateY(-1px);
                box-shadow: 0 4px 8px rgba(72, 187, 120, 0.3);
            }}
            .footer {{
                background-color: #f7fafc;
                padding: 24px;
                text-align: center;
                border-top: 1px solid #e2e8f0;
            }}
            .footer p {{
                margin: 8px 0;
                color: #718096;
                font-size: 14px;
            }}
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <h1>📝 Meeting Evaluation</h1>
            </div>
            
            <div class="content">
                <p class="greeting">Hello <strong>{emp2.name}</strong>,</p>
                
                <p>Thank you for participating in the coffee meeting with <strong>{emp1.name}</strong>!</p>
                
                <p>We'd love to hear about your experience. Your feedback helps us improve our networking program and create better matches in the future.</p>
                
                <div class="evaluation-section">
                    <h3>Share Your Experience</h3>
                    <p>Please take a moment to evaluate your coffee meeting:</p>
                    <a href="{eval2_url}" class="evaluation-button">Complete Evaluation</a>
                    <p style="font-size: 12px; margin-top: 12px; color: #4a5568;">
                        This link will remain active until you submit your feedback.
                    </p>
                </div>
            </div>
            
            <div class="footer">
                <p>Questions? Contact your HR team</p>
                <p><strong>Coffee Meetings Team</strong></p>
            </div>
        </div>
    </body>
    </html>
    """

    plain_message = f"""
📝 Meeting Evaluation

Hello {emp2.name},

Thank you for participating in the coffee meeting with {emp1.name}!

We'd love to hear about your experience. Your feedback helps us improve our networking program and create better matches in the future.

Please take a moment to evaluate your coffee meeting:
{eval2_url}

This link will remain active until you submit your feedback.

Questions? Contact your HR team.

Best regards,
Coffee Meetings Team
"""

    send_mail(
        subject="📝 Evaluate Your Coffee Meeting",
        message=plain_message,
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[emp2.email],
        html_message=html_message,
    )
