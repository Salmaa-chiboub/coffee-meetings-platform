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
        """Get all employees in the campaign with optimized query"""
        return list(Employee.objects.filter(campaign_id=self.campaign_id)
                   .select_related('campaign')
                   .prefetch_related('employeeattribute_set'))
    
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
        """Generate final pairs based on matching criteria using maximum matching."""
        import time
        start_time = time.time()

        # Prepare data
        employee_attributes = self._get_employee_attributes(employees)
        compiled_criteria = list(criteria.values('attribute_key', 'rule'))

        # Build compatibility edges (exclude existing pairs)
        compat_edges: List[Tuple[int, int]] = []
        emp_list = list(employees)
        for i in range(len(emp_list)):
            for j in range(i + 1, len(emp_list)):
                e1, e2 = emp_list[i], emp_list[j]
                pair_key = (min(e1.id, e2.id), max(e1.id, e2.id))
                if pair_key in existing_pairs:
                    continue
                if self._pair_matches_criteria_optimized(e1, e2, employee_attributes, compiled_criteria):
                    compat_edges.append((e1.id, e2.id))

        final_pairs = self._maximum_matching_from_edges(emp_list, compat_edges)

        elapsed_time = time.time() - start_time
        logger.info(
            f"Matching (max-cardinality) completed in {elapsed_time:.3f}s for {len(employees)} employees, "
            f"generated {len(final_pairs)} pairs"
        )

        return final_pairs
    
    def _generate_random_pairs(self, employees: List[Employee], existing_pairs: set) -> List[Dict]:
        """Generate pairs without criteria using maximum matching (exclude existing pairs)."""
        import time
        start_time = time.time()

        # All possible edges excluding existing
        compat_edges: List[Tuple[int, int]] = []
        emp_list = list(employees)
        for i in range(len(emp_list)):
            for j in range(i + 1, len(emp_list)):
                e1, e2 = emp_list[i], emp_list[j]
                pair_key = (min(e1.id, e2.id), max(e1.id, e2.id))
                if pair_key not in existing_pairs:
                    compat_edges.append((e1.id, e2.id))

        final_pairs = self._maximum_matching_from_edges(emp_list, compat_edges)

        elapsed_time = time.time() - start_time
        logger.info(
            f"Random pairing (max-cardinality) completed in {elapsed_time:.3f}s for {len(employees)} employees, "
            f"generated {len(final_pairs)} pairs"
        )

        return final_pairs

    def _maximum_matching_from_edges(self, employees: List[Employee], edges: List[Tuple[int, int]]) -> List[Dict]:
        """Find maximum-cardinality matching from a list of compatible edges.

        Uses networkx's max_weight_matching with maxcardinality=True to compute
        an optimal disjoint set of pairs. Falls back to greedy if networkx is unavailable.
        """
        id_to_emp = {e.id: e for e in employees}
        final_pairs: List[Dict] = []

        try:
            import networkx as nx
            G = nx.Graph()
            G.add_nodes_from(id_to_emp.keys())
            G.add_edges_from(edges)
            matching = nx.algorithms.matching.max_weight_matching(G, maxcardinality=True)
            for u, v in matching:
                emp1 = id_to_emp[u]
                emp2 = id_to_emp[v]
                final_pairs.append(self._create_pair_dict(emp1, emp2))
            return final_pairs
        except Exception as e:
            # Fallback: greedy (maintain previous behavior)
            logger.warning(f"networkx unavailable or failed ({e}); falling back to greedy matching")
            used = set()
            for u, v in edges:
                if u in used or v in used:
                    continue
                used.add(u)
                used.add(v)
                final_pairs.append(self._create_pair_dict(id_to_emp[u], id_to_emp[v]))
            return final_pairs
    
    def _get_employee_attributes(self, employees: List[Employee]) -> Dict[int, Dict[str, str]]:
        """Get attributes for all employees with optimized query and caching"""
        # Use prefetched attributes if available
        employee_attributes = {}
        for emp in employees:
            if hasattr(emp, '_prefetched_objects_cache') and 'employeeattribute_set' in emp._prefetched_objects_cache:
                # Use prefetched data (much faster)
                employee_attributes[emp.id] = {
                    attr.attribute_key: attr.attribute_value
                    for attr in emp.employeeattribute_set.all()
                }
            else:
                # Fallback to direct query (less efficient but still works)
                employee_attributes[emp.id] = emp.get_attributes_dict()

        return employee_attributes
    
    def _pair_matches_criteria(self, emp1: Employee, emp2: Employee,
                              employee_attributes: Dict, criteria) -> bool:
        """Check if a pair matches all criteria (legacy method)"""
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

    def _pair_matches_criteria_optimized(self, emp1: Employee, emp2: Employee,
                                       employee_attributes: Dict, compiled_criteria: List[Dict]) -> bool:
        """Optimized criteria matching with pre-compiled criteria"""
        attrs1 = employee_attributes.get(emp1.id, {})
        attrs2 = employee_attributes.get(emp2.id, {})

        # Fast path: if no criteria, all pairs match
        if not compiled_criteria:
            return True

        # Check each criterion efficiently
        for criterion in compiled_criteria:
            key = criterion['attribute_key']
            rule = criterion['rule']
            val1 = attrs1.get(key)
            val2 = attrs2.get(key)

            # Skip if either employee doesn't have this attribute
            if val1 is None or val2 is None:
                continue

            # Fast comparison without string operations
            if rule == 'same':
                if val1 != val2:
                    return False
            elif rule == 'not_same':
                if val1 == val2:
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
            return f"Only {generated} pairs created, less than requested limit of {limit}"
        else:
            return f"{generated} final pairs created successfully"


class EmailNotificationService:
    """Enhanced email notification service for employee pair matching"""
    
    def __init__(self):
        self.from_email = settings.DEFAULT_FROM_EMAIL
    
    def send_pair_notifications(self, pairs: List[EmployeePair]) -> Dict[str, Any]:
        """Send emails in batches to reduce overhead and improve throughput."""
        logger.info(f"🚀 Starting email notifications for {len(pairs)} pairs")
        logger.info(f"📧 From email: {self.from_email}")
        
        results = {
            'total_pairs': len(pairs),
            'emails_sent': 0,
            'emails_failed': 0,
            'failed_pairs': [],
            'success_pairs': []
        }

        if not pairs:
            logger.warning("⚠️ No pairs to send emails to")
            return results

        # Batch size for sending emails
        batch_size = 50
        logger.info(f"📦 Processing emails in batches of {batch_size}")
        
        for batch_start in range(0, len(pairs), batch_size):
            batch = pairs[batch_start: batch_start + batch_size]
            logger.info(f"📤 Processing batch {batch_start//batch_size + 1}: pairs {batch_start+1}-{min(batch_start+batch_size, len(pairs))}")
            
            for pair in batch:
                logger.info(f"📧 Processing pair {pair.id}: {pair.employee1.name} & {pair.employee2.name}")
                try:
                    success = self._send_pair_notification(pair)
                    if success:
                        pair.mark_email_sent()
                        results['emails_sent'] += 1
                        results['success_pairs'].append(pair.id)
                        logger.info(f"✅ Pair {pair.id} emails sent successfully")
                    else:
                        pair.mark_email_failed('Failed to send email')
                        results['emails_failed'] += 1
                        results['failed_pairs'].append({'pair_id': pair.id, 'error': 'Failed to send email'})
                        logger.error(f"❌ Pair {pair.id} email sending failed")
                except Exception as e:
                    logger.error(f"❌ Exception sending email for pair {pair.id}: {str(e)}")
                    pair.mark_email_failed(str(e))
                    results['emails_failed'] += 1
                    results['failed_pairs'].append({'pair_id': pair.id, 'error': str(e)})

        logger.info(f"📊 Email notification summary: {results['emails_sent']} sent, {results['emails_failed']} failed")
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

            # Mark emails as sent if both were successful
            if success1 and success2:
                pair.mark_email_sent()
                logger.info(f"✅ Marked pair {pair.id} as email sent")
            else:
                logger.warning(f"⚠️ Pair {pair.id} emails not fully sent - not marking as sent")

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
            subject = f"☕ Coffee Meeting Match - You're paired with {partner.name}!"

            # Create email content
            html_message = self._create_html_email(email_context)
            plain_message = self._create_plain_email(email_context)

            # Log email details for debugging
            logger.info(f"Attempting to send email to {recipient.email} from {self.from_email}")
            logger.info(f"Email subject: {subject}")
            logger.info(f"Recipient: {recipient.name} ({recipient.email})")
            logger.info(f"Partner: {partner.name} ({partner.email})")

            # Send email
            send_mail(
                subject=subject,
                message=plain_message,
                from_email=self.from_email,
                recipient_list=[recipient.email],
                html_message=html_message,
                fail_silently=False,
            )

            logger.info(f"✅ Email sent successfully to {recipient.email}")
            return True

        except Exception as e:
            logger.error(f"❌ Failed to send email to {recipient.email}: {str(e)}")
            logger.error(f"Error type: {type(e).__name__}")
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return False

    def _create_html_email(self, context: Dict[str, Any]) -> str:
        """Create modern, professional HTML email content"""
        campaign = context['campaign']
        evaluation_token = context.get('evaluation_token')

        # Create evaluation URL if token exists
        evaluation_url = ""
        if evaluation_token:
            base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            evaluation_url = f"{base_url}/evaluation/{evaluation_token}"

        # Format campaign dates
        start_date = campaign.start_date.strftime('%B %d') if campaign.start_date else 'TBD'
        end_date = campaign.end_date.strftime('%B %d, %Y') if campaign.end_date else 'TBD'

        return f"""
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Coffee Meeting Match</title>
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
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                .header .subtitle {{
                    margin: 8px 0 0 0;
                    font-size: 16px;
                    opacity: 0.9;
                    font-weight: 400;
                }}
                .content {{
                    padding: 32px 24px;
                }}
                .greeting {{
                    font-size: 18px;
                    margin-bottom: 24px;
                    color: #1a202c;
                }}
                .partner-card {{
                    background: linear-gradient(135deg, #f7fafc 0%, #edf2f7 100%);
                    border: 1px solid #e2e8f0;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 24px 0;
                    text-align: center;
                }}
                .partner-card h3 {{
                    margin: 0 0 16px 0;
                    color: #2d3748;
                    font-size: 16px;
                    font-weight: 500;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }}
                .partner-name {{
                    font-size: 24px;
                    font-weight: 600;
                    color: #1a202c;
                    margin: 8px 0;
                }}
                .partner-email {{
                    color: #3182ce;
                    text-decoration: none;
                    font-weight: 500;
                }}
                .partner-email:hover {{
                    text-decoration: underline;
                }}
                .action-section {{
                    background-color: #fff5f5;
                    border-left: 4px solid #f56565;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 24px 0;
                }}
                .action-section h3 {{
                    margin: 0 0 16px 0;
                    color: #c53030;
                    font-size: 16px;
                    font-weight: 600;
                }}
                .action-steps {{
                    margin: 0;
                    padding-left: 20px;
                }}
                .action-steps li {{
                    margin-bottom: 8px;
                    color: #742a2a;
                }}
                .evaluation-section {{
                    background: linear-gradient(135deg, #f0fff4 0%, #e6fffa 100%);
                    border: 1px solid #9ae6b4;
                    border-radius: 12px;
                    padding: 24px;
                    margin: 24px 0;
                    text-align: center;
                }}
                .evaluation-section h3 {{
                    margin: 0 0 16px 0;
                    color: #22543d;
                    font-size: 16px;
                    font-weight: 600;
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
                .campaign-info {{
                    background-color: #edf2f7;
                    border-radius: 8px;
                    padding: 16px;
                    margin: 16px 0;
                    text-align: center;
                }}
                .campaign-info p {{
                    margin: 4px 0;
                    color: #4a5568;
                    font-size: 14px;
                }}
                @media only screen and (max-width: 600px) {{
                    .email-container {{
                        margin: 0;
                        border-radius: 0;
                    }}
                    .content, .header, .footer {{
                        padding: 20px 16px;
                    }}
                    .header h1 {{
                        font-size: 24px;
                    }}
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="header">
                    <h1>☕ Coffee Meeting Match</h1>
                    <p class="subtitle">You've been paired for a coffee meeting!</p>
                </div>

                <div class="content">
                    <p class="greeting">Hello <strong>{context['recipient'].name}</strong>,</p>
                    
                    <p>Great news! You've been matched for a coffee meeting in our networking campaign.</p>
                    
                    <div class="campaign-info">
                        <p><strong>Campaign:</strong> {campaign.title}</p>
                        <p><strong>Period:</strong> {start_date} - {end_date}</p>
                    </div>
                    
                    <div class="partner-card">
                        <h3>Your Coffee Partner</h3>
                        <div class="partner-name">{context['partner'].name}</div>
                        <a href="mailto:{context['partner'].email}" class="partner-email">{context['partner'].email}</a>
                    </div>
                    
                    <div class="action-section">
                        <h3>🎯 Next Steps</h3>
                        <ol class="action-steps">
                            <li><strong>Reach out</strong> to your partner within 48 hours</li>
                            <li><strong>Schedule</strong> a meeting at a convenient time</li>
                            <li><strong>Meet up</strong> for coffee and conversation</li>
                    </ol>
                </div>

                {f'''
                    <div class="evaluation-section">
                        <h3>📝 Share Your Feedback</h3>
                        <p>After your meeting, please take a moment to share your experience:</p>
                        <a href="{evaluation_url}" class="evaluation-button">Evaluate Meeting</a>
                        <p style="font-size: 12px; margin-top: 12px; color: #4a5568;">
                        This link will remain active until you submit your feedback.
                    </p>
                </div>
                ''' if evaluation_token else ''}
                </div>
                
                <div class="footer">
                    <p>Questions? Contact your HR team</p>
                    <p><strong>Coffee Meetings Team</strong></p>
                </div>
            </div>
        </body>
        </html>
        """

    def _create_plain_email(self, context: Dict[str, Any]) -> str:
        """Create clean, professional plain text email content"""
        campaign = context['campaign']
        evaluation_token = context.get('evaluation_token')

        # Create evaluation URL if token exists
        evaluation_section = ""
        if evaluation_token:
            base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            evaluation_url = f"{base_url}/evaluation/{evaluation_token}"
            evaluation_section = f"""

📝 AFTER YOUR MEETING:
Please share your feedback about this coffee meeting:
{evaluation_url}

This link will remain active until you submit your feedback.
"""

        # Format campaign dates
        start_date = campaign.start_date.strftime('%B %d') if campaign.start_date else 'TBD'
        end_date = campaign.end_date.strftime('%B %d, %Y') if campaign.end_date else 'TBD'

        return f"""
☕ Coffee Meeting Match

Hello {context['recipient'].name},

Great news! You've been matched for a coffee meeting in our networking campaign.

CAMPAIGN DETAILS:
Campaign: {campaign.title}
Period: {start_date} - {end_date}

YOUR COFFEE PARTNER:
{context['partner'].name}
Email: {context['partner'].email}

🎯 NEXT STEPS:
1. Reach out to your partner within 48 hours
2. Schedule a meeting at a convenient time
3. Meet up for coffee and conversation{evaluation_section}

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
