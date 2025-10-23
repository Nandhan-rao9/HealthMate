// src/App.js
import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Register from './authentication/Register';
import Login from './authentication/Login';
import Onboarding from './Onboarding';

function MainApp() {
  const { logout } = useAuth();
  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <nav style={{ padding: '1rem', backgroundColor: '#1e1e1e'}}>
        <Link to="/dashboard" style={{ margin: '0 1rem', color: 'white' }}>Dashboard</Link>
        <Link to="/add-meal" style={{ margin: '0 1rem', color: 'white' }}>Add Meal</Link>
        <button onClick={logout} style={{ marginLeft: '2rem' }}>Logout</button>
      </nav>
      <h1 style={{marginTop: '2rem'}}>Welcome to Your Dashboard!</h1>
      <p>This is the main application.</p>
    </div>
  );
}

// --- Placeholder for your auth pages ---
function AuthLayout() {
  return (
    <div>
      <nav style={{ padding: '1rem', backgroundColor: '#1e1e1e', textAlign: 'center' }}>
        <Link to="/login" style={{ margin: '0 1rem', color: 'white' }}>Login</Link>
        <Link to="/register" style={{ margin: '0 1rem', color: 'white' }}>Register</Link>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Login />} /> {/* Default to login */}
      </Routes>
    </div>
  );
}

// --- The Main App Component ---
function App() {
  const { user, profileComplete } = useAuth(); // <-- Get the global state

  if (!user) {
    // Not logged in? Show Login/Register pages
    return <AuthLayout />;
  }

  if (!profileComplete) {
    // Logged in, but profile incomplete? Show Onboarding
    return <Onboarding />;
  }

  // Logged in AND profile complete? Show the Main App
  return <MainApp />;
}

export default App;