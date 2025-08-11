import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportToPDF = (data, filename = 'campaign-history.pdf') => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text('Rapport d\'Historique de Campagne', 20, 20);
  
  // Add subtitle with date
  doc.setFontSize(12);
  doc.text(`Généré le: ${new Date().toLocaleDateString()}`, 20, 30);
  
  // Prepare table data
  if (data && data.length > 0) {
    const tableColumns = ['Nom de Campagne', 'Statut', 'Date de Début', 'Date de Fin', 'Participants'];
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
  doc.text(`Campagne: ${campaign.name || 'Campagne Sans Nom'}`, 20, 20);
  
  // Add campaign details
  doc.setFontSize(12);
  let yPosition = 40;
  
  const details = [
    ['Statut:', campaign.status || 'N/A'],
    ['Description:', campaign.description || 'Aucune description'],
    ['Date de Début:', campaign.start_date ? new Date(campaign.start_date).toLocaleDateString() : 'N/A'],
    ['Date de Fin:', campaign.end_date ? new Date(campaign.end_date).toLocaleDateString() : 'N/A'],
    ['Participants:', campaign.participant_count || '0'],
    ['Responsable RH:', campaign.hr_manager_name || 'N/A']
  ];
  
  details.forEach(([label, value]) => {
    doc.text(label, 20, yPosition);
    doc.text(value, 80, yPosition);
    yPosition += 10;
  });
  
  // Save the PDF
  doc.save(filename || `campaign-${campaign.id || 'details'}.pdf`);
};
