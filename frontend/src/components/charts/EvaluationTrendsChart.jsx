import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const EvaluationTrendsChart = ({ campaigns }) => {
  // Préparer les données pour le graphique de tendances
  const chartData = React.useMemo(() => {
    // Grouper par mois de completion
    const monthlyData = {};
    
    campaigns.forEach(campaign => {
      if (campaign.completion_date) {
        const date = new Date(campaign.completion_date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthLabel = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = {
            month: monthLabel,
            campaigns: 0,
            totalParticipants: 0,
            totalPairs: 0,
            avgParticipants: 0
          };
        }
        
        monthlyData[monthKey].campaigns += 1;
        monthlyData[monthKey].totalParticipants += campaign.participants_count || 0;
        monthlyData[monthKey].totalPairs += campaign.total_pairs || 0;
      }
    });

    // Calculer les moyennes et trier par date
    return Object.keys(monthlyData)
      .sort()
      .slice(-6) // Derniers 6 mois
      .map(key => {
        const data = monthlyData[key];
        return {
          ...data,
          avgParticipants: data.campaigns > 0 ? Math.round(data.totalParticipants / data.campaigns) : 0
        };
      });
  }, [campaigns]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-warmGray-200 rounded-lg shadow-lg">
          <p className="font-medium text-warmGray-800 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            {payload.map((entry, index) => (
              <p key={index} style={{ color: entry.color }}>
                {entry.name}: {entry.value}
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-warmGray-200 p-6">
      <h3 className="text-lg font-semibold text-warmGray-800 mb-4">
        Campaign Trends (Last 6 Months)
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <defs>
              <linearGradient id="colorCampaigns" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#E8C4A0" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#E8C4A0" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorParticipants" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#60A5FA" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280" 
              fontSize={12}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="campaigns"
              stroke="#E8C4A0"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorCampaigns)"
              name="Campaigns Completed"
            />
            <Line
              type="monotone"
              dataKey="avgParticipants"
              stroke="#60A5FA"
              strokeWidth={3}
              dot={{ fill: '#60A5FA', strokeWidth: 2, r: 4 }}
              name="Avg Participants"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EvaluationTrendsChart;
