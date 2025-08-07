import React from 'react';
import { 
  XMarkIcon, 
  UserIcon, 
  EnvelopeIcon, 
  CalendarDaysIcon,
  TagIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const EmployeeDetailsModal = ({ employee, campaign, onClose }) => {
  if (!employee) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Get attributes from the employee data
  const attributesDict = employee.attributes_dict || {};
  const attributesArray = employee.attributes || [];

  // Use attributes_dict if available, otherwise build from attributes array
  const groupedAttributes = Object.keys(attributesDict).length > 0
    ? attributesDict
    : attributesArray.reduce((acc, attr) => {
        acc[attr.attribute_key] = attr.attribute_value;
        return acc;
      }, {});

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#E8C4A0] to-[#DDB892] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center">
              <UserIcon className="w-7 h-7 text-[#8B6F47]" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#8B6F47]">{employee.name}</h2>
              <p className="text-[#8B6F47]/70">Profil Employé</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-6 h-6 text-[#8B6F47]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Basic Information */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-warmGray-800 mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-[#8B6F47]" />
              Informations de Base
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-warmGray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <UserIcon className="w-4 h-4 text-warmGray-500" />
                  <span className="text-sm font-medium text-warmGray-700">Nom Complet</span>
                </div>
                <p className="text-warmGray-900 font-medium">{employee.name || 'N/D'}</p>
              </div>
              
              <div className="bg-warmGray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <EnvelopeIcon className="w-4 h-4 text-warmGray-500" />
                  <span className="text-sm font-medium text-warmGray-700">Adresse Email</span>
                </div>
                <p className="text-warmGray-900 font-medium break-all">{employee.email || 'N/D'}</p>
              </div>
              
              <div className="bg-warmGray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CalendarDaysIcon className="w-4 h-4 text-warmGray-500" />
                  <span className="text-sm font-medium text-warmGray-700">Date d'Arrivée</span>
                </div>
                <p className="text-warmGray-900 font-medium">{formatDate(employee.arrival_date)}</p>
              </div>
              
              <div className="bg-warmGray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <BuildingOfficeIcon className="w-4 h-4 text-warmGray-500" />
                  <span className="text-sm font-medium text-warmGray-700">Campagne</span>
                </div>
                <p className="text-warmGray-900 font-medium">{campaign?.title || 'Campagne Inconnue'}</p>
              </div>
            </div>
          </div>

          {/* Dynamic Attributes */}
          {Object.keys(groupedAttributes).length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-warmGray-800 mb-4 flex items-center gap-2">
                <TagIcon className="w-5 h-5 text-[#8B6F47]" />
                Additional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(groupedAttributes).map(([key, value]) => (
                  <div key={key} className="bg-warmGray-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TagIcon className="w-4 h-4 text-warmGray-500" />
                      <span className="text-sm font-medium text-warmGray-700 capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-warmGray-900 font-medium">{value || 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Campaign Information */}
          {campaign && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-warmGray-800 mb-4 flex items-center gap-2">
                <BuildingOfficeIcon className="w-5 h-5 text-[#8B6F47]" />
                Détails de la Campagne
              </h3>
              <div className="bg-gradient-to-r from-[#E8C4A0]/10 to-[#DDB892]/10 rounded-lg p-4 border border-[#E8C4A0]/20">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm font-medium text-warmGray-700">Titre de la Campagne</span>
                    <p className="text-warmGray-900 font-medium mt-1">{campaign.title}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-warmGray-700">Description</span>
                    <p className="text-warmGray-900 mt-1">{campaign.description || 'Aucune description disponible'}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-warmGray-700">Date de Début</span>
                    <p className="text-warmGray-900 font-medium mt-1">{formatDate(campaign.start_date)}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-warmGray-700">Date de Fin</span>
                    <p className="text-warmGray-900 font-medium mt-1">{formatDate(campaign.end_date)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-warmGray-50 px-6 py-4 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#8B6F47] hover:bg-[#7A5F3F] text-white rounded-lg font-medium transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetailsModal;
