import React from 'react';
import { Check, AlertCircle } from 'lucide-react';
import type { ReportStatus } from '../../types/database';

interface ReportTimelineProps {
  currentStatus: ReportStatus;
}

const STAGES: { key: ReportStatus; label: string; desc: string }[] = [
  { key: 'reported', label: 'Reported', desc: 'Listing published & indexed' },
  { key: 'potential_match', label: 'AI Match', desc: 'Gemma 4 identified candidates' },
  { key: 'claim_requested', label: 'Claim Filed', desc: 'Ownership claim submitted' },
  { key: 'under_review', label: 'Under Review', desc: 'Details verified by Security' },
  { key: 'returned', label: 'Returned', desc: 'Item successfully recovered' },
];

export const ReportTimeline: React.FC<ReportTimelineProps> = ({ currentStatus }) => {
  const getStageIndex = (status: ReportStatus): number => {
    switch (status) {
      case 'reported': return 0;
      case 'potential_match': return 1;
      case 'claim_requested': return 2;
      case 'under_review': return 3;
      case 'returned': return 4;
      default: return 0;
    }
  };

  const currentIndex = getStageIndex(currentStatus);
  const isTerminated = currentStatus === 'rejected' || currentStatus === 'cancelled' || currentStatus === 'closed';

  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-between relative">
        {/* Progress connecting line */}
        <div className="absolute top-4 left-6 right-6 h-0.5 bg-slate-200 z-0">
          <div
            className="h-full bg-primary-600 transition-all duration-500"
            style={{ width: `${(Math.min(currentIndex, 4) / 4) * 100}%` }}
          />
        </div>

        {STAGES.map((stage, idx) => {
          const isCompleted = idx < currentIndex;
          const isCurrent = idx === currentIndex;

          return (
            <div key={stage.key} className="flex flex-col items-center relative z-10 text-center flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted
                    ? 'bg-primary-600 text-white shadow-sm'
                    : isCurrent
                    ? 'bg-white border-2 border-primary-600 text-primary-600 ring-4 ring-primary-100 shadow-md'
                    : 'bg-white border-2 border-slate-200 text-slate-400'
                }`}
              >
                {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
              </div>
              <div className="mt-2">
                <span className={`block text-xs font-bold ${
                  isCurrent ? 'text-primary-700' : isCompleted ? 'text-slate-800' : 'text-slate-400'
                }`}>
                  {stage.label}
                </span>
                <span className="hidden sm:block text-[10px] text-slate-400 max-w-[100px] leading-tight mt-0.5">
                  {stage.desc}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {isTerminated && (
        <div className="mt-4 p-2.5 rounded-xl bg-slate-100 text-slate-600 text-xs flex items-center justify-center gap-1.5 border border-slate-200">
          <AlertCircle className="w-4 h-4 text-slate-500" />
          <span>This report is currently <strong>{currentStatus}</strong></span>
        </div>
      )}
    </div>
  );
};
