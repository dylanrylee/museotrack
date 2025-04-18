import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupervisorMenu from "../components/SupervisorMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

const ManageExhibits = () => {
  const [exhibits, setExhibits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [formData, setFormData] = useState({ exid: "", name: "" });
  const [editData, setEditData] = useState({ exid: "", newName: "" });
  const [searchTerm, setSearchTerm] = useState("");

  const supervisorEmail = localStorage.getItem("email");
  const supervisorMuseumAddress = localStorage.getItem("museumAddress");

  const fetchExhibits = async () => {
    try {
      const res = await api.get("/get-exhibits/", {
        params: { address: supervisorMuseumAddress },
      });
      setExhibits(res.data.exhibits);
    } catch (err) {
      console.error("Failed to fetch exhibits:", err);
    }
  };

  useEffect(() => {
    fetchExhibits();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddExhibit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/add-exhibit/", {
        ...formData,
        address: supervisorMuseumAddress,
      });
      setFormData({ exid: "", name: "" });
      setShowModal(false);
      fetchExhibits();
    } catch (err) {
      const msg = err.response?.data?.message || "Unknown error";
      alert("Failed to add exhibit: " + msg);
    }
  };

  const handleOpenEdit = (exhibit) => {
    setEditData({ exid: exhibit.exid, newName: exhibit.name });
    setShowEditModal(true);
  };

  const handleUpdateExhibit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/update-exhibit/", {
        exid: editData.exid,
        name: editData.newName,
      });
      setShowEditModal(false);
      fetchExhibits();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update exhibit");
    }
  };

  const handleDeleteExhibit = async () => {
    try {
      await api.post("/delete-exhibit/", { exid: editData.exid });
      setShowEditModal(false);
      fetchExhibits();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete exhibit");
    }
  };

  const filteredExhibits = exhibits.filter((ex) =>
    `${ex.exid} ${ex.name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <SupervisorMenu />
      <div className={styles.main}>
        <h2>Manage Exhibits</h2>

        <input
          type="text"
          placeholder="Search exhibits..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        <button
          onClick={() => {
            setFormData({ exid: "", name: "" });
            setShowModal(true);
          }}
          className={styles.addEmployeeButton}
        >
          + Add Exhibit
        </button>

        {filteredExhibits.length > 0 ? (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Exhibit ID</th>
                <th>Name</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredExhibits.map((ex) => (
                <tr key={ex.exid}>
                  <td>{ex.exid}</td>
                  <td>{ex.name}</td>
                  <td>
                    <button
                      className={styles.editButton}
                      onClick={() => handleOpenEdit(ex)}
                    >
                      ✏️ Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No exhibits found.</p>
        )}
      </div>

      {/* Add Modal */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Add Exhibit</h2>
            <form onSubmit={handleAddExhibit}>
              <label>Exhibit ID:</label>
              <input
                name="exid"
                value={formData.exid}
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

              <button type="submit" className={styles.registerButton}>
                Submit
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowModal(false);
                  setFormData({ exid: "", name: "" });
                }}
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
            <h2>Edit Exhibit</h2>
            <form onSubmit={handleUpdateExhibit}>
              <label>New Name:</label>
              <input
                type="text"
                name="newName"
                value={editData.newName}
                onChange={handleEditChange}
              />
              <button type="submit" className={styles.registerButton}>
                Submit Changes
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowEditModal(false);
                  setEditData({ exid: "", newName: "" });
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteExhibit}
                className={styles.deleteButton}
              >
                Delete Exhibit
              </button>
            </form>
          </div>
        </div>
      )}
      <Footer />
    </>
  );
};

export default ManageExhibits;
