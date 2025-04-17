import React, { useEffect, useState } from 'react';
import styles from '../styles/Pages.module.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Menu from '../components/Menu';
import api from '../api/client';

const VisitorHomepage = () => {
  const [username, setUsername] = useState('');
  const [museums, setMuseums] = useState([]);
  const [error, setError] = useState('');

  const email = localStorage.getItem('email'); // 🔑 get email

  useEffect(() => {
    console.log("📧 Email from localStorage:", email); // Debug line

    if (!email) {
      setError('Email not provided.');
      return;
    }

    const fetchVisitorInfo = async () => {
      try {
        const res = await api.get('/browse-visited-museums/', {
          params: { email },
        });

        setUsername(res.data.username);
        setMuseums(res.data.visitedMuseums);
      } catch (err) {
        console.error('Error fetching visitor homepage:', err);
        setError(err.response?.data?.message || 'Failed to load visitor data.');
      }
    };

    fetchVisitorInfo();
  }, [email]);

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        {error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <>
            <div>
              <p>Welcome, <strong>{username}</strong></p>
              <p>Email: <strong>{email}</strong></p>
            </div>

            <h2>Visited Museums:</h2>
            {museums.length > 0 ? (
              <ul>
                {museums.map((museum, index) => (
                  <li key={index}>
                    <strong>{museum.name}</strong> — {museum.address}
                  </li>
                ))}
              </ul>
            ) : (
              <p>You haven’t visited any museums yet.</p>
            )}
          </>
        )}
      </div>

      <Footer />
    </>
  );
};

export default VisitorHomepage;
