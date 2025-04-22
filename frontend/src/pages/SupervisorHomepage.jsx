// Importing necessary React hooks and modules
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// Importing CSS module for styling
import styles from "../styles/SupervisorHomepage.module.css";

// Importing custom components
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupervisorMenu from "../components/SupervisorMenu";

// Importing API client
import api from "../api/client";

// SupervisorHomepage component definition
const SupervisorHomepage = () => {
  // State variables for supervisor information
  const [username, setUsername] = useState("");
  const [museum, setMuseum] = useState("");
  const [museumAddress, setMuseumAddress] = useState("");

  // State variables for managing employees
  const [employees, setEmployees] = useState([]);

  // State variables for handling errors and modals
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // State variables for form data when editing an employee
  const [editData, setEditData] = useState({
    email: "",
    newUsername: "",
    newPassword: "",
  });

  // State variables for form data when adding a new employee
  const [formData, setFormData] = useState({
    email: "",
    username: "",
    firstName: "",
    middleName: "",
    lastName: "",
    yearOfBirth: "",
    password: "",
  });

  // Hook to navigate between routes
  const navigate = useNavigate();

  // Retrieve supervisor email from local storage
  const email = localStorage.getItem("email");

  // Function to fetch employees under the supervisor
  const fetchEmployees = async () => {
    const res = await api.get("/get-supervisor-employees/", {
      params: { email },
    });
    setEmployees(res.data.employees);
  };

  // Fetch supervisor data and employees on component mount
  useEffect(() => {
    if (!email) {
      setError("Email not provided.");
      return;
    }

    const fetchSupervisorData = async () => {
      try {
        const [infoRes] = await Promise.all([
          api.get("/get-supervisor-info/", { params: { email } }),
          fetchEmployees(),
        ]);

        setUsername(infoRes.data.username);
        setMuseum(infoRes.data.museum);
        setMuseumAddress(infoRes.data.museumAddress);

        // Save museum address to local storage
        localStorage.setItem("museumAddress", infoRes.data.museumAddress);
      } catch (err) {
        console.error("Error loading supervisor data:", err);
        setError(
          err.response?.data?.message || "Failed to load supervisor data."
        );
      }
    };

    fetchSupervisorData();
  }, [email]);

  // Function to handle logout action
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  // Function to handle input changes for adding employee
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Function to handle input changes for editing employee
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData((prev) => ({ ...prev, [name]: value }));
  };

  // Function to handle submission of new employee form
  const handleAddEmployee = async (e) => {
    e.preventDefault();
    try {
      await api.post("/register-employee/", {
        ...formData,
        supervisorEmail: email,
        museumAddress,
      });

      // Reset form and close modal after successful addition
      setFormData({
        email: "",
        username: "",
        firstName: "",
        middleName: "",
        lastName: "",
        yearOfBirth: "",
        password: "",
      });
      setShowModal(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add employee");
    }
  };

  // Function to open edit modal with selected employee's email
  const handleOpenEdit = (empEmail) => {
    setEditData({ email: empEmail, newUsername: "", newPassword: "" });
    setShowEditModal(true);
  };

  // Function to handle update of employee details
  const handleUpdateEmployee = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        email: editData.email,
        ...(editData.newUsername && { newUsername: editData.newUsername }),
        ...(editData.newPassword && { newPassword: editData.newPassword }),
      };

      await api.post("/update-employee/", payload);
      setShowEditModal(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    }
  };

  // Function to handle deletion of an employee
  const handleDeleteEmployee = async () => {
    try {
      await api.post("/delete-employee/", {
        email: editData.email,
      });

      setShowEditModal(false);
      fetchEmployees();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete employee");
    }
  };

  // Component rendering
  return (
    <>
      {/* Render header */}
      <Header />

      {/* Render supervisor menu */}
      <SupervisorMenu />

      <div className={styles.main}>
        {/* Display error if any */}
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <div>
            {/* Display supervisor information */}
            <p>
              Welcome, <strong>{username}</strong>
            </p>
            <p>
              Email: <strong>{email}</strong>
            </p>
            <p>
              Museum: <strong>{museum}</strong>
            </p>
            <p>
              Address: <strong>{museumAddress}</strong>
            </p>

            {/* Logout button */}
            <button onClick={handleLogout} className={styles.signOutButton}>
              Logout
            </button>

            {/* Employees section */}
            <h2 style={{ textAlign: "left" }}>
              Employees Under Your Supervision:
            </h2>

            {/* Add employee button */}
            <button
              onClick={() => setShowModal(true)}
              className={styles.addEmployeeButton}
            >
              + Add Employee
            </button>

            {/* Display employee table if employees exist */}
            {employees.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Username</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, index) => (
                    <tr key={index}>
                      <td>{emp.email}</td>
                      <td>{emp.firstName}</td>
                      <td>{emp.lastName}</td>
                      <td>{emp.username}</td>
                      <td>
                        <button
                          onClick={() => handleOpenEdit(emp.email)}
                          className={styles.editButton}
                        >
                          ✏️ Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No employees found.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal for adding new employee */}
      {showModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2>Add Employee</h2>
            <form onSubmit={handleAddEmployee}>
              <label>Email:</label>
              <input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
              <label>Username:</label>
              <input
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
              />
              <label>Password:</label>
              <input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
              <label>First Name:</label>
              <input
                name="firstName"
                type="text"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
              <label>Middle Name:</label>
              <input
                name="middleName"
                type="text"
                value={formData.middleName}
                onChange={handleChange}
              />
              <label>Last Name:</label>
              <input
                name="lastName"
                type="text"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
              <label>Year of Birth:</label>
              <input
                name="yearOfBirth"
                type="number"
                value={formData.yearOfBirth}
                onChange={handleChange}
                required
              />
              <button type="submit" className={styles.registerButton}>
                Submit
              </button>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal for editing an existing employee */}
      {showEditModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalBox}>
            <h2 className={styles.editTitle}>Edit Employee</h2>
            <form onSubmit={handleUpdateEmployee}>
              <label>New Username:</label>
              <input
                type="text"
                name="newUsername"
                value={editData.newUsername}
                onChange={handleEditChange}
              />
              <label>New Password:</label>
              <input
                type="password"
                name="newPassword"
                value={editData.newPassword}
                onChange={handleEditChange}
              />
              <button type="submit" className={styles.registerButton}>
                Submit Changes
              </button>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteEmployee}
                className={styles.deleteButton}
              >
                Delete Employee
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Render footer */}
      <Footer />
    </>
  );
};

// Exporting SupervisorHomepage component
export default SupervisorHomepage;
