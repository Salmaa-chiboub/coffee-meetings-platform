import React, { useEffect, useRef, useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';

const CampaignTimelineChart = ({ campaigns }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredCampaign, setHoveredCampaign] = useState(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: 300 });
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
    }, 200);

    return () => clearTimeout(timer);
  }, [campaigns]);

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-warmGray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No campaign data available</p>
        </div>
      </div>
    );
  }

  // Prepare timeline data
  const timelineData = campaigns
    .map(campaign => ({
      ...campaign,
      startDate: parseISO(campaign.start_date),
      endDate: parseISO(campaign.end_date),
      duration: differenceInDays(parseISO(campaign.end_date), parseISO(campaign.start_date))
    }))
    .sort((a, b) => a.startDate - b.startDate);

  if (timelineData.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-warmGray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📅</div>
          <p>No timeline data available</p>
        </div>
      </div>
    );
  }

  // Calculate timeline bounds
  const minDate = timelineData[0].startDate;
  const maxDate = timelineData[timelineData.length - 1].endDate;
  const totalDays = differenceInDays(maxDate, minDate);

  // Chart dimensions with enhanced spacing for text clarity and timeline axis
  const margin = { top: 60, right: 80, bottom: 120, left: 160 };
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = dimensions.height - margin.top - margin.bottom;
  const barHeight = Math.max(28, Math.min(40, chartHeight / timelineData.length - 25));

  // Scale functions
  const xScale = (date) => {
    const daysDiff = differenceInDays(date, minDate);
    return (daysDiff / totalDays) * chartWidth;
  };

  const yScale = (index) => index * (barHeight + 30) + barHeight / 2;

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        width="100%"
        height={dimensions.height}
        className="overflow-visible"
      >
        {/* Pastel purple-blue gradient definition */}
        <defs>
          <linearGradient id="timelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E8E6FF" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#D4C4F0" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#C4D4FF" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Chart area */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Simple clean background */}
          <rect
            width={chartWidth}
            height={chartHeight}
            fill="#fafbfc"
            opacity="0.3"
            rx="8"
          />

          {/* Timeline bars */}
          {timelineData.map((campaign, index) => {
            const x = xScale(campaign.startDate);
            const width = xScale(campaign.endDate) - x;
            const y = yScale(index) - barHeight / 2;
            const progress = animationProgress;

            return (
              <g key={campaign.id}>
                {/* Simple campaign bar */}
                <rect
                  x={x}
                  y={y}
                  width={width * progress}
                  height={barHeight}
                  fill="url(#timelineGradient)"
                  rx="4"
                  className="transition-all duration-300 ease-out"
                />

                {/* Simple campaign title */}
                <text
                  x={-15}
                  y={yScale(index) + 5}
                  textAnchor="end"
                  className="text-sm font-medium fill-slate-600"
                  style={{ opacity: progress }}
                >
                  {campaign.title.length > 20
                    ? `${campaign.title.substring(0, 20)}...`
                    : campaign.title
                  }
                </text>

                {/* Simple data label */}
                <text
                  x={x + width / 2}
                  y={y + barHeight + 18}
                  textAnchor="middle"
                  className="text-xs font-medium fill-slate-500"
                  style={{ opacity: progress }}
                >
                  {campaign.duration} days
                </text>

                {/* Simple start/end markers */}
                <circle
                  cx={x}
                  cy={yScale(index)}
                  r="3"
                  fill="#D4C4F0"
                  className="transition-all duration-300 ease-out"
                  style={{ opacity: progress }}
                />
                <circle
                  cx={x + width}
                  cy={yScale(index)}
                  r="3"
                  fill="#C4D4FF"
                  className="transition-all duration-300 ease-out"
                  style={{ opacity: progress }}
                />

                {/* Hover tooltip for detailed dates */}
                {hoveredCampaign === campaign.id && (
                  <g>
                    <rect
                      x={x + width / 2 - 60}
                      y={y - 45}
                      width="120"
                      height="35"
                      fill="rgba(51, 65, 85, 0.95)"
                      rx="8"
                    />
                    <text
                      x={x + width / 2}
                      y={y - 30}
                      textAnchor="middle"
                      className="text-xs fill-white font-medium"
                    >
                      {format(parseISO(campaign.start_date), 'MMM dd, yyyy')}
                    </text>
                    <text
                      x={x + width / 2}
                      y={y - 18}
                      textAnchor="middle"
                      className="text-xs fill-slate-200"
                    >
                      to {format(parseISO(campaign.end_date), 'MMM dd, yyyy')}
                    </text>
                  </g>
                )}

                {/* Interactive area for hover */}
                <rect
                  x={x - 10}
                  y={y - 10}
                  width={width + 20}
                  height={barHeight + 20}
                  fill="transparent"
                  onMouseEnter={() => setHoveredCampaign(campaign.id)}
                  onMouseLeave={() => setHoveredCampaign(null)}
                  style={{ cursor: 'pointer' }}
                />
              </g>
            );
          })}

          {/* Timeline axis with quarterly markers */}
          <line
            x1="0"
            y1={chartHeight + 20}
            x2={chartWidth}
            y2={chartHeight + 20}
            stroke="#e5e7eb"
            strokeWidth="2"
          />

          {/* Quarterly date markers */}
          {(() => {
            const quarters = [];
            const startDate = new Date(Math.min(...timelineData.map(d => new Date(d.start_date))));
            const endDate = new Date(Math.max(...timelineData.map(d => new Date(d.end_date))));

            // Generate quarterly markers
            let currentDate = new Date(startDate.getFullYear(), Math.floor(startDate.getMonth() / 3) * 3, 1);
            while (currentDate <= endDate) {
              const x = xScale(currentDate);
              const quarter = Math.floor(currentDate.getMonth() / 3) + 1;
              const year = currentDate.getFullYear();

              quarters.push(
                <g key={`quarter-${year}-${quarter}`}>
                  <line
                    x1={x}
                    y1={chartHeight + 15}
                    x2={x}
                    y2={chartHeight + 25}
                    stroke="#94a3b8"
                    strokeWidth="1"
                  />
                  <text
                    x={x}
                    y={chartHeight + 40}
                    textAnchor="middle"
                    className="text-xs fill-slate-500 font-medium"
                  >
                    Q{quarter} {year}
                  </text>
                </g>
              );

              // Move to next quarter
              currentDate.setMonth(currentDate.getMonth() + 3);
            }

            return quarters;
          })()}


        </g>

        {/* Simple legend */}
        <g transform={`translate(${margin.left}, 20)`}>
          <rect x="0" y="-3" width="20" height="8" fill="url(#timelineGradient)" rx="4" />
          <text x="28" y="4" className="text-sm font-medium fill-slate-600">Campaign Duration</text>
        </g>
      </svg>

      {/* Summary stats */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-warmGray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-warmGray-800">
            {timelineData.length}
          </div>
          <div className="text-xs text-warmGray-600">Total Campaigns</div>
        </div>
        <div className="bg-warmGray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-warmGray-800">
            {Math.round(timelineData.reduce((sum, c) => sum + c.duration, 0) / timelineData.length)}
          </div>
          <div className="text-xs text-warmGray-600">Avg Duration (days)</div>
        </div>
        <div className="bg-warmGray-50 rounded-lg p-3">
          <div className="text-lg font-bold text-warmGray-800">
            {Math.round(totalDays / 30)}
          </div>
          <div className="text-xs text-warmGray-600">Timeline Span (months)</div>
        </div>
      </div>
    </div>
  );
};

export default CampaignTimelineChart;
