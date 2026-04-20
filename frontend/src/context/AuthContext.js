import React, { createContext, useContext, useState, useEffect } from 'react';

const AUTH_KEY = 'vinyl_auth';
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    try {
      const stored = localStorage.getItem(AUTH_KEY);
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      // Check expiry
      if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
        localStorage.removeItem(AUTH_KEY);
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  });

  const login = (token, mode, expiresIn = '24h') => {
    const hours = expiresIn === '24h' ? 24 : 2;
    const expiresAt = Date.now() + hours * 60 * 60 * 1000;
    const authData = { token, mode, expiresAt };
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    setAuth(authData);
    // Always redirect to collection on login
    window.location.href = window.location.pathname.includes('/vinyl-collection')
      ? '/vinyl-collection/'
      : '/';
  };

  const logout = () => {
    localStorage.removeItem(AUTH_KEY);
    setAuth(null);
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, isAuthenticated: !!auth }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
