import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Pages.module.css';

const EmployeeMenu = () => {
  return (
    <div className={styles.menu}>
        <p><Link to="/employee-homepage">Home</Link></p>
        <p><Link to="/browse-artists">Browse Artists</Link></p>
        <p><Link to="/edit-artifacts">Edit Artifacts</Link></p>
        <p><Link to="/edit-events">Edit Events</Link></p>
        <p><Link to="/edit-exhibits">Edit Exhibits</Link></p>
    </div>
  );
};

export default EmployeeMenu;
