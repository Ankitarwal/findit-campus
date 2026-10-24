import React from 'react';
import { 
  Sparkles, 
  Search, 
  PlusCircle, 
  ShieldCheck, 
  MapPin, 
  ChevronRight,
  Cpu,
  Lock,
  Layers
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { ItemCard } from '../components/items/ItemCard';
import type { ItemReport } from '../types/database';

interface HomePageProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenReportLost: () => void;
  onOpenReportFound: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigate,
  onOpenReportLost,
  onOpenReportFound,
}) => {
  const { reports, stats } = useData();

  // Get most recent listings
  const recentReports = reports.slice(0, 4);

  return (
    <div className="space-y-16 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24">
        {/* Subtle background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-blue-100/50 via-teal-50/20 to-transparent blur-3xl -z-10 pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200/80 text-xs font-semibold shadow-subtle animate-fadeIn">
            <Sparkles className="w-3.5 h-3.5 text-primary-600" />
            <span>Next-Gen Campus Lost & Found Powered by Google Gemma 4</span>
          </div>

          {/* Heading */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight">
            Lost something on campus? <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary-600 via-primary-700 to-tealAccent-600 bg-clip-text text-transparent">
              Let AI help you find it.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Replace chaotic WhatsApp chats and notice boards. FindIt Campus pairs Google Gemma 4 semantic understanding with privacy-safe ownership verification to return lost belongings faster.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={onOpenReportLost}
              className="btn-primary text-sm px-6 py-3 shadow-md hover:shadow-glow-blue"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Report Lost Item</span>
            </button>

            <button
              onClick={() => onNavigate('browse')}
              className="btn-secondary text-sm px-6 py-3"
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Browse Active Listings</span>
            </button>

            <button
              onClick={onOpenReportFound}
              className="btn-teal text-sm px-6 py-3 shadow-sm hover:shadow-glow-teal"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>I Found an Item</span>
            </button>
          </div>

          {/* Quick Real Database Statistics Bar */}
          <div className="pt-8 max-w-4xl mx-auto">
            <div className="glass-card p-4 sm:p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
              <div className="text-center pt-2 sm:pt-0">
                <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{stats.totalReports}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Total Reports Logged</div>
              </div>
              <div className="text-center pt-2 sm:pt-0">
                <div className="text-2xl sm:text-3xl font-extrabold text-primary-600">{stats.activeMatchesCount}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Gemma 4 Matches Found</div>
              </div>
              <div className="text-center pt-2 sm:pt-0">
                <div className="text-2xl sm:text-3xl font-extrabold text-tealAccent-600">{stats.returnedCount}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Successfully Returned</div>
              </div>
              <div className="text-center pt-2 sm:pt-0">
                <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">{stats.pendingClaimsCount}</div>
                <div className="text-xs font-medium text-slate-500 mt-1">Active Verified Claims</div>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 text-center">
              *Live statistics calculated directly from verified database records.
            </p>
          </div>

        </div>
      </section>

      {/* Visual Demonstration: How Gemma 4 Matches Work */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-card p-6 sm:p-10 border border-slate-200/90 shadow-elevated">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-primary-50 text-primary-700 border border-primary-200/80 mb-2">
              <Cpu className="w-3.5 h-3.5" /> Live Matching Demonstration
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How Gemma 4 Bridges Lost & Found Reports
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Students and finders use totally different words. Gemma 4 performs semantic feature alignment, spatio-temporal matching, and conflict detection.
            </p>
          </div>

          {/* Interactive Match Visualizer Simulation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
            
            {/* Left: Lost report card */}
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge-lost">Lost Report</span>
                <span className="text-[10px] font-mono text-slate-400">FIC-L8421</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Black Leather Bifold Wallet</h4>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                “Lost my Fossil bifold wallet on Tuesday afternoon on the 2nd floor silent reading zone in Central Library.”
              </p>
              <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2 text-[11px] text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-amber-600" />
                <span>Central Library, 2nd Floor</span>
              </div>
            </div>

            {/* Middle: Gemma 4 Evaluation Center */}
            <div className="p-5 rounded-2xl bg-gradient-to-b from-primary-900 to-navy-950 text-white shadow-card text-center space-y-3 relative overflow-hidden">
              <div className="w-12 h-12 rounded-2xl bg-primary-500/20 border border-primary-400/30 flex items-center justify-center mx-auto text-tealAccent-300">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-widest uppercase text-tealAccent-400">
                  Gemma 4 Analysis Pipeline
                </span>
                <div className="text-3xl font-black text-white mt-1">88% Match</div>
                <div className="text-xs text-slate-300 mt-1 font-medium">Recommendation: Request Review</div>
              </div>
              <div className="text-[11px] text-slate-300 bg-white/10 p-2.5 rounded-xl border border-white/10 text-left space-y-1">
                <div>✓ Both specify black leather bifold wallet</div>
                <div>✓ Central Library spatio-temporal match (&lt;3 hrs)</div>
                <div>✓ Cardholder initials matched during claim</div>
              </div>
            </div>

            {/* Right: Found report card */}
            <div className="p-5 rounded-2xl bg-tealAccent-50/50 border border-tealAccent-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="badge-found">Found Report</span>
                <span className="text-[10px] font-mono text-slate-400">FIC-F9104</span>
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Black Leather Wallet Found in Library</h4>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                “Found a black wallet on a wooden desk near east stacks. Handed to security desk temporarily.”
              </p>
              <div className="pt-2 border-t border-tealAccent-200/60 flex items-center gap-2 text-[11px] text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-tealAccent-600" />
                <span>Central Library, East Stacks</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* How it works in 3 Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">How It Works in 3 Steps</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Designed to protect student privacy while maximizing recovery speed.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-6 relative">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-700 font-extrabold flex items-center justify-center text-sm mb-4">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Report Lost or Found</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Submit your report in seconds. Finders can withhold private identifiers (such as student names on ID cards or wallet contents) to prevent fraudulent claims.
            </p>
          </div>

          <div className="glass-card p-6 relative">
            <div className="w-10 h-10 rounded-2xl bg-tealAccent-100 text-tealAccent-700 font-extrabold flex items-center justify-center text-sm mb-4">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Gemma 4 Matches & Explains</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Google Gemma 4 extracts normalized traits, computes semantic compatibility, and presents transparent match rationale with confidence scores and conflict flags.
            </p>
          </div>

          <div className="glass-card p-6 relative">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 font-extrabold flex items-center justify-center text-sm mb-4">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-2">Verify Ownership & Recover</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              The claimant provides secret distinguishing details. Campus Security or the finder verifies the answer and coordinates a safe in-person physical handover.
            </p>
          </div>
        </div>
      </section>

      {/* Feature Cards: AI, Privacy, Claims, Tracking */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <div className="p-2.5 rounded-xl bg-blue-50 text-primary-600 w-fit">
              <Sparkles className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Semantic AI Matching</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Goes beyond exact keywords. Matches synonyms, brands, and contextual descriptions with high fidelity.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <div className="p-2.5 rounded-xl bg-tealAccent-50 text-tealAccent-600 w-fit">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Privacy-First Architecture</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Personal student contact information and identification numbers are never exposed publicly.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 w-fit">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Secure Claim Verification</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Requires authentic private proofs (scratches, stickers, wallpaper, internal contents) to prevent false claims.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-2">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 w-fit">
              <Layers className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Audited Status Lifecycle</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Track status from Reported → Potential Match → Claimed → Under Review → Returned with complete audit logs.
            </p>
          </div>

        </div>
      </section>

      {/* Recent Listings Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Recent Campus Reports</h2>
            <p className="text-xs text-slate-500 mt-0.5">Recently reported lost and found items across campus</p>
          </div>
          <button
            onClick={() => onNavigate('browse')}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 hover:underline"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {recentReports.map(report => (
            <ItemCard
              key={report.id}
              report={report}
              onSelect={(r: ItemReport) => onNavigate('item-detail', { reportId: r.id })}
            />
          ))}
        </div>
      </section>

    </div>
  );
};
