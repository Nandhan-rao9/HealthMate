import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Is user logged in? (null = no)
  const [profileComplete, setProfileComplete] = useState(false); // Has user onboarded?


  const login = (userData) => {
    setUser(userData);
    setProfileComplete(false); 
  };

  const register = (userData) => {
    setUser(userData);
    setProfileComplete(false); // New users always need onboarding
  };
  
  const completeOnboarding = () => {
    setProfileComplete(true);
  };

  const logout = () => {
    setUser(null);
    setProfileComplete(false);
  };

  const value = {
    user,
    profileComplete,
    login,
    register,
    completeOnboarding,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}