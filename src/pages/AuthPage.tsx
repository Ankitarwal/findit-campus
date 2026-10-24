import React, { useState } from 'react';
import { 
  Compass, 
  AlertCircle, 
  Lock, 
  Mail, 
  User, 
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  onSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { login, signup } = useAuth();

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

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fadeIn">
      <div className="glass-card p-6 sm:p-8 border border-slate-200/90 shadow-elevated">
        
        {/* Header */}
        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 flex items-center justify-center text-white mx-auto shadow-md">
            <Compass className="w-6 h-6 text-tealAccent-300" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">
            {mode === 'login' ? 'Sign in to FindIt Campus' : 'Create Campus Account'}
          </h2>
          <p className="text-xs text-slate-500">
            {mode === 'login'
              ? 'Enter your campus credentials to access your reports, claims, and alerts'
              : 'Register with your campus email to report or recover lost belongings'}
          </p>
        </div>

        {/* Mode Toggle */}
        <div className="flex border-b border-slate-200 mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg('');
            }}
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
            onClick={() => {
              setMode('signup');
              setErrorMsg('');
            }}
            className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-colors ${
              mode === 'signup'
                ? 'border-primary-600 text-primary-600'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            Register Account
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 animate-fadeIn">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="e.g. Alex Rivera"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Campus Email Address <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="student@campus.edu"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Password <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="Minimum 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full btn-primary text-xs py-2.5 mt-2"
          >
            {isLoading ? 'Authenticating...' : mode === 'login' ? 'Sign In' : 'Create Student Account'}
          </button>

        </form>

        {/* Demo / Registered Account Credentials Helper */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-500 space-y-1.5">
          <div className="font-semibold text-slate-700 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-primary-600" />
            Registered Campus Credentials:
          </div>
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 font-mono text-[10px] space-y-1 text-slate-600">
            <div>• Student: <span className="text-slate-800 font-semibold">alex.rivera@campus.edu</span> / <span className="text-slate-800">Password123!</span></div>
            <div>• Admin: <span className="text-slate-800 font-semibold">dave.miller@security.campus.edu</span> / <span className="text-slate-800">AdminSecure2026!</span></div>
          </div>
          <p className="text-[10px] text-slate-400">
            Protected by password verification and Supabase Auth with Row Level Security.
          </p>
        </div>

      </div>
    </div>
  );
};
