import React, { useState, useEffect } from 'react';

const CountUp = ({
  end,
  duration = 4000,
  suffix = '',
  className = '',
  delay = 0
}) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Add delay before starting animation
    const timeoutId = setTimeout(() => {
      let startTime;
      let animationFrame;

      const animate = (timestamp) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);

        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentCount = Math.floor(easeOutQuart * end);

        setCount(currentCount);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        } else {
          setCount(end);
        }
      };

      animationFrame = requestAnimationFrame(animate);

      return () => {
        if (animationFrame) {
          cancelAnimationFrame(animationFrame);
        }
      };
    }, delay);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [end, duration, delay]);

  return (
    <div className={className}>
      {count}{suffix}
    </div>
  );
};

export default CountUp;
