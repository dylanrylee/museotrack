import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/SupervisorHomepage.module.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import SupervisorMenu from '../components/SupervisorMenu';
import api from '../api/client';

const SupervisorHomepage = () => {
  const [username, setUsername] = useState('');
  const [museum, setMuseum] = useState('');
  const [museumAddress, setMuseumAddress] = useState('');
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const email = localStorage.getItem('email');

  useEffect(() => {
    if (!email) {
      setError('Email not provided.');
      return;
    }

    const fetchSupervisorData = async () => {
      try {
        const [infoRes, employeesRes] = await Promise.all([
          api.get('/get-supervisor-info/', { params: { email } }),
          api.get('/get-supervisor-employees/', { params: { email } }),
        ]);

        setUsername(infoRes.data.username);
        setMuseum(infoRes.data.museum);
        setMuseumAddress(infoRes.data.museumAddress);
        setEmployees(employeesRes.data.employees);
      } catch (err) {
        console.error('Error loading supervisor data:', err);
        setError(err.response?.data?.message || 'Failed to load supervisor data.');
      }
    };

    fetchSupervisorData();
  }, [email]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <>
      <Header />
      <SupervisorMenu />

      <div className={styles.main}>
        {error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <div>
            <p>Welcome, <strong>{username}</strong></p>
            <p>Email: <strong>{email}</strong></p>
            <p>Museum: <strong>{museum}</strong></p>
            <p>Address: <strong>{museumAddress}</strong></p>

            <h3>Employees Under Your Supervision:</h3>
            {employees.length > 0 ? (
              <ul>
                {employees.map((emp, index) => (
                  <li key={index}>
                    <strong>{emp.username}</strong> — {emp.email}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No employees found.</p>
            )}

            <button onClick={handleLogout} className={styles.signOutButton}>
              Logout
            </button>
          </div>
        )}
      </div>

      <Footer />
    </>
  );
};

export default SupervisorHomepage;
