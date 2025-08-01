import React, { useEffect, useRef, useState } from 'react';
import { format, parseISO, startOfMonth } from 'date-fns';
import CountUp from '../ui/CountUp';

const ParticipationChart = ({ campaigns }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: 280 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Simple, smooth animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 300);

    return () => clearTimeout(timer);
  }, [campaigns]);

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-warmGray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📈</div>
          <p>No participation data available</p>
        </div>
      </div>
    );
  }

  // Group campaigns by month and calculate participation
  const monthlyData = campaigns.reduce((acc, campaign) => {
    const month = startOfMonth(parseISO(campaign.start_date));
    const monthKey = format(month, 'yyyy-MM');
    
    if (!acc[monthKey]) {
      acc[monthKey] = {
        month,
        monthKey,
        campaigns: 0,
        totalParticipants: 0,
        totalPairs: 0,
        avgRating: 0,
        ratings: []
      };
    }
    
    acc[monthKey].campaigns += 1;
    acc[monthKey].totalParticipants += campaign.employees_count || 0;
    acc[monthKey].totalPairs += campaign.pairs_count || 0;
    
    if (campaign.avg_rating) {
      acc[monthKey].ratings.push(campaign.avg_rating);
    }
    
    return acc;
  }, {});

  // Calculate average ratings
  Object.values(monthlyData).forEach(data => {
    if (data.ratings.length > 0) {
      data.avgRating = data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length;
    }
  });

  const chartData = Object.values(monthlyData).sort((a, b) => a.month - b.month);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-warmGray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No chart data available</p>
        </div>
      </div>
    );
  }

  // Chart dimensions
  const margin = { top: 20, right: 20, bottom: 60, left: 60 };
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = dimensions.height - margin.top - margin.bottom;

  // Scales
  const maxParticipants = Math.max(...chartData.map(d => d.totalParticipants));
  const barWidth = Math.max(20, chartWidth / chartData.length - 10);

  const xScale = (index) => index * (chartWidth / chartData.length) + (chartWidth / chartData.length - barWidth) / 2;
  const yScale = (value) => chartHeight - (value / maxParticipants) * chartHeight;
  const heightScale = (value) => (value / maxParticipants) * chartHeight;

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        width="100%"
        height={dimensions.height}
        className="overflow-visible"
      >
        {/* Simple gradient definitions */}
        <defs>
          <linearGradient id="simpleParticipationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E8D5F0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#D5E8F0" stopOpacity="0.8" />
          </linearGradient>

          <linearGradient id="simplePairsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#F0E8D5" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#E8F0D5" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Chart area */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Simple grid lines */}
          {[0, 0.5, 1].map((ratio, index) => {
            const y = chartHeight * (1 - ratio);
            return (
              <g key={index}>
                <line
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#f9fafb"
                  strokeWidth="1"
                />
                <text
                  x="-8"
                  y={y + 3}
                  textAnchor="end"
                  className="text-xs fill-warmGray-400"
                >
                  {Math.round(maxParticipants * ratio)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {chartData.map((data, index) => {
            const x = xScale(index);
            const participantHeight = heightScale(data.totalParticipants) * animationProgress;
            const pairHeight = heightScale(data.totalPairs) * animationProgress;
            const participantY = yScale(data.totalParticipants * animationProgress);
            const pairY = yScale(data.totalPairs * animationProgress);

            return (
              <g key={data.monthKey}>
                {/* Simple participant bar */}
                <rect
                  x={x}
                  y={participantY}
                  width={barWidth * 0.42}
                  height={participantHeight}
                  fill="url(#simpleParticipationGradient)"
                  rx="4"
                  className="transition-all duration-300 ease-out cursor-pointer"
                  onMouseEnter={() => setHoveredBar({ type: 'participants', index, data })}
                  onMouseLeave={() => setHoveredBar(null)}
                />

                {/* Simple pairs bar */}
                <rect
                  x={x + barWidth * 0.48}
                  y={pairY}
                  width={barWidth * 0.42}
                  height={pairHeight}
                  fill="url(#simplePairsGradient)"
                  rx="4"
                  className="transition-all duration-300 ease-out cursor-pointer"
                  onMouseEnter={() => setHoveredBar({ type: 'pairs', index, data })}
                  onMouseLeave={() => setHoveredBar(null)}
                />

                {/* Simple month label */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 16}
                  textAnchor="middle"
                  className="text-xs fill-warmGray-500"
                >
                  {format(data.month, 'MMM')}
                </text>

                {/* Simple hover tooltip */}
                {hoveredBar && hoveredBar.index === index && (
                  <g>
                    <rect
                      x={x - 5}
                      y={participantY - 25}
                      width={barWidth + 10}
                      height="20"
                      fill="rgba(0,0,0,0.75)"
                      rx="3"
                    />
                    <text
                      x={x + barWidth / 2}
                      y={participantY - 12}
                      textAnchor="middle"
                      className="text-xs fill-white font-medium"
                    >
                      {hoveredBar.type === 'participants'
                        ? `${data.totalParticipants} people`
                        : `${data.totalPairs} pairs`
                      }
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Simple axes */}
          <line
            x1="0"
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          <line
            x1="0"
            y1="0"
            x2="0"
            y2={chartHeight}
            stroke="#e5e7eb"
            strokeWidth="1"
          />
        </g>

        {/* Simple Legend */}
        <g transform={`translate(${margin.left}, ${dimensions.height - 30})`}>
          <rect x="0" y="0" width="10" height="10" fill="url(#simpleParticipationGradient)" rx="2" />
          <text x="15" y="8" className="text-xs fill-warmGray-600">Participants</text>

          <rect x="85" y="0" width="10" height="10" fill="url(#simplePairsGradient)" rx="2" />
          <text x="100" y="8" className="text-xs fill-warmGray-600">Pairs</text>
        </g>

        {/* Simple Y-axis label */}
        <text
          x="18"
          y={dimensions.height / 2}
          textAnchor="middle"
          className="text-xs fill-warmGray-500"
          transform={`rotate(-90, 18, ${dimensions.height / 2})`}
        >
          Count
        </text>
      </svg>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-lg font-bold text-blue-800">
            <CountUp 
              end={chartData.reduce((sum, d) => sum + d.totalParticipants, 0)} 
              duration={2000}
            />
          </div>
          <div className="text-xs text-blue-600">Total Participants</div>
        </div>
        <div className="bg-green-50 rounded-lg p-3">
          <div className="text-lg font-bold text-green-800">
            <CountUp 
              end={chartData.reduce((sum, d) => sum + d.totalPairs, 0)} 
              duration={2500}
            />
          </div>
          <div className="text-xs text-green-600">Total Pairs</div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-3">
          <div className="text-lg font-bold text-yellow-800">
            <CountUp 
              end={Math.round(chartData.reduce((sum, d) => sum + d.totalParticipants, 0) / chartData.length)} 
              duration={3000}
            />
          </div>
          <div className="text-xs text-yellow-600">Avg per Month</div>
        </div>
      </div>
    </div>
  );
};

export default ParticipationChart;
