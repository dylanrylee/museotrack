import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import { Link } from "react-router-dom";
import styles from "../styles/Pages.module.css";
import api from "../api/client";

const BrowseArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchArtifacts = async () => {
    try {
      const res = await api.get("/get-artifacts/");
      setArtifacts(res.data.artifacts);
    } catch (err) {
      console.error("Error fetching artifacts:", err);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, []);

  const filteredArtifacts = artifacts.filter((artifact) =>
    `${artifact.artid} ${artifact.name} ${artifact.description}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <h2>Artifacts</h2>
        <p>Browse through the list of artifacts and their details.</p>

        <input
          type="text"
          placeholder="Search artifacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {filteredArtifacts.length === 0 ? (
          <p style={{ color: "white", marginTop: "1rem" }}>No artifacts found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Description</th>
                <th>Year Made</th>
                <th>Display Status</th>
                <th>Exhibit ID</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredArtifacts.map((artifact) => (
                <tr key={artifact.artid}>
                  <td>{artifact.artid}</td>
                  <td>{artifact.name}</td>
                  <td>{artifact.description}</td>
                  <td>{artifact.year_made}</td>
                  <td>{artifact.display_status}</td>
                  <td>{artifact.exid}</td>
                  <td>
                    <Link to={`/view-artifact-reviews/${artifact.artid}`} className={styles.actionButton}>
                      View Reviews
                    </Link>
                    <Link to={`/write-artifact-review/${artifact.artid}`} className={styles.actionButton}>
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

export default BrowseArtifacts;
