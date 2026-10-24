import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Lock, 
  AlertTriangle, 
  FileCheck
} from 'lucide-react';
import type { ItemReport } from '../../types/database';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

interface ClaimModalProps {
  report: ItemReport;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClaimModal: React.FC<ClaimModalProps> = ({ report, onClose, onSuccess }) => {
  const { user, profile } = useAuth();
  const { createClaim } = useData();

  const [privateDetails, setPrivateDetails] = useState('');
  const [verificationAnswer, setVerificationAnswer] = useState('');
  const [contactEmail, setContactEmail] = useState(user?.email || profile?.email || '');
  const [contactPhone, setContactPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setErrorMsg('You must be signed in to submit an ownership claim');
      return;
    }
    if (!privateDetails.trim() || !verificationAnswer.trim() || !contactEmail.trim()) {
      setErrorMsg('Please complete all required verification fields');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      await createClaim({
        report_id: report.id,
        private_claim_details: privateDetails.trim(),
        verification_answer: verificationAnswer.trim(),
        contact_email: contactEmail.trim(),
        contact_phone: contactPhone.trim() || undefined,
      });

      setIsSubmitting(false);
      onSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit claim');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-elevated border border-slate-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Request Ownership Claim</h3>
              <p className="text-xs text-slate-500">Provide secret distinguishing traits to prove ownership</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Item Reference */}
        <div className="mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Listing</span>
            <div className="text-xs font-bold text-slate-800">{report.title}</div>
          </div>
          <span className="text-[11px] font-mono bg-white px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700">
            {report.reference_code}
          </span>
        </div>

        {/* Confidentiality Warning */}
        <div className="mt-3 p-3 rounded-xl bg-blue-50/70 border border-blue-200/80 text-blue-900 text-xs flex items-start gap-2">
          <Lock className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Confidential Submission:</strong> Your verification answers are encrypted and accessible only by the finder and Campus Security Officers during physical handover verification.
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          
          {/* Secret Proof / Distinguishing Details */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Private Distinguishing Characteristics <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe specific traits only the authentic owner knows (e.g. brand embossed on inner pocket, phone lock screen picture, exact scratch or keychain attachments)..."
              value={privateDetails}
              onChange={e => setPrivateDetails(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Verification Answer */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Secret Proof Verification Answer <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Name on cards / ID ending digits / serial suffix"
              value={verificationAnswer}
              onChange={e => setVerificationAnswer(e.target.value)}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                University Email <span className="text-rose-500">*</span>
              </label>
              <input
                type="email"
                required
                value={contactEmail}
                onChange={e => setContactEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contact Phone (Optional)
              </label>
              <input
                type="tel"
                placeholder="+1 (555) 000-0000"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="btn-secondary text-xs px-4 py-2.5"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary text-xs px-5 py-2.5 flex items-center gap-2"
            >
              {isSubmitting ? (
                <span>Submitting Verification...</span>
              ) : (
                <>
                  <FileCheck className="w-4 h-4" />
                  <span>Submit Claim Request</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
