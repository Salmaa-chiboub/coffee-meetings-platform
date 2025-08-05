import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

class PDFGenerator {
  constructor() {
    this.doc = new jsPDF();
  }

  addTitle(text) {
    this.doc.setFontSize(16);
    this.doc.text(text, 20, 20);
  }

  addTable(columns, data) {
    autoTable(this.doc, {
      head: [columns],
      body: data,
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
  }

  save(filename) {
    this.doc.save(filename);
  }
}

export const generateCampaignPDF = (campaigns) => {
  try {
    // Initialize PDF generator
    const pdf = new PDFGenerator();
    
    // Add title
    pdf.addTitle('Campaign History Report');

    // Prepare table data
    const columns = ['Campaign', 'Participants', 'Pairs', 'Duration'];
    const tableData = campaigns.map(campaign => [
      campaign.title || 'Untitled',
      campaign.participants_count || 0,
      campaign.total_pairs || 0,
      `${campaign.duration || 0} days`
    ]);

    // Add table
    pdf.addTable(columns, tableData);

    // Save PDF
    pdf.save('campaign-history.pdf');
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    return false;
  }
};
