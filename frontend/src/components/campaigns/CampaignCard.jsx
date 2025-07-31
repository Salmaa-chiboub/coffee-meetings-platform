import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, UserGroupIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const CampaignCard = React.memo(({ campaign, onClick }) => {
  const navigate = useNavigate();

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

  // Memoize campaign status calculation
  const statusInfo = useMemo(() => {
    const isWorkflowCompleted = campaign.workflow_completed || campaign.status === 'completed';

    if (isWorkflowCompleted) {
      return { status: 'completed', color: 'text-green-600', bg: 'bg-green-100', label: 'Completed' };
    } else {
      return { status: 'active', color: 'text-blue-600', bg: 'bg-blue-100', label: 'Active' };
    }
  }, [campaign.workflow_completed, campaign.status]);

  // Memoize days calculation
  const daysInfo = useMemo(() => {
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);

    if (now < startDate) {
      const daysUntilStart = Math.ceil((startDate - now) / (1000 * 60 * 60 * 24));
      return `Starts in ${daysUntilStart} day${daysUntilStart !== 1 ? 's' : ''}`;
    } else if (now >= startDate && now <= endDate) {
      const daysRemaining = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      return `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
    } else {
      const daysAgo = Math.ceil((now - endDate) / (1000 * 60 * 60 * 24));
      return `Ended ${daysAgo} day${daysAgo !== 1 ? 's' : ''} ago`;
    }
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
      className="bg-white border border-warmGray-200 rounded-2xl p-6 hover:shadow-lg transition-all duration-200 transform hover:scale-[1.02] cursor-pointer"
    >
      {/* Title */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xl font-bold text-warmGray-800">
            {campaign.title}
          </h3>
          {statusInfo.status === 'completed' && (
            <CheckCircleIcon className="h-6 w-6 text-green-600" />
          )}
        </div>
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bg} ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>

      {/* Description */}
      {campaign.description && (
        <div className="mb-5">
          <p className="text-warmGray-600 text-sm leading-relaxed">
            {campaign.description}
          </p>
        </div>
      )}

      {/* Campaign details */}
      <div className="space-y-4">
        {/* Date range */}
        <div className="flex items-center space-x-3">
          <CalendarDaysIcon className="h-5 w-5 text-warmGray-400" />
          <div>
            <p className="text-xs text-warmGray-500 uppercase tracking-wide">Duration</p>
            <p className="text-sm font-medium text-warmGray-800">
              {formattedDates.startDate} - {formattedDates.endDate}
            </p>
          </div>
        </div>

        {/* Days info */}
        <div className="flex items-center space-x-3">
          <CheckCircleIcon className="h-5 w-5 text-warmGray-400" />
          <div>
            <p className="text-xs text-warmGray-500 uppercase tracking-wide">Status</p>
            <p className="text-sm font-medium text-warmGray-800">{daysInfo}</p>
          </div>
        </div>

        {/* Employee count */}
        <div className="flex items-center space-x-3">
          <UserGroupIcon className="h-5 w-5 text-warmGray-400" />
          <div>
            <p className="text-xs text-warmGray-500 uppercase tracking-wide">Participants</p>
            <p className="text-sm font-medium text-warmGray-800">
              {campaign.employees_count || 0} employee{(campaign.employees_count || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>



    </div>
  );
});

export default CampaignCard;
