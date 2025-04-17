import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Menu from '../components/Menu';
import styles from '../styles/Pages.module.css';

const BrowseExhibits = () => {
  return (
    <>
      <Header />
      <Menu />

      <div className={styles.main}>
        <form action="PLACEHOLDER" method="GET">
          <p>
            Search Exhibits
            <input className={styles.searchInput} type="text" />
          </p>
        </form>
        <p>This is placeholder text for the exhibit body.</p>
      </div>

      <Footer />
    </>
  );
};

export default BrowseExhibits;
