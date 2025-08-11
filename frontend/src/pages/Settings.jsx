import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
import ProfilePictureUpload from '../components/ui/ProfilePictureUpload';
import { useNotificationTrigger } from '../contexts/NotificationContext';
import {
  CogIcon,
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  KeyIcon
} from '@heroicons/react/24/outline';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const { checkForNewNotifications } = useNotificationTrigger();

  // State management
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    company_name: ''
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });

  // Load user data on component mount
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        company_name: user.company_name || ''
      });
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

  // Handle profile form changes
  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({
      ...prev,
      [name]: value
    }));
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

  // Handle profile update
  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      // Exclude email from the update since it's read-only
      const { email, ...updateData } = profileForm;
      const result = await authAPI.updateProfile(updateData);

      if (result.success) {
        // Update user context with new data
        updateUser(result.data);
        setMessage({
          type: 'success',
          text: 'Profil mis à jour avec succès !'
        });
        setIsEditing(false);
        // Trigger notification check after profile update
        checkForNewNotifications();
      } else {
        throw new Error(result.error?.message || 'Échec de la mise à jour du profil');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Échec de la mise à jour du profil. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle password change
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
          text: 'Email de réinitialisation envoyé ! Vérifiez votre boîte de réception.'
        });
      } else {
        throw new Error(result.error?.message || 'Échec de l\'envoi de l\'email de réinitialisation');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Échec de l\'envoi de l\'email de réinitialisation. Veuillez réessayer.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle profile picture upload
  const handleProfilePictureUpload = async (file) => {
    setIsUploadingPicture(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await authAPI.uploadProfilePicture(file);

      if (result.success) {
        // Update user context with new data
        updateUser(result.data);
        setMessage({
          type: 'success',
          text: 'Photo de profil mise à jour avec succès !'
        });

        // Trigger notification check after profile picture update
        checkForNewNotifications();

        return result;
      } else {
        throw new Error(result.message || 'Échec du téléchargement de la photo de profil');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Échec du téléchargement de la photo de profil. Veuillez réessayer.'
      });
      throw error;
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
        // Update user context with new data
        updateUser(result.data);
        setMessage({
          type: 'success',
          text: 'Photo de profil supprimée avec succès !'
        });

        return result;
      } else {
        throw new Error(result.message || 'Échec de la suppression de la photo de profil');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Échec de la suppression de la photo de profil. Veuillez réessayer.'
      });
      throw error;
    } finally {
      setIsUploadingPicture(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-warmGray-800">
            Profil et Paramètres
          </h1>
          <p className="text-warmGray-600 mt-0.5">
            Gérez les informations de votre compte et les paramètres de sécurité
          </p>
        </div>
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

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-lg mb-6">
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
              Informations Personnelles
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
              Paramètres de Sécurité
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'personal' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-warmGray-800">Informations Personnelles</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-1.5 bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-1.5 px-3 rounded-md transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                  >
                    <PencilIcon className="w-3.5 h-3.5" />
                    <span>Modifier le Profil</span>
                  </button>
                )}
              </div>

              {/* Profile Picture Upload Section */}
              <div className="mb-8 p-6 bg-cream rounded-xl border border-warmGray-200">
                <ProfilePictureUpload
                  currentPicture={user?.profile_picture_url}
                  onUpload={handleProfilePictureUpload}
                  onDelete={handleProfilePictureDelete}
                  isLoading={isUploadingPicture}
                />
              </div>

              {isEditing ? (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    <div className="relative">
                      <input
                        type="text"
                        name="name"
                        value={profileForm.name}
                        onChange={handleProfileChange}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                        placeholder="Entrez votre nom complet"
                      />
                      <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                        Nom Complet *
                      </label>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon className="h-5 w-5 text-warmGray-400" />
                      </div>
                    </div>
                    <div className="relative">
                      <input
                        type="email"
                        name="email"
                        value={profileForm.email}
                        disabled
                        className="w-full pl-12 pr-4 py-4 bg-warmGray-100 border-2 border-warmGray-300 rounded-full text-warmGray-500 placeholder-warmGray-400 cursor-not-allowed"
                        placeholder="L'email ne peut pas être modifié"
                      />
                      <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-500">
                        Adresse Email
                      </label>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-warmGray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <p className="text-xs text-warmGray-500 mt-0.5 ml-6">L'adresse email ne peut pas être modifiée pour des raisons de sécurité</p>
                    </div>
                    <div className="md:col-span-2 xl:col-span-1 relative">
                      <input
                        type="text"
                        name="company_name"
                        value={profileForm.company_name}
                        onChange={handleProfileChange}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                        placeholder="Entrez le nom de votre entreprise"
                      />
                      <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                        Nom de l'Entreprise *
                      </label>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-warmGray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-4 rounded-md transition-all duration-200 text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-[#E8C4A0] focus:ring-offset-2"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-[#8B6F47] mr-2"></div>
                          Enregistrement...
                        </div>
                      ) : (
                        'Enregistrer les Modifications'
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(false);
                        setProfileForm({
                          name: user?.name || '',
                          email: user?.email || '',
                          company_name: user?.company_name || ''
                        });
                      }}
                      className="bg-warmGray-100 hover:bg-warmGray-200 text-warmGray-700 font-medium py-2 px-4 rounded-md transition-all duration-200 text-sm shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-warmGray-300 focus:ring-offset-2"
                    >
                      Annuler
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-warmGray-600 mb-3">
                      Nom Complet
                    </label>
                    <div className="p-4 bg-warmGray-50 rounded-lg border border-warmGray-200 shadow-sm">
                      <p className="text-warmGray-800 font-medium text-base">{user?.name || 'N/D'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warmGray-600 mb-3">
                      Adresse Email
                    </label>
                    <div className="p-4 bg-warmGray-50 rounded-lg border border-warmGray-200 shadow-sm">
                      <p className="text-warmGray-800 font-medium text-base break-all">{user?.email || 'N/D'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warmGray-600 mb-3">
                      Nom de l'Entreprise
                    </label>
                    <div className="p-4 bg-warmGray-50 rounded-lg border border-warmGray-200 shadow-sm">
                      <p className="text-warmGray-800 font-medium text-base">{user?.company_name || 'N/D'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-bold text-warmGray-800 mb-6">Paramètres de Sécurité</h2>

              {/* Change Password Section */}
              <div className="bg-warmGray-50 rounded-lg p-8 mb-6 border border-warmGray-200">
                <h3 className="text-lg font-semibold text-warmGray-800 mb-6 flex items-center">
                  <KeyIcon className="w-5 h-5 mr-2" />
                  Changer le Mot de Passe
                </h3>

                <form onSubmit={handlePasswordUpdate} className="space-y-6">
                  <div className="max-w-lg relative">
                    <input
                      type={showPasswords.current ? 'text' : 'password'}
                      name="current_password"
                      value={passwordForm.current_password}
                      onChange={handlePasswordChange}
                      required
                      className="w-full pl-12 pr-12 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                      placeholder="Entrez votre mot de passe actuel"
                    />
                    <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                      Mot de Passe Actuel *
                    </label>
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LockClosedIcon className="h-5 w-5 text-warmGray-400" />
                    </div>
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-warmGray-600 transition-colors"
                    >
                      {showPasswords.current ? (
                        <EyeSlashIcon className="h-5 w-5 text-warmGray-400" />
                      ) : (
                        <EyeIcon className="h-5 w-5 text-warmGray-400" />
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="new_password"
                        value={passwordForm.new_password}
                        onChange={handlePasswordChange}
                        required
                        className="w-full pl-12 pr-12 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                        placeholder="Entrez le nouveau mot de passe"
                      />
                      <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                        Nouveau Mot de Passe *
                      </label>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-warmGray-400" />
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('new')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-warmGray-600 transition-colors"
                      >
                        {showPasswords.new ? (
                          <EyeSlashIcon className="h-5 w-5 text-warmGray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-warmGray-400" />
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
                        className="w-full pl-12 pr-12 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                        placeholder="Confirmez le nouveau mot de passe"
                      />
                      <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                        Confirmer le Nouveau Mot de Passe *
                      </label>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <LockClosedIcon className="h-5 w-5 text-warmGray-400" />
                      </div>
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility('confirm')}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-warmGray-600 transition-colors"
                      >
                        {showPasswords.confirm ? (
                          <EyeSlashIcon className="h-5 w-5 text-warmGray-400" />
                        ) : (
                          <EyeIcon className="h-5 w-5 text-warmGray-400" />
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
                </form>
              </div>

              {/* Forgot Password Section */}
              <div className="bg-gradient-to-br from-orange-50 to-peach-50 rounded-lg p-8 border border-orange-200/50 shadow-sm">
                <h3 className="text-lg font-semibold text-orange-800 mb-3 flex items-center">
                  <div className="w-6 h-6 mr-3 bg-orange-100 rounded-md flex items-center justify-center">
                    <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>
                  Mot de Passe Oublié ?
                </h3>
                <p className="text-orange-700/80 mb-6 leading-relaxed">
                  Si vous ne vous souvenez pas de votre mot de passe actuel, vous pouvez demander un email de réinitialisation.
                  Nous vous enverrons un lien sécurisé pour réinitialiser votre mot de passe.
                </p>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-md transition-all duration-200 text-sm shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:ring-offset-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Envoi...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Envoyer l'Email de Réinitialisation</span>
                      </>
                    )}
                  </button>
                  <span className="text-sm text-orange-600/70">
                    L'email sera envoyé à : <strong className="text-orange-700">{user?.email}</strong>
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
