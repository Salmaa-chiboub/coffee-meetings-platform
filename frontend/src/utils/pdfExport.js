import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (data, filename = 'campaign-history.pdf') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Campaign History Report', 20, 20);
  
  // Add subtitle with date
  doc.setFontSize(12);
  doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // Prepare table data
  if (data && data.length > 0) {
    const tableColumns = ['Campaign Name', 'Status', 'Start Date', 'End Date', 'Participants'];
    const tableRows = data.map(campaign => [
      campaign.name || 'N/A',
      campaign.status || 'N/A',
      campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'N/A',
      campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'N/A',
      campaign.participant_count || '0'
    ]);
    
    // Add table
    doc.autoTable({
      startY: 40,
      head: [tableColumns],
      body: tableRows,
      theme: 'grid',
      styles: {
        fontSize: 10,
        cellPadding: 3
      },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255
      }
    });
  }
  
  // Save the PDF
  doc.save(filename);
};

export const exportCampaignDetailsToPDF = (campaign, filename) => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text(`Campaign: ${campaign.name || 'Unnamed Campaign'}`, 20, 20);
  
  // Add campaign details
  doc.setFontSize(12);
  let yPosition = 40;
  
  const details = [
    ['Status:', campaign.status || 'N/A'],
    ['Description:', campaign.description || 'No description'],
    ['Start Date:', campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'N/A'],
    ['End Date:', campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'N/A'],
    ['Participants:', campaign.participant_count || '0'],
    ['HR Manager:', campaign.hr_manager_name || 'N/A']
  ];
  
  details.forEach(([label, value]) => {
    doc.text(label, 20, yPosition);
    doc.text(value, 80, yPosition);
    yPosition += 10;
  });
  
  // Save the PDF
  doc.save(filename || `campaign-${campaign.id || 'details'}.pdf`);
};
