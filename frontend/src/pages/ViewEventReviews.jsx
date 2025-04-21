import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import styles from "../styles/Pages.module.css";
import api from "../api/client";

const ViewEventReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEvent, setSelectedEvent] = useState(null);

  // Fetch all events
  const fetchEvents = async () => {
    try {
      const res = await api.get("/get-events/");
      setEvents(res.data.events);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  const fetchReviews = async (eventId) => {
    try {
      const res = await api.get("/get-event-reviews/", {
        params: { event_id: eventId },
      });
      setReviews(res.data.reviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (selectedEvent) {
      fetchReviews(selectedEvent);
    }
  }, [selectedEvent]);

  const filteredReviews = reviews.filter((review) =>
    `${review.review_text} ${review.rating}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <h2>Event Reviews</h2>
        <p>View reviews for specific events.</p>

        <select
          value={selectedEvent || ""}
          onChange={(e) => setSelectedEvent(e.target.value)}
          className={styles.searchInput}
        >
          <option value="">Select an event...</option>
          {events.map((event) => (
            <option key={event.evid} value={event.evid}>
              {event.name} (ID: {event.evid})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search reviews..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {filteredReviews.length === 0 ? (
          <p style={{ color: "white", marginTop: "1rem" }}>No reviews found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Review Text</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.review_id}>
                  <td>{review.visitor_name}</td>
                  <td>{review.rating}</td>
                  <td>{review.review_text}</td>
                  <td>{new Date(review.review_date).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Footer />
    </>
  );
};

export default ViewEventReviews; 