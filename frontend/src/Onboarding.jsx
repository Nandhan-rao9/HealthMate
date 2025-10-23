import React, { useState } from 'react';
import { calculateUserProfile } from './utils/calculations';
import { useAuth } from './context/AuthContext'; 
import { useNavigate } from 'react-router-dom';

function Onboarding() {
  const [formData, setFormData] = useState({
    gender: 'male',
    age: '',
    weight: '', 
    height: '',
    activityLevel: 'sedentary',
    goal: 'maintain',
  });

  const [results, setResults] = useState(null);
  const { completeOnboarding } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCalculate = (e) => {
    e.preventDefault();
    const profile = calculateUserProfile(formData);
    setResults(profile);
    console.log("User Profile Data:", formData);
    console.log("Calculated Goals:", profile);
  };

  const handleSave = () => {
    completeOnboarding(results); // save profile and goals
    navigate('/dashboard'); // redirect to dashboard
  };

  return (
    <div className="onboarding-container auth-container">
      <h2>Complete Your Profile</h2>
      <p>This helps us calculate your daily nutrition goals.</p>
      
      <form className="auth-form" onSubmit={handleCalculate}>
        <label>Gender</label>
        <select name="gender" value={formData.gender} onChange={handleChange}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        
        <label>Age</label>
        <input type="number" name="age" placeholder="Your age" value={formData.age} onChange={handleChange} required />
        
        <label>Weight (kg)</label>
        <input type="number" name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={handleChange} required />
        
        <label>Height (cm)</label>
        <input type="number" name="height" placeholder="Height (cm)" value={formData.height} onChange={handleChange} required />

        <label>Activity Level</label>
        <select name="activityLevel" value={formData.activityLevel} onChange={handleChange}>
          <option value="sedentary">Sedentary</option>
          <option value="light">Light</option>
          <option value="moderate">Moderate</option>
          <option value="active">Active</option>
          <option value="very_active">Very Active</option>
        </select>
        
        <label>Your Goal</label>
        <select name="goal" value={formData.goal} onChange={handleChange}>
          <option value="lose_weight">Lose Weight</option>
          <option value="maintain">Maintain Weight</option>
          <option value="gain_weight">Gain Weight</option>
          <option value="recomp">Build Muscle & Lose Fat</option>
        </select>

        <button type="submit">Calculate My Goals</button>
      </form>
      
      {results && !results.error && (
        <div className="results-card">
          <h3>Your Daily Goals:</h3>
          <p><strong>Target Calories:</strong> {results.calorieGoal} kcal</p>
          <p><strong>Maintenance (TDEE):</strong> {results.tdee} kcal</p>
          <p><strong>Resting (BMR):</strong> {results.bmr} kcal</p>
          
          <button onClick={handleSave} style={{width: '100%', marginTop: '1rem'}}>
            Save & Continue
          </button>
        </div>
      )}
      {results && results.error && <p style={{color: 'red'}}>{results.error}</p>}
    </div>
  );
}

export default Onboarding;
