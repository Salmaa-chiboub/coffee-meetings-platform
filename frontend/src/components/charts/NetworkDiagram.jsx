import React, { useEffect, useRef, useState } from 'react';

const NetworkDiagram = ({ campaigns }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: 350 });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Animate network drawing
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationProgress(1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [campaigns]);

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-warmGray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🕸️</div>
          <p>No network data available</p>
        </div>
      </div>
    );
  }

  // Generate mock network data based on campaigns
  const generateNetworkData = () => {
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations', 'Design'];
    const nodes = [];
    const links = [];

    // Create department nodes
    departments.forEach((dept, index) => {
      const participantCount = Math.floor(Math.random() * 50) + 10;
      nodes.push({
        id: dept,
        type: 'department',
        name: dept,
        participants: participantCount,
        x: 0, // Will be calculated
        y: 0, // Will be calculated
        connections: 0
      });
    });

    // Create connections based on campaign data
    campaigns.forEach(campaign => {
      const campaignParticipants = campaign.employees_count || 0;
      const connectionsPerCampaign = Math.floor(campaignParticipants / 10);
      
      for (let i = 0; i < connectionsPerCampaign; i++) {
        const source = departments[Math.floor(Math.random() * departments.length)];
        let target = departments[Math.floor(Math.random() * departments.length)];
        
        // Ensure source and target are different
        while (target === source) {
          target = departments[Math.floor(Math.random() * departments.length)];
        }

        // Check if link already exists
        const existingLink = links.find(link => 
          (link.source === source && link.target === target) ||
          (link.source === target && link.target === source)
        );

        if (existingLink) {
          existingLink.strength += 1;
        } else {
          links.push({
            source,
            target,
            strength: 1,
            campaignId: campaign.id
          });
        }
      }
    });

    // Calculate connection counts
    links.forEach(link => {
      const sourceNode = nodes.find(n => n.id === link.source);
      const targetNode = nodes.find(n => n.id === link.target);
      if (sourceNode) sourceNode.connections += link.strength;
      if (targetNode) targetNode.connections += link.strength;
    });

    return { nodes, links };
  };

  const { nodes, links } = generateNetworkData();

  // Position nodes in a circle
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;
  const radius = Math.min(dimensions.width, dimensions.height) * 0.3;

  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    node.x = centerX + radius * Math.cos(angle);
    node.y = centerY + radius * Math.sin(angle);
  });

  // Calculate node sizes based on participants
  const maxParticipants = Math.max(...nodes.map(n => n.participants));
  const minRadius = 15;
  const maxRadius = 40;

  const getNodeRadius = (participants) => {
    return minRadius + (participants / maxParticipants) * (maxRadius - minRadius);
  };

  // Get link thickness based on strength
  const maxStrength = Math.max(...links.map(l => l.strength));
  const getStrokeWidth = (strength) => {
    return 1 + (strength / maxStrength) * 4;
  };

  // Pastel color scheme for departments
  const departmentColors = {
    'Engineering': '#D5E0F0',
    'Marketing': '#F0F0D5',
    'Sales': '#D5E8E8',
    'HR': '#E8D5E8',
    'Finance': '#F0E8D5',
    'Operations': '#D5F0E8',
    'Design': '#F0D5E0'
  };

  return (
    <div className="w-full">
      <svg
        ref={svgRef}
        width="100%"
        height={dimensions.height}
        className="overflow-visible"
      >
        {/* Gradient definitions */}
        <defs>
          {Object.entries(departmentColors).map(([dept, color]) => (
            <radialGradient key={dept} id={`gradient-${dept}`} cx="30%" cy="30%">
              <stop offset="0%" stopColor={color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={color} stopOpacity="0.6" />
            </radialGradient>
          ))}
          
          {/* Glow filter */}
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* Links */}
        <g className="links">
          {links.map((link, index) => {
            const sourceNode = nodes.find(n => n.id === link.source);
            const targetNode = nodes.find(n => n.id === link.target);
            
            if (!sourceNode || !targetNode) return null;

            const strokeWidth = getStrokeWidth(link.strength);
            const opacity = 0.3 + (link.strength / maxStrength) * 0.5;

            return (
              <line
                key={`${link.source}-${link.target}`}
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="#E0E0E0"
                strokeWidth={strokeWidth * animationProgress}
                opacity={opacity * animationProgress}
                className="transition-all duration-1000 ease-out"
                style={{
                  strokeDasharray: `${Math.sqrt((targetNode.x - sourceNode.x) ** 2 + (targetNode.y - sourceNode.y) ** 2)}`,
                  strokeDashoffset: `${Math.sqrt((targetNode.x - sourceNode.x) ** 2 + (targetNode.y - sourceNode.y) ** 2) * (1 - animationProgress)}`
                }}
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodes.map((node, index) => {
            const radius = getNodeRadius(node.participants);
            const color = departmentColors[node.id] || '#E0E0E0';
            const isHovered = hoveredNode === node.id;

            return (
              <g key={node.id}>
                {/* Node circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r={radius * animationProgress}
                  fill={`url(#gradient-${node.id})`}
                  stroke={color}
                  strokeWidth="2"
                  className="transition-all duration-300 cursor-pointer"
                  style={{
                    filter: isHovered ? 'url(#glow)' : 'none',
                    transform: isHovered ? 'scale(1.1)' : 'scale(1)',
                    transformOrigin: `${node.x}px ${node.y}px`
                  }}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                />

                {/* Node label */}
                <text
                  x={node.x}
                  y={node.y + 5}
                  textAnchor="middle"
                  className="text-xs font-medium fill-white pointer-events-none"
                  style={{ opacity: animationProgress }}
                >
                  {node.name}
                </text>

                {/* Participant count */}
                <text
                  x={node.x}
                  y={node.y + radius + 15}
                  textAnchor="middle"
                  className="text-xs fill-warmGray-600 pointer-events-none"
                  style={{ opacity: animationProgress * 0.8 }}
                >
                  {node.participants} people
                </text>

                {/* Connection count on hover */}
                {isHovered && (
                  <g>
                    <rect
                      x={node.x - 30}
                      y={node.y - radius - 25}
                      width="60"
                      height="20"
                      fill="rgba(0,0,0,0.8)"
                      rx="4"
                    />
                    <text
                      x={node.x}
                      y={node.y - radius - 12}
                      textAnchor="middle"
                      className="text-xs fill-white font-medium"
                    >
                      {node.connections} connections
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Center info */}
        <g transform={`translate(${centerX}, ${centerY})`}>
          <circle
            cx="0"
            cy="0"
            r="30"
            fill="rgba(255,255,255,0.9)"
            stroke="#d1d5db"
            strokeWidth="2"
            style={{ opacity: animationProgress }}
          />
          <text
            x="0"
            y="-5"
            textAnchor="middle"
            className="text-sm font-bold fill-warmGray-800"
            style={{ opacity: animationProgress }}
          >
            {campaigns.length}
          </text>
          <text
            x="0"
            y="8"
            textAnchor="middle"
            className="text-xs fill-warmGray-600"
            style={{ opacity: animationProgress }}
          >
            Campaigns
          </text>
        </g>
      </svg>

      {/* Legend and stats */}
      <div className="mt-4 space-y-4">
        {/* Department legend */}
        <div className="flex flex-wrap gap-3 justify-center">
          {Object.entries(departmentColors).map(([dept, color]) => (
            <div key={dept} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-warmGray-600">{dept}</span>
            </div>
          ))}
        </div>

        {/* Network stats */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-warmGray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-warmGray-800">
              {nodes.length}
            </div>
            <div className="text-xs text-warmGray-600">Departments</div>
          </div>
          <div className="bg-warmGray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-warmGray-800">
              {links.length}
            </div>
            <div className="text-xs text-warmGray-600">Connections</div>
          </div>
          <div className="bg-warmGray-50 rounded-lg p-3">
            <div className="text-lg font-bold text-warmGray-800">
              {nodes.reduce((sum, n) => sum + n.participants, 0)}
            </div>
            <div className="text-xs text-warmGray-600">Total People</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NetworkDiagram;
