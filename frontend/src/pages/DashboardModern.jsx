import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  EyeIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ChevronDownIcon,
  ChartBarIcon,
  LinkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { dashboardService } from '../services/dashboardService';
import { SimpleBarChart, SimpleLineChart, EvaluationTrendsChart } from '../components/charts/SimpleChart';
import { SkeletonDashboard } from '../components/ui/Skeleton';

const DashboardModern = () => {
  const { user } = useAuth();

  // Detect sidebar hover state from parent layout
  const [isSidebarHovered, setIsSidebarHovered] = useState(false);

  useEffect(() => {
    const checkSidebarState = () => {
      const mainContent = document.querySelector('[data-sidebar-hovered]');
      if (mainContent) {
        const isHovered = mainContent.getAttribute('data-sidebar-hovered') === 'true';
        setIsSidebarHovered(isHovered);
      }
    };

    // Check initially and set up observer
    checkSidebarState();
    const observer = new MutationObserver(checkSidebarState);
    const mainContent = document.querySelector('[data-sidebar-hovered]');

    if (mainContent) {
      observer.observe(mainContent, {
        attributes: true,
        attributeFilter: ['data-sidebar-hovered']
      });
    }

    return () => observer.disconnect();
  }, []);

  // Helper functions
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={index < rating ? 'text-yellow-400' : 'text-warmGray-300'}>
        ★
      </span>
    ));
  };

  const [isLoading, setIsLoading] = useState(true);

  // Dynamic data states
  const [dashboardStats, setDashboardStats] = useState(null);
  const [recentEvaluations, setRecentEvaluations] = useState([]);
  const [overallStats, setOverallStats] = useState(null);

  const [evaluationTrends, setEvaluationTrends] = useState([]);
  const [error, setError] = useState(null);

  // Données simulées pour le graphique - à remplacer par des données dynamiques
  const [dashboardData] = useState({
    totalCampaigns: 156,
    totalEmployees: 2847,
    totalReviews: 1203,
    chartData: [
      { day: 'M', value: 45 },
      { day: 'T', value: 52 },
      { day: 'W', value: 38 },
      { day: 'T', value: 61 },
      { day: 'F', value: 72 },
      { day: 'S', value: 58 },
      { day: 'S', value: 67 }
    ],
    recentReviews: [
      {
        id: 1,
        userName: 'Marie Dubois',
        avatar: 'MD',
        comment: 'Excellent coffee meeting experience! Really helped us connect with colleagues.',
        rating: 4.8,
        campaignName: 'Team Building Q4',
        timeAgo: '2 hours ago'
      },
      {
        id: 2,
        userName: 'Ahmed Hassan',
        avatar: 'AH',
        comment: 'Great platform for organizing coffee meetings. Very intuitive interface.',
        rating: 4.5,
        campaignName: 'New Employee Integration',
        timeAgo: '5 hours ago'
      },
      {
        id: 3,
        userName: 'Sophie Laurent',
        avatar: 'SL',
        comment: 'The matching algorithm works perfectly. Made meaningful connections.',
        rating: 5.0,
        campaignName: 'Cross-Department Mixer',
        timeAgo: '1 day ago'
      }
    ]
  });

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Load all dashboard data in parallel
        const [
          statsResponse,
          evaluationsResponse,
          trendsResponse
        ] = await Promise.all([
          dashboardService.getOverallEvaluationStats(),
          dashboardService.getRecentEvaluations(4),
          dashboardService.getEvaluationTrends()
        ]);

        if (statsResponse.success) {
          setDashboardStats(statsResponse.data);
        }

        if (evaluationsResponse.success) {
          setRecentEvaluations(evaluationsResponse.data);
        }

        if (trendsResponse.success) {
          console.log('Evaluation trends data:', trendsResponse.data);
          setEvaluationTrends(trendsResponse.data);
        }

      } catch (err) {
        console.error('Dashboard loading error:', err);
        setError('Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return <SkeletonDashboard />;
  }

  return (
    <div className="min-h-screen bg-cream p-2 lg:p-3">
      <div className="max-w-7xl mx-auto space-y-4 lg:space-y-6">
        
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold text-warmGray-800">Tableau de bord</h1>
            <p className="text-warmGray-600 mt-0.5">
              Bon retour, {user?.name || 'Utilisateur'} ! Voici un aperçu de votre plateforme.
            </p>
          </div>


        </div>

        {/* Statistiques principales */}
        <div className={`grid gap-6 ${isSidebarHovered ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-5'} transition-all duration-300`}>
          {/* Total Campaigns */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-warmGray-100/50 hover:border-peach-200 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-br from-peach-100 to-peach-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <ClipboardDocumentListIcon className="w-7 h-7 text-peach-600" />
                </div>
                <span className="text-sm font-bold text-warmGray-600 uppercase tracking-wider">
                  Total Campagnes
                </span>
              </div>
            </div>
            <div className="text-4xl font-bold text-warmGray-800 mb-3 group-hover:text-peach-600 transition-colors duration-300">
              {dashboardStats?.total_campaigns?.toLocaleString() || '0'}
            </div>
          </div>

          {/* Total Employees */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-warmGray-100/50 hover:border-amber-200 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-br from-amber-100 to-amber-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <UserGroupIcon className="w-7 h-7 text-amber-600" />
                </div>
                <span className="text-sm font-bold text-warmGray-600 uppercase tracking-wider">
                  Total Employés
                </span>
              </div>
            </div>
            <div className="text-4xl font-bold text-warmGray-800 mb-3 group-hover:text-amber-600 transition-colors duration-300">
              {dashboardStats?.total_employees?.toLocaleString() || '0'}
            </div>
          </div>

          {/* Total Reviews */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-warmGray-100/50 hover:border-orange-200 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <ChatBubbleLeftRightIcon className="w-7 h-7 text-orange-600" />
                </div>
                <span className="text-sm font-bold text-warmGray-600 uppercase tracking-wider">
                  Total Évaluations
                </span>
              </div>
            </div>
            <div className="text-4xl font-bold text-warmGray-800 mb-3 group-hover:text-orange-600 transition-colors duration-300">
              {dashboardStats?.total_evaluations?.toLocaleString() || '0'}
            </div>
          </div>

          {/* Generated Pairs */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-warmGray-100/50 hover:border-blue-200 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-100 to-blue-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <LinkIcon className="w-7 h-7 text-blue-600" />
                </div>
                <span className="text-sm font-bold text-warmGray-600 uppercase tracking-wider">
                  Paires Générées
                </span>
              </div>
            </div>
            <div className="text-4xl font-bold text-warmGray-800 mb-3 group-hover:text-blue-600 transition-colors duration-300">
              {dashboardStats?.total_pairs?.toLocaleString() || '0'}
            </div>
          </div>

          {/* Completed Campaigns */}
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-6 shadow-lg hover:shadow-2xl transition-all duration-500 border border-warmGray-100/50 hover:border-green-200 group hover:-translate-y-1">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-14 h-14 bg-gradient-to-br from-green-100 to-green-200 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
                  <CheckCircleIcon className="w-7 h-7 text-green-600" />
                </div>
                <span className="text-sm font-bold text-warmGray-600 uppercase tracking-wider">
                  Campagnes Terminées
                </span>
              </div>
            </div>
            <div className="text-4xl font-bold text-warmGray-800 mb-3 group-hover:text-green-600 transition-colors duration-300">
              {dashboardStats?.completed_campaigns?.toLocaleString() || '0'}
            </div>
          </div>
        </div>

        {/* Section principale avec graphique et statistiques */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Graphiques des évaluations */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tendances des évaluations */}
            <EvaluationTrendsChart
              data={evaluationTrends}
              title="Tendances des Évaluations dans le Temps"
            />
          </div>

          {/* Average Rating Card */}
          <div className="bg-blue-50/90 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-blue-200/50">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-warmGray-800">Note Moyenne</h2>
              <div className="bg-yellow-100 p-3 rounded-full">
                <StarIcon className="h-6 w-6 text-yellow-600" />
              </div>
            </div>

            {dashboardStats ? (
              <div className="text-center">
                <div className="text-4xl font-bold text-warmGray-800 mb-2">
                  {dashboardStats.average_rating ? dashboardStats.average_rating.toFixed(1) : '0.0'}
                </div>
                <div className="flex items-center justify-center mb-4">
                  {renderStars(Math.round(dashboardStats.average_rating || 0))}
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div className="text-center">
                    <div className="text-sm text-warmGray-600 mb-1">
                      Total Paires
                    </div>
                    <div className="text-xl font-semibold text-warmGray-800">
                      {dashboardStats.total_pairs || 0}
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-warmGray-600 mb-1">
                      Évaluées
                    </div>
                    <div className="text-xl font-semibold text-green-600">
                      {dashboardStats.total_evaluations || 0}
                    </div>
                  </div>
                </div>

                <div className="text-xs text-warmGray-500 mt-4">
                  Basé sur {dashboardStats.total_evaluations || 0} évaluations
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <StarIcon className="h-12 w-12 text-warmGray-400 mx-auto mb-4" />
                <p className="text-warmGray-600">Chargement des statistiques...</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Evaluations - Full Width */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm border border-warmGray-100/50 mt-8">
          <h2 className="text-xl font-semibold text-warmGray-800 mb-6">Évaluations Récentes</h2>

          {recentEvaluations && recentEvaluations.length > 0 ? (
            <div className="space-y-4">
              {recentEvaluations.slice(0, 4).map((evaluation, index) => (
                <div key={index} className="bg-warmGray-50/70 rounded-lg p-4 hover:bg-warmGray-100/70 transition-colors duration-200 w-full">
                  <div className="grid grid-cols-12 gap-4 items-center">

                    {/* Left Section - Names */}
                    <div className="col-span-3">
                      <p className="text-sm font-semibold text-warmGray-800 mb-1">{evaluation.employee_name}</p>
                      <p className="text-xs text-warmGray-600">with {evaluation.partner_name}</p>
                    </div>

                    {/* Center Section - Comment */}
                    <div className="col-span-6">
                      {evaluation.comment && evaluation.comment.trim().length > 0 ? (
                        <p className="text-xs text-warmGray-700 italic text-center px-4">
                          "{evaluation.comment.length > 100 ? evaluation.comment.substring(0, 100) + '...' : evaluation.comment}"
                        </p>
                      ) : (
                        <p className="text-xs text-warmGray-500 italic text-center">Aucun commentaire fourni</p>
                      )}
                    </div>

                    {/* Right Section - Rating & Date */}
                    <div className="col-span-3 text-right">
                      <div className="flex items-center justify-end space-x-1 mb-1">
                        {renderStars(evaluation.rating)}
                      </div>
                      <div className="text-xs text-warmGray-500">
                        {formatDate(evaluation.submitted_at)}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ChatBubbleLeftRightIcon className="h-12 w-12 text-warmGray-400 mx-auto mb-4" />
              <p className="text-warmGray-600">No recent evaluations</p>
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default DashboardModern;
