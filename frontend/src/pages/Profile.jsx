import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import { useNotificationTrigger } from '../contexts/NotificationContext';
import {
  CameraIcon,
  TrashIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  UserIcon,
  BuildingOfficeIcon,
  EnvelopeIcon,
  CalendarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { checkForNewNotifications } = useNotificationTrigger();
  const fileInputRef = useRef(null);

  // State management
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  // Form states
  const [editName, setEditName] = useState('');
  const [editCompany, setEditCompany] = useState('');
  
  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setEditName(user.name || '');
      setEditCompany(user.company_name || '');
    }
  }, [user]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: '', text: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Handle name update
  const handleNameUpdate = async () => {
    if (!editName.trim()) {
      setMessage({ type: 'error', text: 'Le nom ne peut pas être vide' });
      return;
    }

    try {
      const result = await authAPI.updateProfile({
        name: editName.trim(),
        company_name: user.company_name
      });

      if (result.success) {
        updateUser(result.data);
        setIsEditingName(false);
        setMessage({ type: 'success', text: 'Nom mis à jour avec succès !' });
        // Trigger notification check after profile update
        checkForNewNotifications();
      } else {
        throw new Error(result.error?.message || 'Échec de la mise à jour du nom');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Échec de la mise à jour du nom' });
      setEditName(user.name || '');
    }
  };

  // Handle company update
  const handleCompanyUpdate = async () => {
    if (!editCompany.trim()) {
      setMessage({ type: 'error', text: 'Le nom de l\'entreprise ne peut pas être vide' });
      return;
    }

    try {
      const result = await authAPI.updateProfile({
        name: user.name,
        company_name: editCompany.trim()
      });

      if (result.success) {
        updateUser(result.data);
        setIsEditingCompany(false);
        setMessage({ type: 'success', text: 'Entreprise mise à jour avec succès !' });
        // Trigger notification check after profile update
        checkForNewNotifications();
      } else {
        throw new Error(result.error?.message || 'Échec de la mise à jour de l\'entreprise');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Échec de la mise à jour de l\'entreprise' });
      setEditCompany(user.company_name || '');
    }
  };

  // Handle profile picture upload
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleProfilePictureUpload(file);
    }
  };

  const handleProfilePictureUpload = async (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: 'Veuillez sélectionner un fichier image valide' });
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'La taille de l\'image doit être inférieure à 5 Mo' });
      return;
    }

    setIsUploadingPicture(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await authAPI.uploadProfilePicture(file);

      if (result.success) {
        updateUser(result.data);
        setMessage({ type: 'success', text: 'Photo de profil mise à jour avec succès !' });
        // Trigger notification check after profile picture update
        checkForNewNotifications();
      } else {
        throw new Error(result.message || 'Échec du téléchargement de la photo de profil');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Échec du téléchargement de la photo de profil' });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Handle profile picture delete
  const handleProfilePictureDelete = async () => {
    setIsUploadingPicture(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await authAPI.deleteProfilePicture();

      if (result.success) {
        updateUser(result.data);
        setMessage({ type: 'success', text: 'Photo de profil supprimée avec succès !' });
      } else {
        throw new Error(result.message || 'Échec de la suppression de la photo de profil');
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Échec de la suppression de la photo de profil' });
    } finally {
      setIsUploadingPicture(false);
    }
  };

  // Handle password form changes
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  // Handle password update
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    // Validate passwords match
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setMessage({
        type: 'error',
        text: 'Les nouveaux mots de passe ne correspondent pas.'
      });
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (passwordForm.new_password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Le mot de passe doit contenir au moins 8 caractères.'
      });
      setIsLoading(false);
      return;
    }

    try {
      const result = await authAPI.changePassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password
      });

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Mot de passe modifié avec succès !'
        });
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        throw new Error(result.error?.message || 'Échec de la modification du mot de passe');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Échec de la modification du mot de passe. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle forgot password
  const handleForgotPassword = async () => {
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await authAPI.requestPasswordReset(user.email);

      if (result.success) {
        setMessage({
          type: 'success',
          text: 'Password reset email sent! Check your inbox.'
        });
      } else {
        throw new Error(result.error?.message || 'Failed to send reset email');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to send reset email. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get user initials for fallback avatar
  const getUserInitials = () => {
    if (!user?.name) return 'U';
    return user.name
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="max-w-none mx-2 px-2 py-2">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-warmGray-800">Profil</h1>
        <p className="text-warmGray-600 mt-1">Gérez vos informations personnelles et paramètres</p>
      </div>

      {/* Message Display */}
      {message.text && (
        <div className={`mb-6 p-4 rounded-lg flex items-center space-x-3 ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-200 text-green-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircleIcon className="h-5 w-5 flex-shrink-0" />
          ) : (
            <ExclamationTriangleIcon className="h-5 w-5 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Sidebar - Profile Picture (même hauteur) */}
        <div className="lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-warmGray-200 p-8 h-full">
            {/* Profile Picture */}
            <div className="flex flex-col items-center">
              {/* User Name and Role */}
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-warmGray-800 mb-1">{user?.name || 'User Name'}</h2>
                <p className="text-peach-700 font-medium bg-peach-100 px-3 py-1 rounded-full inline-block">Responsable RH</p>
              </div>

              <div className="relative group">
                {/* Main Profile Picture Circle - Augmenté */}
                <div className="relative w-80 h-80 rounded-full overflow-hidden border-4 border-cream shadow-xl bg-warmGray-100">
                  {user?.profile_picture_url ? (
                    <img
                      src={user.profile_picture_url}
                      alt={`${user?.name || 'User'}'s profile`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  
                  {/* Fallback with initials */}
                  <div
                    className={`flex items-center justify-center w-full h-full bg-gradient-to-br from-peach-200 to-peach-300 text-warmGray-700 font-bold text-4xl ${
                      user?.profile_picture_url ? 'hidden' : 'flex'
                    }`}
                  >
                    {getUserInitials()}
                  </div>
                  
                  {/* Loading Overlay */}
                  {isUploadingPicture && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  )}

                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 rounded-full bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPicture}
                        className="bg-white bg-opacity-90 hover:bg-opacity-100 text-warmGray-700 p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                        title="Changer la photo de profil"
                      >
                        <CameraIcon className="w-5 h-5" />
                      </button>
                      {user?.profile_picture_url && (
                        <button
                          onClick={handleProfilePictureDelete}
                          disabled={isUploadingPicture}
                          className="bg-red-500 bg-opacity-90 hover:bg-opacity-100 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-105 disabled:opacity-50"
                          title="Supprimer la photo de profil"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>

            </div>
          </div>
        </div>

        {/* Right Content - User Information avec tabs (même hauteur) */}
        <div className="lg:col-span-8">
          <div className="bg-white rounded-2xl shadow-sm border border-warmGray-200 h-full flex flex-col">
            {/* Tab Navigation */}
            <div className="border-b border-warmGray-200">
              <nav className="flex space-x-8 px-6">
                <button
                  onClick={() => setActiveTab('personal')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'personal'
                      ? 'border-[#E8C4A0] text-[#8B6F47]'
                      : 'border-transparent text-warmGray-500 hover:text-warmGray-700 hover:border-warmGray-300'
                  }`}
                >
                  <UserIcon className="w-5 h-5 inline mr-2" />
                  Info Personnel
                </button>
                <button
                  onClick={() => setActiveTab('security')}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    activeTab === 'security'
                      ? 'border-[#E8C4A0] text-[#8B6F47]'
                      : 'border-transparent text-warmGray-500 hover:text-warmGray-700 hover:border-warmGray-300'
                  }`}
                >
                  <LockClosedIcon className="w-5 h-5 inline mr-2" />
                  Sécurité
                </button>
              </nav>
            </div>

            {/* Tab Content - Compact */}
            <div className="p-6 flex-1 overflow-y-auto">
              {activeTab === 'personal' && (
                <div className="space-y-6">

                  {/* Full Name */}
                  <div className="group">
                    <label className="block text-sm font-medium text-warmGray-700 mb-2">
                      <UserIcon className="w-4 h-4 inline mr-2" />
                      Nom Complet
                    </label>
                    {isEditingName ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-3 py-2 border border-warmGray-300 rounded-lg focus:ring-2 focus:ring-peach-500 focus:border-transparent transition-all duration-200"
                          placeholder="Entrez votre nom complet"
                          autoFocus
                          onKeyPress={(e) => e.key === 'Enter' && handleNameUpdate()}
                        />
                        <button
                          onClick={handleNameUpdate}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                          title="Enregistrer"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingName(false);
                            setEditName(user?.name || '');
                          }}
                          className="bg-warmGray-500 hover:bg-warmGray-600 text-white p-2 rounded-lg transition-colors"
                          title="Annuler"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-warmGray-50 rounded-lg border border-warmGray-200 group-hover:bg-warmGray-100 transition-colors">
                        <span className="text-warmGray-800 font-medium">
                          {user?.name || 'Aucun nom défini'}
                        </span>
                        <button
                          onClick={() => setIsEditingName(true)}
                          className="opacity-0 group-hover:opacity-100 text-warmGray-500 hover:text-warmGray-700 transition-all duration-200"
                          title="Modifier le nom"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-warmGray-700 mb-2">
                      <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                      Adresse Email
                    </label>
                    <div className="p-3 bg-warmGray-50 rounded-lg border border-warmGray-200">
                      <div className="flex items-center justify-between">
                        <span className="text-warmGray-800 font-medium">
                          {user?.email || 'Aucun email défini'}
                        </span>
                        <span className="text-xs text-warmGray-500 bg-warmGray-200 px-2 py-1 rounded-full">
                          Ne peut pas être modifié
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Company Name */}
                  <div className="group">
                    <label className="block text-sm font-medium text-warmGray-700 mb-2">
                      <BuildingOfficeIcon className="w-4 h-4 inline mr-2" />
                      Nom de l'Entreprise
                    </label>
                    {isEditingCompany ? (
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={editCompany}
                          onChange={(e) => setEditCompany(e.target.value)}
                          className="flex-1 px-3 py-2 border border-warmGray-300 rounded-lg focus:ring-2 focus:ring-peach-500 focus:border-transparent transition-all duration-200"
                          placeholder="Entrez le nom de votre entreprise"
                          autoFocus
                          onKeyPress={(e) => e.key === 'Enter' && handleCompanyUpdate()}
                        />
                        <button
                          onClick={handleCompanyUpdate}
                          className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                          title="Enregistrer"
                        >
                          <CheckIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setIsEditingCompany(false);
                            setEditCompany(user?.company_name || '');
                          }}
                          className="bg-warmGray-500 hover:bg-warmGray-600 text-white p-2 rounded-lg transition-colors"
                          title="Annuler"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-warmGray-50 rounded-lg border border-warmGray-200 group-hover:bg-warmGray-100 transition-colors">
                        <span className="text-warmGray-800 font-medium">
                          {user?.company_name || 'Aucune entreprise définie'}
                        </span>
                        <button
                          onClick={() => setIsEditingCompany(true)}
                          className="opacity-0 group-hover:opacity-100 text-warmGray-500 hover:text-warmGray-700 transition-all duration-200"
                          title="Modifier l'entreprise"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              )}

              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Change Password Section */}
                  <div className="bg-warmGray-50 rounded-lg p-6 border border-warmGray-200">
                    <h3 className="text-lg font-semibold text-warmGray-800 mb-4 flex items-center">
                      <KeyIcon className="w-5 h-5 mr-2" />
                      Changer le Mot de Passe
                    </h3>

                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          name="current_password"
                          value={passwordForm.current_password}
                          onChange={handlePasswordChange}
                          required
                          className="w-full pl-10 pr-10 py-3 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                          placeholder="Entrez votre mot de passe actuel"
                        />
                        <label className="absolute -top-2 left-4 bg-warmGray-50 px-2 text-xs font-medium text-warmGray-600">
                          Mot de Passe Actuel *
                        </label>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <LockClosedIcon className="h-4 w-4 text-warmGray-400" />
                        </div>
                        <button
                          type="button"
                          onClick={() => togglePasswordVisibility('current')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-warmGray-600 transition-colors"
                        >
                          {showPasswords.current ? (
                            <EyeSlashIcon className="h-4 w-4 text-warmGray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-warmGray-400" />
                          )}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="relative">
                          <input
                            type={showPasswords.new ? 'text' : 'password'}
                            name="new_password"
                            value={passwordForm.new_password}
                            onChange={handlePasswordChange}
                            required
                            className="w-full pl-10 pr-10 py-3 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                            placeholder="Entrez le nouveau mot de passe"
                          />
                          <label className="absolute -top-2 left-4 bg-warmGray-50 px-2 text-xs font-medium text-warmGray-600">
                            Nouveau Mot de Passe *
                          </label>
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-4 w-4 text-warmGray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('new')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-warmGray-600 transition-colors"
                          >
                            {showPasswords.new ? (
                              <EyeSlashIcon className="h-4 w-4 text-warmGray-400" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-warmGray-400" />
                            )}
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? 'text' : 'password'}
                            name="confirm_password"
                            value={passwordForm.confirm_password}
                            onChange={handlePasswordChange}
                            required
                            className="w-full pl-10 pr-10 py-3 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                            placeholder="Confirmez le nouveau mot de passe"
                          />
                          <label className="absolute -top-2 left-4 bg-warmGray-50 px-2 text-xs font-medium text-warmGray-600">
                            Confirmer le Nouveau Mot de Passe *
                          </label>
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <LockClosedIcon className="h-4 w-4 text-warmGray-400" />
                          </div>
                          <button
                            type="button"
                            onClick={() => togglePasswordVisibility('confirm')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-warmGray-600 transition-colors"
                          >
                            {showPasswords.confirm ? (
                              <EyeSlashIcon className="h-4 w-4 text-warmGray-400" />
                            ) : (
                              <EyeIcon className="h-4 w-4 text-warmGray-400" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="text-sm text-warmGray-600">
                        <p>Exigences du mot de passe :</p>
                        <ul className="list-disc list-inside mt-1 space-y-1">
                          <li>Au moins 8 caractères</li>
                          <li>Contient au moins une lettre majuscule</li>
                          <li>Contient au moins un chiffre</li>
                        </ul>
                      </div>

                      <div className="flex items-center justify-between">
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-4 rounded-md transition-all duration-200 text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#E8C4A0] focus:ring-offset-2"
                        >
                          {isLoading ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B6F47] mr-2"></div>
                              Modification du mot de passe...
                            </div>
                          ) : (
                            'Changer le Mot de Passe'
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={isLoading}
                          className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                        >
                          {isLoading ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            'Envoyer Email de Réinitialisation'
                          )}
                        </button>
                      </div>
                    </form>
                  </div>

                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
