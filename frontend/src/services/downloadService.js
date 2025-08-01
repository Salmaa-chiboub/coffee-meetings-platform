import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';

// Light and soft color palette for clean PDF reports
const COLORS = {
  // Very light background colors
  lightGray: { r: 248, g: 249, b: 250 },     // #F8F9FA - Very light gray
  softWhite: { r: 253, g: 253, b: 253 },     // #FDFDFD - Soft white
  paleBlue: { r: 247, g: 250, b: 252 },      // #F7FAFC - Pale blue
  lightBeige: { r: 252, g: 251, b: 248 },    // #FCFBF8 - Light beige

  // Subtle accent colors
  softGray: { r: 229, g: 231, b: 235 },      // #E5E7EB - Soft gray
  lightBorder: { r: 209, g: 213, b: 219 },   // #D1D5DB - Light border
  mutedBlue: { r: 219, g: 234, b: 254 },     // #DBEAFE - Muted blue
  palePeach: { r: 254, g: 243, b: 199 },     // #FEF3C7 - Pale peach

  // Text colors - softer and lighter
  darkGray: { r: 75, g: 85, b: 99 },         // #4B5563 - Dark gray (softer than charcoal)
  mediumGray: { r: 107, g: 114, b: 128 },    // #6B7280 - Medium gray
  lightText: { r: 156, g: 163, b: 175 },     // #9CA3AF - Light text
  white: { r: 255, g: 255, b: 255 }          // #FFFFFF - Pure white
};

// Simple helper functions for clean design elements
const addSimpleBorder = (doc, x, y, width, height, color = COLORS.lightBorder) => {
  doc.setDrawColor(color.r, color.g, color.b);
  doc.setLineWidth(0.5);
  doc.rect(x, y, width, height);
};

const addSubtleBackground = (doc, x, y, width, height, color = COLORS.lightGray) => {
  doc.setFillColor(color.r, color.g, color.b);
  doc.rect(x, y, width, height, 'F');
};

// Clean typography with soft colors
const TYPOGRAPHY = {
  title: { size: 24, weight: 'bold', color: COLORS.darkGray },
  subtitle: { size: 12, weight: 'normal', color: COLORS.mediumGray },
  sectionHeader: { size: 16, weight: 'bold', color: COLORS.darkGray },
  cardTitle: { size: 14, weight: 'bold', color: COLORS.darkGray },
  cardValue: { size: 18, weight: 'bold', color: COLORS.darkGray },
  cardLabel: { size: 9, weight: 'normal', color: COLORS.lightText },
  body: { size: 10, weight: 'normal', color: COLORS.mediumGray },
  caption: { size: 8, weight: 'normal', color: COLORS.lightText },
  footer: { size: 7, weight: 'normal', color: COLORS.lightText }
};

// Clean and minimal spacing
const SPACING = {
  pageMargin: 20,
  sectionGap: 20,
  cardGap: 6,
  lineHeight: 1.3,
  headerHeight: 50,
  footerHeight: 15
};

// Helper functions for clean PDF styling
const addCleanHeader = (doc, title, subtitle = null, pageNumber = 1, totalPages = 1) => {
  // Simple light background
  addSubtleBackground(doc, 0, 0, 210, SPACING.headerHeight, COLORS.lightGray);

  // Clean border at bottom
  doc.setDrawColor(COLORS.lightBorder.r, COLORS.lightBorder.g, COLORS.lightBorder.b);
  doc.setLineWidth(0.5);
  doc.line(0, SPACING.headerHeight, 210, SPACING.headerHeight);

  // Company name - simple and clean
  doc.setFontSize(TYPOGRAPHY.title.size);
  doc.setTextColor(TYPOGRAPHY.title.color.r, TYPOGRAPHY.title.color.g, TYPOGRAPHY.title.color.b);
  doc.text('CoffeeMeet', SPACING.pageMargin, 25);

  // Document title
  doc.setFontSize(TYPOGRAPHY.sectionHeader.size);
  doc.setTextColor(TYPOGRAPHY.sectionHeader.color.r, TYPOGRAPHY.sectionHeader.color.g, TYPOGRAPHY.sectionHeader.color.b);
  doc.text(title, SPACING.pageMargin, 38);

  // Page indicator - right aligned
  doc.setFontSize(TYPOGRAPHY.caption.size);
  doc.setTextColor(TYPOGRAPHY.caption.color.r, TYPOGRAPHY.caption.color.g, TYPOGRAPHY.caption.color.b);
  const pageText = `Page ${pageNumber} of ${totalPages}`;
  const pageTextWidth = doc.getTextWidth(pageText);
  doc.text(pageText, 210 - SPACING.pageMargin - pageTextWidth, 25);

  // Subtitle - simple text
  if (subtitle) {
    doc.setFontSize(TYPOGRAPHY.subtitle.size);
    doc.setTextColor(TYPOGRAPHY.subtitle.color.r, TYPOGRAPHY.subtitle.color.g, TYPOGRAPHY.subtitle.color.b);
    doc.text(subtitle, SPACING.pageMargin, 45);
  }

  return SPACING.headerHeight + 10; // Return Y position after header
};

// Add simple table of contents
const addTableOfContents = (doc, startY, sections) => {
  // Simple TOC Header
  doc.setFontSize(TYPOGRAPHY.sectionHeader.size);
  doc.setTextColor(TYPOGRAPHY.sectionHeader.color.r, TYPOGRAPHY.sectionHeader.color.g, TYPOGRAPHY.sectionHeader.color.b);
  doc.text('Contents', SPACING.pageMargin, startY);

  // Light underline
  doc.setDrawColor(COLORS.lightBorder.r, COLORS.lightBorder.g, COLORS.lightBorder.b);
  doc.setLineWidth(0.5);
  doc.line(SPACING.pageMargin, startY + 2, SPACING.pageMargin + 40, startY + 2);

  let currentY = startY + 15;

  // Simple TOC entries
  sections.forEach((section, index) => {
    doc.setFontSize(TYPOGRAPHY.body.size);
    doc.setTextColor(TYPOGRAPHY.body.color.r, TYPOGRAPHY.body.color.g, TYPOGRAPHY.body.color.b);

    // Section number and title
    doc.text(`${index + 1}. ${section.title}`, SPACING.pageMargin + 5, currentY);

    // Simple dotted line
    const titleWidth = doc.getTextWidth(`${index + 1}. ${section.title}`);
    const dotsStart = SPACING.pageMargin + titleWidth + 10;
    const dotsEnd = 160;
    const dotSpacing = 3;

    doc.setFontSize(8);
    for (let x = dotsStart; x < dotsEnd - 15; x += dotSpacing) {
      doc.text('.', x, currentY);
    }

    // Page number
    doc.text(section.page.toString(), dotsEnd, currentY);

    currentY += 12;
  });

  return currentY + 15;
};

const addSimpleSection = (doc, title, startY, sectionNumber = 1) => {
  // Simple section header with light background
  addSubtleBackground(doc, SPACING.pageMargin, startY - 5, 170, 20, COLORS.paleBlue);

  // Light border
  addSimpleBorder(doc, SPACING.pageMargin, startY - 5, 170, 20, COLORS.lightBorder);

  // Simple section number
  doc.setFontSize(TYPOGRAPHY.body.size);
  doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
  doc.text(`${sectionNumber}.`, SPACING.pageMargin + 5, startY + 8);

  // Section title - clean and simple
  doc.setFontSize(TYPOGRAPHY.sectionHeader.size);
  doc.setTextColor(TYPOGRAPHY.sectionHeader.color.r, TYPOGRAPHY.sectionHeader.color.g, TYPOGRAPHY.sectionHeader.color.b);
  doc.text(title, SPACING.pageMargin + 15, startY + 8);

  return startY + 25;
};

const addSimpleStatCard = (doc, label, value, x, y, width = 40, height = 25) => {
  // Simple card background
  addSubtleBackground(doc, x, y, width, height, COLORS.softWhite);

  // Light border
  addSimpleBorder(doc, x, y, width, height, COLORS.lightBorder);
  // Simple value display
  doc.setFontSize(TYPOGRAPHY.cardValue.size);
  doc.setTextColor(TYPOGRAPHY.cardValue.color.r, TYPOGRAPHY.cardValue.color.g, TYPOGRAPHY.cardValue.color.b);
  const valueStr = String(value);
  const valueWidth = doc.getTextWidth(valueStr);
  doc.text(valueStr, x + (width - valueWidth) / 2, y + height * 0.5);

  // Simple label
  doc.setFontSize(TYPOGRAPHY.cardLabel.size);
  doc.setTextColor(TYPOGRAPHY.cardLabel.color.r, TYPOGRAPHY.cardLabel.color.g, TYPOGRAPHY.cardLabel.color.b);

  const labelWidth = doc.getTextWidth(label);
  doc.text(label, x + (width - labelWidth) / 2, y + height * 0.8);
};

const addSimpleProgressBar = (doc, label, percentage, x, y, width = 60) => {
  const barHeight = 8;
  const fillWidth = (width * percentage) / 100;

  // Light background
  addSubtleBackground(doc, x, y, width, barHeight, COLORS.lightGray);

  // Progress fill - simple and clean
  doc.setFillColor(COLORS.mutedBlue.r, COLORS.mutedBlue.g, COLORS.mutedBlue.b);
  doc.rect(x, y, fillWidth, barHeight, 'F');

  // Simple border
  addSimpleBorder(doc, x, y, width, barHeight, COLORS.lightBorder);
  // Simple label
  doc.setFontSize(TYPOGRAPHY.body.size);
  doc.setTextColor(TYPOGRAPHY.body.color.r, TYPOGRAPHY.body.color.g, TYPOGRAPHY.body.color.b);
  doc.text(label, x, y - 4);

  // Simple percentage
  doc.setFontSize(TYPOGRAPHY.caption.size);
  doc.setTextColor(TYPOGRAPHY.caption.color.r, TYPOGRAPHY.caption.color.g, TYPOGRAPHY.caption.color.b);
  const percentText = `${Math.round(percentage)}%`;
  doc.text(percentText, x + width - doc.getTextWidth(percentText), y - 4);
};

// Simple clean footer
const addSimpleFooter = (doc, pageNumber, totalPages, generatedDate) => {
  const footerY = 285;

  // Light separator line
  doc.setDrawColor(COLORS.lightBorder.r, COLORS.lightBorder.g, COLORS.lightBorder.b);
  doc.setLineWidth(0.5);
  doc.line(SPACING.pageMargin, footerY, 210 - SPACING.pageMargin, footerY);

  // Simple footer text
  doc.setFontSize(TYPOGRAPHY.footer.size);
  doc.setTextColor(TYPOGRAPHY.footer.color.r, TYPOGRAPHY.footer.color.g, TYPOGRAPHY.footer.color.b);
  doc.text('CoffeeMeet Platform', SPACING.pageMargin, footerY + 8);

  // Page numbers
  const pageText = `Page ${pageNumber} of ${totalPages}`;
  const pageTextWidth = doc.getTextWidth(pageText);
  doc.text(pageText, 210 - SPACING.pageMargin - pageTextWidth, footerY + 8);
};

export const downloadService = {
  // Download campaign history as PDF with professional enhancements
  downloadPDF: async (campaigns, overallStats) => {
    try {
      // Handle empty data case
      if (!campaigns || campaigns.length === 0) {
        campaigns = [{
          id: 'sample',
          title: 'No campaigns available',
          created_at: new Date().toISOString(),
          employees_count: 0,
          pairs_count: 0,
          avg_rating: 'N/A',
          success_rate: 0
        }];
      }

      const doc = new jsPDF();
      const generatedDate = format(new Date(), 'MMMM dd, yyyy \'at\' HH:mm');

      // Set document metadata
      doc.setProperties({
        title: 'CoffeeMeet Campaign Report',
        subject: 'Campaign Performance Analysis',
        author: 'CoffeeMeet Platform',
        keywords: 'campaigns, coffee meetings, team building, analytics',
        creator: 'CoffeeMeet Platform'
      });

      // Calculate total pages (estimate)
      const totalPages = Math.ceil(campaigns.length / 6) + 1;

      // Add clean header with page numbers
      let currentY = addCleanHeader(
        doc,
        'Campaign Performance Report',
        `Generated on ${generatedDate}`,
        1,
        totalPages
      );

    // Add table of contents
    const sections = [
      { title: 'Executive Summary', page: 1 },
      { title: 'Performance Metrics', page: 1 },
      { title: 'Campaign Details', page: 1 },
      { title: 'Recommendations', page: totalPages }
    ];

    currentY = addTableOfContents(doc, currentY, sections);
    currentY += SPACING.sectionGap;

    // Add executive summary section
    if (overallStats) {
      currentY = addSimpleSection(doc, 'Executive Summary', currentY, 1);

      // Simple statistics cards in clean layout
      const cardWidth = 40;
      const cardHeight = 25;
      const cardSpacing = 10;
      const startX = SPACING.pageMargin;

      // Key Performance Indicators - clean and simple
      addSimpleStatCard(doc, 'Total Campaigns', overallStats.totalCampaigns || 0, startX, currentY, cardWidth, cardHeight);
      addSimpleStatCard(doc, 'Total Participants', overallStats.totalParticipants || 0, startX + cardWidth + cardSpacing, currentY, cardWidth, cardHeight);
      addSimpleStatCard(doc, 'Coffee Meetings', overallStats.totalMeetings || 0, startX + (cardWidth + cardSpacing) * 2, currentY, cardWidth, cardHeight);

      currentY += cardHeight + SPACING.sectionGap;

      // Performance Metrics Section
      currentY = addSimpleSection(doc, 'Performance Metrics', currentY, 2);

      // Average Rating with simple progress bar
      const avgRating = parseFloat(overallStats.averageRating) || 0;
      const ratingPercentage = (avgRating / 5) * 100;
      addSimpleProgressBar(doc, `Average Rating: ${avgRating.toFixed(1)}/5.0`, ratingPercentage, startX, currentY, 100);
      currentY += 25;

      // Success Rate with simple progress bar
      const successRate = overallStats.successRate || 0;
      addSimpleProgressBar(doc, 'Overall Success Rate', successRate, startX, currentY, 100);
      currentY += 35;

      // Simple key insights
      doc.setFontSize(TYPOGRAPHY.body.size);
      doc.setTextColor(TYPOGRAPHY.body.color.r, TYPOGRAPHY.body.color.g, TYPOGRAPHY.body.color.b);
      doc.text('Key Insights:', startX, currentY);
      currentY += 10;

      doc.setFontSize(TYPOGRAPHY.caption.size);
      doc.setTextColor(TYPOGRAPHY.caption.color.r, TYPOGRAPHY.caption.color.g, TYPOGRAPHY.caption.color.b);

      const insights = [
        `• ${overallStats.totalCampaigns || 0} campaigns completed with ${Math.round(successRate)}% success rate`,
        `• Average participant satisfaction: ${avgRating.toFixed(1)}/5.0 stars`,
        `• ${overallStats.totalMeetings || 0} meaningful connections facilitated`
      ];

      insights.forEach((insight, i) => {
        doc.text(insight, startX + 5, currentY + (i * 6));
      });

      currentY += 25;
    }
    
    // Add campaign details with clean design
    if (campaigns && campaigns.length > 0) {
      currentY = addSimpleSection(doc, 'Campaign Details', currentY, 3);

      campaigns.slice(0, 8).forEach((campaign, index) => { // Show more campaigns with simpler design
        if (currentY > 240) { // Add new page if needed
          doc.addPage();
          const pageNum = doc.internal.getNumberOfPages();
          currentY = addCleanHeader(doc, 'Campaign Performance Report', 'Continued...', pageNum, totalPages);
          addSimpleFooter(doc, pageNum, totalPages, generatedDate);
        }

        // Simple campaign card
        addSubtleBackground(doc, SPACING.pageMargin, currentY - 2, 170, 30, COLORS.lightBeige);
        addSimpleBorder(doc, SPACING.pageMargin, currentY - 2, 170, 30, COLORS.lightBorder);

        // Simple campaign number
        doc.setFontSize(TYPOGRAPHY.body.size);
        doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
        doc.text(`${index + 1}.`, SPACING.pageMargin + 5, currentY + 8);

        // Campaign title - clean and simple
        doc.setFontSize(TYPOGRAPHY.cardTitle.size);
        doc.setTextColor(TYPOGRAPHY.cardTitle.color.r, TYPOGRAPHY.cardTitle.color.g, TYPOGRAPHY.cardTitle.color.b);
        const title = campaign.title || 'Untitled Campaign';
        doc.text(title.length > 45 ? title.substring(0, 45) + '...' : title, SPACING.pageMargin + 15, currentY + 8);

        // Campaign date - simple
        doc.setFontSize(TYPOGRAPHY.caption.size);
        doc.setTextColor(TYPOGRAPHY.caption.color.r, TYPOGRAPHY.caption.color.g, TYPOGRAPHY.caption.color.b);
        doc.text(format(new Date(campaign.created_at), 'MMM dd, yyyy'), SPACING.pageMargin + 15, currentY + 18);

        // Simple metrics section
        const metricsY = currentY + 22;
        doc.setFontSize(TYPOGRAPHY.caption.size);
        doc.setTextColor(TYPOGRAPHY.body.color.r, TYPOGRAPHY.body.color.g, TYPOGRAPHY.body.color.b);

        // Simple metrics - no icons
        doc.text(`${campaign.employees_count || 0} participants`, SPACING.pageMargin + 15, metricsY);
        doc.text(`${campaign.pairs_count || 0} pairs`, SPACING.pageMargin + 70, metricsY);

        const rating = campaign.avg_rating || 'N/A';
        doc.text(`${rating}/5 rating`, SPACING.pageMargin + 110, metricsY);

        const successRate = campaign.success_rate || 0;
        doc.text(`${Math.round(successRate)}% success`, SPACING.pageMargin + 150, metricsY);
        currentY += 35;
      });

      if (campaigns.length > 8) {
        // Simple summary for remaining campaigns
        doc.setFontSize(TYPOGRAPHY.body.size);
        doc.setTextColor(COLORS.mediumGray.r, COLORS.mediumGray.g, COLORS.mediumGray.b);
        doc.text(`+ ${campaigns.length - 8} additional campaigns available`, SPACING.pageMargin, currentY);

        doc.setFontSize(TYPOGRAPHY.caption.size);
        doc.setTextColor(TYPOGRAPHY.caption.color.r, TYPOGRAPHY.caption.color.g, TYPOGRAPHY.caption.color.b);
        doc.text('Download Excel or CSV files for complete campaign data', SPACING.pageMargin, currentY + 8);

        currentY += 25;
      }
    }

    // Add recommendations section if space allows
    if (currentY < 220) {
      currentY = addSimpleSection(doc, 'Recommendations', currentY, 4);

      const recommendations = [
        '• Continue fostering team connections through regular coffee meetings',
        '• Focus on departments with lower participation rates for future campaigns',
        '• Consider feedback collection to improve campaign satisfaction scores',
        '• Expand successful campaign formats to other teams and departments'
      ];

      doc.setFontSize(TYPOGRAPHY.body.size);
      doc.setTextColor(TYPOGRAPHY.body.color.r, TYPOGRAPHY.body.color.g, TYPOGRAPHY.body.color.b);

      recommendations.forEach((rec, i) => {
        doc.text(rec, SPACING.pageMargin + 5, currentY + (i * 8));
      });
    }

    // Add simple footer to all pages
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addSimpleFooter(doc, i, pageCount, generatedDate);
    }

      // Save the PDF with professional filename
      const filename = `CoffeeMeet_Campaign_Report_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
      doc.save(filename);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  },

  // Download campaign history as Excel
  downloadExcel: (campaigns, overallStats) => {
    // Handle empty data case
    if (!campaigns || campaigns.length === 0) {
      campaigns = [{
        id: 'sample',
        title: 'No campaigns available',
        created_at: new Date().toISOString(),
        employees_count: 0,
        pairs_count: 0,
        avg_rating: 'N/A',
        success_rate: 0
      }];
    }

    const workbook = XLSX.utils.book_new();
    
    // Overall Statistics Sheet
    if (overallStats) {
      const statsData = [
        ['Metric', 'Value'],
        ['Total Campaigns', overallStats.totalCampaigns || 0],
        ['Total Participants', overallStats.totalParticipants || 0],
        ['Total Coffee Meetings', overallStats.totalMeetings || 0],
        ['Average Rating', overallStats.averageRating || 'N/A'],
        ['Success Rate', `${overallStats.successRate || 0}%`],
        [''],
        ['Report Generated', format(new Date(), 'PPP')]
      ];
      
      const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
      XLSX.utils.book_append_sheet(workbook, statsSheet, 'Statistics');
    }
    
    // Campaigns Sheet
    if (campaigns && campaigns.length > 0) {
      const campaignData = [
        ['Campaign Title', 'Created Date', 'Participants', 'Pairs', 'Average Rating', 'Success Rate', 'Feedback Count', 'Status']
      ];
      
      campaigns.forEach(campaign => {
        campaignData.push([
          campaign.title || 'Untitled',
          format(new Date(campaign.created_at), 'yyyy-MM-dd'),
          campaign.employees_count || 0,
          campaign.pairs_count || 0,
          campaign.avg_rating || 'N/A',
          `${campaign.success_rate || 0}%`,
          campaign.feedback_count || 0,
          campaign.status || 'completed'
        ]);
      });
      
      const campaignSheet = XLSX.utils.aoa_to_sheet(campaignData);
      XLSX.utils.book_append_sheet(workbook, campaignSheet, 'Campaigns');
    }
    
    // Save the Excel file
    XLSX.writeFile(workbook, `CoffeeMeet_Campaign_History_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  },

  // Download campaign history as CSV
  downloadCSV: (campaigns) => {
    if (!campaigns || campaigns.length === 0) {
      alert('No campaign data available to download');
      return;
    }
    
    const headers = ['Campaign Title', 'Created Date', 'Participants', 'Pairs', 'Average Rating', 'Success Rate', 'Feedback Count', 'Status'];
    
    const csvData = campaigns.map(campaign => [
      campaign.title || 'Untitled',
      format(new Date(campaign.created_at), 'yyyy-MM-dd'),
      campaign.employees_count || 0,
      campaign.pairs_count || 0,
      campaign.avg_rating || 'N/A',
      `${campaign.success_rate || 0}%`,
      campaign.feedback_count || 0,
      campaign.status || 'completed'
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `CoffeeMeet_Campaign_History_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
