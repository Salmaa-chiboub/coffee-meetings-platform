import React from 'react';
import { useParams } from 'react-router-dom';
import EvaluationModern from '../../pages/EvaluationModern';

// Wrapper component that doesn't use auth context
const PublicEvaluation = () => {
  const { token } = useParams();
  
  console.log('🔍 DEBUG: PublicEvaluation wrapper loaded with token:', token);
  
  // Render the evaluation page directly without any auth checks
  return <EvaluationModern />;
};

export default PublicEvaluation;
