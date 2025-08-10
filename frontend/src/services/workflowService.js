import api from './api';

export const WORKFLOW_STEPS = {
  CREATE_CAMPAIGN: 1,
  UPLOAD_EMPLOYEES: 2,
  DEFINE_CRITERIA: 3,
  GENERATE_PAIRS: 4,
  CONFIRM_SEND: 5
};

export const workflowService = {
  // Get campaign workflow status
  getCampaignWorkflowStatus: async (campaignId) => {
    try {
      console.log('🔍 workflowService.getCampaignWorkflowStatus: Starting request for campaign:', campaignId);

      // Check authentication before making request
      const accessToken = localStorage.getItem('access_token');
      const refreshToken = localStorage.getItem('refresh_token');

      console.log('🔍 workflowService.getCampaignWorkflowStatus: Auth check:', {
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        campaignId
      });

      if (!accessToken && !refreshToken) {
        console.error('❌ workflowService.getCampaignWorkflowStatus: No authentication tokens');
        throw new Error('Authentication required');
      }

      // This call is kept for detail pages. List pages use bulk endpoint.
      const response = await api.get(`/campaigns/${campaignId}/workflow-status/`);
      console.log('✅ workflowService.getCampaignWorkflowStatus: Success response:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ workflowService.getCampaignWorkflowStatus: Request failed:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        campaignId
      });

      // Check for authentication errors
      if (error.response?.status === 401) {
        console.error('❌ workflowService.getCampaignWorkflowStatus: 401 Unauthorized');
        window.dispatchEvent(new CustomEvent('auth:logout'));
      }

      throw error.response?.data || error.message;
    }
  },
  // Bulk: get workflows for many campaigns in a single call (uses campaigns/with-workflow/ under the hood)
  getCampaignsWithWorkflow: async (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.page_size) queryParams.append('page_size', params.page_size);
    if (params.search) queryParams.append('search', params.search);
    const response = await api.get(`/campaigns/with-workflow/?${queryParams.toString()}`);
    return response.data;
  },

  // Update workflow step completion
  updateWorkflowStep: async (campaignId, step, completed = true, data = {}) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/workflow-step/`, {
        step,
        completed,
        data
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Validate workflow step access
  validateWorkflowStep: async (campaignId, step) => {
    try {
      const response = await api.get(`/campaigns/${campaignId}/workflow-validate/${step}/`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Reset workflow from a specific step
  resetWorkflowFromStep: async (campaignId, fromStep) => {
    try {
      const response = await api.post(`/campaigns/${campaignId}/workflow-reset/`, {
        from_step: fromStep
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get step requirements and dependencies
  getStepRequirements: (step) => {
    const requirements = {
      [WORKFLOW_STEPS.CREATE_CAMPAIGN]: {
        dependencies: [],
        description: 'Create a new campaign with basic information'
      },
      [WORKFLOW_STEPS.UPLOAD_EMPLOYEES]: {
        dependencies: [WORKFLOW_STEPS.CREATE_CAMPAIGN],
        description: 'Import employees via Excel file'
      },
      [WORKFLOW_STEPS.DEFINE_CRITERIA]: {
        dependencies: [WORKFLOW_STEPS.CREATE_CAMPAIGN, WORKFLOW_STEPS.UPLOAD_EMPLOYEES],
        description: 'Define matching criteria (optional)'
      },
      [WORKFLOW_STEPS.GENERATE_PAIRS]: {
        dependencies: [WORKFLOW_STEPS.CREATE_CAMPAIGN, WORKFLOW_STEPS.UPLOAD_EMPLOYEES],
        description: 'Generate employee pairs'
      },
      [WORKFLOW_STEPS.CONFIRM_SEND]: {
        dependencies: [WORKFLOW_STEPS.CREATE_CAMPAIGN, WORKFLOW_STEPS.UPLOAD_EMPLOYEES, WORKFLOW_STEPS.GENERATE_PAIRS],
        description: 'Confirm pairs and send notifications'
      }
    };

    return requirements[step] || { dependencies: [], description: '' };
  },

  // Workflow validation helpers
  validateStepData: {
    [WORKFLOW_STEPS.CREATE_CAMPAIGN]: (data) => {
      const required = ['title', 'start_date', 'end_date'];
      const missing = required.filter(field => !data[field]);
      return {
        valid: missing.length === 0,
        errors: missing.map(field => `The ${field} field is required`),
        warnings: []
      };
    },

    [WORKFLOW_STEPS.UPLOAD_EMPLOYEES]: (data) => {
      const errors = [];
      const warnings = [];

      if (!data.file_name) {
        errors.push('No file uploaded');
      }

      if (!data.employees_count || data.employees_count < 2) {
        errors.push('At least 2 employees are required for pairing');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings
      };
    },

    [WORKFLOW_STEPS.DEFINE_CRITERIA]: (data) => {
      const warnings = [];

      if (!data.criteria || data.criteria.length === 0) {
        warnings.push('No matching criteria defined - random matching will be used');
      }

      return {
        valid: true, // This step is optional
        errors: [],
        warnings
      };
    },

    [WORKFLOW_STEPS.GENERATE_PAIRS]: (data) => {
      const errors = [];

      if (!data.pairs_count || data.pairs_count === 0) {
        errors.push('No pairs generated');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings: []
      };
    },

    [WORKFLOW_STEPS.CONFIRM_SEND]: (data) => {
      const errors = [];

      if (!data.confirmed_pairs || data.confirmed_pairs === 0) {
        errors.push('No pairs confirmed');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings: []
      };
    }
  }
};
