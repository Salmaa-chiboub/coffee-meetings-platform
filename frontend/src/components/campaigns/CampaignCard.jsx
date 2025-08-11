import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import CampaignCardMenu from './CampaignCardMenu';

const CampaignCard = React.memo(({ campaign, onClick, onDelete }) => {
  const navigate = useNavigate();
  // Derive status from data provided by parent to avoid N+1 requests
  const campaignStatus = useMemo(() => {
    const steps = campaign?.workflow_status?.completed_steps || [];
    const isCompletedFromWorkflow = [1, 2, 3, 4, 5].every((s) => steps.includes(s));
    const isCompleted = typeof campaign?.isCompleted === 'boolean'
      ? campaign.isCompleted
      : isCompletedFromWorkflow;
    return { isCompleted, isLoading: false };
  }, [campaign]);

  // Memoize expensive date formatting
  const formattedDates = useMemo(() => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    };

    return {
      startDate: formatDate(campaign.start_date),
      endDate: formatDate(campaign.end_date)
    };
  }, [campaign.start_date, campaign.end_date]);

  // Memoize click handler
  const handleCardClick = useCallback(() => {
    // Use the onClick prop passed from parent (Campaigns.jsx) which has proper routing logic
    if (onClick) {
      onClick(campaign);
    } else {
      // Fallback to workflow page if no onClick handler provided
      navigate(`/app/campaigns/${campaign.id}/workflow`);
    }
  }, [onClick, campaign, navigate]);

  return (
    <div
      onClick={handleCardClick}
      className="bg-white border border-warmGray-200 rounded-xl p-5 cursor-pointer hover:shadow-lg transition-shadow duration-200"
    >
      {/* Header with Title, Status and Menu */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-warmGray-800">
          {campaign.title}
        </h3>
        <div className="flex items-center space-x-2">
          {campaignStatus.isLoading ? (
            <div className="w-2 h-2 bg-warmGray-300 rounded-full"></div>
          ) : (
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              campaignStatus.isCompleted
                ? 'bg-green-100 text-green-700'
                : 'bg-orange-100 text-orange-700'
            }`}>
              {campaignStatus.isCompleted ? 'Terminée' : 'Active'}
            </span>
          )}
          <CampaignCardMenu
            campaign={campaign}
            isCompleted={campaignStatus.isCompleted}
            onDelete={onDelete}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-warmGray-600 text-sm mb-4 line-clamp-2">
        {campaign.description || 'Aucune description fournie'}
      </p>

      {/* Simple Info */}
      <div className="space-y-3">
        <div className="flex items-center text-sm text-warmGray-600">
          <CalendarDaysIcon className="w-4 h-4 mr-2" />
          <span>{formattedDates.startDate} - {formattedDates.endDate}</span>
        </div>

        <div className="flex items-center text-sm text-warmGray-600">
          <UserGroupIcon className="w-4 h-4 mr-2" />
          <span>{campaign.employee_count || campaign.employees_count || 0} participants</span>
        </div>
      </div>
    </div>
  );
});

export default CampaignCard;
