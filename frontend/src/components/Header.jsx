import React from 'react';
import styles from '../styles/Header.module.css';

// This is the header of the whole application
const Header = () => {
  return (
    <header className={styles.header}>
      <p>MuseoTrack</p>
    </header>
  );
};

export default Header;
