import React, {useState,useEffect} from 'react';
import './auth.css'
import {Link} from 'react-router-dom';
import { useAuth } from '../context/AuthContext'; 

function Login(){
    const [username, setUsername]=useState('');
    const [password, setPassword]=useState('');
    const [message, setMessage]=useState('');

    const {login} = useAuth();

    const handleSubmit = async(e) =>{
        e.preventDefault();
        setMessage('');

        try {
            const response = await fetch('http://localhost:5000/login',{
                method: 'POST',
                headers:{
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username:username,
                    password: password,
                }),
            });

            const data= await response.json();

            if(response.ok){
                login({username: username,token: data.token});


            } else {
                setMessage(data.error);
            }
        } catch(error) {
            console.log('error occured');
            setMessage('error occ');
        }
    };

    return (
    <div className="auth-container">
      <form className="auth-form" onSubmit={handleSubmit}>
        <h2>Login</h2>
        
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit">Login</button>
        
        {message && <p>{message}</p>}
      </form>
      <p style={{textAlign: 'center',marginTop: '1rem'}}>
        Dont have an account ? <Link to="/register" style={{color: '#007bff'}}>Register</Link>      
      </p>
    </div>
  );
}

export default Login;