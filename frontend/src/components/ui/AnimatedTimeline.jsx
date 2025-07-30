import React, { useState, useEffect, useRef } from 'react';

const AnimatedTimeline = ({ children, className = '' }) => {
  const [lineProgress, setLineProgress] = useState(0);
  const [visibleSteps, setVisibleSteps] = useState(new Set());
  const timelineRef = useRef(null);
  const stepRefs = useRef([]);

  useEffect(() => {
    const handleScroll = () => {
      if (!timelineRef.current) return;

      const timelineRect = timelineRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate timeline progress
      const timelineTop = timelineRect.top;
      const timelineHeight = timelineRect.height;
      const timelineBottom = timelineTop + timelineHeight;
      
      // Start animation when timeline enters viewport
      const startOffset = windowHeight * 0.8; // Start when 80% down the viewport
      const endOffset = windowHeight * 0.2;   // End when 20% from top
      
      let progress = 0;
      
      if (timelineTop <= startOffset && timelineBottom >= endOffset) {
        // Timeline is in view, calculate progress
        const visibleTop = Math.max(0, startOffset - timelineTop);
        const visibleHeight = Math.min(timelineHeight, startOffset - Math.max(timelineTop, endOffset));
        progress = Math.min(1, Math.max(0, visibleTop / timelineHeight));
      } else if (timelineTop < endOffset) {
        // Timeline has passed through viewport
        progress = 1;
      }
      
      setLineProgress(progress);

      // Check which steps are visible
      const newVisibleSteps = new Set();
      stepRefs.current.forEach((stepRef, index) => {
        if (stepRef) {
          const stepRect = stepRef.getBoundingClientRect();
          const stepCenter = stepRect.top + stepRect.height / 2;
          
          // Step is visible when its center is in the middle 60% of viewport
          if (stepCenter >= windowHeight * 0.2 && stepCenter <= windowHeight * 0.8) {
            newVisibleSteps.add(index);
          }
        }
      });
      
      setVisibleSteps(newVisibleSteps);
    };

    // Initial check
    handleScroll();
    
    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  const addStepRef = (index) => (el) => {
    stepRefs.current[index] = el;
  };

  return (
    <div ref={timelineRef} className={`relative ${className}`}>
      {/* Animated Connecting Line */}
      <div className="hidden lg:block absolute left-1/2 top-0 bottom-0 w-0.5 transform -translate-x-1/2 z-0">
        {/* Background line (full length, faded) */}
        <div className="absolute inset-0 bg-peach-200 opacity-30"></div>
        
        {/* Animated line (grows with scroll) */}
        <div 
          className="absolute top-0 left-0 right-0 bg-gradient-to-b from-peach-400 via-peach-500 to-peach-400 transition-all duration-300 ease-out"
          style={{
            height: `${lineProgress * 100}%`,
            boxShadow: '0 0 10px rgba(251, 146, 60, 0.3)'
          }}
        ></div>
      </div>

      {/* Steps with animated dots */}
      {React.Children.map(children, (child, index) => (
        <div
          ref={addStepRef(index)}
          className="relative z-10"
        >
          {/* Animated connector dot */}
          <div 
            className={`hidden lg:block absolute left-1/2 top-1/2 w-6 h-6 bg-peach-600 rounded-full transform -translate-x-1/2 -translate-y-1/2 z-20 border-4 border-white shadow-lg transition-all duration-500 ease-out ${
              visibleSteps.has(index) 
                ? 'scale-100 opacity-100' 
                : 'scale-0 opacity-0'
            }`}
            style={{
              transitionDelay: visibleSteps.has(index) ? `${index * 200}ms` : '0ms'
            }}
          >
            {/* Pulse effect when visible */}
            {visibleSteps.has(index) && (
              <div className="absolute inset-0 bg-peach-600 rounded-full animate-ping opacity-20"></div>
            )}
          </div>
          
          {child}
        </div>
      ))}
    </div>
  );
};

export default AnimatedTimeline;
