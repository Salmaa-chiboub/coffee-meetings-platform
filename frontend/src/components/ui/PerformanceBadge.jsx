import React from 'react';
import { 
  StarIcon, 
  FireIcon, 
  CheckCircleIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/solid';

const PerformanceBadge = ({ campaign }) => {
  // Calculer le score de performance basé sur les métriques disponibles
  const calculatePerformanceScore = () => {
    let score = 0;
    let factors = 0;

    // Facteur 1: Nombre de participants (plus = mieux)
    if (campaign.participants_count) {
      factors++;
      if (campaign.participants_count >= 50) score += 30;
      else if (campaign.participants_count >= 20) score += 20;
      else if (campaign.participants_count >= 10) score += 10;
    }

    // Facteur 2: Ratio paires/participants (idéalement ~0.5)
    if (campaign.participants_count && campaign.total_pairs) {
      factors++;
      const ratio = campaign.total_pairs / campaign.participants_count;
      if (ratio >= 0.4 && ratio <= 0.6) score += 25;
      else if (ratio >= 0.3 && ratio <= 0.7) score += 15;
      else score += 5;
    }

    // Facteur 3: Nombre de critères utilisés (plus = mieux)
    if (campaign.total_criteria) {
      factors++;
      if (campaign.total_criteria >= 5) score += 25;
      else if (campaign.total_criteria >= 3) score += 15;
      else if (campaign.total_criteria >= 1) score += 10;
    }

    // Facteur 4: Durée de la campagne (ni trop courte, ni trop longue)
    if (campaign.start_date && campaign.end_date) {
      factors++;
      const start = new Date(campaign.start_date);
      const end = new Date(campaign.end_date);
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      
      if (days >= 14 && days <= 30) score += 20;
      else if (days >= 7 && days <= 45) score += 10;
      else score += 5;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  };

  const score = calculatePerformanceScore();

  // Déterminer le niveau de performance
  const getPerformanceLevel = () => {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'average';
    return 'poor';
  };

  const level = getPerformanceLevel();

  // Configuration des badges
  const badgeConfig = {
    excellent: {
      icon: StarIcon,
      text: 'Excellent',
      bgColor: 'bg-yellow-100',
      textColor: 'text-yellow-800',
      iconColor: 'text-yellow-600'
    },
    good: {
      icon: FireIcon,
      text: 'Good',
      bgColor: 'bg-green-100',
      textColor: 'text-green-800',
      iconColor: 'text-green-600'
    },
    average: {
      icon: CheckCircleIcon,
      text: 'Average',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
      iconColor: 'text-blue-600'
    },
    poor: {
      icon: ExclamationTriangleIcon,
      text: 'Needs Improvement',
      bgColor: 'bg-orange-100',
      textColor: 'text-orange-800',
      iconColor: 'text-orange-600'
    }
  };

  const config = badgeConfig[level];
  const IconComponent = config.icon;

  return (
    <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor}`}>
      <IconComponent className={`h-3 w-3 mr-1 ${config.iconColor}`} />
      <span>{config.text}</span>
      <span className="ml-1 opacity-75">({score}%)</span>
    </div>
  );
};

export default PerformanceBadge;
