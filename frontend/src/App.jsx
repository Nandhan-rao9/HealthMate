// src/App.js
import React from 'react';
import { Routes, Route, Navigate, Outlet, useNavigate } from 'react-router-dom';
import useAuthStore from './store/useAuthStore'; 

import Register from './authentication/Register';
import Login from './authentication/Login';
import Onboarding from './Onboarding';
import Dashboard from './pages/Dashboard';
import AddMeal from './pages/AddMeal'; // Placeholder

// --- 2. Simplified Layout Component ---
function MainAppLayout() {
  const logout = useAuthStore(state => state.logout);
  return (
    <div style={{minHeight: '100vh', backgroundColor: '#121212', color: 'white'}}>
      <nav style={{ padding: '1rem', backgroundColor: '#1e1e1e', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <a href="/dashboard" style={{ margin: '0 1rem', color: '#00ccff', fontWeight: 'bold' }}>Dashboard</a>
          <a href="/add-meal" style={{ margin: '0 1rem', color: '#00ccff', fontWeight: 'bold' }}>Add Meal</a>
        </div>
        <button onClick={logout} style={{ background: '#555', border: 'none', color: 'white', padding: '0.3rem 0.8rem', cursor: 'pointer', borderRadius: '4px' }}>
          Logout
        </button>
      </nav>
      <Outlet />
    </div>
  );
}

// --- 3. Main App Logic (Fixed) ---
function App() {
  const user = useAuthStore(state => state.user);
  const profileComplete = useAuthStore(state => state.profileComplete);
  
  // State to handle the initial check of localStorage (crucial for stability)
  const [isInitialized, setIsInitialized] = React.useState(false); 
  
  // Run once on mount to simulate initialization check
  React.useEffect(() => {
      // Small timeout to allow the initial Zustand state to load from localStorage
      const timer = setTimeout(() => {
          setIsInitialized(true);
      }, 50); 
      return () => clearTimeout(timer);
  }, []);

  if (!isInitialized) return <div style={{ minHeight: '100vh', backgroundColor: '#121212', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <p>Loading...</p>
  </div>;

  return (
    <Routes>
      {/* -------------------- AUTH ROUTES -------------------- */}
      {/* If logged in, redirect to Dashboard. Else, show auth pages. */}
      <Route path="/auth/*" element={!user ? <Outlet /> : <Navigate to="/dashboard" />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="*" element={<Navigate to="login" />} />
      </Route>
      
      {/* Fallback for /login and /register without /auth prefix */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/dashboard" />} />


      {/* ------------------- ONBOARDING ROUTE ------------------ */}
      {/* Must be logged in AND NOT complete. Otherwise, go to dashboard. */}
      <Route 
        path="/onboarding" 
        element={user && !profileComplete ? <Onboarding /> : <Navigate to="/dashboard" />} 
      />

      {/* --------------------- MAIN APP ROUTES --------------------- */}
      {/* Must be logged in AND profile complete. */}
      <Route 
        path="/*" 
        element={user && profileComplete ? <MainAppLayout /> : <Navigate to={user ? "/onboarding" : "/login"} />}
      >
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="add-meal" element={<AddMeal />} />
        <Route path="*" element={<Navigate to="dashboard" />} />
      </Route>
    </Routes>
  );
}

export default App;