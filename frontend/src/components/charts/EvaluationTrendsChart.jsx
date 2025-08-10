import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

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
        <style>
          {`
            .recharts-bar-rectangle {
              animation: barGrow 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
              transform-origin: bottom;
            }
            
            @keyframes barGrow {
              0% {
                transform: scaleY(0);
                opacity: 0;
              }
              50% {
                transform: scaleY(0.8);
                opacity: 0.8;
              }
              100% {
                transform: scaleY(1);
                opacity: 1;
              }
            }
            
            .recharts-bar-rectangle:nth-child(1) { animation-delay: 0.1s; }
            .recharts-bar-rectangle:nth-child(2) { animation-delay: 0.2s; }
            .recharts-bar-rectangle:nth-child(3) { animation-delay: 0.3s; }
            .recharts-bar-rectangle:nth-child(4) { animation-delay: 0.4s; }
            .recharts-bar-rectangle:nth-child(5) { animation-delay: 0.5s; }
            .recharts-bar-rectangle:nth-child(6) { animation-delay: 0.6s; }
          `}
        </style>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280" 
              fontSize={12}
            />
            <YAxis stroke="#6b7280" fontSize={12} />
            <Tooltip content={<CustomTooltip />} />
            <Bar 
              dataKey="campaigns" 
              fill="#E8C4A0" 
              name="Campaigns Completed"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-campaigns-${index}`} 
                  fill={entry.campaigns === 0 ? "#93c5fd" : "#E8C4A0"}
                  stroke="none"
                />
              ))}
            </Bar>
            <Bar 
              dataKey="avgParticipants" 
              fill="#60A5FA" 
              name="Avg Participants"
              radius={[4, 4, 0, 0]}
            >
              {chartData.map((entry, index) => (
                <Cell 
                  key={`cell-participants-${index}`} 
                  fill={entry.avgParticipants === 0 ? "#93c5fd" : "#60A5FA"}
                  stroke="none"
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default EvaluationTrendsChart;
