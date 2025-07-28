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
            Employee Coffee Meeting Dashboard
          </h1>
          <p className="text-warmGray-600 mt-2">
            Welcome back, {user?.name || 'User'}! Organize and track coffee meetings between your employees.
          </p>
        </div>
      </div>

      {/* Simple Stats Card */}
      <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
        <ChartBarIcon className="h-16 w-16 text-[#E8C4A0] mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-warmGray-800 mb-2">
          Coffee Meeting Analytics Loading...
        </h2>
        <p className="text-warmGray-600 mb-4">
          Your employee coffee meeting analytics dashboard is being prepared.
        </p>
        <div className="text-sm text-warmGray-500 bg-warmGray-50 rounded-lg p-4 max-w-2xl mx-auto">
          <p className="font-medium mb-2">🎯 Platform Purpose:</p>
          <p>As an HR Manager, you can create coffee meeting campaigns to help your employees connect, collaborate, and build relationships across departments and teams.</p>
        </div>
      </div>
    </div>
  );
};

export default DashboardSimple;
