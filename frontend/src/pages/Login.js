import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleEnter = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Veuillez entrer votre identifiant et mot de passe.');
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { username, password });
      login(data.token, data.mode, data.expiresIn);
    } catch (err) {
      setError(err.response?.data?.error || 'Identifiants incorrects.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTest = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/test');
      login(data.token, data.mode, data.expiresIn);
    } catch (err) {
      setError('Erreur lors de la connexion en mode test.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    window.location.href = 'about:blank';
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-primary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        padding: 32,
        width: '100%',
        maxWidth: 360,
        boxShadow: 'var(--shadow)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: '4rem', marginBottom: 8 }}>🎵</div>
          <h1 style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Ma Collection Vinyl
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
            CLHV-Solutions
          </p>
        </div>

        <form onSubmit={handleEnter} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Identifiant</label>
            <input
              id="username"
              type="text"
              className="form-input"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Votre identifiant"
              autoComplete="username"
              autoCapitalize="none"
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="password">Mot de passe</label>
            <input
              id="password"
              type="password"
              className="form-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Votre mot de passe"
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="error-message" role="alert" style={{ marginBottom: 16 }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary btn-full"
            disabled={isLoading}
            style={{ marginBottom: 10 }}
          >
            {isLoading ? 'Connexion...' : '→ Entrer'}
          </button>
        </form>

        <button
          className="btn btn-secondary btn-full"
          onClick={handleTest}
          disabled={isLoading}
          style={{ marginBottom: 10 }}
        >
          🧪 Mode Test
        </button>

        <button
          className="btn btn-full"
          onClick={handleCancel}
          style={{
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          ✕ Annuler
        </button>

        <p style={{
          textAlign: 'center',
          fontSize: '0.65rem',
          color: 'var(--text-muted)',
          marginTop: 24,
        }}>
          La session personnelle est valide 24h.<br/>
          Le mode test est valide 2h et ne sauvegarde rien.
        </p>
      </div>
    </div>
  );
}

export default Login;
