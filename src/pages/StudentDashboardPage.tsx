import React, { useState } from 'react';
import { 
  Sparkles, 
  Bell, 
  PlusCircle, 
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { formatRelativeTime } from '../lib/utils';
import { STATUS_LABELS } from '../types/database';
import type { ItemReport, MatchComparison, Claim, Notification } from '../types/database';
import { ReportTimeline } from '../components/dashboard/ReportTimeline';

interface StudentDashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
  onOpenReportLost: () => void;
  onOpenReportFound: () => void;
}

export const StudentDashboardPage: React.FC<StudentDashboardPageProps> = ({
  onNavigate,
  onOpenReportLost,
  onOpenReportFound,
}) => {
  const { user, profile } = useAuth();
  const { reports, matches, claims, notifications } = useData();

  const [activeTab, setActiveTab] = useState<'lost' | 'found' | 'matches' | 'claims' | 'notifications' | 'profile'>('lost');

  const myLostReports = reports.filter((r: ItemReport) => r.reporter_id === user?.id && r.report_type === 'lost');
  const myFoundReports = reports.filter((r: ItemReport) => r.reporter_id === user?.id && r.report_type === 'found');
  
  // Matches where user is either the lost reporter or found reporter
  const myReportIds = new Set([...myLostReports, ...myFoundReports].map((r: ItemReport) => r.id));
  const myMatches = matches.filter((m: MatchComparison) => myReportIds.has(m.lost_report_id) || myReportIds.has(m.found_report_id));

  // Claims filed by user
  const myClaims = claims.filter((c: Claim) => c.claimant_id === user?.id);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header Profile Summary */}
      <div className="glass-card p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <img
            src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'}
            alt="avatar"
            className="w-16 h-16 rounded-2xl object-cover border-2 border-primary-500 shadow-md"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">{profile?.display_name || 'Student'}</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                Verified Student
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">{profile?.email}</p>
            <p className="text-[11px] text-slate-400 mt-1">Student ID: FIC-STU-{user?.id.slice(-6).toUpperCase()}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button onClick={onOpenReportLost} className="btn-primary text-xs px-4 py-2">
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Report Lost</span>
          </button>
          <button onClick={onOpenReportFound} className="btn-teal text-xs px-4 py-2">
            <span>Report Found</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'lost', label: `My Lost Reports (${myLostReports.length})` },
          { id: 'found', label: `My Found Reports (${myFoundReports.length})` },
          { id: 'matches', label: `Potential Matches (${myMatches.length})` },
          { id: 'claims', label: `My Claims (${myClaims.length})` },
          { id: 'notifications', label: `Notifications (${notifications.length})` },
          { id: 'profile', label: 'Profile Settings' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        
        {/* A. My Lost Reports */}
        {activeTab === 'lost' && (
          <div className="space-y-4">
            {myLostReports.length === 0 ? (
              <div className="glass-card p-12 text-center max-w-md mx-auto space-y-3">
                <p className="text-xs text-slate-500">You haven't reported any lost items yet.</p>
                <button onClick={onOpenReportLost} className="btn-primary text-xs px-4 py-2">
                  Report a Lost Item
                </button>
              </div>
            ) : (
              myLostReports.map((report: ItemReport) => (
                <div key={report.id} className="glass-card p-5 border border-slate-200/90 shadow-subtle space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="badge-lost">Lost Item</span>
                      <span className="text-xs font-mono font-medium text-slate-400">{report.reference_code}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_LABELS[report.status].color}`}>
                        {STATUS_LABELS[report.status].label}
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate('item-detail', { reportId: report.id })}
                      className="text-xs font-semibold text-primary-600 hover:underline flex items-center gap-1"
                    >
                      View Report Details <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{report.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{report.description}</p>
                  
                  <div className="pt-2">
                    <ReportTimeline currentStatus={report.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* B. My Found Reports */}
        {activeTab === 'found' && (
          <div className="space-y-4">
            {myFoundReports.length === 0 ? (
              <div className="glass-card p-12 text-center max-w-md mx-auto space-y-3">
                <p className="text-xs text-slate-500">You haven't reported any found items yet.</p>
                <button onClick={onOpenReportFound} className="btn-teal text-xs px-4 py-2">
                  Register a Found Item
                </button>
              </div>
            ) : (
              myFoundReports.map((report: ItemReport) => (
                <div key={report.id} className="glass-card p-5 border border-slate-200/90 shadow-subtle space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="badge-found">Found Item</span>
                      <span className="text-xs font-mono font-medium text-slate-400">{report.reference_code}</span>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_LABELS[report.status].color}`}>
                        {STATUS_LABELS[report.status].label}
                      </span>
                    </div>
                    <button
                      onClick={() => onNavigate('item-detail', { reportId: report.id })}
                      className="text-xs font-semibold text-tealAccent-700 hover:underline flex items-center gap-1"
                    >
                      View Details & Claims <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{report.title}</h3>
                  <p className="text-xs text-slate-600 line-clamp-2">{report.description}</p>
                  
                  <div className="pt-2">
                    <ReportTimeline currentStatus={report.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* C. Potential Matches */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            {myMatches.length === 0 ? (
              <div className="glass-card p-12 text-center max-w-md mx-auto space-y-3">
                <Sparkles className="w-8 h-8 text-primary-400 mx-auto" />
                <p className="text-xs text-slate-500">No active AI matches found yet for your reports.</p>
              </div>
            ) : (
              myMatches.map((match: MatchComparison) => {
                const lostItem = reports.find((r: ItemReport) => r.id === match.lost_report_id);
                const foundItem = reports.find((r: ItemReport) => r.id === match.found_report_id);
                if (!lostItem || !foundItem) return null;

                return (
                  <div key={match.id} className="glass-card p-5 border border-slate-200/90 shadow-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary-700 bg-primary-50 px-2.5 py-1 rounded-full border border-primary-200 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          {match.relevance_score}% Match Confidence
                        </span>
                        <span className="text-xs text-slate-500">Evaluated by {match.model_name}</span>
                      </div>
                      <button
                        onClick={() => onNavigate('item-detail', { reportId: lostItem.id })}
                        className="text-xs font-semibold text-primary-600 hover:underline"
                      >
                        Inspect Match
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/60">
                      <div>
                        <span className="font-bold text-amber-700">Lost:</span> {lostItem.title}
                        <div className="text-[11px] text-slate-400">{lostItem.location}</div>
                      </div>
                      <div>
                        <span className="font-bold text-emerald-700">Found:</span> {foundItem.title}
                        <div className="text-[11px] text-slate-400">{foundItem.location}</div>
                      </div>
                    </div>

                    <div className="text-xs text-slate-600">
                      <strong>Reasons:</strong> {match.match_reasons.join('; ')}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* D. My Claims */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            {myClaims.length === 0 ? (
              <div className="glass-card p-12 text-center max-w-md mx-auto space-y-2">
                <p className="text-xs text-slate-500">You haven't filed any ownership claims yet.</p>
              </div>
            ) : (
              myClaims.map((claim: Claim) => {
                const targetReport = reports.find((r: ItemReport) => r.id === claim.report_id);
                return (
                  <div key={claim.id} className="glass-card p-5 border border-slate-200/90 shadow-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">
                          Claim for: {targetReport?.title || 'Found Item'}
                        </span>
                        <span className="text-xs font-mono text-slate-400">{targetReport?.reference_code}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                        claim.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                        claim.status === 'under_review' ? 'bg-purple-100 text-purple-800' :
                        claim.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        Status: {claim.status.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 space-y-1">
                      <div><strong>Your Provided Proof:</strong> {claim.private_claim_details}</div>
                      {claim.admin_notes && (
                        <div className="text-indigo-700 font-medium">
                          <strong>Admin Notes:</strong> {claim.admin_notes}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end">
                      <button
                        onClick={() => targetReport && onNavigate('item-detail', { reportId: targetReport.id })}
                        className="text-xs text-primary-600 hover:underline font-medium"
                      >
                        View Associated Report
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* E. Notifications */}
        {activeTab === 'notifications' && (
          <div className="glass-card p-6 divide-y divide-slate-100">
            {notifications.map((n: Notification) => (
              <div key={n.id} className="py-3.5 first:pt-0 last:pb-0 flex items-start gap-3">
                <Bell className="w-4 h-4 text-primary-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-800">{n.title}</h4>
                    <span className="text-[10px] text-slate-400">{formatRelativeTime(n.created_at)}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-0.5">{n.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* F. Profile Settings */}
        {activeTab === 'profile' && (
          <div className="glass-card p-6 max-w-lg space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Account Settings</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1">Display Name</label>
                <input
                  type="text"
                  disabled
                  value={profile?.display_name || ''}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Campus Email</label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-slate-500 mb-1">Assigned Role</label>
                <input
                  type="text"
                  disabled
                  value={profile?.role || 'student'}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-semibold cursor-not-allowed"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  *Role privilege is protected by Row Level Security (RLS) and cannot be modified by students.
                </p>
              </div>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
