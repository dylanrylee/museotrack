import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";
import SupervisorMenu from "../components/SupervisorMenu";

const ManageArtifacts = () => {
  const [artifacts, setArtifacts] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editArtifact, setEditArtifact] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const supervisorEmail = localStorage.getItem("email");

  const [formData, setFormData] = useState({
    artid: "",
    name: "",
    description: "",
    year_made: "",
    display_status: "",
    exid: "",
  });

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddArtifact = async (e) => {
    e.preventDefault();
    try {
      await api.post("/add-artifact/", {
        ...formData,
        semail: supervisorEmail,
      });

      setFormData({
        artid: "",
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
        alert("Ohp, that Exhibit doesn't exist in your Museum yet.");
      } else {
        console.error("❌ Artifact add error:", message);
        alert("Failed to add artifact: " + message || "Unknown error");
      }
    }
  };

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

  const handleUpdateArtifact = async (e) => {
    e.preventDefault();
    try {
      await api.post("/update-artifact/", {
        artid: editArtifact.artid,
        ...formData,
      });
      setShowEditModal(false);
      setFormData({
        artid: "",
        name: "",
        description: "",
        year_made: "",
        display_status: "",
        exid: "",
      });
      fetchArtifacts();
    } catch (err) {
      alert("Update failed");
    }
  };

  const handleDeleteArtifact = async () => {
    try {
      await api.post("/delete-artifact/", {
        artid: editArtifact.artid,
      });
      setShowEditModal(false);
      setFormData({
        artid: "",
        name: "",
        description: "",
        year_made: "",
        display_status: "",
        exid: "",
      });
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

        <button
          onClick={() => {
            setShowAddModal(true);
            setFormData({
              artid: "",
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
                      <button
                        className={styles.editButton}
                        onClick={() => handleOpenEdit(artifact)}
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

      {/* ADD MODAL */}
      {showAddModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Add Artifact</h2>
            <form onSubmit={handleAddArtifact}>
              <label>Artifact ID:</label>
              <input
                name="artid"
                value={formData.artid}
                onChange={handleChange}
                required
              />
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
              <label>Exhibit ID:</label>
              <input
                name="exid"
                value={formData.exid}
                onChange={handleChange}
                required
              />
              <button type="submit" className={styles.registerButton}>
                Submit
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setShowAddModal(false);
                  setFormData({
                    artid: "",
                    name: "",
                    description: "",
                    year_made: "",
                    display_status: "",
                    exid: "",
                  });
                }}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {showEditModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.editTitle}>Edit Artifact</h2>
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
              <label>Exhibit ID:</label>
              <input
                name="exid"
                value={formData.exid}
                onChange={handleChange}
              />

              <button type="submit" className={styles.registerButton}>
                Submit Changes
              </button>
              <button
                type="button"
                className={styles.cancelButton}
                onClick={() => {
                  setShowEditModal(false);
                  setFormData({
                    artid: "",
                    name: "",
                    description: "",
                    year_made: "",
                    display_status: "",
                    exid: "",
                  });
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={styles.deleteButton}
                onClick={handleDeleteArtifact}
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
