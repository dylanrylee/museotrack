import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupervisorMenu from "../components/SupervisorMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

const ManageEvents = () => {
  const [events, setEvents] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ evid: "", name: "", start_date: "", end_date: "", exid: "" });
  const [editData, setEditData] = useState({ evid: "", name: "", start_date: "", end_date: "", exid: "" });

  const supervisorMuseumAddress = localStorage.getItem("museumAddress");
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

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

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      await api.post("/add-event/", {
        ...formData,
        address: supervisorMuseumAddress,
      });
      setFormData({ evid: "", name: "", start_date: "", end_date: "", exid: "" });
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

  const handleDeleteEvent = async () => {
    try {
      await api.post("/delete-event/", { evid: editData.evid });
      setShowEditModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  const filteredEvents = events.filter((ev) =>
    Object.values(ev).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
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
            setFormData({ evid: "", name: "", start_date: "", end_date: "", exid: "" });
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
                    <button
                      className={styles.editButton}
                      onClick={() => handleOpenEdit(ev)}
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No events found.</p>
        )}
      </div>

      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Add Event</h2>
            <form onSubmit={handleAddEvent}>
              <label>Event ID:</label>
              <input name="evid" value={formData.evid} onChange={handleChange} required />
              <label>Name:</label>
              <input name="name" value={formData.name} onChange={handleChange} required />
              <label>Start Date:</label>
              <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required min={today} />
              <label>End Date:</label>
              <input type="date" name="end_date" value={formData.end_date} onChange={handleChange} required min={today} />
              <label>Exhibit ID:</label>
              <input name="exid" value={formData.exid} onChange={handleChange} required />
              <button type="submit" className={styles.registerButton}>Submit</button>
              <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton}>Cancel</button>
            </form>
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
              <label>Exhibit ID:</label>
              <input name="exid" value={editData.exid} onChange={handleEditChange} />
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
