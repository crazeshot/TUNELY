# 🎵 Tunely — Modern Web Music Streaming Platform

Tunely is a full-stack music streaming web application built with a high-performance **Django REST Framework** backend and a **React 19 + Vite + Tailwind CSS + Three.js** frontend.

![Tunely Architecture](https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1200&auto=format&fit=crop&q=80)

---

## ✨ Features

- 🌌 **Three.js Liquid Ether Background**: Fluid fluid-dynamics shader animation reacting dynamically to cursor movement and viewport resize.
- 🪟 **Frosted Glass UI (Glassmorphism)**: 3-column layout (Collapsible Sidebar, Dynamic Content Feed, Real-time Queue panel).
- 🎶 **Dependable Audio Engine**:
  - HTML5 Audio streaming with royalty-free music CDN sources.
  - Built-in Web Audio API synthesizer fallback for guaranteed audio feedback anywhere.
  - Shuffle, Repeat (Off, All, One), Seeking, and Volume controls with Mute toggle.
- 📻 **Interactive Views**:
  - **Home**: Featured Hero track, Recommended, Recently Played, Genre filter pills, and Top Artists.
  - **Search**: Multi-entity instant search with Genre discovery tiles.
  - **Library**: Custom Playlists with Cover art, Liked Songs hub, and Listening History.
- 🎛️ **Full Visualizer & Lyrics Modal**: Spinning vinyl record animation synced to audio playback, live spectrum equalizer, and full lyrics.
- 📂 **Playlist & Queue Management**: Create custom playlists, Add/Remove tracks, Play Next, and Clear Queue.
- 🚀 **Full-Stack API Integration**:
  - Full Django REST Framework API with models for Artists, Albums, Tracks, Playlists, and Favorites.
  - Auto-seeding CLI command (`python manage.py seed_music`).
  - Automated test suite with 100% endpoint coverage.

---

## 🏗️ Architecture

```
TUNELY/
├── backend/                  # Django REST Framework API
│   ├── api/                  # Apps, Models, Serializers, Views, URLs, Admin, Tests
│   │   ├── management/       # seed_music command
│   │   ├── models.py         # Artist, Album, Track, Playlist, PlaylistItem, FavoriteTrack
│   │   ├── serializers.py    # DRF Serializers
│   │   ├── views.py          # ViewSets & Search Endpoints
│   │   └── tests.py          # 13 Automated Test Cases
│   └── config/               # Settings, ASGI/WSGI, CORS & Root URLs
│
└── frontend/                 # React 19 + Vite Frontend
    └── src/
        ├── components/       # PlayerBar, Sidebar, RightPanel, MainContent, VisualizerModal, etc.
        ├── context/          # PlayerContext & usePlayer audio state engine
        ├── services/         # API client with fallback to local state
        ├── data/             # Rich catalog dataset & genres
        ├── LiquidEther.jsx   # Three.js Shader background
        └── index.css         # Glassmorphism design system & typography
```

---

## ⚡ Quick Start

### 1. Backend Setup
```bash
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py seed_music
python manage.py test
python manage.py runserver
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run lint
npm run build
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser!
