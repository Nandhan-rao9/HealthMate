import React from 'react';
import { useAuth } from '../context/AuthContext';

function GoalsDisplay() {
  const { profileData } = useAuth();

  if (!profileData) {
    return (
      <div className="results-card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
        <p>Loading user profile...</p>
      </div>
    );
  }

  return (
    <div className="results-card" style={{ maxWidth: '400px', margin: '2rem auto' }}>
      <h3>Your Daily Goals</h3>
      <p><strong>Target Calories:</strong> {profileData.calorieGoal} kcal</p>
      <p><strong>Maintenance (TDEE):</strong> {profileData.tdee} kcal</p>
      <p><strong>Resting (BMR):</strong> {profileData.bmr} kcal</p>
    </div>
  );
}

function Dashboard() {
  const { user } = useAuth();

  if (!user) return <p>Loading user info...</p>;

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: 'white' }}>Welcome, {user.username}!</h1>
      <p style={{ color: '#aaa' }}>This is your main dashboard. You can track your daily progress here.</p>
      <GoalsDisplay />
    </div>
  );
}

export default Dashboard;