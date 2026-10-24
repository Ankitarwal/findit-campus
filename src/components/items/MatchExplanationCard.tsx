import React from 'react';
import { 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle, 
  ShieldCheck, 
  MapPin, 
  Calendar,
  ExternalLink 
} from 'lucide-react';
import type { MatchComparison, ItemReport } from '../../types/database';
import { getScoreColor, formatRelativeTime } from '../../lib/utils';

interface MatchExplanationCardProps {
  match: MatchComparison;
  currentReport?: ItemReport;
  oppositeReport: ItemReport;
  onRequestClaim: (targetReport: ItemReport) => void;
  onViewOppositeReport: (targetReport: ItemReport) => void;
}

export const MatchExplanationCard: React.FC<MatchExplanationCardProps> = ({
  match,
  oppositeReport,
  onRequestClaim,
  onViewOppositeReport,
}) => {
  const scoreColors = getScoreColor(match.relevance_score);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-5 sm:p-6 transition-all hover:border-primary-300">
      
      {/* Header: Score & Badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg border ${scoreColors.bg} ${scoreColors.text} ${scoreColors.border}`}>
            {match.relevance_score}%
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm">Gemma 4 Match Suggestion</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-50 text-primary-700 border border-primary-200">
                {match.recommendation === 'request_review' ? 'Strong Match' : 'Inconclusive Review'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluated by <span className="font-mono text-slate-700">{match.model_name}</span>
            </p>
          </div>
        </div>

        <button
          onClick={() => onViewOppositeReport(oppositeReport)}
          className="text-xs text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1 hover:underline"
        >
          View Matched Listing <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Opposing Item Preview Snippet */}
      <div className="my-4 p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex items-center gap-3.5">
        {oppositeReport.image_path ? (
          <img
            src={oppositeReport.image_path}
            alt={oppositeReport.title}
            className="w-14 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-xs shrink-0">
            No img
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              oppositeReport.report_type === 'lost' ? 'badge-lost' : 'badge-found'
            }`}>
              {oppositeReport.report_type === 'lost' ? 'Lost Item' : 'Found Item'}
            </span>
            <span className="text-xs font-mono text-slate-400">{oppositeReport.reference_code}</span>
          </div>
          <h4 className="font-bold text-slate-800 text-xs sm:text-sm truncate mt-0.5">
            {oppositeReport.title}
          </h4>
          <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-0.5">
            <span className="truncate flex items-center gap-1">
              <MapPin className="w-3 h-3 text-slate-400" /> {oppositeReport.location}
            </span>
            <span className="shrink-0 flex items-center gap-1">
              <Calendar className="w-3 h-3 text-slate-400" /> {formatRelativeTime(oppositeReport.occurred_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Explanation Breakdown Grid */}
      <div className="space-y-3.5 text-xs">
        
        {/* Shared Characteristics */}
        {match.match_reasons && match.match_reasons.length > 0 && (
          <div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Shared Characteristics & Compatibility
            </div>
            <ul className="space-y-1 pl-5 list-disc text-slate-600 leading-relaxed marker:text-emerald-500">
              {match.match_reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Missing Information / Ambiguities */}
        {match.missing_information && match.missing_information.length > 0 && (
          <div>
            <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
              Information Withheld or Unverified
            </div>
            <ul className="space-y-1 pl-5 list-disc text-slate-600 leading-relaxed marker:text-amber-500">
              {match.missing_information.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Conflicts (if any) */}
        {match.conflicts && match.conflicts.length > 0 && (
          <div>
            <div className="font-semibold text-rose-700 flex items-center gap-1.5 mb-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              Observed Discrepancies
            </div>
            <ul className="space-y-1 pl-5 list-disc text-rose-600 leading-relaxed marker:text-rose-500">
              {match.conflicts.map((conflict, i) => (
                <li key={i}>{conflict}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Mandatory Disclaimer */}
      <div className="mt-4 p-3 rounded-xl bg-amber-50/70 border border-amber-200/60 text-[11px] text-amber-900 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div>
          <strong>AI Safety Notice:</strong> AI suggestions are preliminary. Verify ownership before returning an item. Never release belongings without verifying identifying traits.
        </div>
      </div>

      {/* Action Footer */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
        <span className="text-[11px] text-slate-400">
          Match confidence: <strong className="text-slate-700 font-semibold">{match.relevance_score}/100</strong>
        </span>

        {/* If the current report is lost, student can file claim on the found item */}
        {oppositeReport.report_type === 'found' && (
          <button
            onClick={() => onRequestClaim(oppositeReport)}
            className="btn-primary text-xs px-4 py-2"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Request Secure Verification
          </button>
        )}
      </div>
    </div>
  );
};
