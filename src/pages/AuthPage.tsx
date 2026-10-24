import React, { useState } from 'react';
import { 
  Compass, 
  AlertCircle 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { SEED_PROFILES } from '../services/seedData';
import type { Profile } from '../types/database';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { login, signup, switchDemoUser } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');

    if (mode === 'login') {
      const res = await login(email, password);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.error || 'Invalid credentials');
      }
    } else {
      const res = await signup(email, password, displayName);
      if (res.success) {
        onSuccess();
      } else {
        setErrorMsg(res.error || 'Failed to sign up');
      }
    }
    setIsLoading(false);
  };

  const handleDemoLogin = (userId: string) => {
    switchDemoUser(userId);
    onSuccess();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fadeIn">
      <div className="glass-card p-6 sm:p-8 border border-slate-200/90 shadow-elevated">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white mx-auto shadow-md">
            <Compass className="w-6 h-6 text-tealAccent-300" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Sign in to FindIt Campus' : 'Create Student Account'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Access your reported items, AI match alerts, and verified claims'
              : 'Join with your campus email to securely report and claim belongings'}
          </p>
        </div>

        {/* Quick Demo Persona Shortcuts for Judges */}
        <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Hackathon 1-Click Personas</span>
            <span className="text-primary-600 font-semibold lowercase">no password needed</span>
          </div>
          <div className="space-y-1.5">
            {SEED_PROFILES.map((p: Profile) => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleDemoLogin(p.id)}
                className="w-full px-3 py-2 text-left rounded-xl bg-white hover:bg-slate-100 border border-slate-200/80 text-xs flex items-center justify-between transition-colors group"
              >
                <div>
                  <strong className="text-slate-800">{p.display_name}</strong>
                  <span className="text-[10px] text-slate-400 block">{p.email}</span>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  p.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {p.role}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-slate-200 mb-5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
              mode === 'login'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Create Account
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Jordan Smith"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campus Email
            </label>
            <input
              type="email"
              required
              placeholder="student@university.edu"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary text-xs py-2.5 mt-2"
          >
            {isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In to Campus Account' : 'Register Account'}
          </button>

        </form>

        <p className="text-[11px] text-slate-400 text-center mt-4">
          Protected by Supabase Auth with Row Level Security (RLS) policies.
        </p>

      </div>
    </div>
  );
};
