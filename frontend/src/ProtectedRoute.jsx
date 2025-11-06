// src/ProtectedRoute.jsx

import React from 'react';
import { Navigate } from 'react-router-dom';
// import { useAuth } from './context/AuthContext'; // <-- REMOVE
import useAuthStore from './store/useAuthStore'; // <-- NEW IMPORT

export default function ProtectedRoute({ children }) {
  // Select user and profileComplete state
  const user = useAuthStore(state => state.user); // <-- ZUSTAND
  const profileComplete = useAuthStore(state => state.profileComplete); // <-- ZUSTAND

  if (!user) return <Navigate to="/auth/login" />;
  if (!profileComplete) return <Navigate to="/onboarding" />;

  return children;
}