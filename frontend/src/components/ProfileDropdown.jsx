import { useState, useRef, useEffect } from 'react';
import {
  User,
  Settings,
  Trophy,
  Info,
  LogOut,
  LogIn,
  Search,
  Sparkles,
  ChevronDown,
  ShieldCheck,
  Disc,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { usePlayer } from '../context/usePlayer';

export default function ProfileDropdown() {
  const { user, isLoggedIn, logout, setIsAuthModalOpen, setIsWrappedOpen } = useAuth();
  const { setActiveTab, setIsCommandPaletteOpen, showToast } = usePlayer();
  const [isOpen, setIsOpen] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleOpenSettings = () => {
    setActiveTab('settings');
    setIsOpen(false);
  };

  const handleOpenWrapped = () => {
    setIsWrappedOpen(true);
    setIsOpen(false);
  };

  const handleOpenSpotlight = () => {
    setIsCommandPaletteOpen(true);
    setIsOpen(false);
  };

  const handleShowAbout = () => {
    setShowAboutModal(true);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Profile Avatar Button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 transition-all shadow-md group"
        title="Account & Profile Menu"
      >
        <div className="relative">
          <img
            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
            alt={user?.display_name || user?.username || 'User Profile'}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-white/30 group-hover:ring-white transition-all shadow-sm"
          />
          {/* Active status indicator */}
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border border-black shadow-sm" />
        </div>

        <span className="hidden sm:inline text-xs font-semibold text-white/90 group-hover:text-white max-w-[100px] truncate">
          {user?.display_name || user?.username || 'Profile'}
        </span>

        <ChevronDown
          size={13}
          className={`text-white/50 group-hover:text-white transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : ''
          }`}
        />
      </button>

      {/* Floating Glass Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-3xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] p-2 text-white z-50 animate-fade-in"
          style={{
            background: 'rgba(16, 18, 24, 0.98)',
            backdropFilter: 'blur(30px)',
          }}
        >
          {/* Top User Info Header */}
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 mb-1">
            <div className="flex items-center gap-3">
              <img
                src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={user?.display_name || user?.username}
                className="w-11 h-11 rounded-full object-cover ring-1 ring-white/40 shadow-md"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate" style={{ fontFamily: "'gg sans', sans-serif" }}>
                    {user?.display_name || user?.username || 'Guest Audiophile'}
                  </p>
                  <Sparkles size={11} className="text-white shrink-0" />
                </div>
                <p className="text-[10px] text-white/45 truncate">@{user?.username || 'guest'}</p>
                <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full bg-white/10 text-[9px] font-medium text-white/80">
                  <ShieldCheck size={10} className="text-emerald-400" />
                  <span>{isLoggedIn ? 'Audiophile Pro' : 'Guest Mode'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-0.5 px-1 py-1">
            {/* Profile & Account */}
            <button
              onClick={handleOpenSettings}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
            >
              <User size={15} className="text-white/50 group-hover:text-white" />
              <span>Profile & Account</span>
            </button>

            {/* Settings & Audio Quality */}
            <button
              onClick={handleOpenSettings}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
            >
              <Settings size={15} className="text-white/50 group-hover:text-white" />
              <span>Settings & Preferences</span>
            </button>

            {/* Tunely Wrapped */}
            <button
              onClick={handleOpenWrapped}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
            >
              <Trophy size={15} className="text-white/50 group-hover:text-white" />
              <div className="flex-1 flex items-center justify-between">
                <span>Tunely Wrapped 2026</span>
                <span className="text-[9px] bg-white/10 text-white font-mono px-1.5 py-0.5 rounded">Story</span>
              </div>
            </button>

            {/* Spotlight Command Palette (Ctrl+K) */}
            <button
              onClick={handleOpenSpotlight}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
            >
              <Search size={15} className="text-white/50 group-hover:text-white" />
              <div className="flex-1 flex items-center justify-between">
                <span>Spotlight Search</span>
                <span className="text-[9px] bg-white/10 text-white/60 font-mono px-1.5 py-0.5 rounded">Ctrl+K</span>
              </div>
            </button>

            {/* About Tunely */}
            <button
              onClick={handleShowAbout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors group"
            >
              <Info size={15} className="text-white/50 group-hover:text-white" />
              <span>About Tunely</span>
            </button>
          </div>

          <div className="h-px bg-white/10 my-1 mx-2" />

          {/* Auth Action */}
          <div className="p-1">
            {isLoggedIn ? (
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                  showToast('Signed out successfully');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut size={14} />
                <span>Sign Out</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsAuthModalOpen(true);
                  setIsOpen(false);
                }}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold bg-white hover:bg-neutral-200 text-black shadow-[0_0_15px_rgba(255,255,255,0.25)] transition-all"
              >
                <LogIn size={13} />
                <span>Sign In or Register</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* About Tunely Dialog Modal */}
      {showAboutModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white"
          onClick={() => setShowAboutModal(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/15 shadow-2xl p-6 text-center space-y-4 relative"
            style={{ background: 'rgba(18, 20, 26, 0.98)', backdropFilter: 'blur(30px)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src="/app-icon.png"
              alt="Tunely"
              className="w-14 h-14 rounded-2xl object-cover mx-auto shadow-[0_0_20px_rgba(255,255,255,0.3)] ring-1 ring-white/20"
            />

            <div>
              <h3 className="text-xl font-bold tracking-tight" style={{ fontFamily: "'gg sans', sans-serif" }}>
                Tunely Audio
              </h3>
              <span className="text-[10px] uppercase font-mono text-white/50 tracking-widest block mt-0.5">
                Version 2.4.0 • Enterprise Edition
              </span>
            </div>

            <p className="text-xs text-white/70 leading-relaxed font-light">
              Tunely is an ultra high-fidelity music streaming and audiophile audio synthesis workstation powered by YouTube Music, Web Audio DSP, and real-time fluid simulation shaders.
            </p>

            <div className="p-3 rounded-2xl bg-white/[0.04] border border-white/10 text-[11px] text-white/60 text-left space-y-1 font-mono">
              <p>• Audio Engine: FLAC / 320kbps AAC</p>
              <p>• DSP: 3D Spatial, Reverb, Nightcore</p>
              <p>• Typography: Official gg sans suite</p>
              <p>• Theme: Monochromatic Grey + White</p>
            </div>

            <button
              onClick={() => setShowAboutModal(false)}
              className="w-full py-2 rounded-2xl bg-white hover:bg-neutral-200 text-black text-xs font-bold transition-all shadow-md"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
