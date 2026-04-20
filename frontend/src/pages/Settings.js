import React from 'react';
import { useSettings } from '../context/SettingsContext';
import { useAuth } from '../context/AuthContext';

const COUNTRIES = [
  { value: '', label: '🌍 Tous les pays' },
  { value: 'US', label: '🇺🇸 États-Unis' },
  { value: 'UK', label: '🇬🇧 Royaume-Uni' },
  { value: 'France', label: '🇫🇷 France' },
  { value: 'Germany', label: '🇩🇪 Allemagne' },
  { value: 'Canada', label: '🇨🇦 Canada' },
  { value: 'Australia', label: '🇦🇺 Australie' },
  { value: 'Japan', label: '🇯🇵 Japon' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: '🔤 Pertinence', description: 'Ordre retourné par Discogs' },
  { value: 'date', label: '📅 Date', description: 'Plus ancien en premier (originaux)' },
  { value: 'weighted', label: '❤️ Popularité', description: 'Classé par nombre de personnes qui veulent l\'album' },
];

function SettingRow({ label, description, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius)',
      padding: '16px',
      marginBottom: '12px',
    }}>
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{label}</div>
        {description && (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2 }}>
            {description}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

function Settings() {
  const { settings, updateSetting } = useSettings();
  const { auth, logout } = useAuth();

  return (
    <main className="page">
      <header className="page-header">
        <h1 className="page-title">⚙️ Paramètres</h1>
        <p className="page-subtitle">Personnalisez votre expérience de recherche</p>
      </header>

      <SettingRow
        label="Affichage de la collection"
        description="Grande vignette ou liste compacte"
      >
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { value: 'grid', label: '⊞ Grandes vignettes' },
            { value: 'list', label: '☰ Liste compacte' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateSetting('viewMode', opt.value)}
              style={{
                flex: 1,
                padding: '10px',
                borderRadius: 8,
                border: settings.viewMode === opt.value ? '2px solid var(--accent)' : '1px solid var(--border)',
                background: settings.viewMode === opt.value ? 'rgba(233, 69, 96, 0.15)' : 'var(--bg-secondary)',
                color: settings.viewMode === opt.value ? 'var(--accent)' : 'var(--text-primary)',
                fontWeight: settings.viewMode === opt.value ? 700 : 400,
                cursor: 'pointer',
                fontSize: '0.85rem',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </SettingRow>

      <SettingRow
        label="Pays d'édition par défaut"
        description="Filtre les résultats de recherche par pays de pressage"
      >
        <select
          className="form-input"
          value={settings.country}
          onChange={(e) => updateSetting('country', e.target.value)}
          style={{ cursor: 'pointer' }}
        >
          {COUNTRIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </SettingRow>

      <SettingRow
        label="Tri des résultats de recherche"
        description="Comment classer les albums trouvés sur Discogs"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SORT_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: settings.sortOrder === opt.value
                  ? 'rgba(233, 69, 96, 0.15)'
                  : 'var(--bg-secondary)',
                border: settings.sortOrder === opt.value
                  ? '1px solid var(--accent)'
                  : '1px solid var(--border)',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <input
                type="radio"
                name="sortOrder"
                value={opt.value}
                checked={settings.sortOrder === opt.value}
                onChange={() => updateSetting('sortOrder', opt.value)}
                style={{ accentColor: 'var(--accent)' }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{opt.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {opt.description}
                </div>
              </div>
            </label>
          ))}
        </div>
      </SettingRow>

      <div style={{
        marginTop: 24,
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        fontSize: '0.8rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        Les paramètres sont sauvegardés automatiquement sur cet appareil.
      </div>

      <button
        className="btn btn-full"
        onClick={logout}
        style={{
          marginTop: 16,
          background: 'transparent',
          border: '1px solid var(--border)',
          color: 'var(--text-muted)',
        }}
      >
        🔓 Se déconnecter {auth?.mode === 'test' ? '(mode test)' : ''}
      </button>
    </main>
  );
}

export default Settings;
