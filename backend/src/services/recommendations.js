const discogs = require('./discogs');

// Recency decay: weight halves every ~231 days
const RECENCY_LAMBDA = 0.003;

function decayWeight(addedAt) {
  const daysAgo = (Date.now() - new Date(addedAt).getTime()) / (1000 * 60 * 60 * 24);
  return Math.exp(-RECENCY_LAMBDA * Math.max(0, daysAgo));
}

function buildTasteProfile(vinyls) {
  const genreWeights = {};
  const decadeWeights = {};
  const ratingCounts = [];
  const artistCounts = {};
  let totalWeight = 0;

  for (const v of vinyls) {
    const w = v.added_at ? decayWeight(v.added_at) : 1;
    totalWeight += w;

    if (v.genre) genreWeights[v.genre] = (genreWeights[v.genre] || 0) + w;

    if (v.year) {
      const decade = Math.floor(v.year / 10) * 10;
      decadeWeights[decade] = (decadeWeights[decade] || 0) + w;
    }

    if (v.discogs_rating_count) ratingCounts.push(Number(v.discogs_rating_count));

    if (v.artist) artistCounts[v.artist] = (artistCounts[v.artist] || 0) + 1;
  }

  const genres = Object.entries(genreWeights)
    .sort((a, b) => b[1] - a[1])
    .map(([name, weight]) => ({ name, pct: Math.round((weight / totalWeight) * 100) }));

  const topDecade = Object.entries(decadeWeights)
    .sort((a, b) => b[1] - a[1])
    .map(([d]) => Number(d))[0] || null;

  ratingCounts.sort((a, b) => a - b);
  const medianRatingCount = ratingCounts.length
    ? ratingCounts[Math.floor(ratingCounts.length / 2)]
    : 1000;

  const popularityTier = medianRatingCount >= 3000 ? 'mainstream' : 'culte';

  const topArtists = Object.entries(artistCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([name, count]) => ({ name, count }));

  return { genres, topDecade, medianRatingCount, popularityTier, topArtists };
}

function scoreForDiscovery(item, profile) {
  // Genre: how well does this album's genre match the collection profile?
  let genreScore = 0.1;
  if (item.genre && profile.genres.length > 0) {
    const idx = profile.genres.findIndex((g) => g.name === item.genre);
    if (idx === 0) genreScore = 1.0;
    else if (idx === 1) genreScore = 0.7;
    else if (idx === 2) genreScore = 0.4;
    else if (idx > 2) genreScore = 0.2;
  }

  // Era: proximity to dominant decade (each decade of distance costs 0.3)
  let eraScore = 0.5;
  if (item.year && profile.topDecade) {
    const itemDecade = Math.floor(item.year / 10) * 10;
    const distDecades = Math.abs(itemDecade - profile.topDecade) / 10;
    eraScore = Math.max(0, 1 - distDecades * 0.3);
  }

  // Popularity fit: log-distance between album want count and collection median
  let popularityFit = 0.5;
  if (item.want && profile.medianRatingCount) {
    const logWant = Math.log(Number(item.want) + 1);
    const logMedian = Math.log(profile.medianRatingCount + 1);
    popularityFit = Math.max(0, 1 - Math.abs(logWant - logMedian) / 5);
  }

  return 0.4 * genreScore + 0.3 * eraScore + 0.3 * popularityFit;
}

async function getRecommendations(vinyls) {
  if (!vinyls.length) {
    return { profile: null, byArtist: [], byGenre: [], byDiscovery: [] };
  }

  const profile = buildTasteProfile(vinyls);

  const ownedMasterIds = new Set(vinyls.map((v) => v.master_id).filter(Boolean));
  const ownedDiscogsIds = new Set(vinyls.map((v) => v.discogs_id).filter(Boolean));
  const ownedArtists = new Set(vinyls.map((v) => v.artist).filter(Boolean));

  function isOwned(release) {
    return ownedMasterIds.has(release.id) || ownedDiscogsIds.has(release.id);
  }

  // Section 1: complete your artists (artists with ≥2 albums, max 3)
  const section1Artists = profile.topArtists.filter((a) => a.count >= 2).slice(0, 3);
  const byArtistPromises = section1Artists.map(async ({ name, count }) => {
    try {
      const { releases } = await discogs.getArtistMasters(name, 1, 'weighted');
      return releases
        .filter((r) => !isOwned(r) && r.cover_url)
        .slice(0, 4)
        .map((r) => ({
          ...r,
          artist: name,
          reason: `Tu possèdes ${count} album${count > 1 ? 's' : ''} de ${name}`,
          section: 'byArtist',
        }));
    } catch {
      return [];
    }
  });

  // Section 2: top genres (top 2, max 5 per genre)
  const section2Genres = profile.genres.slice(0, 2);
  const byGenrePromises = section2Genres.map(async ({ name: genre, pct }) => {
    try {
      const { releases } = await discogs.searchByGenreAndEra(genre, null, profile.popularityTier);
      return releases
        .filter((r) => !isOwned(r) && r.cover_url)
        .slice(0, 5)
        .map((r) => ({
          ...r,
          reason: `${genre} représente ${pct}% de ta collection`,
          section: 'byGenre',
        }));
    } catch {
      return [];
    }
  });

  // Section 3: discovery — new artists, scored against taste profile
  const discoveryPromise = (async () => {
    try {
      const topGenre = profile.genres[0]?.name;
      const { releases } = await discogs.searchByGenreAndEra(
        topGenre,
        profile.topDecade,
        profile.popularityTier
      );
      const decade = profile.topDecade;
      return releases
        .filter((r) => !isOwned(r) && r.cover_url && r.artist && !ownedArtists.has(r.artist))
        .map((r) => ({
          ...r,
          _score: scoreForDiscovery(r, profile),
          reason: `Dans le style ${topGenre || ''} des années ${decade} que tu collectionnes`,
          section: 'byDiscovery',
        }))
        .sort((a, b) => b._score - a._score)
        .slice(0, 8)
        .map(({ _score, ...r }) => r);
    } catch {
      return [];
    }
  })();

  const [byArtistNested, byGenreNested, byDiscovery] = await Promise.all([
    Promise.all(byArtistPromises),
    Promise.all(byGenrePromises),
    discoveryPromise,
  ]);

  return {
    profile: {
      genres: profile.genres.slice(0, 4),
      topDecade: profile.topDecade,
      popularityTier: profile.popularityTier,
    },
    byArtist: byArtistNested.flat(),
    byGenre: byGenreNested.flat(),
    byDiscovery,
  };
}

module.exports = { getRecommendations };
