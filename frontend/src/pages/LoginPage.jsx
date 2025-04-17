import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; 
import styles from '../styles/LoginPage.module.css';
import api from '../api/client'; // your Axios instance

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
  
    try {
      await api.post('/login-visitor/', { email, password }); // use your custom endpoint
      localStorage.setItem('email', email);
      localStorage.setItem('isLoggedIn', 'true');
  
      setError('');
      navigate('/visitor-homepage');
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid email or password';
      setError(msg);
    }
  };
  

  localStorage.getItem('email')
  

  return (
    <div className={styles.loginPageWrapper}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>MuseoTrack</h1>

        {error && <p className={styles.errorMessage}>{error}</p>}

        <form className={styles.form} onSubmit={handleLogin}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className={styles.signInButton}>Sign In</button>
        </form>

        <p className={styles.employeePrompt}>
          Are you a museum employee? <Link to="/employeelogin">Click here to sign in</Link>
        </p>

        <p className={styles.registerPrompt}>
          Don’t have an account? <Link to="/register-visitor">Click here to register</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
