import React, { useState, useEffect, useMemo } from 'react';
import { historyService } from '../services/historyService';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
import { Line, Doughnut, Bar } from 'react-chartjs-2';
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

      const doc = new jsPDF();

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Ligne de séparation en haut (couleur peach professionnelle)
      doc.setFillColor(233, 109, 42); // Couleur peach-500
      doc.rect(0, 0, pageWidth, 5, 'F');

      // En-tête du document avec style professionnel
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(26, 32, 44); // Couleur sombre professionnelle
      doc.text('RAPPORT D\'HISTORIQUE GLOBAL', pageWidth / 2, 22, { align: 'center' });

      // Sous-titre élégant
      doc.setFontSize(14);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(74, 85, 104);
      doc.text('Analyse Complète des Campagnes Coffee Meetings', pageWidth / 2, 32, { align: 'center' });

      // Date de génération avec style
      const today = new Date();
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(128, 128, 128);
      const dateStr = `Rapport généré le ${today.toLocaleDateString('fr-FR')} à ${today.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`;
      doc.text(dateStr, pageWidth / 2, 42, { align: 'center' });

      // Ligne de séparation élégante
      doc.setLineWidth(0.5);
      doc.setDrawColor(226, 232, 240);
      doc.line(20, 48, pageWidth - 20, 48);

      let yPos = 58;

      // Section statistiques avec encadré professionnel
      if (data?.statistics) {
        // Encadré pour les statistiques
        doc.setFillColor(248, 250, 252); // Couleur de fond gris très clair
        doc.setDrawColor(226, 232, 240); // Bordure grise
        doc.setLineWidth(0.5);
        doc.roundedRect(20, yPos - 5, pageWidth - 40, 35, 3, 3, 'FD');

        // Titre section statistiques
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 55, 72);
        doc.text('STATISTIQUES GÉNÉRALES', 25, yPos + 5);
        yPos += 15;

        const stats = data.statistics;

        // Statistiques en colonnes pour un look plus professionnel
        doc.setFontSize(11);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(74, 85, 104);

        // Colonne gauche
        doc.setFont('helvetica', 'bold');
        doc.text('Total Paires:', 25, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${stats.total_pairs ?? 0}`, 70, yPos);

        // Colonne centre
        doc.setFont('helvetica', 'bold');
        doc.text('Total Évaluations:', 110, yPos);
        doc.setFont('helvetica', 'normal');
        doc.text(`${stats.total_evaluations ?? 0}`, 170, yPos);

        yPos += 8;

        // Note globale avec mise en évidence
        doc.setFont('helvetica', 'bold');
        doc.text('Note Globale Moyenne:', 25, yPos);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(233, 109, 42); // Couleur peach pour la note
        doc.text(`${stats.overall_rating ? Number(stats.overall_rating).toFixed(1) : '0.0'}/5 ⭐`, 85, yPos);

        yPos += 25;
      }


      // Vérifier si on a besoin d'une nouvelle page
      if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = 20;
      }

      // Tableau des campagnes avec titre professionnel
      if (data?.campaigns && data.campaigns.length > 0) {
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(45, 55, 72);
        doc.text('DÉTAIL DES CAMPAGNES', 20, yPos);
        yPos += 5;

        // Ligne de séparation sous le titre
        doc.setLineWidth(0.5);
        doc.setDrawColor(233, 109, 42); // Couleur peach
        doc.line(20, yPos, pageWidth - 20, yPos);
        yPos += 10;

        // Préparer les données du tableau
        const tableData = data.campaigns.map(campaign => [
          campaign.title || '',
          campaign.status || '',
          campaign.start_date || '',
          campaign.end_date || 'En cours',
          String(campaign.participants ?? 0),
          String(campaign.pairs ?? 0),
          String(campaign.evaluations ?? 0),
          campaign.average_rating ? Number(campaign.average_rating).toFixed(1) : '0.0',
          campaign.response_rate ? `${Number(campaign.response_rate).toFixed(1)}%` : '0.0%'
        ]);

        // Générer le tableau
        autoTable(doc, {
          startY: yPos,
          head: [['Titre', 'Statut', 'Début', 'Fin', 'Participants', 'Paires', 'Évaluations', 'Note', 'Taux']],
          body: tableData,
          styles: {
            fontSize: 9,
            cellPadding: 3,
          },
          headStyles: {
            fillColor: [232, 196, 160], // Couleur peach
            textColor: [60, 60, 60],
            fontStyle: 'bold',
          },
          alternateRowStyles: {
            fillColor: [248, 248, 248]
          },
          columnStyles: {
            0: { cellWidth: 'auto' }, // Titre
            1: { cellWidth: 25 },      // Statut
            2: { cellWidth: 20 },      // Début
            3: { cellWidth: 20 },      // Fin
            4: { cellWidth: 15 },      // Participants
            5: { cellWidth: 15 },      // Paires
            6: { cellWidth: 15 },      // Évaluations
            7: { cellWidth: 15 },      // Note
            8: { cellWidth: 15 },      // Taux
          },
          margin: { left: 20, right: 20 },
        });
      }

      // Pied de page professionnel
      const totalPages = doc.internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);

        // Ligne de séparation en bas
        doc.setFillColor(233, 109, 42); // Couleur peach-500
        doc.rect(0, pageHeight - 15, pageWidth, 2, 'F');

        // Numérotation des pages
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(74, 85, 104);
        doc.text(`Page ${i} sur ${totalPages}`, pageWidth / 2, pageHeight - 8, { align: 'center' });

        // Nom de l'entreprise/plateforme
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(128, 128, 128);
        doc.text('Coffee Meetings Platform - Rapport Confidentiel', 20, pageHeight - 8);
      }

      // Télécharger le fichier
      const fileName = `historique-global-${today.toISOString().split('T')[0]}.pdf`;
      doc.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Erreur lors de la génération du PDF. Veuillez réessayer.');
    } finally {
      setExportLoading(false);
    }
  };

  const statisticsCards = useMemo(() => {
    console.log('🔍 DEBUG: Toute la réponse API:', data);
    console.log('🔍 DEBUG: statistics existe?', !!data?.statistics);
    console.log('🔍 DEBUG: campaigns existe?', !!data?.campaigns);
    console.log('🔍 DEBUG: rating_distribution existe?', !!data?.statistics?.rating_distribution);

    if (!data?.statistics) {
      console.log('❌ statistics pas trouvé, aucune carte ne sera affichée');
      return [];
    }

    const stats = data.statistics;
    console.log('📊 DEBUG: statistics:', stats);

    return [
      {
        title: 'Total Paires',
        value: stats.total_pairs ?? 0,
        icon: ArrowTrendingUpIcon,
        description: 'Paires générées au total'
      },
      {
        title: 'Total Évaluations',
        value: stats.total_evaluations ?? 0,
        icon: ChartBarIcon,
        description: 'Évaluations complétées'
      },
      {
        title: 'Note Globale',
        value: `${stats.overall_rating ? Number(stats.overall_rating).toFixed(1) : '0.0'}/5`,
        icon: StarIcon,
        description: 'Note moyenne générale'
      },
      {
        title: 'Taux de Réponse',
        value: `${stats.response_rate ? Number(stats.response_rate).toFixed(1) : '0.0'}%`,
        icon: UserGroupIcon,
        description: 'Taux de participation'
      }
    ];
  }, [data]);

  const chartData = useMemo(() => {
    if (!data?.statistics) return null;

    const stats = data.statistics;
    // Utiliser le response_rate directement de l'API
    const currentPerformance = {
      response_rate: stats.response_rate ?? 0,
      overall_rating: stats.overall_rating ?? 0
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
            'rgba(226, 232, 240, 0.6)'  // Gris tr��s clair pour l'espace restant
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
      ratingDistribution: {
        labels: stats.rating_distribution?.map(item => `${item.rating ?? 0} étoile${(item.rating ?? 0) > 1 ? 's' : ''}`) || [],
        datasets: [{
          label: 'Nombre d\'évaluations',
          data: stats.rating_distribution?.map(item => item.count ?? 0) || [],
          backgroundColor: [
            'rgba(248, 113, 113, 0.8)', // Rouge pour 1 étoile
            'rgba(251, 146, 60, 0.8)',  // Orange pour 2 étoiles
            'rgba(250, 204, 21, 0.8)',  // Jaune pour 3 étoiles
            'rgba(34, 197, 94, 0.8)',   // Vert clair pour 4 étoiles
            'rgba(16, 185, 129, 0.8)'   // Vert foncé pour 5 étoiles
          ],
          borderColor: [
            '#ef4444',
            '#fb7c00',
            '#eab308',
            '#22c55e',
            '#10b981'
          ],
          borderWidth: 2,
          borderRadius: 6,
          borderSkipped: false,
        }]
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
            <div className="mt-6 md:mt-0">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
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

              {/* Graphique de distribution des notes */}
              <Card className="border-0 shadow-2xl bg-gradient-to-br from-emerald-50 via-white to-green-50 hover:shadow-3xl transition-all duration-500">
                <div className="p-8">
                  <div className="flex items-center mb-6">
                    <div className="p-3 bg-gradient-to-r from-emerald-100 to-green-100 rounded-xl mr-4 shadow-lg">
                      <StarIcon className="h-7 w-7 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-800">Distribution des Notes</h3>
                      <p className="text-sm text-gray-500">Répartition des évaluations</p>
                    </div>
                  </div>
                  <div className="h-80 relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-transparent to-emerald-50 rounded-lg opacity-20"></div>
                    {chartData.ratingDistribution && (
                      <Bar
                        data={chartData.ratingDistribution}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          animation: {
                            duration: 2000,
                            easing: 'easeInOutQuart',
                            delay: (context) => context.dataIndex * 200
                          },
                          plugins: {
                            legend: {
                              display: false
                            },
                            tooltip: {
                              backgroundColor: 'rgba(30, 41, 59, 0.95)',
                              titleColor: '#f1f5f9',
                              bodyColor: '#e2e8f0',
                              borderColor: '#10b981',
                              borderWidth: 2,
                              cornerRadius: 12,
                              padding: 12,
                              titleFont: { size: 14, weight: 'bold' },
                              bodyFont: { size: 13 },
                              callbacks: {
                                label: (context) => {
                                  const value = context.parsed.y;
                                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                  const percentage = ((value / total) * 100).toFixed(1);
                                  return `${value} évaluations (${percentage}%)`;
                                }
                              }
                            }
                          },
                          scales: {
                            y: {
                              beginAtZero: true,
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
                            x: {
                              title: {
                                display: true,
                                text: 'Note attribuée',
                                color: '#6b7280',
                                font: { size: 13, weight: '600' }
                              },
                              grid: {
                                color: 'rgba(148, 163, 184, 0.05)',
                                drawBorder: false
                              },
                              ticks: {
                                color: '#6b7280',
                                font: { size: 11 }
                              }
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
                        {campaign.end_date || 'En cours'}
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center text-sm text-warmGray-900 font-medium">
                          <UserGroupIcon className="h-4 w-4 mr-1 text-warmGray-500" />
                          {campaign.participants ?? 0}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm text-warmGray-900 font-medium">
                        {campaign.pairs ?? 0}
                      </td>
                      <td className="px-6 py-5 text-sm text-warmGray-900 font-medium">
                        {campaign.evaluations ?? 0}
                      </td>
                      <td className="px-6 py-5">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getRatingColor(campaign.average_rating ?? 0)}`}>
                          <StarIcon className="h-3 w-3 mr-1" />
                          {campaign.average_rating ? Number(campaign.average_rating).toFixed(1) : '0.0'}/5
                        </span>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center">
                          <div className="w-16 bg-warmGray-200 rounded-full h-2 mr-3">
                            <div
                              className="bg-gradient-to-r from-peach-400 to-peach-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${campaign.response_rate ?? 0}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-warmGray-700">
                            {campaign.response_rate ?? 0}%
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
                Affichage de <span className="font-medium text-warmGray-800">{((data.pagination.current_page ?? 1) - 1) * (data.pagination.page_size ?? 10) + 1}</span> à{' '}
                <span className="font-medium text-warmGray-800">
                  {Math.min((data.pagination.current_page ?? 1) * (data.pagination.page_size ?? 10), data.pagination.total_items ?? 0)}
                </span> sur{' '}
                <span className="font-medium text-warmGray-800">{data.pagination.total_items ?? 0}</span> résultats
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={(data.pagination.current_page ?? 1) === 1}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    (data.pagination.current_page ?? 1) === 1 
                      ? 'bg-warmGray-100 text-warmGray-400 border-warmGray-200 cursor-not-allowed' 
                      : 'bg-white text-warmGray-700 border-warmGray-300 hover:bg-peach-50 hover:border-peach-300 hover:text-peach-700'
                  }`}
                >
                  Précédent
                </button>
                
                <div className="flex items-center space-x-1">
                  {[...Array(Math.min(5, data.pagination.total_pages ?? 1))].map((_, i) => {
                    const pageNum = i + 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-10 h-10 text-sm font-medium rounded-lg transition-all duration-200 ${
                          (data.pagination.current_page ?? 1) === pageNum
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
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, data.pagination.total_pages ?? 1))}
                  disabled={(data.pagination.current_page ?? 1) === (data.pagination.total_pages ?? 1)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                    (data.pagination.current_page ?? 1) === (data.pagination.total_pages ?? 1)
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
