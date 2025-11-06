// src/store/useAuthStore.js
import { create } from 'zustand';

// 1. Function to safely load state from local storage
const getInitialState = () => {
    try {
        const storedUser = localStorage.getItem('user');
        const storedProfileComplete = localStorage.getItem('profileComplete');
        
        return {
            user: storedUser ? JSON.parse(storedUser) : null,
            profileComplete: storedProfileComplete === 'true',
            profileData: null, // Will be loaded later if needed
        };
    } catch (error) {
        console.error("Failed to load state from localStorage:", error);
        return { user: null, profileComplete: false, profileData: null };
    }
};

// 2. The Store Definition
const useAuthStore = create((set, get) => ({
    // Initialize state
    ...getInitialState(), 

    // Helper to sync state to localStorage on every change
    syncToLocalStorage: (state) => {
        if (state.user) {
            localStorage.setItem('user', JSON.stringify(state.user));
            localStorage.setItem('profileComplete', state.profileComplete.toString());
        } else {
            localStorage.clear(); // Clear all auth data on logout/initial state
        }
    },

    // Actions
    login: (userData, profileCompleteStatus) => {
        const newState = { 
            user: userData, 
            profileComplete: profileCompleteStatus, 
            profileData: null 
        };
        set(newState);
        get().syncToLocalStorage(newState);
    },
    
    logout: () => {
        const newState = { user: null, profileComplete: false, profileData: null };
        set(newState);
        get().syncToLocalStorage(newState);
    },
    
    completeOnboarding: (data) => {
        const newState = { profileData: data, profileComplete: true };
        set(newState);
        // Sync the updated state (must merge with current state)
        get().syncToLocalStorage({ ...get(), ...newState });
    },
}));

export default useAuthStore;