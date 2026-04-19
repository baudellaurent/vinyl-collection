-- Vinyl Collection Database Schema
-- Migration 001: Initial setup

CREATE TABLE IF NOT EXISTS vinyls (
  id                   SERIAL PRIMARY KEY,
  barcode              VARCHAR(50),
  discogs_id           VARCHAR(50),
  musicbrainz_id       VARCHAR(50),
  title                VARCHAR(500) NOT NULL,
  artist               VARCHAR(500) NOT NULL,
  year                 INTEGER,
  genre                VARCHAR(200),
  cover_url            TEXT,
  discogs_rating       DECIMAL(3,2),
  discogs_rating_count INTEGER,
  notes                TEXT,
  added_at             TIMESTAMP DEFAULT NOW(),
  UNIQUE(barcode),
  UNIQUE(discogs_id)
);

CREATE INDEX IF NOT EXISTS idx_vinyls_artist  ON vinyls(artist);
CREATE INDEX IF NOT EXISTS idx_vinyls_barcode ON vinyls(barcode);
CREATE INDEX IF NOT EXISTS idx_vinyls_title   ON vinyls(title);
CREATE INDEX IF NOT EXISTS idx_vinyls_year    ON vinyls(year);
