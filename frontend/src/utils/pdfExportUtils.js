import { jsPDF } from 'jspdf';
import { default as autoTable } from 'jspdf-autotable';

export const generatePDF = (data) => {
  try {
    // Create new document
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(16);
    doc.text('Campaign History Report', 20, 20);

    // Create table data
    const tableColumns = ['Campaign', 'Participants', 'Pairs', 'Duration'];
    const tableData = data.map(campaign => {
      console.log('Processing campaign for PDF:', campaign); // Debug log
      return [
        campaign.title || campaign.name || 'Untitled',
        typeof campaign.participants === 'number' ? campaign.participants : 
        typeof campaign.participants_count === 'number' ? campaign.participants_count : 
        Array.isArray(campaign.participants) ? campaign.participants.length : 0,
        typeof campaign.pairs === 'number' ? campaign.pairs :
        typeof campaign.total_pairs === 'number' ? campaign.total_pairs :
        Array.isArray(campaign.pairs) ? campaign.pairs.length : 0,
        campaign.duration ? `${campaign.duration} days` : 
        campaign.end_date && campaign.start_date ? 
          `${Math.ceil((new Date(campaign.end_date) - new Date(campaign.start_date)) / (1000 * 60 * 60 * 24))} days` : 
          'N/A'
      ];
    });

    // Add the table
    autoTable(doc, {
      head: [tableColumns],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [232, 196, 160],
        textColor: [139, 111, 71]
      }
    });

    // Save the PDF
    doc.save('campaign-history.pdf');
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};
