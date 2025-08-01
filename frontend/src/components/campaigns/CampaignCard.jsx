import React, { useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarDaysIcon, UserGroupIcon } from '@heroicons/react/24/outline';

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
      className="bg-white border border-warmGray-200 rounded-2xl p-4 cursor-pointer h-44 flex flex-col"
    >
      {/* Title */}
      <div className="mb-2">
        <h3 className="text-lg font-bold text-warmGray-800">
          {campaign.title}
        </h3>
      </div>

      {/* Description - espace réservé fixe pour uniformiser la taille */}
      <div className="mb-2 h-8 flex items-start overflow-hidden">
        <p className="text-warmGray-600 text-xs leading-tight line-clamp-2">
          {campaign.description || 'No description provided'}
        </p>
      </div>

      {/* Campaign details */}
      <div className="space-y-2 flex-1 flex flex-col justify-end">
        {/* Date range */}
        <div className="flex items-center space-x-2">
          <CalendarDaysIcon className="h-4 w-4 text-warmGray-400" />
          <div>
            <p className="text-xs text-warmGray-500 uppercase tracking-wide">Duration</p>
            <p className="text-xs font-medium text-warmGray-800">
              {formattedDates.startDate} - {formattedDates.endDate}
            </p>
          </div>
        </div>

        {/* Employee count */}
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="h-4 w-4 text-warmGray-400" />
          <div>
            <p className="text-xs text-warmGray-500 uppercase tracking-wide">Participants</p>
            <p className="text-xs font-medium text-warmGray-800">
              {campaign.employee_count || campaign.employees_count || 0} employee{(campaign.employee_count || campaign.employees_count || 0) !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CampaignCard;
