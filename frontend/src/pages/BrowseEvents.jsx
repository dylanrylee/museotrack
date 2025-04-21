import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import { Link } from "react-router-dom";
import styles from "../styles/Pages.module.css";
import api from "../api/client";

const BrowseEvents = () => {
  const [events, setEvents] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchEvents = async () => {
    try {
      const res = await api.get("/get-events/");
      setEvents(res.data.events);
    } catch (err) {
      console.error("Error fetching events:", err);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = events.filter((event) =>
    `${event.eid} ${event.name} ${event.description}`.toLowerCase().includes(searchTerm.toLowerCase())
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
                <th>Description</th>
                <th>Date</th>
                <th>Time</th>
                <th>Location</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => (
                <tr key={event.eid}>
                  <td>{event.eid}</td>
                  <td>{event.name}</td>
                  <td>{event.description}</td>
                  <td>{event.date}</td>
                  <td>{event.time}</td>
                  <td>{event.location}</td>
                  <td>
                    <Link to={`/view-event-reviews/${event.eid}`} className={styles.actionButton}>
                      View Reviews
                    </Link>
                    <Link to={`/write-event-review/${event.eid}`} className={styles.actionButton}>
                      Write Review
                    </Link>
                  </td>
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

export default BrowseEvents;
