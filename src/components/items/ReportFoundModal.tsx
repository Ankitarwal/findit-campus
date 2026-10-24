import React, { useState } from 'react';
import { 
  X, 
  Sparkles, 
  Upload, 
  Lock, 
  ShieldCheck, 
  FolderOpen,
  Phone,
  AlertTriangle
} from 'lucide-react';
import { CATEGORY_LABELS } from '../../types/database';
import type { ItemCategory } from '../../types/database';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';
import { uploadItemPhoto } from '../../lib/supabase';

interface ReportFoundModalProps {
  onClose: () => void;
  onSuccess: (reportId: string) => void;
  onRequireAuth?: () => void;
}

export const ReportFoundModal: React.FC<ReportFoundModalProps> = ({ onClose, onSuccess, onRequireAuth }) => {
  const { user, login } = useAuth();
  const { createReport } = useData();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ItemCategory>('bags_wallets');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 16));
  const [distinguishingFeatures, setDistinguishingFeatures] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [withholdPublicDetails, setWithholdPublicDetails] = useState(true);
  const [imagePath, setImagePath] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const sampleImages = [
    { label: 'Found Wallet', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80' },
    { label: 'Found Laptop', url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80' },
    { label: 'Found Headphones', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&auto=format&fit=crop&q=80' },
    { label: 'Found ID Card', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80' },
    { label: 'Found Keys', url: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=600&auto=format&fit=crop&q=80' },
    { label: 'Found Backpack', url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80' },
  ];

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg('Image size must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = () => setImagePath(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !location.trim()) {
      setErrorMsg('Please complete all required fields (Title, Description, Location)');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      let finalImagePath = imagePath || undefined;
      if (imageFile) {
        const cloudUrl = await uploadItemPhoto(imageFile);
        if (cloudUrl) {
          finalImagePath = cloudUrl;
        }
      }

      const { report } = await createReport({
        report_type: 'found',
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        occurred_at: occurredAt ? new Date(occurredAt).toISOString() : new Date().toISOString(),
        image_path: finalImagePath,
        distinguishing_features: distinguishingFeatures.trim() || undefined,
        contact_phone: contactPhone.trim() || undefined,
        withhold_public_details: withholdPublicDetails,
      });

      setIsSubmitting(false);
      onSuccess(report.id);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit report');
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-elevated border border-slate-100 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-tealAccent-50 text-tealAccent-700 flex items-center justify-center mx-auto border border-tealAccent-200">
            <FolderOpen className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Sign In Required</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Please sign in with your campus account before reporting a found item. This enables you to review verified claims and coordinate return handover with campus security.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={async () => {
                await login('samantha.chen@campus.edu');
              }}
              className="btn-teal text-xs px-4 py-2.5 w-full sm:w-auto"
            >
              1-Click Student Login
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onRequireAuth) onRequireAuth();
              }}
              className="btn-secondary text-xs px-4 py-2.5 w-full sm:w-auto"
            >
              Sign In with My Email
            </button>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xs px-3 py-2">
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-elevated border border-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-tealAccent-50 text-tealAccent-700 border border-tealAccent-200">
              <FolderOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900">Report a Found Item</h3>
              <p className="text-xs text-slate-500">Safely register an item to help the rightful student recover it</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Privacy Conscious Mode Info Box */}
        <div className="mt-4 p-3.5 rounded-2xl bg-tealAccent-50/70 border border-tealAccent-200/80 text-tealAccent-900 text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-tealAccent-700 shrink-0 mt-0.5" />
          <div>
            <strong>Privacy Safeguard Active:</strong> Keep identifying marks (e.g. name on ID card, specific sticker, exact keychain charms) hidden from public view so only the authentic owner can describe them during claim verification.
          </div>
        </div>

        {errorMsg && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          
          {/* Title & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Item Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Black Leather Wallet Found in Library"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ItemCategory)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              >
                {Object.entries(CATEGORY_LABELS).map(([catKey, label]) => (
                  <option key={catKey} value={catKey}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Public Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe general traits (e.g. black bifold wallet, over-ear black headphones) without revealing private secret identifiers..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* Location & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Found Location <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Engineering Hall B, Desk row 4"
                value={location}
                onChange={e => setLocation(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Found Date & Time <span className="text-rose-500">*</span>
              </label>
              <input
                type="datetime-local"
                required
                value={occurredAt}
                onChange={e => setOccurredAt(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
            </div>
          </div>

          {/* Privacy Toggle & Distinguishing Secret Features */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <label className="flex items-start gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={withholdPublicDetails}
                onChange={e => setWithholdPublicDetails(e.target.checked)}
                className="mt-0.5 rounded text-tealAccent-600 focus:ring-tealAccent-500"
              />
              <div>
                <span className="text-xs font-semibold text-slate-800">
                  Enable Privacy-Conscious Mode (Recommended)
                </span>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Withhold secret traits from public view. Only administrators and claimants with matching answers can access verification details.
                </p>
              </div>
            </label>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Private Verification Key Details (Kept Confidential)
              </label>
              <input
                type="text"
                placeholder="e.g. Student initials A.R. on ID card, specific lock screen photo, serial digits"
                value={distinguishingFeatures}
                onChange={e => setDistinguishingFeatures(e.target.value)}
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white"
              />
            </div>
          </div>

          {/* Contact Phone / WhatsApp */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Finder Contact Phone / WhatsApp (Optional)
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                placeholder="e.g. +1 (555) 019-2834 or WhatsApp number"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-tealAccent-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Allows the owner or campus security to coordinate the return directly once verified.</p>
          </div>

          {/* Photo Upload & Quick Samples */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Item Photo (Optional)
            </label>
            <div className="flex flex-col sm:flex-row gap-3 items-center">
              <label className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-tealAccent-500 hover:bg-tealAccent-50/50 cursor-pointer text-xs font-medium text-slate-600 transition-colors">
                <Upload className="w-4 h-4 text-slate-500" />
                <span>Upload Photo</span>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleImageFileChange}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto py-1">
                <span className="text-[11px] text-slate-400 shrink-0">Demo photo:</span>
                {sampleImages.map(sample => (
                  <button
                    key={sample.label}
                    type="button"
                    onClick={() => setImagePath(sample.url)}
                    className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 font-medium transition-colors shrink-0"
                  >
                    {sample.label}
                  </button>
                ))}
              </div>
            </div>

            {imagePath && (
              <div className="mt-2.5 flex items-center gap-3 p-2 bg-slate-50 rounded-xl border border-slate-200">
                <img src={imagePath} alt="preview" className="w-12 h-12 rounded-lg object-cover" />
                <span className="text-xs text-slate-600 truncate flex-1">Image attached</span>
                <button
                  type="button"
                  onClick={() => setImagePath('')}
                  className="text-xs text-rose-500 hover:underline px-2"
                >
                  Remove
                </button>
              </div>
            )}
          </div>

          {/* Submit Actions */}
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
              className="btn-teal text-xs px-6 py-2.5 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-tealAccent-200" />
                  <span>Scanning Lost Item Database...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 text-tealAccent-200" />
                  <span>Register Found Item</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
