import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/Pages.module.css';

const SupervisorMenu = () => {
  return (
    <div className={styles.menu}>
        <p><Link to="/supervisor-homepage">Home</Link></p>
        <p><Link to="/manage-artists">Manage Artists</Link></p>
        <p><Link to="/manage-artifacts">Manage Artifacts</Link></p>
        <p><Link to="/manage-events">Manage Events</Link></p>
        <p><Link to="/manage-exhibits">Manage Exhibits</Link></p>
=    </div>
  );
};

export default SupervisorMenu;
