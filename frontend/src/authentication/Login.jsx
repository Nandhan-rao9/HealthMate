// src/authentication/Login.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore'; 

function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const login = useAuthStore(state => state.login);
  const navigate = useNavigate(); 

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    // --- MOCK API CALL START ---
    try {
        // Simulate fetch delay and success
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock successful login: user and token
        const mockToken = `mock-token-${username}`;
        
        // Mock profile check: assume 'testuser' is complete, others are not
        const profileCompleteStatus = username === 'testuser'; 

        // 1. Update store
        login({ username, token: mockToken }, profileCompleteStatus);

        // 2. Navigate
        if (profileCompleteStatus) {
            navigate('/dashboard'); 
        } else {
            navigate('/onboarding'); 
        }

    } catch (error) {
        console.error('Mock error:', error);
        setMessage('Error occurred during login. Try "testuser" / "123".');
    }
    // --- MOCK API CALL END ---
  };

  return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit} style={{backgroundColor: '#2e2e2e', border: '1px solid #444', color: 'white'}}>
        <h2 style={{color: '#00ccff'}}>Login</h2>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          style={{backgroundColor: '#3e3e3e', color: 'white', border: '1px solid #555'}}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          style={{backgroundColor: '#3e3e3e', color: 'white', border: '1px solid #555'}}
        />
        <button type="submit" style={{backgroundColor: '#00ccff', color: 'black'}}>Login</button>
        {message && <p style={{color: '#ff6666'}}>{message}</p>}
      </form>
      <p style={{ textAlign: 'center', marginTop: '1rem', color: '#aaa' }}>
        Don't have an account? <Link to="/register" style={{ color: '#00ccff' }}>Register</Link>      
      </p>
    </div>
  );
}

export default Login;