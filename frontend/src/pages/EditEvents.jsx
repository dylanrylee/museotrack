import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EmployeeMenu from "../components/EmployeeMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

const EditEvents = () => {
  // Event and exhibit states
  const [events, setEvents] = useState([]);
  const [exhibitOptions, setExhibitOptions] = useState([]);

  // States for Editing
  const [showEditModal, setShowEditModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editData, setEditData] = useState({ evid: "", name: "", start_date: "", end_date: "", exid: "" });

  // States for museum, email, and current date
  const [museumAddress, setMuseumAddress] = useState("");
  const email = localStorage.getItem("email");
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  useEffect(() => {
    // fetching event dependency for editing
    const fetchEventDependencies = async () => {
      try {
        // Step 1: Get employee info
        const empRes = await api.get("/get-employee-info/", {
          params: { email },
        });

        const supervisorEmail = empRes.data.supervisorEmail;

        // Step 2: Get supervisor info
        const supRes = await api.get("/get-supervisor-info/", {
          params: { email: supervisorEmail },
        });

        const address = supRes.data.museumAddress;
        setMuseumAddress(address);
        localStorage.setItem("museumAddress", address);

        // Step 3: Use museum address to fetch events and exhibits
        await fetchEvents(address);
        await fetchExhibits(address);
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };

    fetchEventDependencies();
  }, [email]);

  // fetching events for initial load
  const fetchEvents = async (address) => {
    try {
      const res = await api.get("/get-events/", {
        params: { address },
      });
      setEvents(res.data.events);
    } catch (err) {
      console.error("Failed to fetch events:", err);
    }
  };

  // fetching exhibits for initial load
  const fetchExhibits = async (address) => {
    try {
      const res = await api.get("/get-exhibits/", {
        params: { address },
      });
      setExhibitOptions(res.data.exhibits);
    } catch (err) {
      console.error("Failed to fetch exhibits:", err);
    }
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleOpenEdit = (event) => {
    setEditData({ ...event });
    setShowEditModal(true);
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      // 1. Update the event
      await api.post("/update-event/", editData);
  
      // 2. Record the edit in EDITS_EVENTS
      await api.post("/record-edit-event/", {
        eemail: email,
        evid: editData.evid,
      });
  
      setShowEditModal(false);
      fetchEvents(museumAddress);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update event");
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
              <select
                name="exid"
                value={editData.exid}
                onChange={handleEditChange}
                className={styles.selectDropdown}
              >
                <option value="">-- Select an Exhibit --</option>
                {exhibitOptions.map((ex) => (
                  <option key={ex.exid} value={ex.exid}>
                    {ex.name} (ID: {ex.exid})
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.registerButton}>
                Submit Changes
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default EditEvents;
