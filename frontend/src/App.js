import React from 'react';
import { BrowserRouter, Routes, Route, NavLink } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import Scanner from './pages/Scanner';
import Search from './pages/Search';
import Settings from './pages/Settings';
import AlbumDetail from './pages/AlbumDetail';
import Discography from './pages/Discography';
import Login from './pages/Login';
import Help from './pages/Help';
import { VERSION, BUILD_DATE } from './components/Footer';

function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="nav-icons-row">
        <NavLink to="/" end className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label="Collection">
          <span className="nav-icon">🎵</span>
          <span>Collection</span>
        </NavLink>
        <NavLink to="/scanner" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label="Scanner">
          <span className="nav-icon">📷</span>
          <span>Scanner</span>
        </NavLink>
        <NavLink to="/search" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label="Recherche">
          <span className="nav-icon">🔍</span>
          <span>Recherche</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`} aria-label="Paramètres">
          <span className="nav-icon">⚙️</span>
          <span>Réglages</span>
        </NavLink>
      </div>
      <div className="nav-copyright">
        CLHV-Solutions · All rights reserved · {BUILD_DATE} · v{VERSION}
      </div>
    </nav>
  );
}

function AppContent() {
  const { isAuthenticated, auth } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <BrowserRouter basename="/vinyl-collection">
      <div className="app">
        {auth?.mode === 'test' && (
          <div style={{
            background: '#ff9800',
            color: '#000',
            textAlign: 'center',
            padding: '4px',
            fontSize: '0.75rem',
            fontWeight: 700,
            position: 'sticky',
            top: 0,
            zIndex: 200,
          }}>
            🧪 MODE TEST — Les données ne sont pas sauvegardées
          </div>
        )}
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scanner" element={<Scanner />} />
          <Route path="/search" element={<Search />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/help" element={<Help />} />
          <Route path="/album/:id" element={<AlbumDetail />} />
          <Route path="/discography/:artist" element={<Discography />} />
        </Routes>
        <BottomNav />
      </div>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
