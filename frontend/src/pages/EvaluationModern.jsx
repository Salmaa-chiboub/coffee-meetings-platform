import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  StarIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid';
import { evaluationService } from '../services/evaluationService';
import { SkeletonTitle, SkeletonText, SkeletonButton } from '../components/ui/Skeleton';

// Icône de café personnalisée
const CoffeeIcon = ({ className }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M2 21h18v-2H2v2zM20 8h-2V5h2c1.1 0 2 .9 2 2v1c0 1.1-.9 2-2 2zM4 14h12c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v7c0 1.1.9 2 2 2z"/>
  </svg>
);

// Simple Background Component - matching login page
const BackgroundPattern = () => (
  <div className="fixed inset-0 bg-cream"></div>
);

const EvaluationModern = () => {
  const { token } = useParams();
  
  const [evaluationData, setEvaluationData] = useState(null);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    const loadEvaluationForm = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await evaluationService.getEvaluationForm(token);
        
        if (response.success) {
          setEvaluationData(response.evaluation);
        } else {
          setError(response.message || 'Failed to load evaluation form');
        }
        
      } catch (err) {
        console.error('Error loading evaluation:', err);
        if (err.status === 410) {
          setError({
            type: 'already_submitted',
            message: err.message || 'This evaluation has already been submitted',
            submitted_at: err.submitted_at
          });
        } else if (err.status === 404) {
          setError({
            type: 'not_found',
            message: err.message || 'Invalid evaluation link'
          });
        } else {
          setError({
            type: 'general',
            message: 'Failed to load evaluation form. Please try again later.'
          });
        }
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      loadEvaluationForm();
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating && !comment.trim()) {
      setError({
        type: 'validation',
        message: 'Please provide either a rating or a comment (or both)'
      });
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const submissionData = {};
      if (rating > 0) submissionData.rating = rating;
      if (comment.trim()) submissionData.comment = comment.trim();

      const response = await evaluationService.submitEvaluation(token, submissionData);
      
      if (response.success) {
        setSubmitted(true);
      } else {
        setError({
          type: 'submission',
          message: response.message || 'Failed to submit evaluation'
        });
      }
      
    } catch (err) {
      console.error('Error submitting evaluation:', err);
      setError({
        type: 'submission',
        message: err.message || 'Failed to submit evaluation. Please try again.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getRatingText = (rating) => {
    const texts = {
      1: 'Poor',
      2: 'Fair', 
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return texts[rating] || '';
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen relative">
        <BackgroundPattern />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="max-w-lg w-full space-y-8">
            {/* Header Skeleton */}
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-warmGray-200 rounded-full mx-auto animate-pulse"></div>
              <SkeletonTitle size="xl" className="mx-auto" />
              <SkeletonText lines={1} className="max-w-md mx-auto" />
            </div>

            {/* Rating Section Skeleton */}
            <div className="text-center space-y-6">
              <SkeletonTitle size="medium" className="mx-auto" />
              <div className="flex justify-center space-x-2">
                {Array.from({ length: 5 }).map((_, index) => (
                  <div key={index} className="w-12 h-12 bg-warmGray-200 rounded-full animate-pulse"></div>
                ))}
              </div>
            </div>

            {/* Comment Section Skeleton */}
            <div className="space-y-2">
              <div className="w-48 h-4 bg-warmGray-200 rounded animate-pulse"></div>
              <div className="w-full h-24 bg-warmGray-200 rounded-lg animate-pulse"></div>
            </div>

            {/* Button Skeleton */}
            <SkeletonButton size="large" className="w-full mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !evaluationData) {
    return (
      <div className="min-h-screen relative">
        <BackgroundPattern />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-warmGray-800 mb-2">
              {error.type === 'already_submitted' ? 'Déjà Soumis' :
               error.type === 'not_found' ? 'Lien Invalide' : 'Erreur'}
            </h2>
            <p className="text-warmGray-600 mb-4">{error.message}</p>
            {error.submitted_at && (
              <p className="text-sm text-warmGray-500">
                Soumis le {formatDate(error.submitted_at)}
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (submitted) {
    return (
      <div className="min-h-screen relative">
        <BackgroundPattern />
        <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
          <div className="text-center max-w-md">
            <CheckCircleIcon className="h-20 w-20 text-green-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-warmGray-800 mb-4">
              Merci !
            </h2>
            <p className="text-warmGray-600 text-lg mb-4">
              Vos commentaires ont été soumis avec succès.
            </p>
            <p className="text-warmGray-500">
              Nous apprécions que vous ayez pris le temps de partager votre expérience de rencontre café.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Main evaluation form
  return (
    <div className="min-h-screen relative">
      <BackgroundPattern />
      <div className="relative z-10 min-h-screen flex items-center justify-center p-6">
        <div className="max-w-lg w-full space-y-8">
          {/* Header */}
          <div className="text-center mb-2">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-[#E8C4A0] to-[#DDB892] rounded-full mb-4">
              <CoffeeIcon className="h-8 w-8 text-[#8B6F47]" />
            </div>
            <h1 className="text-4xl font-bold text-warmGray-800 mb-3">
              Commentaires sur la Rencontre Café
            </h1>
            <p className="text-lg text-warmGray-600 max-w-md mx-auto">
              Nous aimerions connaître votre expérience de rencontre café
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating Section */}
            <div className="text-center">
              <h3 className="text-lg font-medium text-warmGray-700 mb-6">
                Comment évalueriez-vous votre expérience de rencontre café ?
              </h3>
              <div className="flex justify-center space-x-2 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-2 transition-all duration-200 hover:scale-110 rounded-full hover:bg-yellow-50"
                  >
                    {star <= (hoverRating || rating) ? (
                      <StarIconSolid className="h-12 w-12 text-yellow-400" />
                    ) : (
                      <StarIcon className="h-12 w-12 text-warmGray-300 hover:text-yellow-300" />
                    )}
                  </button>
                ))}
              </div>
              {(hoverRating || rating) > 0 && (
                <div className="text-center">
                  <p className="text-xl font-semibold text-[#8B6F47] mb-1">
                    {getRatingText(hoverRating || rating)}
                  </p>
                  <p className="text-sm text-warmGray-500">
                    {rating > 0 ? `Vous avez donné ${rating} étoiles sur 5` : ''}
                  </p>
                </div>
              )}
            </div>

            {/* Comment Section */}
            <div className="space-y-2">
              <label htmlFor="comment" className="block text-sm font-medium text-warmGray-700">
                Partagez vos pensées (optionnel)
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <ChatBubbleLeftRightIcon className="h-5 w-5 text-warmGray-400" />
                </div>
                <textarea
                  id="comment"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={4}
                  className="w-full pl-10 pr-4 py-3 bg-white border-2 border-warmGray-300 text-warmGray-800 placeholder-warmGray-400 focus:outline-none focus:ring-2 focus:ring-[#E8C4A0] focus:border-[#E8C4A0] transition-all duration-200 resize-none shadow-sm"
                  placeholder="Parlez-nous de votre expérience de rencontre café..."
                  style={{ borderRadius: '10px' }}
                />
              </div>
            </div>

            {/* Error Message */}
            {error && error.type !== 'already_submitted' && error.type !== 'not_found' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center space-x-3">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                <p className="text-red-700 text-sm font-medium">{error.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-8">
              <button
                type="submit"
                disabled={submitting || (!rating && !comment.trim())}
                className="w-full bg-gradient-to-r from-[#E8C4A0] to-[#DDB892] hover:from-[#DDB892] hover:to-[#D4A574] text-[#8B6F47] font-semibold py-4 px-8 transition-all duration-200 transform hover:scale-[1.02] hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none"
                style={{ borderRadius: '10px' }}
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#8B6F47] border-t-transparent mr-3"></div>
                    <span>Soumission de vos commentaires...</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center">
                    <SparklesIcon className="h-5 w-5 mr-2" />
                    <span>Submit Feedback</span>
                  </div>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="text-center pt-8 pb-12">
              <p className="text-warmGray-500 text-sm">
                Thank you for taking the time to share your experience
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EvaluationModern;
