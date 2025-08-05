import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export const pdfExportService = {
  exportCampaignHistory: (campaigns) => {
    const doc = new jsPDF();
    
    // Configuration
    const pageWidth = doc.internal.pageSize.width;
    const margin = 20;
    
    // Header
    doc.setFontSize(20);
    doc.setTextColor(139, 111, 71); // #8B6F47
    doc.text('Campaign History Report', margin, 30);
    
    // Date de génération
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, margin, 40);
    
    // Statistiques globales
    const totalCampaigns = campaigns.length;
    const totalParticipants = campaigns.reduce((sum, c) => sum + (c.participants_count || 0), 0);
    const totalPairs = campaigns.reduce((sum, c) => sum + (c.total_pairs || 0), 0);
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Summary Statistics:', margin, 55);
    
    doc.setFontSize(10);
    doc.text(`• Total Completed Campaigns: ${totalCampaigns}`, margin + 5, 65);
    doc.text(`• Total Participants: ${totalParticipants}`, margin + 5, 72);
    doc.text(`• Total Pairs Created: ${totalPairs}`, margin + 5, 79);
    
    // Préparer les données pour le tableau
    const tableData = campaigns.map(campaign => {
      const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString();
      };
      
      const calculateDuration = (startDate, endDate) => {
        if (!startDate || !endDate) return 'N/A';
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} days`;
      };

      return [
        campaign.title.length > 25 ? campaign.title.substring(0, 25) + '...' : campaign.title,
        formatDate(campaign.start_date),
        formatDate(campaign.end_date),
        calculateDuration(campaign.start_date, campaign.end_date),
        campaign.participants_count || 0,
        campaign.total_pairs || 0,
        campaign.total_criteria || 0,
        formatDate(campaign.completion_date)
      ];
    });

    // Tableau des campagnes
    doc.autoTable({
      head: [['Campaign', 'Start Date', 'End Date', 'Duration', 'Participants', 'Pairs', 'Criteria', 'Completed']],
      body: tableData,
      startY: 90,
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 8,
        cellPadding: 3,
      },
      headStyles: {
        fillColor: [232, 196, 160], // #E8C4A0
        textColor: [139, 111, 71], // #8B6F47
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [248, 248, 248]
      },
      columnStyles: {
        0: { cellWidth: 35 }, // Campaign
        1: { cellWidth: 20 }, // Start Date
        2: { cellWidth: 20 }, // End Date
        3: { cellWidth: 18 }, // Duration
        4: { cellWidth: 20 }, // Participants
        5: { cellWidth: 15 }, // Pairs
        6: { cellWidth: 15 }, // Criteria
        7: { cellWidth: 20 }  // Completed
      }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount}`,
        pageWidth - margin,
        doc.internal.pageSize.height - 10,
        { align: 'right' }
      );
      doc.text(
        'Coffee Meetings Platform - Campaign History',
        margin,
        doc.internal.pageSize.height - 10
      );
    }

    // Télécharger le PDF
    const fileName = `campaign-history-${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
  }
};

export default pdfExportService;
