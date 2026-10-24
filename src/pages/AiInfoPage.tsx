import React from 'react';
import { 
  Sparkles, 
  Cpu, 
  Layers, 
  AlertTriangle 
} from 'lucide-react';
import { aiService } from '../services/aiService';

export const AiInfoPage: React.FC = () => {
  const status = aiService.getStatus();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fadeIn">
      
      {/* Hero Header */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200/80 text-xs font-semibold">
          <Cpu className="w-3.5 h-3.5" />
          <span>Google Gemma 4 Architecture & Safety Protocol</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          AI Transparency & Model Governance
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          How FindIt Campus harnesses Google Gemma 4 for intelligent, privacy-preserving semantic item matching without hallucinations or data leakage.
        </p>
      </div>

      {/* Model Operational Status Box */}
      <div className="glass-card p-6 border border-slate-200 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Inference Model</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{status.model}</div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${status.hasKey ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'}`} />
            <span className="text-xs font-bold text-slate-800">
              {status.hasKey ? 'Gemma 4 Live Endpoint Connected' : 'Deterministic Hybrid Engine Active'}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="font-semibold text-slate-500 block">Temperature:</span>
            <span className="font-mono text-slate-800 font-bold">0.1 (Strict Determinism)</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="font-semibold text-slate-500 block">Output Format:</span>
            <span className="font-mono text-slate-800 font-bold">Validated JSON Schema</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
            <span className="font-semibold text-slate-500 block">PII Scrubbing:</span>
            <span className="font-mono text-slate-800 font-bold">Client & Edge Masked</span>
          </div>
        </div>
      </div>

      {/* Core AI Capabilities */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Capability A */}
        <div className="glass-card p-6 border border-blue-100 space-y-3">
          <div className="p-2.5 rounded-2xl bg-blue-50 text-primary-600 w-fit">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Feature A: Intelligent Description Extraction</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Free-form student text varies wildly. When an item is reported, Gemma 4 normalizes the description, extracts visible colors, brands, and traits, and flags any uncertainty or omitted identifying info into a strictly typed JSON structure.
          </p>
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
            Output: &#123; normalized_title, extracted_features: &#123; color, brand &#125;, keywords, uncertainty &#125;
          </div>
        </div>

        {/* Capability B */}
        <div className="glass-card p-6 border border-tealAccent-100 space-y-3">
          <div className="p-2.5 rounded-2xl bg-tealAccent-50 text-tealAccent-600 w-fit">
            <Layers className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-900 text-base">Feature B: Two-Stage Matching Pipeline</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Instead of running expensive LLM calls on every database record, FindIt Campus uses a fast Stage 1 index filter (category compatibility, campus zone, time proximity), followed by a Stage 2 pairwise Gemma 4 comparison for high-probability candidates.
          </p>
          <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono">
            Stage 1 DB Query → Stage 2 Gemma 4 Semantic Rationale
          </div>
        </div>

      </div>

      {/* Hybrid Scoring Formulation */}
      <div className="glass-card p-6 sm:p-8 border border-slate-200/90 shadow-card space-y-4">
        <h3 className="text-lg font-bold text-slate-900">
          Hybrid Scoring: Deterministic Rules + Gemma 4 Reasoning
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          AI confidence scores are never treated as uncalibrated truth. FindIt Campus balances structural physical ground rules with Gemma 4 semantic understanding using a mathematically bounded hybrid formula:
        </p>

        <div className="p-4 rounded-2xl bg-slate-900 text-white font-mono text-xs sm:text-sm">
          Final_Score = (Deterministic_Score * 0.45) + (Gemma4_Semantic_Score * 0.55)
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-2">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-800 block">35% Category Match</strong>
            <span className="text-slate-500 text-[11px]">Strict ontological category agreement</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-800 block">25% Location Zone</strong>
            <span className="text-slate-500 text-[11px]">Campus facility and floor proximity</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-800 block">20% Time Proximity</strong>
            <span className="text-slate-500 text-[11px]">Temporal decay curve within 7 days</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <strong className="text-slate-800 block">20% Keyword Tokens</strong>
            <span className="text-slate-500 text-[11px]">Non-stopword descriptive overlap</span>
          </div>
        </div>
      </div>

      {/* Important Safety Principles & Disclaimers */}
      <div className="glass-card p-6 border border-amber-200 bg-amber-50/40 space-y-3">
        <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
          <AlertTriangle className="w-4 h-4 text-amber-700" />
          <span>Core AI Safety & Verification Principles</span>
        </div>
        <ul className="text-xs text-amber-900 space-y-2 list-disc pl-5 leading-relaxed">
          <li><strong>AI Never Authorizes Handover:</strong> A 99% match score is only a recommendation for human review. True ownership is proven only when the claimant matches private withheld attributes.</li>
          <li><strong>Zero PII in Model Context:</strong> Full student ID roll numbers, phone numbers, and dorm room codes are masked prior to inference.</li>
          <li><strong>Failure Resilience:</strong> If the inference API is unreachable or rate limited, the deterministic matching pipeline continues seamlessly. No hallucinations are ever returned.</li>
        </ul>
      </div>

    </div>
  );
};
