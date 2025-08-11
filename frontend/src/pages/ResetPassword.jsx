import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/authService';
import CharacterIllustration from '../components/ui/CharacterIllustration';

const ResetPassword = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
  } = useForm();

  const password = watch('password');

  useEffect(() => {
    console.log('🔍 Reset Password - Token from URL:', token);

    if (!token) {
      console.log('❌ No token found, redirecting to login');
      navigate('/login');
    } else {
      // Validate token format (should be UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(token)) {
        console.log('❌ Invalid token format:', token);
        setError('root', {
          type: 'manual',
          message: 'Token de réinitialisation invalide. Veuillez demander une nouvelle réinitialisation de mot de passe.',
        });
      } else {
        console.log('✅ Valid token format');
      }
    }
  }, [token, navigate, setError]);

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      console.log('🔍 Password Reset Debug:');
      console.log('Token:', token);
      console.log('New Password:', data.password);
      console.log('Confirm Password:', data.confirmPassword);

      await authService.confirmPasswordReset({
        token: token,
        new_password: data.password,
        confirm_password: data.confirmPassword,
      });
      setIsSuccess(true);
    } catch (error) {
      console.error('❌ Password Reset Error:', error);
      setError('root', {
        type: 'manual',
        message: error.message || 'Échec de la réinitialisation du mot de passe. Veuillez réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-cream flex">
        {/* Left side - Success Message */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8">
            {/* Header */}
            <div className="text-center pt-12 pb-4">
              <h1 className="text-4xl font-bold text-warmGray-800">
                Réinitialisation Réussie !
              </h1>
              <p className="mt-4 text-warmGray-600">
                Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </p>
            </div>

            {/* Login Button */}
            <div className="pt-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02]"
              >
                Aller à la Connexion
              </button>
            </div>
          </div>
        </div>

        {/* Right side - Illustration */}
        <div className="hidden lg:block flex-1 relative">
          <CharacterIllustration type="reset-success" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Header */}
          <div className="text-center pt-12 pb-4">
            <h1 className="text-4xl font-bold text-warmGray-800">
              Réinitialisez Votre Mot de Passe
            </h1>
            <p className="mt-4 text-warmGray-600">
              Entrez votre nouveau mot de passe ci-dessous.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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
                  placeholder="Enter your new password"
                  className="w-full pl-12 pr-12 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                />
                <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                  New Password
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
                  placeholder="Confirm your new password"
                  className="w-full pl-12 pr-12 py-4 bg-transparent border-2 border-warmGray-400 rounded-full text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:border-warmGray-600 transition-all duration-200"
                />
                <label className="absolute -top-3 left-6 bg-cream px-2 text-sm font-medium text-warmGray-600">
                  Confirm Password
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

            {/* Reset Password Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B6F47] mr-2"></div>
                    Réinitialisation en cours...
                  </div>
                ) : (
                  'Réinitialiser le Mot de Passe'
                )}
              </button>
            </div>

            {/* Back to Login Link */}
            <div className="text-center pt-8 pb-12">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-warmGray-500 hover:text-warmGray-700 font-medium transition-colors duration-200"
              >
                Retour à la Connexion
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:block flex-1 relative">
        <CharacterIllustration type="reset-password" />
      </div>
    </div>
  );
};

export default ResetPassword;
