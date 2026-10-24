import React, { useState } from 'react';
import { 
  ArrowLeft, 
  MapPin, 
  Calendar, 
  Sparkles, 
  ShieldCheck, 
  Tag, 
  Flag, 
  CheckCircle2, 
  Lock, 
  RotateCw,
  PlusCircle,
  FileCheck
} from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { CATEGORY_LABELS, STATUS_LABELS } from '../types/database';
import type { ItemReport, Claim, MatchComparison } from '../types/database';
import { formatDateTime, formatRelativeTime } from '../lib/utils';
import { ReportTimeline } from '../components/dashboard/ReportTimeline';
import { MatchExplanationCard } from '../components/items/MatchExplanationCard';
import { ClaimModal } from '../components/items/ClaimModal';

interface ItemDetailPageProps {
  reportId: string;
  onNavigate: (page: string, params?: any) => void;
  onOpenReportLost: () => void;
}

export const ItemDetailPage: React.FC<ItemDetailPageProps> = ({
  reportId,
  onNavigate,
  onOpenReportLost,
}) => {
  const { reports, matches, claims, triggerAiMatching, updateClaimStatus } = useData();
  const { user, isAdmin } = useAuth();

  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [isScanningAi, setIsScanningAi] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [flagReported, setFlagReported] = useState(false);

  const report = reports.find((r: ItemReport) => r.id === reportId);

  if (!report) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Report Not Found</h2>
        <p className="text-xs text-slate-500">The requested item listing could not be located.</p>
        <button onClick={() => onNavigate('browse')} className="btn-primary text-xs px-4 py-2">
          Back to Browse Listings
        </button>
      </div>
    );
  }

  const isOwner = user?.id === report.reporter_id;
  const isLost = report.report_type === 'lost';
  const statusInfo = STATUS_LABELS[report.status] || { label: report.status, color: 'bg-slate-100 text-slate-700' };

  // Gemma 4 Matches for this report
  const relevantMatches = matches.filter((m: MatchComparison) => m.lost_report_id === report.id || m.found_report_id === report.id);

  // Claims associated with this report
  const reportClaims = claims.filter((c: Claim) => c.report_id === report.id);

  const handleManualAiScan = async () => {
    setIsScanningAi(true);
    try {
      await triggerAiMatching(report.id);
      setSuccessMsg('Gemma 4 matching scan completed! Candidate rankings updated.');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch {
      // handled
    } finally {
      setIsScanningAi(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fadeIn">
      
      {/* Top Navigation & Status Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('browse')}
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Browse Listings</span>
        </button>

        <div className="flex items-center gap-2">
          <span className={isLost ? 'badge-lost' : 'badge-found'}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Main Details Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-card overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          
          {/* Item Image */}
          <div className="h-72 md:h-full min-h-[300px] bg-slate-100 relative overflow-hidden flex items-center justify-center">
            {report.image_path ? (
              <img
                src={report.image_path}
                alt={report.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 text-slate-400">
                <Tag className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                <span className="text-xs">No photograph provided</span>
              </div>
            )}
            <div className="absolute bottom-3 left-3 bg-navy-950/75 backdrop-blur-md text-white text-xs font-mono font-medium px-3 py-1 rounded-xl">
              Reference: {report.reference_code}
            </div>
          </div>

          {/* Details Content */}
          <div className="p-6 sm:p-8 flex flex-col justify-between space-y-6">
            <div className="space-y-4">
              <div>
                <span className="text-xs font-semibold text-primary-600 tracking-wide uppercase">
                  {CATEGORY_LABELS[report.category]}
                </span>
                <h1 className="text-2xl font-extrabold text-slate-900 mt-0.5 leading-snug">
                  {report.title}
                </h1>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {report.description}
              </p>

              {/* Distinguishing Features if public or if owner/admin */}
              {report.distinguishing_features && (!report.withhold_public_details || isOwner || isAdmin) && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="font-semibold text-slate-700 mb-0.5 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-tealAccent-600" />
                    Distinguishing Characteristics:
                  </div>
                  <div className="text-slate-600">{report.distinguishing_features}</div>
                </div>
              )}

              {/* Privacy Withhold Notice */}
              {report.withhold_public_details && !isOwner && !isAdmin && (
                <div className="p-3 rounded-2xl bg-tealAccent-50/70 border border-tealAccent-200/60 text-tealAccent-900 text-xs flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-tealAccent-700 shrink-0" />
                  <span>Identifying serial/name withheld for verification safety.</span>
                </div>
              )}

              {/* Metadata */}
              <div className="pt-2 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  <span><strong>Location:</strong> {report.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span><strong>Reported Date:</strong> {formatDateTime(report.occurred_at)} ({formatRelativeTime(report.occurred_at)})</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center gap-2.5">
              
              {/* Claim Action (If Found item and user is not the reporter) */}
              {!isLost && !isOwner && report.status !== 'returned' && (
                <button
                  onClick={() => setClaimModalOpen(true)}
                  className="btn-primary text-xs px-5 py-2.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Submit Ownership Claim</span>
                </button>
              )}

              {/* Re-run AI scan */}
              <button
                onClick={handleManualAiScan}
                disabled={isScanningAi}
                className="btn-secondary text-xs px-4 py-2.5 flex items-center gap-1.5"
                title="Re-run Google Gemma 4 semantic comparison with latest listings"
              >
                <RotateCw className={`w-3.5 h-3.5 ${isScanningAi ? 'animate-spin text-primary-600' : 'text-slate-500'}`} />
                <span>{isScanningAi ? 'Scanning...' : 'Scan Gemma 4 Matches'}</span>
              </button>

              {/* Report Similar */}
              <button
                onClick={onOpenReportLost}
                className="btn-secondary text-xs px-4 py-2.5"
              >
                <PlusCircle className="w-3.5 h-3.5 text-slate-500" />
                <span>Report Similar Item</span>
              </button>

              {/* Flag / Moderation */}
              <button
                onClick={() => setFlagReported(true)}
                className={`p-2.5 rounded-xl border text-xs transition-colors ml-auto ${
                  flagReported ? 'bg-rose-50 text-rose-600 border-rose-200' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
                title="Report suspicious or inappropriate listing"
              >
                <Flag className="w-4 h-4" />
              </button>

            </div>
          </div>

        </div>
      </div>

      {/* Lifecycle Progress Timeline */}
      <div className="glass-card p-6 border border-slate-200/90 shadow-card">
        <h3 className="font-bold text-slate-900 text-sm mb-2">Item Recovery Timeline</h3>
        <ReportTimeline currentStatus={report.status} />
      </div>

      {/* Admin / Finder Claims Review Section (Visible only to Finder or Admin) */}
      {(isOwner || isAdmin) && reportClaims.length > 0 && (
        <div className="glass-card p-6 border border-indigo-100 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-indigo-600" />
              <span>Received Ownership Claims ({reportClaims.length})</span>
            </h3>
            <span className="text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200">
              Restricted to Finder & Campus Security
            </span>
          </div>

          <div className="space-y-3">
            {reportClaims.map((claim: Claim) => (
              <div key={claim.id} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-subtle space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-xs font-bold text-slate-800">
                      Claimant: {claim.claimant?.display_name || claim.contact_email}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-2">
                      ({formatRelativeTime(claim.created_at)})
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    claim.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                    claim.status === 'under_review' ? 'bg-purple-100 text-purple-800' :
                    claim.status === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    Status: {claim.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
                  <div><strong>Secret Distinguishing Proof:</strong> {claim.private_claim_details}</div>
                  <div><strong>Secret Answer:</strong> {claim.verification_answer}</div>
                  <div><strong>Contact Email:</strong> {claim.contact_email}</div>
                  {claim.contact_phone && <div><strong>Phone:</strong> {claim.contact_phone}</div>}
                  {claim.admin_notes && <div><strong>Admin Review Notes:</strong> {claim.admin_notes}</div>}
                </div>

                {/* Review Actions */}
                <div className="flex items-center gap-2 pt-1">
                  {claim.status === 'pending' && (
                    <button
                      onClick={() => updateClaimStatus(claim.id, 'under_review', 'Verification initiated with Campus Security')}
                      className="btn-secondary text-[11px] px-3 py-1.5"
                    >
                      Move to Under Review
                    </button>
                  )}
                  {claim.status !== 'approved' && (
                    <button
                      onClick={() => updateClaimStatus(claim.id, 'approved', 'Ownership confirmed. Item successfully handed over.')}
                      className="btn-primary text-[11px] px-3 py-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3" /> Approve Claim & Mark Returned
                    </button>
                  )}
                  {claim.status !== 'rejected' && claim.status !== 'approved' && (
                    <button
                      onClick={() => updateClaimStatus(claim.id, 'rejected', 'Verification traits did not match.')}
                      className="btn-secondary text-[11px] px-3 py-1.5 text-rose-600 hover:bg-rose-50"
                    >
                      Reject Claim
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gemma 4 Candidate Matches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <span>Gemma 4 AI Potential Matches ({relevantMatches.length})</span>
            </h3>
            <p className="text-xs text-slate-500">
              Autonomous multi-factor semantic comparison against opposite-type reports
            </p>
          </div>
        </div>

        {relevantMatches.length === 0 ? (
          <div className="glass-card p-8 text-center space-y-2 max-w-lg mx-auto">
            <Sparkles className="w-8 h-8 mx-auto text-primary-400" />
            <h4 className="font-bold text-slate-800 text-xs sm:text-sm">No Potential Matches Identified Yet</h4>
            <p className="text-xs text-slate-500">
              Gemma 4 will continuously evaluate newly submitted reports. You will receive an instant notification when a matching item is registered.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {relevantMatches.map((match: MatchComparison) => {
              const oppositeId = match.lost_report_id === report.id ? match.found_report_id : match.lost_report_id;
              const oppositeReport = reports.find((r: ItemReport) => r.id === oppositeId);
              if (!oppositeReport) return null;

              return (
                <MatchExplanationCard
                  key={match.id}
                  match={match}
                  currentReport={report}
                  oppositeReport={oppositeReport}
                  onRequestClaim={(_target: ItemReport) => setClaimModalOpen(true)}
                  onViewOppositeReport={(target: ItemReport) => onNavigate('item-detail', { reportId: target.id })}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Claim Modal */}
      {claimModalOpen && (
        <ClaimModal
          report={report}
          onClose={() => setClaimModalOpen(false)}
          onSuccess={() => {
            setClaimModalOpen(false);
            setSuccessMsg('Claim submitted successfully! The finder and Campus Security have been notified for physical handover verification.');
          }}
        />
      )}

    </div>
  );
};
