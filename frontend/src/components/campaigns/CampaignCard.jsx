import React, { useMemo, useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, UserGroupIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline';
import CampaignCardMenu from './CampaignCardMenu';

const CampaignCard = React.memo(({ campaign, onClick, onDelete }) => {
  const navigate = useNavigate();
  const [campaignStatus, setCampaignStatus] = useState({ isCompleted: false, isLoading: true });

  // Check campaign workflow status
  useEffect(() => {
    const checkCampaignStatus = async () => {
      try {
        const { workflowService } = await import('../../services/workflowService');
        const workflowData = await workflowService.getCampaignWorkflowStatus(campaign.id);

        // Campaign is completed if all 5 steps are completed
        const isCompleted = workflowData.completed_steps.includes(1) &&
                           workflowData.completed_steps.includes(2) &&
                           workflowData.completed_steps.includes(3) &&
                           workflowData.completed_steps.includes(4) &&
                           workflowData.completed_steps.includes(5);

        setCampaignStatus({ isCompleted, isLoading: false });
      } catch (error) {
        console.error('Error checking campaign status:', error);
        setCampaignStatus({ isCompleted: false, isLoading: false });
      }
    };

    checkCampaignStatus();
  }, [campaign.id]);

  // Memoize expensive date formatting
  const formattedDates = useMemo(() => {
    const formatDate = (dateString) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
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
      navigate(`/campaigns/${campaign.id}/workflow`);
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
              {campaignStatus.isCompleted ? 'Completed' : 'Active'}
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
        {campaign.description || 'No description provided'}
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
