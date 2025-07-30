import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, CalendarDaysIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useCreateCampaign } from '../hooks/useCampaigns';

const CampaignCreate = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const createCampaignMutation = useCreateCampaign();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm();

  const startDate = watch('start_date');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      console.log('🔍 DEBUG: Creating campaign with data:', data);
      const newCampaign = await createCampaignMutation.mutateAsync(data);
      console.log('✅ DEBUG: Campaign created successfully:', newCampaign);
      console.log('🔍 DEBUG: Navigating to workflow:', `/campaigns/${newCampaign.id}/workflow`);
      // Navigate to workflow page on success
      navigate(`/campaigns/${newCampaign.id}/workflow`);
    } catch (error) {
      console.error('❌ DEBUG: Campaign creation failed:', error);
      // Handle validation errors from backend
      if (error.end_date) {
        setError('end_date', {
          type: 'manual',
          message: error.end_date[0] || 'Invalid end date',
        });
      } else if (error.start_date) {
        setError('start_date', {
          type: 'manual',
          message: error.start_date[0] || 'Invalid start date',
        });
      } else {
        setError('root', {
          type: 'manual',
          message: error.message || 'Failed to create campaign. Please try again.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate('/campaigns');
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={handleBack}
          className="flex items-center space-x-2 text-warmGray-600 hover:text-warmGray-800 transition-colors duration-200 mb-4"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          <span>Back to Campaigns</span>
        </button>
        
        <h1 className="text-4xl font-bold text-warmGray-800">
          Create New Campaign
        </h1>
        <p className="text-warmGray-600 mt-2">
          Set up a new coffee meeting campaign for your employees
        </p>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Title Field */}
          <div className="relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <DocumentTextIcon className="h-5 w-5 text-warmGray-400" />
              </div>
              <input
                {...register('title', {
                  required: 'Campaign title is required',
                  maxLength: {
                    value: 100,
                    message: 'Title must be less than 100 characters',
                  },
                })}
                type="text"
                placeholder="Enter campaign title"
                className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
              />
              <label className="absolute -top-3 left-6 bg-white px-2 text-sm font-medium text-warmGray-600">
                Campaign Title *
              </label>
            </div>
            {errors.title && (
              <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Description Field */}
          <div className="relative">
            <textarea
              {...register('description')}
              placeholder="Enter campaign description (optional)"
              rows={4}
              className="w-full px-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-2xl text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200 resize-none"
            />
            <label className="absolute -top-3 left-6 bg-white px-2 text-sm font-medium text-warmGray-600">
              Description
            </label>
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
            )}
          </div>

          {/* Date Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CalendarDaysIcon className="h-5 w-5 text-warmGray-400" />
                </div>
                <input
                  {...register('start_date', {
                    required: 'Start date is required',
                    validate: (value) => {
                      const today = new Date();
                      const selectedDate = new Date(value);
                      today.setHours(0, 0, 0, 0);
                      selectedDate.setHours(0, 0, 0, 0);
                      
                      if (selectedDate < today) {
                        return 'Start date cannot be in the past';
                      }
                      return true;
                    },
                  })}
                  type="date"
                  className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                />
                <label className="absolute -top-3 left-6 bg-white px-2 text-sm font-medium text-warmGray-600">
                  Start Date *
                </label>
              </div>
              {errors.start_date && (
                <p className="text-red-500 text-sm mt-1">{errors.start_date.message}</p>
              )}
            </div>

            {/* End Date */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <CalendarDaysIcon className="h-5 w-5 text-warmGray-400" />
                </div>
                <input
                  {...register('end_date', {
                    required: 'End date is required',
                    validate: (value) => {
                      if (!startDate) return true;
                      
                      const start = new Date(startDate);
                      const end = new Date(value);
                      
                      if (end <= start) {
                        return 'End date must be after start date';
                      }
                      return true;
                    },
                  })}
                  type="date"
                  className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                />
                <label className="absolute -top-3 left-6 bg-white px-2 text-sm font-medium text-warmGray-600">
                  End Date *
                </label>
              </div>
              {errors.end_date && (
                <p className="text-red-500 text-sm mt-1">{errors.end_date.message}</p>
              )}
            </div>
          </div>

          {/* Error Message */}
          {errors.root && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-red-600 text-sm">{errors.root.message}</p>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4 pt-6">
            <button
              type="button"
              onClick={handleBack}
              className="flex-1 border-2 border-warmGray-400 hover:border-warmGray-600 text-warmGray-600 hover:text-warmGray-800 font-medium py-4 px-6 rounded-full transition-all duration-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B6F47] mr-2"></div>
                  Creating...
                </div>
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CampaignCreate;
