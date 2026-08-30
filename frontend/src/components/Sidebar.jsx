import { useState } from 'react';
import { ChevronLeft, Plus, Music, Library, Heart, Radio, Sparkles, Users, Trophy } from 'lucide-react';
import PlayerBar from './PlayerBar';
import CreatePlaylistModal from './CreatePlaylistModal';
import { usePlayer } from '../context/usePlayer';
import { useAuth } from '../context/useAuth';

export default function Sidebar({ collapsed = false, onToggle = () => {} }) {
  const { playlists, activeTab, setActiveTab, likedTrackIds, setIsGroupSessionOpen } = usePlayer();
  const { setIsWrappedOpen } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const panelWidth = collapsed ? '64px' : '280px';

  return (
    <>
      <aside
        className="relative flex flex-col shrink-0 rounded-3xl overflow-hidden transition-all duration-300 bg-white/[0.04] backdrop-blur-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/[0.01] border border-white/10 shadow-[0_10px_40px_rgba(0,0,0,0.45)]"
        style={{ width: panelWidth }}
      >
        {/* Collapse toggle button */}
        <button
          onClick={onToggle}
          aria-label={collapsed ? 'Expand left panel' : 'Collapse left panel'}
          className={`
            absolute top-5 right-4 z-20
            w-7 h-7 rounded-full bg-white/5 hover:bg-white/15 border border-white/10
            flex items-center justify-center
            text-white/50 hover:text-white
            transition-all duration-300
            ${collapsed ? 'rotate-180' : ''}
          `}
        >
          <ChevronLeft size={16} />
        </button>

        <div
          aria-hidden={collapsed}
          className={`
            flex flex-col h-full
            transition-all duration-300
            ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}
          `}
        >
          {/* Top: Logo with neon dot */}
          <div className="flex items-center gap-2.5 px-6 pt-6 pb-5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-pink-500 via-purple-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-pink-500/20">
              <Sparkles size={16} className="text-white" />
            </div>
            <h1
              className="text-white font-bold tracking-tight text-2xl"
              style={{ fontFamily: 'Syne, sans-serif', letterSpacing: '-0.5px' }}
            >
              Tunely
            </h1>
          </div>

          {/* Nav Quick Shortcuts */}
          <div className="px-4 space-y-1 mb-3">
            <button
              onClick={() => setActiveTab('home')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'home'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Radio size={15} className={activeTab === 'home' ? 'text-pink-400' : 'text-white/50'} />
              <span>Explore Music</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'library'
                  ? 'bg-white/15 text-white shadow-sm'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <Library size={15} className={activeTab === 'library' ? 'text-pink-400' : 'text-white/50'} />
              <span>Your Library</span>
            </button>

            <button
              onClick={() => setActiveTab('library')}
              className="w-full flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
            >
              <span className="flex items-center gap-3">
                <Heart size={15} className="text-pink-400" />
                <span>Liked Songs</span>
              </span>
              <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full font-mono">
                {likedTrackIds.size}
              </span>
            </button>

            {/* Listen Together shortcut */}
            <button
              onClick={() => setIsGroupSessionOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-purple-300 hover:text-white hover:bg-purple-500/10 border border-purple-500/20 transition-all"
            >
              <Users size={15} className="text-purple-400" />
              <span>Listen Together</span>
            </button>

            {/* Tunely Wrapped shortcut */}
            <button
              onClick={() => setIsWrappedOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs font-medium text-pink-300 hover:text-white hover:bg-pink-500/10 border border-pink-500/20 transition-all"
            >
              <Trophy size={15} className="text-pink-400" />
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
                onClick={() => setActiveTab('library')}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-xs text-white/70 hover:text-white hover:bg-white/5 text-left truncate transition-colors group"
              >
                <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-pink-500/20 transition-colors">
                  <Music size={12} className="text-white/60 group-hover:text-pink-300" />
                </div>
                <span className="truncate">{pl.title}</span>
              </button>
            ))}
          </div>

          {/* New Playlist button */}
          <div className="px-4 py-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="
                w-full flex items-center justify-center gap-2
                bg-white/10 hover:bg-white/15
                border border-white/20 hover:border-pink-500/40
                text-white/90 hover:text-white
                text-xs font-semibold
                py-2 rounded-2xl
                shadow-lg hover:shadow-pink-500/10
                transition-all duration-200
              "
            >
              <Plus size={15} />
              <span>New Playlist</span>
            </button>
          </div>

          {/* Player bar pinned to bottom */}
          <div className="px-3 pb-3">
            <PlayerBar />
          </div>
        </div>
      </aside>

      {/* Create Playlist Modal */}
      <CreatePlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}
