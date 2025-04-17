import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/RegisterAccount.module.css';
import api from '../api/client';

const RegisterAccount = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    middleName: '',
    lastName: '',
    yearOfBirth: ''
  });
  
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/register-visitor/', formData);
      setMessage('Account created successfully!');
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      setMessage(msg);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.box}>
        <h1 className={styles.title}>Register as a Visitor</h1>

        {message && <p className={styles.message}>{message}</p>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <label>Email</label>
          <input name="email" type="email" value={formData.email} onChange={handleChange} required />

          <label>Username</label>
          <input name="username" type="text" value={formData.username} onChange={handleChange} required />

          <label>Password</label>
          <input name="password" type="password" value={formData.password} onChange={handleChange} required />

          <label>First Name</label>
          <input name="firstName" type="text" value={formData.firstName} onChange={handleChange} required />

          <label>Middle Name</label>
          <input name="middleName" type="text" value={formData.middleName} onChange={handleChange} />

          <label>Last Name</label>
          <input name="lastName" type="text" value={formData.lastName} onChange={handleChange} required />

          <label>Year of Birth</label>
          <input name="yearOfBirth" type="number" value={formData.yearOfBirth} onChange={handleChange} required />

          <button type="submit" className={styles.registerButton}>Register</button>
        </form>

        <p className={styles.loginPrompt}>
          Already have an account? <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterAccount;
