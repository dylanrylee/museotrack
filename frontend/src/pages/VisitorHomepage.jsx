import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/SupervisorHomepage.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Menu from "../components/Menu";
import api from "../api/client";

const VisitorHomepage = () => {
  const [username, setUsername] = useState("");
  const [museums, setMuseums] = useState(null);
  const [artifactReviews, setArtifactReviews] = useState(null);
  const [eventReviews, setEventReviews] = useState(null);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const email = localStorage.getItem("email");

  console.log(email);

  useEffect(() => {
    if (!email) {
      setError("Email not provided.");
      return;
    }

    const fetchVisitorInfo = async () => {
      try {
        const museumsRes = await api.get("/browse-visited-museums/", {
          params: { email },
        });
        setUsername(museumsRes.data.username || "");
        setMuseums(museumsRes.data.visitedMuseums || []);
      } catch (err) {
        console.error("Error fetching museums:", err);
        setMuseums(null);
      }

      try {
        const artifactReviewsRes = await api.get(
          "/get-visitor-artifact-reviews/",
          { params: { email } }
        );
        setArtifactReviews(artifactReviewsRes.data.reviews || []);
      } catch (err) {
        console.error("Error fetching artifact reviews:", err);
        setArtifactReviews(null);
      }

      try {
        const eventReviewsRes = await api.get("/get-visitor-event-reviews/", {
          params: { email },
        });
        setEventReviews(eventReviewsRes.data.reviews || []);
      } catch (err) {
        console.error("Error fetching event reviews:", err);
        setEventReviews(null);
      }
    };

    fetchVisitorInfo();
  }, [email]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  const handleRemoveVisit = async (address) => {
    try {
      await api.post("/delete-visited-museum/", {
        visitor_email: email,
        museum_address: address,
      });
      setMuseums((prev) => prev.filter((m) => m.address !== address));
    } catch (err) {
      console.error("Failed to remove visited museum:", err);
      alert("Failed to remove museum from visited list.");
    }
  };

  const handleDeleteArtifactReview = async (artid) => {
    if (!email || !artid) {
      alert("Missing email or artifact ID.");
      return;
    }

    try {
      await api.post("/delete-artifact-review/", { email: email, artid });
      setArtifactReviews((prev) => prev.filter((r) => r.artid !== artid));
    } catch (err) {
      console.error("Failed to delete artifact review:", err);
      alert("Could not delete review.");
    }
  };

  const handleDeleteEventReview = async (evid) => {
    console.log("Deleting review for:", { email, evid });

    if (!email || !evid) {
      alert("Missing email or event ID.");
      return;
    }

    try {
      const response = await api.post("/delete-event-review/", {
        email: email,
        evid: evid,
      });

      console.log("Response from server:", response.data);

      setEventReviews((prev) => prev.filter((r) => r.evid !== evid));
    } catch (err) {
      console.error("❌ Failed to delete event review:", err);
      alert("Could not delete event review.");
    }
  };

  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <>
            <div className={styles.welcomeSection}>
              <p>
                Welcome, <strong>{username}</strong>
              </p>
              <p>
                Email: <strong>{email}</strong>
              </p>
              <button onClick={handleLogout} className={styles.signOutButton}>
                Logout
              </button>
            </div>

            {/* Museums */}
            <div className={styles.section}>
              <h2>Museums You've Visited</h2>
              {museums === null ? (
                <p>N/A</p>
              ) : museums.length === 0 ? (
                <p>None</p>
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
                    {museums.map((museum) => (
                      <tr key={museum.address}>
                        <td>{museum.name}</td>
                        <td>{museum.address}</td>
                        <td>
                          <button
                            onClick={() => handleRemoveVisit(museum.address)}
                            className={styles.removeButton}
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Artifact Reviews */}
            <div className={styles.section}>
              <h2>Your Artifact Reviews</h2>
              {artifactReviews === null ? (
                <p>N/A</p>
              ) : artifactReviews.length === 0 ? (
                <p>None</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Artifact</th>
                      <th>Rating</th>
                      <th>Review</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {artifactReviews.map((review) => (
                      <tr key={`${email}_${review.artid}`}>
                        <td>{review.artifact_name}</td>
                        <td>{review.rating}</td>
                        <td>{review.review_text}</td>
                        <td>
                          <button
                            onClick={() =>
                              handleDeleteArtifactReview(review.artid)
                            }
                            className={styles.removeButton}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Event Reviews */}
            <div className={styles.section}>
              <h2>Your Event Reviews</h2>
              {eventReviews === null ? (
                <p>N/A</p>
              ) : eventReviews.length === 0 ? (
                <p>None</p>
              ) : (
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Rating</th>
                      <th>Review</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {eventReviews.map((review) => (
                      <tr key={`${email}_${review.evid}`}>
                        <td>{review.event_name}</td>
                        <td>{review.rating}</td>
                        <td>{review.review_text}</td>
                        <td>
                          <button
                            onClick={() => handleDeleteEventReview(review.evid)}
                            className={styles.removeButton}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      <Footer />
    </>
  );
};

export default VisitorHomepage;
