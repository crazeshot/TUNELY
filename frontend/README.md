# Tunely Frontend

Modern, glassmorphic music streaming web client built with React 19, Vite, Tailwind CSS, Lucide React, and Three.js.

## Scripts

- `npm run dev` — Starts Vite development server at `http://localhost:5173`.
- `npm run build` — Bundles production assets into `dist/`.
- `npm run lint` — Runs ESLint across all source files (0 errors, 0 warnings).
- `npm run preview` — Locally preview the production build.

## Key Features

- **Audio Engine (`PlayerContext.jsx`)**: HTML5 Audio streaming + Web Audio API synthesizer failover.
- **Three.js Liquid Ether (`LiquidEther.jsx`)**: Real-time fluid shader ambient backdrop.
- **Glassmorphic UI**: Glass blur panels, glowing buttons, hover micro-animations, and Syne / DM Sans typography.
- **Visualizer Modal (`VisualizerModal.jsx`)**: Spinning vinyl record, live equalizer bars, and synced song lyrics.
- **Playlist Management (`CreatePlaylistModal.jsx`)**: Custom user playlists with cover art selection.
- **Context Menus (`TrackContextMenu.jsx`)**: Quick actions for Play Next, Add to Queue, Add to Playlist, Like, and Share.
