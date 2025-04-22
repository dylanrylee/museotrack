import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

// Page for browsing and searching through registered visitors
const BrowseVisitors = () => {
  // visitor list and search input state
  const [visitors, setVisitors] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // message state for displaying fetch errors
  const [message, setMessage] = useState("");

  // fetch all visitors on initial load
  const fetchVisitors = async () => {
    try {
      const res = await api.get("/get-all-visitors/");
      setVisitors(res.data.visitors);
    } catch (err) {
      console.error("Error fetching visitors:", err);
      setMessage("Failed to fetch visitor data.");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  useEffect(() => {
    fetchVisitors();
  }, []);

  // filter visitors based on search input
  const filteredVisitors = visitors.filter((visitor) =>
    `${visitor.email} ${visitor.first_name} ${visitor.middle_name} ${visitor.last_name} ${visitor.username} ${visitor.year_of_birth} ${visitor.visited_museum_names?.join(" ") || ""}`
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

        {/* search input for filtering visitors */}
        <input
          type="text"
          placeholder="Search visitors..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {/* show error or success messages */}
        {message && (
          <p style={{ color: message.includes("success") ? "green" : "red", marginTop: "1rem" }}>
            {message}
          </p>
        )}

        {/* visitors table */}
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
                  <td>{visitor.visited_museum_names?.join(", ") || "None"}</td>
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
