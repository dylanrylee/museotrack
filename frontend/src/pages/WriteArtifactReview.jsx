import React, { useState, useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import styles from "../styles/Pages.module.css";
import api from "../api/client";

const WriteArtifactReview = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [selectedArtifact, setSelectedArtifact] = useState("");
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchArtifacts = async () => {
      try {
        const res = await api.get("/get-artifacts/");
        setArtifacts(res.data.artifacts);
      } catch (err) {
        console.error("Error fetching artifacts:", err);
        setMessage("Failed to load artifacts");
      }
    };

    fetchArtifacts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const email = localStorage.getItem("email");

    try {
      await api.post("/add-artifact-review/", {
        email: email,
        artifact_id: selectedArtifact,
        rating: rating,
        review_text: reviewText,
      });
      setMessage("Review submitted successfully!");
      setReviewText("");
      setRating(5);
      setSelectedArtifact("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to submit review");
    }
  };

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <h2>Write Artifact Review</h2>
        <p>Share your thoughts about an artifact.</p>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div>
            <label>Select Artifact:</label>
            <select
              value={selectedArtifact}
              onChange={(e) => setSelectedArtifact(e.target.value)}
              required
              className={styles.searchInput}
            >
              <option value="">Choose an artifact...</option>
              {artifacts.map((artifact) => (
                <option key={artifact.artid} value={artifact.artid}>
                  {artifact.name} (ID: {artifact.artid})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label>Rating (1-5):</label>
            <input
              type="number"
              min="1"
              max="5"
              value={rating}
              onChange={(e) => setRating(parseInt(e.target.value))}
              required
              className={styles.searchInput}
            />
          </div>

          <div>
            <label>Review:</label>
            <textarea
              value={reviewText}
              onChange={(e) => setReviewText(e.target.value)}
              required
              className={styles.textarea}
              rows="4"
            />
          </div>

          <button type="submit" className={styles.submitButton}>
            Submit Review
          </button>

          {message && (
            <p style={{ color: message.includes("success") ? "green" : "red", marginTop: "1rem" }}>
              {message}
            </p>
          )}
        </form>
      </div>

      <Footer />
    </>
  );
};

export default WriteArtifactReview; 