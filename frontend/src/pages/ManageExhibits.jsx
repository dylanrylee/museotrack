import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupervisorMenu from "../components/SupervisorMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

// Page for supervisors to manage museum exhibits (CRUD operations)
const ManageExhibits = () => {
  // state for exhibits data and UI controls
  const [exhibits, setExhibits] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // form state for adding new exhibits
  const [formData, setFormData] = useState({ name: "" });
  
  // form state for editing existing exhibits
  const [editData, setEditData] = useState({ exid: "", newName: "" });
  
  // state for search functionality
  const [searchTerm, setSearchTerm] = useState("");

  // get museum address from local storage
  const supervisorMuseumAddress = localStorage.getItem("museumAddress");

  // fetch all exhibits for the supervisor's museum
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

  // load exhibits on component mount
  useEffect(() => {
    fetchExhibits();
  }, []);

  // handle input changes for add exhibit form
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // handle input changes for edit exhibit form
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // submit new exhibit to API
  const handleAddExhibit = async (e) => {
    e.preventDefault();
    try {
      await api.post("/add-exhibit/", {
        ...formData,
        address: supervisorMuseumAddress,
      });
      setFormData({ name: "" });
      setShowModal(false);
      fetchExhibits();
    } catch (err) {
      const msg = err.response?.data?.message || "Unknown error";
      alert("Failed to add exhibit: " + msg);
    }
  };

  // prepare edit form with exhibit data
  const handleOpenEdit = (exhibit) => {
    setEditData({ exid: exhibit.exid, newName: exhibit.name });
    setShowEditModal(true);
  };

  // submit updated exhibit to API
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

  // delete exhibit from system
  const handleDeleteExhibit = async () => {
    try {
      await api.post("/delete-exhibit/", { exid: editData.exid });
      setShowEditModal(false);
      fetchExhibits();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete exhibit");
    }
  };

  // filter exhibits based on search input (ID or name)
  const filteredExhibits = exhibits.filter((ex) =>
    `${ex.exid} ${ex.name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <SupervisorMenu />
      
      {/* Main content container */}
      <div className={styles.main}>
        <h2>Manage Exhibits</h2>

        {/* Search input for filtering exhibits */}
        <input
          type="text"
          placeholder="Search exhibits..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

        {/* Button to open add exhibit modal */}
        <button
          onClick={() => {
            setFormData({ name: "" });
            setShowModal(true);
          }}
          className={styles.addEmployeeButton}
        >
          + Add Exhibit
        </button>

        {/* Exhibits table or empty state message */}
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

      {/* Add Exhibit Modal */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Add Exhibit</h2>
            <form onSubmit={handleAddExhibit}>
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
                  setFormData({ name: "" });
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Exhibit Modal */}
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