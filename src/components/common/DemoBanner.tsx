import React from 'react';
import { UserCheck, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { SEED_PROFILES } from '../../services/seedData';

export const DemoBanner: React.FC = () => {
  const { user, profile, isAdmin, switchDemoUser, isDemoMode } = useAuth();

  if (!isDemoMode && !profile) return null;

  return (
    <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-950 text-white text-xs px-4 py-2 border-b border-navy-700/60 shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="px-2 py-0.5 rounded-full font-bold bg-primary-500/20 text-primary-300 border border-primary-500/30 text-[10px] tracking-wide uppercase">
            Hackathon Demo
          </span>
          <span className="text-slate-300 hidden sm:inline">
            Active Role: <strong className="text-white font-semibold">{profile?.display_name || 'Guest'}</strong>
            {isAdmin ? ' (Administrator)' : ' (Student)'}
          </span>
        </div>

        {/* Demo Switcher for Judges */}
        <div className="flex items-center gap-2">
          <span className="text-slate-400 text-[11px] hidden md:inline">Switch Judge Persona:</span>
          <div className="flex items-center gap-1.5 bg-navy-950/60 p-1 rounded-xl border border-navy-700/80">
            {SEED_PROFILES.map(p => {
              const active = user?.id === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => switchDemoUser(p.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-navy-800'
                  }`}
                  title={`Switch to ${p.display_name} (${p.role})`}
                >
                  {p.role === 'admin' ? (
                    <Shield className="w-3 h-3 text-amber-400" />
                  ) : (
                    <UserCheck className="w-3 h-3 text-blue-300" />
                  )}
                  <span>{p.display_name.split(' ')[0]} {p.role === 'admin' ? '(Admin)' : ''}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
