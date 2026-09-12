import { useState, useMemo } from 'react';
import {
  User,
  Mail,
  ShieldCheck,
  Sparkles,
  Trophy,
  Heart,
  Music,
  Clock,
  Flame,
  Check,
  Camera,
  Share2,
  LogOut,
  Edit3,
  Sliders,
  Radio,
  Headphones,
  ArrowLeft,
  Calendar,
  Layers,
} from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { usePlayer } from '../context/usePlayer';
import AlbumCard from './AlbumCard';

const AVATAR_PRESETS = [
  { id: 'alex', label: 'Cyber Violet', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80' },
  { id: 'neon', label: 'Neon Glow', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&auto=format&fit=crop&q=80' },
  { id: 'urban', label: 'Audiophile', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80' },
  { id: 'headphones', label: 'Sound Waves', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&auto=format&fit=crop&q=80' },
  { id: 'minimal', label: 'Studio 3D', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80' },
];

export default function ProfilePage() {
  const { user, isLoggedIn, logout, updateProfile, setIsWrappedOpen, openLogin } = useAuth();
  const {
    likedTracks,
    playlists,
    setActiveTab,
    showToast,
    totalListeningSeconds = 0,
  } = usePlayer();

  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || user?.username || 'Alex Morgan');
  const [bio, setBio] = useState(user?.bio || 'Audiophile exploring spatial sound & electronic dreamscapes on Tunely.');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || AVATAR_PRESETS[0].url);
  const [preferredTheme, setPreferredTheme] = useState(user?.preferred_theme || 'Dark Velvet');
  const [isSaving, setIsSaving] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Derived statistics
  const formattedMinutes = useMemo(() => {
    if (totalListeningSeconds > 0) {
      return Math.max(1, Math.round(totalListeningSeconds / 60));
    }
    return user?.total_minutes_listened || 1420;
  }, [totalListeningSeconds, user?.total_minutes_listened]);

  const formattedHours = (formattedMinutes / 60).toFixed(1);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      if (typeof updateProfile === 'function') {
        await updateProfile({
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
          preferred_theme: preferredTheme,
        });
      }
      showToast?.('Profile updated successfully!', 'success');
      setIsEditing(false);
    } catch {
      showToast?.('Failed to update profile. Saved locally.', 'info');
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareProfile = () => {
    navigator.clipboard?.writeText(window.location.href);
    setCopiedLink(true);
    showToast?.('Profile link copied to clipboard!', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  // Preview of user's favorite tracks (up to 4)
  const recentLikedPreview = useMemo(() => {
    return (likedTracks || []).slice(0, 4);
  }, [likedTracks]);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-fade-in text-white">
      {/* ── Top Navigation Bar ────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setActiveTab('home')}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/70 hover:text-white transition-all group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Explore</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={handleShareProfile}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-white/80 hover:text-white transition-all shadow-sm"
            title="Share Profile"
          >
            {copiedLink ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
            <span>{copiedLink ? 'Link Copied' : 'Share'}</span>
          </button>

          {isLoggedIn ? (
            <button
              onClick={logout}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-medium text-rose-300 hover:text-rose-200 transition-all shadow-sm"
              title="Sign Out"
            >
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={openLogin}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white text-black font-semibold text-xs hover:bg-white/90 transition-all shadow-md"
            >
              <span>Sign In / Register</span>
            </button>
          )}
        </div>
      </div>

      {/* ── Hero Profile Card ─────────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden border border-white/15 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent backdrop-blur-2xl p-6 sm:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.6)]">
        {/* Ambient background glow orb */}
        <div className="absolute -top-24 -right-24 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-pink-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          {/* Avatar Container */}
          <div className="relative group shrink-0">
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-3xl overflow-hidden ring-2 ring-white/30 shadow-2xl bg-black/40">
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div
                onClick={() => setIsEditing(true)}
                className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 text-white text-[11px] font-semibold cursor-pointer transition-opacity backdrop-blur-xs"
              >
                <Camera size={18} />
                <span>Change</span>
              </div>
            </div>
            {/* Status dot */}
            <span
              className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[#0e0514] shadow-md flex items-center justify-center"
              title="Online • Hi-Res Streaming"
            >
              <span className="w-2 h-2 rounded-full bg-white" />
            </span>
          </div>

          {/* Profile Details */}
          <div className="flex-1 text-center sm:text-left space-y-2.5 min-w-0">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
              <h1
                className="text-2xl sm:text-3xl font-black tracking-tight text-white"
                style={{ fontFamily: "'gg sans', sans-serif" }}
              >
                {displayName}
              </h1>
              <Sparkles size={18} className="text-purple-300 shrink-0" />
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-gradient-to-r from-purple-500/25 to-pink-500/25 border border-purple-400/30 text-xs font-semibold text-purple-200 shadow-sm">
                <ShieldCheck size={13} className="text-emerald-400" />
                <span>Audiophile Pro</span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-white/50 font-mono">
              @{user?.username || 'alex_m'} • {user?.email || 'alex@tunely.io'}
            </p>

            <p className="text-xs sm:text-sm text-white/80 max-w-2xl leading-relaxed">
              {bio}
            </p>

            {/* Badges & Meta */}
            <div className="pt-2 flex flex-wrap items-center justify-center sm:justify-start gap-2 text-[11px] text-white/60">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
                <Headphones size={12} className="text-purple-400" />
                <span>Lossless 24-bit / 192kHz</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
                <Radio size={12} className="text-pink-400" />
                <span>Spatial Binaural DSP</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
                <Calendar size={12} className="text-amber-400" />
                <span>Member since 2026</span>
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-row sm:flex-col gap-2 shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setIsEditing((prev) => !prev)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white text-black text-xs font-bold shadow-lg hover:bg-white/90 active:scale-95 transition-all"
            >
              <Edit3 size={14} />
              <span>{isEditing ? 'Close Edit' : 'Edit Profile'}</span>
            </button>

            <button
              onClick={() => setIsWrappedOpen(true)}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold shadow-md active:scale-95 transition-all"
            >
              <Trophy size={14} className="text-amber-300" />
              <span>Tunely Wrapped</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Profile Editing Panel (Expandable) ────────────────────────── */}
      {isEditing && (
        <form
          onSubmit={handleSaveProfile}
          className="rounded-3xl border border-purple-500/30 bg-white/[0.04] backdrop-blur-xl p-6 sm:p-8 space-y-6 shadow-2xl animate-fade-in"
        >
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400/30 flex items-center justify-center text-purple-300">
                <Edit3 size={15} />
              </div>
              <h3 className="text-sm font-bold text-white">Edit Profile & Account Settings</h3>
            </div>
            <span className="text-xs text-white/40">Changes reflect instantly across Tunely</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Display Name */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Display Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  maxLength={40}
                  className="w-full bg-white/5 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-400/60 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* Preferred Theme */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-white/70">Aesthetic Palette</label>
              <div className="relative">
                <Layers size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <select
                  value={preferredTheme}
                  onChange={(e) => setPreferredTheme(e.target.value)}
                  className="w-full bg-[#161320] border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-400/60 transition-all cursor-pointer"
                >
                  <option value="Dark Velvet">Dark Velvet (Default)</option>
                  <option value="Neon Cyber">Neon Cyber</option>
                  <option value="Midnight Plum">Midnight Plum</option>
                  <option value="Obsidian Deep">Obsidian Deep</option>
                </select>
              </div>
            </div>

            {/* Avatar URL */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-white/70">Avatar Image URL</label>
              <div className="relative">
                <Camera size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
                <input
                  type="url"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  placeholder="https://..."
                  className="w-full bg-white/5 border border-white/15 rounded-2xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-400/60 focus:bg-white/10 transition-all"
                />
              </div>

              {/* Quick Preset Selector */}
              <div className="pt-2">
                <p className="text-[11px] text-white/45 mb-2">Or choose a stylized avatar preset:</p>
                <div className="flex flex-wrap items-center gap-2.5">
                  {AVATAR_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setAvatarUrl(p.url)}
                      className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border text-[11px] transition-all ${
                        avatarUrl === p.url
                          ? 'bg-purple-500/25 border-purple-400 text-white shadow-sm ring-1 ring-purple-400/50'
                          : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <img src={p.url} alt={p.label} className="w-5 h-5 rounded-full object-cover" />
                      <span>{p.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-xs font-semibold text-white/70">Bio & Music Manifesto</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={200}
                placeholder="Tell the Tunely community what moves your soul..."
                className="w-full bg-white/5 border border-white/15 rounded-2xl p-3.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-purple-400/60 focus:bg-white/10 transition-all resize-none"
              />
              <span className="text-[10px] text-white/40 block text-right">
                {bio.length} / 200 characters
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white/70 hover:text-white transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-white text-xs font-bold shadow-lg hover:shadow-purple-500/25 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Check size={14} />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      )}

      {/* ── Key Analytics & Stats Grid ───────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Streamed Time */}
        <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2 hover:border-white/20 transition-all group">
          <div className="w-10 h-10 rounded-2xl bg-purple-500/15 text-purple-300 flex items-center justify-center border border-purple-400/20 group-hover:scale-105 transition-transform">
            <Clock size={19} />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{formattedHours}h</p>
          <p className="text-xs text-white/50 font-medium">Listening Time ({formattedMinutes} mins)</p>
        </div>

        {/* Stat 2: Liked Tracks */}
        <div
          onClick={() => setActiveTab('liked')}
          className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2 hover:border-pink-500/30 hover:bg-pink-500/[0.03] transition-all cursor-pointer group"
          title="Go to Liked Songs"
        >
          <div className="w-10 h-10 rounded-2xl bg-pink-500/15 text-pink-300 flex items-center justify-center border border-pink-400/20 group-hover:scale-105 transition-transform">
            <Heart size={19} className="fill-pink-300/40" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{likedTracks?.length || 0}</p>
          <p className="text-xs text-white/50 font-medium flex items-center justify-between">
            <span>Liked Songs</span>
            <span className="text-[10px] text-pink-300/80 group-hover:underline">View →</span>
          </p>
        </div>

        {/* Stat 3: Playlists */}
        <div
          onClick={() => setActiveTab('library')}
          className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2 hover:border-indigo-500/30 hover:bg-indigo-500/[0.03] transition-all cursor-pointer group"
          title="Go to Library"
        >
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-300 flex items-center justify-center border border-indigo-400/20 group-hover:scale-105 transition-transform">
            <Music size={19} />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">{playlists?.length || 0}</p>
          <p className="text-xs text-white/50 font-medium flex items-center justify-between">
            <span>Playlists Created</span>
            <span className="text-[10px] text-indigo-300/80 group-hover:underline">View →</span>
          </p>
        </div>

        {/* Stat 4: Daily Streak */}
        <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-2 hover:border-amber-500/30 transition-all group">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-300 flex items-center justify-center border border-amber-400/20 group-hover:scale-105 transition-transform">
            <Flame size={19} className="fill-amber-300/40 animate-pulse" />
          </div>
          <p className="text-2xl sm:text-3xl font-black text-white">42 Days</p>
          <p className="text-xs text-white/50 font-medium">Daily Music Streak 🔥</p>
        </div>
      </div>

      {/* ── Account Membership & Audio DSP Status ──────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Audiophile Plan Status */}
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center">
                <ShieldCheck size={16} />
              </div>
              <h4 className="text-sm font-bold text-white">Subscription & Plan</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[10px] font-bold text-emerald-300">
              Active Pro
            </span>
          </div>

          <p className="text-xs text-white/60 leading-relaxed">
            You are enrolled in Tunely Pro with unlimited spatial streaming, ultra-low latency playback, and multi-user synchronized sessions.
          </p>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="text-white/50">Streaming Bitrate</span>
              <span className="font-semibold text-white">Lossless 320kbps AAC / FLAC</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="text-white/50">DSP Processing</span>
              <span className="font-semibold text-white">Biquad 10-Band EQ Active</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-white/50">Spatial Binaural Virtualizer</span>
              <span className="font-semibold text-emerald-400">Hardware Accelerated</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => setActiveTab('settings')}
              className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
            >
              <Sliders size={13} />
              <span>Configure Audio & Sound Engine</span>
            </button>
          </div>
        </div>

        {/* Card 2: Security & Session Info */}
        <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center justify-center">
                <User size={16} />
              </div>
              <h4 className="text-sm font-bold text-white">Security & Active Device</h4>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/15 text-[10px] font-mono text-white/70">
              Authenticated
            </span>
          </div>

          <p className="text-xs text-white/60 leading-relaxed">
            Your audio cache, liked tracks, and personalized playlist library are stored with AES encryption and synced per-user.
          </p>

          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="text-white/50">Account Username</span>
              <span className="font-mono text-white">@{user?.username || 'alex_m'}</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1 border-b border-white/5">
              <span className="text-white/50">Session Protocol</span>
              <span className="text-white font-mono">Token Bearer (Session Synced)</span>
            </div>
            <div className="flex items-center justify-between text-xs py-1">
              <span className="text-white/50">Cross-device Sync</span>
              <span className="text-emerald-400 font-semibold">Enabled</span>
            </div>
          </div>

          <div className="pt-2">
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="w-full py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-xs font-semibold text-rose-300 flex items-center justify-center gap-2 transition-colors"
              >
                <LogOut size={13} />
                <span>Log Out of This Session</span>
              </button>
            ) : (
              <button
                onClick={openLogin}
                className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-xs font-semibold text-white flex items-center justify-center gap-2 transition-colors"
              >
                <User size={13} />
                <span>Sign In with Your Account</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Favorite Tracks Showcase ─────────────────────────────────── */}
      {recentLikedPreview.length > 0 && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-pink-400 fill-pink-400" />
              <h3
                className="text-lg font-bold text-white tracking-tight"
                style={{ fontFamily: "'gg sans', sans-serif" }}
              >
                Your Favorite Tracks
              </h3>
            </div>
            <button
              onClick={() => setActiveTab('liked')}
              className="text-xs text-white/50 hover:text-white transition-colors"
            >
              See all ({likedTracks.length}) →
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {recentLikedPreview.map((track, i) => (
              <AlbumCard key={track.id || track.videoId || i} track={track} delay={i * 30} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
