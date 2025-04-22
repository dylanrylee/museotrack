import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupervisorMenu from "../components/SupervisorMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

const ManageArtifacts = () => {
    // State variables for managing artifact data and UI states
  const [artifacts, setArtifacts] = useState([]);
  const [exhibits, setExhibits] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReviewsModal, setShowReviewsModal] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);
  const [artifactReviews, setArtifactReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);
  const [editArtifact, setEditArtifact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    year_made: "",
    display_status: "",
    exid: "",
  });

  const supervisorEmail = localStorage.getItem("email");
  const museumAddress = localStorage.getItem("museumAddress");

  // Fetch artifacts supervised by the current supervisor
  const fetchArtifacts = async () => {
    if (!supervisorEmail) return;
    try {
      const res = await api.get("/get-artifacts/", {
        params: { semail: supervisorEmail },
      });
      setArtifacts(res.data.artifacts);
    } catch (err) {
      console.error("Error fetching artifacts:", err);
    }
  };

  // Fetch exhibits associated with the supervisor's museum
  const fetchExhibits = async () => {
    try {
      const res = await api.get("/get-exhibits/", {
        params: { address: museumAddress },
      });
      setExhibits(res.data.exhibits);
    } catch (err) {
      console.error("Failed to fetch exhibits:", err);
    }
  };

  // Fetch reviews for a specific artifact and calculate average rating
  const fetchArtifactReviews = async (artifact) => {
    try {
      const res = await api.get("/get-artifact-reviews/", {
        params: { artid: artifact.artid },
      });
      setSelectedArtifact(artifact);
      setArtifactReviews(res.data.reviews || []);
      if (res.data.reviews?.length) {
        const avg =
          res.data.reviews.reduce((sum, r) => sum + r.rating, 0) /
          res.data.reviews.length;
        setAverageRating(avg.toFixed(1));
      } else {
        setAverageRating(null);
      }
      setShowReviewsModal(true);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      alert("Failed to load reviews.");
    }
  };

  // Load artifacts and exhibits on component mount
  useEffect(() => {
    fetchArtifacts();
    fetchExhibits();
  }, []);

  // Update form data on input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit form to add a new artifact
  const handleAddArtifact = async (e) => {
    e.preventDefault();
    try {
      await api.post("/add-artifact/", {
        ...formData,
        semail: supervisorEmail,
      });
      setFormData({
        name: "",
        description: "",
        year_made: "",
        display_status: "",
        exid: "",
      });
      setShowAddModal(false);
      fetchArtifacts();
    } catch (err) {
      const message = err.response?.data?.message || "";
      if (
        message.includes("foreign key constraint fails") &&
        message.toLowerCase().includes("exhibit")
      ) {
        alert("That Exhibit doesn't exist in your Museum yet.");
      } else {
        alert("Failed to add artifact: " + message);
      }
    }
  };

  // Show the edit modal and populate form data
  const handleOpenEdit = (artifact) => {
    setEditArtifact(artifact);
    setFormData({
      name: artifact.name,
      description: artifact.description,
      year_made: artifact.year_made,
      display_status: artifact.display_status,
      exid: artifact.exid,
    });
    setShowEditModal(true);
  };

  // Submit form to update an existing artifact
  const handleUpdateArtifact = async (e) => {
    e.preventDefault();
    try {
      await api.post("/update-artifact/", {
        artid: editArtifact.artid,
        ...formData,
      });
      setShowEditModal(false);
      fetchArtifacts();
    } catch (err) {
      alert("Update failed");
    }
  };

  // Delete an artifact
  const handleDeleteArtifact = async () => {
    try {
      await api.post("/delete-artifact/", {
        artid: editArtifact.artid,
      });
      setShowEditModal(false);
      fetchArtifacts();
    } catch (err) {
      alert("Delete failed");
    }
  };

  return (
    <>
      <Header />
      <SupervisorMenu />
      <div className={styles.main}>
        <h2>Manage Artifacts</h2>
        <input
          type="text"
          placeholder="Search artifacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />
        {/* Button to open the Add Artifact modal */}
        <button
          onClick={() => {
            setShowAddModal(true);
            setFormData({
              name: "",
              description: "",
              year_made: "",
              display_status: "",
              exid: "",
            });
          }}
          className={styles.addEmployeeButton}
        >
          + Add Artifact
        </button>

        {/* Artifact table */}
        {artifacts.length === 0 ? (
          <p style={{ color: "white", marginTop: "1rem" }}>
            No added artifacts yet.
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Description</th>
                <th>Year Made</th>
                <th>Display Status</th>
                <th>Exhibit ID</th>
                <th>Supervisor Email</th>
                <th>Creators</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {artifacts
                .filter((artifact) =>
                  Object.values(artifact)
                    .join(" ")
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
                )
                .map((artifact) => (
                  <tr key={artifact.artid}>
                    <td>{artifact.name}</td>
                    <td>{artifact.description}</td>
                    <td>{artifact.year_made}</td>
                    <td>{artifact.display_status}</td>
                    <td>{artifact.exid}</td>
                    <td>{artifact.semail}</td>
                    <td>
                      {artifact.artists && artifact.artists.length > 0
                        ? artifact.artists
                            .map((a) =>
                              [a.first_name, a.middle_name, a.last_name]
                                .filter(Boolean)
                                .join(" ")
                            )
                            .join(", ")
                        : "None"}
                    </td>
                    <td>
                      <div className={styles.actionButtonGroup}>
                        <button
                          className={styles.actionButton}
                          onClick={() => handleOpenEdit(artifact)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className={styles.actionButton}
                          onClick={() => fetchArtifactReviews(artifact)}
                        >
                          👁 View Reviews
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>

      {/* View Reviews Modal */}
      {showReviewsModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h3>Reviews for: {selectedArtifact.name}</h3>
            {averageRating && <p>⭐ Average Rating: {averageRating}</p>}
            {artifactReviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              <div className={styles.reviewsList}>
                {artifactReviews.map((review, idx) => (
                  <div key={idx} className={styles.reviewCard}>
                    <p>
                      <strong>Email:</strong> {review.email}
                    </p>
                    <p>
                      <strong>Username:</strong> {review.username}
                    </p>
                    <p>
                      <strong>Rating:</strong> {review.rating}
                    </p>
                    <p>
                      <strong>Description:</strong> {review.review_desc}
                    </p>
                  </div>
                ))}
              </div>
            )}
            <button
              className={styles.cancelButton}
              onClick={() => setShowReviewsModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Add Artifact</h2>
            <form onSubmit={handleAddArtifact}>
              <label>Name:</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <label>Description:</label>
              <input
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
              />
              <label>Year Made:</label>
              <input
                name="year_made"
                value={formData.year_made}
                onChange={handleChange}
                required
              />
              <label>Display Status:</label>
              <input
                name="display_status"
                value={formData.display_status}
                onChange={handleChange}
                required
              />
              <label>Exhibit:</label>
              <select
                name="exid"
                value={formData.exid}
                onChange={handleChange}
                required
                className={styles.selectDropdown}
              >
                <option value="">-- Select Exhibit --</option>
                {exhibits.map((ex) => (
                  <option key={ex.exid} value={ex.exid}>
                    {ex.exid} - {ex.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.registerButton}>
                Submit
              </button>
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

      {/* Edit Modal */}
      {showEditModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Edit Artifact</h2>
            <form onSubmit={handleUpdateArtifact}>
              <label>Name:</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
              <label>Description:</label>
              <input
                name="description"
                value={formData.description}
                onChange={handleChange}
              />
              <label>Year Made:</label>
              <input
                name="year_made"
                value={formData.year_made}
                onChange={handleChange}
              />
              <label>Display Status:</label>
              <input
                name="display_status"
                value={formData.display_status}
                onChange={handleChange}
              />
              <label>Exhibit:</label>
              <select
                name="exid"
                value={formData.exid}
                onChange={handleChange}
                className={styles.selectDropdown}
              >
                <option value="">-- Select Exhibit --</option>
                {exhibits.map((ex) => (
                  <option key={ex.exid} value={ex.exid}>
                    {ex.exid} - {ex.name}
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
              <button
                type="button"
                onClick={handleDeleteArtifact}
                className={styles.deleteButton}
              >
                Delete Artifact
              </button>
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default ManageArtifacts;