# 🎵 Vinyl Collection Manager

A Progressive Web App to manage your personal vinyl record collection. Scan barcodes, search Discogs, track your collection, and explore artist discographies ranked by community ratings.

## Features

- **Barcode scanning** via device camera (ZXing library)
- **Discogs & MusicBrainz integration** for album metadata
- **Collection management** — add, browse, remove vinyls
- **Artist discography ranking** by weighted Discogs rating
- **PWA** — installable on mobile, works offline for collection browsing
- **Dark theme**, mobile-first responsive design

---

## Prerequisites

- Docker & Docker Compose
- A domain name pointed at your server
- A Discogs account (for API token)

---

## Getting a Discogs API Token

1. Create a free account at [discogs.com](https://www.discogs.com)
2. Go to **Settings → Developers** → [https://www.discogs.com/settings/developers](https://www.discogs.com/settings/developers)
3. Click **Generate new token**
4. Copy the token — you'll use it as `DISCOGS_TOKEN`

---

## Local Development Setup

### 1. Clone and configure

```bash
git clone <your-repo>
cd vinyl-collection
cp .env.example .env
```

Edit `.env`:

```env
DB_PASSWORD=a_strong_password_here
DISCOGS_TOKEN=your_discogs_token
API_KEY=generate_a_random_string_here   # e.g. openssl rand -hex 32
DOMAIN=localhost
```

### 2. Run the database migration

```bash
docker compose up postgres -d
docker compose exec postgres psql -U vinyl_user -d vinyl_collection \
  -f /docker-entrypoint-initdb.d/001_init.sql
```

Or connect manually and run `backend/src/db/migrations/001_init.sql`.

### 3. Start all services

```bash
docker compose up --build
```

The app will be available at `http://localhost` (via Nginx).

### 4. Set the frontend API key

Create `frontend/.env.local`:

```env
REACT_APP_API_URL=http://localhost/api
REACT_APP_API_KEY=your_api_key_from_env
```

---

## Production Deployment on DigitalOcean

### 1. Create a Droplet

- Ubuntu 22.04 LTS, minimum 1 GB RAM (2 GB recommended)
- Enable SSH key authentication

### 2. Install Docker

```bash
ssh root@your-server-ip

# Install Docker
curl -fsSL https://get.docker.com | sh
systemctl enable docker

# Install Docker Compose plugin
apt-get install -y docker-compose-plugin
```

### 3. Upload the project

```bash
# From your local machine
scp -r vinyl-collection/ root@your-server-ip:/opt/vinyl-collection
```

Or use git:

```bash
ssh root@your-server-ip
git clone <your-repo> /opt/vinyl-collection
```

### 4. Configure environment

```bash
cd /opt/vinyl-collection
cp .env.example .env
nano .env   # Fill in all values, set DOMAIN=yourdomain.com
```

### 5. Set up HTTPS with Certbot

First, start Nginx with HTTP only to complete the ACME challenge:

```bash
# Temporarily comment out the HTTPS server block in nginx/nginx.conf
# and only keep the HTTP server with the certbot location block

docker compose up nginx -d

# Install certbot on the host
apt-get install -y certbot

certbot certonly --webroot \
  -w /var/lib/docker/volumes/vinyl-collection_certbot_www/_data \
  -d yourdomain.com \
  --email your@email.com \
  --agree-tos \
  --non-interactive
```

Then restore the full `nginx.conf` with the HTTPS server block and restart:

```bash
docker compose restart nginx
```

### 6. Run the database migration

```bash
docker compose up postgres -d
sleep 5  # Wait for postgres to be ready

docker compose exec postgres psql -U vinyl_user -d vinyl_collection << 'EOF'
$(cat backend/src/db/migrations/001_init.sql)
EOF
```

### 7. Start everything

```bash
docker compose up -d --build
```

### 8. Auto-renew SSL certificates

Add a cron job on the host:

```bash
crontab -e
# Add:
0 3 * * * certbot renew --quiet && docker compose -f /opt/vinyl-collection/docker-compose.yml restart nginx
```

---

## Environment Variables Reference

| Variable | Description |
|---|---|
| `DB_PASSWORD` | PostgreSQL password for `vinyl_user` |
| `DISCOGS_TOKEN` | Discogs personal access token |
| `API_KEY` | Secret key for frontend→backend authentication |
| `DOMAIN` | Your domain name (used in nginx.conf) |

---

## API Endpoints

All endpoints require the `x-api-key` header.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/health` | Health check (no auth) |
| `GET` | `/api/collection` | List collection (`?search=`) |
| `POST` | `/api/collection` | Add vinyl |
| `DELETE` | `/api/collection/:id` | Remove vinyl |
| `GET` | `/api/collection/check/:barcode` | Check if barcode in collection |
| `GET` | `/api/search/barcode/:barcode` | Search by barcode |
| `GET` | `/api/search/query?artist=&album=` | Search by text |
| `GET` | `/api/discography/:artistName` | Artist discography ranked |

---

## Project Structure

```
vinyl-collection/
├── docker-compose.yml
├── .env.example
├── nginx/nginx.conf
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js
│       ├── db/
│       │   ├── index.js
│       │   └── migrations/001_init.sql
│       ├── routes/
│       │   ├── collection.js
│       │   ├── search.js
│       │   └── discography.js
│       ├── services/
│       │   ├── discogs.js
│       │   └── musicbrainz.js
│       └── middleware/auth.js
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── public/
    │   ├── index.html
    │   └── manifest.json
    └── src/
        ├── index.js
        ├── App.js
        ├── components/
        │   ├── AlbumCard.js
        │   ├── BarcodeScanner.js
        │   ├── CollectionGrid.js
        │   ├── DiscographyRank.js
        │   └── SearchBar.js
        ├── pages/
        │   ├── Home.js
        │   ├── Scanner.js
        │   ├── Search.js
        │   ├── AlbumDetail.js
        │   └── Discography.js
        ├── services/api.js
        └── styles/App.css
```

---

## Troubleshooting

**Camera not working on iOS Safari**: Ensure the site is served over HTTPS. Camera access requires a secure context.

**Discogs rate limiting**: The free Discogs API allows 60 requests/minute. The backend rate limiter is set conservatively to stay within this.

**Database connection errors**: Check that `DB_PASSWORD` in `.env` matches what PostgreSQL was initialized with. If you change it, you need to recreate the postgres volume: `docker compose down -v && docker compose up -d`.

**CORS errors in development**: Set `REACT_APP_API_URL=http://localhost:3001` in `frontend/.env.local` and run the backend directly with `npm run dev`.
