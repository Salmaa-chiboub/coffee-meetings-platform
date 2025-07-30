import React from 'react';
import { CalendarDaysIcon, UserGroupIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';

const CampaignCard = ({ campaign, onClick }) => {
  // Format dates
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Calculate campaign status
  const getCampaignStatus = () => {
    const now = new Date();
    const startDate = new Date(campaign.start_date);
    const endDate = new Date(campaign.end_date);

    if (now < startDate) {
      return { status: 'upcoming', color: 'text-blue-600', bg: 'bg-blue-100' };
    } else if (now >= startDate && now <= endDate) {
      return { status: 'active', color: 'text-green-600', bg: 'bg-green-100' };
    } else {
      return { status: 'completed', color: 'text-gray-600', bg: 'bg-gray-100' };
    }
  };

  const statusInfo = getCampaignStatus();

  // Calculate days remaining or elapsed
  const getDaysInfo = () => {
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
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick(campaign);
    }
  };

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
          {statusInfo.status === 'completed' ? 'View History' : statusInfo.status.charAt(0).toUpperCase() + statusInfo.status.slice(1)}
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
              {formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}
            </p>
          </div>
        </div>

        {/* Days info */}
        <div className="flex items-center space-x-3">
          <ClockIcon className="h-5 w-5 text-warmGray-400" />
          <div>
            <p className="text-xs text-warmGray-500 uppercase tracking-wide">Status</p>
            <p className="text-sm font-medium text-warmGray-800">{getDaysInfo()}</p>
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
};

export default CampaignCard;
