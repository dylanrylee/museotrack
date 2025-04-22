import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";
import { FaStar } from "react-icons/fa";

// Page For Browsing, writing reviews, and viewing reviews for Artifacts
const BrowseArtifacts = () => {
  // artifacts and search states
  const [artifacts, setArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Modal Control and Selected Artifact states
  const [modalOpen, setModalOpen] = useState(false);
  const [viewReviewsModalOpen, setViewReviewsModalOpen] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  // Review detail states
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(null);
  const [reviewDesc, setReviewDesc] = useState("");

  // Displayed Review state
  const [artifactReviews, setArtifactReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(null);

  const email = localStorage.getItem("email");

  // fetching all artifacts on intial load
  const fetchArtifacts = async () => {
    try {
      const res = await api.get("/get-all-artifacts/");
      setArtifacts(res.data.artifacts);
    } catch (err) {
      console.error("Error fetching artifacts:", err);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, []);

  // open modal for writing review
  const handleOpenReviewModal = (artifact) => {
    setSelectedArtifact(artifact);
    setRating(0);
    setReviewDesc("");
    setModalOpen(true);
  };

  // fetch and display reviews for artifacts
  const handleViewReviews = async (artifact) => {
    try {
      const res = await api.get("/get-artifact-reviews/", {
        params: { artid: artifact.artid },
      });
      setSelectedArtifact(artifact);
      setArtifactReviews(res.data.reviews || []);

      // calculate avg rating when reviews exists
      if (res.data.reviews?.length) {
        const avg = (
          res.data.reviews.reduce((sum, r) => sum + r.rating, 0) /
          res.data.reviews.length
        ).toFixed(1);
        setAverageRating(avg);
      } else {
        setAverageRating(null);
      }

      setViewReviewsModalOpen(true);
    } catch (err) {
      console.error("Error fetching reviews:", err);
      alert("Failed to load reviews.");
    }
  };

  // creating a review for selected artifact
  const handleSubmitReview = async () => {
    if (!email || !selectedArtifact) return;
    try {
      await api.post("/submit-artifact-review/", {
        email,
        artid: selectedArtifact.artid,
        rating,
        review_desc: reviewDesc,
      });
      alert("Review submitted!");
      setModalOpen(false);
    } catch (err) {
      console.error("Error submitting review:", err);
      alert("Failed to submit review.");
    }
  };

  // Filter Artifacts based on seach terms
  const filteredArtifacts = artifacts.filter((artifact) =>
    `${artifact.artid} ${artifact.name} ${artifact.description}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <h2>Artifacts</h2>
        <p>Browse through the list of artifacts and their details.</p>

        {/* Search bar for filtering artifacts */}
        <input
          type="text"
          placeholder="Search artifacts..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {/* Artifacts table*/}
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
                    <div className={styles.actionButtonGroup}>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleOpenReviewModal(artifact)}
                      >
                        Write Review
                      </button>
                      <button
                        className={styles.actionButton}
                        onClick={() => handleViewReviews(artifact)}
                      >
                        View Reviews
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Write Review Modal */}
      {modalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Review: {selectedArtifact.name}</h3>
            <div className={styles.stars}>
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  size={28}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  color={(hoverRating || rating) >= star ? "#ffc107" : "#ccc"}
                  style={{ cursor: "pointer" }}
                />
              ))}
            </div>

            <textarea
              placeholder="Write your review..."
              value={reviewDesc}
              onChange={(e) => setReviewDesc(e.target.value)}
              className={styles.textarea}
            />

            <div className={styles.modalActions}>
              <button onClick={handleSubmitReview} className={styles.actionButton}>
                Submit
              </button>
              <button onClick={() => setModalOpen(false)} className={styles.secondaryButton}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Reviews Modal */}
      {viewReviewsModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Reviews for: {selectedArtifact.name}</h3>
            {averageRating && (
              <p><strong>Average Rating:</strong> {averageRating} ⭐</p>
            )}
            {artifactReviews.length === 0 ? (
              <p>No reviews yet.</p>
            ) : (
              <div className={styles.reviewsList}>
                {artifactReviews.map((review, index) => (
                  <div key={index} className={styles.reviewCard}>
                    <p><strong>Email:</strong> {review.email}</p>
                    <p><strong>Username:</strong> {review.username}</p>
                    <p><strong>Rating:</strong> {review.rating} ⭐</p>
                    <p><strong>Description:</strong> {review.review_desc}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setViewReviewsModalOpen(false)}
              className={styles.secondaryButton}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default BrowseArtifacts;
