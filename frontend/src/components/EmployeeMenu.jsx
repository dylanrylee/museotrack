import React from 'react'; // Import React to use JSX components
import { Link } from 'react-router-dom'; // for client-side routing
import styles from '../styles/SupervisorHomepage.module.css'; 

const EmployeeMenu = () => {
  return (
    // Main container div styled with CSS module class 'menu'
    <div className={styles.menu}>
        {/* Each paragraph contains a Link component navigating to a specific route */}
        <p><Link to="/employee-homepage">Home</Link></p>
        <p><Link to="/employee-artists">Browse Artists</Link></p>
        <p><Link to="/edit-artifacts">Edit Artifacts</Link></p>
        <p><Link to="/edit-events">Edit Events</Link></p>
        <p><Link to="/edit-exhibits">Edit Exhibits</Link></p>
    </div>
  );
};

export default EmployeeMenu; 