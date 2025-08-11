import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { EnvelopeIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';
import CharacterIllustration from '../components/ui/CharacterIllustration';

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await authService.requestPasswordReset(data.email);
      setIsSuccess(true);
    } catch (error) {
      setError('root', {
        type: 'manual',
        message: error.message || 'Échec de l\'envoi de l\'email de réinitialisation. Veuillez réessayer.',
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
                Vérifiez votre Email
              </h1>
              <p className="mt-4 text-warmGray-600">
                Nous avons envoyé un lien de réinitialisation de mot de passe à votre adresse email.
                Veuillez vérifier votre boîte de réception et suivre les instructions pour réinitialiser votre mot de passe.
              </p>
            </div>

            {/* Back to Login */}
            <div className="pt-6">
              <button
                onClick={() => navigate('/login')}
                className="w-full bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center"
              >
                <ArrowLeftIcon className="h-5 w-5 mr-2" />
                Retour à la Connexion
              </button>
            </div>

            {/* Resend Link */}
            <div className="text-center pt-4 pb-12">
              <span className="text-warmGray-500 text-sm">
                Vous n'avez pas reçu l'email ?{' '}
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="text-peach-600 hover:text-peach-700 font-medium transition-colors duration-200"
                >
                  Réessayer
                </button>
              </span>
            </div>
          </div>
        </div>

        {/* Right side - Illustration */}
        <div className="hidden lg:block flex-1 relative">
          <CharacterIllustration type="forgot-password" />
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
              Mot de Passe Oublié ?
            </h1>
            <p className="mt-4 text-warmGray-600">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
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

            {/* Error Message */}
            {errors.root && (
              <div className="text-red-500 text-sm text-center bg-red-50 p-3 rounded-lg mt-4">
                {errors.root.message}
              </div>
            )}

            {/* Send Reset Link Button */}
            <div className="pt-6">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#E8C4A0] hover:bg-[#DDB892] text-[#8B6F47] font-medium py-4 px-6 rounded-full transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-[#8B6F47] mr-2"></div>
                    Envoi en cours...
                  </div>
                ) : (
                  'Envoyer le Lien de Réinitialisation'
                )}
              </button>
            </div>

            {/* Back to Login Link */}
            <div className="text-center pt-8 pb-12">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="text-warmGray-500 hover:text-warmGray-700 font-medium transition-colors duration-200 flex items-center justify-center mx-auto"
              >
                <ArrowLeftIcon className="h-4 w-4 mr-1" />
                Retour à la Connexion
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:block flex-1 relative">
        <CharacterIllustration type="forgot-password" />
      </div>
    </div>
  );
};

export default ForgotPassword;
