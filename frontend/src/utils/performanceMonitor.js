// Monitoring et métriques de performance
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      pageLoads: {},
      apiCalls: {},
      errors: [],
      resourceTimings: [],
    };
    
    this.initializeObservers();
  }

  initializeObservers() {
    // Observer pour les métriques Web Vitals
    if ('PerformanceObserver' in window) {
      // LCP (Largest Contentful Paint)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.metrics.lcp = lastEntry.startTime;
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // FID (First Input Delay)
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.metrics.fid = entry.processingStart - entry.startTime;
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // CLS (Cumulative Layout Shift)
      const clsObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        let totalShift = 0;
        entries.forEach((entry) => {
          totalShift += entry.value;
        });
        this.metrics.cls = totalShift;
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Resource Timing
      const resourceObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          if (entry.initiatorType === 'fetch' || entry.initiatorType === 'xmlhttprequest') {
            this.metrics.resourceTimings.push({
              name: entry.name,
              duration: entry.duration,
              startTime: entry.startTime,
              initiatorType: entry.initiatorType,
            });
          }
        });
      });
      resourceObserver.observe({ entryTypes: ['resource'] });
    }
  }

  logPageLoad(pageName) {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    
    if (!this.metrics.pageLoads[pageName]) {
      this.metrics.pageLoads[pageName] = [];
    }
    
    this.metrics.pageLoads[pageName].push({
      timestamp: new Date().toISOString(),
      loadTime,
      dns: timing.domainLookupEnd - timing.domainLookupStart,
      tcp: timing.connectEnd - timing.connectStart,
      ttfb: timing.responseStart - timing.requestStart,
      domLoad: timing.domContentLoadedEventEnd - timing.navigationStart,
    });
  }

  logApiCall(endpoint, duration, status) {
    if (!this.metrics.apiCalls[endpoint]) {
      this.metrics.apiCalls[endpoint] = [];
    }
    
    this.metrics.apiCalls[endpoint].push({
      timestamp: new Date().toISOString(),
      duration,
      status,
    });
  }

  logError(error, context) {
    this.metrics.errors.push({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
      context,
    });
  }

  getMetrics() {
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
    };
  }

  // Envoyer les métriques au serveur
  async sendMetrics() {
    try {
      const metrics = this.getMetrics();
      await fetch('/api/metrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metrics),
      });
      
      // Réinitialiser certaines métriques après l'envoi
      this.metrics.resourceTimings = [];
      this.metrics.errors = [];
    } catch (error) {
      console.error('Erreur lors de l\'envoi des métriques:', error);
    }
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Envoyer les métriques toutes les 5 minutes
setInterval(() => {
  performanceMonitor.sendMetrics();
}, 5 * 60 * 1000);
