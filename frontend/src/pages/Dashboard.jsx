import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardService } from '../services/dashboardService';
import {
  ChartBarIcon,
  UserGroupIcon,
  StarIcon,
  ClockIcon,
  TrendingUpIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlusCircleIcon
} from '@heroicons/react/24/outline';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch dashboard data on component mount
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [campaignsResult, overallStatsResult, recentActivityResult] = await Promise.all([
          dashboardService.getCampaignsWithStats(),
          dashboardService.getOverallEvaluationStats(),
          dashboardService.getRecentActivity()
        ]);

        if (campaignsResult.success && overallStatsResult.success && recentActivityResult.success) {
          setDashboardData({
            campaigns: campaignsResult.data,
            overallStats: overallStatsResult.data,
            recentActivity: recentActivityResult.data
          });
        } else {
          throw new Error('Failed to fetch dashboard data');
        }
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
        setError(error.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B6F47] mx-auto"></div>
          <p className="mt-4 text-warmGray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-cream p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-red-800 mb-2">Failed to Load Dashboard</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { campaigns, overallStats, recentActivity } = dashboardData || {};

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-warmGray-800">
            HR Manager Dashboard
          </h1>
          <p className="text-warmGray-600 mt-2">
            Welcome back, {user?.name || 'User'}! Here's your coffee meeting analytics.
          </p>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => {/* TODO: Navigate to create campaign */}}
            className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center"
          >
            <PlusCircleIcon className="h-5 w-5 mr-2" />
            New Campaign
          </button>
        </div>
      </div>

        {/* Overview Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Campaigns */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warmGray-600">Total Campaigns</p>
                <p className="text-3xl font-bold text-[#8B6F47]">
                  {overallStats?.total_campaigns || 0}
                </p>
              </div>
              <ChartBarIcon className="h-12 w-12 text-[#E8C4A0]" />
            </div>
          </div>

          {/* Active Campaigns */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warmGray-600">Active Campaigns</p>
                <p className="text-3xl font-bold text-green-600">
                  {overallStats?.active_campaigns || 0}
                </p>
              </div>
              <ClockIcon className="h-12 w-12 text-green-400" />
            </div>
          </div>

          {/* Total Evaluations */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warmGray-600">Total Evaluations</p>
                <p className="text-3xl font-bold text-blue-600">
                  {overallStats?.total_evaluations || 0}
                </p>
              </div>
              <StarIcon className="h-12 w-12 text-blue-400" />
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warmGray-600">Average Rating</p>
                <p className="text-3xl font-bold text-yellow-600">
                  {overallStats?.overall_average_rating ?
                    `${overallStats.overall_average_rating}/5` : 'N/A'}
                </p>
              </div>
              <TrendingUpIcon className="h-12 w-12 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Secondary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Response Rate */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warmGray-600">Response Rate</p>
                <p className="text-2xl font-bold text-purple-600">
                  {overallStats?.overall_response_rate ?
                    `${overallStats.overall_response_rate}%` : 'N/A'}
                </p>
              </div>
              <CheckCircleIcon className="h-10 w-10 text-purple-400" />
            </div>
          </div>

          {/* Total Pairs */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warmGray-600">Coffee Pairs Created</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {overallStats?.total_pairs || 0}
                </p>
              </div>
              <UserGroupIcon className="h-10 w-10 text-indigo-400" />
            </div>
          </div>

          {/* Upcoming Campaigns */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-warmGray-600">Upcoming Campaigns</p>
                <p className="text-2xl font-bold text-orange-600">
                  {overallStats?.upcoming_campaigns || 0}
                </p>
              </div>
              <ClockIcon className="h-10 w-10 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Recent Campaigns and Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Recent Campaigns */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-warmGray-800 mb-6">Recent Campaigns</h2>
            {campaigns && campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign) => (
                  <div
                    key={campaign.id || Math.random()}
                    className="border border-warmGray-200 rounded-lg p-4 hover:bg-warmGray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold text-warmGray-800">
                          {campaign.title || campaign.name || 'Untitled Campaign'}
                        </h3>
                        <p className="text-sm text-warmGray-600 mt-1">
                          {campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'No start date'} - {campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'No end date'}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-warmGray-500">
                            👥 {campaign.employees_count || 0} employees
                          </span>
                          {campaign.statistics && (
                            <span className="text-xs text-warmGray-500">
                              ⭐ {campaign.statistics.average_rating || 'N/A'} avg rating
                            </span>
                          )}
                        </div>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          (() => {
                            if (!campaign.start_date || !campaign.end_date) {
                              return 'bg-gray-100 text-gray-800'; // Unknown
                            }

                            const now = new Date();
                            const startDate = new Date(campaign.start_date);
                            const endDate = new Date(campaign.end_date);

                            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                              return 'bg-gray-100 text-gray-800'; // Invalid dates
                            }

                            if (startDate > now) {
                              return 'bg-blue-100 text-blue-800'; // Upcoming
                            } else if (startDate <= now && now <= endDate) {
                              return 'bg-green-100 text-green-800'; // Active
                            } else {
                              return 'bg-gray-100 text-gray-800'; // Completed
                            }
                          })()
                        }`}
                      >
                        {(() => {
                          if (!campaign.start_date || !campaign.end_date) {
                            return 'Unknown';
                          }

                          const now = new Date();
                          const startDate = new Date(campaign.start_date);
                          const endDate = new Date(campaign.end_date);

                          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            return 'Unknown';
                          }

                          if (startDate > now) return 'Upcoming';
                          else if (startDate <= now && now <= endDate) return 'Active';
                          else return 'Completed';
                        })()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ChartBarIcon className="h-12 w-12 text-warmGray-400 mx-auto mb-4" />
                <p className="text-warmGray-600 mb-4">No campaigns found</p>
                <button
                  onClick={() => {/* TODO: Navigate to create campaign */}}
                  className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Create Your First Campaign
                </button>
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-warmGray-800 mb-6">Recent Activity</h2>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      activity.type === 'campaign_created' ? 'bg-blue-100' : 'bg-green-100'
                    }`}>
                      {activity.type === 'campaign_created' ? (
                        <PlusCircleIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-warmGray-800">
                        {activity.title}
                      </p>
                      <p className="text-xs text-warmGray-500">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <ClockIcon className="h-12 w-12 text-warmGray-400 mx-auto mb-4" />
                <p className="text-warmGray-600">No recent activity</p>
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default Dashboard;
