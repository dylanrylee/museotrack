import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupervisorMenu from "../components/SupervisorMenu"; 
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

const LogsForEdits = () => {
  const [logs, setLogs] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const email = localStorage.getItem("email");
        const res = await api.get("/get-edit-logs/", {
          params: { email },
        });
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
      <div className={styles.main}>
        <h2>Edit Logs</h2>

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
