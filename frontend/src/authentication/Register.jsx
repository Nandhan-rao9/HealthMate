import React, { useState } from 'react';
import './auth.css';
import {Link} from 'react-router-dom'
import { useAuth } from '../context/AuthContext';

function Register() {
    const [username, setUsername] =useState('');
    const [password, setPassword] =useState('');
    const [message, setMessage] =useState('');
    const {register} = useAuth();

    const handleSubmit=async(e) => {
        e.preventDefault();

        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/register', {
                method: 'POST',
                headers: {
                    'Content-Type':'application/json',
                },
                body: JSON.stringify({
                    username:username,
                    password:password,
                }),
            });

            const data=await response.json();

            if(response.ok){
                register({username:username, token:data.token});
            } else {
                setMessage(data.error);
            }
        } catch(error) {
            console.error('Error during reg:',error);
            setMessage('An error occured. try again');
        }
    };

return (
    <div className="auth-container">
        <form className="auth-form" onSubmit={handleSubmit}>
            <h2>Register</h2>

            <input 
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />

            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
        
        <button type="submit">Register</button>
        
        {message && <p>{message}</p>}
        </form>
        <p style={{textAlign: 'center', marginTop: '1rem'}}>
            Already have an account? <Link to="/login" style={{color:'007bbf'}}>Login</Link>
        </p>
    </div>
);
}

export default Register;