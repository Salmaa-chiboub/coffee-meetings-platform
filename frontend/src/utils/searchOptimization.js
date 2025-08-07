/**
 * Fuzzy search utility for optimized searching
 */
export class FuzzySearch {
  constructor(items = [], keys = []) {
    this.items = items;
    this.keys = keys;
  }

  /**
   * Calculate Levenshtein distance between two strings
   */
  static levenshteinDistance(str1, str2) {
    const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,
          matrix[j - 1][i] + 1,
          matrix[j - 1][i - 1] + substitutionCost
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  /**
   * Calculate similarity score between query and text
   */
  static calculateScore(query, text) {
    if (!query || !text) return 0;
    
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    // Exact match gets highest score
    if (textLower === queryLower) return 1;
    
    // Starts with query gets high score
    if (textLower.startsWith(queryLower)) return 0.9;
    
    // Contains query gets medium score
    if (textLower.includes(queryLower)) return 0.7;
    
    // Use Levenshtein distance for fuzzy matching
    const distance = FuzzySearch.levenshteinDistance(queryLower, textLower);
    const maxLength = Math.max(queryLower.length, textLower.length);
    
    if (maxLength === 0) return 0;
    
    const similarity = 1 - (distance / maxLength);
    return similarity > 0.5 ? similarity * 0.5 : 0; // Scale down fuzzy matches
  }

  /**
   * Search through items with fuzzy matching
   */
  search(query, options = {}) {
    const { threshold = 0.3, limit = 50 } = options;
    
    if (!query || query.trim() === '') {
      return this.items.slice(0, limit);
    }

    const results = this.items
      .map(item => {
        let maxScore = 0;
        let matchedKey = '';

        // Search in specified keys or all string properties
        const searchKeys = this.keys.length > 0 ? this.keys : Object.keys(item);
        
        for (const key of searchKeys) {
          const value = this.getNestedValue(item, key);
          if (typeof value === 'string') {
            const score = FuzzySearch.calculateScore(query, value);
            if (score > maxScore) {
              maxScore = score;
              matchedKey = key;
            }
          }
        }

        return {
          item,
          score: maxScore,
          matchedKey
        };
      })
      .filter(result => result.score >= threshold)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results.map(result => result.item);
  }

  /**
   * Get nested value from object using dot notation
   */
  getNestedValue(obj, key) {
    return key.split('.').reduce((current, prop) => {
      return current && current[prop] !== undefined ? current[prop] : '';
    }, obj);
  }

  /**
   * Update search items
   */
  updateItems(items) {
    this.items = items;
  }

  /**
   * Update search keys
   */
  updateKeys(keys) {
    this.keys = keys;
  }
}

/**
 * Debounce function for search optimization
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Highlight search terms in text
 */
export const highlightSearchTerms = (text, query) => {
  if (!query || !text) return text;
  
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
};
