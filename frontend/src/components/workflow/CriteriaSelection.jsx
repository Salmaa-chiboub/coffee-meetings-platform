import React, { useState, useEffect } from 'react';
import { 
  Cog6ToothIcon, 
  PlusIcon, 
  XMarkIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { matchingService } from '../../services/matchingService';
import { WORKFLOW_STEPS } from '../../services/workflowService';

const CriteriaSelection = ({ campaignId, onComplete, onError }) => {
  const [availableAttributes, setAvailableAttributes] = useState([]);
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load available attributes
  useEffect(() => {
    const loadAttributes = async () => {
      try {
        setLoading(true);
        const attributes = await matchingService.getAvailableAttributes(campaignId);
        setAvailableAttributes(attributes);
      } catch (error) {
        onError(error.message || 'Failed to load employee attributes');
      } finally {
        setLoading(false);
      }
    };

    loadAttributes();
  }, [campaignId, onError]);

  // Add new criteria
  const addCriteria = () => {
    if (availableAttributes.length === 0) {
      onError('No employee attributes available for matching criteria');
      return;
    }

    const newCriteria = {
      id: Date.now(),
      attribute_key: availableAttributes[0].key,
      rule: 'not_same'
    };
    
    setSelectedCriteria([...selectedCriteria, newCriteria]);
  };

  // Remove criteria
  const removeCriteria = (criteriaId) => {
    setSelectedCriteria(selectedCriteria.filter(c => c.id !== criteriaId));
  };

  // Update criteria
  const updateCriteria = (criteriaId, field, value) => {
    setSelectedCriteria(selectedCriteria.map(c => 
      c.id === criteriaId ? { ...c, [field]: value } : c
    ));
  };

  // Skip criteria (proceed with random matching)
  const handleSkipCriteria = async () => {
    try {
      setSaving(true);
      
      await onComplete(WORKFLOW_STEPS.DEFINE_CRITERIA, {
        criteria: [],
        matching_type: 'random',
        skipped: true,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      onError(error.message || 'Failed to skip criteria selection');
    } finally {
      setSaving(false);
    }
  };

  // Save criteria
  const handleSaveCriteria = async () => {
    try {
      setSaving(true);

      console.log('🔍 DEBUG: Starting to save criteria');
      console.log('Campaign ID:', campaignId);
      console.log('Selected Criteria:', selectedCriteria);

      // Validate criteria
      if (selectedCriteria.length === 0) {
        onError('Please add at least one matching criteria or skip this step');
        return;
      }

      // Save criteria to backend
      const criteriaData = selectedCriteria.map(c => ({
        attribute_key: c.attribute_key,
        rule: c.rule
      }));

      console.log('🔍 DEBUG: Criteria data to send:', criteriaData);
      console.log('🔍 DEBUG: Access token:', localStorage.getItem('access_token'));

      await matchingService.saveCriteria(campaignId, criteriaData);
      
      await onComplete(WORKFLOW_STEPS.DEFINE_CRITERIA, {
        criteria: criteriaData,
        matching_type: 'criteria_based',
        criteria_count: criteriaData.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      onError(error.message || 'Failed to save matching criteria');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8B6F47]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl border border-warmGray-200 p-8 shadow-md">
          {/* Header */}
          <div className="text-center mb-6">
            <Cog6ToothIcon className="h-12 w-12 text-[#E8C4A0] mx-auto mb-3" />
            <h2 className="text-xl font-bold text-warmGray-800 mb-2">
              Matching Criteria Configuration
            </h2>
            <p className="text-warmGray-600 text-sm mb-4">
              Configure pairing rules based on employee attributes
            </p>

            {/* Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left">
              <div className="flex items-start space-x-2">
                <InformationCircleIcon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <span className="font-medium">Optional:</span> Configure specific matching criteria or skip for random pairing.
                </div>
              </div>
            </div>
          </div>

          {/* Criteria List */}
          <div className="space-y-4 mb-6">
            {selectedCriteria.map((criteria, index) => (
              <div key={criteria.id} className="bg-warmGray-50 border border-warmGray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-[#E8C4A0] rounded-full flex items-center justify-center">
                      <span className="text-xs font-bold text-[#8B6F47]">{index + 1}</span>
                    </div>
                    <span className="text-sm font-medium text-warmGray-700">
                      Rule:
                    </span>
                  </div>

                  {/* Attribute Selection */}
                  <select
                    value={criteria.attribute_key}
                    onChange={(e) => updateCriteria(criteria.id, 'attribute_key', e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-warmGray-300 rounded-lg text-sm focus:outline-none focus:border-[#E8C4A0] focus:ring-1 focus:ring-[#E8C4A0]"
                  >
                    {availableAttributes.map((attr) => (
                      <option key={attr.key} value={attr.key}>
                        {attr.display_name || attr.key}
                      </option>
                    ))}
                  </select>

                  <span className="text-sm text-warmGray-600 font-medium">must be</span>

                  {/* Rule Selection */}
                  <select
                    value={criteria.rule}
                    onChange={(e) => updateCriteria(criteria.id, 'rule', e.target.value)}
                    className="px-3 py-2 bg-white border border-warmGray-300 rounded-lg text-sm focus:outline-none focus:border-[#E8C4A0] focus:ring-1 focus:ring-[#E8C4A0]"
                  >
                    <option value="not_same">Different values</option>
                    <option value="same">Same values</option>
                  </select>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeCriteria(criteria.id)}
                    className="p-2 text-warmGray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                  >
                    <XMarkIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

            {/* Add Criteria Button */}
            {availableAttributes.length > 0 && (
              <button
                onClick={addCriteria}
                className="w-full border-2 border-dashed border-[#E8C4A0] hover:border-[#DDB892] bg-[#E8C4A0]/5 hover:bg-[#E8C4A0]/10 rounded-lg p-4 text-[#8B6F47] hover:text-[#8B6F47] transition-all duration-200 flex items-center justify-center space-x-2 font-medium"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Matching Criterion</span>
              </button>
            )}
          </div>

          {/* No Attributes Available */}
          {availableAttributes.length === 0 && (
            <div className="text-center py-8 bg-warmGray-50 rounded-lg">
              <Cog6ToothIcon className="h-12 w-12 text-warmGray-400 mx-auto mb-4" />
              <p className="text-warmGray-600 mb-2 font-medium">
                No employee attributes available
              </p>
              <p className="text-sm text-warmGray-500">
                Employees will be paired randomly when you proceed.
              </p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center space-x-4 pt-6 border-t border-warmGray-100">
            <button
              onClick={handleSkipCriteria}
              disabled={saving}
              className="px-6 py-3 border-2 border-warmGray-300 hover:border-warmGray-400 text-warmGray-600 hover:text-warmGray-700 font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
            >
              Skip (Random Pairing)
            </button>

            {selectedCriteria.length > 0 && (
              <button
                onClick={handleSaveCriteria}
                disabled={saving}
                className="px-6 py-3 bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:transform-none shadow-sm"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B6F47]"></div>
                    <span>Applying...</span>
                  </div>
                ) : (
                  'Apply Criteria'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CriteriaSelection;
