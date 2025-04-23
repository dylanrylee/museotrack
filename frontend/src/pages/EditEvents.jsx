import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EmployeeMenu from "../components/EmployeeMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

const EditEvents = () => {
  // our states for this component
  const [events, setEvents] = useState([]);
  const [exhibitOptions, setExhibitOptions] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventReviews, setEventReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [editData, setEditData] = useState({ evid: "", name: "", start_date: "", end_date: "", exid: "" });
  const email = localStorage.getItem("email");
  const supervisorMuseumAddress = localStorage.getItem("museumAddress");
  const today = new Date().toISOString().split("T")[0];

  // fetches events by making an api endpoint backend call to get-events/
  const fetchEvents = async () => {
    try {
      const res = await api.get("/get-events/", {
        params: { address: supervisorMuseumAddress },
      });
      setEvents(res.data.events);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  // fetches exhibits by making a call to the backend endpoint get-exhibits/
  const fetchExhibits = async () => {
    try {
      const res = await api.get("/get-exhibits/", {
        params: { address: supervisorMuseumAddress }, // input params for the backend api call
      });
      setExhibitOptions(res.data.exhibits);
    } catch (err) {
      console.error("Failed to fetch exhibits:", err);
    }
  };

  // fetches event reviews by call the backend api get-event-reviews/
  const fetchEventReviews = async (event) => {
    try {
      const res = await api.get("/get-event-reviews/", {
        params: { evid: event.evid },
      });
      setSelectedEvent(event);
      setEventReviews(res.data.reviews || []);
      if (res.data.reviews?.length) {
        const avg = // calculates the average rating if there exists rating / reviews for this event
          res.data.reviews.reduce((sum, r) => sum + r.rating, 0) /
          res.data.reviews.length;
        setAverageRating(avg.toFixed(1));
      } else {
        setAverageRating(null);
      }
      setShowReviewsModal(true);
    } catch (err) {
      console.error("Error fetching event reviews:", err);
      alert("Failed to load reviews.");
    }
  };

  useEffect(() => {
    fetchEvents();
    fetchExhibits();
  }, []);

  // this handles the changes of the edits, and sets the new data as such
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // sets edit data of the event, and shows the edit modal
  const handleOpenEdit = (event) => {
    setEditData({ ...event });
    setShowEditModal(true);
  };

  // calls the backend endpoints update-event/ and record-edit-event/
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post("/update-event/", editData);
      await api.post("/record-edit-event/", { // input params for this api call
        eemail: email,
        evid: editData.evid,
      });
      setShowEditModal(false); // turns off the modal
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update event");
    }
  };

  // filters the events
  const filteredEvents = events.filter((ev) =>
    Object.values(ev).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Header />
      <EmployeeMenu />
      <div className={styles.main}>
        <h2>Edit Events</h2>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {filteredEvents.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Event ID</th>
                <th>Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Exhibit</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((ev) => (
                <tr key={ev.evid}>
                  <td>{ev.evid}</td>
                  <td>{ev.name}</td>
                  <td>{ev.start_date}</td>
                  <td>{ev.end_date}</td>
                  <td>{ev.exhibit_name}</td>
                  <td>
                    <div className={styles.actionButtonGroup}>
                      <button className={styles.actionButton} onClick={() => handleOpenEdit(ev)}>
                        ✏️ Edit
                      </button>
                      <button className={styles.actionButton} onClick={() => fetchEventReviews(ev)}>
                        👁 View Reviews
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No events found.</p>
        )}
      </div>

      {showReviewsModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h3>Reviews for: {selectedEvent.name}</h3>
            {averageRating && <p>⭐ Average Rating: {averageRating}</p>}
            {eventReviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              <div className={styles.reviewsList}>
                {eventReviews.map((review, idx) => (
                  <div key={idx} className={styles.reviewCard}>
                    <p><strong>Email:</strong> {review.email}</p>
                    <p><strong>Username:</strong> {review.username}</p>
                    <p><strong>Rating:</strong> {review.rating}</p>
                    <p><strong>Description:</strong> {review.review_desc}</p>
                  </div>
                ))}
              </div>
            )}
            <button className={styles.cancelButton} onClick={() => setShowReviewsModal(false)}>Close</button>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Edit Event</h2>
            <form onSubmit={handleUpdateEvent}>
              <label>Name:</label>
              <input name="name" value={editData.name} onChange={handleEditChange} />
              <label>Start Date:</label>
              <input type="date" name="start_date" value={editData.start_date} onChange={handleEditChange} min={today} />
              <label>End Date:</label>
              <input type="date" name="end_date" value={editData.end_date} onChange={handleEditChange} min={today} />
              <label>Choose Exhibit:</label>
              <select name="exid" value={editData.exid} onChange={handleEditChange} className={styles.selectDropdown}>
                <option value="">-- Select an Exhibit --</option>
                {exhibitOptions.map((ex) => (
                  <option key={ex.exid} value={ex.exid}>
                    {ex.name} (ID: {ex.exid})
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.registerButton}>Submit Changes</button>
              <button type="button" onClick={() => setShowEditModal(false)} className={styles.cancelButton}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default EditEvents;
