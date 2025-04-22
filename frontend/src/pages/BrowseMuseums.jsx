import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

// page for browsing museums and adding them to visited list
const BrowseMuseums = () => {
  // museum data and visited status states
  const [museums, setMuseums] = useState([]);
  const [visitedAddresses, setVisitedAddresses] = useState([]);

  // search and feedback message states
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");

  // fetch all museums from backend
  const fetchMuseums = async () => {
    try {
      const res = await api.get("/get-all-museums/");
      setMuseums(res.data.museums);
    } catch (err) {
      console.error("Error fetching museums:", err);
    }
  };

  // fetch museums that the user has already visited
  const fetchVisitedMuseums = async () => {
    const email = localStorage.getItem("email");
    try {
      const res = await api.get(`/get-visited-museums/?email=${email}`);
      const addresses = res.data.visits.map((visit) => visit.address);
      setVisitedAddresses(addresses);
    } catch (err) {
      console.error("Error fetching visited museums:", err);
    }
  };

  // fetch museums and visited list on initial load
  useEffect(() => {
    fetchMuseums();
    fetchVisitedMuseums();
  }, []);

  // add selected museum to visited list
  const handleAddToVisited = async (museumAddress) => {
    const email = localStorage.getItem("email");
    try {
      await api.post("/add-visited-museum/", {
        visitor_email: email,
        museum_address: museumAddress,
      });
      setMessage("Museum added to visited list successfully!");
      setVisitedAddresses((prev) => [...prev, museumAddress]);
      setTimeout(() => setMessage(""), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to add museum to visited list");
      setTimeout(() => setMessage(""), 3000);
    }
  };

  // filter museums based on search term
  const filteredMuseums = museums.filter((museum) =>
    `${museum.address} ${museum.name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <h2>Museums</h2>
        <p>Browse through the list of museums and add them to your visited list.</p>

        {/* search bar for filtering museums */}
        <input
          type="text"
          placeholder="Search museums..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {/* feedback message on add-to-visited action */}
        {message && (
          <p style={{ color: message.includes("success") ? "green" : "red", marginTop: "1rem" }}>
            {message}
          </p>
        )}

        {/* museums table */}
        {filteredMuseums.length === 0 ? (
          <p style={{ color: "white", marginTop: "1rem" }}>No museums found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredMuseums.map((museum) => (
                <tr key={museum.address}>
                  <td>{museum.name}</td>
                  <td>{museum.address}</td>
                  <td>
                    {/* show visited status or add button */}
                    {visitedAddresses.includes(museum.address) ? (
                      <span style={{ color: "green", fontWeight: "bold" }}>
                        ✅ You have visited this museum
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddToVisited(museum.address)}
                        className={styles.actionButton}
                      >
                        + Add to Visited
                      </button>
                    )}
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

export default BrowseMuseums;
