import React from 'react';
import { MapPin, Clock, Sparkles, Tag } from 'lucide-react';
import { CATEGORY_LABELS, STATUS_LABELS } from '../../types/database';
import type { ItemReport, MatchComparison } from '../../types/database';
import { formatRelativeTime } from '../../lib/utils';
import { useData } from '../../context/DataContext';

interface ItemCardProps {
  report: ItemReport;
  onSelect: (report: ItemReport) => void;
  onReviewMatch?: (report: ItemReport) => void;
}

export const ItemCard: React.FC<ItemCardProps> = ({ report, onSelect }) => {
  const { matches } = useData();
  const reportMatches = matches.filter((m: MatchComparison) => m.lost_report_id === report.id || m.found_report_id === report.id);
  const topMatch = reportMatches.length > 0 ? reportMatches[0] : null;

  const isLost = report.report_type === 'lost';
  const statusInfo = STATUS_LABELS[report.status] || { label: report.status, color: 'bg-slate-100 text-slate-700' };

  return (
    <div 
      onClick={() => onSelect(report)}
      className="glass-card hover:shadow-card hover:-translate-y-1 transition-all duration-200 cursor-pointer overflow-hidden flex flex-col group border border-slate-200/80"
    >
      {/* Image Preview with Category Badge */}
      <div className="relative h-44 bg-slate-100 overflow-hidden">
        {report.image_path ? (
          <img
            src={report.image_path}
            alt={report.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
            <Tag className="w-8 h-8 mb-1 text-slate-300" />
            <span className="text-xs">No photo provided</span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className={isLost ? 'badge-lost' : 'badge-found'}>
            <span className={`w-1.5 h-1.5 rounded-full ${isLost ? 'bg-amber-500' : 'bg-emerald-500'}`} />
            {isLost ? 'Lost Item' : 'Found Item'}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>

        {/* Reference Code Pill */}
        <div className="absolute bottom-2 right-2 bg-navy-950/70 backdrop-blur-md text-white text-[10px] font-mono font-medium px-2 py-0.5 rounded-md">
          {report.reference_code}
        </div>
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-medium text-slate-400 mb-1 flex items-center gap-1">
            <span>{CATEGORY_LABELS[report.category]}</span>
          </div>

          <h3 className="font-bold text-slate-900 text-sm line-clamp-1 group-hover:text-primary-600 transition-colors">
            {report.title}
          </h3>

          <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {report.description}
          </p>
        </div>

        {/* Spatio-temporal metadata */}
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{report.location}</span>
          </div>

          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRelativeTime(report.occurred_at)}</span>
            </div>
            
            {/* Top Match Pill if Gemma 4 found match */}
            {topMatch && (
              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary-700 bg-primary-50 px-2 py-0.5 rounded-full border border-primary-200">
                <Sparkles className="w-3 h-3 text-primary-600" />
                {topMatch.relevance_score}% Match
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
