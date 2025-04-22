import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styles from '../styles/RegisterAccount.module.css';
import api from '../api/client';

const SupervisorRegister = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    username: '',
    yearOfBirth: '',
    museumName: '',
    museumAddress: '',
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  // Handle form field changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/register-supervisor/', formData);
      setMessage('Account created successfully!');
      setTimeout(() => navigate('/supervisor-login'), 1500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setMessage(msg);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.box}>
        <h1 className={styles.title}>Register as a Supervisor</h1>

        {/* Display success or error message */}
        {message && <p className={styles.message}>{message}</p>}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className={styles.form}>
          <label>Email</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} required />

          <label>Password</label>
          <input name="password" type="password" value={formData.password} onChange={handleChange} required />

          <label>First Name</label>
          <input name="firstName" type="text" value={formData.firstName} onChange={handleChange} required />

          <label>Middle Name</label>
          <input name="middleName" type="text" value={formData.middleName} onChange={handleChange} />

          <label>Last Name</label>
          <input name="lastName" type="text" value={formData.lastName} onChange={handleChange} required />

          <label>Username</label>
          <input name="username" type="text" value={formData.username} onChange={handleChange} required />

          <label>Year of Birth</label>
          <input name="yearOfBirth" type="number" value={formData.yearOfBirth} onChange={handleChange} required />

          <label>Museum Name</label>
          <input name="museumName" type="text" value={formData.museumName} onChange={handleChange} required />

          <label>Museum Address</label>
          <input name="museumAddress" type="text" value={formData.museumAddress} onChange={handleChange} required />

          <button type="submit" className={styles.registerButton}>Register</button>
        </form>

        {/* Link to supervisor login page */}
        <p className={styles.registerPrompt}>
          Already have a supervisor account? <Link to="/supervisor-login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default SupervisorRegister;
