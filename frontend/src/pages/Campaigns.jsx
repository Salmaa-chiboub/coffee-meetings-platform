import React from 'react';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

const Campaigns = () => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-warmGray-800">
            Coffee Meeting Campaigns
          </h1>
          <p className="text-warmGray-600 mt-2">
            Create and manage coffee meeting campaigns for your employees
          </p>
        </div>
      </div>

      {/* Coming Soon Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <CalendarDaysIcon className="h-16 w-16 text-[#E8C4A0] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-warmGray-800 mb-2">
          Employee Coffee Meeting Campaigns
        </h2>
        <p className="text-warmGray-600 mb-6">
          Organize coffee meetings between employees to foster collaboration and team building:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-[#E8C4A0] rounded-full flex items-center justify-center">
              <span className="text-[#8B6F47] text-sm">✓</span>
            </div>
            <span className="text-warmGray-700">Create employee coffee meeting campaigns</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-[#E8C4A0] rounded-full flex items-center justify-center">
              <span className="text-[#8B6F47] text-sm">✓</span>
            </div>
            <span className="text-warmGray-700">Set matching criteria for employees</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-[#E8C4A0] rounded-full flex items-center justify-center">
              <span className="text-[#8B6F47] text-sm">✓</span>
            </div>
            <span className="text-warmGray-700">Track employee participation</span>
          </div>
          <div className="flex items-center space-x-3">
            <div className="w-6 h-6 bg-[#E8C4A0] rounded-full flex items-center justify-center">
              <span className="text-[#8B6F47] text-sm">✓</span>
            </div>
            <span className="text-warmGray-700">Monitor meeting feedback & ratings</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Campaigns;
