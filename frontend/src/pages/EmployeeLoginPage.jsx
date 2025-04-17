import React from 'react';
import styles from '../styles/Pages.module.css';

const EmployeeloginPage = () => {
  return (
    <>
      <Header />
      <Menu />

      <div id="main">
        <form action="PLACEHOLDER" method="GET">
          <p>
            <label htmlFor="visitorUsername">
              Username: <input id="visitorUsername" type="text" />
            </label>
          </p>
          <p>
            <label htmlFor="visitorPassword">
              Password: <input id="visitorPassword" type="text" />
            </label>
          </p>
          <p>
            <a href="/login"><i>Click here to sign in if you are a normal user</i></a>
          </p>
        </form>
        <p>This is placeholder text for the login body.</p>
      </div>
    </>
  );
};

export default EmployeeloginPage;
