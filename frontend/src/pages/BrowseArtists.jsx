import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

// Page for browsing artists and viewing associated artifacts
const BrowseArtists = () => {
  // artists and search states
  const [artists, setArtists] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // fetching all artists on initial load
  const fetchArtists = async () => {
    try {
      const res = await api.get("/get-artists/");
      setArtists(res.data.artists);
    } catch (err) {
      console.error("Error fetching artists:", err);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  // filter artists based on search terms
  const filteredArtists = artists.filter((artist) =>
    `${artist.aid} ${artist.first_name} ${artist.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <h2>Artists</h2>
        <p>Browse through the list of artists and their associated artifacts.</p>

        {/* search bar for filtering artists */}
        <input
          type="text"
          placeholder="Search artists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {/* artists table */}
        {filteredArtists.length === 0 ? (
          <p style={{ color: "white", marginTop: "1rem" }}>No artists found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>AID</th>
                <th>First Name</th>
                <th>Middle Name</th>
                <th>Last Name</th>
                <th>Date of Birth</th>
                <th>Artifacts</th>
              </tr>
            </thead>
            <tbody>
              {filteredArtists.map((artist) => (
                <tr key={artist.aid}>
                  <td>{artist.aid}</td>
                  <td>{artist.first_name}</td>
                  <td>{artist.middle_name}</td>
                  <td>{artist.last_name}</td>
                  <td>{artist.date_of_birth}</td>
                  <td>
                    {artist.artifacts.length > 0 ? (
                      artist.artifacts.join(", ")
                    ) : (
                      <span>No artifacts</span>
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

export default BrowseArtists;
