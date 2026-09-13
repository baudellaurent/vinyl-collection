import React, { createContext, useContext, useState, useEffect } from 'react';

const AUTH_KEY = 'vinyl_auth';
const AuthContext = createContext(null);

function decodeJwtPayload(token) {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(atob(base64));
}

// Lets a device without a keyboard (kiosk touchscreen) authenticate from a
// URL generated elsewhere, e.g. https://.../vinyl-collection/?autologin=<jwt>
function consumeAutologinParam() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('autologin');
  if (!token) return null;

  try {
    const payload = decodeJwtPayload(token);
    const authData = { token, mode: payload.mode, expiresAt: payload.exp * 1000 };
    localStorage.setItem(AUTH_KEY, JSON.stringify(authData));
    params.delete('autologin');
    const cleanUrl = window.location.pathname + (params.toString() ? `?${params}` : '') + window.location.hash;
    window.history.replaceState({}, '', cleanUrl);
    return authData;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(() => {
    const fromUrl = consumeAutologinParam();
    if (fromUrl) return fromUrl;

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
    const match = /^(\d+)([hd])$/.exec(expiresIn);
    const msPerUnit = { h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
    const durationMs = match ? Number(match[1]) * msPerUnit[match[2]] : 24 * 60 * 60 * 1000;
    const expiresAt = Date.now() + durationMs;
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
