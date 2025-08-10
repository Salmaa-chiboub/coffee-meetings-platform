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

      // Calculate timeout based on file size (minimum 30 seconds, add 10 seconds per MB)
      const fileSizeMB = file.size / (1024 * 1024);
      const timeoutMs = Math.max(30000, 30000 + (fileSizeMB * 10000)); // 30s base + 10s per MB

      console.log(`📤 Upload timeout set to ${timeoutMs / 1000}s for ${fileSizeMB.toFixed(2)}MB file`);

      const response = await api.post('/employees/upload_excel/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: timeoutMs,
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
