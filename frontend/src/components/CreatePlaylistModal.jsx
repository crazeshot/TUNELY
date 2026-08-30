import { useState } from 'react';
import { X, Music2 } from 'lucide-react';
import { usePlayer } from '../context/usePlayer';

export default function CreatePlaylistModal({ isOpen, onClose }) {
  const { createPlaylist } = usePlayer();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80');

  if (!isOpen) return null;

  const sampleCovers = [
    'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1511735111819-9a3f7709049c?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    createPlaylist({ title: title.trim(), description: description.trim(), cover_url: coverUrl });
    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-md p-6 rounded-3xl border border-white/20 shadow-2xl text-white overflow-hidden"
        style={{ background: 'rgba(24, 12, 34, 0.95)' }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-white/40 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
            <Music2 size={20} className="text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
              Create New Playlist
            </h2>
            <p className="text-xs text-white/50">Curate your favorite tracks</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Playlist Name</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Midnight Chill & Study"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-1.5">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Give your playlist a vibe description..."
              className="w-full px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-pink-500/50 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/70 mb-2">Choose Cover Art</label>
            <div className="grid grid-cols-4 gap-2">
              {sampleCovers.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Cover choice ${i}`}
                  onClick={() => setCoverUrl(url)}
                  className={`w-full aspect-square object-cover rounded-xl cursor-pointer border-2 transition-all duration-200 ${
                    coverUrl === url ? 'border-pink-500 scale-105 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Create Playlist
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
