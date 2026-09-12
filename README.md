<div align="center">

# 🎵 Tunely
### Next-Generation Spatial Music Streaming & Audiophile Platform

[![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Django](https://img.shields.io/badge/Django-6.0-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.djangoproject.com/)
[![Tauri](https://img.shields.io/badge/Tauri-v2-FFC131?style=for-the-badge&logo=tauri&logoColor=black)](https://tauri.app/)
[![Python](https://img.shields.io/badge/Python-3.12+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![Platform](https://img.shields.io/badge/Platform-Web%20%7C%20Windows%20%7C%20macOS-blue?style=for-the-badge)](https://github.com/crazeshot/TUNELY)

<br />

**Tunely** is an enterprise-grade music streaming experience combining on-demand catalog streaming, audiophile-grade Web Audio DSP processing, synchronized lyrics, and a responsive Three.js fluid-shader interface. Available as a **Web Application**, a **Windows Desktop App (.exe / .msi)**, and a **macOS Desktop App (.dmg / .app)**.

</div>

---

## ✨ Features & Highlights

### 🎶 Streaming & Discovery Engine
- **Vast On-Demand Catalog**: Stream official songs, albums, and artists via high-performance YouTube Music integration (`ytmusicapi` & `yt-dlp`).
- **Strict Audio Filtering**: Algorithms filter out non-music video clips, shorts, podcasts, reaction videos, and ringtones.
- **Smart Radio & Daily Mixes**: Dynamic algorithm generating similarity-based queues tailored to any selected track or mood.
- **Synchronized Lyrics**: Live scrolling synchronized `.LRC` lyrics with timestamps and karaoke-style highlight tracking.

### 🎛️ Audiophile DSP Studio
- **10-Band Graphic Equalizer**: Custom fine-tuning across 32Hz–16kHz with built-in presets (*Bass Boost*, *Electronic*, *Vocal Clarity*, *Chill*, *Rock*, *Acoustic*).
- **3D Spatial Audio**: Stereo-panner soundstage virtualization for immersive directional listening.
- **Studio Limiter & Compressor**: Master dynamic compressor preventing distortion and volume clipping.
- **Creative Playback Modes**: Instant toggle for **Slowed + Reverb** (impulse convolver reverb) and **Nightcore** (speed + pitch scaling).
- **DJ Crossfade**: Seamless track transitions with customizable crossfade timing.

### 🌌 Visual Design & Experience
- **Three.js Liquid Ether Shader**: GPU-accelerated fluid-dynamic background reacting to cursor physics and window movement.
- **Glassmorphic Monochromatic Interface**: Sleek, modern 3-column layout (Collapsible Navigation, Dynamic Feed, Real-time Queue panel).
- **Audio Canvas Visualizers**: Dynamic real-time FFT frequency bars, waveforms, and rotating vinyl art animations.

### 👤 Accounts, Library & Analytics
- **Authentication**: Token-based login and registration system.
- **Personalized Library**: Custom user playlists, favorites/liked tracks, and chronological listening history.
- **Tunely Wrapped**: Year-in-review style listening analytics with genre distributions, top tracks, and total streaming minutes.

### 🖥️ Native Desktop Apps (Tauri v2)
- **Cross-Platform Desktop Clients**: Native Windows (`.exe` and NSIS/MSI installers) and macOS (`.dmg` and `.app` bundles).
- **Ultra-Lightweight & Fast**: Built with Rust and native OS WebViews (WebView2 on Windows, WebKit on macOS) for minimal RAM usage.

---

## 🏗️ Architecture

```
TUNELY/
├── .github/
│   └── workflows/
│       └── build.yml               # Multi-platform CI/CD (Windows & macOS builders)
│
├── backend/                        # Django REST Framework API
│   ├── api/                        # Apps, Models, Serializers, Views, URLs
│   │   ├── models.py               # Track, Playlist, FavoriteTrack, History, UserProfile
│   │   ├── ytmusic_service.py      # YouTube Music & yt-dlp audio streaming engine
│   │   ├── views.py                # REST endpoints, Auth, DSP & Lyrics APIs
│   │   └── urls.py                 # API Routing
│   ├── config/                     # Django Settings, CORS, WSGI/ASGI
│   ├── run_server.py               # Desktop backend runner & migration manager
│   ├── tunely_backend.spec         # PyInstaller specification for desktop packaging
│   └── requirements.txt            # Python dependencies
│
└── frontend/                       # React 19 + Vite Frontend
    ├── src/
    │   ├── components/             # PlayerBar, Sidebar, MainContent, Modals, Visualizer
    │   ├── context/                # PlayerContext, AuthContext, Audio DSP engine
    │   ├── services/               # API client (with auto-retry), Lyrics, Offline storage
    │   ├── LiquidEther.jsx         # Three.js Shader background
    │   ├── App.jsx                 # Layout and keyboard hotkeys engine
    │   └── index.css               # Tailwind & Glassmorphic styling
    │
    └── src-tauri/                  # Tauri v2 Desktop Shell (Rust)
        ├── Cargo.toml              # Rust dependencies & devtools feature
        ├── tauri.conf.json         # Window, bundle, and sidecar configuration
        └── src/
            ├── main.rs             # Windows subsystem launcher
            └── lib.rs              # Native lifecycle & child process manager
```

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
- **Node.js**: v20 or v22
- **Python**: v3.12 or v3.13
- **Rust**: Latest stable (`rustup default stable`) *(only needed if running Tauri desktop locally)*

### 2. Backend Setup
```bash
cd backend
python -m venv .venv

# Windows
.\.venv\Scripts\activate
# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```
*API will be running on `http://127.0.0.1:8000/api/`*

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*Web App will be available at `http://localhost:5173`*

### 4. Run as Desktop App
```bash
cd frontend
npm run tauri dev
```

---

## 🚀 Cloud Deployment (Render)

To deploy the backend to [Render](https://render.com) for production:

1. Create a **New Web Service** connected to your repository.
2. Set **Root Directory** to `backend`.
3. Set **Build Command**:
   ```bash
   pip install -r requirements.txt gunicorn && python manage.py migrate
   ```
4. Set **Start Command**:
   ```bash
   gunicorn config.wsgi:application
   ```
5. Add Environment Variables:
   - `PYTHON_VERSION`: `3.12.8`
   - `DJANGO_SECRET_KEY`: `<your-random-secret-key>`
   - `DJANGO_ALLOWED_HOSTS`: `*`
   - `DJANGO_CORS_ALLOWED_ORIGINS`: `http://localhost:5173,tauri://localhost,https://tauri.localhost`
   - `DJANGO_CSRF_TRUSTED_ORIGINS`: `https://*.onrender.com,tauri://localhost,https://tauri.localhost`

---

## 📦 Automated Desktop Builds (CI/CD)

Every push to `main` triggers a GitHub Actions workflow that automatically builds desktop releases:

- 🪟 **Windows**: `.exe` standalone executable and `.msi` / NSIS installer.
- 🍏 **macOS**: `.dmg` drag-and-drop installer and `.app` bundle.

Download the latest installers from the **Actions** tab on GitHub under the **Artifacts** section of the latest run.

---

## ⌨️ Global Keyboard Hotkeys

| Key | Action |
| :--- | :--- |
| `Space` | Play / Pause |
| `Right Arrow` | Seek Forward (+3s) |
| `Left Arrow` | Seek Backward (-3s) |
| `Up Arrow` | Volume Up (+5%) |
| `Down Arrow` | Volume Down (-5%) |
| `M` | Mute / Unmute |
| `L` | Like / Favorite Current Track |
| `S` | Toggle Shuffle |
| `R` | Cycle Repeat Mode (Off / All / One) |
| `V` | Open 3D Visualizer |
| `E` | Open 10-Band Graphic Equalizer |
| `Ctrl + K` / `Cmd + K` | Open Command Palette |

---

## 📄 License
This project is open-source and available under the **MIT License**.
