import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import styles from "../styles/SupervisorHomepage.module.css";
import { FaStar } from "react-icons/fa";
import api from "../api/client";

const BrowseEvents = () => {
  // these are our required states for this component
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(null);
  const [reviewDesc, setReviewDesc] = useState("");
  const [eventReviews, setEventReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);

  // this gets the email of the logged in visitor
  const email = localStorage.getItem("email");

  // this fetches events by making a call to the backend api endpoint get-all-events/
  const fetchEvents = async () => {
    try {
      const res = await api.get("/get-all-events/");
      setEvents(res.data.events);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // sets the selected event as the event itself, sets rating as 0, sets review desc as blank,
  // and also sets the modal to be open
  const handleOpenWriteReview = (event) => {
    setSelectedEvent(event);
    setRating(0);
    setReviewDesc("");
    setModalOpen(true);
  };

  // this handles submitting reviews by making a call to the backend api endpoint submit-event-review/
  const handleSubmitReview = async () => {
    try {
      await api.post("/submit-event-review/", { // these are our input params for the api call
        email,
        evid: selectedEvent.eid,
        rating,
        review_desc: reviewDesc,
      });
      alert("Review submitted!");
      setModalOpen(false);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review.");
    }
  };

  // this fetches the reviews from the api call get-event-reviews/
  const handleOpenReviews = async (event) => {
    try {
      const res = await api.get("/get-event-reviews/", {
        params: { evid: event.eid },
      });
      setSelectedEvent(event);
      setEventReviews(res.data.reviews || []);
      if (res.data.reviews?.length) { // calculates the average rating, if there exists ratings / reviews for this event
        const avg = res.data.reviews.reduce((sum, r) => sum + r.rating, 0) / res.data.reviews.length;
        setAverageRating(avg.toFixed(1));
      } else {
        setAverageRating(null);
      }
      setReviewModalOpen(true);
    } catch (err) {
      console.error("Error loading reviews:", err);
      alert("Failed to load reviews.");
    }
  };

  // this filters events based on the input text
  // it filters by eid, event name, exhibit name, and museum name
  const filteredEvents = events.filter((event) =>
    `${event.eid} ${event.name} ${event.exhibit_name} ${event.museum_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <h2>Events</h2>
        <p>Browse through the list of events and their details.</p>

        <input
          type="text"
          placeholder="Search events..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {filteredEvents.length === 0 ? (
          <p style={{ color: "white", marginTop: "1rem" }}>No events found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Exhibit</th>
                <th>Museum</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.eid}>
                  <td>{event.eid}</td>
                  <td>{event.name}</td>
                  <td>{event.start_date}</td>
                  <td>{event.end_date}</td>
                  <td>{event.exhibit_name}</td>
                  <td>{event.museum_name}</td>
                  <td>{event.location}</td>
                  <td>
                    <div className={styles.actionButtonGroup}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleOpenWriteReview(event)}
                      >
                        Write Review
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleOpenReviews(event)}
                      >
                        View Reviews
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Review: {selectedEvent.name}</h3>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  size={28}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  color={(hoverRating || rating) >= star ? "#ffc107" : "#ccc"}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>
            <textarea
              placeholder="Write your review..."
              value={reviewDesc}
              onChange={(e) => setReviewDesc(e.target.value)}
              className={styles.textarea}
            />
            <div className={styles.modalActions}>
              <button onClick={handleSubmitReview} className={styles.actionButton}>
                Submit
              </button>
              <button onClick={() => setModalOpen(false)} className={styles.secondaryButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {reviewModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Reviews for: {selectedEvent.name}</h3>
            {averageRating && <p>Average Rating: {averageRating} ⭐</p>}
            {eventReviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              <div className={styles.reviewsList}>
                {eventReviews.map((review, idx) => (
                  <div key={idx} className={styles.reviewCard}>
                    <p><strong>Email:</strong> {review.email}</p>
                    <p><strong>Username:</strong> {review.username}</p>
                    <p><strong>Rating:</strong> {review.rating} ⭐</p>
                    <p><strong>Description:</strong> {review.review_desc}</p>
                  </div>
                ))}
              </div>
            )}
            <button className={styles.cancelButton} onClick={() => setReviewModalOpen(false)}>Close</button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default BrowseEvents;