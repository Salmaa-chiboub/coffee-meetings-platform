from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.core.cache import cache

from .models import Campaign, CampaignWorkflowState


def _invalidate_campaigns_with_workflow_cache_for_user(user_id: int):
    # Brutal but safe: remove all cached pages for this user
    # Requires django-redis for delete_pattern; fallback to clear user-specific keys if available
    try:
        cache.delete_pattern(f"campaigns_with_workflow:{user_id}:*")
    except Exception:
        # If delete_pattern isn't available, iterate a small set of common pages
        for page in range(1, 6):
            for page_size in (10, 20, 50, 100):
                cache.delete(f"campaigns_with_workflow:{user_id}:{page}:{page_size}:")
    # bump SSE version key
    version_key = f"workflow_version:{user_id}"
    try:
        current = cache.get(version_key, 0)
        cache.set(version_key, current + 1, timeout=3600)
    except Exception:
        pass


@receiver(post_save, sender=Campaign)
def on_campaign_saved(sender, instance: Campaign, created, **kwargs):
    # Invalidate cache for this HR manager
    if instance.hr_manager_id:
        _invalidate_campaigns_with_workflow_cache_for_user(instance.hr_manager_id)


@receiver(post_delete, sender=Campaign)
def on_campaign_deleted(sender, instance: Campaign, **kwargs):
    if instance.hr_manager_id:
        _invalidate_campaigns_with_workflow_cache_for_user(instance.hr_manager_id)


@receiver(post_save, sender=CampaignWorkflowState)
def on_workflow_state_changed(sender, instance: CampaignWorkflowState, **kwargs):
    # Invalidate for the owning HR manager when workflow changes
    campaign = getattr(instance, 'campaign', None)
    if campaign and campaign.hr_manager_id:
        _invalidate_campaigns_with_workflow_cache_for_user(campaign.hr_manager_id)


