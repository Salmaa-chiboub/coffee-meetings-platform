"""
Enhanced services for employee pair matching and email notifications
"""
import logging
from typing import List, Dict, Any, Tuple, Optional
from itertools import combinations
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.utils import timezone
from django.db import transaction
from django.db.models import Q

from .models import EmployeePair, CampaignMatchingCriteria
from employees.models import Employee, EmployeeAttribute
from campaigns.models import Campaign

logger = logging.getLogger(__name__)


class MatchingAlgorithmService:
    """
    Enhanced matching algorithm service with strict criteria compliance
    and duplicate prevention
    """
    
    def __init__(self, campaign_id: int):
        self.campaign_id = campaign_id
        try:
            self.campaign = Campaign.objects.get(id=campaign_id)
        except Campaign.DoesNotExist:
            raise ValueError(f"Campaign with ID {campaign_id} does not exist")
    
    def generate_pairs(self, limit: Optional[int] = None, created_by: str = '') -> Dict[str, Any]:
        """
        Generate employee pairs based on saved criteria with strict duplicate prevention
        
        Args:
            limit: Maximum number of pairs to generate (optional)
            created_by: Identifier of the user creating pairs
            
        Returns:
            Dict with generated pairs and metadata
        """
        # Get matching criteria
        criteria = CampaignMatchingCriteria.objects.filter(campaign_id=self.campaign_id)
        
        # Get employees in campaign
        employees = self._get_campaign_employees()
        
        if len(employees) < 2:
            return {
                'success': False,
                'error': 'Not enough employees to generate pairs (minimum 2 required)',
                'pairs': [],
                'total_possible': 0,
                'total_generated': 0
            }
        
        # Get existing pairs to avoid duplicates
        existing_pairs = self._get_existing_pairs()
        
        # Generate pairs based on criteria
        if criteria.exists():
            valid_pairs = self._generate_with_criteria(employees, criteria, existing_pairs)
        else:
            valid_pairs = self._generate_random_pairs(employees, existing_pairs)
        
        # Apply limit if specified
        if limit and len(valid_pairs) > limit:
            valid_pairs = valid_pairs[:limit]
        
        # Prepare response
        total_possible = self._calculate_total_possible_pairs(employees, existing_pairs)
        
        return {
            'success': True,
            'pairs': valid_pairs,
            'total_possible': total_possible,
            'total_generated': len(valid_pairs),
            'criteria_used': list(criteria.values('attribute_key', 'rule')),
            'existing_pairs_count': len(existing_pairs),
            'message': self._generate_status_message(len(valid_pairs), total_possible, limit)
        }
    
    def _get_campaign_employees(self) -> List[Employee]:
        """Get all employees in the campaign"""
        return list(Employee.objects.filter(
            id__in=EmployeeAttribute.objects.filter(campaign_id=self.campaign_id)
            .values_list('employee_id', flat=True)
            .distinct()
        ))
    
    def _get_existing_pairs(self) -> set:
        """Get existing pairs as a set of tuples for fast lookup"""
        existing = EmployeePair.objects.filter(campaign_id=self.campaign_id).values_list(
            'employee1_id', 'employee2_id'
        )
        # Create set with both directions to prevent duplicates
        pairs_set = set()
        for emp1_id, emp2_id in existing:
            pairs_set.add((min(emp1_id, emp2_id), max(emp1_id, emp2_id)))
        return pairs_set
    
    def _generate_with_criteria(self, employees: List[Employee], criteria, existing_pairs: set) -> List[Dict]:
        """Generate pairs based on matching criteria"""
        # Get employee attributes
        employee_attributes = self._get_employee_attributes(employees)
        
        valid_pairs = []
        
        for emp1, emp2 in combinations(employees, 2):
            # Skip if pair already exists
            pair_key = (min(emp1.id, emp2.id), max(emp1.id, emp2.id))
            if pair_key in existing_pairs:
                continue
            
            # Check if pair matches all criteria
            if self._pair_matches_criteria(emp1, emp2, employee_attributes, criteria):
                valid_pairs.append(self._create_pair_dict(emp1, emp2))
        
        return valid_pairs
    
    def _generate_random_pairs(self, employees: List[Employee], existing_pairs: set) -> List[Dict]:
        """Generate random pairs when no criteria are defined"""
        from random import shuffle
        
        employees_list = employees.copy()
        shuffle(employees_list)
        
        valid_pairs = []
        used_employees = set()
        
        for i in range(len(employees_list)):
            if employees_list[i].id in used_employees:
                continue
                
            for j in range(i + 1, len(employees_list)):
                if employees_list[j].id in used_employees:
                    continue
                
                emp1, emp2 = employees_list[i], employees_list[j]
                pair_key = (min(emp1.id, emp2.id), max(emp1.id, emp2.id))
                
                if pair_key not in existing_pairs:
                    valid_pairs.append(self._create_pair_dict(emp1, emp2))
                    used_employees.add(emp1.id)
                    used_employees.add(emp2.id)
                    break
        
        return valid_pairs
    
    def _get_employee_attributes(self, employees: List[Employee]) -> Dict[int, Dict[str, str]]:
        """Get attributes for all employees as a nested dictionary"""
        employee_attributes = {}
        for emp in employees:
            employee_attributes[emp.id] = {
                attr.attribute_key: attr.attribute_value
                for attr in EmployeeAttribute.objects.filter(
                    employee=emp, campaign_id=self.campaign_id
                )
            }
        return employee_attributes
    
    def _pair_matches_criteria(self, emp1: Employee, emp2: Employee, 
                              employee_attributes: Dict, criteria) -> bool:
        """Check if a pair matches all criteria"""
        attrs1 = employee_attributes.get(emp1.id, {})
        attrs2 = employee_attributes.get(emp2.id, {})
        
        for criterion in criteria:
            key = criterion.attribute_key
            rule = criterion.rule
            val1 = attrs1.get(key)
            val2 = attrs2.get(key)
            
            # Skip if either employee doesn't have this attribute
            if val1 is None or val2 is None:
                continue
            
            if rule == 'same' and val1 != val2:
                return False
            elif rule == 'not_same' and val1 == val2:
                return False
        
        return True
    
    def _create_pair_dict(self, emp1: Employee, emp2: Employee) -> Dict:
        """Create a pair dictionary for API response"""
        return {
            'employee_1': {
                'id': emp1.id,
                'name': emp1.name,
                'email': emp1.email
            },
            'employee_2': {
                'id': emp2.id,
                'name': emp2.name,
                'email': emp2.email
            }
        }
    
    def _calculate_total_possible_pairs(self, employees: List[Employee], existing_pairs: set) -> int:
        """Calculate total possible pairs excluding existing ones"""
        total_combinations = len(employees) * (len(employees) - 1) // 2
        return total_combinations - len(existing_pairs)
    
    def _generate_status_message(self, generated: int, total_possible: int, limit: Optional[int]) -> str:
        """Generate status message for the response"""
        if generated == 0:
            return "No valid pairs could be generated with the current criteria"
        elif limit and generated < limit:
            return f"Only {generated} valid pairs found, less than requested limit of {limit}"
        elif generated == total_possible:
            return f"All {generated} possible pairs generated"
        else:
            return f"{generated} pairs generated successfully"


class EmailNotificationService:
    """Enhanced email notification service for employee pair matching"""
    
    def __init__(self):
        self.from_email = settings.DEFAULT_FROM_EMAIL
    
    def send_pair_notifications(self, pairs: List[EmployeePair]) -> Dict[str, Any]:
        """
        Send email notifications to a list of employee pairs
        
        Args:
            pairs: List of EmployeePair objects
            
        Returns:
            Dict with success/failure statistics
        """
        results = {
            'total_pairs': len(pairs),
            'emails_sent': 0,
            'emails_failed': 0,
            'failed_pairs': [],
            'success_pairs': []
        }
        
        for pair in pairs:
            try:
                success = self._send_pair_notification(pair)
                if success:
                    pair.mark_email_sent()
                    results['emails_sent'] += 1
                    results['success_pairs'].append(pair.id)
                else:
                    pair.mark_email_failed('Failed to send email')
                    results['emails_failed'] += 1
                    results['failed_pairs'].append({
                        'pair_id': pair.id,
                        'error': 'Failed to send email'
                    })
            except Exception as e:
                logger.error(f"Failed to send email for pair {pair.id}: {str(e)}")
                pair.mark_email_failed(str(e))
                results['emails_failed'] += 1
                results['failed_pairs'].append({
                    'pair_id': pair.id,
                    'error': str(e)
                })
        
        return results

    def _send_pair_notification(self, pair: EmployeePair) -> bool:
        """
        Send email notification to a single employee pair with evaluation links

        Args:
            pair: EmployeePair object

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Create evaluation tokens for both employees
            evaluation_tokens = self._create_evaluation_tokens(pair)

            # Prepare email context
            context = {
                'employee1': pair.employee1,
                'employee2': pair.employee2,
                'campaign': pair.campaign,
                'pair_id': pair.id,
                'evaluation_tokens': evaluation_tokens
            }

            # Send email to employee 1
            success1 = self._send_individual_email(
                recipient=pair.employee1,
                partner=pair.employee2,
                context=context,
                evaluation_token=evaluation_tokens.get(pair.employee1.id)
            )

            # Send email to employee 2
            success2 = self._send_individual_email(
                recipient=pair.employee2,
                partner=pair.employee1,
                context=context,
                evaluation_token=evaluation_tokens.get(pair.employee2.id)
            )

            return success1 and success2

        except Exception as e:
            logger.error(f"Error sending pair notification for pair {pair.id}: {str(e)}")
            return False

    def _create_evaluation_tokens(self, pair: EmployeePair) -> dict:
        """
        Create evaluation records with tokens for both employees in the pair

        Args:
            pair: EmployeePair object

        Returns:
            dict: Mapping of employee_id to evaluation token
        """
        try:
            from evaluations.models import Evaluation
            import uuid

            tokens = {}

            # Create evaluation for employee1
            eval1, created1 = Evaluation.objects.get_or_create(
                employee=pair.employee1,
                employee_pair=pair,
                defaults={'token': uuid.uuid4(), 'used': False}
            )
            tokens[pair.employee1.id] = eval1.token

            # Create evaluation for employee2
            eval2, created2 = Evaluation.objects.get_or_create(
                employee=pair.employee2,
                employee_pair=pair,
                defaults={'token': uuid.uuid4(), 'used': False}
            )
            tokens[pair.employee2.id] = eval2.token

            if created1:
                logger.info(f"Created evaluation token for {pair.employee1.name}")
            if created2:
                logger.info(f"Created evaluation token for {pair.employee2.name}")

            return tokens

        except Exception as e:
            logger.error(f"Error creating evaluation tokens for pair {pair.id}: {str(e)}")
            return {}

    def _send_individual_email(self, recipient, partner, context: Dict[str, Any], evaluation_token=None) -> bool:
        """
        Send email to an individual employee with evaluation link

        Args:
            recipient: Employee receiving the email
            partner: Employee they are matched with
            context: Email template context
            evaluation_token: UUID token for evaluation

        Returns:
            bool: True if email was sent successfully, False otherwise
        """
        try:
            # Update context for this specific recipient
            email_context = {
                **context,
                'recipient': recipient,
                'partner': partner,
                'evaluation_token': evaluation_token
            }

            # Email subject
            subject = f"Coffee Meeting Match - You've been paired with {partner.name}!"

            # Create email content
            html_message = self._create_html_email(email_context)
            plain_message = self._create_plain_email(email_context)

            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=self.from_email,
                recipient_list=[recipient.email],
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(f"Email sent successfully to {recipient.email}")
            return True

        except Exception as e:
            logger.error(f"Failed to send email to {recipient.email}: {str(e)}")
            return False

    def _create_html_email(self, context: Dict[str, Any]) -> str:
        """Create HTML email content with evaluation link"""
        campaign = context['campaign']
        evaluation_token = context.get('evaluation_token')

        # Create evaluation URL if token exists
        evaluation_url = ""
        if evaluation_token:
            base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            evaluation_url = f"{base_url}/evaluate/{evaluation_token}"

        return f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">
                    ☕ Coffee Meeting Match
                </h2>

                <p>Hello <strong>{context['recipient'].name}</strong>,</p>

                <p>You've been matched for a coffee meeting in the <strong>{campaign.title}</strong> campaign
                ({campaign.start_date.strftime('%B %d')} - {campaign.end_date.strftime('%B %d, %Y')}).</p>

                <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
                    <h3 style="color: #2c3e50; margin: 0 0 10px 0;">Your Coffee Partner</h3>
                    <p style="font-size: 18px; margin: 5px 0;"><strong>{context['partner'].name}</strong></p>
                    <p style="margin: 5px 0;">📧 <a href="mailto:{context['partner'].email}">{context['partner'].email}</a></p>
                </div>

                <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
                    <h3 style="color: #856404; margin: 0 0 10px 0;">🎯 Action Required</h3>
                    <ol style="margin: 0; padding-left: 20px;">
                        <li><strong>Contact your partner</strong> via email within 48 hours</li>
                        <li><strong>Schedule your meeting</strong> for a mutually convenient time</li>
                        <li><strong>Meet and connect</strong> - office café, coffee shop, or virtual</li>
                    </ol>
                </div>

                {f'''
                <div style="background-color: #e8f5e8; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
                    <h3 style="color: #155724; margin: 0 0 10px 0;">📝 After Your Meeting</h3>
                    <p style="margin: 5px 0;">Please share your feedback about this coffee meeting:</p>
                    <p style="margin: 10px 0;">
                        <a href="{evaluation_url}"
                           style="background-color: #28a745; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            📝 Evaluate Your Meeting
                        </a>
                    </p>
                    <p style="font-size: 12px; color: #666; margin: 5px 0;">
                        This link will remain active until you submit your feedback.
                    </p>
                </div>
                ''' if evaluation_token else ''}

                <p style="margin: 20px 0 10px 0; font-size: 14px; color: #666;">
                    Questions? Contact your HR team.
                </p>

                <p style="margin-top: 20px; font-size: 14px;">
                    Best regards,<br>
                    <strong>Coffee Meetings Team</strong>
                </p>
            </div>
        </body>
        </html>
        """

    def _create_plain_email(self, context: Dict[str, Any]) -> str:
        """Create plain text email content with evaluation link"""
        campaign = context['campaign']
        evaluation_token = context.get('evaluation_token')

        # Create evaluation URL if token exists
        evaluation_section = ""
        if evaluation_token:
            base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            evaluation_url = f"{base_url}/evaluate/{evaluation_token}"
            evaluation_section = f"""

📝 AFTER YOUR MEETING:
Please share your feedback about this coffee meeting:
{evaluation_url}

This link will remain active until you submit your feedback.
"""

        return f"""
☕ Coffee Meeting Match

Hello {context['recipient'].name},

You've been matched for a coffee meeting in the {campaign.title} campaign
({campaign.start_date.strftime('%B %d')} - {campaign.end_date.strftime('%B %d, %Y')}).

YOUR COFFEE PARTNER:
{context['partner'].name}
Email: {context['partner'].email}

🎯 ACTION REQUIRED:
1. Contact your partner via email within 48 hours
2. Schedule your meeting for a mutually convenient time
3. Meet and connect - office café, coffee shop, or virtual{evaluation_section}

Questions? Contact your HR team.

Best regards,
Coffee Meetings Team
        """

    def get_email_status_summary(self, campaign_id: int) -> Dict[str, Any]:
        """
        Get email status summary for a campaign

        Args:
            campaign_id: Campaign ID

        Returns:
            Dict with email status statistics
        """
        pairs = EmployeePair.objects.filter(campaign_id=campaign_id)

        total_pairs = pairs.count()
        sent_count = pairs.filter(email_status='sent').count()
        pending_count = pairs.filter(email_status='pending').count()
        failed_count = pairs.filter(email_status='failed').count()
        bounced_count = pairs.filter(email_status='bounced').count()

        return {
            'total_pairs': total_pairs,
            'emails_sent': sent_count,
            'emails_pending': pending_count,
            'emails_failed': failed_count,
            'emails_bounced': bounced_count,
            'success_rate': (sent_count / total_pairs * 100) if total_pairs > 0 else 0
        }
