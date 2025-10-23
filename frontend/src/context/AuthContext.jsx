import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [profileData, setProfileData] = useState(null);

  const login = useCallback((userData) => {
    setUser(userData);
    setProfileComplete(false);
    setProfileData(null);
  }, []);

  const register = useCallback((userData) => {
    setUser(userData);
    setProfileComplete(false);
    setProfileData(null);
  }, []);

  const completeOnboarding = useCallback((data) => {
    setProfileData(data);
    setProfileComplete(true);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setProfileComplete(false);
    setProfileData(null);
  }, []);

  const value = useMemo(() => ({
    user,
    profileComplete,
    profileData,
    login,
    register,
    completeOnboarding,
    logout,
  }), [user, profileComplete, profileData, login, register, completeOnboarding, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}