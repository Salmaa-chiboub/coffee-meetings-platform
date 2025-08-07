import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const CampaignMetricsChart = ({ campaigns }) => {
  // Préparer les données pour le graphique en barres
  const chartData = campaigns.slice(0, 10).map((campaign, index) => ({
    name: campaign.title.length > 15 ? campaign.title.substring(0, 15) + '...' : campaign.title,
    participants: campaign.participants_count || 0,
    pairs: campaign.total_pairs || 0,
    criteria: campaign.total_criteria || 0,
    index
  }));

  // Couleurs pour les barres
  const colors = ['#E8C4A0', '#D4A574', '#C7A882', '#B8A890', '#A99B9E'];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const campaign = campaigns[data.index];
      return (
        <div className="bg-white p-3 border border-warmGray-200 rounded-lg shadow-lg">
          <p className="font-medium text-warmGray-800 mb-2">{campaign.title}</p>
          <div className="space-y-1 text-sm">
            <p className="text-blue-600">Participants : {data.participants}</p>
            <p className="text-green-600">Paires : {data.pairs}</p>
            <p className="text-purple-600">Critères : {data.criteria}</p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg border border-warmGray-200 p-6">
      <h3 className="text-lg font-semibold text-warmGray-800 mb-4">
        Campaign Metrics Overview
      </h3>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="name" 
              angle={-45}
              textAnchor="end"
              height={80}
              fontSize={12}
              stroke="#6b7280"
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="participants" name="Participants" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default CampaignMetricsChart;
