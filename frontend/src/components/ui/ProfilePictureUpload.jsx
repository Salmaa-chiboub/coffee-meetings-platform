import React, { useState, useRef } from 'react';
import {
  PhotoIcon,
  XMarkIcon,
  TrashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const ProfilePictureUpload = ({ 
  currentPicture, 
  onUpload, 
  onDelete, 
  isLoading = false,
  className = '' 
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState(currentPicture);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const fileInputRef = useRef(null);

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
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  // Validate and process file
  const handleFile = (file) => {
    setError(null);
    setSuccess(null);

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Please select a JPG, PNG, or WebP image file');
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target.result);
    };
    reader.readAsDataURL(file);

    // Call upload handler
    handleUpload(file);
  };

  // Handle upload
  const handleUpload = async (file) => {
    try {
      const result = await onUpload(file);
      if (result.success) {
        setSuccess('Profile picture updated successfully!');
        setPreview(result.data?.profile_picture_url || preview);
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      setError(error.message || 'Failed to upload image');
      setPreview(currentPicture); // Reset preview on error
    }
  };

  // Handle delete
  const handleDelete = async () => {
    if (!currentPicture && !preview) return;
    
    try {
      const result = await onDelete();
      if (result.success) {
        setPreview(null);
        setSuccess('Profile picture removed successfully!');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(result.message || 'Delete failed');
      }
    } catch (error) {
      setError(error.message || 'Failed to delete image');
    }
  };

  // Clear messages after 5 seconds
  React.useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Current Profile Picture Display */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          {preview ? (
            <img
              src={preview}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-[#E8C4A0] shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-[#E8C4A0] flex items-center justify-center shadow-lg">
              <PhotoIcon className="w-8 h-8 text-[#8B6F47]" />
            </div>
          )}
          
          {/* Delete button overlay */}
          {(preview || currentPicture) && (
            <button
              onClick={handleDelete}
              disabled={isLoading}
              className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Remove profile picture"
            >
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex-1">
          <h3 className="text-lg font-medium text-warmGray-800 mb-2">
            Profile Picture
          </h3>
          <p className="text-sm text-warmGray-600 mb-4">
            Upload a photo to personalize your profile. JPG, PNG, or WebP formats supported (max 5MB).
          </p>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200 cursor-pointer ${
          dragActive
            ? 'border-[#E8C4A0] bg-[#E8C4A0]/10'
            : 'border-warmGray-300 hover:border-[#E8C4A0] hover:bg-[#E8C4A0]/5'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !isLoading && fileInputRef.current?.click()}
      >
        <PhotoIcon className="h-12 w-12 text-warmGray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-warmGray-800 mb-2">
          {isLoading ? 'Uploading...' : 'Upload Profile Picture'}
        </h3>
        <p className="text-sm text-warmGray-600 mb-4">
          Drag and drop your image here, or click to browse
        </p>
        <p className="text-xs text-warmGray-500">
          Supports JPG, PNG, WebP • Max 5MB
        </p>
        
        {isLoading && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#E8C4A0] mx-auto"></div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isLoading}
      />

      {/* Success Message */}
      {success && (
        <div className="flex items-center space-x-3 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{success}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          <span className="text-sm font-medium">{error}</span>
        </div>
      )}
    </div>
  );
};

export default ProfilePictureUpload;
