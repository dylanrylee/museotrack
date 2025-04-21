import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from '../styles/Pages.module.css';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Menu from '../components/Menu';
import api from '../api/client';

const VisitorHomepage = () => {
  const [username, setUsername] = useState('');
  const [museums, setMuseums] = useState(null); // null = fetch failed
  const [artifactReviews, setArtifactReviews] = useState(null);
  const [eventReviews, setEventReviews] = useState(null);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const email = localStorage.getItem('email');

  useEffect(() => {
    if (!email) {
      setError('Email not provided.');
      return;
    }

    const fetchVisitorInfo = async () => {
      try {
        const museumsRes = await api.get('/browse-visited-museums/', { params: { email } });
        setUsername(museumsRes.data.username || '');
        setMuseums(museumsRes.data.visitedMuseums || []);
      } catch (err) {
        console.error('Error fetching museums:', err);
        setMuseums(null);
      }

      try {
        const artifactReviewsRes = await api.get('/get-visitor-artifact-reviews/', { params: { email } });
        setArtifactReviews(artifactReviewsRes.data.reviews || []);
      } catch (err) {
        console.error('Error fetching artifact reviews:', err);
        setArtifactReviews(null);
      }

      try {
        const eventReviewsRes = await api.get('/get-visitor-event-reviews/', { params: { email } });
        setEventReviews(eventReviewsRes.data.reviews || []);
      } catch (err) {
        console.error('Error fetching event reviews:', err);
        setEventReviews(null);
      }
    };

    fetchVisitorInfo();
  }, [email]);

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        {error ? (
          <p style={{ color: 'red' }}>{error}</p>
        ) : (
          <>
            <div className={styles.welcomeSection}>
              <p>Welcome, <strong>{username}</strong></p>
              <p>Email: <strong>{email}</strong></p>
              <button onClick={handleLogout} className={styles.signOutButton}>
                Logout
              </button>
            </div>

            {/* Museums */}
            <div className={styles.section}>
              <h2>Museums You've Visited</h2>
              {museums === null ? (
                <p>N/A</p>
              ) : museums.length === 0 ? (
                <p>None</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Address</th>
                      <th>Phone</th>
                    </tr>
                  </thead>
                  <tbody>
                    {museums.map((museum) => (
                      <tr key={museum.address}>
                        <td>{museum.name}</td>
                        <td>{museum.address}</td>
                        <td>{museum.phone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Artifact Reviews */}
            <div className={styles.section}>
              <h2>Your Artifact Reviews</h2>
              {artifactReviews === null ? (
                <p>N/A</p>
              ) : artifactReviews.length === 0 ? (
                <p>None</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Artifact</th>
                      <th>Rating</th>
                      <th>Review</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artifactReviews.map((review) => (
                      <tr key={review.review_id}>
                        <td>{review.artifact_name}</td>
                        <td>{review.rating}</td>
                        <td>{review.review_text}</td>
                        <td>{review.review_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Event Reviews */}
            <div className={styles.section}>
              <h2>Your Event Reviews</h2>
              {eventReviews === null ? (
                <p>N/A</p>
              ) : eventReviews.length === 0 ? (
                <p>None</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Rating</th>
                      <th>Review</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventReviews.map((review) => (
                      <tr key={review.review_id}>
                        <td>{review.event_name}</td>
                        <td>{review.rating}</td>
                        <td>{review.review_text}</td>
                        <td>{review.review_date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
};

export default VisitorHomepage;
