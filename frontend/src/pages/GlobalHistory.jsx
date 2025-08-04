import React, { useState, useEffect, useMemo } from 'react';
import { historyService } from '../services/historyService';
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
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

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
      await historyService.exportHistoryPDF();
    } catch (error) {
      console.error('Error exporting PDF:', error);
    } finally {
      setExportLoading(false);
    }
  };

  const chartData = useMemo(() => {
    if (!data?.statistics) return null;

    return {
      performance: {
        labels: ['Taux de réponse', 'Note moyenne (sur 100)'],
        datasets: [{
          label: 'Performance globale',
          data: [
            data.statistics.response_rate,
            data.statistics.overall_rating * 20,
          ],
          backgroundColor: ['rgba(59, 130, 246, 0.5)', 'rgba(16, 185, 129, 0.5)'],
          borderColor: ['rgba(59, 130, 246, 1)', 'rgba(16, 185, 129, 1)'],
          borderWidth: 1,
        }],
      },
      trends: trendsData ? {
        labels: trendsData.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
        }),
        datasets: [
          {
            label: 'Nombre d\'évaluations',
            data: trendsData.map(item => item.count),
            borderColor: 'rgba(59, 130, 246, 1)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
          },
          {
            label: 'Note moyenne',
            data: trendsData.map(item => item.average_rating * 20), // Convertir en pourcentage
            borderColor: 'rgba(16, 185, 129, 1)',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            yAxisID: 'y1',
          }
        ]
      } : null
    };
  }, [data, trendsData]);

  if (loading && !data) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mt-4"></div>
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
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <p className="text-red-600">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* En-tête avec bouton d'export */}
        <div className="md:flex md:items-center md:justify-between mb-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
              Historique Global
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Vue d'ensemble de toutes les campagnes et leurs performances
            </p>
          </div>
          <div className="mt-4 flex md:mt-0 md:ml-4">
            <button
              onClick={handleExportPDF}
              disabled={exportLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              {exportLoading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="-ml-1 mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              )}
              Exporter en PDF
            </button>
          </div>
        </div>

        {/* Statistiques et graphiques */}
        {data?.statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Globale</h3>
                <div className="h-64">
                  <Bar
                    data={chartData.performance}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          max: 100,
                          grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                          }
                        },
                        x: {
                          grid: {
                            display: false
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow-sm rounded-lg">
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Évolution des Évaluations</h3>
                <div className="h-64">
                  {chartData.trends && (
                    <Line
                      data={chartData.trends}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        interaction: {
                          mode: 'index',
                          intersect: false,
                        },
                        plugins: {
                          legend: {
                            position: 'top',
                          }
                        },
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: 'Nombre d\'évaluations'
                            }
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: 'Note moyenne (%)'
                            },
                            grid: {
                              drawOnChartArea: false
                            },
                            max: 100,
                            min: 0
                          }
                        }
                      }}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tableau des campagnes */}
        <div className="bg-white shadow-sm overflow-hidden rounded-lg mb-8">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Campagne
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date début
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date fin
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Paires
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Évaluations
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Note
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Taux de réponse
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.campaigns.map((campaign) => (
                  <tr key={campaign.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{campaign.title}</div>
                      {campaign.description && (
                        <div className="text-sm text-gray-500">{campaign.description}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {campaign.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {campaign.start_date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {campaign.end_date}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {campaign.participants}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {campaign.pairs}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {campaign.evaluations}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {campaign.average_rating}/5
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {campaign.response_rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {data.pagination && (
          <nav className="bg-white px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6" aria-label="Pagination">
            <div className="hidden sm:block">
              <p className="text-sm text-gray-700">
                Affichage de{' '}
                <span className="font-medium">{((currentPage - 1) * pageSize) + 1}</span>
                {' '}à{' '}
                <span className="font-medium">
                  {Math.min(currentPage * pageSize, data.pagination.total_items)}
                </span>
                {' '}sur{' '}
                <span className="font-medium">{data.pagination.total_items}</span>
                {' '}résultats
              </p>
            </div>
            <div className="flex-1 flex justify-between sm:justify-end">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                  currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Précédent
              </button>
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, data.pagination.total_pages))}
                disabled={currentPage === data.pagination.total_pages}
                className={`ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 ${
                  currentPage === data.pagination.total_pages ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                Suivant
              </button>
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

export default GlobalHistory;
