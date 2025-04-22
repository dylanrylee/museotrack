import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupervisorMenu from "../components/SupervisorMenu"; 
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

// Page displaying audit logs of all edits made by employees under supervisor
const LogsForEdits = () => {
  // state for logs data and error handling
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  // fetch edit logs on component mount
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        // get supervisor email from local storage
        const email = localStorage.getItem("email");
        
        // fetch logs from API
        const res = await api.get("/get-edit-logs/", {
          params: { email },
        });
        
        // update state with fetched logs
        setLogs(res.data.logs);
      } catch (err) {
        console.error("Failed to fetch logs:", err);
        setError("Could not fetch logs.");
      }
    };

    fetchLogs();
  }, []);

  return (
    <>
      <Header />
      <SupervisorMenu />
      
      {/* Main content container */}
      <div className={styles.main}>
        <h2>Edit Logs</h2>

        {/* Conditional rendering: error, empty state, or logs table */}
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : logs.length === 0 ? (
          <p>No edits found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Edit ID</th>
                <th>Employee Email</th>
                <th>Supervisor Email</th>
                <th>Edit Type</th>
                <th>Target ID</th>
                <th>Edit Time</th>
              </tr>
            </thead>
            <tbody>
              {/* Map through logs to display each record */}
              {logs.map((log) => (
                <tr key={`${log.type}-${log.edit_id}`}>
                  <td>{log.edit_id}</td>
                  <td>{log.eemail}</td>
                  <td>{log.semail}</td>
                  <td>{log.type}</td>
                  <td>{log.target_id}</td>
                  <td>{new Date(log.edit_time).toLocaleString()}</td>
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

export default LogsForEdits;