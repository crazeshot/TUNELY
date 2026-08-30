/**
 * App.jsx
 * Enterprise Tunely Music Streaming & Audiophile Platform.
 * Features:
 *  - Three.js LiquidEther animated ambient background
 *  - Media Session API & Dynamic album art ambient theme tinting
 *  - Global keyboard hotkeys engine
 *  - Comprehensive studio modals (Visualizer, Equalizer, Command Palette, Sleep Timer, Artist Modal, Share Modal, Auth, Group Session, Wrapped)
 */
import { useState, useEffect } from 'react';
import { PlayerProvider } from './context/PlayerContext';
import { AuthProvider } from './context/AuthContext';
import { usePlayer } from './context/usePlayer';
import Sidebar from './components/Sidebar';
import PlayerBar from './components/PlayerBar';
import MainContent from './components/MainContent';
import RightPanel from './components/RightPanel';
import LiquidEther from './LiquidEther';
import Toast from './components/Toast';
import VisualizerModal from './components/VisualizerModal';
import EqualizerModal from './components/EqualizerModal';
import CommandPalette from './components/CommandPalette';
import SleepTimerModal from './components/SleepTimerModal';
import ArtistModal from './components/ArtistModal';
import ShareModal from './components/ShareModal';
import AuthModal from './components/AuthModal';
import GroupSessionModal from './components/GroupSessionModal';
import WrappedModal from './components/WrappedModal';
import PlaylistModal from './components/PlaylistModal';

const LIQUID_COLORS = ['#27272a', '#71717a', '#ffffff'];

function AppLayout() {
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);

  const {
    currentTrack,
    togglePlay,
    seekTo,
    progress,
    volume,
    setVolume,
    toggleMute,
    toggleLike,
    toggleShuffle,
    cycleRepeat,
    setIsVisualizerOpen,
    setIsEqualizerOpen,
    setIsCommandPaletteOpen,
    enableShader,
  } = usePlayer();

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger hotkeys if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekTo(Math.min(100, progress + 3));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(Math.max(0, progress - 3));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(100, volume + 5));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 5));
          break;
        case 'KeyM':
          toggleMute();
          break;
        case 'KeyL':
          if (currentTrack) toggleLike(currentTrack);
          break;
        case 'KeyS':
          toggleShuffle();
          break;
        case 'KeyR':
          cycleRepeat();
          break;
        case 'KeyV':
          setIsVisualizerOpen((prev) => !prev);
          break;
        case 'KeyE':
          setIsEqualizerOpen((prev) => !prev);
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    togglePlay,
    seekTo,
    progress,
    volume,
    setVolume,
    toggleMute,
    toggleLike,
    currentTrack,
    toggleShuffle,
    cycleRepeat,
    setIsVisualizerOpen,
    setIsEqualizerOpen,
    setIsCommandPaletteOpen,
  ]);

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ background: '#141518' }}>
      {/* Dynamic Animated Three.js Liquid Ether Ambient & Cursor Reactive Fluid (Monochrome) */}
      {enableShader && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <LiquidEther
              colors={LIQUID_COLORS}
              mouseForce={28}
              cursorSize={150}
              isViscous={false}
              iterationsPoisson={2}
              iterationsViscous={0}
              resolution={0.2}
              BFECC={false}
              isBounce={false}
              autoDemo
              autoSpeed={0.45}
              autoIntensity={1.5}
              takeoverDuration={0.15}
              autoResumeDelay={1200}
              autoRampDuration={0.4}
            />
          </div>
        </div>
      )}

      {/* Main 3-Column Glass Layout */}
      <div className="relative z-10 flex h-full gap-2.5 p-3">
        {/* Left Column: Collapsible Navigation + Independent Visible Player */}
        <div className="flex flex-col gap-2.5 h-full shrink-0 min-h-0">
          <Sidebar
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed((v) => !v)}
          />
          <PlayerBar collapsed={leftCollapsed} />
        </div>
        <MainContent />
        <RightPanel
          collapsed={rightCollapsed}
          onToggle={() => setRightCollapsed((v) => !v)}
        />
      </div>

      {/* Modals & Overlays */}
      <Toast />
      <VisualizerModal />
      <EqualizerModal />
      <CommandPalette />
      <SleepTimerModal />
      <ArtistModal />
      <ShareModal />
      <AuthModal />
      <GroupSessionModal />
      <WrappedModal />
      <PlaylistModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <PlayerProvider>
        <AppLayout />
      </PlayerProvider>
    </AuthProvider>
  );
}
