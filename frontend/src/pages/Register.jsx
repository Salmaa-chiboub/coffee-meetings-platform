import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, UserIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import CharacterIllustration from '../components/ui/CharacterIllustration';

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const result = await registerUser(data);

      // Auto-login successful - redirect to dashboard
      if (result.autoLogin) {
        console.log('🎉 Registration complete - redirecting to dashboard');
        navigate('/app');
      } else {
        // Fallback to login page if auto-login failed
        navigate('/login');
      }
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error.message || 'Inscription échouée. Veuillez réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center pt-12 pb-4">
            <h1 className="text-4xl font-bold text-warmGray-800">
              Créer un Compte
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Full Name Field */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <UserIcon className="h-5 w-5 text-warmGray-400" />
                </div>
                <input
                  {...register('fullName', {
                    required: 'Le nom complet est requis',
                    minLength: {
                      value: 2,
                      message: 'Le nom complet doit contenir au moins 2 caractères',
                    },
                  })}
                  type="text"
                  placeholder="Entrez votre nom complet"
                  className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                />
                <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                  Nom Complet
                </label>
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Email Field */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-warmGray-400" />
                </div>
                <input
                  {...register('email', {
                    required: 'L\'email est requis',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Veuillez entrer une adresse email valide',
                    },
                  })}
                  type="email"
                  placeholder="email@gmail.com"
                  className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                />
                <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                  Email
                </label>
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Company Name Field */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <BuildingOfficeIcon className="h-5 w-5 text-warmGray-400" />
                </div>
                <input
                  {...register('companyName', {
                    required: 'Le nom de l\'entreprise est requis',
                    minLength: {
                      value: 2,
                      message: 'Le nom de l\'entreprise doit contenir au moins 2 caractères',
                    },
                  })}
                  type="text"
                  placeholder="Entrez le nom de votre entreprise"
                  className="w-full pl-12 pr-4 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                />
                <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                  Nom de l'Entreprise
                </label>
              </div>
              {errors.companyName && (
                <p className="text-red-500 text-sm mt-1">{errors.companyName.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-warmGray-400" />
                </div>
                <input
                  {...register('password', {
                    required: 'Le mot de passe est requis',
                    minLength: {
                      value: 8,
                      message: 'Le mot de passe doit contenir au moins 8 caractères',
                    },
                    pattern: {
                      value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                      message: 'Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Entrez votre mot de passe"
                  className="w-full pl-12 pr-12 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                />
                <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                  Mot de Passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-warmGray-400 hover:text-warmGray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-warmGray-400 hover:text-warmGray-600" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="relative">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-warmGray-400" />
                </div>
                <input
                  {...register('confirmPassword', {
                    required: 'Veuillez confirmer votre mot de passe',
                    validate: (value) =>
                      value === password || 'Les mots de passe ne correspondent pas',
                  })}
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirmez votre mot de passe"
                  className="w-full pl-12 pr-12 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                />
                <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                  Confirmer le Mot de Passe
                </label>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-warmGray-400 hover:text-warmGray-600" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-warmGray-400 hover:text-warmGray-600" />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Error Message */}
            {errors.root && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg mt-4">
                {errors.root.message}
              </div>
            )}

            {/* Register Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B6F47] mr-2"></div>
                    Création du compte...
                  </div>
                ) : (
                  'Créer un Compte'
                )}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center pt-8 pb-12">
              <span className="text-warmGray-500 text-sm">
                Vous avez déjà un compte ?{' '}
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-peach-600 hover:text-peach-700 font-medium transition-colors duration-200"
                >
                  Se connecter
                </button>
              </span>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:block flex-1 relative">
        <CharacterIllustration type="register" />
      </div>
    </div>
  );
};

export default Register;
