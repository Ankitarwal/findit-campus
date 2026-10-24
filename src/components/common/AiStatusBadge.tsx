import React, { useState } from 'react';
import { Sparkles, ShieldCheck, Cpu, Key, CheckCircle2 } from 'lucide-react';
import { aiService } from '../../services/aiService';

export const AiStatusBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const status = aiService.getStatus();

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200/80 hover:bg-primary-100 transition-colors shadow-subtle group"
        title="Click to view Gemma 4 AI integration details"
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
            status.hasKey ? 'bg-emerald-400' : 'bg-primary-400'
          }`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${
            status.hasKey ? 'bg-emerald-500' : 'bg-primary-500'
          }`} />
        </span>
        <Sparkles className="w-3.5 h-3.5 text-primary-600 group-hover:rotate-12 transition-transform" />
        <span className="font-medium">Powered by Gemma 4</span>
      </button>

      {isOpen && (
        <AiTransparencyModal onClose={() => setIsOpen(false)} />
      )}
    </>
  );
};

export const AiTransparencyModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const status = aiService.getStatus();
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      aiService.updateRuntimeConfig({ apiKey: apiKeyInput.trim() });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-elevated border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-primary-50 text-primary-600 border border-primary-100">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Google Gemma 4 AI Integration
                <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {status.model}
                </span>
              </h3>
              <p className="text-xs text-slate-500">Autonomous semantic understanding & hybrid lost-found comparison</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="mt-6 space-y-6 text-sm text-slate-600">
          {/* Status Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Backend Model Status</div>
              <div className="text-sm font-bold text-slate-900 mt-0.5 flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${status.hasKey ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                {status.hasKey ? 'Live Gemma 4 Inference Connected' : 'Deterministic Hybrid Matching Active'}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500">Target Model</div>
              <div className="text-xs font-mono font-medium text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 mt-0.5">
                {status.model}
              </div>
            </div>
          </div>

          {/* Architecture Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100">
              <div className="font-semibold text-slate-900 flex items-center gap-2 mb-1.5">
                <Sparkles className="w-4 h-4 text-primary-600" />
                Feature A: Description Parsing
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Extracts normalized titles, colors, brands, physical traits, and campus locations into strict JSON schemas without inventing unstated details.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-tealAccent-50/50 border border-tealAccent-100">
              <div className="font-semibold text-slate-900 flex items-center gap-2 mb-1.5">
                <ShieldCheck className="w-4 h-4 text-tealAccent-600" />
                Feature B: Two-Stage Pipeline
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Stage 1 indexes candidates via category and spatio-temporal proximity. Stage 2 runs pairwise Gemma 4 semantic comparison with explainable rationale.
              </p>
            </div>
          </div>

          {/* Scoring Methodology */}
          <div className="border border-slate-100 rounded-2xl p-4 bg-slate-50/50">
            <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider mb-2">Hybrid Scoring Weight Formula</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-primary-600 text-base">35%</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Category Match</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-tealAccent-600 text-base">25%</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Location Zone</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-amber-600 text-base">20%</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Date Proximity</div>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                <div className="font-bold text-indigo-600 text-base">20%</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Keywords & NLP</div>
              </div>
            </div>
            <div className="mt-2 text-[11px] text-slate-500 text-center">
              Combined with Gemma 4 semantic evaluation (55% model weight + 45% deterministic structural score)
            </div>
          </div>

          {/* Optional Live Key Input for Hackathon Judges */}
          <div className="border-t border-slate-100 pt-5">
            <div className="flex items-center gap-2 mb-2 font-semibold text-slate-800 text-xs uppercase tracking-wider">
              <Key className="w-4 h-4 text-slate-600" />
              Live Inference API Key (Optional)
            </div>
            <p className="text-xs text-slate-500 mb-3">
              FindIt Campus works out of the box with built-in hybrid matching. If you have an OpenRouter or Google AI Studio key to test live Gemma 4 inference directly in the session, paste it below. Keys are stored only in memory/sessionStorage.
            </p>
            <form onSubmit={handleSaveKey} className="flex gap-2">
              <input
                type="password"
                placeholder="sk-or-... or Gemma inference key"
                value={apiKeyInput}
                onChange={e => setApiKeyInput(e.target.value)}
                className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono"
              />
              <button
                type="submit"
                className="btn-primary text-xs px-4 py-2"
              >
                Apply Key
              </button>
            </form>
            {savedSuccess && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600 font-medium animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" /> Key updated! Gemma 4 inference is now active for this session.
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div className="text-xs text-slate-400">FindIt Campus • AI Safety & Verification</div>
          <button
            onClick={onClose}
            className="btn-secondary text-xs px-4 py-2"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
