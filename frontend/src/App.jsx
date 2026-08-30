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
import UniversalReactPlayer from './components/UniversalReactPlayer';

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
    themeColors,
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
    <div className="relative w-full h-full overflow-hidden select-none" style={{ background: '#090a0f' }}>
      {/* Animated Three.js Liquid Ether Shader Ambient Background */}
      {enableShader && (
        <div className="absolute inset-0 z-0 pointer-events-none opacity-60">
          <div style={{ width: '100%', height: '100%', position: 'relative' }}>
            <LiquidEther
              colors={themeColors.gradient || ['#0f172a', '#475569', '#cbd5e1']}
              mouseForce={18}
              cursorSize={90}
              isViscous
              viscous={28}
              iterationsViscous={28}
              iterationsPoisson={28}
              resolution={0.5}
              isBounce={false}
              autoDemo
              autoSpeed={0.4}
              autoIntensity={2.0}
              takeoverDuration={0.25}
              autoResumeDelay={3000}
              autoRampDuration={0.6}
            />
          </div>
        </div>
      )}

      {/* Dynamic ambient radial lighting overlays tuned to monochromatic theme */}
      <div
        className="absolute top-0 left-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-700"
        style={{ background: themeColors.primary || '#ffffff', opacity: 0.12 }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full blur-[140px] pointer-events-none transition-all duration-700"
        style={{ background: themeColors.secondary || '#94a3b8', opacity: 0.12 }}
      />

      {/* Main 3-Column Glass Layout */}
      <div className="relative z-10 flex h-full gap-2.5 p-3">
        <Sidebar
          collapsed={leftCollapsed}
          onToggle={() => setLeftCollapsed((v) => !v)}
        />
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
      <UniversalReactPlayer showVideo={false} />
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
