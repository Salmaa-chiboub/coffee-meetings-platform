import React, { useState, useEffect, useMemo } from 'react';
import { historyService } from '../services/historyService';
import { modernPdfService } from '../services/modernPdfService';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  ChartBarIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  StarIcon,
  DocumentArrowDownIcon,
  CalendarIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import AnimatedSection from '../components/ui/AnimatedSection';
import Card from '../components/ui/Card';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const GlobalHistory = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const [trendsData, setTrendsData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [exportLoading, setExportLoading] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [historyResponse, trendsResponse] = await Promise.all([
          historyService.getCampaignHistory(currentPage, pageSize),
          historyService.getHistoryTrends()
        ]);

        if (historyResponse.success) {
          setData(historyResponse.data);
          setError(null);
        }

        if (trendsResponse.success) {
          setTrendsData(trendsResponse.data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentPage, pageSize]);

  const handleExportPDF = async () => {
    try {
      setExportLoading(true);
      // Utiliser notre service PDF moderne avec les données réelles
      modernPdfService.exportHistoryReport(data, data?.statistics);
    } catch (error) {
      console.error('Error exporting PDF:', error);
      // Fallback vers l'ancien service si nécessaire
      try {
        await historyService.exportHistoryPDF();
      } catch (fallbackError) {
        console.error('Fallback PDF export also failed:', fallbackError);
      }
    } finally {
      setExportLoading(false);
    }
  };

  const statisticsCards = useMemo(() => {
    if (!data?.statistics) return [];

    const stats = data.statistics;

    return [
      {
        title: 'Total Campagnes',
        value: stats.total_campaigns || 0,
        icon: ChartBarIcon,
        description: 'Campagnes terminées'
      },
      {
        title: 'Taux de Réponse',
        value: `${stats.response_rate || 0}%`,
        icon: ArrowTrendingUpIcon,
        description: 'Moyenne globale des réponses'
      },
      {
        title: 'Participants Actifs',
        value: stats.total_participants || 0,
        icon: UserGroupIcon,
        description: 'Employés ayant participé'
      },
      {
        title: 'Note Moyenne',
        value: `${stats.overall_rating ? (stats.overall_rating * 20).toFixed(1) : 0}%`,
        icon: StarIcon,
        description: 'Satisfaction globale'
      }
    ];
  }, [data]);

  const chartData = useMemo(() => {
    if (!data?.statistics) return null;

    const stats = data.statistics;
    const currentPerformance = {
      response_rate: stats.response_rate || 0,
      overall_rating: stats.overall_rating || 0
    };

    const currentTrends = trendsData || [];

    return {
      performance: {
        labels: [
          `Taux de réponse (${currentPerformance.response_rate}%)`,
          `Satisfaction (${(currentPerformance.overall_rating * 20).toFixed(1)}%)`,
          `Espace d'amélioration`
        ],
        datasets: [{
          label: 'Performance Globale',
          data: [
            currentPerformance.response_rate,
            currentPerformance.overall_rating * 20,
            100 - ((currentPerformance.response_rate + (currentPerformance.overall_rating * 20)) / 2)
          ],
          backgroundColor: [
            'rgba(255, 107, 107, 0.9)', // Rouge corail moderne
            'rgba(102, 126, 234, 0.9)', // Bleu violet moderne
            'rgba(226, 232, 240, 0.6)'  // Gris très clair pour l'espace restant
          ],
          borderColor: [
            '#ff6b6b',
            '#667eea',
            '#e2e8f0'
          ],
          borderWidth: 3,
          hoverBackgroundColor: [
            'rgba(255, 107, 107, 1)',
            'rgba(102, 126, 234, 1)',
            'rgba(226, 232, 240, 0.8)'
          ],
          hoverBorderColor: [
            '#ff5722',
            '#5c6bc0',
            '#cbd5e1'
          ],
          hoverBorderWidth: 4,
          cutout: '70%', // Trou au centre pour style moderne
          spacing: 3, // Espace entre les segments
          borderRadius: 8, // Coins arrondis
        }],
      },
      trends: {
        labels: currentTrends.map(item => {
          const date = new Date(item.date + '-01');
          return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        }),
        datasets: [
          {
            label: 'Nombre d\'évaluations',
            data: currentTrends.map(item => item.count),
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.15)',
            fill: true,
            tension: 0.5,
            pointBackgroundColor: '#ff6b6b',
            pointBorderColor: '#fff',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 4,
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(255, 107, 107, 0.3)',
          },
          {
            label: 'Note moyenne (%)',
            data: currentTrends.map(item => item.average_rating * 20),
            borderColor: '#667eea',
            backgroundColor: 'rgba(102, 126, 234, 0.15)',
            fill: true,
            tension: 0.5,
            yAxisID: 'y1',
            pointBackgroundColor: '#667eea',
            pointBorderColor: '#fff',
            pointBorderWidth: 3,
            pointRadius: 6,
            pointHoverRadius: 8,
            borderWidth: 4,
            borderDash: [0],
            shadowOffsetX: 2,
            shadowOffsetY: 2,
            shadowBlur: 10,
            shadowColor: 'rgba(102, 126, 234, 0.3)',
          }
        ]
      }
    };
  }, [data, trendsData]);

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'terminée':
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'en cours':
      case 'active':
        return 'bg-peach-100 text-peach-800 border-peach-200';
      case 'suspendue':
      case 'paused':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-warmGray-100 text-warmGray-800 border-warmGray-200';
    }
  };

  const getRatingColor = (rating) => {
    const numRating = parseFloat(rating);
    if (numRating >= 4.0) return 'bg-green-100 text-green-800 border-green-200';
    if (numRating >= 3.0) return 'bg-peach-100 text-peach-800 border-peach-200';
    return 'bg-yellow-100 text-yellow-800 border-yellow-200';
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            {/* Header skeleton */}
            <div className="space-y-4">
              <div className="h-10 bg-warmGray-200 rounded-lg w-1/3"></div>
              <div className="h-6 bg-warmGray-200 rounded w-2/3"></div>
            </div>
            
            {/* Stats cards skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-warmGray-200">
                  <div className="space-y-3">
                    <div className="h-5 bg-warmGray-200 rounded w-3/4"></div>
                    <div className="h-8 bg-warmGray-200 rounded w-1/2"></div>
                    <div className="h-4 bg-warmGray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Charts skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[...Array(2)].map((_, i) => (
                <div key={i} className="bg-white rounded-xl p-6 shadow-sm border border-warmGray-200">
                  <div className="h-6 bg-warmGray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-64 bg-warmGray-100 rounded-lg"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-cream p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Erreur de chargement</h3>
            <p className="text-red-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-lg font-medium transition-colors"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-cream">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* En-tête moderne */}
        <AnimatedSection animation="fadeInUp">
          <div className="md:flex md:items-center md:justify-between mb-10">
            <div className="min-w-0 flex-1">
              <h1 className="text-4xl font-bold text-warmGray-800 mb-2">
                Historique Global 📊
              </h1>
              <p className="text-lg text-warmGray-600 max-w-2xl">
                Vue d'ensemble complète de toutes vos campagnes et leurs performances détaillées
              </p>
            </div>
            <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
              <select
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value)}
                className="px-4 py-2 bg-white border-2 border-warmGray-300 rounded-lg text-warmGray-700 focus:border-peach-500 focus:outline-none font-medium"
              >
                <option value="all">Toutes les périodes</option>
                <option value="last_month">Dernier mois</option>
                <option value="last_quarter">Dernier trimestre</option>
                <option value="last_year">Dernière année</option>
              </select>
              <button
                onClick={handleExportPDF}
                disabled={exportLoading}
                className="inline-flex items-center px-6 py-2 bg-peach-500 hover:bg-peach-600 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:scale-100 shadow-lg hover:shadow-xl"
              >
                {exportLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                ) : (
                  <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                )}
                Exporter PDF
              </button>
            </div>
          </div>
        </AnimatedSection>

        {/* Cartes de statistiques */}
        <AnimatedSection animation="fadeInUp" delay={100}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {statisticsCards.map((card, index) => {
              const gradients = [
                'from-rose-50 to-pink-100 border-rose-200', // Card 1 - Rose
                'from-blue-50 to-indigo-100 border-blue-200', // Card 2 - Blue
                'from-emerald-50 to-green-100 border-emerald-200', // Card 3 - Green
                'from-amber-50 to-yellow-100 border-amber-200' // Card 4 - Amber
              ];

              const iconColors = [
                'text-rose-600 bg-rose-100', // Rose
                'text-blue-600 bg-blue-100', // Blue
                'text-emerald-600 bg-emerald-100', // Green
                'text-amber-600 bg-amber-100' // Amber
              ];

              return (
                <Card key={index} className={`hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 hover:scale-105 border-2 bg-gradient-to-br ${gradients[index]} backdrop-blur-sm relative overflow-hidden group`}>
                  {/* Decorative background pattern */}
                  <div className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity duration-500">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-current rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-current rounded-full translate-y-8 -translate-x-8"></div>
                  </div>

                  <div className="p-6 relative">
                    <div className="flex items-center justify-center mb-6">
                      <div className={`p-4 rounded-2xl shadow-lg ${iconColors[index]} transition-transform duration-300 group-hover:scale-110`}>
                        <card.icon className="h-7 w-7" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        {card.title}
                      </h3>
                      <div className="flex items-baseline space-x-2">
                        <p className="text-4xl font-black text-gray-800 transition-all duration-300 group-hover:text-gray-900">
                          {card.value}
                        </p>
                        {typeof card.value === 'string' && card.value.includes('%') && (
                          <span className="text-lg font-semibold text-gray-500">sur 100</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 font-medium leading-relaxed">
                        {card.description}
                      </p>
                    </div>

                    {/* Progress bar for percentage values */}
                    {typeof card.value === 'string' && card.value.includes('%') && (
                      <div className="mt-4">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 delay-300 ${
                              index === 0 ? 'bg-gradient-to-r from-rose-400 to-rose-500' :
                              index === 1 ? 'bg-gradient-to-r from-blue-400 to-blue-500' :
                              index === 2 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' :
                              'bg-gradient-to-r from-amber-400 to-amber-500'
                            }`}
                            style={{
                              width: `${parseFloat(card.value)}%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </AnimatedSection>

        {/* Graphiques et analyses */}
        {chartData && (
          <AnimatedSection animation="fadeInUp" delay={200}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
              {/* Graphique de performance en cercle */}
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-indigo-50 via-white to-purple-50 hover:shadow-3xl transition-all duration-500 relative overflow-hidden">
                {/* Décoration de fond */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-200 to-indigo-200 rounded-full opacity-20 transform translate-x-16 -translate-y-16"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200 to-red-200 rounded-full opacity-15 transform -translate-x-12 translate-y-12"></div>

                <div className="p-8 relative">
                  <div className="flex items-center mb-8">
                    <div className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-2xl mr-4 shadow-lg">
                      <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Performance Globale</h3>
                      <p className="text-sm text-gray-500">Vue d'ensemble circulaire</p>
                    </div>
                  </div>

                  <div className="relative">
                    {/* Conteneur principal du graphique */}
                    <div className="h-80 flex items-center justify-center relative">
                      <div className="w-72 h-72 relative">
                        <Doughnut
                          data={chartData.performance}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            animation: {
                              animateRotate: true,
                              animateScale: true,
                              duration: 2500,
                              easing: 'easeInOutQuart',
                            },
                            plugins: {
                              legend: {
                                display: true,
                                position: 'bottom',
                                labels: {
                                  usePointStyle: true,
                                  pointStyle: 'circle',
                                  font: { size: 12, weight: '600' },
                                  color: '#374151',
                                  padding: 20,
                                  generateLabels: (chart) => {
                                    const data = chart.data;
                                    return data.labels.map((label, index) => ({
                                      text: label,
                                      fillStyle: data.datasets[0].backgroundColor[index],
                                      strokeStyle: data.datasets[0].borderColor[index],
                                      lineWidth: 2,
                                      pointStyle: 'circle',
                                    }));
                                  }
                                }
                              },
                              tooltip: {
                                backgroundColor: 'rgba(30, 41, 59, 0.95)',
                                titleColor: '#f1f5f9',
                                bodyColor: '#e2e8f0',
                                borderColor: '#8b5cf6',
                                borderWidth: 2,
                                cornerRadius: 12,
                                padding: 15,
                                titleFont: { size: 14, weight: 'bold' },
                                bodyFont: { size: 13 },
                                displayColors: true,
                                usePointStyle: true,
                                callbacks: {
                                  label: (context) => {
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${context.label}: ${value.toFixed(1)}% (${percentage}% du total)`;
                                  }
                                }
                              }
                            },
                            cutout: '65%',
                            elements: {
                              arc: {
                                borderWidth: 3,
                                borderRadius: 8,
                                spacing: 2
                              }
                            }
                          }}
                        />

                        {/* Texte central stylisé */}
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="text-center">
                            <div className="text-3xl font-black text-gray-800">
                              {((chartData.performance.datasets[0].data[0] + chartData.performance.datasets[0].data[1]) / 2).toFixed(1)}%
                            </div>
                            <div className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                              Performance
                            </div>
                            <div className="text-xs text-gray-400 mt-1">
                              Moyenne globale
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Indicateurs décoratifs autour du graphique */}
                    <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                      <div className="text-xs font-semibold text-gray-600">TAUX RÉPONSE</div>
                      <div className="text-lg font-bold text-red-600">{chartData.performance.datasets[0].data[0]}%</div>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                      <div className="text-xs font-semibold text-gray-600">SATISFACTION</div>
                      <div className="text-lg font-bold text-indigo-600">{chartData.performance.datasets[0].data[1].toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Graphique des tendances */}
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-purple-50 via-white to-indigo-50 hover:shadow-3xl transition-all duration-500">
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-gradient-to-r from-purple-100 to-indigo-100 rounded-xl mr-4 shadow-lg">
                      <ArrowTrendingUpIcon className="h-7 w-7 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Évolution Temporelle</h3>
                      <p className="text-sm text-gray-500">Tendances sur 6 mois</p>
                    </div>
                  </div>
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-purple-50 rounded-lg opacity-20"></div>
                    {chartData.trends && (
                      <Line
                        data={chartData.trends}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: {
                            mode: 'index',
                            intersect: false,
                            includeInvisible: false
                          },
                          animation: {
                            duration: 2500,
                            easing: 'easeInOutQuart',
                            delay: (context) => context.dataIndex * 100
                          },
                          plugins: {
                            legend: {
                              position: 'top',
                              labels: {
                                usePointStyle: true,
                                pointStyle: 'circle',
                                font: { size: 13, weight: '600' },
                                color: '#374151',
                                padding: 20
                              }
                            },
                            tooltip: {
                              backgroundColor: 'rgba(30, 41, 59, 0.95)',
                              titleColor: '#f1f5f9',
                              bodyColor: '#e2e8f0',
                              borderColor: '#ff6b6b',
                              borderWidth: 2,
                              cornerRadius: 12,
                              padding: 12,
                              titleFont: { size: 14, weight: 'bold' },
                              bodyFont: { size: 13 },
                              displayColors: true,
                              usePointStyle: true,
                              callbacks: {
                                label: (context) => {
                                  const label = context.dataset.label;
                                  const value = context.parsed.y.toFixed(1);
                                  return `${label}: ${value}${label.includes('Note') ? '%' : ''}`;
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              type: 'linear',
                              display: true,
                              position: 'left',
                              title: {
                                display: true,
                                text: 'Nombre d\'évaluations',
                                color: '#6b7280',
                                font: { size: 13, weight: '600' }
                              },
                              ticks: {
                                color: '#6b7280',
                                font: { size: 11 }
                              },
                              grid: {
                                color: 'rgba(148, 163, 184, 0.1)',
                                drawBorder: false
                              }
                            },
                            y1: {
                              type: 'linear',
                              display: true,
                              position: 'right',
                              title: {
                                display: true,
                                text: 'Note moyenne (%)',
                                color: '#6b7280',
                                font: { size: 13, weight: '600' }
                              },
                              grid: { drawOnChartArea: false },
                              max: 100,
                              min: 60,
                              ticks: {
                                color: '#6b7280',
                                font: { size: 11 },
                                callback: (value) => `${value}%`
                              }
                            },
                            x: {
                              grid: {
                                color: 'rgba(148, 163, 184, 0.05)',
                                drawBorder: false
                              },
                              ticks: {
                                color: '#6b7280',
                                font: { size: 11 }
                              }
                            }
                          },
                          elements: {
                            line: {
                              tension: 0.4
                            },
                            point: {
                              radius: 6,
                              hoverRadius: 10,
                              borderWidth: 3,
                              hoverBorderWidth: 4
                            }
                          }
                        }}
                      />
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </AnimatedSection>
        )}

        {/* Tableau des campagnes modernisé */}
        <AnimatedSection animation="fadeInUp" delay={300}>
          <Card className="border-0 shadow-xl overflow-hidden">
            <div className="bg-gradient-to-r from-peach-50 to-warmGray-50 px-8 py-6 border-b border-warmGray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-2 bg-white rounded-lg mr-3 shadow-sm">
                    <CalendarIcon className="h-6 w-6 text-peach-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-warmGray-800">Détail des Campagnes</h3>
                </div>
                <span className="text-sm text-warmGray-600 bg-white px-3 py-1 rounded-lg shadow-sm">
                  {data.campaigns?.length || 0} campagne(s)
                </span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-warmGray-200">
                <thead className="bg-warmGray-50">
                  <tr>
                    {[
                      'Campagne', 'Statut', 'Début', 'Fin', 
                      'Participants', 'Paires', 'Évaluations', 'Note', 'Taux de réponse'
                    ].map((header) => (
                      <th key={header} className="px-6 py-4 text-left text-xs font-semibold text-warmGray-700 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-warmGray-100">
                  {data.campaigns?.map((campaign, index) => (
                    <tr key={campaign.id} className="hover:bg-gradient-to-r hover:from-peach-25 hover:to-warmGray-25 transition-all duration-200">
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-peach-100 to-peach-200 rounded-lg flex items-center justify-center mr-4">
                            <span className="text-peach-600 font-semibold text-sm">
                              {campaign.title?.charAt(0) || 'C'}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-warmGray-900">{campaign.title}</div>
                            {campaign.description && (
                              <div className="text-sm text-warmGray-500 truncate max-w-xs">
                                {campaign.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(campaign.status)}`}>
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                          {campaign.status}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-warmGray-600 font-medium">
                        {campaign.start_date}
                      </td>
                      <td className="px-6 py-5 text-sm text-warmGray-600 font-medium">
                        {campaign.end_date}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center text-sm text-warmGray-900 font-medium">
                          <UserGroupIcon className="h-4 w-4 mr-1 text-warmGray-500" />
                          {campaign.participants}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-warmGray-900 font-medium">
                        {campaign.pairs}
                      </td>
                      <td className="px-6 py-5 text-sm text-warmGray-900 font-medium">
                        {campaign.evaluations}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRatingColor(campaign.average_rating)}`}>
                          <StarIcon className="h-3 w-3 mr-1" />
                          {campaign.average_rating}/5
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <div className="w-16 bg-warmGray-200 rounded-full h-2 mr-3">
                            <div 
                              className="bg-gradient-to-r from-peach-400 to-peach-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${campaign.response_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-warmGray-700">
                            {campaign.response_rate}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </AnimatedSection>

        {/* Pagination modernisée */}
        {data.pagination && (
          <AnimatedSection animation="fadeInUp" delay={400}>
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-warmGray-600 bg-white px-4 py-2 rounded-lg shadow-sm border border-warmGray-200">
                Affichage de <span className="font-medium text-warmGray-800">{((currentPage - 1) * pageSize) + 1}</span> à{' '}
                <span className="font-medium text-warmGray-800">
                  {Math.min(currentPage * pageSize, data.pagination.total_items)}
                </span> sur{' '}
                <span className="font-medium text-warmGray-800">{data.pagination.total_items}</span> résultats
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    currentPage === 1 
                      ? 'bg-warmGray-100 text-warmGray-400 border-warmGray-200 cursor-not-allowed' 
                      : 'bg-white text-warmGray-700 border-warmGray-300 hover:bg-peach-50 hover:border-peach-300 hover:text-peach-700'
                  }`}
                >
                  Précédent
                </button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, data.pagination.total_pages))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                          currentPage === pageNum
                            ? 'bg-peach-500 text-white shadow-lg'
                            : 'bg-white text-warmGray-700 border border-warmGray-300 hover:bg-peach-50 hover:border-peach-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, data.pagination.total_pages))}
                  disabled={currentPage === data.pagination.total_pages}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    currentPage === data.pagination.total_pages
                      ? 'bg-warmGray-100 text-warmGray-400 border-warmGray-200 cursor-not-allowed'
                      : 'bg-white text-warmGray-700 border-warmGray-300 hover:bg-peach-50 hover:border-peach-300 hover:text-peach-700'
                  }`}
                >
                  Suivant
                </button>
              </div>
            </div>
          </AnimatedSection>
        )}
      </div>
    </div>
  );
};

export default GlobalHistory;
