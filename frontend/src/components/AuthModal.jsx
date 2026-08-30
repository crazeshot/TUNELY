import { useState } from 'react';
import { X, User, Lock, Mail, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { useAuth } from '../context/useAuth';

export default function AuthModal() {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, authError, setAuthError } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register'

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in text-white"
      onClick={() => setIsAuthModalOpen(false)}
    >
      <div
        className="relative w-full max-w-md p-6 sm:p-8 rounded-3xl border border-white/20 shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(28, 12, 40, 0.98) 0%, rgba(12, 6, 22, 0.98) 100%)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold" style={{ fontFamily: 'Syne, sans-serif' }}>
                {tab === 'login' ? 'Sign In to Tunely' : 'Create Tunely Account'}
              </h3>
              <p className="text-[11px] text-white/50">Personalized playlists, synced lyrics & soundstage</p>
            </div>
          </div>

          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/60 hover:text-white"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-2 my-5 p-1 bg-white/10 rounded-2xl border border-white/10">
          <button
            onClick={() => { setTab('login'); setAuthError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === 'login' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <LogIn size={13} />
            <span>Sign In</span>
          </button>

          <button
            onClick={() => { setTab('register'); setAuthError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === 'register' ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md' : 'text-white/60 hover:text-white'
            }`}
          >
            <UserPlus size={13} />
            <span>Register</span>
          </button>
        </div>

        {/* Error message if any */}
        {authError && (
          <div className="mb-4 p-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-xs text-red-300">
            {authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-white/60 mb-1">Display Name</label>
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus-within:border-pink-500 transition-colors">
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
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus-within:border-pink-500 transition-colors">
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
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus-within:border-pink-500 transition-colors">
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
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl bg-white/5 border border-white/10 focus-within:border-pink-500 transition-colors">
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
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white text-xs font-bold shadow-xl hover:scale-102 transition-all mt-2 disabled:opacity-50"
          >
            {loading ? 'Processing...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo guest sign-in helper */}
        <div className="mt-5 pt-4 border-t border-white/10 text-center">
          <p className="text-[11px] text-white/40 mb-2">Want to try with demo credentials?</p>
          <button
            onClick={handleGuestDemo}
            className="text-xs text-pink-400 hover:text-pink-300 font-semibold underline"
          >
            1-Click Demo Login (alex_m)
          </button>
        </div>
      </div>
    </div>
  );
}
