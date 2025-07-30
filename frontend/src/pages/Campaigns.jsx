import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { PlusIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCampaigns } from '../hooks/useCampaigns';
import CampaignCard from '../components/campaigns/CampaignCard';
import { SkeletonCard } from '../components/ui/Skeleton';
import CampaignCreate from './CampaignCreate';

const CampaignsList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { data: campaigns = [], isLoading, error } = useCampaigns();

  // Filter campaigns based on search term
  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateCampaign = () => {
    navigate('/campaigns/create');
  };

  const handleCampaignClick = async (campaign) => {
    try {
      // Check if campaign workflow is completed
      const { workflowService } = await import('../services/workflowService');
      const workflowData = await workflowService.getCampaignWorkflowStatus(campaign.id);

      // If step 5 is completed and campaign is finished, go to history page
      const isCompleted = workflowData.completed_steps.includes(5) &&
                         workflowData.step_data['5']?.campaign_completed;

      if (isCompleted) {
        navigate(`/campaigns/${campaign.id}/history`);
      } else {
        // Navigate to campaign workflow
        navigate(`/campaigns/${campaign.id}/workflow`);
      }
    } catch (error) {
      // Fallback to workflow if there's an error
      navigate(`/campaigns/${campaign.id}/workflow`);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <div className="w-48 h-8 bg-warmGray-200 rounded-lg animate-pulse"></div>
          <div className="w-32 h-10 bg-warmGray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Search Skeleton */}
        <div className="w-full h-12 bg-warmGray-200 rounded-lg animate-pulse"></div>

        {/* Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <p className="text-red-600">Error loading campaigns: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Top horizontal card with search and add button */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center justify-between">
          {/* Search bar on the left */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-warmGray-400" />
              </div>
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
              />
              <label className="absolute -top-3 left-6 bg-white px-2 text-sm font-medium text-warmGray-600">
                Search Campaigns
              </label>
            </div>
          </div>

          {/* Add Campaign button on the right */}
          <button
            onClick={handleCreateCampaign}
            className="ml-6 bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center space-x-2"
          >
            <PlusIcon className="h-5 w-5" />
            <span>Add Campaign</span>
          </button>
        </div>
      </div>

      {/* Campaign listing card */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-warmGray-800">
            Coffee Meeting Campaigns
          </h1>
          <p className="text-warmGray-600 mt-2">
            Manage your coffee meeting campaigns and track employee participation
          </p>
        </div>

        {filteredCampaigns.length === 0 ? (
          <div className="text-center py-12">
            {campaigns.length === 0 ? (
              <div>
                <div className="w-16 h-16 bg-[#E8C4A0] rounded-full flex items-center justify-center mx-auto mb-4">
                  <PlusIcon className="h-8 w-8 text-[#8B6F47]" />
                </div>
                <h3 className="text-xl font-semibold text-warmGray-800 mb-2">
                  No campaigns yet
                </h3>
                <p className="text-warmGray-600 mb-6">
                  Create your first coffee meeting campaign to get started
                </p>
                <button
                  onClick={handleCreateCampaign}
                  className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-3 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02]"
                >
                  Create First Campaign
                </button>
              </div>
            ) : (
              <div>
                <MagnifyingGlassIcon className="h-16 w-16 text-warmGray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-warmGray-800 mb-2">
                  No campaigns found
                </h3>
                <p className="text-warmGray-600">
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                onClick={handleCampaignClick}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const Campaigns = () => {
  return (
    <Routes>
      <Route path="/" element={<CampaignsList />} />
      <Route path="/create" element={<CampaignCreate />} />
    </Routes>
  );
};

export default Campaigns;
