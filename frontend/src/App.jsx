import React from 'react';
import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import Register from './authentication/Register';
import Login from './authentication/Login';
import Onboarding from './Onboarding';
import Dashboard from './pages/Dashboard';
import AddMeal from './pages/AddMeal';

function MainAppLayout() {
  const { logout } = useAuth();
  return (
    <div>
      <nav style={{ padding: '1rem', backgroundColor: '#1e1e1e', borderBottom: '1px solid #333' }}>
        <a href="/dashboard" style={{ margin: '0 1rem', color: 'white', fontWeight: 'bold' }}>Dashboard</a>
        <a href="/add-meal" style={{ margin: '0 1rem', color: 'white', fontWeight: 'bold' }}>Add Meal</a>
        <button onClick={logout} style={{ marginLeft: '2rem', background: 'none', border: '1px solid #555', color: 'white', padding: '0.3rem 0.8rem', cursor: 'pointer' }}>
          Logout
        </button>
      </nav>
      <Outlet />
    </div>
  );
}

function AuthLayout() {
  return (
    <div>
      <nav style={{ padding: '1rem', backgroundColor: '#1e1e1e', textAlign: 'center' }}>
        <a href="/login" style={{ margin: '0 1rem', color: 'white' }}>Login</a>
        <a href="/register" style={{ margin: '0 1rem', color: 'white' }}>Register</a>
      </nav>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
}

function App() {
  const { user, profileComplete } = useAuth();

  if (user === null) return <p>Loading...</p>; // prevent blank screen

  return (
    <Routes>
      {/* Main App Routes */}
      <Route path="/*" element={user && profileComplete ? <MainAppLayout /> : <Navigate to={user ? "/onboarding" : "/auth/login"} />}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="add-meal" element={<AddMeal />} />
        <Route path="*" element={<Navigate to="dashboard" />} />
      </Route>

      {/* Onboarding */}
      <Route path="/onboarding" element={user && !profileComplete ? <Onboarding /> : <Navigate to="/dashboard" />} />

      {/* Auth */}
      <Route path="/auth/*" element={!user ? <AuthLayout /> : <Navigate to="/dashboard" />} />
    </Routes>
  );
}

export default App;
