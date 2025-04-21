import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import styles from "../styles/Pages.module.css";
import api from "../api/client";

const BrowseVisitors = () => {
  const [visitors, setVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [visitedMuseums, setVisitedMuseums] = useState({});
  const [message, setMessage] = useState("");

  const fetchVisitors = async () => {
    try {
      const [visitorsRes, visitsRes] = await Promise.all([
        api.get("/get-all-visitors"),
        api.get("/get-visitor-museums")
      ]);
      
      setVisitors(visitorsRes.data.visitors);
      
      // Create a map of visitor emails to their visited museums
      const visitsMap = visitsRes.data.visits.reduce((acc, visit) => {
        if (!acc[visit.VEmail]) {
          acc[visit.VEmail] = [];
        }
        acc[visit.VEmail].push(visit.Address);
        return acc;
      }, {});
      
      setVisitedMuseums(visitsMap);
    } catch (err) {
      console.error("Error fetching data:", err);
      setMessage("Failed to fetch visitor data.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  const filteredVisitors = visitors.filter((visitor) =>
    `${visitor.email} ${visitor.first_name} ${visitor.middle_name} ${visitor.last_name} ${visitor.username} ${visitor.year_of_birth}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <h2>Visitors</h2>
        <p>Browse through the list of registered visitors and their details.</p>

        <input
          type="text"
          placeholder="Search visitors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {message && (
          <p style={{ color: message.includes("success") ? "green" : "red", marginTop: "1rem" }}>
            {message}
          </p>
        )}

        {filteredVisitors.length === 0 ? (
          <p style={{ color: "white", marginTop: "1rem" }}>No visitors found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Username</th>
                <th>Year of Birth</th>
                <th>Visited Museums</th>
              </tr>
            </thead>
            <tbody>
              {filteredVisitors.map((visitor) => (
                <tr key={visitor.email}>
                  <td>{visitor.email || "N/A"}</td>
                  <td>
                    {[visitor.first_name, visitor.middle_name, visitor.last_name]
                      .filter(Boolean)
                      .join(" ")}
                  </td>
                  <td>{visitor.username || "N/A"}</td>
                  <td>{visitor.year_of_birth || "N/A"}</td>
                  <td>
                    {visitedMuseums[visitor.email]?.join(", ") || "None"}
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

export default BrowseVisitors;