import { jsPDF } from 'jspdf';
import { default as autoTable } from 'jspdf-autotable';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return format(new Date(dateString), 'dd MMM yyyy', { locale: fr });
};

const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} jours`;
};

export const exportCampaignHistory = (campaignData) => {
    // Créer une nouvelle instance de jsPDF
    const doc = new jsPDF();

    // Ajouter le titre et la date du rapport
    doc.setFontSize(20);
    doc.setTextColor(139, 111, 71); // #8B6F47
    doc.text('Historique des Campagnes', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Généré le : ${format(new Date(), 'dd MMMM yyyy à HH:mm', { locale: fr })}`, 14, 30);

    // Statistiques globales
    const totalCampaigns = campaignData.length;
    const totalParticipants = campaignData.reduce((sum, c) => sum + (c.participants_count || 0), 0);
    const totalPairs = campaignData.reduce((sum, c) => sum + (c.total_pairs || 0), 0);

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Statistiques Globales:', 14, 45);
    doc.setFontSize(10);
    doc.text(`• Nombre total de campagnes : ${totalCampaigns}`, 20, 55);
    doc.text(`• Nombre total de participants : ${totalParticipants}`, 20, 62);
    doc.text(`• Nombre total de paires créées : ${totalPairs}`, 20, 69);

    // Préparer les données pour le tableau principal
    const tableData = campaignData.map(campaign => [
        campaign.title || 'Sans titre',
        formatDate(campaign.start_date),
        formatDate(campaign.end_date),
        calculateDuration(campaign.start_date, campaign.end_date),
        campaign.participants_count || 0,
        campaign.total_pairs || 0,
        campaign.total_criteria || 0,
        formatDate(campaign.completion_date)
    ]);

    // Définir les colonnes
    const columns = [
        'Titre de la campagne',
        'Date de début',
        'Date de fin',
        'Durée',
        'Participants',
        'Paires',
        'Critères',
        'Date complétion'
    ];

    // Ajouter le tableau avec autoTable
    autoTable(doc, {
        head: [columns],
        body: tableData,
        startY: 80,
        styles: {
            fontSize: 8,
            cellPadding: 5,
            overflow: 'linebreak',
            halign: 'center'
        },
        headStyles: {
            fillColor: [232, 196, 160], // #E8C4A0
            textColor: [139, 111, 71], // #8B6F47
            fontStyle: 'bold',
            halign: 'center'
        },
        columnStyles: {
            0: { cellWidth: 40, halign: 'left' }, // Titre
            1: { cellWidth: 25 }, // Date début
            2: { cellWidth: 25 }, // Date fin
            3: { cellWidth: 20 }, // Durée
            4: { cellWidth: 20 }, // Participants
            5: { cellWidth: 20 }, // Paires
            6: { cellWidth: 20 }, // Critères
            7: { cellWidth: 25 }  // Date complétion
        },
        alternateRowStyles: {
            fillColor: [248, 247, 245] // Couleur légère pour les lignes alternées
        },
        theme: 'grid'
    });

    // Ajouter le pied de page
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        // Ligne de séparation
        const pageHeight = doc.internal.pageSize.height;
        doc.setDrawColor(200, 200, 200);
        doc.line(14, pageHeight - 20, doc.internal.pageSize.width - 14, pageHeight - 20);
        
        // Texte du pied de page
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(
            'Coffee Meetings Platform - Rapport d\'historique des campagnes',
            14,
            pageHeight - 12
        );
        doc.text(
            `Page ${i} sur ${pageCount}`,
            doc.internal.pageSize.width - 14,
            pageHeight - 12,
            { align: 'right' }
        );
    }

    // Sauvegarder le PDF avec la date dans le nom du fichier
    const fileName = `Historique_Campagnes_${format(new Date(), 'yyyy-MM-dd_HHmm')}.pdf`;
    doc.save(fileName);
};

export const exportCampaignDetails = (campaign) => {
    const doc = new jsPDF();

    // En-tête
    doc.setFontSize(16);
    doc.text(`Détails de la Campagne: ${campaign.title}`, 14, 15);

    // Informations générales
    doc.setFontSize(12);
    doc.text(`Date de début: ${campaign.start_date}`, 14, 30);
    doc.text(`Date de fin: ${campaign.end_date}`, 14, 40);
    doc.text(`Statut: ${campaign.status}`, 14, 50);
    doc.text(`Nombre d'employés: ${campaign.employee_count}`, 14, 60);
    doc.text(`Nombre de paires: ${campaign.pairs_count}`, 14, 70);

    // Tableau des paires
    if (campaign.pairs && campaign.pairs.length > 0) {
        const pairsData = campaign.pairs.map(pair => [
            pair.employee1_name,
            pair.employee2_name,
            pair.status,
            pair.meeting_date || 'Non planifié'
        ]);

        doc.autoTable({
            head: [['Employé 1', 'Employé 2', 'Statut', 'Date de rencontre']],
            body: pairsData,
            startY: 80,
            styles: {
                fontSize: 10,
                cellPadding: 3
            },
            theme: 'grid'
        });
    }

    // Sauvegarder le PDF
    doc.save(`campagne-${campaign.id}.pdf`);
};
