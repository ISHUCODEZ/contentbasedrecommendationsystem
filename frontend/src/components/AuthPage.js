import React, { useState } from 'react';
import { Film, Mail, Lock, User } from 'lucide-react';

function formatApiErrorDetail(detail) {
  if (detail == null) return "Something went wrong. Please try again.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).filter(Boolean).join(" ");
  return String(detail);
}

const AuthPage = ({ onLogin, onRegister, onSkip }) => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await onLogin(email, password);
      } else {
        await onRegister(email, password, name);
      }
    } catch (err) {
      setError(formatApiErrorDetail(err.response?.data?.detail) || err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center px-4" data-testid="auth-page">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-10">
          <Film className="w-10 h-10 text-[#E50914]" />
          <span className="text-3xl font-bold tracking-tight">MovieRec</span>
        </div>

        <div className="bg-[#141414] border border-white/10 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6" data-testid="auth-title">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-md mb-4 text-sm" data-testid="auth-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#1F1F1F] border border-white/10 rounded-md pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914]"
                  data-testid="auth-name-input"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-[#1F1F1F] border border-white/10 rounded-md pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914]"
                data-testid="auth-email-input"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-[#1F1F1F] border border-white/10 rounded-md pl-10 pr-4 py-3 text-white placeholder-neutral-500 focus:outline-none focus:border-[#E50914]"
                data-testid="auth-password-input"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#E50914] hover:bg-[#F6121D] text-white py-3 rounded-md font-semibold transition-colors disabled:opacity-50"
              data-testid="auth-submit-btn"
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }}
              className="text-neutral-400 hover:text-white text-sm transition-colors"
              data-testid="auth-toggle-mode"
            >
              {mode === 'login' ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
            </button>
          </div>

          <div className="mt-4 text-center">
            <button
              onClick={onSkip}
              className="text-neutral-500 hover:text-neutral-300 text-xs transition-colors"
              data-testid="auth-skip-btn"
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
