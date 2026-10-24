import React from 'react';
import { 
  PlusCircle, 
  ShieldCheck, 
  Lock, 
  HelpCircle
} from 'lucide-react';

interface HowItWorksPageProps {
  onNavigate: (page: string) => void;
  onOpenReportLost: () => void;
  onOpenReportFound: () => void;
}

export const HowItWorksPage: React.FC<HowItWorksPageProps> = ({
  onNavigate,
  onOpenReportLost,
  onOpenReportFound,
}) => {
  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fadeIn">
      
      {/* Title */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-semibold">
          <HelpCircle className="w-3.5 h-3.5" /> End-to-End Campus Recovery Workflow
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          How FindIt Campus Works
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          From the moment you report a missing item to the verified physical handover at Campus Security, here is how FindIt Campus protects student privacy and speeds up recovery with Google Gemma 4.
        </p>
      </div>

      {/* 3 Steps In-Depth */}
      <div className="space-y-8">
        
        {/* Step 1 */}
        <div className="glass-card p-6 sm:p-8 border border-slate-200/90 shadow-card flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-primary-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-md">
            1
          </div>
          <div className="space-y-3 flex-1">
            <span className="text-xs font-semibold text-primary-600 tracking-wider uppercase">Step One</span>
            <h3 className="text-xl font-bold text-slate-900">Publish a Lost or Found Report</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Whether you left your backpack in the dining hall or discovered an unattended student ID card in the sports complex, submit a listing in under 60 seconds.
            </p>
            <div className="p-3.5 rounded-2xl bg-tealAccent-50/60 border border-tealAccent-100 text-xs text-tealAccent-900 space-y-1">
              <strong className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-tealAccent-700" />
                Privacy-Conscious Found Reports
              </strong>
              <p className="text-[11px] text-slate-600">
                Finders are encouraged to withhold secret details (e.g. name or ID ending digits) from public view so only the genuine owner can provide them during claims.
              </p>
            </div>
          </div>
        </div>

        {/* Step 2 */}
        <div className="glass-card p-6 sm:p-8 border border-slate-200/90 shadow-card flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-tealAccent-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-md">
            2
          </div>
          <div className="space-y-3 flex-1">
            <span className="text-xs font-semibold text-tealAccent-600 tracking-wider uppercase">Step Two</span>
            <h3 className="text-xl font-bold text-slate-900">Google Gemma 4 Analyzes & Matches</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Google Gemma 4 parses unstructured descriptions to identify item category, brand, color, and location landmarks. It then executes a two-stage candidate comparison:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Stage 1: Candidate Filter</span>
                <span className="text-slate-500 text-[11px]">Database retrieval filtering opposite items by campus zone, category, and date proximity.</span>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-800 block mb-1">Stage 2: Semantic Comparison</span>
                <span className="text-slate-500 text-[11px]">Gemma 4 evaluates semantic description similarity, conflicts, and generates explainable match cards.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Step 3 */}
        <div className="glass-card p-6 sm:p-8 border border-slate-200/90 shadow-card flex flex-col md:flex-row gap-6 items-start">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-extrabold text-lg flex items-center justify-center shrink-0 shadow-md">
            3
          </div>
          <div className="space-y-3 flex-1">
            <span className="text-xs font-semibold text-indigo-600 tracking-wider uppercase">Step Three</span>
            <h3 className="text-xl font-bold text-slate-900">Verify Ownership & Secure Handover</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              AI suggests potential matches, but <strong>human verification safeguards the return</strong>.
            </p>
            <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-5">
              <li>The claimant enters secret distinguishing traits (scratch location, lockscreen wallpaper, cardholder initials).</li>
              <li>The finder or Campus Security reviews the private claim against the physical item.</li>
              <li>Handover occurs at the designated Campus Security Desk, and the item status is marked <strong>RETURNED</strong>.</li>
            </ul>
          </div>
        </div>

      </div>

      {/* CTA Bottom */}
      <div className="glass-card p-8 text-center space-y-4 border border-slate-200">
        <h3 className="text-xl font-bold text-slate-900">Ready to recover or report a campus item?</h3>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button onClick={onOpenReportLost} className="btn-primary text-xs px-5 py-2.5">
            <PlusCircle className="w-3.5 h-3.5" /> Report Lost Item
          </button>
          <button onClick={onOpenReportFound} className="btn-teal text-xs px-5 py-2.5">
            <ShieldCheck className="w-3.5 h-3.5" /> Report Found Item
          </button>
          <button onClick={() => onNavigate('browse')} className="btn-secondary text-xs px-5 py-2.5">
            Browse Active Listings
          </button>
        </div>
      </div>

    </div>
  );
};
