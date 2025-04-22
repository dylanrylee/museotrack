import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styles from '../styles/LoginPage.module.css';
import api from '../api/client';

const SupervisorLogin = () => {
  // State for email, password, and error message
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Handles login form submission
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post('/login-supervisor-employee/', { email, password });
      const { role } = res.data;

      // Save login info to localStorage
      localStorage.setItem('email', email);
      localStorage.setItem('isLoggedIn', 'true');

      // Navigate based on role after ensuring localStorage is updated
      setTimeout(() => {
        if (role === 'supervisor') {
          navigate('/supervisor-homepage');
        } else if (role === 'employee') {
          navigate('/employee-homepage');
        } else {
          setError('Unrecognized role');
        }
      }, 200);
    } catch (err) {
      // Show error if login fails
      const msg = err.response?.data?.message || 'Login failed';
      setError(msg);
    }
  };

  return (
    <div className={styles.loginPageWrapper}>
      <div className={styles.loginBox}>
        <h1 className={styles.title}>MuseoTrack - Staff Login</h1>

        {/* Display error message if any */}
        {error && <p className={styles.errorMessage}>{error}</p>}

        {/* Login Form */}
        <form className={styles.form} onSubmit={handleLogin}>
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your staff email"
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

        {/* Navigation Links */}
        <p className={styles.registerPrompt}>
          Not a museum employee? <Link to="/">Login as Visitor</Link>
        </p>
        <p className={styles.registerPrompt}>
          Don’t have a supervisor account? <Link to="/supervisor-register">Register here</Link>
        </p>
      </div>
    </div>
  );
};

export default SupervisorLogin;
