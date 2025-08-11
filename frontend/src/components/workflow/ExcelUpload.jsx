import React, { useState, useRef } from 'react';
import {
  CloudArrowUpIcon,
  DocumentIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XMarkIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { employeeService } from '../../services/employeeService';
import { WORKFLOW_STEPS } from '../../services/workflowService';

// Lazy load XLSX library only when needed for better bundle size
const loadXLSX = () => import('xlsx');

const ExcelUpload = ({ campaignId, onComplete, onError }) => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [downloadingTemplate, setDownloadingTemplate] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (selectedFile) => {
    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    
    if (!allowedTypes.includes(selectedFile.type)) {
      onError('Veuillez sélectionner un fichier Excel valide (.xlsx ou .xls)');
      return;
    }

    // Validate file size (max 25MB)
    if (selectedFile.size > 25 * 1024 * 1024) {
      onError('La taille du fichier doit être inférieure à 25 Mo');
      return;
    }

    setFile(selectedFile);
    setUploadResult(null);
    onError(null);
  };

  // Handle drag and drop
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!file) {
      onError('Veuillez d\'abord sélectionner un fichier');
      return;
    }

    try {
      setUploading(true);
      onError(null);

      console.log(`📤 Starting upload of ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);

      const result = await employeeService.uploadExcel(campaignId, file);

      if (result.success) {
        setUploadResult(result);
        console.log(`✅ Upload successful: ${result.created_employees} employees created`);

        // Complete the step
        await onComplete(WORKFLOW_STEPS.UPLOAD_EMPLOYEES, {
          file_name: file.name,
          employees_count: result.employees_created || result.created_employees || 0,
          upload_timestamp: new Date().toISOString(),
          result: result
        });
      } else {
        setUploadResult(result);
        console.error('❌ Upload failed:', result.error);

        // Provide more specific error messages
        let errorMessage = result.error || 'Échec du téléchargement';

        if (result.error && result.error.includes('too large')) {
          errorMessage = 'Le fichier est trop volumineux. Veuillez réduire la taille du fichier ou le diviser en plusieurs fichiers plus petits.';
        } else if (result.error && result.error.includes('memory')) {
          errorMessage = 'Erreur de mémoire lors du traitement. Veuillez essayer avec un fichier plus petit.';
        } else if (result.error && result.error.includes('could not be read')) {
          errorMessage = 'Le fichier Excel ne peut pas être lu. Vérifiez que le fichier n\'est pas corrompu.';
        }

        onError(errorMessage);
      }
    } catch (error) {
      console.error('❌ Upload error:', error);

      // Handle specific error types
      let errorMessage = 'Échec du téléchargement';

      if (error.message && error.message.includes('413')) {
        errorMessage = 'Le fichier est trop volumineux pour être traité par le serveur.';
      } else if (error.message && error.message.includes('timeout')) {
        errorMessage = 'Le téléchargement a pris trop de temps. Veuillez essayer avec un fichier plus petit.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      onError(errorMessage);
    } finally {
      setUploading(false);
    }
  };

  // Clear file selection
  const clearFile = () => {
    setFile(null);
    setUploadResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Download Excel template with lazy loaded XLSX
  const downloadTemplate = async () => {
    try {
      setDownloadingTemplate(true);

      // Lazy load XLSX library
      const XLSX = await loadXLSX();

      // Créer les données du template
      const templateData = [
        ['Name', 'Email', 'Arrival Date', 'Department', 'Role', 'Phone'],
        ['John Doe', 'john.doe@company.com', '2025-01-15', 'Engineering', 'Developer', '+1234567890'],
        ['Jane Smith', 'jane.smith@company.com', '2025-01-20', 'Marketing', 'Manager', '+1234567891'],
        ['', '', '', '', '', ''] // Ligne vide pour l'utilisateur
      ];

      // Créer un nouveau workbook
      const wb = XLSX.utils.book_new();

      // Créer une worksheet à partir des données
      const ws = XLSX.utils.aoa_to_sheet(templateData);

      // Définir la largeur des colonnes
      ws['!cols'] = [
        { wch: 20 }, // Name
        { wch: 30 }, // Email
        { wch: 15 }, // Arrival Date
        { wch: 15 }, // Department
        { wch: 15 }, // Role
        { wch: 15 }  // Phone
      ];

      // Ajouter la worksheet au workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Employees');

      // Petit délai pour montrer le loading
      await new Promise(resolve => setTimeout(resolve, 500));

      // Télécharger le fichier
      XLSX.writeFile(wb, 'employee_template.xlsx');
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Échec du téléchargement du modèle. Veuillez réessayer.');
    } finally {
      setDownloadingTemplate(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
        {/* Carte Requirements - Latérale */}
        <div className="lg:col-span-1 order-1 lg:order-2">
          <div className="bg-white rounded-xl border border-warmGray-200 p-5 shadow-md">
            {/* Header */}
            <div className="flex items-center space-x-3 mb-5">
              <InformationCircleIcon className="h-5 w-5 text-[#E8C4A0]" />
              <h3 className="text-base font-semibold text-warmGray-800">
                Exigences
              </h3>
            </div>

            {/* Requirements List */}
            <div className="space-y-4">
              {/* Format */}
              <div className="flex items-start space-x-3">
                <DocumentTextIcon className="h-4 w-4 text-warmGray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warmGray-700">Format de Fichier</p>
                  <p className="text-xs text-warmGray-600">Excel (.xlsx ou .xls)</p>
                </div>
              </div>

              {/* Required Columns */}
              <div className="flex items-start space-x-3">
                <DocumentIcon className="h-4 w-4 text-warmGray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warmGray-700">Colonnes Requises</p>
                  <p className="text-xs text-warmGray-600">Nom, Email, Date d'Arrivée</p>
                </div>
              </div>

              {/* File Size */}
              <div className="flex items-start space-x-3">
                <CloudArrowUpIcon className="h-4 w-4 text-warmGray-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-warmGray-700">Taille Maximale</p>
                  <p className="text-xs text-warmGray-600">10 Mo par fichier</p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-warmGray-100 my-5"></div>

            {/* Help Section */}
            <div className="bg-warmGray-50 rounded-lg p-3 mb-4">
              <p className="text-xs text-warmGray-600 leading-relaxed">
                <span className="font-medium">Conseil :</span> Téléchargez le modèle ci-dessous pour vous assurer que votre fichier a le bon format et les bons en-têtes de colonnes.
              </p>
            </div>

            {/* Template Download */}
            <button
              onClick={downloadTemplate}
              disabled={downloadingTemplate}
              className="w-full flex items-center justify-center space-x-2 bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] shadow-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {downloadingTemplate ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B6F47]"></div>
                  <span className="text-sm">Génération...</span>
                </>
              ) : (
                <>
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  <span className="text-sm">Télécharger le Modèle</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Carte d'Upload - 2 colonnes */}
        <div className="lg:col-span-2 order-2 lg:order-1">
          <div className="bg-white rounded-xl border border-warmGray-200 p-6 shadow-md">
            {/* Header avec icône et titre principal */}
            <div className="text-center mb-6">
              <CloudArrowUpIcon className="h-12 w-12 text-[#E8C4A0] mx-auto mb-3" />
              <h2 className="text-xl font-bold text-warmGray-800 mb-2">
                Télécharger les Données des Employés
              </h2>
              <p className="text-warmGray-600 text-sm">
                Importez les informations de vos employés à l'aide d'un fichier Excel
              </p>
            </div>

            {/* Upload Area */}
            {!uploadResult && (
              <div className="space-y-6">
                {/* Drag and Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`
                    relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
                    ${dragActive
                      ? 'border-[#E8C4A0] bg-[#E8C4A0]/10'
                      : 'border-warmGray-300 hover:border-warmGray-400'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".xlsx,.xls"
                    onChange={handleFileInputChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />

                  {file ? (
                    <div className="space-y-4">
                      <DocumentIcon className="h-12 w-12 text-[#E8C4A0] mx-auto" />
                      <div>
                        <p className="text-warmGray-800 font-medium">{file.name}</p>
                        <p className="text-warmGray-500 text-sm">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                      <button
                        onClick={clearFile}
                        className="inline-flex items-center space-x-2 text-warmGray-500 hover:text-warmGray-700 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        <span>Supprimer le fichier</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <CloudArrowUpIcon className="h-10 w-10 text-warmGray-400 mx-auto" />
                      <div>
                        <p className="text-warmGray-700 font-medium text-sm">
                          Déposez votre fichier Excel ici, ou cliquez pour parcourir
                        </p>
                        <p className="text-warmGray-500 text-xs">
                          Prend en charge les fichiers .xlsx et .xls jusqu'à 25 Mo
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Button */}
                {file && (
                  <div className="text-center">
                    <button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-3 px-8 rounded-full transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {uploading ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B6F47]"></div>
                          <span>Téléchargement...</span>
                        </div>
                      ) : (
                        'Télécharger le Fichier'
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Upload Result */}
            {uploadResult && (
              <div className="space-y-6">
                {uploadResult.success ? (
                  <div className="bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
                    <CheckCircleIcon className="h-12 w-12 text-green-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-green-800 mb-2">
                      Téléchargement Réussi !
                    </h3>
                    <p className="text-green-600 mb-4">
                      {uploadResult.employees_created || 0} employés importés avec succès
                    </p>
                    <div className="text-sm text-green-600 space-y-1">
                      {uploadResult.employees_updated > 0 && (
                        <p>• {uploadResult.employees_updated} employés mis à jour</p>
                      )}
                      {uploadResult.duplicates_skipped > 0 && (
                        <p>• {uploadResult.duplicates_skipped} doublons ignorés</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
                    <ExclamationTriangleIcon className="h-12 w-12 text-red-600 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                      Échec du Téléchargement
                    </h3>
                    <p className="text-red-600 mb-4">
                      {uploadResult.error || 'Une erreur s\'est produite lors du téléchargement'}
                    </p>
                    {uploadResult.errors && uploadResult.errors.length > 0 && (
                      <div className="text-sm text-red-600 text-left bg-red-100 rounded-lg p-3">
                        <p className="font-medium mb-2">Erreurs :</p>
                        <ul className="space-y-1">
                          {uploadResult.errors.map((error, index) => (
                            <li key={index}>• {error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        setUploadResult(null);
                        clearFile();
                      }}
                      className="mt-4 bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-6 rounded-full transition-all duration-200"
                    >
                      Réessayer
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
    </div>
  );
};

export default ExcelUpload;
