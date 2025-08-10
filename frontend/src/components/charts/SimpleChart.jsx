import React, { useMemo } from 'react';

// Simple Bar Chart Component (without external libraries) - Optimized with React.memo
const SimpleBarChart = React.memo(({ data, title, className = '' }) => {
  // Memoize expensive calculations
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(item => item.value));
    return { maxValue, items: data };
  }, [data]);

  if (!chartData) {
    return (
      <div className={`bg-white rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-warmGray-800 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-warmGray-500">No data available</p>
        </div>
      </div>
    );
  }

  const { maxValue, items } = chartData;

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 p-8 border border-warmGray-100/50 ${className}`}>
      <h3 className="text-xl font-bold text-warmGray-800 mb-8 tracking-tight">{title}</h3>
      <div className="space-y-6">
        {items.map((item, index) => (
          <div key={`${item.label}-${index}`} className="group">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-warmGray-700">
                {item.label}
              </span>
              <span className="text-sm font-bold text-warmGray-800">
                {item.value}
              </span>
            </div>
            <div className="relative">
              <div className="w-full bg-warmGray-100 rounded-full h-3 overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#E8C4A0] via-[#DDB892] to-[#D4A574] rounded-full transition-all duration-1000 ease-out shadow-sm group-hover:shadow-md animate-slideIn"
                  style={{
                    width: `${(item.value / maxValue) * 100}%`,
                    animationDelay: `${index * 0.1}s`
                  }}
                />
              </div>
              <div className="absolute top-0 left-0 w-full h-full flex items-center justify-end pr-2">
                <div className="text-xs font-medium text-warmGray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {Math.round((item.value / maxValue) * 100)}%
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
});

// Simple Line Chart Component - Optimized with React.memo
const SimpleLineChart = React.memo(({ data, title, className = '' }) => {
  // Memoize expensive calculations
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    const maxValue = Math.max(...data.map(item => item.value));
    const minValue = Math.min(...data.map(item => item.value));
    const range = maxValue - minValue || 1;

    return { maxValue, minValue, range, items: data };
  }, [data]);

  if (!chartData) {
    return (
      <div className={`bg-white rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-warmGray-800 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-warmGray-500">No data available</p>
        </div>
      </div>
    );
  }

  const { maxValue, minValue, range, items } = chartData;

  return (
    <div className={`bg-white/90 backdrop-blur-sm rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 p-8 border border-warmGray-100/50 ${className}`}>
      <h3 className="text-xl font-bold text-warmGray-800 mb-8 tracking-tight">{title}</h3>
      <div className="relative h-56">
        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-warmGray-500 font-medium">
          <span className="bg-white/80 px-2 py-1 rounded">{maxValue}</span>
          <span className="bg-white/80 px-2 py-1 rounded">{Math.round((maxValue + minValue) / 2)}</span>
          <span className="bg-white/80 px-2 py-1 rounded">{minValue}</span>
        </div>

        {/* Chart area */}
        <div className="ml-12 h-full relative">
          <svg className="w-full h-full" viewBox="0 0 400 200">
            {/* Subtle grid lines */}
            {[0, 1, 2, 3, 4].map(i => (
              <line
                key={i}
                x1="0"
                y1={i * 40}
                x2="400"
                y2={i * 40}
                stroke="#f8fafc"
                strokeWidth="1"
                opacity="0.6"
              />
            ))}

            {/* Gradient definition */}
            <defs>
              <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#E8C4A0" />
                <stop offset="50%" stopColor="#DDB892" />
                <stop offset="100%" stopColor="#D4A574" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Area under the smooth curve */}
            <path
              d={(() => {
                if (data.length === 0) return '';

                const points = data.map((item, index) => ({
                  x: (index / (data.length - 1)) * 400,
                  y: 200 - ((item.value - minValue) / range) * 200
                }));

                if (points.length === 1) {
                  return `M ${points[0].x},${points[0].y} L ${points[0].x},200 L 0,200 Z`;
                }

                // Create smooth area fill matching the curve
                let path = `M ${points[0].x},${points[0].y}`;

                for (let i = 1; i < points.length; i++) {
                  const prev = points[i - 1];
                  const curr = points[i];
                  const next = points[i + 1];

                  const tension = 0.3;
                  const cp1x = prev.x + (curr.x - (points[i - 2] ? points[i - 2].x : prev.x)) * tension;
                  const cp1y = prev.y + (curr.y - (points[i - 2] ? points[i - 2].y : prev.y)) * tension;
                  const cp2x = curr.x - (next ? next.x - prev.x : curr.x - prev.x) * tension;
                  const cp2y = curr.y - (next ? next.y - prev.y : curr.y - prev.y) * tension;

                  path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
                }

                // Close the area to the bottom
                path += ` L ${points[points.length - 1].x},200 L ${points[0].x},200 Z`;

                return path;
              })()}
              fill="url(#lineGradient)"
              opacity="0.08"
            />

            {/* Smooth wave line using cubic bezier curves */}
            <path
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
              d={(() => {
                if (data.length === 0) return '';

                const points = data.map((item, index) => ({
                  x: (index / (data.length - 1)) * 400,
                  y: 200 - ((item.value - minValue) / range) * 200
                }));

                if (points.length === 1) {
                  return `M ${points[0].x},${points[0].y}`;
                }

                // Create smooth curve using cubic bezier
                let path = `M ${points[0].x},${points[0].y}`;

                for (let i = 1; i < points.length; i++) {
                  const prev = points[i - 1];
                  const curr = points[i];
                  const next = points[i + 1];

                  // Calculate control points for smooth curves
                  const tension = 0.3; // Adjust this for more/less curve
                  const cp1x = prev.x + (curr.x - (points[i - 2] ? points[i - 2].x : prev.x)) * tension;
                  const cp1y = prev.y + (curr.y - (points[i - 2] ? points[i - 2].y : prev.y)) * tension;
                  const cp2x = curr.x - (next ? next.x - prev.x : curr.x - prev.x) * tension;
                  const cp2y = curr.y - (next ? next.y - prev.y : curr.y - prev.y) * tension;

                  path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${curr.x},${curr.y}`;
                }

                return path;
              })()}
              className="animate-drawLine"
            />
          </svg>
        </div>

        {/* X-axis labels */}
        <div className="ml-12 mt-4 flex justify-between text-xs text-warmGray-600 font-medium">
          {data.map((item, index) => (
            <span key={index} className="bg-white/60 px-2 py-1 rounded">{item.label}</span>
          ))}
        </div>
      </div>

    </div>
  );
});

// Rating Distribution Chart
const RatingDistributionChart = ({ data, title, className = '' }) => {
  if (!data || data.length === 0) {
    return (
      <div className={`bg-white rounded-xl p-6 ${className}`}>
        <h3 className="text-lg font-semibold text-warmGray-800 mb-4">{title}</h3>
        <div className="text-center py-8">
          <p className="text-warmGray-500">No ratings data available</p>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(...data.map(item => item.count));
  const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a']; // Red to Green

  return (
    <div className={`bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-warmGray-800 mb-6">{title}</h3>
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 w-16">
              <span className="text-sm font-medium text-warmGray-700">{item.rating}</span>
              <span className="text-yellow-400">★</span>
            </div>
            <div className="flex-1 bg-warmGray-200 rounded-full h-6 relative overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{ 
                  width: `${(item.count / maxValue) * 100}%`,
                  backgroundColor: colors[index] || '#E8C4A0'
                }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-medium text-white">
                  {item.count}
                </span>
              </div>
            </div>
            <div className="w-12 text-xs text-warmGray-500">
              {maxValue > 0 ? Math.round((item.count / maxValue) * 100) : 0}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Full Card Size Chart - Fills entire card dimensions - Optimized with React.memo
const EvaluationTrendsChart = React.memo(({ data, title, className = '' }) => {
  const [hoveredPoint, setHoveredPoint] = React.useState(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ x: 0, y: 0 });

  // Memoize expensive chart calculations
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data) || data.length === 0) return null;

    const values = data.map(item => item.value || 0);
    const labels = data.map(item => item.label || '');
    const maxValue = Math.max(...values, 1);
    const minValue = Math.min(...values, 0);

    return { values, labels, maxValue, minValue };
  }, [data]);

  // Handle empty or invalid data
  if (!chartData) {
    return (
      <div className={`bg-white rounded-xl shadow-sm border border-gray-200 h-full w-full flex flex-col ${className}`} style={{ padding: '10px' }}>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-3 mx-4 flex-shrink-0">{title}</h3>
        <div className="flex-1 flex items-center justify-center" style={{ padding: '5px' }}>
          <p className="text-gray-500 text-sm">No evaluation data available</p>
        </div>
      </div>
    );
  }

  const { values, labels, maxValue, minValue } = chartData;

  // Create dynamic Y-axis scale
  const createYAxisScale = (max, min) => {
    const range = max - min;
    let step, tickCount;

    if (range <= 5) {
      step = 1;
      tickCount = Math.ceil(range) + 1;
    } else if (range <= 10) {
      step = 2;
      tickCount = Math.ceil(range / 2) + 1;
    } else if (range <= 50) {
      step = 5;
      tickCount = Math.ceil(range / 5) + 1;
    } else if (range <= 100) {
      step = 10;
      tickCount = Math.ceil(range / 10) + 1;
    } else {
      step = Math.ceil(range / 5);
      tickCount = 6;
    }

    const adjustedMax = Math.ceil(max / step) * step;
    const adjustedMin = Math.floor(min / step) * step;

    return {
      min: adjustedMin,
      max: adjustedMax,
      step: step,
      ticks: Array.from({length: tickCount}, (_, i) => adjustedMin + (i * step)).filter(tick => tick <= adjustedMax)
    };
  };

  const yScale = createYAxisScale(maxValue, minValue);

  // Dynamic chart dimensions - use full card space
  const titleHeight = 30; // Space for title
  const yAxisWidth = 25; // Space for Y-axis labels
  const xAxisHeight = 25; // Space for X-axis labels
  const chartPadding = 8; // Internal padding around the chart area
  const rightPadding = 15; // Extra padding on the right to prevent cutoff
  const topPadding = 15; // Extra padding on the top to prevent cutoff

  // Calculate available space (will be set via CSS to fill card)
  const availableWidth = '100%';
  const availableHeight = `calc(100% - ${titleHeight}px)`;

  // For SVG calculations, we'll use a base size that scales
  const baseWidth = 320; // Increased to accommodate right padding
  const baseHeight = 140; // Increased height for better chart visibility
  const chartAreaWidth = baseWidth - yAxisWidth - chartPadding - rightPadding;
  const chartAreaHeight = baseHeight - xAxisHeight - chartPadding - topPadding;

  // Calculate data points within the chart area with padding
  const dataPoints = values.map((value, index) => {
    const x = yAxisWidth + chartPadding + (index / Math.max(values.length - 1, 1)) * chartAreaWidth;
    // Y coordinate: start from top padding, then scale value within chart area using dynamic scale
    const normalizedValue = (value - yScale.min) / Math.max(yScale.max - yScale.min, 1);
    const y = topPadding + chartPadding + (1 - normalizedValue) * chartAreaHeight;
    return { x, y, value, label: labels[index] };
  });

  // Calculate bar dimensions
  const barWidth = chartAreaWidth / values.length * 0.8; // 80% of available space
  const barSpacing = chartAreaWidth / values.length * 0.2; // 20% for spacing

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 h-full w-full flex flex-col ${className}`} style={{ padding: '10px' }}>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 mt-3 mx-4 flex-shrink-0">{title}</h3>

      {/* Chart container fills remaining space with internal padding */}
      <div className="flex-1 w-full" style={{ padding: '5px' }}>
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${baseWidth} ${baseHeight}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
            <linearGradient id="areaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.02" />
            </linearGradient>

            {/* Animation definitions */}
            <style>
              {`
                .chart-bar {
                  opacity: 0;
                  transform: scaleY(0);
                  transform-origin: bottom;
                  animation: growBar 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                }

                .chart-line {
                  stroke-dasharray: 1000;
                  stroke-dashoffset: 1000;
                  animation: drawLine 2s ease-out forwards;
                }

                .chart-area {
                  opacity: 0;
                  animation: fadeInArea 1.5s ease-out 0.5s forwards;
                }

                .chart-label {
                  opacity: 0;
                  animation: fadeInLabel 0.8s ease-out forwards;
                }

                .grid-line {
                  opacity: 0;
                  animation: fadeInGrid 1s ease-out 0.2s forwards;
                }

                @keyframes growBar {
                  0% {
                    opacity: 0;
                    transform: scaleY(0);
                  }
                  50% {
                    opacity: 0.8;
                    transform: scaleY(0.8);
                  }
                  100% {
                    opacity: 1;
                    transform: scaleY(1);
                  }
                }

                @keyframes drawLine {
                  to {
                    stroke-dashoffset: 0;
                  }
                }

                @keyframes fadeInArea {
                  to {
                    opacity: 1;
                  }
                }

                @keyframes fadeInLabel {
                  from {
                    opacity: 0;
                    transform: translateY(5px);
                  }
                  to {
                    opacity: 1;
                    transform: translateY(0);
                  }
                }

                @keyframes fadeInGrid {
                  to {
                    opacity: 1;
                  }
                }
              `}
            </style>
          </defs>

          {/* Y-axis labels - Dynamic scale */}
          {yScale.ticks.map((tick, index) => {
            const normalizedPosition = (tick - yScale.min) / (yScale.max - yScale.min);
            const y = topPadding + chartPadding + (1 - normalizedPosition) * chartAreaHeight;
            return (
              <text
                key={tick}
                x="5"
                y={y + 2}
                fontSize="6"
                fill="#d1d5db"
                textAnchor="start"
                className="chart-label"
                style={{animationDelay: `${0.3 + index * 0.1}s`}}
              >
                {tick}
              </text>
            );
          })}

          {/* Horizontal grid lines - Aligned with Y-axis ticks */}
          {yScale.ticks.slice(1, -1).map((tick, index) => {
            const normalizedPosition = (tick - yScale.min) / (yScale.max - yScale.min);
            const y = topPadding + chartPadding + (1 - normalizedPosition) * chartAreaHeight;
            return (
              <line
                key={tick}
                x1={yAxisWidth + chartPadding}
                y1={y}
                x2={yAxisWidth + chartPadding + chartAreaWidth}
                y2={y}
                stroke="#f1f5f9"
                strokeWidth="1"
                className="grid-line"
                style={{animationDelay: `${0.1 + index * 0.1}s`}}
              />
            );
          })}

          {/* Bars */}
          {dataPoints.map((point, index) => {
            const barX = yAxisWidth + chartPadding + (index * (barWidth + barSpacing)) + (barSpacing / 2);
            const barHeight = topPadding + chartPadding + chartAreaHeight - point.y;
            const barY = point.y;
            const isZeroValue = point.value === 0;
            // Pour les valeurs nulles, on crée une ligne très fine
            const finalBarHeight = isZeroValue ? 2 : barHeight;
            const finalBarY = isZeroValue ? (topPadding + chartPadding + chartAreaHeight - 2) : barY;
            
            return (
              <g key={index}>
                {/* Bar */}
                <rect
                  x={barX}
                  y={finalBarY}
                  width={barWidth}
                  height={finalBarHeight}
                  fill={isZeroValue ? "#93c5fd" : "url(#chartGradient)"}
                  stroke="none"
                  rx={isZeroValue ? "0" : "2"}
                  ry={isZeroValue ? "0" : "2"}
                  className="chart-bar"
                  style={{
                    animationDelay: `${1.5 + index * 0.1}s`,
                    transition: 'all 0.2s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    setHoveredPoint(point);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltipPosition({ x: rect.left + rect.width / 2, y: rect.top });
                  }}
                  onMouseLeave={() => setHoveredPoint(null)}
                />
                

              </g>
            );
          })}

          {/* X-axis labels */}
          {labels.map((label, index) => {
            const x = yAxisWidth + chartPadding + (index / Math.max(labels.length - 1, 1)) * chartAreaWidth;
            return (
              <text
                key={index}
                x={x}
                y={topPadding + chartPadding + chartAreaHeight + 15}
                fontSize="6"
                fill="#d1d5db"
                textAnchor="middle"
                className="chart-label"
                style={{animationDelay: `${0.6 + index * 0.1}s`}}
              >
                {label}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Tooltip */}
      {hoveredPoint && (
        <div
          className="fixed bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-lg pointer-events-none z-50"
          style={{
            left: `${tooltipPosition.x}px`,
            top: `${tooltipPosition.y - 35}px`,
            transform: 'translateX(-50%)'
          }}
        >
          <div className="font-medium">{hoveredPoint.label}</div>
          <div className="text-gray-300">Value: {hoveredPoint.value}</div>
        </div>
      )}
    </div>
  );
});

export { SimpleBarChart, SimpleLineChart, RatingDistributionChart, EvaluationTrendsChart };
