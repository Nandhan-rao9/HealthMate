// src/authentication/Register.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';

function Register() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    
    const register = useAuthStore(state => state.login); // Use login for simplicity
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // --- MOCK API CALL START ---
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (username === 'fail') {
                setMessage('Registration failed for this username.');
                return;
            }

            // Mock successful registration
            const mockToken = `mock-token-${username}`;
            
            // New users are NOT profile complete
            register({ username, token: mockToken }, false);
            navigate('/onboarding'); 

        } catch (error) {
            console.error('Mock error:', error);
            setMessage('An error occurred. Try again.');
        }
        // --- MOCK API CALL END ---
    };

return (
    <div className="auth-container">
        <form className="auth-form" onSubmit={handleSubmit} style={{backgroundColor: '#2e2e2e', border: '1px solid #444', color: 'white'}}>
            <h2 style={{color: '#00ccff'}}>Register</h2>
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
        
        <button type="submit" style={{backgroundColor: '#00ccff', color: 'black'}}>Register</button>
        
        {message && <p style={{color: '#ff6666'}}>{message}</p>}
        </form>
        <p style={{textAlign: 'center', marginTop: '1rem', color: '#aaa'}}>
            Already have an account? <Link to="/login" style={{color:'#00ccff'}}>Login</Link>
        </p>
    </div>
);
}

export default Register;