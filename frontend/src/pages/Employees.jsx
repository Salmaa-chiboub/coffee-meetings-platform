import React, { useState, useMemo, useEffect } from 'react';
import {
  UserGroupIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  UserIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { useEmployees } from '../hooks/useEmployees';
import { useCampaigns } from '../hooks/useCampaigns';
import { useAuth } from '../contexts/AuthContext';
import Pagination from '../components/ui/Pagination';

const Employees = () => {
  const { user, isAuthenticated } = useAuth();

  // State for filters and pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 6; // Selon vos préférences mémoire

  // Debug authentication
  useEffect(() => {
    console.log('🔍 Auth Debug:', {
      user,
      isAuthenticated,
      accessToken: localStorage.getItem('access_token'),
      refreshToken: localStorage.getItem('refresh_token')
    });
  }, [user, isAuthenticated]);

  // Fetch campaigns for filter dropdown
  const { data: campaignsResponse } = useCampaigns({ page_size: 1000 });
  const campaigns = campaignsResponse?.data || [];

  // Debug campaigns
  console.log('🔍 Campaigns Debug:', {
    campaignsResponse,
    campaigns: campaigns.length
  });

  // Helper function to get campaign name
  const getCampaignName = (campaignId) => {
    const campaign = campaigns.find(c => c.id === campaignId);
    return campaign?.title || 'Campagne Inconnue';
  };

  // Prepare query parameters for employees
  const queryParams = useMemo(() => ({
    page: 1,
    page_size: 1000, // Récupérer tous pour pagination côté client
    search: '', // On filtre côté client
    ...(selectedCampaign && { campaign: selectedCampaign })
  }), [selectedCampaign]);

  const { data: employeesResponse, isLoading, error } = useEmployees(queryParams);

  // Debug logging
  console.log('🔍 Employees Debug:', {
    queryParams,
    employeesResponse,
    isLoading,
    error
  });

  const employees = employeesResponse?.results || employeesResponse || [];

  // Group employees by email to avoid duplicates and filter
  const uniqueEmployees = useMemo(() => {
    if (!employees) return [];

    // Group employees by email
    const employeeMap = new Map();

    employees.forEach(employee => {
      const email = employee.email;
      if (employeeMap.has(email)) {
        // Add campaign to existing employee
        const existing = employeeMap.get(email);
        existing.campaigns.push({
          id: employee.campaign,
          name: getCampaignName(employee.campaign)
        });
        // Merge attributes if any
        if (employee.attributes_dict) {
          existing.attributes_dict = { ...existing.attributes_dict, ...employee.attributes_dict };
        }
      } else {
        // Create new unique employee entry
        employeeMap.set(email, {
          ...employee,
          campaigns: [{
            id: employee.campaign,
            name: getCampaignName(employee.campaign)
          }],
          attributes_dict: employee.attributes_dict || {}
        });
      }
    });

    return Array.from(employeeMap.values());
  }, [employees, campaigns]);

  // Client-side filtering
  const filteredEmployees = useMemo(() => {
    return uniqueEmployees.filter(employee => {
      const matchesSearch = !searchTerm ||
        employee.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        employee.email?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCampaign = !selectedCampaign ||
        employee.campaigns.some(campaign => campaign.id.toString() === selectedCampaign);

      return matchesSearch && matchesCampaign;
    });
  }, [uniqueEmployees, searchTerm, selectedCampaign]);

  // Pagination calculations
  const totalItems = filteredEmployees.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedEmployees = filteredEmployees.slice(startIndex, startIndex + pageSize);

  // Handlers
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page
  };

  const handleCampaignFilter = (e) => {
    setSelectedCampaign(e.target.value);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };



  const formatDate = (dateString) => {
    if (!dateString) return 'N/D';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (error) {
    const isAuthError = error?.status === 403 || error?.status === 401 ||
                       (typeof error === 'string' && error.includes('403')) ||
                       (typeof error === 'string' && error.includes('401'));

    return (
      <div className="max-w-7xl mx-auto">
        <div className={`border-2 rounded-xl p-6 ${
          isAuthError ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center justify-center mb-4">
            <ExclamationTriangleIcon className={`h-8 w-8 ${
              isAuthError ? 'text-amber-500' : 'text-red-500'
            }`} />
          </div>

          <div className="text-center">
            <h3 className={`text-lg font-medium mb-2 ${
              isAuthError ? 'text-amber-800' : 'text-red-800'
            }`}>
              {isAuthError ? '🔐 Authentification Requise' : '⚠️ Erreur de Chargement des Employés'}
            </h3>

            <div className={`text-sm mb-4 ${
              isAuthError ? 'text-amber-600' : 'text-red-500'
            }`}>
              {isAuthError
                ? 'Vous devez être connecté pour voir les données des employés'
                : error.message || JSON.stringify(error) || 'Quelque chose s\'est mal passé'
              }
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Authentication Status:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• User: {user ? `✅ ${user.email}` : '❌ Not logged in'}</li>
                  <li>• Access Token: {localStorage.getItem('access_token') ? '✅ Present' : '❌ Missing'}</li>
                  <li>• Refresh Token: {localStorage.getItem('refresh_token') ? '✅ Present' : '❌ Missing'}</li>
                </ul>
              </div>

              <div className="bg-white p-4 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Backend Status:</h4>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>• API URL: {process.env.REACT_APP_API_URL || 'http://localhost:8000'}</li>
                  <li>• Point de terminaison: GET /employees/</li>
                  <li>• Attendu: 200 OK avec données employés</li>
                  <li>• Actuel: {error?.status || 'Erreur réseau'}</li>
                </ul>
              </div>
            </div>

            {isAuthError && (
              <div className="mt-4">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="bg-amber-500 hover:bg-amber-600 text-white font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Go to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Compact Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-warmGray-800">Employés</h1>
          <p className="text-sm text-warmGray-600 mt-1">
            {totalItems} employé{totalItems !== 1 ? 's' : ''} au total
          </p>
        </div>
      </div>

      {/* Compact Search & Filter */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl shadow-sm border border-warmGray-200/50 p-6">
        <div className="flex flex-col lg:flex-row gap-8 items-end">
          {/* Compact Search Field */}
          <div className="relative flex-1">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-4 w-4 text-warmGray-400" />
              </div>
              <input
                type="text"
                placeholder="Rechercher des membres par nom ou email..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full pl-10 pr-3 py-2.5 bg-white/90 border-2 border-warmGray-300 rounded-xl text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-[#E8C4A0] focus:ring-2 focus:ring-[#E8C4A0]/20 transition-all duration-200 text-sm shadow-sm"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center group"
                >
                  <div className="w-5 h-5 bg-warmGray-200 group-hover:bg-warmGray-300 rounded-full flex items-center justify-center transition-colors">
                    <span className="text-warmGray-600 text-xs">✕</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Large Gap Separator */}
          <div className="hidden lg:block w-px h-8 bg-warmGray-200"></div>

          {/* Compact Campaign Filter */}
          <div className="relative lg:w-64">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-4 w-4 text-warmGray-400" />
              </div>
              <select
                value={selectedCampaign}
                onChange={handleCampaignFilter}
                className="w-full pl-10 pr-8 py-2.5 bg-white/90 border-2 border-warmGray-300 rounded-xl text-warmGray-800 focus:outline-none focus:border-[#E8C4A0] focus:ring-2 focus:ring-[#E8C4A0]/20 transition-all duration-200 appearance-none text-sm shadow-sm"
              >
                <option value="">Choisir une Campagne</option>
                {campaigns.map(campaign => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.title}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="h-4 w-4 text-warmGray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Inline Results Counter */}
          {(searchTerm || selectedCampaign) && (
            <div className="lg:ml-4">
              <div className="inline-flex items-center px-3 py-2 bg-gradient-to-r from-[#E8C4A0]/20 to-[#DDB892]/20 rounded-lg border border-[#E8C4A0]/30">
                <div className="w-1.5 h-1.5 bg-[#8B6F47] rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs text-[#8B6F47] font-semibold whitespace-nowrap">
                  {filteredEmployees.length} trouvé{filteredEmployees.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Compact Employees Table */}
      <div className="bg-white rounded-xl shadow-sm border border-warmGray-200 overflow-hidden">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#E8C4A0] border-t-transparent mx-auto mb-3"></div>
            <div className="text-warmGray-600 text-sm">Chargement des employés...</div>
          </div>
        ) : paginatedEmployees.length === 0 ? (
          <div className="text-center py-12">
            <UserGroupIcon className="h-12 w-12 text-warmGray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-warmGray-800 mb-1">
              {searchTerm || selectedCampaign ? 'Aucun employé trouvé' : 'Aucune donnée d\'employé'}
            </h3>
            <p className="text-warmGray-600 text-sm mb-4">
              {searchTerm || selectedCampaign
                ? 'Essayez d\'ajuster vos critères de recherche ou de filtre'
                : 'Les employés apparaîtront ici une fois qu\'ils seront importés dans les campagnes'
              }
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
              <h4 className="text-sm font-medium text-blue-800 mb-2">Comment ajouter des employés :</h4>
              <ol className="text-xs text-blue-700 space-y-1 text-left">
                <li>1. Créer une campagne</li>
                <li>2. Aller au workflow de campagne</li>
                <li>3. Télécharger un fichier Excel avec les données des employés</li>
                <li>4. Les employés apparaîtront ici automatiquement</li>
              </ol>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              {/* Compact Table Header */}
              <thead>
                <tr className="bg-warmGray-50/50 border-b border-warmGray-200">
                  <th className="text-left py-3 px-4 font-medium text-warmGray-600 text-xs uppercase tracking-wide">
                    Membre
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-warmGray-600 text-xs uppercase tracking-wide">
                    Email
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-warmGray-600 text-xs uppercase tracking-wide">
                    Date d'Arrivée
                  </th>
                </tr>
              </thead>

              {/* Compact Table Body */}
              <tbody className="divide-y divide-warmGray-100">
                {paginatedEmployees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className="hover:bg-warmGray-50/50 transition-colors duration-150"
                  >
                    {/* Member */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-[#E8C4A0] to-[#DDB892] flex items-center justify-center flex-shrink-0">
                          <UserIcon className="w-4 h-4 text-[#8B6F47]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-warmGray-900 text-sm truncate">
                            {employee.name || 'N/D'}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            {Object.keys(employee.attributes_dict || {}).length > 0 && (
                              <span className="text-xs text-warmGray-500">
                                +{Object.keys(employee.attributes_dict).length} attributs
                              </span>
                            )}
                            <span className="text-xs text-blue-600">
                              {employee.campaigns.length} campagne{employee.campaigns.length !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="py-3 px-4">
                      <span className="text-warmGray-700 text-sm">
                        {employee.email || 'N/D'}
                      </span>
                    </td>

                    {/* Join Date */}
                    <td className="py-3 px-4">
                      <span className="text-warmGray-600 text-sm">
                        {formatDate(employee.arrival_date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>


      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </div>
  );
};

export default Employees;
