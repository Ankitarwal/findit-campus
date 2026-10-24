import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import type { 
  ItemReport, 
  MatchComparison, 
  Claim, 
  Notification, 
  AuditLog, 
  ReportType, 
  ItemCategory, 
  ReportStatus, 
  ClaimStatus 
} from '../types/database';
import { 
  SEED_REPORTS, 
  SEED_MATCHES, 
  SEED_CLAIMS, 
  SEED_NOTIFICATIONS, 
  SEED_AUDIT_LOGS 
} from '../services/seedData';
import { aiService } from '../services/aiService';
import { generateReferenceCode } from '../lib/utils';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CreateReportInput {
  report_type: ReportType;
  title: string;
  description: string;
  category: ItemCategory;
  location: string;
  occurred_at: string;
  image_path?: string;
  distinguishing_features?: string;
  withhold_public_details: boolean;
}

interface CreateClaimInput {
  report_id: string;
  private_claim_details: string;
  verification_answer: string;
  contact_email: string;
  contact_phone?: string;
}

interface DataContextType {
  reports: ItemReport[];
  matches: MatchComparison[];
  claims: Claim[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  isLoading: boolean;
  createReport: (input: CreateReportInput) => Promise<{ report: ItemReport; matches: MatchComparison[] }>;
  createClaim: (input: CreateClaimInput) => Promise<Claim>;
  updateClaimStatus: (claimId: string, status: ClaimStatus, adminNotes?: string) => Promise<void>;
  updateReportStatus: (reportId: string, status: ReportStatus) => Promise<void>;
  triggerAiMatching: (reportId: string) => Promise<MatchComparison[]>;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadNotificationCount: number;
  stats: {
    totalReports: number;
    lostCount: number;
    foundCount: number;
    returnedCount: number;
    activeMatchesCount: number;
    pendingClaimsCount: number;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, profile, isAdmin } = useAuth();
  const [reports, setReports] = useState<ItemReport[]>(SEED_REPORTS);
  const [matches, setMatches] = useState<MatchComparison[]>(SEED_MATCHES);
  const [claims, setClaims] = useState<Claim[]>(SEED_CLAIMS);
  const [notifications, setNotifications] = useState<Notification[]>(SEED_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(SEED_AUDIT_LOGS);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // If Supabase is connected, fetch live data
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const fetchLiveDb = async () => {
      setIsLoading(true);
      try {
        const { data: dbReports } = await supabase.from('item_reports').select('*').order('created_at', { ascending: false });
        if (dbReports && dbReports.length > 0) setReports(dbReports);

        const { data: dbMatches } = await supabase.from('item_matches').select('*');
        if (dbMatches && dbMatches.length > 0) setMatches(dbMatches);

        const { data: dbClaims } = await supabase.from('claims').select('*');
        if (dbClaims && dbClaims.length > 0) setClaims(dbClaims);

        const { data: dbNotifs } = await supabase.from('notifications').select('*').order('created_at', { ascending: false });
        if (dbNotifs && dbNotifs.length > 0) setNotifications(dbNotifs);

        if (isAdmin) {
          const { data: dbLogs } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
          if (dbLogs && dbLogs.length > 0) setAuditLogs(dbLogs);
        }
      } catch (e) {
        console.warn('Supabase DB fetch fallback to local seed data:', e);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveDb();
  }, [isAdmin]);

  // Create a new report with Gemma 4 analysis and automatic matching
  const createReport = async (input: CreateReportInput): Promise<{ report: ItemReport; matches: MatchComparison[] }> => {
    const reporterId = user?.id || 'usr-student-01';
    const referenceCode = generateReferenceCode(input.report_type);

    // Feature A: Gemma 4 analysis
    const { analysis } = await aiService.analyzeReport(
      input.title,
      input.description,
      input.category,
      input.location
    );

    const newReport: ItemReport = {
      id: `rep-${Date.now()}`,
      reference_code: referenceCode,
      reporter_id: reporterId,
      report_type: input.report_type,
      title: input.title,
      description: input.description,
      category: input.category,
      location: input.location,
      occurred_at: input.occurred_at,
      image_path: input.image_path,
      distinguishing_features: input.distinguishing_features,
      withhold_public_details: input.withhold_public_details,
      status: 'reported',
      ai_analysis: analysis,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      reporter: profile || undefined,
    };

    // Feature B: Two-stage AI matching against existing items
    const candidateMatches = await aiService.findMatchesForReport(newReport, reports);

    // If strong match detected, update status
    if (candidateMatches.length > 0 && candidateMatches[0].relevance_score >= 55) {
      newReport.status = 'potential_match';
    }

    // Save report to Supabase if configured
    if (isSupabaseConfigured()) {
      try {
        await supabase.from('item_reports').insert([{
          reference_code: newReport.reference_code,
          reporter_id: newReport.reporter_id,
          report_type: newReport.report_type,
          title: newReport.title,
          description: newReport.description,
          category: newReport.category,
          location: newReport.location,
          occurred_at: newReport.occurred_at,
          image_path: newReport.image_path,
          distinguishing_features: newReport.distinguishing_features,
          withhold_public_details: newReport.withhold_public_details,
          status: newReport.status,
          ai_analysis: newReport.ai_analysis,
        }]);
      } catch (err) {
        console.error('Supabase report insert error:', err);
      }
    }

    // State update
    setReports(prev => [newReport, ...prev]);

    if (candidateMatches.length > 0) {
      setMatches(prev => [...candidateMatches, ...prev]);

      // Create in-app notification for the reporter
      const topMatch = candidateMatches[0];
      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        recipient_id: reporterId,
        type: 'match_found',
        title: `AI Match (${topMatch.relevance_score}%): ${newReport.title}`,
        message: `Google Gemma 4 found a potential match with reasons: ${topMatch.match_reasons.slice(0, 2).join('; ')}`,
        related_report_id: newReport.id,
        created_at: new Date().toISOString(),
      };
      setNotifications(prev => [newNotif, ...prev]);
    }

    // Append audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      actor_id: reporterId,
      actor_name: profile?.display_name || 'Student',
      action: 'REPORT_CREATED',
      entity_type: 'item_report',
      entity_id: newReport.id,
      details: {
        type: newReport.report_type,
        title: newReport.title,
        matches_found: candidateMatches.length,
      },
      created_at: new Date().toISOString(),
    };
    setAuditLogs(prev => [audit, ...prev]);

    return { report: newReport, matches: candidateMatches };
  };

  // Create an ownership claim
  const createClaim = async (input: CreateClaimInput): Promise<Claim> => {
    if (!user) throw new Error('Must be logged in to file a claim');

    const targetReport = reports.find(r => r.id === input.report_id);
    if (!targetReport) throw new Error('Referenced report not found');
    if (targetReport.reporter_id === user.id) {
      throw new Error('You cannot claim an item you reported');
    }

    const newClaim: Claim = {
      id: `claim-${Date.now()}`,
      report_id: input.report_id,
      claimant_id: user.id,
      private_claim_details: input.private_claim_details,
      verification_answer: input.verification_answer,
      contact_email: input.contact_email,
      contact_phone: input.contact_phone,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      report: targetReport,
      claimant: profile || undefined,
    };

    // Update target report status to claim_requested
    setReports(prev => prev.map(r => r.id === input.report_id ? { ...r, status: 'claim_requested' } : r));
    setClaims(prev => [newClaim, ...prev]);

    // Send notification to the finder
    const notifFinder: Notification = {
      id: `notif-${Date.now()}-finder`,
      recipient_id: targetReport.reporter_id,
      type: 'claim_submitted',
      title: 'New Ownership Claim Submitted',
      message: `A student has submitted a verification claim for the item "${targetReport.title}".`,
      related_report_id: targetReport.id,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [notifFinder, ...prev]);

    // Append audit log
    const audit: AuditLog = {
      id: `audit-${Date.now()}`,
      actor_id: user.id,
      actor_name: profile?.display_name || 'Claimant',
      action: 'CLAIM_SUBMITTED',
      entity_type: 'claim',
      entity_id: newClaim.id,
      details: { report_id: input.report_id, title: targetReport.title },
      created_at: new Date().toISOString(),
    };
    setAuditLogs(prev => [audit, ...prev]);

    return newClaim;
  };

  // Update claim status (under review, approved, rejected)
  const updateClaimStatus = async (claimId: string, status: ClaimStatus, adminNotes?: string) => {
    const claim = claims.find(c => c.id === claimId);
    if (!claim) return;

    setClaims(prev => prev.map(c => c.id === claimId ? {
      ...c,
      status,
      admin_notes: adminNotes || c.admin_notes,
      reviewed_by: user?.id,
      updated_at: new Date().toISOString(),
    } : c));

    // Update linked item report status
    let newReportStatus: ReportStatus | null = null;
    if (status === 'under_review') newReportStatus = 'under_review';
    if (status === 'approved') {
      newReportStatus = 'returned';
      // Trigger festive celebration confetti for hackathon wow effect
      try {
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#14b8a6', '#f59e0b', '#10b981'],
        });
      } catch {}
    }
    if (status === 'rejected') newReportStatus = 'reported';

    if (newReportStatus) {
      setReports(prev => prev.map(r => r.id === claim.report_id ? { ...r, status: newReportStatus! } : r));
    }

    // Notify claimant
    const notifClaimant: Notification = {
      id: `notif-${Date.now()}-claimant`,
      recipient_id: claim.claimant_id,
      type: 'claim_status',
      title: `Claim ${status === 'approved' ? 'Approved & Item Ready' : status === 'rejected' ? 'Rejected' : 'Under Review'}`,
      message: `Your claim for item "${claim.report?.title || 'Report'}" is now marked as ${status.replace('_', ' ')}. ${adminNotes ? `Note: ${adminNotes}` : ''}`,
      related_report_id: claim.report_id,
      created_at: new Date().toISOString(),
    };
    setNotifications(prev => [notifClaimant, ...prev]);

    // Append audit log
    setAuditLogs(prev => [{
      id: `audit-${Date.now()}`,
      actor_id: user?.id || 'admin',
      actor_name: profile?.display_name || 'Admin',
      action: 'CLAIM_STATUS_UPDATED',
      entity_type: 'claim',
      entity_id: claimId,
      details: { previous: claim.status, next: status, notes: adminNotes },
      created_at: new Date().toISOString(),
    }, ...prev]);
  };

  // Update report status (admin or reporter)
  const updateReportStatus = async (reportId: string, status: ReportStatus) => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return;

    if (!isAdmin && report.reporter_id !== user?.id) {
      throw new Error('Unauthorized to update this report');
    }

    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status, updated_at: new Date().toISOString() } : r));

    if (status === 'returned') {
      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    // Append audit log
    setAuditLogs(prev => [{
      id: `audit-${Date.now()}`,
      actor_id: user?.id || 'admin',
      actor_name: profile?.display_name || 'User',
      action: 'REPORT_STATUS_UPDATED',
      entity_type: 'item_report',
      entity_id: reportId,
      details: { previous: report.status, next: status },
      created_at: new Date().toISOString(),
    }, ...prev]);
  };

  // Trigger Gemma 4 matching manually for a report
  const triggerAiMatching = async (reportId: string): Promise<MatchComparison[]> => {
    const report = reports.find(r => r.id === reportId);
    if (!report) return [];

    const newMatches = await aiService.findMatchesForReport(report, reports);
    if (newMatches.length > 0) {
      setMatches(prev => {
        // filter out previous matches between same pair
        const otherMatches = prev.filter(m => !(
          (m.lost_report_id === report.id || m.found_report_id === report.id)
        ));
        return [...newMatches, ...otherMatches];
      });

      if (newMatches[0].relevance_score >= 55) {
        updateReportStatus(report.id, 'potential_match');
      }
    }
    return newMatches;
  };

  // Notifications
  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read_at: new Date().toISOString() })));
  };

  const userNotifications = notifications.filter(n => !user || n.recipient_id === user.id);
  const unreadNotificationCount = userNotifications.filter(n => !n.read_at).length;

  // Real statistics derived strictly from actual database/state records
  const stats = {
    totalReports: reports.length,
    lostCount: reports.filter(r => r.report_type === 'lost').length,
    foundCount: reports.filter(r => r.report_type === 'found').length,
    returnedCount: reports.filter(r => r.status === 'returned').length,
    activeMatchesCount: matches.length,
    pendingClaimsCount: claims.filter(c => c.status === 'pending' || c.status === 'under_review').length,
  };

  return (
    <DataContext.Provider
      value={{
        reports,
        matches,
        claims,
        notifications: userNotifications,
        auditLogs,
        isLoading,
        createReport,
        createClaim,
        updateClaimStatus,
        updateReportStatus,
        triggerAiMatching,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        unreadNotificationCount,
        stats,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
