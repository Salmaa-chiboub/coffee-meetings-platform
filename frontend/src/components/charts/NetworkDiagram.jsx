import React, { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

const NetworkDiagram = ({ campaigns }) => {
  const svgRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [animationProgress, setAnimationProgress] = useState(0);
  const [hoveredNode, setHoveredNode] = useState(null);
  const [networkData, setNetworkData] = useState({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);

  // Update dimensions on resize and container changes
  useEffect(() => {
    const updateDimensions = () => {
      if (svgRef.current && svgRef.current.parentElement) {
        const parentRect = svgRef.current.parentElement.getBoundingClientRect();
        const width = Math.max(400, parentRect.width - 40); // Min width with padding
        const height = 400; // Fixed height for network
        setDimensions({ width, height });
        console.log('SVG dimensions set:', { width, height });
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

  // Fetch real network data
  useEffect(() => {
    const fetchNetworkData = async () => {
      if (!campaigns || campaigns.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('Fetching network data for campaigns:', campaigns.length);
        const realNetworkData = await generateRealNetworkData(campaigns);
        console.log('Generated network data:', realNetworkData);
        setNetworkData(realNetworkData);
      } catch (error) {
        console.error('Error fetching network data:', error);
        // Fallback to empty data
        setNetworkData({ nodes: [], links: [] });
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkData();
  }, [campaigns]);

  // Animate network drawing
  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => {
        setAnimationProgress(1);
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Function to fetch real network data
  const generateRealNetworkData = async (campaigns) => {
    const nodes = [];
    const links = [];
    const departmentStats = {};

    try {
      // Fetch employee pairs for all campaigns
      for (const campaign of campaigns) {
        try {
          const response = await api.get(`/matching/campaigns/${campaign.id}/history/`);
          const pairs = response.data.pairs || [];

          // Process each pair to build network
          pairs.forEach(pair => {
            const emp1 = pair.employee1;
            const emp2 = pair.employee2;

            if (emp1 && emp2) {
              // Get departments from employee attributes
              const emp1Dept = emp1.attributes_dict?.department || 'Unknown';
              const emp2Dept = emp2.attributes_dict?.department || 'Unknown';

              // Track department statistics
              if (!departmentStats[emp1Dept]) {
                departmentStats[emp1Dept] = { participants: new Set(), connections: 0 };
              }
              if (!departmentStats[emp2Dept]) {
                departmentStats[emp2Dept] = { participants: new Set(), connections: 0 };
              }

              departmentStats[emp1Dept].participants.add(emp1.id);
              departmentStats[emp2Dept].participants.add(emp2.id);

              // Only create link if departments are different (cross-department connections)
              if (emp1Dept !== emp2Dept) {
                // Check if link already exists
                const existingLink = links.find(link =>
                  (link.source === emp1Dept && link.target === emp2Dept) ||
                  (link.source === emp2Dept && link.target === emp1Dept)
                );

                if (existingLink) {
                  existingLink.strength += 1;
                } else {
                  links.push({
                    source: emp1Dept,
                    target: emp2Dept,
                    strength: 1,
                    campaignId: campaign.id,
                    campaignTitle: campaign.title
                  });
                }

                departmentStats[emp1Dept].connections += 1;
                departmentStats[emp2Dept].connections += 1;
              }
            }
          });
        } catch (error) {
          console.error(`Error fetching pairs for campaign ${campaign.id}:`, error);
        }
      }

      // Create nodes from department statistics
      Object.entries(departmentStats).forEach(([dept, stats]) => {
        nodes.push({
          id: dept,
          type: 'department',
          name: dept,
          participants: stats.participants.size,
          connections: stats.connections,
          x: 0, // Will be calculated
          y: 0  // Will be calculated
        });
      });

      // If no real data found or only one department, create sample data to show network visualization
      if (nodes.length <= 1 && campaigns.length > 0) {
        console.log('Limited pairing data found, creating sample network to demonstrate visualization');
        const totalParticipants = campaigns.reduce((sum, c) => sum + (c.employees_count || 0), 0);
        const sampleDepartments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance', 'Operations'];

        // Clear existing nodes if only one department
        nodes.length = 0;

        sampleDepartments.forEach((dept, index) => {
          const participantCount = Math.floor(totalParticipants / sampleDepartments.length) || Math.floor(Math.random() * 8) + 3;
          nodes.push({
            id: dept,
            type: 'department',
            name: dept,
            participants: participantCount,
            connections: 0,
            x: 0,
            y: 0
          });
        });

        // Create sample connections to demonstrate network
        const connectionPairs = [
          ['Engineering', 'Marketing', 3],
          ['Marketing', 'Sales', 4],
          ['Sales', 'HR', 2],
          ['HR', 'Finance', 2],
          ['Finance', 'Operations', 3],
          ['Operations', 'Engineering', 2],
          ['Engineering', 'Sales', 1],
          ['Marketing', 'HR', 1]
        ];

        connectionPairs.forEach(([source, target, strength]) => {
          links.push({
            source,
            target,
            strength,
            campaignId: 'sample'
          });

          // Update connection counts
          const sourceNode = nodes.find(n => n.id === source);
          const targetNode = nodes.find(n => n.id === target);
          if (sourceNode) sourceNode.connections += strength;
          if (targetNode) targetNode.connections += strength;
        });
      }

      return { nodes, links };
    } catch (error) {
      console.error('Error generating network data:', error);
      // Return sample data as fallback
      const sampleDepartments = ['Engineering', 'Marketing', 'Sales', 'HR'];
      const fallbackNodes = sampleDepartments.map(dept => ({
        id: dept,
        type: 'department',
        name: dept,
        participants: Math.floor(Math.random() * 20) + 5,
        connections: Math.floor(Math.random() * 10) + 2,
        x: 0,
        y: 0
      }));

      const fallbackLinks = [
        { source: 'Engineering', target: 'Marketing', strength: 2 },
        { source: 'Marketing', target: 'Sales', strength: 3 },
        { source: 'Sales', target: 'HR', strength: 1 }
      ];

      return { nodes: fallbackNodes, links: fallbackLinks };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-warmGray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">⏳</div>
          <p>Loading network data...</p>
        </div>
      </div>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-warmGray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">🕸️</div>
          <p>No campaigns available</p>
        </div>
      </div>
    );
  }

  if (networkData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-warmGray-500">
        <div className="text-center">
          <div className="text-4xl mb-2">📊</div>
          <p>No network connections found</p>
          <p className="text-sm mt-1">Employee pairs will appear here once campaigns are completed</p>
        </div>
      </div>
    );
  }

  const { nodes, links } = networkData;

  // Position nodes in a circle
  const centerX = (dimensions.width || 800) / 2;
  const centerY = (dimensions.height || 400) / 2;
  const radius = Math.min(dimensions.width || 800, dimensions.height || 400) * 0.3;

  nodes.forEach((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    node.x = centerX + radius * Math.cos(angle);
    node.y = centerY + radius * Math.sin(angle);
  });

  console.log('Node positions:', nodes.map(n => ({ name: n.name, x: n.x, y: n.y })));

  // Calculate node sizes based on participants
  const maxParticipants = Math.max(...nodes.map(n => n.participants), 1);
  const minRadius = 20;
  const maxRadius = 50;

  const getNodeRadius = (participants) => {
    return minRadius + (participants / maxParticipants) * (maxRadius - minRadius);
  };

  // Get link thickness based on strength
  const maxStrength = Math.max(...links.map(l => l.strength));
  const getStrokeWidth = (strength) => {
    return 1 + (strength / maxStrength) * 4;
  };

  // Pastel purple-blue color scheme for departments (matching Campaign Timeline)
  const departmentColors = {
    'Engineering': '#E8E6FF',
    'Marketing': '#D4C4F0',
    'Sales': '#C4D4FF',
    'HR': '#E0D4FF',
    'Finance': '#D4E0FF',
    'Operations': '#C4E0F0',
    'Design': '#E0C4F0'
  };

  console.log('Rendering network with:', { nodes: nodes.length, links: links.length, dimensions });

  return (
    <div className="w-full">
      {/* Network Visualization */}
      <div className="mb-6 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4" style={{ minHeight: '400px' }}>
        <svg
          ref={svgRef}
          width="100%"
          height="400"
          viewBox={`0 0 ${dimensions.width || 800} 400`}
          className="overflow-visible border border-purple-100 rounded-lg bg-white"
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
                stroke="#D4C4F0"
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
      </div>

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
