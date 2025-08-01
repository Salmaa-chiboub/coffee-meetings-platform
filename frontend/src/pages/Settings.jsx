import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { authAPI } from '../services/api';
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

  // State management
  const [activeTab, setActiveTab] = useState('personal');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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
      const result = await authAPI.updateProfile(profileForm);

      if (result.success) {
        // Update user context with new data
        updateUser(result.data);
        setMessage({
          type: 'success',
          text: 'Profile updated successfully!'
        });
        setIsEditing(false);
      } else {
        throw new Error(result.error?.message || 'Failed to update profile');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to update profile. Please try again.'
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
        text: 'New passwords do not match.'
      });
      setIsLoading(false);
      return;
    }

    // Validate password strength
    if (passwordForm.new_password.length < 8) {
      setMessage({
        type: 'error',
        text: 'Password must be at least 8 characters long.'
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
          text: 'Password changed successfully!'
        });
        setPasswordForm({
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
      } else {
        throw new Error(result.error?.message || 'Failed to change password');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to change password. Please try again.'
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

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-warmGray-800">
            Profile & Settings
          </h1>
          <p className="text-warmGray-600 mt-0.5">
            Manage your account information and security settings
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
              Personal Information
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
              Security Settings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'personal' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-warmGray-800">Personal Information</h2>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-2 px-4 rounded-lg transition-colors"
                  >
                    <PencilIcon className="w-4 h-4" />
                    <span>Edit Profile</span>
                  </button>
                )}
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
                        placeholder="Enter your full name"
                      />
                      <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                        Full Name *
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
                        placeholder="Email cannot be changed"
                      />
                      <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-500">
                        Email Address
                      </label>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-warmGray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                      </div>
                      <p className="text-xs text-warmGray-500 mt-0.5 ml-6">Email address cannot be modified for security</p>
                    </div>
                    <div className="md:col-span-2 xl:col-span-1 relative">
                      <input
                        type="text"
                        name="company_name"
                        value={profileForm.company_name}
                        onChange={handleProfileChange}
                        required
                        className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                        placeholder="Enter your company name"
                      />
                      <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                        Company Name *
                      </label>
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-warmGray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-4">
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                      {isLoading ? (
                        <div className="flex items-center justify-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B6F47] mr-2"></div>
                          Saving...
                        </div>
                      ) : (
                        'Save Changes'
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
                      className="bg-warmGray-200 hover:bg-warmGray-300 text-warmGray-700 font-medium py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-[1.02]"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div>
                    <label className="block text-sm font-medium text-warmGray-600 mb-3">
                      Full Name
                    </label>
                    <div className="p-6 bg-warmGray-50 rounded-xl border border-warmGray-200 shadow-sm">
                      <p className="text-warmGray-800 font-medium text-lg">{user?.name || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warmGray-600 mb-3">
                      Email Address
                    </label>
                    <div className="p-6 bg-warmGray-50 rounded-xl border border-warmGray-200 shadow-sm">
                      <p className="text-warmGray-800 font-medium text-lg break-all">{user?.email || 'N/A'}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-warmGray-600 mb-3">
                      Company Name
                    </label>
                    <div className="p-6 bg-warmGray-50 rounded-xl border border-warmGray-200 shadow-sm">
                      <p className="text-warmGray-800 font-medium text-lg">{user?.company_name || 'N/A'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'security' && (
            <div>
              <h2 className="text-xl font-bold text-warmGray-800 mb-6">Security Settings</h2>

              {/* Change Password Section */}
              <div className="bg-warmGray-50 rounded-lg p-8 mb-6 border border-warmGray-200">
                <h3 className="text-lg font-semibold text-warmGray-800 mb-6 flex items-center">
                  <KeyIcon className="w-5 h-5 mr-2" />
                  Change Password
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
                      placeholder="Enter your current password"
                    />
                    <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                      Current Password *
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
                        placeholder="Enter new password"
                      />
                      <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                        New Password *
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
                        placeholder="Confirm new password"
                      />
                      <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                        Confirm New Password *
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
                    <p>Password requirements:</p>
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      <li>At least 8 characters long</li>
                      <li>Contains at least one uppercase letter</li>
                      <li>Contains at least one number</li>
                    </ul>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-8 rounded-full transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B6F47] mr-2"></div>
                        Changing Password...
                      </div>
                    ) : (
                      'Change Password'
                    )}
                  </button>
                </form>
              </div>

              {/* Forgot Password Section */}
              <div className="bg-blue-50 rounded-lg p-8 border border-blue-200">
                <h3 className="text-lg font-semibold text-warmGray-800 mb-3 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Forgot Your Password?
                </h3>
                <p className="text-warmGray-600 mb-6 leading-relaxed">
                  If you can't remember your current password, you can request a password reset email.
                  We'll send you a secure link to reset your password.
                </p>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleForgotPassword}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 7.89a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span>Send Reset Email</span>
                      </>
                    )}
                  </button>
                  <span className="text-sm text-warmGray-500">
                    Email will be sent to: <strong>{user?.email}</strong>
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
