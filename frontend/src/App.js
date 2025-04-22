import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterAccount from './pages/RegisterAccount';
import VisitorHomepage from './pages/VisitorHomepage';
import BrowseArtifacts from './pages/BrowseArtifacts';
import BrowseEvents from './pages/BrowseEvents';
import BrowseExhibits from './pages/BrowseExhibits';
import BrowseMuseums from './pages/BrowseMuseums';
import BrowseVisitors from './pages/BrowseVisitors';
import BrowseArtists from './pages/BrowseArtists';
import SupervisorLogin from './pages/SupervisorLogin';
import SupervisorRegister from './pages/SupervisorRegister';
import SupervisorHomepage from './pages/SupervisorHomepage';
import ManageArtifacts from './pages/ManageArtifacts';
import ManageExhibits from './pages/ManageExhibits';
import ManageEvents from './pages/ManageEvents';
import ManageArtists from './pages/ManageArtists';
import EmployeeHomepage from './pages/EmployeeHomepage';
import EditArtifacts from './pages/EditArtifacts';
import EditEvents from './pages/EditEvents';
import EditExhibits from './pages/EditExhibits';
import LogsForEdits from './pages/LogsForEdits';
import EmployeeArtists from './pages/EmployeeArtists';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/register-visitor" element={<RegisterAccount />} />
        <Route path="/visitor-homepage" element={<VisitorHomepage />} />
        <Route path="/browse-artists" element={<BrowseArtists />} />
        <Route path="/browse-artifacts" element={<BrowseArtifacts />} />
        <Route path="/browse-events" element={<BrowseEvents />} />
        <Route path="/browse-exhibits" element={<BrowseExhibits />} />
        <Route path="/browse-museums" element={<BrowseMuseums />} />
        <Route path="/browse-visitors" element={<BrowseVisitors />} />
        <Route path="/supervisor-login" element={<SupervisorLogin />} />
        <Route path="/supervisor-register" element={<SupervisorRegister />} />
        <Route path="/supervisor-homepage" element={<SupervisorHomepage />} />
        <Route path="/manage-artifacts" element={<ManageArtifacts />} />
        <Route path="/manage-artists" element={<ManageArtists />} />
        <Route path="/manage-exhibits" element={<ManageExhibits />} />
        <Route path="/manage-events" element={<ManageEvents />} />
        <Route path="/employee-homepage" element={<EmployeeHomepage />} />
        <Route path="/edit-artifacts" element={<EditArtifacts />} />
        <Route path="/edit-events" element={<EditEvents />} />
        <Route path="/edit-exhibits" element={<EditExhibits />} />
        <Route path="/logs-edits" element={<LogsForEdits />} />
        <Route path="/employee-artists" element={<EmployeeArtists />} />
      </Routes>
    </Router>
  );
}

export default App;
