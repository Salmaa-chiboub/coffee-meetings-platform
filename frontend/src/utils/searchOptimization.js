import React from 'react';

/**
 * Advanced search and filtering optimization utilities
 * Provides high-performance search algorithms and caching mechanisms
 */

/**
 * Fuzzy search implementation for better user experience
 * Uses Levenshtein distance for approximate string matching
 */
export class FuzzySearch {
  constructor(options = {}) {
    this.threshold = options.threshold || 0.6; // Similarity threshold (0-1)
    this.caseSensitive = options.caseSensitive || false;
    this.cache = new Map(); // Cache for performance
  }

  // Calculate Levenshtein distance between two strings
  levenshteinDistance(str1, str2) {
    const cacheKey = `${str1}:${str2}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    if (!this.caseSensitive) {
      str1 = str1.toLowerCase();
      str2 = str2.toLowerCase();
    }

    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;

    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1, // deletion
          matrix[j - 1][i] + 1, // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }

    const distance = matrix[str2.length][str1.length];
    this.cache.set(cacheKey, distance);
    return distance;
  }

  // Calculate similarity score (0-1, where 1 is exact match)
  similarity(str1, str2) {
    const maxLength = Math.max(str1.length, str2.length);
    if (maxLength === 0) return 1;
    
    const distance = this.levenshteinDistance(str1, str2);
    return 1 - distance / maxLength;
  }

  // Search for matches in a dataset
  search(query, items, fields = ['title', 'name']) {
    if (!query || query.trim() === '') return items;

    const results = items.map(item => {
      let maxScore = 0;
      
      fields.forEach(field => {
        const value = this.getNestedValue(item, field);
        if (value && typeof value === 'string') {
          const score = this.similarity(query, value);
          maxScore = Math.max(maxScore, score);
        }
      });

      return { item, score: maxScore };
    });

    return results
      .filter(result => result.score >= this.threshold)
      .sort((a, b) => b.score - a.score)
      .map(result => result.item);
  }

  // Helper to get nested object values
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Clear cache to prevent memory leaks
  clearCache() {
    this.cache.clear();
  }
}

/**
 * High-performance filtering with indexing
 */
export class IndexedFilter {
  constructor() {
    this.indexes = new Map();
    this.data = [];
  }

  // Build indexes for fast filtering
  buildIndexes(data, indexFields = []) {
    this.data = data;
    this.indexes.clear();

    indexFields.forEach(field => {
      const index = new Map();
      
      data.forEach((item, itemIndex) => {
        const value = this.getNestedValue(item, field);
        if (value !== null && value !== undefined) {
          const key = String(value).toLowerCase();
          if (!index.has(key)) {
            index.set(key, []);
          }
          index.get(key).push(itemIndex);
        }
      });

      this.indexes.set(field, index);
    });
  }

  // Fast filtering using indexes
  filter(filters = {}) {
    if (Object.keys(filters).length === 0) return this.data;

    let resultIndexes = null;

    Object.entries(filters).forEach(([field, value]) => {
      if (value === null || value === undefined || value === '') return;

      const index = this.indexes.get(field);
      if (!index) {
        // Fallback to linear search if no index
        const fieldIndexes = this.data
          .map((item, idx) => ({ item, idx }))
          .filter(({ item }) => {
            const itemValue = this.getNestedValue(item, field);
            return this.matchesFilter(itemValue, value);
          })
          .map(({ idx }) => idx);

        resultIndexes = resultIndexes 
          ? resultIndexes.filter(idx => fieldIndexes.includes(idx))
          : fieldIndexes;
        return;
      }

      // Use index for fast lookup
      const searchKey = String(value).toLowerCase();
      let fieldIndexes = [];

      if (typeof value === 'string' && value.includes('*')) {
        // Wildcard search
        const pattern = value.replace(/\*/g, '.*');
        const regex = new RegExp(pattern, 'i');
        
        for (const [key, indexes] of index.entries()) {
          if (regex.test(key)) {
            fieldIndexes.push(...indexes);
          }
        }
      } else {
        // Exact match
        fieldIndexes = index.get(searchKey) || [];
      }

      resultIndexes = resultIndexes 
        ? resultIndexes.filter(idx => fieldIndexes.includes(idx))
        : fieldIndexes;
    });

    return resultIndexes ? resultIndexes.map(idx => this.data[idx]) : [];
  }

  // Helper methods
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  matchesFilter(itemValue, filterValue) {
    if (typeof filterValue === 'string') {
      return String(itemValue).toLowerCase().includes(filterValue.toLowerCase());
    }
    return itemValue === filterValue;
  }
}

// Note: useOptimizedSearch hook moved to separate file to avoid ESLint issues

export default {
  FuzzySearch,
  IndexedFilter
};
