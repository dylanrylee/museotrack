import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import styles from "../styles/Pages.module.css";
import api from "../api/client";

const WriteEventReview = () => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const res = await api.get("/get-events/");
        setEvents(res.data.events);
      } catch (err) {
        console.error("Error fetching events:", err);
        setMessage("Failed to load events");
      }
    };

    fetchEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("email");

    try {
      await api.post("/add-event-review/", {
        email: email,
        event_id: selectedEvent,
        rating: rating,
        review_text: reviewText,
      });
      setMessage("Review submitted successfully!");
      setReviewText("");
      setRating(5);
      setSelectedEvent("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to submit review");
    }
  };

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <h2>Write Event Review</h2>
        <p>Share your experience about an event.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label>Select Event:</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              required
              className={styles.searchInput}
            >
              <option value="">Choose an event...</option>
              {events.map((event) => (
                <option key={event.evid} value={event.evid}>
                  {event.name} (ID: {event.evid})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Rating (1-5):</label>
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              required
              className={styles.searchInput}
            />
          </div>

          <div>
            <label>Review:</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
              className={styles.textarea}
              rows="4"
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            Submit Review
          </button>

          {message && (
            <p style={{ color: message.includes("success") ? "green" : "red", marginTop: "1rem" }}>
              {message}
            </p>
          )}
        </form>
      </div>

      <Footer />
    </>
  );
};

export default WriteEventReview; 