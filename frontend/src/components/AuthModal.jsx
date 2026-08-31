import { useState, useEffect } from 'react';
import { X, User, Lock, Mail, Sparkles, LogIn, UserPlus, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, authError, setAuthError, authTab, setAuthTab } = useAuth();
  const [tab, setTab] = useState(authTab || 'login');

  useEffect(() => {
    if (authTab) setTab(authTab);
  }, [authTab, isAuthModalOpen]);

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuthError(null);
    try {
      if (tab === 'login') {
        await login(username, password);
      } else {
        await register({ username, email, password, display_name: displayName });
      }
    } catch {
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };

  const handleGuestDemo = async () => {
    setUsername('alex_m');
    setPassword('tunely2026');
    setLoading(true);
    try {
      await login('alex_m', 'tunely2026');
    } catch {
      // Ignore
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in text-white"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(22, 24, 30, 0.98) 0%, rgba(10, 11, 15, 0.98) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Stream Notice */}
        <div className="flex items-center gap-2 mb-4 px-3.5 py-2 rounded-2xl bg-white/[0.06] border border-white/10 text-white/90 text-xs">
          <ShieldAlert size={14} className="text-white shrink-0" />
          <span>Account required to unlock high-res audio streaming</span>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)]">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-wide" style={{ fontFamily: "'gg sans', sans-serif" }}>
                {tab === 'login' ? 'Sign In to Tunely' : 'Create Tunely Account'}
              </h3>
              <p className="text-[11px] text-white/50">Personalized playlists, synced lyrics & soundstage</p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 my-5 p-1 bg-white/5 rounded-2xl border border-white/10">
          <button
            onClick={() => { setTab('login'); setAuthError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'login'
                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => { setTab('register'); setAuthError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              tab === 'register'
                ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.25)]'
                : 'text-white/60 hover:text-white'
            }`}
          >
            <UserPlus size={13} />
            <span>Register</span>
          </button>
        </div>

        {/* Error message if any */}
        {authError && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-xs text-red-200">
            {authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-white/60 mb-1">Display Name</label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus-within:border-white focus-within:ring-1 focus-within:ring-white/20 transition-all">
                <User size={14} className="text-white/40" />
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full bg-transparent text-xs text-white placeholder-white/30 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-white/60 mb-1">
              {tab === 'login' ? 'Username or Email' : 'Username'}
            </label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus-within:border-white focus-within:ring-1 focus-within:ring-white/20 transition-all">
              <User size={14} className="text-white/40" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full bg-transparent text-xs text-white placeholder-white/30 outline-none"
              />
            </div>
          </div>

          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-white/60 mb-1">Email</label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus-within:border-white focus-within:ring-1 focus-within:ring-white/20 transition-all">
                <Mail size={14} className="text-white/40" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@tunely.io"
                  className="w-full bg-transparent text-xs text-white placeholder-white/30 outline-none"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-white/60 mb-1">Password</label>
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus-within:border-white focus-within:ring-1 focus-within:ring-white/20 transition-all">
              <Lock size={14} className="text-white/40" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-xs text-white placeholder-white/30 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-2xl bg-white hover:bg-neutral-200 text-black text-xs font-bold shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all mt-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : tab === 'login' ? 'Sign In & Start Streaming' : 'Create Free Account'}
          </button>
        </form>

        {/* Demo guest sign-in helper */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-white/40 mb-2">Want to test with 1 click?</p>
          <button
            onClick={handleGuestDemo}
            className="text-xs text-white hover:text-white/80 font-bold underline transition-colors"
          >
            1-Click Demo Login (alex_m)
          </button>
        </div>
      </div>
    </div>
  );
}
