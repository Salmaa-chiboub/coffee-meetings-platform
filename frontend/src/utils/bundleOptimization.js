/**
 * Bundle optimization utilities
 * Helps identify and optimize large dependencies and imports
 */

/**
 * Lazy load heavy libraries only when needed
 * This reduces initial bundle size significantly
 */
export const lazyLoaders = {
  // Chart libraries (if we add them later)
  chartjs: () => import('chart.js'),
  
  // Date libraries
  dateFns: () => import('date-fns'),
  moment: () => import('moment'),
  
  // Excel processing
  xlsx: () => import('xlsx'),
  
  // PDF generation
  jsPDF: () => import('jspdf'),
  
  // Image processing
  imageCompression: () => import('browser-image-compression'),
  
  // Rich text editors
  quill: () => import('quill'),
  
  // Code highlighting
  prism: () => import('prismjs'),
  
  // Animation libraries
  lottie: () => import('lottie-web'),
  
  // Utility libraries
  lodash: () => import('lodash'),
  ramda: () => import('ramda'),
};

/**
 * Tree-shakable utility functions
 * Import only what you need instead of entire libraries
 */
export const utils = {
  // Date utilities (lightweight alternatives to moment.js)
  formatDate: (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    switch (format) {
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`;
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`;
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`;
      default:
        return d.toLocaleDateString();
    }
  },

  // Debounce function (lightweight alternative to lodash)
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function
  throttle: (func, limit) => {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Deep clone (lightweight alternative to lodash)
  deepClone: (obj) => {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime());
    if (obj instanceof Array) return obj.map(item => utils.deepClone(item));
    if (typeof obj === 'object') {
      const clonedObj = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = utils.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
  },

  // Array utilities
  chunk: (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  },

  uniq: (array) => [...new Set(array)],

  groupBy: (array, key) => {
    return array.reduce((groups, item) => {
      const group = typeof key === 'function' ? key(item) : item[key];
      groups[group] = groups[group] || [];
      groups[group].push(item);
      return groups;
    }, {});
  },

  // String utilities
  slugify: (text) => {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-');
  },

  capitalize: (text) => {
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  },

  // Number utilities
  formatNumber: (num, decimals = 0) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  },

  formatCurrency: (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  },

  // Validation utilities
  isEmail: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  isUrl: (url) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  // File utilities
  formatFileSize: (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  getFileExtension: (filename) => {
    return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
  },

  // Lightweight clsx alternative (if we want to replace clsx)
  cn: (...classes) => {
    return classes
      .flat()
      .filter(Boolean)
      .map(cls => {
        if (typeof cls === 'string') return cls;
        if (typeof cls === 'object' && cls !== null) {
          return Object.entries(cls)
            .filter(([, value]) => Boolean(value))
            .map(([key]) => key)
            .join(' ');
        }
        return '';
      })
      .join(' ')
      .trim();
  },
};

/**
 * Performance monitoring utilities
 */
export const performance = {
  // Measure component render time
  measureRender: (componentName, renderFn) => {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${componentName} render time: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  },

  // Measure async operation time
  measureAsync: async (operationName, asyncFn) => {
    const start = performance.now();
    const result = await asyncFn();
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`${operationName} time: ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  },

  // Memory usage monitoring
  getMemoryUsage: () => {
    if (performance.memory) {
      return {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576),
        total: Math.round(performance.memory.totalJSHeapSize / 1048576),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1048576),
      };
    }
    return null;
  },
};

/**
 * Code splitting helpers
 */
export const codeSplitting = {
  // Create a lazy component with error boundary
  createLazyComponent: (importFn, fallback = null) => {
    const LazyComponent = React.lazy(importFn);
    
    return (props) => (
      <React.Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </React.Suspense>
    );
  },

  // Preload a lazy component
  preloadComponent: (importFn) => {
    const componentImport = importFn();
    return componentImport;
  },
};

export default {
  lazyLoaders,
  utils,
  performance,
  codeSplitting,
};
