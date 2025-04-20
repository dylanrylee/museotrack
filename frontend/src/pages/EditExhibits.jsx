import React, { useEffect, useState } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EmployeeMenu from "../components/EmployeeMenu";
import styles from "../styles/SupervisorHomepage.module.css";
import api from "../api/client";

const EditExhibits = () => {
  const [exhibits, setExhibits] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editData, setEditData] = useState({ exid: "", newName: "" });
  const [searchTerm, setSearchTerm] = useState("");
  const [museumAddress, setMuseumAddress] = useState("");
  const email = localStorage.getItem("email");

  useEffect(() => {
    const fetchEmployeeMuseumExhibits = async () => {
      try {
        // Step 1: Get employee info
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

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
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
      fetchExhibits(museumAddress);
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update exhibit");
    }
  };

  const filteredExhibits = exhibits.filter((ex) =>
    `${ex.exid} ${ex.name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <EmployeeMenu />
      <div className={styles.main}>
        <h2>Edit Exhibits</h2>

        <input
          type="text"
          placeholder="Search exhibits..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={styles.searchInput}
        />

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
