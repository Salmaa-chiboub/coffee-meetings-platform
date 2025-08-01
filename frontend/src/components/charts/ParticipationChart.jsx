import React, { useEffect, useRef, useState } from 'react';
import { format, parseISO, startOfMonth } from 'date-fns';
import CountUp from '../ui/CountUp';

const ParticipationChart = ({ campaigns }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredBar, setHoveredBar] = useState(null);

  // Update dimensions on resize and container changes
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        const parentRect = svgRef.current.parentElement.getBoundingClientRect();
        const width = Math.max(400, parentRect.width - 40); // Min width with padding
        setDimensions({ width, height: 280 });
      }
    };

    // Use ResizeObserver for better responsiveness
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (svgRef.current && svgRef.current.parentElement) {
      resizeObserver.observe(svgRef.current.parentElement);
    }

    // Initial update with delay to ensure parent is rendered
    const timer = setTimeout(updateDimensions, 100);

    return () => {
      resizeObserver.disconnect();
      clearTimeout(timer);
    };
  }, [campaigns]); // Re-run when campaigns change

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

  // Chart dimensions with enhanced spacing for text clarity - aligned with Campaign Timeline
  const margin = { top: 80, right: 60, bottom: 100, left: 100 };
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = dimensions.height - margin.top - margin.bottom;

  // Scales with enhanced spacing for text clarity
  const maxParticipants = Math.max(...chartData.map(d => d.totalParticipants));
  const barWidth = Math.max(40, chartWidth / chartData.length - 30);

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
        {/* Baby blue and baby orange pastel gradients */}
        <defs>
          <linearGradient id="participationGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E6F3FF" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#D1E7FF" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#BDDCFF" stopOpacity="0.85" />
          </linearGradient>

          <linearGradient id="pairsGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFF0E6" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#FFE4D1" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#FFD8BD" stopOpacity="0.85" />
          </linearGradient>

          <filter id="barShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#000" floodOpacity="0.08"/>
          </filter>
        </defs>

        {/* Chart area */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Clean background with soft colors */}
          <rect
            width={chartWidth}
            height={chartHeight}
            fill="#fcfcfd"
            opacity="0.4"
            rx="12"
          />

          {/* Clear grid lines with better contrast */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
            const y = chartHeight * (1 - ratio);
            return (
              <g key={index}>
                <line
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#e2e8f0"
                  strokeWidth="1"
                  opacity={ratio === 0 ? "0.7" : "0.3"}
                />
                <text
                  x={-20}
                  y={y + 5}
                  textAnchor="end"
                  className="text-sm font-semibold fill-slate-600"
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
                {/* Soft pastel participant bar with better spacing */}
                <rect
                  x={x}
                  y={participantY}
                  width={barWidth * 0.38}
                  height={participantHeight}
                  fill="url(#participationGradient)"
                  rx="8"
                  filter="url(#barShadow)"
                  className="transition-all duration-500 ease-out cursor-pointer hover:opacity-85"
                  onMouseEnter={() => setHoveredBar({ type: 'participants', index, data })}
                  onMouseLeave={() => setHoveredBar(null)}
                />

                {/* Soft pastel pairs bar with clear separation */}
                <rect
                  x={x + barWidth * 0.52}
                  y={pairY}
                  width={barWidth * 0.38}
                  height={pairHeight}
                  fill="url(#pairsGradient)"
                  rx="8"
                  filter="url(#barShadow)"
                  className="transition-all duration-500 ease-out cursor-pointer hover:opacity-85"
                  onMouseEnter={() => setHoveredBar({ type: 'pairs', index, data })}
                  onMouseLeave={() => setHoveredBar(null)}
                />

                {/* Clear, well-spaced month labels with high contrast */}
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 25}
                  textAnchor="middle"
                  className="text-base font-bold fill-slate-700"
                >
                  {format(data.month, 'MMM')}
                </text>
                <text
                  x={x + barWidth / 2}
                  y={chartHeight + 42}
                  textAnchor="middle"
                  className="text-sm font-medium fill-slate-500"
                >
                  {format(data.month, 'yyyy')}
                </text>

                {/* Simple text-only tooltip */}
                {hoveredBar && hoveredBar.index === index && (
                  <text
                    x={x + barWidth / 2}
                    y={participantY - 25}
                    textAnchor="middle"
                    className="text-lg font-bold fill-slate-700"
                  >
                    {hoveredBar.type === 'participants'
                      ? data.totalParticipants
                      : data.totalPairs
                    }
                  </text>
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

        {/* Responsive legend with adaptive text size */}
        <g transform={`translate(${margin.left - 40}, ${dimensions.height - 40})`}>
          <rect x="0" y="0" width="20" height="14" fill="url(#participationGradient)" rx="6" />
          <text
            x="28"
            y="11"
            className={`font-bold fill-slate-700 ${dimensions.width < 600 ? 'text-sm' : 'text-base'}`}
          >
            {dimensions.width < 500 ? 'Participants' : 'Total Participants'}
          </text>

          <rect
            x={dimensions.width < 600 ? "150" : "200"}
            y="0"
            width="20"
            height="14"
            fill="url(#pairsGradient)"
            rx="6"
          />
          <text
            x={dimensions.width < 600 ? "178" : "228"}
            y="11"
            className={`font-bold fill-slate-700 ${dimensions.width < 600 ? 'text-sm' : 'text-base'}`}
          >
            {dimensions.width < 500 ? 'Coffee Pairs' : 'Coffee Pairs Formed'}
          </text>
        </g>

        {/* Simple Y-axis label */}
        <text
          x="55"
          y={dimensions.height / 2}
          textAnchor="middle"
          className="text-xs fill-slate-500"
          transform={`rotate(-90, 55, ${dimensions.height / 2})`}
        >
          Participants
        </text>
      </svg>

      {/* Summary stats - moved down to align with Campaign Timeline */}
      <div className="mt-8 grid grid-cols-3 gap-4 text-center">
        <div className="bg-blue-50 rounded-lg p-3">
          <div className="text-lg font-bold text-blue-800">
            <CountUp 
              end={chartData.reduce((sum, d) => sum + d.totalParticipants, 0)} 
              duration={2000}
            />
          </div>
          <div className="text-xs text-blue-600">
            {dimensions.width < 500 ? 'Participants' : 'Total Participants'}
          </div>
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
