import api from './api';

export const employeeService = {
  // Get all employees with optional campaign filter
  getEmployees: async (params = {}) => {
    try {
      const response = await api.get('/employees/', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get employees by campaign
  getEmployeesByCampaign: async (campaignId) => {
    try {
      const response = await api.get('/employees/by-campaign/', {
        params: { campaign_id: campaignId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Upload Excel file with employee data
  uploadExcel: async (campaignId, file, replaceExisting = false) => {
    try {
      console.log('📤 uploadExcel called with:', { campaignId, fileName: file?.name, fileSize: file?.size, replaceExisting });

      if (!campaignId || campaignId === 'undefined') {
        throw new Error('Campaign ID is required and cannot be undefined');
      }

      if (!file) {
        throw new Error('File is required');
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('campaign_id', campaignId);
      formData.append('replace_existing', replaceExisting);

      console.log('📤 FormData contents:', {
        file: file.name,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        campaign_id: campaignId,
        replace_existing: replaceExisting
      });

      // No timeout for large Excel processing (operation can be long)
      const response = await api.post('/employees/upload_excel/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 0,
      });
      return response.data;
    } catch (error) {
      console.error('❌ uploadExcel error:', error);
      throw error.response?.data || error.message;
    }
  },

  // Create a new employee
  createEmployee: async (employeeData) => {
    try {
      const response = await api.post('/employees/', employeeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Update employee
  updateEmployee: async (id, employeeData) => {
    try {
      const response = await api.put(`/employees/${id}/`, employeeData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete employee
  deleteEmployee: async (id) => {
    try {
      await api.delete(`/employees/${id}/`);
      return true;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete all employees from a campaign
  deleteEmployeesByCampaign: async (campaignId) => {
    try {
      const response = await api.delete('/employees/delete-by-campaign/', {
        params: { campaign_id: campaignId }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
