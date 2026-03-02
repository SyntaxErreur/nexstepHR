// ============================================================
// NexStep HR - Core Type Definitions
// ============================================================

export type UserRole = 'SUPER_ADMIN' | 'CONSULTANT' | 'SUB_ADMIN' | 'SPONSOR' | 'MEMBER' | 'RESPONDER';

export type UserStatus = 'invited' | 'active' | 'suspended';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  phone?: string;
  tenantCompanyId: string | null;
  status: UserStatus;
  createdAt: string;
  lastLoginAt: string | null;
  assignedCompanyIds?: string[]; // For CONSULTANT role
  avatarUrl?: string;
}

export interface Company {
  id: string;
  name: string;
  countryOfOperations: string[];
  officialEmailDomain?: string;
  supportContact?: string;
  howHeardAboutUs?: string;
  phone?: string;
  createdAt: string;
  ownerUserId: string;
  consultantOwnerId?: string;
  settings: CompanySettings;
  logoUrl?: string;
}

export interface CompanySettings {
  memberCanInvite: boolean;
  memberCanEditCapContext: boolean;
  allowResubmission: boolean;
  requirePerRoleMinimums: boolean;
  perRoleMinimums?: Record<string, number>;
}

export interface ContextCategory {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  sortOrder: number;
}

export interface ContextValue {
  id: string;
  categoryId: string;
  valueLabel: string;
  isActive: boolean;
  sortOrder: number;
}

export type CAPStatus = 'draft' | 'active' | 'collecting' | 'ready' | 'report_generated' | 'archived';
export type PaymentStatus = 'unpaid' | 'paid' | 'bypassed';

export interface ContextSelection {
  categoryId: string;
  categoryNameSnapshot: string;
  valueId: string;
  valueLabelSnapshot: string;
}

export interface CAPInviteSettings {
  minSubmissionsTotal: number;
  minSubmissionsByRole?: Record<string, number>;
  allowResubmission: boolean;
  inviteExpiryDays: number;
}

export interface CAP {
  id: string;
  companyId: string;
  title: string;
  description: string;
  status: CAPStatus;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
  contextSelections: ContextSelection[];
  outputs: CAPOutput | null;
  inviteSettings: CAPInviteSettings;
  respondersInvitedCount: number;
  submissionsCount: number;
  paymentStatus: PaymentStatus;
  bypassCodeId: string | null;
  report: ReportMeta | null;
}

export interface CAPParameter {
  key: string;
  label: string;
  weightPct: number;
  materialityLevel: 'High' | 'Medium' | 'Low';
}

export interface CAPOutput {
  id: string;
  capId: string;
  parameters: CAPParameter[];
  materialitySummary: { high: number; medium: number; low: number };
  computedAt: string;
  computedBy: string;
}

export type InviteStatus = 'sent' | 'opened' | 'submitted' | 'expired';

export interface ResponderInvite {
  id: string;
  capId: string;
  emailOrPhone: string;
  token: string;
  status: InviteStatus;
  sentAt: string;
  expiresAt: string;
  roleHint?: string;
}

export interface ResponseAnswer {
  questionId: string;
  value: number | string | boolean;
}

export interface DimensionScore {
  dimensionKey: string;
  score: number;
}

export interface ResponseSubmission {
  id: string;
  capId: string;
  inviteId: string;
  responderMeta: {
    name?: string;
    selectedRole: string;
    tenureBand: string;
  };
  answers: ResponseAnswer[];
  computedScores: DimensionScore[];
  submittedAt: string;
}

export interface Question {
  id: string;
  text: string;
  dimensionKey: string;
  responseType: 'likert' | 'yesno' | 'text';
  weight: number;
  helpText?: string;
}

export interface QuestionBank {
  roles: string[];
  questionsByRole: Record<string, Question[]>;
}

export interface ReportMeta {
  id: string;
  capId: string;
  version: number;
  generatedAt: string;
  accessLevel: 'basic' | 'advanced';
}

export interface ReportSectionData {
  executiveSummary: string;
  contextSelections: ContextSelection[];
  materialityTable: CAPParameter[];
  roleResponseSummary: {
    role: string;
    count: number;
    avgScore: number;
  }[];
  dimensionScores: {
    dimension: string;
    avgScore: number;
    weight: number;
    materiality: string;
  }[];
  recommendations: string[];
  questionList: Question[];
}

export type PaymentTransactionStatus = 'pending' | 'completed' | 'failed';

export interface Payment {
  id: string;
  capId: string;
  status: PaymentTransactionStatus;
  amount: number;
  currency: string;
  initiatedAt: string;
  completedAt?: string;
  providerMockRef: string;
}

export interface BypassCode {
  id: string;
  code: string;
  createdByUserId: string;
  createdAt: string;
  usedAt?: string;
  usedForCapId?: string;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  details: string;
  companyId?: string;
}

export interface ContextChangeRequest {
  id: string;
  capId: string;
  requestedByUserId: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  details: string;
  resolvedByUserId?: string;
  resolvedAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  link?: string;
}

export interface BaseModelWeights {
  version: number;
  weights: { key: string; label: string; baseWeight: number }[];
  updatedAt: string;
  updatedBy: string;
}

export interface ContextMultiplierRule {
  id: string;
  categoryId: string;
  valueId: string;
  dimensionKey: string;
  multiplier: number;
}

export interface PlatformSettings {
  materialityThresholds: {
    high: number;
    medium: number;
  };
  defaultInviteExpiryDays: number;
  defaultMinSubmissions: number;
  enableRandomFailures: boolean;
  failureRate: number;
}

export interface PDFTemplate {
  id: string;
  name: string;
  description: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  sections: string[];
}
