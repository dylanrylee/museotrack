import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EmployeeMenu from "../components/EmployeeMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

// Page for employees to view and edit exhibit information
const EditExhibits = () => {
  // state for exhibits list and editing functionality
  const [exhibits, setExhibits] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ exid: "", newName: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [museumAddress, setMuseumAddress] = useState("");
  
  // get employee email from local storage
  const email = localStorage.getItem("email");

  // fetch employee's museum exhibits on initial load
  useEffect(() => {
    const fetchEmployeeMuseumExhibits = async () => {
      try {
        // Step 1: Get employee info to find supervisor
        const empRes = await api.get("/get-employee-info/", {
          params: { email },
        });
        const supervisorEmail = empRes.data.supervisorEmail;

        // Step 2: Get supervisor's museum address
        const supRes = await api.get("/get-supervisor-info/", {
          params: { email: supervisorEmail },
        });
        const address = supRes.data.museumAddress;
        setMuseumAddress(address);
        localStorage.setItem("museumAddress", address); // optional

        // Step 3: Fetch exhibits using museum address
        await fetchExhibits(address);
      } catch (err) {
        console.error("Failed to load exhibits:", err);
      }
    };

    fetchEmployeeMuseumExhibits();
  }, [email]);

  // fetch exhibits for a specific museum address
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

  // handle changes in edit form inputs
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // open edit modal with current exhibit data
  const handleOpenEdit = (exhibit) => {
    setEditData({ exid: exhibit.exid, newName: exhibit.name });
    setShowEditModal(true);
  };

  // submit updated exhibit information
  const handleUpdateExhibit = async (e) => {
    e.preventDefault();
    try {
      // 1. Update the exhibit name
      await api.post("/update-exhibit/", {
        exid: editData.exid,
        name: editData.newName,
      });
  
      // 2. Record the edit in history
      await api.post("/record-edit-exhibit/", {
        eemail: email,
        exid: editData.exid,
      });
  
      setShowEditModal(false);
      fetchExhibits(museumAddress);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update exhibit");
    }
  };
  
  // filter exhibits based on search input
  const filteredExhibits = exhibits.filter((ex) =>
    `${ex.exid} ${ex.name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <EmployeeMenu />
      
      {/* Main content area */}
      <div className={styles.main}>
        <h2>Edit Exhibits</h2>

        {/* Search input for filtering exhibits */}
        <input
          type="text"
          placeholder="Search exhibits..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

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

      {/* Edit Modal Only */}
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
                required
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
            </form>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
};

export default EditExhibits;