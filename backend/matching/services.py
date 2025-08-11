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

        batch_size = getattr(settings, 'EMAIL_BATCH_SIZE', 50)
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
        """Send email notification to a single employee pair with evaluation links"""
        try:
            evaluation_tokens = self._create_evaluation_tokens(pair)

            context = {
                'employee1': pair.employee1,
                'employee2': pair.employee2,
                'campaign': pair.campaign,
                'pair_id': pair.id,
                'evaluation_tokens': evaluation_tokens
            }

            success1 = self._send_individual_email(
                recipient=pair.employee1,
                partner=pair.employee2,
                context=context,
                evaluation_token=evaluation_tokens.get(pair.employee1.id)
            )

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
        """Create evaluation records with tokens for both employees in the pair"""
        try:
            from evaluations.models import Evaluation
            import uuid

            tokens = {}
            eval1, _ = Evaluation.objects.get_or_create(
                employee=pair.employee1,
                employee_pair=pair,
                defaults={'token': str(uuid.uuid4()), 'used': False}
            )
            tokens[pair.employee1.id] = eval1.token

            eval2, _ = Evaluation.objects.get_or_create(
                employee=pair.employee2,
                employee_pair=pair,
                defaults={'token': str(uuid.uuid4()), 'used': False}
            )
            tokens[pair.employee2.id] = eval2.token

            return tokens

        except Exception as e:
            logger.error(f"Error creating evaluation tokens for pair {pair.id}: {str(e)}")
            return {}

    def _send_individual_email(self, recipient, partner, context: Dict[str, Any], evaluation_token=None) -> bool:
        """Send email to an individual employee with evaluation link"""
        try:
            email_context = {
                **context,
                'recipient': recipient,
                'partner': partner,
                'evaluation_token': evaluation_token
            }

            subject = f"☕ Coffee Meeting Match - You're paired with {partner.name}!"
            html_message = self._create_html_email(email_context)
            plain_message = self._create_plain_email(email_context)

            logger.info(f"Attempting to send email to {recipient.email} from {self.from_email}")
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
            import traceback
            logger.error(f"Full traceback: {traceback.format_exc()}")
            return False

    def _format_email_common_data(self, context: Dict[str, Any]) -> Tuple[str, str, str]:
        """Return (start_date, end_date, evaluation_url) for emails"""
        campaign = context['campaign']
        start_date = campaign.start_date.strftime('%B %d') if campaign.start_date else 'TBD'
        end_date = campaign.end_date.strftime('%B %d, %Y') if campaign.end_date else 'TBD'
        evaluation_url = ""
        if context.get('evaluation_token'):
            base_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
            evaluation_url = f"{base_url}/evaluation/{context['evaluation_token']}"
        return start_date, end_date, evaluation_url

    def _create_html_email(self, context: Dict[str, Any]) -> str:
        """Créer un contenu HTML professionnel pour l'email"""
        start_date, end_date, evaluation_url = self._format_email_common_data(context)

        bouton_html = f"""
            <p style="text-align: center;">
                <a href="{evaluation_url}" class="button">Accéder au formulaire d'évaluation</a>
            </p>
        """ if evaluation_url else ""

        return f"""
        <!DOCTYPE html>
        <html lang="fr">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Coffee Meeting - Nouvelle rencontre</title>
            <style>
                body {{
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333333;
                    margin: 0;
                    padding: 20px;
                    background-color: #ffffff;
                }}
                .email-container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #ffffff;
                    padding: 30px;
                    border: 1px solid #ddd;
                    border-radius: 5px;
                }}
                .content {{
                    margin: 20px 0;
                }}
                .button {{
                    display: inline-block;
                    padding: 12px 25px;
                    background-color: #007bff;
                    color: white;
                    text-decoration: none;
                    border-radius: 4px;
                    font-size: 16px;
                }}
                .footer {{
                    margin-top: 30px;
                    font-size: 14px;
                    color: #666;
                    border-top: 1px solid #ddd;
                    padding-top: 15px;
                }}
            </style>
        </head>
        <body>
            <div class="email-container">
                <div class="content">
                    <p>Bonjour {context['recipient'].name},</p>

                    <p>L’équipe <strong>Coffee Meetings</strong> a le plaisir de vous informer qu’une nouvelle rencontre a été organisée dans le cadre de notre programme.</p>

                    <p>Vous aurez l’occasion de rencontrer <strong>{context['partner'].name}</strong> ({context['partner'].email}).</p>

                    <p>Cette rencontre est à organiser entre le <strong>{start_date}</strong> et le <strong>{end_date}</strong>. Nous vous invitons à convenir ensemble d’une date et d’un lieu afin de partager un moment convivial autour d’un café.</p>

                    <p>À l’issue de votre rencontre, nous vous prions de bien vouloir partager votre expérience via le formulaire d’évaluation accessible ci-dessous :</p>

                    {bouton_html}

                    <p>Nous vous souhaitons une agréable expérience et espérons que cette rencontre sera enrichissante.</p>
                </div>

                <div class="footer">
                    <p>Cordialement,<br>
                    L’équipe Coffee Meetings</p>
                    <p>Contacter nous sur :
                    <a href="mailto:cffmeet.info@gmail.com">cffmeet.info@gmail.com</a></p>
                </div>
            </div>
        </body>
        </html>
        """

    def _create_plain_email(self, context: Dict[str, Any]) -> str:
        """Create clean, professional plain text email content"""
        start_date, end_date, evaluation_url = self._format_email_common_data(context)
        evaluation_section = ""
        if evaluation_url:
            evaluation_section = f"""

📝 APRÈS VOTRE RENCONTRE :
Merci de partager votre retour sur cette rencontre café :
{evaluation_url}
"""
        return f"""
☕ Coffee Meeting - Nouvelle rencontre

Bonjour {context['recipient'].name},

Nous espérons que ce message vous trouve bien. Vous allez rencontrer {context['partner'].name} ({context['partner'].email}).
Période : {start_date} - {end_date}

🎯 PROCHAINES ÉTAPES :
1. Contactez votre partenaire dans les 48 heures
2. Planifiez une rencontre
3. Rencontrez-vous autour d'un café{evaluation_section}

Pour toute question, contactez votre équipe RH.

Cordialement,
L'équipe Coffee Meetings
        """

    def get_email_status_summary(self, campaign_id: int) -> Dict[str, Any]:
        """Get email status summary for a campaign"""
        from django.db.models import Count, Q
        pairs = EmployeePair.objects.filter(campaign_id=campaign_id)
        stats = pairs.aggregate(
            sent=Count('id', filter=Q(email_status='sent')),
            pending=Count('id', filter=Q(email_status='pending')),
            failed=Count('id', filter=Q(email_status='failed')),
            bounced=Count('id', filter=Q(email_status='bounced'))
        )
        total = pairs.count()
        return {
            'total_pairs': total,
            'emails_sent': stats['sent'],
            'emails_pending': stats['pending'],
            'emails_failed': stats['failed'],
            'emails_bounced': stats['bounced'],
            'success_rate': (stats['sent'] / total * 100) if total > 0 else 0
        }

