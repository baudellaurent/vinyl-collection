import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Search from './pages/Search';
import AlbumDetail from './pages/AlbumDetail';
import Discography from './pages/Discography';

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <NavLink
        to="/"
        end
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        aria-label="Collection"
      >
        <span className="nav-icon">🎵</span>
        <span>Collection</span>
      </NavLink>
      <NavLink
        to="/scanner"
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        aria-label="Scanner"
      >
        <span className="nav-icon">📷</span>
        <span>Scanner</span>
      </NavLink>
      <NavLink
        to="/search"
        className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
        aria-label="Search"
      >
        <span className="nav-icon">🔍</span>
        <span>Recherche</span>
      </NavLink>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter basename="/vinyl-collection">
      <div className="app">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/search" element={<Search />} />
          <Route path="/album/:id" element={<AlbumDetail />} />
          <Route path="/discography/:artist" element={<Discography />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

export default App;
