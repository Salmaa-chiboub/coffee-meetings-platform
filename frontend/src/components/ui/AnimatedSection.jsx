import React from 'react';
import useScrollAnimation from '../../hooks/useScrollAnimation';

const AnimatedSection = ({
  children,
  className = '',
  animation = 'fadeInUp',
  delay = 0,
  duration = 300,
  ...props
}) => {
  const [ref, isVisible] = useScrollAnimation({
    threshold: 0.15,
    triggerOnce: true,
    delay
  });

  const getAnimationClasses = () => {
    const baseClasses = `transition-all ease-out`;
    const durationClass = `duration-${duration}`;
    
    switch (animation) {
      case 'fadeIn':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100' 
            : 'opacity-0'
        }`;
      
      case 'fadeInUp':
        return `${baseClasses} ${durationClass} ${
          isVisible
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 translate-y-4'
        }`;
      
      case 'fadeInDown':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 -translate-y-8'
        }`;
      
      case 'fadeInLeft':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 -translate-x-8'
        }`;
      
      case 'fadeInRight':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 translate-x-0' 
            : 'opacity-0 translate-x-8'
        }`;
      
      case 'scaleIn':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 scale-100' 
            : 'opacity-0 scale-95'
        }`;
      
      case 'slideInUp':
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-16'
        }`;
      
      default:
        return `${baseClasses} ${durationClass} ${
          isVisible 
            ? 'opacity-100 translate-y-0' 
            : 'opacity-0 translate-y-8'
        }`;
    }
  };

  return (
    <div
      ref={ref}
      className={`${getAnimationClasses()} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export default AnimatedSection;
