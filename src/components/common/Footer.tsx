import React from 'react';
import { Compass, ShieldCheck, Sparkles, Lock } from 'lucide-react';

export const Footer: React.FC<{ onNavigate: (page: string) => void }> = ({ onNavigate }) => {
  return (
    <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                <Compass className="w-4 h-4 text-tealAccent-300" />
              </div>
              <span className="font-bold text-base text-white tracking-tight">
                FindIt <span className="text-primary-400">Campus</span>
              </span>
            </div>
            <p className="text-slate-400 leading-relaxed text-xs">
              AI-powered lost & found assistant designed for college campuses. Helping students recover belongings faster with Google Gemma 4 and privacy-first ownership verification.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-tealAccent-400 font-medium">
              <Sparkles className="w-3.5 h-3.5" /> Powered by Google Gemma 4
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Platform</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={() => onNavigate('home')} className="hover:text-white transition-colors">
                  Home Overview
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('browse')} className="hover:text-white transition-colors">
                  Browse Active Listings
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('how-it-works')} className="hover:text-white transition-colors">
                  How AI Matching Works
                </button>
              </li>
              <li>
                <button onClick={() => onNavigate('ai-info')} className="hover:text-white transition-colors">
                  Gemma 4 Transparency & Safety
                </button>
              </li>
            </ul>
          </div>

          {/* Campus Safety */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Security & Recovery</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-slate-500" /> Private Claims Protection
              </li>
              <li className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Verified Campus Handover
              </li>
              <li>Student ID Masking</li>
              <li>Central Security Desk Drop-off</li>
            </ul>
          </div>

          {/* Privacy & Disclaimers */}
          <div>
            <h4 className="text-white font-semibold text-xs uppercase tracking-wider mb-3">Privacy & Trust</h4>
            <p className="text-slate-400 text-xs leading-relaxed mb-3">
              Personal contact details and serial numbers are never publicly exposed. All matches are preliminary and require human verification.
            </p>
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700/60 text-[11px] text-slate-300">
              Campus Security Hotline: <strong className="text-white">(555) 019-SAFE</strong>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
          <div>
            © 2026 FindIt Campus. Built for Hackathon Excellence. All student data fictionalized for demonstration.
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Privacy Policy</span>
            <span>•</span>
            <span>Terms of Service</span>
            <span>•</span>
            <span>Campus Honor Code</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
