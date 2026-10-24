export type UserRole = 'student' | 'admin';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  role: UserRole;
  avatar_url?: string;
  created_at: string;
}

export type ItemCategory = 
  | 'id_cards'
  | 'electronics'
  | 'bags_wallets'
  | 'keys'
  | 'books_stationery'
  | 'clothing_accessories'
  | 'other';

export const CATEGORY_LABELS: Record<ItemCategory, string> = {
  id_cards: 'ID Cards & Documents',
  electronics: 'Electronics & Gadgets',
  bags_wallets: 'Bags & Wallets',
  keys: 'Keys & Keychains',
  books_stationery: 'Books & Stationery',
  clothing_accessories: 'Clothing & Accessories',
  other: 'Other Belongings',
};

export type ReportType = 'lost' | 'found';

export type ReportStatus = 
  | 'reported'
  | 'potential_match'
  | 'claim_requested'
  | 'under_review'
  | 'returned'
  | 'rejected'
  | 'cancelled'
  | 'closed';

export const STATUS_LABELS: Record<ReportStatus, { label: string; color: string }> = {
  reported: { label: 'Reported', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  potential_match: { label: 'Potential Match', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  claim_requested: { label: 'Claim Requested', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  under_review: { label: 'Under Review', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  returned: { label: 'Returned', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  rejected: { label: 'Rejected', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  cancelled: { label: 'Cancelled', color: 'bg-slate-100 text-slate-500 border-slate-200' },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-600 border-slate-200' },
};

export interface ExtractedFeatures {
  color?: string;
  brand?: string;
  model?: string;
  physical_traits?: string[];
}

export interface GemmaAnalysisResult {
  normalized_title: string;
  normalized_description: string;
  likely_category: ItemCategory;
  extracted_features: ExtractedFeatures;
  keywords: string[];
  location_references: string[];
  uncertainty_or_missing: string[];
}

export interface ItemReport {
  id: string;
  reference_code: string;
  reporter_id: string;
  report_type: ReportType;
  title: string;
  description: string;
  category: ItemCategory;
  location: string;
  occurred_at: string;
  image_path?: string;
  distinguishing_features?: string;
  withhold_public_details: boolean;
  status: ReportStatus;
  contact_phone?: string;
  ai_analysis?: GemmaAnalysisResult;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
}

export interface MatchComparison {
  id: string;
  lost_report_id: string;
  found_report_id: string;
  relevance_score: number;
  match_reasons: string[];
  conflicts: string[];
  missing_information: string[];
  recommendation: 'request_review' | 'inconclusive' | 'unlikely_match';
  model_name: string;
  review_status: 'pending' | 'verified' | 'dismissed';
  created_at: string;
  lost_report?: ItemReport;
  found_report?: ItemReport;
}

export type ClaimStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'cancelled';

export interface Claim {
  id: string;
  report_id: string;
  claimant_id: string;
  private_claim_details: string;
  verification_answer: string;
  contact_email: string;
  contact_phone?: string;
  status: ClaimStatus;
  reviewed_by?: string;
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  report?: ItemReport;
  claimant?: Profile;
}

export type NotificationType = 
  | 'match_found'
  | 'claim_submitted'
  | 'claim_status'
  | 'report_update'
  | 'system';

export interface Notification {
  id: string;
  recipient_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_report_id?: string;
  read_at?: string;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, any>;
  created_at: string;
}

export type AiStatus = 'connected' | 'unavailable' | 'not_configured';
