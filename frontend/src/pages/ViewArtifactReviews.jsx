import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import styles from "../styles/Pages.module.css";
import api from "../api/client";

const ViewArtifactReviews = () => {
  const [reviews, setReviews] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedArtifact, setSelectedArtifact] = useState(null);

  // Fetch all artifacts
  const fetchArtifacts = async () => {
    try {
      const res = await api.get("/get-artifacts/");
      setArtifacts(res.data.artifacts);
    } catch (err) {
      console.error("Error fetching artifacts:", err);
    }
  };

  const fetchReviews = async (artifactId) => {
    try {
      const res = await api.get("/get-artifact-reviews/", {
        params: { artifact_id: artifactId },
      });
      setReviews(res.data.reviews);
    } catch (err) {
      console.error("Error fetching reviews:", err);
    }
  };

  useEffect(() => {
    fetchArtifacts();
  }, []);

  useEffect(() => {
    if (selectedArtifact) {
      fetchReviews(selectedArtifact);
    }
  }, [selectedArtifact]);

  const filteredReviews = reviews.filter((review) =>
    `${review.review_text} ${review.rating}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <h2>Artifact Reviews</h2>
        <p>View reviews for specific artifacts.</p>

        <select
          value={selectedArtifact || ""}
          onChange={(e) => setSelectedArtifact(e.target.value)}
          className={styles.searchInput}
        >
          <option value="">Select an artifact...</option>
          {artifacts.map((artifact) => (
            <option key={artifact.artid} value={artifact.artid}>
              {artifact.name} (ID: {artifact.artid})
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search reviews..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {filteredReviews.length === 0 ? (
          <p style={{ color: "white", marginTop: "1rem" }}>No reviews found.</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Reviewer</th>
                <th>Rating</th>
                <th>Review Text</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredReviews.map((review) => (
                <tr key={review.review_id}>
                  <td>{review.visitor_name}</td>
                  <td>{review.rating}</td>
                  <td>{review.review_text}</td>
                  <td>{new Date(review.review_date).toLocaleDateString()}</td>
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

export default ViewArtifactReviews; 