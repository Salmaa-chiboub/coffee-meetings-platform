import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ChartBarIcon } from '@heroicons/react/24/outline';

const DashboardSimple = () => {
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-warmGray-800">
            Tableau de Bord des Rencontres Café Employés
          </h1>
          <p className="text-warmGray-600 mt-0.5">
            Bon retour, {user?.name || 'Utilisateur'} ! Organisez et suivez les rencontres café entre vos employés.
          </p>
        </div>
      </div>

      {/* Simple Stats Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <ChartBarIcon className="h-16 w-16 text-[#E8C4A0] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-warmGray-800 mb-2">
          Chargement des Analyses des Rencontres Café...
        </h2>
        <p className="text-warmGray-600 mb-4">
          Votre tableau de bord d'analyses des rencontres café employés est en cours de préparation.
        </p>
        <div className="text-sm text-warmGray-500 bg-warmGray-50 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="font-medium mb-2">🎯 Objectif de la Plateforme :</p>
          <p>En tant que Responsable RH, vous pouvez créer des campagnes de rencontres café pour aider vos employés à se connecter, collaborer et construire des relations entre les départements et équipes.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardSimple;
