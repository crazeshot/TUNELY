import { useState } from 'react';
import {
  Settings,
  Zap,
  Sliders,
  Volume2,
  Sparkles,
  ShieldCheck,
  Trash2,
  LogOut,
  LogIn,
  ExternalLink,
  Layers,
  Radio,
  Type,
  Disc,
} from 'lucide-react';
import { usePlayer } from '../context/usePlayer';
import { useAuth } from '../context/useAuth';

export default function SettingsPage() {
  const {
    isAutoplay,
    toggleAutoplay,
    audioQuality,
    setAudioQuality,
    crossfadeSeconds,
    setCrossfadeSeconds,
    isNormalization,
    toggleNormalization,
    isSpatialAudio,
    toggleSpatialAudio,
    isSlowedReverb,
    toggleSlowedReverb,
    isNightcore,
    toggleNightcore,
    enableShader,
    setEnableShader,
    clearAudioCache,
    downloadedTrackIds,
    showToast,
  } = usePlayer();

  const { user, isLoggedIn, logout, setIsAuthModalOpen } = useAuth();
  const [clearing, setClearing] = useState(false);

  const handleClearCache = () => {
    setClearing(true);
    clearAudioCache();
    setTimeout(() => setClearing(false), 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16 animate-fade-in text-white">
      {/* Header Banner */}
      <div className="flex items-center gap-4 pb-6 border-b border-white/10">
        <div className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.3)] shrink-0">
          <Settings size={24} />
        </div>
        <div>
          <h1
            className="text-2xl sm:text-3xl font-extrabold tracking-tight"
            style={{ fontFamily: "'gg sans', sans-serif" }}
          >
            Settings & Preferences
          </h1>
          <p className="text-xs sm:text-sm text-white/50 mt-0.5">
            Configure audio fidelity, autoplay transitions, visual performance, and storage
          </p>
        </div>
      </div>

      {/* 1. Playback & Autoplay Engine */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Radio size={16} className="text-white/80" />
          <h2 className="text-base font-bold uppercase tracking-wider text-white/90">
            Playback & Autoplay Engine
          </h2>
        </div>

        <div className="space-y-3">
          {/* Autoplay Toggle */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between transition-all hover:bg-white/[0.05]">
            <div className="space-y-0.5 max-w-[80%]">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Continuous Song Autoplay</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/15 text-white">
                  Recommended
                </span>
              </div>
              <p className="text-xs text-white/50">
                Keep the music flowing. When a track ends, Tunely automatically transitions and plays the next song without stopping.
              </p>
            </div>

            <button
              onClick={toggleAutoplay}
              aria-label="Toggle autoplay"
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
                isAutoplay ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isAutoplay ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>

          {/* Streaming Quality Selector */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 space-y-3">
            <div>
              <span className="text-sm font-bold text-white">Audio Streaming Fidelity</span>
              <p className="text-xs text-white/50">Select audio codec bitrate for streaming</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {[
                { id: 'lossless', title: 'Lossless Studio', desc: '1411 kbps FLAC / Master' },
                { id: 'high', title: 'High Definition', desc: '320 kbps High-Res AAC' },
                { id: 'standard', title: 'Data Saver', desc: '160 kbps Efficient MP3' },
              ].map((q) => {
                const isSelected = audioQuality === q.id;
                return (
                  <button
                    key={q.id}
                    onClick={() => setAudioQuality(q.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.25)] font-semibold'
                        : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <p className="text-xs font-bold">{q.title}</p>
                    <p className={`text-[11px] mt-0.5 ${isSelected ? 'text-black/70' : 'text-white/40'}`}>
                      {q.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Crossfade Transition Slider */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-white">Track Crossfade Transition</span>
              <p className="text-xs text-white/50">Seamlessly fades songs into each other</p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-60">
              <input
                type="range"
                min="0"
                max="12"
                step="1"
                value={crossfadeSeconds}
                onChange={(e) => setCrossfadeSeconds(parseInt(e.target.value, 10))}
                className="w-full"
              />
              <span className="text-xs font-mono font-bold text-white/90 min-w-[32px] text-right">
                {crossfadeSeconds === 0 ? 'Off' : `${crossfadeSeconds}s`}
              </span>
            </div>
          </div>

          {/* Audio Normalization (ReplayGain) */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between transition-all hover:bg-white/[0.05]">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-sm font-bold text-white">Smart Volume Normalization</span>
              <p className="text-xs text-white/50">Equalizes gain across songs to prevent sudden volume spikes</p>
            </div>

            <button
              onClick={toggleNormalization}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
                isNormalization ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  isNormalization ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      {/* 2. DSP & Soundstage */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Sliders size={16} className="text-white/80" />
          <h2 className="text-base font-bold uppercase tracking-wider text-white/90">
            Audio Effects & DSP Soundstage
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Spatial Audio Card */}
          <div
            onClick={toggleSpatialAudio}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              isSpatialAudio
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                : 'bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">3D Soundstage</span>
              <Disc size={16} className={isSpatialAudio ? 'text-black' : 'text-white/60'} />
            </div>
            <p className={`text-xs ${isSpatialAudio ? 'text-black/80' : 'text-white/50'}`}>
              Virtual 3D spatial positioning and expanded stereo sound field
            </p>
          </div>

          {/* Slowed + Reverb Card */}
          <div
            onClick={toggleSlowedReverb}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              isSlowedReverb
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                : 'bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Slowed + Reverb</span>
              <Sparkles size={16} className={isSlowedReverb ? 'text-black' : 'text-white/60'} />
            </div>
            <p className={`text-xs ${isSlowedReverb ? 'text-black/80' : 'text-white/50'}`}>
              0.85x speed with deep atmospheric convolution reverb decay
            </p>
          </div>

          {/* Nightcore Card */}
          <div
            onClick={toggleNightcore}
            className={`p-4 rounded-2xl border cursor-pointer transition-all ${
              isNightcore
                ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                : 'bg-white/[0.03] border-white/10 text-white hover:bg-white/[0.06]'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Nightcore Pitch</span>
              <Zap size={16} className={isNightcore ? 'text-black' : 'text-white/60'} />
            </div>
            <p className={`text-xs ${isNightcore ? 'text-black/80' : 'text-white/50'}`}>
              1.25x tempo boost with energetic high-frequency harmonic lift
            </p>
          </div>
        </div>
      </section>

      {/* 3. Appearance & Visual Engine */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers size={16} className="text-white/80" />
          <h2 className="text-base font-bold uppercase tracking-wider text-white/90">
            Appearance & Visual Experience
          </h2>
        </div>

        <div className="space-y-3">
          {/* Liquid Ether Shader Toggle */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-sm font-bold text-white">Three.js Liquid Ether Shader</span>
              <p className="text-xs text-white/50">
                Interactive real-time fluid background simulation. Disable for battery saving mode.
              </p>
            </div>

            <button
              onClick={() => setEnableShader(!enableShader)}
              className={`w-12 h-7 rounded-full p-1 transition-colors duration-200 ease-in-out focus:outline-none ${
                enableShader ? 'bg-white' : 'bg-white/20'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
                  enableShader ? 'translate-x-5 bg-black' : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </div>

          {/* Typography Engine */}
          <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <Type size={16} className="text-white/70" />
                <span className="text-sm font-bold text-white">App Typography</span>
              </div>
              <p className="text-xs text-white/50">Clean geometric sans-serif typeface</p>
            </div>
            <span className="px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-mono font-bold text-white">
              gg sans (Active)
            </span>
          </div>
        </div>
      </section>

      {/* 4. Storage & Cache Management */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Trash2 size={16} className="text-white/80" />
          <h2 className="text-base font-bold uppercase tracking-wider text-white/90">
            Storage & Local Cache
          </h2>
        </div>

        <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-sm font-bold text-white">Streaming & Search Cache</span>
            <p className="text-xs text-white/50">
              Clear saved audio playback states and cached API responses
            </p>
            <p className="text-[11px] text-white/40 font-mono">
              Offline Downloads: {downloadedTrackIds.size} tracks saved
            </p>
          </div>

          <button
            onClick={handleClearCache}
            disabled={clearing}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 border border-white/15 text-xs font-semibold text-white transition-all disabled:opacity-50"
          >
            <Trash2 size={14} />
            <span>{clearing ? 'Clearing...' : 'Clear Audio Cache'}</span>
          </button>
        </div>
      </section>

      {/* 5. Account & Profile */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-white/80" />
          <h2 className="text-base font-bold uppercase tracking-wider text-white/90">
            Account & Membership
          </h2>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-r from-white/[0.06] via-white/[0.03] to-transparent border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
              alt={user.display_name || user.username}
              className="w-14 h-14 rounded-2xl object-cover border-2 border-white/20 shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2">
                <p className="text-base font-bold text-white">
                  {user.display_name || user.username || 'Alex Morgan'}
                </p>
                <span className="px-2 py-0.5 rounded-full bg-white text-black text-[10px] font-extrabold uppercase">
                  {isLoggedIn ? 'Audiophile Pro' : 'Guest'}
                </span>
              </div>
              <p className="text-xs text-white/50">{user.email || 'alex.morgan@tunely.audio'}</p>
              <p className="text-[11px] text-white/40 mt-1">
                {user.total_minutes_listened || 1420} mins streamed • Joined 2026
              </p>
            </div>
          </div>

          {isLoggedIn ? (
            <button
              onClick={() => {
                logout();
                showToast('Signed out of Tunely');
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/10 hover:bg-red-500/20 hover:text-red-300 border border-white/15 text-xs font-semibold text-white transition-all"
            >
              <LogOut size={14} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all"
            >
              <LogIn size={14} />
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </section>

      {/* 6. About Tunely */}
      <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-white/40 gap-3">
        <div>
          <p className="font-semibold text-white/60">Tunely Audio Suite • v2.4.0</p>
          <p className="text-[11px]">React 19 • Three.js WebGL • Django 5 • yt-dlp Audio DSP</p>
        </div>

        <a
          href="https://github.com/crazeshot/TUNELY"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-white/60 hover:text-white transition-colors"
        >
          <span>GitHub Repository</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
}
