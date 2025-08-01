import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  UserGroupIcon,
  StarIcon,
  CheckCircleIcon,
  EyeIcon,
  DocumentTextIcon,
  ChartPieIcon,
  ArrowTrendingUpIcon
} from '@heroicons/react/24/outline';
import { campaignService } from '../services/campaignService';
import { downloadService } from '../services/downloadService';
import { SkeletonCard } from '../components/ui/Skeleton';
import CountUp from '../components/ui/CountUp';
import AnimatedSection from '../components/ui/AnimatedSection';
import DownloadDropdown from '../components/ui/DownloadDropdown';
import CampaignTimelineChart from '../components/charts/CampaignTimelineChart';
import ParticipationChart from '../components/charts/ParticipationChart';
import NetworkDiagram from '../components/charts/NetworkDiagram';

const GlobalCampaignHistory = () => {
  const navigate = useNavigate();
  
  // State management
  const [campaigns, setCampaigns] = useState([]);
  const [filteredCampaigns, setFilteredCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [overallStats, setOverallStats] = useState(null);

  // Load campaigns and statistics
  useEffect(() => {
    const loadCampaignHistory = async () => {
      try {
        setLoading(true);

        // Use the new getCompletedCampaigns method which handles the filtering logic
        const completedCampaigns = await campaignService.getCompletedCampaigns();

        setCampaigns(completedCampaigns);
        setFilteredCampaigns(completedCampaigns);



        // Calculate overall statistics
        const stats = calculateOverallStats(completedCampaigns);
        setOverallStats(stats);

      } catch (err) {
        setError(err.message || 'Failed to load campaign history');
      } finally {
        setLoading(false);
      }
    };

    loadCampaignHistory();
  }, []);

  // Filter campaigns based on search and filter criteria
  useEffect(() => {
    let filtered = campaigns;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply date filter
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());

    switch (selectedFilter) {
      case 'recent':
        filtered = filtered.filter(campaign => new Date(campaign.end_date) >= sixMonthsAgo);
        break;
      case 'thisYear':
        filtered = filtered.filter(campaign => new Date(campaign.end_date).getFullYear() === now.getFullYear());
        break;
      case 'lastYear':
        filtered = filtered.filter(campaign => new Date(campaign.end_date).getFullYear() === now.getFullYear() - 1);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    setFilteredCampaigns(filtered);
  }, [campaigns, searchTerm, selectedFilter]);

  // Calculate overall statistics
  const calculateOverallStats = (campaignsList) => {
    const totalCampaigns = campaignsList.length;
    const totalParticipants = campaignsList.reduce((sum, campaign) => sum + (campaign.employees_count || 0), 0);
    const totalPairs = campaignsList.reduce((sum, campaign) => sum + (campaign.pairs_count || 0), 0);

    // Safely calculate average rating
    const avgRating = totalCampaigns > 0
      ? campaignsList.reduce((sum, campaign) => {
          const rating = parseFloat(campaign.avg_rating) || 0;
          return sum + rating;
        }, 0) / totalCampaigns
      : 0;

    // Calculate average success rate
    const avgSuccessRate = totalCampaigns > 0
      ? campaignsList.reduce((sum, campaign) => sum + (campaign.success_rate || 0), 0) / totalCampaigns
      : 0;

    return {
      totalCampaigns,
      totalParticipants,
      totalPairs,
      avgRating: avgRating.toFixed(1),
      successRate: avgSuccessRate.toFixed(1)
    };
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Handle campaign view
  const handleViewCampaign = (campaignId) => {
    navigate(`/campaigns/${campaignId}/history`);
  };

  // Download handlers
  const handleDownloadPDF = async () => {
    try {
      await downloadService.downloadPDF(filteredCampaigns, overallStats);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert('Failed to download PDF report. Please try again.');
    }
  };



  const handleDownloadExcel = () => {
    try {
      downloadService.downloadExcel(filteredCampaigns, overallStats);
    } catch (error) {
      console.error('Error downloading Excel:', error);
      alert('Failed to download Excel file. Please try again.');
    }
  };

  const handleDownloadCSV = () => {
    try {
      downloadService.downloadCSV(filteredCampaigns);
    } catch (error) {
      console.error('Error downloading CSV:', error);
      alert('Failed to download CSV file. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <AnimatedSection>
          <div className="text-center">
            <div className="flex justify-between items-start mb-6">
              <div className="flex-1"></div>
              <div className="flex-1">
                <h1 className="text-4xl font-bold text-warmGray-800 mb-4">
                  Campaign History Archive
                </h1>
              </div>
              <div className="flex-1 flex justify-end">
                <DownloadDropdown
                  onDownloadPDF={handleDownloadPDF}
                  onDownloadExcel={handleDownloadExcel}
                  onDownloadCSV={handleDownloadCSV}
                  disabled={loading || !filteredCampaigns.length}
                />
              </div>
            </div>
            <p className="text-lg text-warmGray-600 max-w-3xl mx-auto">
              Comprehensive archive of all completed coffee meeting campaigns with detailed analytics,
              participant feedback, and performance metrics.
            </p>
          </div>
        </AnimatedSection>

        {/* Overall Statistics */}
        {overallStats && (
          <AnimatedSection delay={200}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#F0E8D5' }}>
                  <ChartBarIcon className="h-6 w-6" style={{ color: '#D4A574' }} />
                </div>
                <p className="text-sm font-medium text-warmGray-600 mb-1">Total Campaigns</p>
                <p className="text-3xl font-bold text-warmGray-800">
                  <CountUp end={overallStats.totalCampaigns} duration={2000} />
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#D5E0F0' }}>
                  <UserGroupIcon className="h-6 w-6" style={{ color: '#8FA8C7' }} />
                </div>
                <p className="text-sm font-medium text-warmGray-600 mb-1">Total Participants</p>
                <p className="text-3xl font-bold text-warmGray-800">
                  <CountUp end={overallStats.totalParticipants} duration={2500} />
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#D5E8E8' }}>
                  <UserGroupIcon className="h-6 w-6" style={{ color: '#8FB8B8' }} />
                </div>
                <p className="text-sm font-medium text-warmGray-600 mb-1">Coffee Pairs</p>
                <p className="text-3xl font-bold text-warmGray-800">
                  <CountUp end={overallStats.totalPairs} duration={3000} />
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#F0F0D5' }}>
                  <StarIcon className="h-6 w-6" style={{ color: '#C7C78F' }} />
                </div>
                <p className="text-sm font-medium text-warmGray-600 mb-1">Avg Rating</p>
                <p className="text-3xl font-bold text-warmGray-800">
                  <CountUp end={parseFloat(overallStats.avgRating)} duration={2000} suffix="/5" />
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: '#E8D5E8' }}>
                  <ArrowTrendingUpIcon className="h-6 w-6" style={{ color: '#B8A8B8' }} />
                </div>
                <p className="text-sm font-medium text-warmGray-600 mb-1">Success Rate</p>
                <p className="text-3xl font-bold text-warmGray-800">
                  <CountUp end={overallStats.successRate} duration={2500} suffix="%" />
                </p>
              </div>
            </div>
          </AnimatedSection>
        )}

        {/* Search and Filter Controls */}
        <AnimatedSection delay={400}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search */}
              <div className="relative flex-1 max-w-md">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-warmGray-400" />
                <input
                  type="text"
                  placeholder="Search campaigns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-warmGray-300 rounded-lg focus:ring-2 focus:ring-peach-500 focus:border-transparent"
                />
              </div>

              {/* Filter Dropdown */}
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <FunnelIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-warmGray-400" />
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="pl-10 pr-8 py-2 border border-warmGray-300 rounded-lg focus:ring-2 focus:ring-peach-500 focus:border-transparent appearance-none bg-white"
                  >
                    <option value="all">All Time</option>
                    <option value="recent">Last 6 Months</option>
                    <option value="thisYear">This Year</option>
                    <option value="lastYear">Last Year</option>
                  </select>
                </div>

                <div className="text-sm text-warmGray-600">
                  {filteredCampaigns.length} campaign{filteredCampaigns.length !== 1 ? 's' : ''} found
                </div>
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Data Visualizations */}
        <AnimatedSection delay={200}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Campaign Timeline Chart */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-warmGray-100/50 p-8 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-warmGray-800 mb-6 flex items-center">
                <ChartPieIcon className="h-6 w-6 mr-3 text-[#E8C4A0]" />
                Campaign Timeline
              </h3>
              <div className="h-96">
                <CampaignTimelineChart campaigns={filteredCampaigns} />
              </div>
            </div>

            {/* Participation Chart */}
            <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-warmGray-100/50 p-8 hover:shadow-xl transition-all duration-300">
              <h3 className="text-xl font-bold text-warmGray-800 mb-6 flex items-center">
                <ArrowTrendingUpIcon className="h-6 w-6 mr-3 text-[#BDDCFF]" />
                Participation Trends
              </h3>
              <div className="h-96">
                <ParticipationChart campaigns={filteredCampaigns} />
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* Network Diagram */}
        <AnimatedSection delay={300}>
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-warmGray-800 mb-4 flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2 text-green-600" />
              Employee Pairing Network
            </h3>
            <NetworkDiagram campaigns={filteredCampaigns} />
          </div>
        </AnimatedSection>

        {/* Campaign Cards */}
        <AnimatedSection delay={1000}>
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-warmGray-800">Campaign Archive</h2>

            {filteredCampaigns.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <DocumentTextIcon className="h-16 w-16 text-warmGray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-warmGray-800 mb-2">
                  No campaigns found
                </h3>
                <p className="text-warmGray-600">
                  {searchTerm || selectedFilter !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'No completed campaigns available yet'
                  }
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCampaigns.map((campaign, index) => (
                  <div
                    key={campaign.id}
                    className="bg-white rounded-xl shadow-lg border border-warmGray-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    {/* Campaign Header */}
                    <div className="p-6 border-b border-warmGray-100">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-semibold text-warmGray-800 line-clamp-2">
                          {campaign.title}
                        </h3>
                        <div className="flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: '#E8F0D5', color: '#6B8E4B' }}>
                          <CheckCircleIcon className="h-3 w-3" />
                          <span>Completed</span>
                        </div>
                      </div>

                      {campaign.description && (
                        <p className="text-warmGray-600 text-sm line-clamp-2 mb-3">
                          {campaign.description}
                        </p>
                      )}

                      <div className="flex items-center text-sm text-warmGray-500">
                        <CalendarDaysIcon className="h-4 w-4 mr-1" />
                        <span>{formatDate(campaign.start_date)} - {formatDate(campaign.end_date)}</span>
                      </div>
                    </div>

                    {/* Campaign Stats */}
                    <div className="p-6 border-b border-warmGray-100">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-warmGray-800">
                            {campaign.employees_count || 0}
                          </div>
                          <div className="text-xs text-warmGray-500">Participants</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-warmGray-800">
                            {campaign.pairs_count || 0}
                          </div>
                          <div className="text-xs text-warmGray-500">Pairs</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-warmGray-800">
                            {campaign.avg_rating ? campaign.avg_rating.toFixed(1) : 'N/A'}
                          </div>
                          <div className="text-xs text-warmGray-500">Rating</div>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="p-6">
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleViewCampaign(campaign.id)}
                          className="flex-1 flex items-center justify-center space-x-2 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
                          style={{
                            backgroundColor: '#F0E8D5',
                            color: '#A67C52',
                            ':hover': { backgroundColor: '#E8D5C5' }
                          }}
                          onMouseEnter={(e) => e.target.style.backgroundColor = '#E8D5C5'}
                          onMouseLeave={(e) => e.target.style.backgroundColor = '#F0E8D5'}
                        >
                          <EyeIcon className="h-4 w-4" />
                          <span>View Details</span>
                        </button>


                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </AnimatedSection>


      </div>
    </div>
  );
};

export default GlobalCampaignHistory;
