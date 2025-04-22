import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupervisorMenu from "../components/SupervisorMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

// Page for supervisors to manage museum events and their exhibit associations
const ManageEvents = () => {
  // state for events data and UI controls
  const [events, setEvents] = useState([]);
  const [exhibitOptions, setExhibitOptions] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({ evid: "", name: "", start_date: "", end_date: "", exid: "" });
  const [editData, setEditData] = useState({ evid: "", name: "", start_date: "", end_date: "", exid: "" });

  // get museum address from local storage
  const supervisorMuseumAddress = localStorage.getItem("museumAddress");
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // fetch all events for the supervisor's museum
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

  // fetch available exhibits for event association
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

  // load initial data on component mount
  useEffect(() => {
    fetchEvents();
    fetchExhibits();
  }, []);

  // handle input changes for add event form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // handle input changes for edit event form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // submit new event to API
  const handleAddEvent = async (e) => {
    e.preventDefault();
    try {
      const { name, start_date, end_date, exid } = formData;
  
      await api.post("/add-event/", {
        name,
        start_date,
        end_date,
        exid,
        address: supervisorMuseumAddress,
      });
  
      setFormData({ name: "", start_date: "", end_date: "", exid: "" });
      setShowModal(false);
      fetchEvents();
    } catch (err) {
      const msg = err.response?.data?.message || "Unknown error";
      alert("Failed to add event: " + msg);
    }
  };

  // prepare edit form with event data
  const handleOpenEdit = (event) => {
    setEditData({ ...event });
    setShowEditModal(true);
  };

  // submit updated event to API
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

  // delete event from system
  const handleDeleteEvent = async () => {
    try {
      await api.post("/delete-event/", { evid: editData.evid });
      setShowEditModal(false);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete event");
    }
  };

  // filter events based on search input across all fields
  const filteredEvents = events.filter((ev) =>
    Object.values(ev).some((val) =>
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <>
      <Header />
      <SupervisorMenu />
      
      {/* Main content container */}
      <div className={styles.main}>
        <h2>Manage Events</h2>

        {/* Search input for filtering events */}
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {/* Button to open add event modal */}
        <button
          onClick={() => {
            setShowModal(true);
            setFormData({ evid: "", name: "", start_date: "", end_date: "", exid: "" });
          }}
          className={styles.addEmployeeButton}
        >
          + Add Event
        </button>

        {/* Events table or empty state message */}
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

      {/* Add Event Modal */}
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
              <select
                name="exid"
                value={formData.exid}
                onChange={handleChange}
                required
                className={styles.selectDropdown}
              >
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

      {/* Edit Event Modal */}
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
              <select name="exid" value={editData.exid} onChange={handleEditChange}                 className={styles.selectDropdown}
              >
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