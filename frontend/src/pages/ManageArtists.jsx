import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupervisorMenu from "../components/SupervisorMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

// Page for supervisors to manage artist records and their artifact associations
const ManageArtists = () => {
  // state for data and UI controls
  const [artists, setArtists] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editArtist, setEditArtist] = useState(null);
  
  // form state for both add and edit operations
  const [formData, setFormData] = useState({
    date_of_birth: "",
    first_name: "",
    middle_name: "",
    last_name: "",
    selectedArtifacts: []
  });

  // get supervisor email from local storage
  const supervisorEmail = localStorage.getItem("email");

  // fetch all artists from the API
  const fetchArtists = async () => {
    try {
      const res = await api.get("/get-artists/");
      setArtists(res.data.artists);
    } catch (err) {
      console.error("Error fetching artists:", err);
    }
  };

  // fetch artifacts available for assignment to artists
  const fetchArtifacts = async () => {
    try {
      const res = await api.get("/get-artifacts-for-artist/", {
        params: { semail: supervisorEmail },
      });
      setArtifacts(res.data.artifacts);
    } catch (err) {
      console.error("Error fetching artifacts:", err);
    }
  };

  // load initial data on component mount
  useEffect(() => {
    fetchArtists();
    fetchArtifacts();
  }, []);

  // handle input changes for text fields
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // handle selection of multiple artifacts
  const handleArtifactSelect = (e) => {
    const options = Array.from(e.target.selectedOptions);
    const selected = options.map((o) => o.value);
    setFormData((prev) => ({ ...prev, selectedArtifacts: selected }));
  };

  // submit new artist to API
  const handleAddArtist = async (e) => {
    e.preventDefault();
    try {
      await api.post("/add-artist/", formData);
      // reset form and refresh data
      setFormData({
        date_of_birth: "",
        first_name: "",
        middle_name: "",
        last_name: "",
        selectedArtifacts: []
      });
      setShowAddModal(false);
      fetchArtists();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add artist");
    }
  };

  // prepare edit form with artist data
  const handleOpenEdit = (artist) => {
    setEditArtist(artist);
    setFormData({
      aid: artist.aid,
      date_of_birth: artist.date_of_birth,
      first_name: artist.first_name,
      middle_name: artist.middle_name,
      last_name: artist.last_name,
      selectedArtifacts: artist.artifacts_ids || []
    });
    setShowEditModal(true);
  };

  // submit updated artist to API
  const handleUpdateArtist = async (e) => {
    e.preventDefault();
    try {
      await api.post("/update-artist/", formData);
      setShowEditModal(false);
      fetchArtists();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update artist");
    }
  };

  // delete artist from system
  const handleDeleteArtist = async () => {
    try {
      await api.post("/delete-artist/", { aid: editArtist.aid });
      setShowEditModal(false);
      fetchArtists();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete artist");
    }
  };

  // filter artists based on search input
  const filteredArtists = artists.filter((artist) =>
    `${artist.aid} ${artist.first_name} ${artist.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <SupervisorMenu />

      {/* Main content area */}
      <div className={styles.main}>
        <h2>Manage Artists</h2>
        <p>Other museum supervisors can add artists here as well.</p>

        {/* Search and add artist controls */}
        <input
          type="text"
          placeholder="Search artists..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <button
          onClick={() => {
            setFormData({
              date_of_birth: "",
              first_name: "",
              middle_name: "",
              last_name: "",
              selectedArtifacts: []
            });
            setShowAddModal(true);
          }}
          className={styles.addEmployeeButton}
        >
          + Add Artist
        </button>

        {/* Artists table or empty state */}
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
                <th>Actions</th>
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

                  <td>
                    <button
                      className={styles.editButton}
                      onClick={() => handleOpenEdit(artist)}
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Artist Modal */}
      {showAddModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Add Artist</h2>
            <form onSubmit={handleAddArtist}>
              <label>Date of Birth:</label>
              <input name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} required />
              <label>First Name:</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} required />
              <label>Middle Name:</label>
              <input name="middle_name" value={formData.middle_name} onChange={handleChange} />
              <label>Last Name:</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} required />
              <label>Assign Artifacts:</label>
              <select
                multiple
                value={formData.selectedArtifacts}
                onChange={handleArtifactSelect}
                className={styles.multiSelect}
              >
                {artifacts.map((a) => (
                  <option key={a.artid} value={a.artid}>
                    {a.artid} - {a.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.registerButton}>Submit</button>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Artist Modal */}
      {showEditModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Edit Artist</h2>
            <form onSubmit={handleUpdateArtist}>
              <label>Date of Birth:</label>
              <input name="date_of_birth" value={formData.date_of_birth} onChange={handleChange} />
              <label>First Name:</label>
              <input name="first_name" value={formData.first_name} onChange={handleChange} />
              <label>Middle Name:</label>
              <input name="middle_name" value={formData.middle_name} onChange={handleChange} />
              <label>Last Name:</label>
              <input name="last_name" value={formData.last_name} onChange={handleChange} />
              <label>Assign Artifacts:</label>
              <select
                multiple
                value={formData.selectedArtifacts}
                onChange={handleArtifactSelect}
                className={styles.multiSelect}
              >
                {artifacts.map((a) => (
                  <option key={a.artid} value={a.artid}>
                    {a.artid} - {a.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.registerButton}>Submit Changes</button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteArtist}
                className={styles.deleteButton}
              >
                Delete Artist
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ManageArtists;