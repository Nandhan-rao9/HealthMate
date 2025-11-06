// src/pages/Dashboard.js
import React from 'react';
import useAuthStore from '../store/useAuthStore';

function GoalsDisplay() {
  const profileData = useAuthStore(state => state.profileData);

  if (!profileData) {
    return (
      <div className="results-card" style={{ maxWidth: '400px', margin: '2rem auto', backgroundColor: '#2e2e2e', border: '1px solid #444', color: 'white' }}>
        <p>Goals not yet set. Complete onboarding.</p>
      </div>
    );
  }

  return (
    <div className="results-card" style={{ maxWidth: '400px', margin: '2rem auto', backgroundColor: '#2e2e2e', border: '1px solid #444', color: 'white' }}>
      <h3 style={{color: '#00ccff'}}>Your Daily Goals</h3>
      <p><strong>Target Calories:</strong> {profileData.calorieGoal} kcal</p>
      <p><strong>Maintenance (TDEE):</strong> {profileData.tdee} kcal</p>
      <p><strong>Resting (BMR):</strong> {profileData.bmr} kcal</p>
    </div>
  );
}

function Dashboard() {
  const user = useAuthStore(state => state.user);
  
  // Use user.username, but provide a default if user is null (shouldn't happen here)
  const username = user?.username || 'Guest'; 

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <h1 style={{ color: '#00ccff' }}>Welcome, {username}!</h1>
      <p style={{ color: '#aaa' }}>This is your main dashboard. Track your progress here.</p>
      <GoalsDisplay />
    </div>
  );
}

export default Dashboard;