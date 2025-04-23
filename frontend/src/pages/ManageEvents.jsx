import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupervisorMenu from "../components/SupervisorMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

const ManageEvents = () => {
  // these are our required states for this component
  const [events, setEvents] = useState([]);
  const [exhibitOptions, setExhibitOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [eventReviews, setEventReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ name: "", start_date: "", end_date: "", exid: "" });
  const [editData, setEditData] = useState({ evid: "", name: "", start_date: "", end_date: "", exid: "" });

  // this is the saved museum address from the local storage
  const supervisorMuseumAddress = localStorage.getItem("museumAddress");
  const today = new Date().toISOString().split("T")[0];

  // makes a backend endpoint api call to get-events/ to fetch data
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

  // this fetches exhivits data by making an api call to get-exhibits/
  const fetchExhibits = async () => {
    try {
      const res = await api.get("/get-exhibits/", {
        params: { address: supervisorMuseumAddress },
      });
      setExhibitOptions(res.data.exhibits);
    } catch (err) {
      console.error("Failed to fetch exhibits:", err);
    }
  };

  // this fetches event reviews by making an api call to get-event-reviews/
  const fetchEventReviews = async (event) => {
    try {
      const res = await api.get("/get-event-reviews/", {
        params: { evid: event.evid },
      });
      setSelectedEvent(event);
      setEventReviews(res.data.reviews || []);
      if (res.data.reviews?.length) {
        const avg = // calculates average rating of event if there exists ratings / reviews for the selected event
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // calls the api endpoint add-event to insert event data into the MySQL database
  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const { name, start_date, end_date, exid } = formData;
      await api.post("/add-event/", { name, start_date, end_date, exid, address: supervisorMuseumAddress });
      setFormData({ name: "", start_date: "", end_date: "", exid: "" });
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      const msg = err.response?.data?.message || "Unknown error";
      alert("Failed to add event: " + msg);
    }
  };

  const handleOpenEdit = (event) => {
    setEditData({ ...event });
    setShowEditModal(true);
  };

  // this calls the backend api update-event/ to update the data
  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post("/update-event/", editData);
      setShowEditModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update event");
    }
  };

  // calls the backend endpoint api delete-event/ to delete data
  const handleDeleteEvent = async () => {
    try {
      await api.post("/delete-event/", { evid: editData.evid });
      setShowEditModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  // filters the events
  const filteredEvents = events.filter((ev) =>
    Object.values(ev).some((val) => String(val).toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <>
      <Header />
      <SupervisorMenu />
      <div className={styles.main}>
        <h2>Manage Events</h2>
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        <button
          onClick={() => {
            setShowModal(true);
            setFormData({ name: "", start_date: "", end_date: "", exid: "" });
          }}
          className={styles.addEmployeeButton}
        >
          + Add Event
        </button>

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

      {/* View Reviews Modal */}
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

      {/* Add Modal */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Add Event</h2>
            <form onSubmit={handleAddEvent}>
              <label>Name:</label>
              <input name="name" value={formData.name} onChange={handleChange} required />
              <label>Start Date:</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required min={today} />
              <label>End Date:</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required min={today} />
              <label>Exhibit:</label>
              <select name="exid" value={formData.exid} onChange={handleChange} required className={styles.selectDropdown}>
                <option value="">Select Exhibit</option>
                {exhibitOptions.map((ex) => (
                  <option key={ex.exid} value={ex.exid}>
                    {ex.name} (ID: {ex.exid})
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.registerButton}>Submit</button>
              <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
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
              <button type="button" onClick={handleDeleteEvent} className={styles.deleteButton}>Delete Event</button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ManageEvents;
