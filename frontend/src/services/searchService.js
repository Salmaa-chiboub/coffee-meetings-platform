import { authAPI } from './api';
import { campaignService } from './campaignService';
import { FuzzySearch } from '../utils/searchOptimization';

/**
 * Global search service for CoffeeMeet platform
 * Searches across campaigns, employees, and other data
 */
export class GlobalSearchService {
  constructor() {
    this.fuzzySearch = new FuzzySearch({ threshold: 0.3 });
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Perform global search across all data types
   * @param {string} query - Search query
   * @param {object} options - Search options
   * @returns {Promise<object>} - Search results grouped by type
   */
  async globalSearch(query, options = {}) {
    if (!query || query.trim().length < 2) {
      return {
        campaigns: [],
        employees: [],
        total: 0,
        query: query
      };
    }

    const { limit = 10, includeEmployees = true, includeCampaigns = true } = options;

    try {
      const results = await Promise.allSettled([
        includeCampaigns ? this.searchCampaigns(query, limit) : Promise.resolve([]),
        includeEmployees ? this.searchEmployees(query, limit) : Promise.resolve([])
      ]);

      const campaigns = results[0].status === 'fulfilled' ? results[0].value : [];
      const employees = results[1].status === 'fulfilled' ? results[1].value : [];

      return {
        campaigns,
        employees,
        total: campaigns.length + employees.length,
        query: query.trim()
      };
    } catch (error) {
      console.error('Global search error:', error);
      return {
        campaigns: [],
        employees: [],
        total: 0,
        query: query,
        error: 'Search failed'
      };
    }
  }

  /**
   * Search campaigns
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} - Campaign results
   */
  async searchCampaigns(query, limit = 10) {
    try {
      // Try to use real API first
      const response = await authAPI.getCampaigns({
        search: query,
        page_size: limit
      });

      if (response.success && response.data) {
        const campaigns = Array.isArray(response.data) ? response.data : response.data.results || [];
        if (campaigns.length > 0) {
          return campaigns.map(campaign => ({
            ...campaign,
            type: 'campaign',
            searchScore: this.calculateRelevanceScore(query, campaign, ['title', 'description'])
          }));
        }
      }

      // Fallback to mock data for demo
      const mockCampaigns = [
        {
          id: 1,
          title: 'Weekly Coffee Meetings',
          description: 'Regular weekly coffee meetings for team bonding',
          start_date: '2024-01-01',
          end_date: '2024-12-31',
          employees_count: 25
        },
        {
          id: 2,
          title: 'Marketing Team Integration',
          description: 'Cross-department connections for marketing team',
          start_date: '2024-02-01',
          end_date: '2024-04-30',
          employees_count: 12
        },
        {
          id: 3,
          title: 'New Employee Onboarding',
          description: 'Coffee meetings for new employee integration',
          start_date: '2024-01-15',
          end_date: '2024-06-15',
          employees_count: 8
        },
        {
          id: 4,
          title: 'Innovation Sessions',
          description: 'Creative coffee meetings for innovation and brainstorming',
          start_date: '2024-03-01',
          end_date: '2024-05-31',
          employees_count: 18
        }
      ];

      // Filter campaigns by query using fuzzy search
      const filteredCampaigns = this.fuzzySearch.search(query, mockCampaigns, ['title', 'description']);

      return filteredCampaigns.slice(0, limit).map(campaign => ({
        ...campaign,
        type: 'campaign',
        searchScore: this.calculateRelevanceScore(query, campaign, ['title', 'description'])
      }));
    } catch (error) {
      console.warn('Campaign search failed:', error);
      return [];
    }
  }

  /**
   * Search employees
   * @param {string} query - Search query
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} - Employee results
   */
  async searchEmployees(query, limit = 10) {
    try {
      // For demo purposes, return mock employee data that matches the query
      // In production, this would call the actual employee API
      const mockEmployees = [
        { id: 1, name: 'Mark Johnson', email: 'mark.johnson@company.com', arrival_date: '2023-01-15' },
        { id: 2, name: 'Sarah Marketing', email: 'sarah.m@company.com', arrival_date: '2023-03-20' },
        { id: 3, name: 'John Smith', email: 'john.smith@company.com', arrival_date: '2023-02-10' },
        { id: 4, name: 'Emily Marketing', email: 'emily.marketing@company.com', arrival_date: '2023-04-05' },
        { id: 5, name: 'David Tech', email: 'david.tech@company.com', arrival_date: '2023-01-30' },
        { id: 6, name: 'Lisa HR', email: 'lisa.hr@company.com', arrival_date: '2023-05-12' },
        { id: 7, name: 'Michael Sales', email: 'michael.sales@company.com', arrival_date: '2023-03-08' },
        { id: 8, name: 'Anna Remote', email: 'anna.remote@company.com', arrival_date: '2023-06-01' }
      ];

      // Filter employees by query using fuzzy search
      const filteredEmployees = this.fuzzySearch.search(query, mockEmployees, ['name', 'email']);

      return filteredEmployees.slice(0, limit).map(employee => ({
        ...employee,
        type: 'employee',
        searchScore: this.calculateRelevanceScore(query, employee, ['name', 'email'])
      }));
    } catch (error) {
      console.warn('Employee search failed:', error);
      return [];
    }
  }

  /**
   * Calculate relevance score for search results
   * @param {string} query - Search query
   * @param {object} item - Item to score
   * @param {Array} fields - Fields to search in
   * @returns {number} - Relevance score (0-1)
   */
  calculateRelevanceScore(query, item, fields) {
    let maxScore = 0;
    const queryLower = query.toLowerCase();

    fields.forEach(field => {
      const value = item[field];
      if (value && typeof value === 'string') {
        const valueLower = value.toLowerCase();
        
        // Exact match gets highest score
        if (valueLower === queryLower) {
          maxScore = Math.max(maxScore, 1.0);
        }
        // Starts with query gets high score
        else if (valueLower.startsWith(queryLower)) {
          maxScore = Math.max(maxScore, 0.9);
        }
        // Contains query gets medium score
        else if (valueLower.includes(queryLower)) {
          maxScore = Math.max(maxScore, 0.7);
        }
        // Fuzzy match gets lower score
        else {
          const fuzzyScore = this.fuzzySearch.similarity(queryLower, valueLower);
          maxScore = Math.max(maxScore, fuzzyScore * 0.5);
        }
      }
    });

    return maxScore;
  }

  /**
   * Get search suggestions based on query
   * @param {string} query - Partial query
   * @returns {Promise<Array>} - Search suggestions
   */
  async getSearchSuggestions(query) {
    if (!query || query.length < 2) return [];

    try {
      const results = await this.globalSearch(query, { limit: 5 });
      const suggestions = [];

      // Add campaign suggestions
      results.campaigns.forEach(campaign => {
        suggestions.push({
          text: campaign.title,
          type: 'campaign',
          icon: '📋',
          action: () => `/campaigns/${campaign.id}`
        });
      });

      // Add employee suggestions
      results.employees.forEach(employee => {
        suggestions.push({
          text: employee.name,
          type: 'employee', 
          icon: '👤',
          subtitle: employee.email,
          action: () => `/employees/${employee.id}`
        });
      });

      return suggestions.slice(0, 8); // Limit to 8 suggestions
    } catch (error) {
      console.error('Search suggestions error:', error);
      return [];
    }
  }

  /**
   * Clear search cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
export const globalSearchService = new GlobalSearchService();

// Export default search function for easy use
export const searchGlobal = (query, options) => {
  return globalSearchService.globalSearch(query, options);
};

export default globalSearchService;
