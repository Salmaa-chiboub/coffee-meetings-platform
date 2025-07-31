/**
 * High-performance data processing utilities
 * Optimized algorithms for sorting, grouping, and transforming large datasets
 */

/**
 * Optimized sorting with multiple criteria and caching
 */
export class OptimizedSorter {
  constructor() {
    this.cache = new Map();
    this.maxCacheSize = 50;
  }

  // Multi-field sorting with performance optimization
  sort(data, sortConfig = []) {
    if (!data || data.length === 0) return data;
    if (!sortConfig || sortConfig.length === 0) return data;

    const cacheKey = this.generateCacheKey(data, sortConfig);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    // Create a copy to avoid mutating original data
    const sortedData = [...data].sort((a, b) => {
      for (const { field, direction = 'asc', type = 'string' } of sortConfig) {
        const aValue = this.getNestedValue(a, field);
        const bValue = this.getNestedValue(b, field);
        
        const comparison = this.compareValues(aValue, bValue, type);
        
        if (comparison !== 0) {
          return direction === 'desc' ? -comparison : comparison;
        }
      }
      return 0;
    });

    // Cache management
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(cacheKey, sortedData);
    return sortedData;
  }

  compareValues(a, b, type) {
    // Handle null/undefined values
    if (a == null && b == null) return 0;
    if (a == null) return -1;
    if (b == null) return 1;

    switch (type) {
      case 'number':
        return Number(a) - Number(b);
      
      case 'date':
        const dateA = new Date(a);
        const dateB = new Date(b);
        return dateA.getTime() - dateB.getTime();
      
      case 'string':
      default:
        return String(a).localeCompare(String(b), undefined, { 
          numeric: true, 
          sensitivity: 'base' 
        });
    }
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  generateCacheKey(data, sortConfig) {
    // Simple hash based on data length and sort config
    const configHash = JSON.stringify(sortConfig);
    return `${data.length}-${configHash}`;
  }

  clearCache() {
    this.cache.clear();
  }
}

/**
 * High-performance grouping with indexing
 */
export class DataGrouper {
  constructor() {
    this.cache = new Map();
  }

  // Group data by field with optional aggregation
  groupBy(data, groupField, aggregations = {}) {
    if (!data || data.length === 0) return {};

    const cacheKey = `${groupField}-${JSON.stringify(aggregations)}-${data.length}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const groups = {};

    data.forEach(item => {
      const groupValue = this.getNestedValue(item, groupField);
      const key = String(groupValue || 'undefined');

      if (!groups[key]) {
        groups[key] = {
          key: groupValue,
          items: [],
          count: 0,
          ...this.initializeAggregations(aggregations)
        };
      }

      groups[key].items.push(item);
      groups[key].count++;
      this.updateAggregations(groups[key], item, aggregations);
    });

    // Finalize aggregations
    Object.values(groups).forEach(group => {
      this.finalizeAggregations(group, aggregations);
    });

    this.cache.set(cacheKey, groups);
    return groups;
  }

  // Create hierarchical grouping
  groupByMultiple(data, groupFields) {
    if (!data || data.length === 0 || !groupFields || groupFields.length === 0) {
      return data;
    }

    const [firstField, ...remainingFields] = groupFields;
    const firstLevelGroups = this.groupBy(data, firstField);

    if (remainingFields.length === 0) {
      return firstLevelGroups;
    }

    // Recursively group remaining levels
    Object.keys(firstLevelGroups).forEach(key => {
      const group = firstLevelGroups[key];
      group.subGroups = this.groupByMultiple(group.items, remainingFields);
    });

    return firstLevelGroups;
  }

  initializeAggregations(aggregations) {
    const result = {};
    Object.entries(aggregations).forEach(([field, operations]) => {
      operations.forEach(op => {
        const key = `${field}_${op}`;
        switch (op) {
          case 'sum':
          case 'count':
            result[key] = 0;
            break;
          case 'min':
            result[key] = Infinity;
            break;
          case 'max':
            result[key] = -Infinity;
            break;
          case 'avg':
            result[`${field}_sum`] = 0;
            result[`${field}_count`] = 0;
            break;
          default:
            result[key] = null;
        }
      });
    });
    return result;
  }

  updateAggregations(group, item, aggregations) {
    Object.entries(aggregations).forEach(([field, operations]) => {
      const value = this.getNestedValue(item, field);
      const numValue = Number(value);

      operations.forEach(op => {
        const key = `${field}_${op}`;
        switch (op) {
          case 'sum':
            if (!isNaN(numValue)) group[key] += numValue;
            break;
          case 'min':
            if (!isNaN(numValue)) group[key] = Math.min(group[key], numValue);
            break;
          case 'max':
            if (!isNaN(numValue)) group[key] = Math.max(group[key], numValue);
            break;
          case 'avg':
            if (!isNaN(numValue)) {
              group[`${field}_sum`] += numValue;
              group[`${field}_count`]++;
            }
            break;
        }
      });
    });
  }

  finalizeAggregations(group, aggregations) {
    Object.entries(aggregations).forEach(([field, operations]) => {
      operations.forEach(op => {
        if (op === 'avg') {
          const sumKey = `${field}_sum`;
          const countKey = `${field}_count`;
          const avgKey = `${field}_avg`;
          
          if (group[countKey] > 0) {
            group[avgKey] = group[sumKey] / group[countKey];
          } else {
            group[avgKey] = 0;
          }
          
          // Clean up intermediate values
          delete group[sumKey];
          delete group[countKey];
        }
      });
    });
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  clearCache() {
    this.cache.clear();
  }
}

/**
 * Optimized data transformation pipeline
 */
export class DataTransformer {
  constructor() {
    this.transformations = [];
    this.cache = new Map();
  }

  // Add transformation step
  addTransformation(name, transformFn) {
    this.transformations.push({ name, transformFn });
    return this;
  }

  // Execute transformation pipeline
  transform(data) {
    if (!data || data.length === 0) return data;

    const cacheKey = this.generateCacheKey(data);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    let result = data;
    
    for (const { transformFn } of this.transformations) {
      result = transformFn(result);
    }

    this.cache.set(cacheKey, result);
    return result;
  }

  // Common transformations
  static transformations = {
    // Flatten nested arrays
    flatten: (data) => data.flat(),
    
    // Remove duplicates based on key
    deduplicate: (keyFn = item => item.id) => (data) => {
      const seen = new Set();
      return data.filter(item => {
        const key = keyFn(item);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    },

    // Map transformation
    map: (mapFn) => (data) => data.map(mapFn),

    // Filter transformation
    filter: (filterFn) => (data) => data.filter(filterFn),

    // Chunk data into smaller arrays
    chunk: (size) => (data) => {
      const chunks = [];
      for (let i = 0; i < data.length; i += size) {
        chunks.push(data.slice(i, i + size));
      }
      return chunks;
    },

    // Add computed fields
    addComputedField: (fieldName, computeFn) => (data) => 
      data.map(item => ({
        ...item,
        [fieldName]: computeFn(item)
      })),

    // Normalize data structure
    normalize: (schema) => (data) => 
      data.map(item => {
        const normalized = {};
        Object.entries(schema).forEach(([newKey, oldKey]) => {
          normalized[newKey] = typeof oldKey === 'function' 
            ? oldKey(item) 
            : item[oldKey];
        });
        return normalized;
      })
  };

  generateCacheKey(data) {
    const transformationNames = this.transformations.map(t => t.name).join('-');
    return `${data.length}-${transformationNames}`;
  }

  clearCache() {
    this.cache.clear();
  }

  reset() {
    this.transformations = [];
    this.clearCache();
    return this;
  }
}

/**
 * Performance monitoring for data operations
 */
export class DataPerformanceMonitor {
  constructor() {
    this.metrics = new Map();
  }

  // Measure operation performance
  measure(operationName, operation) {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    this.recordMetric(operationName, duration);
    
    return result;
  }

  // Async operation measurement
  async measureAsync(operationName, asyncOperation) {
    const startTime = performance.now();
    const result = await asyncOperation();
    const endTime = performance.now();
    
    const duration = endTime - startTime;
    this.recordMetric(operationName, duration);
    
    return result;
  }

  recordMetric(operationName, duration) {
    if (!this.metrics.has(operationName)) {
      this.metrics.set(operationName, {
        count: 0,
        totalTime: 0,
        minTime: Infinity,
        maxTime: 0,
        avgTime: 0
      });
    }

    const metric = this.metrics.get(operationName);
    metric.count++;
    metric.totalTime += duration;
    metric.minTime = Math.min(metric.minTime, duration);
    metric.maxTime = Math.max(metric.maxTime, duration);
    metric.avgTime = metric.totalTime / metric.count;
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }

  clearMetrics() {
    this.metrics.clear();
  }
}

// Export instances for immediate use
export const sorter = new OptimizedSorter();
export const grouper = new DataGrouper();
export const transformer = new DataTransformer();
export const performanceMonitor = new DataPerformanceMonitor();

export default {
  OptimizedSorter,
  DataGrouper,
  DataTransformer,
  DataPerformanceMonitor,
  sorter,
  grouper,
  transformer,
  performanceMonitor
};
