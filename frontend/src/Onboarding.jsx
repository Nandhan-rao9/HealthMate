// src/Onboarding.js
import React, { useState } from 'react';
import useAuthStore from './store/useAuthStore'; 
import { useNavigate } from 'react-router-dom';

// Simple Mock Calculation Utility
const calculateUserProfile = (formData) => {
    const weight = parseFloat(formData.weight);
    if (isNaN(weight) || weight <= 0) return { error: "Invalid weight." };

    // Simple placeholder calculation (BMR based on weight * factor)
    const baseBMR = weight * (formData.gender === 'male' ? 24 : 22);
    const tdee = Math.round(baseBMR * 1.5); 
    
    let goalFactor = 1.0;
    if (formData.goal === 'lose_weight') goalFactor = 0.8;
    if (formData.goal === 'gain_weight') goalFactor = 1.2;

    return {
        bmr: Math.round(baseBMR),
        tdee: tdee,
        calorieGoal: Math.round(tdee * goalFactor),
    };
};

function Onboarding() {
  const [formData, setFormData] = useState({
    gender: 'male',
    age: '30',
    weight: '70', 
    height: '175',
    activityLevel: 'moderate',
    goal: 'maintain',
  });

  const [results, setResults] = useState(null);
  const completeOnboarding = useAuthStore(state => state.completeOnboarding);
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    const profile = calculateUserProfile(formData);
    setResults(profile);
  };

  const handleSave = async () => {
    // --- MOCK API CALL START ---
    // In a real app, send formData and calculated results to Flask here
    // await fetch('http://localhost:5000/profile/onboarding', { method: 'POST', ... });
    await new Promise(resolve => setTimeout(resolve, 500)); 
    // --- MOCK API CALL END ---
    
    completeOnboarding(results); // save profile and goals to store
    navigate('/dashboard'); // redirect to dashboard
  };
  
  if (!user) {
      return <Navigate to="/auth/login" />;
  }

  return (
    <div className="onboarding-container auth-container">
      <h2 style={{color: '#00ccff'}}>Complete Your Profile</h2>
      <p style={{color: '#aaa'}}>This helps us calculate your daily nutrition goals.</p>
      
      <form className="auth-form" onSubmit={handleCalculate} style={{backgroundColor: '#2e2e2e', border: '1px solid #444'}}>
        {/* Simplified Form Inputs */}
        <label style={{color: 'white'}}>Weight (kg)</label>
        <input type="number" name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={handleChange} required style={{backgroundColor: '#3e3e3e', color: 'white', border: '1px solid #555'}}/>
        
        <label style={{color: 'white'}}>Your Goal</label>
        <select name="goal" value={formData.goal} onChange={handleChange} style={{backgroundColor: '#3e3e3e', color: 'white', border: '1px solid #555'}}>
          <option value="lose_weight">Lose Weight</option>
          <option value="maintain">Maintain Weight</option>
          <option value="gain_weight">Gain Weight</option>
        </select>

        <button type="submit" style={{backgroundColor: '#00ccff', color: 'black'}}>Calculate My Goals</button>
      </form>
      
      {results && !results.error && (
        <div className="results-card" style={{marginTop: '1rem', backgroundColor: '#3a3a3a', border: '1px solid #555', color: 'white'}}>
          <h3 style={{color: '#00ccff'}}>Goals:</h3>
          <p>Target Calories: {results.calorieGoal} kcal</p>
          <button onClick={handleSave} style={{width: '100%', marginTop: '1rem', backgroundColor: '#00ccff', color: 'black'}}>
            Save & Continue
          </button>
        </div>
      )}
      {results && results.error && <p style={{color: '#ff6666'}}>{results.error}</p>}
    </div>
  );
}

export default Onboarding;