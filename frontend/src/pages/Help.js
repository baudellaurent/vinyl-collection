import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const sections = [
  {
    icon: '🎵',
    title: 'Ma Collection',
    content: `La page principale affiche tous vos vinyles classés par ordre alphabétique.

• Utilisez l'index A-Z pour filtrer rapidement par artiste
• La barre de recherche filtre en temps réel par artiste ou titre
• Cliquez sur un album pour voir ses détails
• Dans les Réglages, choisissez entre grandes vignettes ou liste compacte`,
  },
  {
    icon: '📷',
    title: 'Scanner un vinyle',
    content: `Scannez le code-barres d'un vinyle avec la caméra de votre appareil.

• Pointez la caméra vers le code-barres au dos du disque
• L'album est automatiquement identifié via Discogs
• Si l'album est déjà dans votre collection, un badge ✓ s'affiche
• Bouton "+ Ajouter" pour l'ajouter, "🗑 Retirer" pour le supprimer`,
  },
  {
    icon: '🔍',
    title: 'Recherche',
    content: `Recherchez un album par artiste et/ou titre.

• Entrez uniquement l'artiste → redirige vers sa discographie complète
• Entrez artiste + album → recherche sur Discogs
• Boutons Précédent / Suivant pour parcourir les résultats
• Le pays et le tri sont configurables dans les Réglages`,
  },
  {
    icon: '🎶',
    title: 'Discographie',
    content: `Explorez la discographie complète d'un artiste.

• Classement par popularité (nombre de personnes qui veulent l'album), date ou pertinence
• Les albums de votre collection sont marqués ✓
• Cliquez sur un album pour l'ajouter ou le retirer de votre collection
• Boutons Précédent / Suivant pour naviguer`,
  },
  {
    icon: '⚙️',
    title: 'Réglages',
    content: `Personnalisez votre expérience.

• Affichage : grandes vignettes ou liste compacte
• Pays d'édition par défaut pour les recherches (US par défaut)
• Tri des résultats : Popularité / Date / Pertinence
• Bouton de déconnexion`,
  },
  {
    icon: '🔐',
    title: 'Connexion & Sécurité',
    content: `Votre collection est protégée par un identifiant et mot de passe.

• Session personnelle valide 24h
• Mode Test : toutes les fonctionnalités disponibles, rien n'est sauvegardé
• La déconnexion est disponible dans les Réglages
• En cas d'expiration, vous serez redirigé vers la page de connexion`,
  },
];

function HelpSection({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: 'var(--bg-card)',
      borderRadius: 'var(--radius)',
      marginBottom: 10,
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: 'none',
          border: 'none',
          color: 'var(--text-primary)',
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '1.3rem' }}>{section.icon}</span>
        <span style={{ flex: 1, fontWeight: 600, fontSize: '0.95rem' }}>{section.title}</span>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div style={{
          padding: '0 16px 16px',
          color: 'var(--text-secondary)',
          fontSize: '0.85rem',
          lineHeight: 1.6,
          whiteSpace: 'pre-line',
          borderTop: '1px solid var(--border)',
          paddingTop: 12,
        }}>
          {section.content}
        </div>
      )}
    </div>
  );
}

function Help() {
  const navigate = useNavigate();
  return (
    <main className="page">
      <button className="btn btn-secondary" onClick={() => navigate(-1)} style={{ marginBottom: 20 }}>
        ← Retour
      </button>

      <header className="page-header">
        <h1 className="page-title">❓ Guide d'utilisation</h1>
        <p className="page-subtitle">Ma Collection Vinyl · CLHV-Solutions</p>
      </header>

      {sections.map((s) => (
        <HelpSection key={s.title} section={s} />
      ))}

      <div style={{
        marginTop: 24,
        padding: '12px 16px',
        background: 'var(--bg-secondary)',
        borderRadius: 'var(--radius)',
        fontSize: '0.75rem',
        color: 'var(--text-muted)',
        textAlign: 'center',
      }}>
        Données fournies par <a href="https://www.discogs.com" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>Discogs</a>
        {' · '}
        <a href="https://github.com/baudellaurent/vinyl-collection" target="_blank" rel="noreferrer" style={{ color: 'var(--accent)' }}>GitHub</a>
      </div>
    </main>
  );
}

export default Help;
