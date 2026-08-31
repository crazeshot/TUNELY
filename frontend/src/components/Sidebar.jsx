import { useState } from 'react';
import {
  ChevronLeft,
  Plus,
  Music,
  Library,
  Heart,
  Sparkles,
  Users,
  Trophy,
  Search,
  Radio,
} from 'lucide-react';
import CreatePlaylistModal from './CreatePlaylistModal';
import { usePlayer } from '../context/usePlayer';
import { useAuth } from '../context/useAuth';

export default function Sidebar({ collapsed = false, onToggle = () => {} }) {
  const {
    playlists,
    activeTab,
    setActiveTab,
    likedTracks,
    setIsGroupSessionOpen,
    setActivePlaylistModal,
  } = usePlayer();
  const { setIsWrappedOpen } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const panelWidth = collapsed ? '72px' : '260px';

  return (
    <>
      <aside
        className={`relative flex flex-col flex-1 min-h-0 shrink-0 rounded-3xl transition-all duration-300 bg-white/[0.03] backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.5)] z-20 select-none`}
        style={{ width: panelWidth }}
      >
        {/* ── COLLAPSED DOCK VIEW (72px Icon Bar) ──────────────────────── */}
        {collapsed ? (
          <div className="flex flex-col items-center h-full py-4 px-2.5 justify-between">
            {/* Top Section: Logo & Toggle */}
            <div className="flex flex-col items-center gap-3 w-full">
              {/* Expand / Collapse Button */}
              <button
                onClick={onToggle}
                aria-label="Expand sidebar"
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/20 border border-white/15 hover:border-white/30 flex items-center justify-center text-white/70 hover:text-white transition-all shadow-md group relative"
                title="Expand Sidebar"
              >
                <ChevronLeft size={16} className="rotate-180 transition-transform group-hover:scale-110" />
                <span className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Expand Sidebar
                </span>
              </button>

              {/* Favicon Logo */}
              <button
                onClick={() => setActiveTab('home')}
                className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center p-1.5 transition-all hover:scale-105 group relative"
                title="Tunely Home"
              >
                <img src="/favicon.svg" alt="Tunely" className="w-full h-full object-contain" />
                <span className="absolute left-full ml-3 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  Tunely Home
                </span>
              </button>

              <div className="w-8 h-px bg-white/10 my-0.5" />

              {/* Nav Icon Buttons Stack */}
              <div className="flex flex-col items-center gap-1.5 w-full">
                {/* 1. Explore Music */}
                <div className="relative group w-full flex justify-center">
                  <button
                    onClick={() => setActiveTab('home')}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'home'
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                        : 'text-white/60 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
                    }`}
                    aria-label="Explore Music"
                  >
                    <Radio size={18} />
                  </button>
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex items-center gap-1.5">
                    <Radio size={12} className="text-white/70" />
                    <span>Explore Music</span>
                  </span>
                </div>

                {/* 2. Search Tracks */}
                <div className="relative group w-full flex justify-center">
                  <button
                    onClick={() => setActiveTab('search')}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'search'
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                        : 'text-white/60 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
                    }`}
                    aria-label="Search Tracks"
                  >
                    <Search size={18} />
                  </button>
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex items-center gap-1.5">
                    <Search size={12} className="text-white/70" />
                    <span>Search Tracks <span className="text-[9px] text-white/40 font-mono">⌘K</span></span>
                  </span>
                </div>

                {/* 3. Your Library */}
                <div className="relative group w-full flex justify-center">
                  <button
                    onClick={() => setActiveTab('library')}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all ${
                      activeTab === 'library'
                        ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.4)] scale-105'
                        : 'text-white/60 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
                    }`}
                    aria-label="Your Library"
                  >
                    <Library size={18} />
                  </button>
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex items-center gap-1.5">
                    <Library size={12} className="text-white/70" />
                    <span>Your Library</span>
                  </span>
                </div>

                {/* 4. Liked Songs */}
                <div className="relative group w-full flex justify-center">
                  <button
                    onClick={() => setActiveTab('liked')}
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all relative ${
                      activeTab === 'liked'
                        ? 'bg-white/20 text-white border border-white/40 shadow-sm scale-105'
                        : 'text-white/60 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95'
                    }`}
                    aria-label="Liked Songs"
                  >
                    <Heart
                      size={18}
                      className={activeTab === 'liked' || likedTracks.length > 0 ? 'text-white fill-white' : ''}
                    />
                    {likedTracks.length > 0 && (
                      <span className="absolute -top-1 -right-1 min-w-[17px] h-[17px] px-1 rounded-full bg-white text-black text-[9px] font-bold flex items-center justify-center shadow-md">
                        {likedTracks.length > 99 ? '99+' : likedTracks.length}
                      </span>
                    )}
                  </button>
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex items-center gap-1.5">
                    <Heart size={12} className="text-white fill-white" />
                    <span>Liked Songs ({likedTracks.length})</span>
                  </span>
                </div>

                {/* 5. Listen Together */}
                <div className="relative group w-full flex justify-center">
                  <button
                    onClick={() => setIsGroupSessionOpen(true)}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 hover:scale-105 active:scale-95 transition-all"
                    aria-label="Listen Together"
                  >
                    <Users size={18} />
                  </button>
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex items-center gap-1.5">
                    <Users size={12} className="text-emerald-400" />
                    <span>Listen Together <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /></span>
                  </span>
                </div>

                {/* 6. Tunely Wrapped */}
                <div className="relative group w-full flex justify-center">
                  <button
                    onClick={() => setIsWrappedOpen(true)}
                    className="w-11 h-11 rounded-2xl flex items-center justify-center text-amber-300/80 hover:text-amber-200 hover:bg-amber-400/10 hover:scale-105 active:scale-95 transition-all relative"
                    aria-label="Tunely Wrapped"
                  >
                    <Trophy size={18} />
                    <Sparkles size={10} className="absolute top-1.5 right-1.5 text-amber-300 animate-pulse" />
                  </button>
                  <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-amber-400/30 text-[11px] font-semibold text-amber-200 whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex items-center gap-1.5">
                    <Trophy size={12} className="text-amber-300" />
                    <span>Tunely Wrapped 2026</span>
                  </span>
                </div>
              </div>

              <div className="w-8 h-px bg-white/10 my-0.5" />

              {/* Collapsed Mini Playlists List */}
              {playlists.length > 0 && (
                <div className="flex flex-col items-center gap-1.5 w-full max-h-[140px] overflow-y-auto no-scrollbar py-0.5">
                  {playlists.map((pl) => (
                    <div key={pl.id} className="relative group w-full flex justify-center">
                      <button
                        onClick={() => setActivePlaylistModal(pl)}
                        className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/15 border border-white/10 hover:border-white/30 flex items-center justify-center overflow-hidden transition-all hover:scale-105 active:scale-95"
                        aria-label={pl.title}
                      >
                        {pl.cover_url ? (
                          <img src={pl.cover_url} alt={pl.title} className="w-full h-full object-cover" />
                        ) : (
                          <Music size={13} className="text-white/60 group-hover:text-white" />
                        )}
                      </button>
                      <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex items-center gap-1.5">
                        <Music size={12} className="text-white/60" />
                        <span className="max-w-[150px] truncate">{pl.title}</span>
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Section: Create Playlist Button */}
            <div className="w-full pt-2 flex justify-center">
              <div className="relative group flex justify-center">
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="w-10 h-10 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white flex items-center justify-center shadow-lg hover:shadow-white/10 transition-all hover:scale-105 active:scale-95"
                  aria-label="New Playlist"
                >
                  <Plus size={17} />
                </button>
                <span className="absolute left-full ml-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-xl bg-[#14161d]/95 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white whitespace-nowrap shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 flex items-center gap-1.5">
                  <Plus size={12} className="text-white" />
                  <span>Create Playlist</span>
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* ── EXPANDED FULL VIEW (260px Full Sidebar) ─────────────────── */
          <div className="flex flex-col h-full">
            {/* Top: Official Tunely Brand Logo & Collapse Toggle */}
            <div className="flex items-center justify-between px-5 pt-6 pb-4">
              <div
                className="flex items-center gap-3 cursor-pointer group"
                onClick={() => setActiveTab('home')}
                title="Tunely Home"
              >
                <img
                  src="/logo.svg"
                  alt="Tunely"
                  className="h-8 max-w-[155px] object-contain transition-transform duration-300 group-hover:scale-102"
                />
              </div>

              {/* Collapse Toggle Button */}
              <button
                onClick={onToggle}
                aria-label="Collapse sidebar"
                className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10 flex items-center justify-center text-white/50 hover:text-white transition-all duration-300"
                title="Collapse Sidebar"
              >
                <ChevronLeft size={16} />
              </button>
            </div>

            {/* Nav Quick Shortcuts */}
            <div className="px-4 space-y-1 mb-3">
              <button
                onClick={() => setActiveTab('home')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'home'
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Radio size={15} />
                <span>Explore Music</span>
              </button>

              <button
                onClick={() => setActiveTab('search')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'search'
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Search size={15} />
                <span>Search Tracks</span>
              </button>

              <button
                onClick={() => setActiveTab('library')}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === 'library'
                    ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Library size={15} />
                <span>Your Library</span>
              </button>

              <button
                onClick={() => setActiveTab('liked')}
                className={`w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                  activeTab === 'liked'
                    ? 'bg-white/15 text-white shadow-sm'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <span className="flex items-center gap-3">
                  <Heart size={15} className="text-white fill-white/20" />
                  <span>Liked Songs</span>
                </span>
                <span className="text-[10px] bg-white/10 text-white/90 px-2 py-0.5 rounded-full font-mono">
                  {likedTracks.length}
                </span>
              </button>

              {/* Listen Together shortcut */}
              <button
                onClick={() => setIsGroupSessionOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
              >
                <Users size={15} className="text-white/70" />
                <span>Listen Together</span>
              </button>

              {/* Tunely Wrapped shortcut */}
              <button
                onClick={() => setIsWrappedOpen(true)}
                className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-white/80 hover:text-white hover:bg-white/10 border border-white/10 transition-all"
              >
                <Trophy size={15} className="text-amber-300" />
                <span>Tunely Wrapped</span>
              </button>
            </div>

            <div className="h-px bg-white/10 mx-5 mb-3" />

            {/* User Playlists list */}
            <div className="flex-1 overflow-y-auto px-4 space-y-1">
              <div className="flex items-center justify-between px-2 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-white/40">
                  Playlists
                </span>
                <span className="text-[10px] text-white/30">{playlists.length}</span>
              </div>

              {playlists.map((pl) => (
                <button
                  key={pl.id}
                  onClick={() => setActivePlaylistModal(pl)}
                  className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/5 text-left truncate transition-colors group"
                >
                  <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-white/20 transition-colors">
                    <Music size={12} className="text-white/60 group-hover:text-white" />
                  </div>
                  <span className="truncate">{pl.title}</span>
                </button>
              ))}
            </div>

            {/* New Playlist button */}
            <div className="px-4 py-3">
              <button
                onClick={() => setIsModalOpen(true)}
                className="
                  w-full flex items-center justify-center gap-2
                  bg-white/10 hover:bg-white/20
                  border border-white/20 hover:border-white/40
                  text-white
                  text-xs font-semibold
                  py-2 rounded-2xl
                  shadow-lg hover:shadow-white/10
                  transition-all duration-200
                "
              >
                <Plus size={15} />
                <span>New Playlist</span>
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
