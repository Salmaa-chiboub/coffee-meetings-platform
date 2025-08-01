import React, { useEffect, useRef, useState } from 'react';
import { format, parseISO, differenceInDays } from 'date-fns';

const CampaignTimelineChart = ({ campaigns }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationProgress, setAnimationProgress] = useState(0);

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

  // Chart dimensions
  const margin = { top: 40, right: 40, bottom: 60, left: 120 };
  const chartWidth = dimensions.width - margin.left - margin.right;
  const chartHeight = dimensions.height - margin.top - margin.bottom;
  const barHeight = Math.max(20, Math.min(40, chartHeight / timelineData.length - 10));

  // Scale functions
  const xScale = (date) => {
    const daysDiff = differenceInDays(date, minDate);
    return (daysDiff / totalDays) * chartWidth;
  };

  const yScale = (index) => index * (barHeight + 10) + barHeight / 2;

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
          <linearGradient id="simpleTimelineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#F7E6D3" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#E6D3F7" stopOpacity="0.8" />
          </linearGradient>
        </defs>

        {/* Chart area */}
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {/* Simple background */}
          <rect
            width={chartWidth}
            height={chartHeight}
            fill="#fafafa"
            opacity="0.5"
            rx="4"
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
                  fill="url(#simpleTimelineGradient)"
                  rx="6"
                  className="transition-all duration-300 ease-out"
                />

                {/* Simple campaign label */}
                <text
                  x={-10}
                  y={yScale(index) + 4}
                  textAnchor="end"
                  className="text-xs font-medium fill-warmGray-700"
                  style={{ opacity: progress }}
                >
                  {campaign.title.length > 18
                    ? `${campaign.title.substring(0, 18)}...`
                    : campaign.title
                  }
                </text>

                {/* Simple duration label */}
                <text
                  x={x + width / 2}
                  y={y + barHeight + 12}
                  textAnchor="middle"
                  className="text-xs fill-warmGray-500"
                  style={{ opacity: progress * 0.7 }}
                >
                  {campaign.duration}d • {campaign.employees_count || 0} people
                </text>

                {/* Simple start/end markers */}
                <circle
                  cx={x}
                  cy={yScale(index)}
                  r="3"
                  fill="#D4B5A0"
                  className="transition-opacity duration-300 ease-out"
                  style={{ opacity: progress * 0.8 }}
                />
                <circle
                  cx={x + width}
                  cy={yScale(index)}
                  r="3"
                  fill="#B5A0D4"
                  className="transition-opacity duration-300 ease-out"
                  style={{ opacity: progress * 0.8 }}
                />
              </g>
            );
          })}

          {/* Simple X-axis */}
          <line
            x1="0"
            y1={chartHeight}
            x2={chartWidth}
            y2={chartHeight}
            stroke="#e5e7eb"
            strokeWidth="1"
          />

          {/* Simplified X-axis labels */}
          {[0, 0.5, 1].map((ratio, index) => {
            const x = chartWidth * ratio;
            const date = new Date(minDate.getTime() + totalDays * ratio * 24 * 60 * 60 * 1000);

            return (
              <text
                key={index}
                x={x}
                y={chartHeight + 18}
                textAnchor="middle"
                className="text-xs fill-warmGray-500"
              >
                {format(date, 'MMM yyyy')}
              </text>
            );
          })}
        </g>

        {/* Simple Legend */}
        <g transform={`translate(${margin.left}, 15)`}>
          <circle cx="0" cy="0" r="3" fill="#D4B5A0" />
          <text x="10" y="4" className="text-xs fill-warmGray-600">Start</text>

          <circle cx="50" cy="0" r="3" fill="#B5A0D4" />
          <text x="60" y="4" className="text-xs fill-warmGray-600">End</text>

          <rect x="90" y="-3" width="16" height="6" fill="url(#simpleTimelineGradient)" rx="3" />
          <text x="112" y="4" className="text-xs fill-warmGray-600">Duration</text>
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
