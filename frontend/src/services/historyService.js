import apiClient from './api';

export const historyService = {
  getCampaignHistory: async (page = 1, pageSize = 10) => {
    try {
      const response = await apiClient.get(`/dashboard/campaign-history/?page=${page}&page_size=${pageSize}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching campaign history:', error);
      throw error;
    }
  },

  getHistoryTrends: async (months = 6) => {
    try {
      const response = await apiClient.get(`/dashboard/campaign-history/trends/?months=${months}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching history trends:', error);
      throw error;
    }
  },

  exportHistoryPDF: async () => {
    try {
      const response = await apiClient.get('/dashboard/campaign-history/export-pdf/', {
        responseType: 'blob'
      });
      // Créer un URL pour le blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      // Créer un lien temporaire
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'campaign_history.pdf');
      // Ajouter le lien au document
      document.body.appendChild(link);
      // Cliquer sur le lien
      link.click();
      // Nettoyer
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting history to PDF:', error);
      throw error;
    }
  }
};
