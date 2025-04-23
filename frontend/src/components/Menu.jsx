import React from 'react';
import { Link } from 'react-router-dom';
import styles from '../styles/SupervisorHomepage.module.css';

// This is the navigation menu for the visitor homepages
const Menu = () => {
  return (
    <div className={styles.menu}>
        <p><Link to="/visitor-homepage">Home</Link></p>
        <p><Link to="/browse-artists">Artists Search</Link></p>
        <p><Link to="/browse-artifacts">Artifact Search</Link></p>
        <p><Link to="/browse-events">Event Search</Link></p>
        <p><Link to="/browse-exhibits">Exhibit Search</Link></p>
        <p><Link to="/browse-museums">Museum Search</Link></p>
        <p><Link to="/browse-visitors">Visitors Search</Link></p>
    </div>
  );
};

export default Menu;
