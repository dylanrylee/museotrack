import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EmployeeMenu from "../components/EmployeeMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

// Main component for employees to view and update artifact data
const EditArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [exhibits, setExhibits] = useState([]);
  const [supervisorEmail, setSupervisorEmail] = useState("");
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

  // Get employee's email from local storage
  const email = localStorage.getItem("email");

  useEffect(() => {
    // it fetches both employee and related artifact/exhibit data based on the user's email.
    const fetchEmployeeAndArtifacts = async () => {
      try {
        // Get the supervisor email and museum address associated with the employee
        const res = await api.get("/get-employee-info/", {
          params: { email },
        });

        const semail = res.data.supervisorEmail;
        setSupervisorEmail(semail);
        localStorage.setItem("museumAddress", res.data.museumAddress);

        // Fetch the artifacts and exhibits tied to this supervisor/museum
        await fetchArtifacts(semail);
        await fetchExhibits(res.data.museumAddress);
      } catch (err) {
        console.error("Failed to get employee info:", err);
      }
    };

    fetchEmployeeAndArtifacts();
  }, [email]);

  // Fetch artifacts supervised by this supervisor
  const fetchArtifacts = async (semail) => {
    try {
      const res = await api.get("/get-artifacts/", {
        params: { semail },
      });
      setArtifacts(res.data.artifacts);
    } catch (err) {
      console.error("Error fetching artifacts:", err);
    }
  };

  // Fetch exhibits for the current museum
  const fetchExhibits = async (address) => {
    try {
      const res = await api.get("/get-exhibits/", {
        params: { address },
      });
      setExhibits(res.data.exhibits);
    } catch (err) {
      console.error("Failed to fetch exhibits:", err);
    }
  };

  // Fetch reviews for a given artifact and calculate average rating
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

  // Update form input values when editing an artifact
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // When user clicks Edit, open modal and preload the artifact data
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

  // Submit the artifact edits and record that the employee made an edit
  const handleUpdateArtifact = async (e) => {
    e.preventDefault();
    try {
      await api.post("/update-artifact/", {
        artid: editArtifact.artid,
        ...formData,
      });
      await api.post("/record-edit-artifact/", {
        eemail: email,
        artid: editArtifact.artid,
      });
      setShowEditModal(false);
      fetchArtifacts(supervisorEmail);
    } catch (err) {
      alert("Update failed");
    }
  };

  return (
    <>
      <Header />
      <EmployeeMenu />
      <div className={styles.main}>
        <h2>Manage Artifacts</h2>
        <input
          type="text"
          placeholder="Search artifacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

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

      {/* Edit Modal */}
      {showEditModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Edit Artifact</h2>
            <form onSubmit={handleUpdateArtifact}>
              <label>Name:</label>
              <input name="name" value={formData.name} onChange={handleChange} />
              <label>Description:</label>
              <input name="description" value={formData.description} onChange={handleChange} />
              <label>Year Made:</label>
              <input name="year_made" value={formData.year_made} onChange={handleChange} />
              <label>Display Status:</label>
              <input name="display_status" value={formData.display_status} onChange={handleChange} />
              <label>Exhibit:</label>
              <select name="exid" value={formData.exid} onChange={handleChange} className={styles.selectDropdown}>
                <option value="">-- Select Exhibit --</option>
                {exhibits.map((ex) => (
                  <option key={ex.exid} value={ex.exid}>
                    {ex.exid} - {ex.name}
                  </option>
                ))}
              </select>
              <button type="submit" className={styles.registerButton}>Submit Changes</button>
              <button type="button" onClick={() => setShowEditModal(false)} className={styles.cancelButton}>Cancel</button>
            </form>
          </div>
        </div>
      )}

      {/* Reviews Modal */}
      {showReviewsModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h3>Reviews for: {selectedArtifact.name}</h3>
            {averageRating && (
              <p>⭐ Average Rating: {averageRating}</p>
            )}
            {artifactReviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              <div className={styles.reviewsList}>
                {artifactReviews.map((review, idx) => (
                  <div key={idx} className={styles.reviewCard}>
                    <p><strong>Email:</strong> {review.email}</p>
                    <p><strong>Username:</strong> {review.username}</p>
                    <p><strong>Rating:</strong> {review.rating}</p>
                    <p><strong>Description:</strong> {review.review_desc}</p>
                  </div>
                ))}
              </div>
            )}
            <button className={styles.cancelButton} onClick={() => setShowReviewsModal(false)}>Close</button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default EditArtifacts;