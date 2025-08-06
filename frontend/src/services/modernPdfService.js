import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Configuration moderne pour les PDFs
const PDF_CONFIG = {
  colors: {
    primary: '#667eea',
    secondary: '#ff6b6b', 
    accent: '#764ba2',
    dark: '#374151',
    light: '#f8fafc',
    border: '#e2e8f0',
    success: '#10b981',
    warning: '#f59e0b'
  },
  fonts: {
    title: { size: 24, weight: 'bold' },
    subtitle: { size: 16, weight: 'normal' },
    heading: { size: 14, weight: 'bold' },
    body: { size: 11, weight: 'normal' },
    caption: { size: 9, weight: 'normal' }
  },
  spacing: {
    margin: 20,
    section: 15,
    line: 8
  }
};

class ModernPDFService {
  constructor() {
    this.doc = null;
    this.pageWidth = 0;
    this.pageHeight = 0;
    this.currentY = 0;
  }

  // Initialiser un nouveau document
  initializeDocument(orientation = 'portrait') {
    this.doc = new jsPDF(orientation, 'mm', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.currentY = PDF_CONFIG.spacing.margin;
  }

  // Ajouter l'en-tête moderne avec design
  addModernHeader(title, subtitle = '') {
    const { margin } = PDF_CONFIG.spacing;

    // Arrière-plan dégradé simulé avec rectangles
    this.doc.setFillColor(102, 126, 234); // primary color
    this.doc.rect(0, 0, this.pageWidth, 35, 'F');
    
    // Accent décoratif
    this.doc.setFillColor(255, 107, 107); // secondary color  
    this.doc.rect(0, 30, this.pageWidth, 5, 'F');

    // Titre principal
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFontSize(PDF_CONFIG.fonts.title.size);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, margin, 20);

    // Sous-titre si fourni
    if (subtitle) {
      this.doc.setFontSize(PDF_CONFIG.fonts.subtitle.size);
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(subtitle, margin, 28);
    }

    // Date de génération
    const dateText = `Généré le ${new Date().toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric', 
      month: 'long',
      day: 'numeric'
    })}`;
    this.doc.setFontSize(PDF_CONFIG.fonts.caption.size);
    this.doc.text(dateText, this.pageWidth - margin, 32, { align: 'right' });

    this.currentY = 50;
  }

  // Ajouter une section de métriques avec style moderne
  addMetricsSection(metrics) {
    this.doc.setTextColor(PDF_CONFIG.colors.dark);
    this.doc.setFontSize(PDF_CONFIG.fonts.heading.size);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('📊 Métriques Globales', PDF_CONFIG.spacing.margin, this.currentY);
    
    this.currentY += 15;

    // Carte de métriques avec bordures modernes
    const cardWidth = (this.pageWidth - 60) / 2;
    const cardHeight = 25;
    let xPos = PDF_CONFIG.spacing.margin;

    metrics.forEach((metric, index) => {
      if (index % 2 === 0 && index > 0) {
        this.currentY += cardHeight + 10;
        xPos = PDF_CONFIG.spacing.margin;
      }

      // Arrière-plan de la carte
      this.doc.setFillColor(248, 250, 252); // light gray
      this.doc.roundedRect(xPos, this.currentY, cardWidth, cardHeight, 3, 3, 'F');
      
      // Bordure colorée à gauche
      const colors = [
        [255, 107, 107], // rouge corail
        [102, 126, 234], // bleu violet
        [16, 185, 129],  // vert émeraude
        [245, 158, 11]   // orange ambre
      ];
      this.doc.setFillColor(...colors[index % 4]);
      this.doc.rect(xPos, this.currentY, 3, cardHeight, 'F');

      // Icône et titre
      this.doc.setTextColor(PDF_CONFIG.colors.dark);
      this.doc.setFontSize(PDF_CONFIG.fonts.body.size);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(metric.title, xPos + 8, this.currentY + 8);

      // Valeur principale
      this.doc.setFontSize(18);
      this.doc.setFont('helvetica', 'bold');
      this.doc.setTextColor(...colors[index % 4]);
      this.doc.text(String(metric.value), xPos + 8, this.currentY + 16);

      // Description
      this.doc.setFontSize(PDF_CONFIG.fonts.caption.size);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(107, 114, 128); // gray-500
      this.doc.text(metric.description, xPos + 8, this.currentY + 21);

      xPos += cardWidth + 10;
    });

    this.currentY += cardHeight + 20;
  }

  // Ajouter un tableau moderne avec style
  addModernTable(title, columns, data) {
    this.doc.setTextColor(PDF_CONFIG.colors.dark);
    this.doc.setFontSize(PDF_CONFIG.fonts.heading.size);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, PDF_CONFIG.spacing.margin, this.currentY);
    
    this.currentY += 10;

    this.doc.autoTable({
      startY: this.currentY,
      head: [columns],
      body: data,
      theme: 'plain',
      styles: {
        fontSize: PDF_CONFIG.fonts.body.size,
        cellPadding: { top: 8, right: 6, bottom: 8, left: 6 },
        textColor: PDF_CONFIG.colors.dark,
        lineColor: PDF_CONFIG.colors.border,
        lineWidth: 0.5
      },
      headStyles: {
        fillColor: [102, 126, 234], // primary color
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: PDF_CONFIG.fonts.body.size + 1,
        cellPadding: { top: 10, right: 6, bottom: 10, left: 6 }
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // très léger gris
      },
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 25, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'center' }
      },
      margin: { left: PDF_CONFIG.spacing.margin, right: PDF_CONFIG.spacing.margin },
      didDrawPage: (data) => {
        this.currentY = data.cursor.y + 10;
      }
    });
  }

  // Ajouter le footer moderne
  addModernFooter() {
    const pageCount = this.doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Ligne décorative
      this.doc.setDrawColor(226, 232, 240); // border color
      this.doc.setLineWidth(0.5);
      this.doc.line(
        PDF_CONFIG.spacing.margin, 
        this.pageHeight - 20, 
        this.pageWidth - PDF_CONFIG.spacing.margin, 
        this.pageHeight - 20
      );

      // Informations du footer
      this.doc.setFontSize(PDF_CONFIG.fonts.caption.size);
      this.doc.setTextColor(107, 114, 128); // gray-500
      this.doc.setFont('helvetica', 'normal');
      
      // Nom de l'app à gauche
      this.doc.text('CoffeeMeet Platform', PDF_CONFIG.spacing.margin, this.pageHeight - 12);
      
      // Numéro de page à droite
      this.doc.text(
        `Page ${i} sur ${pageCount}`, 
        this.pageWidth - PDF_CONFIG.spacing.margin, 
        this.pageHeight - 12, 
        { align: 'right' }
      );
    }
  }

  // Exporter l'historique des campagnes avec style moderne
  exportHistoryReport(data, statistics) {
    this.initializeDocument();
    
    // En-tête
    this.addModernHeader(
      '📊 Rapport d\'Historique Global',
      'Analyse complète des campagnes et performances'
    );

    // Section métriques si disponible
    if (statistics) {
      const metrics = [
        {
          title: 'Total Campagnes',
          value: statistics.total_campaigns || 0,
          description: 'Campagnes réalisées'
        },
        {
          title: 'Taux de Réponse',
          value: `${statistics.response_rate || 0}%`,
          description: 'Participation moyenne'
        },
        {
          title: 'Participants',
          value: statistics.total_participants || 0,
          description: 'Employés impliqués'
        },
        {
          title: 'Satisfaction',
          value: `${statistics.overall_rating ? (statistics.overall_rating * 20).toFixed(1) : 0}%`,
          description: 'Note moyenne globale'
        }
      ];
      
      this.addMetricsSection(metrics);
    }

    // Tableau des campagnes si disponible
    if (data && data.campaigns && data.campaigns.length > 0) {
      const columns = [
        'Nom de la Campagne',
        'Statut', 
        'Date Début',
        'Date Fin',
        'Participants',
        'Évaluations',
        'Note Moy.'
      ];

      const tableData = data.campaigns.map(campaign => [
        campaign.title || campaign.name || 'Sans nom',
        campaign.status || 'N/A',
        campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('fr-FR') : 'N/A',
        campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('fr-FR') : 'N/A',
        campaign.participants || campaign.participant_count || '0',
        campaign.evaluations || '0',
        campaign.average_rating ? `${campaign.average_rating}/5` : 'N/A'
      ]);

      this.addModernTable('📋 Détail des Campagnes', columns, tableData);
    }

    // Footer
    this.addModernFooter();

    // Télécharger
    const filename = `rapport-historique-${new Date().toISOString().split('T')[0]}.pdf`;
    this.doc.save(filename);
  }
}

export const modernPdfService = new ModernPDFService();
