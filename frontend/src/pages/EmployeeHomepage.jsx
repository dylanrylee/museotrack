import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/SupervisorHomepage.module.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import EmployeeMenu from "../components/EmployeeMenu";
import api from "../api/client";

const EmployeeHomepage = () => {
  const [username, setUsername] = useState("");
  const [museum, setMuseum] = useState("");
  const [museumAddress, setMuseumAddress] = useState("");
  const [supervisorEmail, setSupervisorEmail] = useState("");
  const [employees, setEmployees] = useState([]);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const email = localStorage.getItem("email");

  // Step 1: Fetch current employee info
  useEffect(() => {
    if (!email) {
      setError("Email not provided.");
      return;
    }

    const fetchEmployeeInfo = async () => {
      try {
        const res = await api.get("/get-employee-info/", {
          params: { email },
        });

        setUsername(res.data.username);
        setMuseum(res.data.museumName);
        setMuseumAddress(res.data.museumAddress);
        setSupervisorEmail(res.data.supervisorEmail);

        localStorage.setItem("museumAddress", res.data.museumAddress);
      } catch (err) {
        console.error("Error loading employee info:", err);
        setError(
          err.response?.data?.message || "Failed to load employee info."
        );
      }
    };

    fetchEmployeeInfo();
  }, [email]);

  // Step 2: Fetch other employees once supervisorEmail is available
  useEffect(() => {
    if (!supervisorEmail) return;

    const fetchEmployees = async () => {
      try {
        const res = await api.get("/get-supervisor-employees/", {
          params: { email: supervisorEmail },
        });

        setEmployees(res.data.employees);
      } catch (err) {
        console.error("Error fetching employees:", err);
        setError(
          err.response?.data?.message || "Failed to fetch employees list."
        );
      }
    };

    console.log("Fetching employees using supervisorEmail:", supervisorEmail);
    fetchEmployees();
  }, [supervisorEmail]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <>
      <Header />
      <EmployeeMenu />

      <div className={styles.main}>
        {error ? (
          <p style={{ color: "red" }}>{error}</p>
        ) : (
          <div>
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
            <p>
              Supervisor: <strong>{supervisorEmail}</strong>
            </p>

            <button onClick={handleLogout} className={styles.signOutButton}>
              Logout
            </button>

            <h2 style={{ textAlign: "left" }}>
              Other Employees Under Your Supervisor:
            </h2>

            {employees.length > 0 ? (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>First Name</th>
                    <th>Last Name</th>
                    <th>Username</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp, index) => (
                    <tr key={index}>
                      <td>{emp.email}</td>
                      <td>{emp.firstName}</td>
                      <td>{emp.lastName}</td>
                      <td>{emp.username}</td>
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

      <Footer />
    </>
  );
};

export default EmployeeHomepage;
