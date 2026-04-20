/**
 * In-memory store for test mode sessions.
 * Data is stored per session token and expires automatically.
 */

const sessions = new Map();

function getSession(token) {
  const session = sessions.get(token);
  if (!session) return { vinyls: [] };
  if (Date.now() > session.expiresAt) {
    sessions.delete(token);
    return { vinyls: [] };
  }
  return session;
}

function initSession(token, expiresAt) {
  if (!sessions.has(token)) {
    // Pre-populate with Metallica - The Black Album as demo
    sessions.set(token, {
      nextId: 2,
      expiresAt,
      vinyls: [{
        id: 1,
        discogs_id: '6495',
        master_id: '6495',
        title: 'Metallica - Master Of Puppets',
        artist: 'Metallica',
        year: 1986,
        genre: 'Rock',
        cover_url: 'https://i.discogs.com/92G75VZzdW9SCXwRh2huoW48W-9yCm1fw4o0uMm3rJg/rs:fit/g:sm/q:90/h:600/w:600/czM6Ly9kaXNjb2dz/LWRhdGFiYXNlLWlt/YWdlcy9SLTE1NDk2/MzYtMTc1MzUzMTI0/Ny00OTA5LmpwZWc.jpeg',
        discogs_rating: null,
        discogs_rating_count: null,
        added_at: new Date().toISOString(),
      }]
    });
  }
}

function getVinyls(token, search = '') {
  const session = getSession(token);
  if (!search) return session.vinyls;
  const term = search.toLowerCase();
  return session.vinyls.filter(
    (v) => v.artist.toLowerCase().includes(term) || v.title.toLowerCase().includes(term)
  );
}

function addVinyl(token, vinylData) {
  const session = getSession(token);
  // Duplicate check
  if (vinylData.discogs_id && session.vinyls.find(v => v.discogs_id === vinylData.discogs_id)) {
    return { error: 'Vinyl already in test collection', code: 409 };
  }
  if (vinylData.master_id && session.vinyls.find(v => v.master_id === vinylData.master_id)) {
    return { error: 'Vinyl already in test collection (same master)', code: 409 };
  }
  const vinyl = {
    ...vinylData,
    id: session.nextId++,
    added_at: new Date().toISOString(),
  };
  session.vinyls.push(vinyl);
  return { vinyl };
}

function removeVinyl(token, id) {
  const session = getSession(token);
  const idx = session.vinyls.findIndex(v => v.id === id);
  if (idx === -1) return false;
  session.vinyls.splice(idx, 1);
  return true;
}

function removeVinylByDiscogsId(token, discogsId) {
  const session = getSession(token);
  const idx = session.vinyls.findIndex(v => v.discogs_id === discogsId);
  if (idx === -1) return false;
  session.vinyls.splice(idx, 1);
  return true;
}

function getDiscogsIds(token) {
  const session = getSession(token);
  return new Set(session.vinyls.map(v => v.discogs_id).filter(Boolean));
}

function getMasterIds(token) {
  const session = getSession(token);
  return new Set(session.vinyls.map(v => v.master_id).filter(Boolean));
}

// Cleanup expired sessions every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, session] of sessions.entries()) {
    if (now > session.expiresAt) sessions.delete(token);
  }
}, 60 * 60 * 1000);

module.exports = { initSession, getVinyls, addVinyl, removeVinyl, removeVinylByDiscogsId, getDiscogsIds, getMasterIds };
