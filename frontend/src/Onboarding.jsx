// src/Onboarding.js
import React, { useState } from 'react';
import { calculateUserProfile } from './utils/calculations';
import { useAuth } from './context/AuthContext';


function Onboarding() {
  const [formData, setFormData] = useState({
    gender: 'male',
    age: '',
    weight: '', // We'll assume kg for simplicity
    height: '', // We'll assume cm for simplicity
    activityLevel: 'sedentary',
    goal: 'maintain',
  });

  const {sompleteOnboarding} =useAuth();

  const [results, setResults] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const profile = calculateUserProfile(formData);
    setResults(profile);
    
    // FOR LATER: This is where we will save 'profile' and 'formData' to Firestore
    console.log("User Profile Data:", formData);
    console.log("Calculated Goals:", profile);
  };

  const handleSave = () => {
    // 1. In a real app, save 'formData' and 'results' to your database (Firestore/MongoDB)
    console.log("Saving to database:", {
      userProfile: formData,
      goals: results
    });

    // 2. Tell the global state that onboarding is done
    completeOnboarding();
};

  return (
    <div className="onboarding-container auth-container">
      <h2>Complete Your Profile</h2>
      <p>This helps us calculate your daily nutrition goals.</p>
      
      <form className="auth-form" onSubmit={handleSubmit}>
        <label>Gender</label>
        <select name="gender" value={formData.gender} onChange={handleChange}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
        
        <label>Age</label>
        <input type="number" name="age" placeholder="Your age" value={formData.age} onChange={handleChange} required />
        
        <label>Weight (in kg)</label>
        <input type="number" name="weight" placeholder="Weight (kg)" value={formData.weight} onChange={handleChange} required />
        
        <label>Height (in cm)</label>
        <input type="number" name="height" placeholder="Height (cm)" value={formData.height} onChange={handleChange} required />

        <label>Activity Level</label>
        <select name="activityLevel" value={formData.activityLevel} onChange={handleChange}>
          <option value="sedentary">Sedentary (little/no exercise)</option>
          <option value="light">Light (1-3 days/week)</option>
          <option value="moderate">Moderate (3-5 days/week)</option>
          <option value="active">Active (6-7 days/week)</option>
          <option value="very_active">Very Active (hard exercise/job)</option>
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
      
      {/* Show the results after calculation */}
      {results && !results.error && (
        <div className="results-card">
          <h3>Your Daily Goals:</h3>
          <p><strong>Target Calories:</strong> {results.calorieGoal} kcal</p>
          <p><strong>Maintenance (TDEE):</strong> {results.tdee} kcal</p>
          <p><strong>Resting (BMR):</strong> {results.bmr} kcal</p>
          <button style={{width: '100%', marginTop: '1rem'}}>
            Save & Continue
          </button>
        </div>
      )}
      {results && results.error && (
        <p style={{color: 'red'}}>{results.error}</p>
      )}
    </div>
  );
}

export default Onboarding;