import React, { useState } from 'react';
import { 
  Shield, 
  CheckCircle2, 
  Lock, 
  Check, 
  Sparkles,
  ShieldAlert
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import type { ClaimStatus, ReportStatus, ItemReport, Claim, MatchComparison, AuditLog } from '../types/database';
import { formatDateTime } from '../lib/utils';

interface AdminDashboardPageProps {
  onNavigate: (page: string, params?: any) => void;
}

export const AdminDashboardPage: React.FC<AdminDashboardPageProps> = ({ onNavigate }) => {
  const { profile, isAdmin } = useAuth();
  const { 
    reports, 
    claims, 
    matches, 
    auditLogs, 
    updateClaimStatus, 
    updateReportStatus, 
    stats 
  } = useData();

  const [activeTab, setActiveTab] = useState<'claims' | 'reports' | 'matches' | 'audit'>('claims');
  const [selectedClaimNotes, setSelectedClaimNotes] = useState<Record<string, string>>({});
  const [actionFeedback, setActionFeedback] = useState<string>('');

  // Security gate: non-admins are blocked
  if (!isAdmin) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-900">Restricted Administration Access</h2>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
          This portal requires university administration privileges. Student roles cannot access claim verification logs or moderation controls.
        </p>
        <button onClick={() => onNavigate('home')} className="btn-secondary text-xs px-5 py-2.5">
          Return to Campus Home
        </button>
      </div>
    );
  }

  const handleClaimAction = async (claimId: string, status: ClaimStatus) => {
    const notes = selectedClaimNotes[claimId] || '';
    await updateClaimStatus(claimId, status, notes);
    setActionFeedback(`Claim updated to ${status.replace('_', ' ').toUpperCase()}`);
    setTimeout(() => setActionFeedback(''), 3000);
  };

  const handleReportAction = async (reportId: string, status: ReportStatus) => {
    await updateReportStatus(reportId, status);
    setActionFeedback(`Listing status updated to ${status.toUpperCase()}`);
    setTimeout(() => setActionFeedback(''), 3000);
  };

  const pendingClaims = claims.filter((c: Claim) => c.status === 'pending' || c.status === 'under_review');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-700 border border-amber-200">
            <Shield className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              Campus Security & Admin Portal
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-200">
                Staff Authorization
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review ownership claims, verify physical handovers, moderate listings, and inspect audit trails.
            </p>
          </div>
        </div>

        <div className="text-xs font-medium text-slate-500 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-subtle">
          Signed in as: <strong className="text-slate-800">{profile?.display_name}</strong>
        </div>
      </div>

      {actionFeedback && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionFeedback}</span>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card p-4 border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Claims</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">{pendingClaims.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting physical verification</div>
        </div>
        <div className="glass-card p-4 border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Reports</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{stats.totalReports}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">{stats.lostCount} lost • {stats.foundCount} found</div>
        </div>
        <div className="glass-card p-4 border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active AI Matches</div>
          <div className="text-2xl font-black text-primary-600 mt-1">{stats.activeMatchesCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Gemma 4 evaluated pairs</div>
        </div>
        <div className="glass-card p-4 border border-slate-200">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items Returned</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">{stats.returnedCount}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Verified handover complete</div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto pb-2">
        {[
          { id: 'claims', label: `Ownership Claims (${claims.length})` },
          { id: 'reports', label: `Manage Listings (${reports.length})` },
          { id: 'matches', label: `Gemma 4 Matches (${matches.length})` },
          { id: 'audit', label: `Security Audit Logs (${auditLogs.length})` },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-amber-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div>
        
        {/* TAB 1: CLAIMS VERIFICATION */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl text-xs text-blue-900 flex items-start gap-2.5">
              <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <strong>Physical Handover Protocol:</strong> Compare the claimant's secret distinguishing answer with the item's withheld traits before approving. Approving marks the item as RETURNED.
              </div>
            </div>

            {claims.map((claim: Claim) => {
              const targetReport = reports.find((r: ItemReport) => r.id === claim.report_id);
              return (
                <div key={claim.id} className="glass-card p-6 border border-slate-200 shadow-card space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">
                        Claim for: {targetReport?.title || 'Unknown Item'}
                      </span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {targetReport?.reference_code}
                      </span>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      claim.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                      claim.status === 'under_review' ? 'bg-purple-100 text-purple-800' :
                      claim.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {claim.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>

                  {/* Private Details Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 space-y-2">
                      <div className="font-bold text-amber-900 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-600" />
                        Finder's Private Withheld Data (Ground Truth)
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {targetReport?.distinguishing_features || 'No secret traits recorded by finder.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-2">
                      <div className="font-bold text-blue-900 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
                        Claimant's Submitted Verification Answer
                      </div>
                      <p className="text-slate-700 leading-relaxed">
                        {claim.private_claim_details}
                      </p>
                      <div className="text-[11px] text-slate-500 pt-1">
                        Secret Key Answer: <strong className="text-slate-800">{claim.verification_answer}</strong>
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Email: {claim.contact_email} {claim.contact_phone && `• Phone: ${claim.contact_phone}`}
                      </div>
                    </div>
                  </div>

                  {/* Admin notes input & actions */}
                  <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <input
                      type="text"
                      placeholder="Add official verification note (e.g. Student ID verified in person at Central Desk)..."
                      value={selectedClaimNotes[claim.id] || ''}
                      onChange={e => setSelectedClaimNotes({ ...selectedClaimNotes, [claim.id]: e.target.value })}
                      className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />

                    <div className="flex items-center gap-2">
                      {claim.status !== 'under_review' && claim.status !== 'approved' && (
                        <button
                          onClick={() => handleClaimAction(claim.id, 'under_review')}
                          className="btn-secondary text-xs px-3.5 py-2"
                        >
                          Mark Under Review
                        </button>
                      )}

                      {claim.status !== 'approved' && (
                        <button
                          onClick={() => handleClaimAction(claim.id, 'approved')}
                          className="btn-primary text-xs px-4 py-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check className="w-3.5 h-3.5" />
                          Approve & Handover
                        </button>
                      )}

                      {claim.status !== 'rejected' && (
                        <button
                          onClick={() => handleClaimAction(claim.id, 'rejected')}
                          className="btn-secondary text-xs px-3.5 py-2 text-rose-600 hover:bg-rose-50"
                        >
                          Reject Claim
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: MANAGE LISTINGS & MODERATION */}
        {activeTab === 'reports' && (
          <div className="space-y-3">
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="p-3.5">Reference</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Title</th>
                    <th className="p-3.5">Location</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Moderation Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((r: ItemReport) => (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="p-3.5 font-mono text-slate-700 font-medium">{r.reference_code}</td>
                      <td className="p-3.5">
                        <span className={r.report_type === 'lost' ? 'badge-lost' : 'badge-found'}>
                          {r.report_type}
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 max-w-[200px] truncate">{r.title}</td>
                      <td className="p-3.5 text-slate-500 max-w-[150px] truncate">{r.location}</td>
                      <td className="p-3.5">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1.5">
                        {r.status !== 'returned' && (
                          <button
                            onClick={() => handleReportAction(r.id, 'returned')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          >
                            Mark Returned
                          </button>
                        )}
                        {r.status !== 'rejected' && (
                          <button
                            onClick={() => handleReportAction(r.id, 'rejected')}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                          >
                            Suspend
                          </button>
                        )}
                        <button
                          onClick={() => onNavigate('item-detail', { reportId: r.id })}
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 hover:bg-slate-200"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: GEMMA 4 MATCHES */}
        {activeTab === 'matches' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m: MatchComparison) => {
                const lostItem = reports.find((r: ItemReport) => r.id === m.lost_report_id);
                const foundItem = reports.find((r: ItemReport) => r.id === m.found_report_id);
                return (
                  <div key={m.id} className="glass-card p-5 border border-slate-200 shadow-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {m.relevance_score}% Relevance Score
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">{m.model_name}</span>
                    </div>

                    <div className="text-xs space-y-1">
                      <div><strong>Lost Item:</strong> {lostItem?.title} ({lostItem?.reference_code})</div>
                      <div><strong>Found Item:</strong> {foundItem?.title} ({foundItem?.reference_code})</div>
                    </div>

                    <div className="text-[11px] text-slate-600 space-y-0.5">
                      {m.match_reasons.slice(0, 3).map((reason: string, i: number) => (
                        <div key={i} className="flex items-start gap-1">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{reason}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => lostItem && onNavigate('item-detail', { reportId: lostItem.id })}
                        className="text-xs text-primary-600 hover:underline font-semibold"
                      >
                        Inspect AI Comparison Card →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'audit' && (
          <div className="glass-card p-6 border border-slate-200 shadow-card space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-xs sm:text-sm uppercase tracking-wider">
                Immutable Campus Audit Trail
              </h3>
              <span className="text-[11px] text-slate-400">Append-only security log</span>
            </div>

            <div className="space-y-2.5 max-h-[500px] overflow-y-auto divide-y divide-slate-100">
              {auditLogs.map((log: AuditLog) => (
                <div key={log.id} className="pt-2.5 first:pt-0 flex items-start justify-between gap-4 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {log.action}
                      </span>
                      <span className="font-semibold text-slate-800">{log.actor_name || 'System'}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5 font-mono">
                      Target: {log.entity_type} • ID: {log.entity_id}
                    </p>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
                    {formatDateTime(log.created_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
