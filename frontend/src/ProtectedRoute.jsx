// ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { user, profileComplete } = useAuth();

  if (!user) return <Navigate to="/auth/login" />;
  if (!profileComplete) return <Navigate to="/onboarding" />;

  return children;
}