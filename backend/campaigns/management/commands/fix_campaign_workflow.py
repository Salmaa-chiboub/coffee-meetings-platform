from django.core.management.base import BaseCommand
from django.utils import timezone
from campaigns.models import Campaign, CampaignWorkflowState
from matching.models import EmployeePair


class Command(BaseCommand):
    help = 'Fix campaign workflow states for existing campaigns'

    def handle(self, *args, **options):
        # First, create workflow states for campaigns without them
        campaigns_without_workflow = Campaign.objects.filter(workflow_state__isnull=True)

        self.stdout.write(f"Found {campaigns_without_workflow.count()} campaigns without workflow state")

        for campaign in campaigns_without_workflow:
            workflow_state = CampaignWorkflowState.objects.create(
                campaign=campaign,
                current_step=2,  # Assume they're at least at step 2 (campaign created)
                completed_steps=[1],  # Step 1 (create campaign) is completed
                step_data={}
            )
            self.stdout.write(f"Created workflow state for campaign: {campaign.title}")

        # Now, check campaigns that should be completed and mark them as such
        all_campaigns = Campaign.objects.select_related('workflow_state').all()

        for campaign in all_campaigns:
            # Check if campaign has ended and has employee pairs (indicating it was executed)
            has_pairs = EmployeePair.objects.filter(campaign=campaign).exists()
            has_ended = campaign.end_date < timezone.now().date()

            if has_pairs and has_ended:
                # This campaign should be marked as completed (step 5)
                workflow = campaign.workflow_state
                if 5 not in workflow.completed_steps:
                    workflow.completed_steps = [1, 2, 3, 4, 5]  # Mark all steps as completed
                    workflow.current_step = 5
                    workflow.save()
                    self.stdout.write(f"Marked campaign as completed: {campaign.title}")

        self.stdout.write(self.style.SUCCESS('Successfully fixed campaign workflow states'))
