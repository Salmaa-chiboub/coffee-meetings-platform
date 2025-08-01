import React, { useState, useRef } from 'react';
import {
  XMarkIcon,
  DocumentArrowUpIcon,
  DocumentTextIcon,
  DocumentIcon,
  PhotoIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import * as XLSX from 'xlsx';

const FileUploadModal = ({ campaign, onClose, onUploadComplete }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Supported file types
  const supportedTypes = {
    'application/pdf': { icon: DocumentTextIcon, color: 'text-red-600', bg: 'bg-red-100' },
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': { icon: DocumentIcon, color: 'text-green-600', bg: 'bg-green-100' },
    'application/vnd.ms-excel': { icon: DocumentIcon, color: 'text-green-600', bg: 'bg-green-100' },
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': { icon: DocumentTextIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
    'application/msword': { icon: DocumentTextIcon, color: 'text-blue-600', bg: 'bg-blue-100' },
    'text/csv': { icon: DocumentIcon, color: 'text-purple-600', bg: 'bg-purple-100' },
    'image/jpeg': { icon: PhotoIcon, color: 'text-pink-600', bg: 'bg-pink-100' },
    'image/png': { icon: PhotoIcon, color: 'text-pink-600', bg: 'bg-pink-100' },
    'text/plain': { icon: DocumentTextIcon, color: 'text-gray-600', bg: 'bg-gray-100' }
  };

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  // Process selected files
  const handleFiles = (files) => {
    setError(null);
    
    const validFiles = files.filter(file => {
      // Check file type
      if (!Object.keys(supportedTypes).includes(file.type)) {
        setError(`Unsupported file type: ${file.name}`);
        return false;
      }
      
      // Check file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError(`File too large: ${file.name} (max 50MB)`);
        return false;
      }
      
      return true;
    });

    if (validFiles.length > 0) {
      const newFiles = validFiles.map(file => ({
        file,
        id: Date.now() + Math.random(),
        name: file.name,
        size: file.size,
        type: file.type,
        status: 'ready',
        preview: null
      }));

      setUploadedFiles(prev => [...prev, ...newFiles]);
      
      // Generate previews for Excel files
      newFiles.forEach(fileObj => {
        if (fileObj.type.includes('spreadsheet') || fileObj.type.includes('excel')) {
          generateExcelPreview(fileObj);
        }
      });
    }
  };

  // Generate Excel preview
  const generateExcelPreview = async (fileObj) => {
    try {
      const arrayBuffer = await fileObj.file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      
      // Take first 5 rows for preview
      const preview = jsonData.slice(0, 5);
      
      setUploadedFiles(prev => 
        prev.map(f => 
          f.id === fileObj.id 
            ? { ...f, preview: { sheetName: firstSheetName, data: preview } }
            : f
        )
      );
    } catch (error) {
      console.warn('Could not generate Excel preview:', error);
    }
  };

  // Remove file
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle upload
  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setError(null);

    try {
      // Simulate upload process
      for (let i = 0; i < uploadedFiles.length; i++) {
        setUploadedFiles(prev => 
          prev.map((f, index) => 
            index === i ? { ...f, status: 'uploading' } : f
          )
        );
        
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        setUploadedFiles(prev => 
          prev.map((f, index) => 
            index === i ? { ...f, status: 'completed' } : f
          )
        );
      }

      // Call completion callback
      onUploadComplete({
        campaignId: campaign.id,
        files: uploadedFiles.map(f => ({
          name: f.name,
          size: f.size,
          type: f.type
        }))
      });

    } catch (error) {
      setError('Upload failed. Please try again.');
      setUploadedFiles(prev => 
        prev.map(f => ({ ...f, status: 'error' }))
      );
    } finally {
      setUploading(false);
    }
  };

  // Get file icon
  const getFileIcon = (fileType) => {
    const config = supportedTypes[fileType] || supportedTypes['text/plain'];
    const IconComponent = config.icon;
    return { IconComponent, ...config };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-warmGray-200">
          <div>
            <h2 className="text-xl font-semibold text-warmGray-800">
              Upload Campaign Documents
            </h2>
            <p className="text-sm text-warmGray-600 mt-1">
              {campaign?.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-warmGray-100 rounded-lg transition-colors duration-200"
          >
            <XMarkIcon className="h-5 w-5 text-warmGray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
              dragActive
                ? 'border-peach-400 bg-peach-50'
                : 'border-warmGray-300 hover:border-peach-400 hover:bg-peach-50'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <DocumentArrowUpIcon className="h-12 w-12 text-warmGray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-warmGray-800 mb-2">
              Drop files here or click to browse
            </h3>
            <p className="text-sm text-warmGray-600 mb-4">
              Supports PDF, Excel, Word, CSV, and image files (max 50MB each)
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="bg-peach-600 hover:bg-peach-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            >
              Choose Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileSelect}
              accept=".pdf,.xlsx,.xls,.docx,.doc,.csv,.txt,.jpg,.jpeg,.png"
              className="hidden"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Uploaded Files */}
          {uploadedFiles.length > 0 && (
            <div className="mt-6">
              <h4 className="text-lg font-medium text-warmGray-800 mb-4">
                Selected Files ({uploadedFiles.length})
              </h4>
              <div className="space-y-3">
                {uploadedFiles.map((fileObj) => {
                  const { IconComponent, color, bg } = getFileIcon(fileObj.type);
                  
                  return (
                    <div key={fileObj.id} className="border border-warmGray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}>
                            <IconComponent className={`h-5 w-5 ${color}`} />
                          </div>
                          <div>
                            <p className="font-medium text-warmGray-800">{fileObj.name}</p>
                            <p className="text-sm text-warmGray-500">{formatFileSize(fileObj.size)}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          {fileObj.status === 'completed' && (
                            <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          )}
                          {fileObj.status === 'uploading' && (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-peach-600"></div>
                          )}
                          {fileObj.status === 'ready' && (
                            <button
                              onClick={() => removeFile(fileObj.id)}
                              className="p-1 hover:bg-warmGray-100 rounded transition-colors duration-200"
                            >
                              <XMarkIcon className="h-4 w-4 text-warmGray-500" />
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* Excel Preview */}
                      {fileObj.preview && (
                        <div className="mt-3 p-3 bg-warmGray-50 rounded-lg">
                          <p className="text-xs font-medium text-warmGray-700 mb-2">
                            Preview: {fileObj.preview.sheetName}
                          </p>
                          <div className="overflow-x-auto">
                            <table className="min-w-full text-xs">
                              <tbody>
                                {fileObj.preview.data.map((row, rowIndex) => (
                                  <tr key={rowIndex}>
                                    {row.map((cell, cellIndex) => (
                                      <td key={cellIndex} className="px-2 py-1 border-r border-warmGray-200 text-warmGray-600">
                                        {cell || ''}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-warmGray-200 bg-warmGray-50">
          <div className="text-sm text-warmGray-600">
            {uploadedFiles.length} file{uploadedFiles.length !== 1 ? 's' : ''} selected
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-warmGray-700 hover:bg-warmGray-200 rounded-lg transition-colors duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploadedFiles.length === 0 || uploading}
              className="px-6 py-2 bg-peach-600 hover:bg-peach-700 disabled:bg-warmGray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors duration-200"
            >
              {uploading ? 'Uploading...' : 'Upload Files'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileUploadModal;
