import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Home from './pages/Home';
import CasePage from './pages/CasePage';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Register from './pages/Register';
import CrashGame from './pages/CrashGame';
import Exchange from './pages/Exchange';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/case/:id" element={<CasePage />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="*" element={<Navigate to="/" />} />
        <Route path="/crash" element={<CrashGame />} />
        <Route path="/exchange" element={<Exchange />} />
      </Routes>
    </Router>
  );
}

export default App;