# Tunely Backend API

Robust Django REST Framework API powering the **Tunely** music streaming platform.

## Features
- **Catalog Management**: Artists, Albums, Tracks with high quality metadata, lyrics, and play counts.
- **Dynamic Endpoints**:
  - `GET /api/tracks/` — Filter by `genre`, `search`, or `artist`.
  - `GET /api/tracks/recommended/` — Top recommended tracks based on popularity.
  - `GET /api/tracks/recently-played/` — Fresh & recently added tracks.
  - `POST /api/tracks/<id>/like/` — Toggle favorite/like status.
  - `POST /api/tracks/<id>/play/` — Increment play count.
  - `GET /api/artists/` & `GET /api/artists/<id>/tracks/` — Artist profiles & discographies.
  - `GET /api/albums/` — Albums catalog.
  - `GET / POST / PUT / DELETE /api/playlists/` — Full playlist CRUD.
  - `POST /api/playlists/<id>/add-track/` & `POST /api/playlists/<id>/remove-track/` — Playlist item management.
  - `GET /api/search/?q=<query>` — Multi-category search (tracks, artists, albums, playlists).
  - `GET /api/genres/` — List of available genres with track counts.
  - `GET /api/health/` — Server health status and database metrics.
- **Database Seeder**: `python manage.py seed_music` command preloaded with realistic artists, albums, playlists, lyrics, and royalty-free audio streams.
- **Automated Tests**: 13 comprehensive unit tests covering all endpoints and business logic.

## Local Setup

1. Activate your virtual environment:
   ```bash
   .\.venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Copy environment configuration:
   ```bash
   copy .env.example .env
   ```
4. Run migrations:
   ```bash
   python manage.py migrate
   ```
5. Seed sample music database:
   ```bash
   python manage.py seed_music
   ```
6. Run the automated test suite:
   ```bash
   python manage.py test
   ```
7. Start the development server:
   ```bash
   python manage.py runserver
   ```