// ============================================================
// Persistent Store - localStorage backed data layer
// ============================================================
import type {
  User, Company, ContextCategory, ContextValue, CAP, CAPOutput,
  ResponderInvite, ResponseSubmission, QuestionBank, BypassCode,
  AuditLogEntry, BaseModelWeights, ContextMultiplierRule,
  PlatformSettings, PDFTemplate, Notification, Payment, ContextChangeRequest
} from '@/types';
import {
  seedUsers, seedCompanies, seedCategories, seedValues, seedCAPs,
  seedInvites, seedSubmissions, seedQuestionBank, seedBypassCodes,
  seedAuditLog, seedBaseModel, seedMultiplierRules,
  seedPlatformSettings, seedPDFTemplates, seedNotifications, seedPayments
} from './seed';
import { computeOutputs } from './engine';

const STORE_VERSION = 'nexstep_v3';

function getStore<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(`${STORE_VERSION}_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStore<T>(key: string, data: T): void {
  localStorage.setItem(`${STORE_VERSION}_${key}`, JSON.stringify(data));
}

function isSeeded(): boolean {
  return localStorage.getItem(`${STORE_VERSION}_seeded`) === 'true';
}

export function seedIfNeeded(): void {
  if (isSeeded()) return;
  // Store base data first (needed for computeOutputs)
  setStore('baseModel', seedBaseModel);
  setStore('multiplierRules', seedMultiplierRules);
  setStore('platformSettings', seedPlatformSettings);
  setStore('categories', seedCategories);
  setStore('values', seedValues);

  // Compute outputs for CAPs with context selections
  const capsWithOutputs = seedCAPs.map(cap => {
    if (cap.contextSelections.length === 8) {
      const output = computeOutputs(cap.id, cap.contextSelections);
      return { ...cap, outputs: output };
    }
    return cap;
  });

  setStore('users', seedUsers);
  setStore('companies', seedCompanies);
  setStore('caps', capsWithOutputs);
  setStore('invites', seedInvites);
  setStore('submissions', seedSubmissions);
  setStore('questionBank', seedQuestionBank);
  setStore('bypassCodes', seedBypassCodes);
  setStore('auditLog', seedAuditLog);
  setStore('pdfTemplates', seedPDFTemplates);
  setStore('notifications', seedNotifications);
  setStore('payments', seedPayments);
  setStore('contextChangeRequests', []);
  setStore('capOutputs', capsWithOutputs.filter(c => c.outputs).map(c => c.outputs!));
  localStorage.setItem(`${STORE_VERSION}_seeded`, 'true');
}

// ---- Generic CRUD helpers ----
export const db = {
  // Users
  getUsers: (): User[] => getStore('users', seedUsers),
  setUsers: (u: User[]) => setStore('users', u),
  getUserById: (id: string): User | undefined => db.getUsers().find(u => u.id === id),

  // Companies
  getCompanies: (): Company[] => getStore('companies', seedCompanies),
  setCompanies: (c: Company[]) => setStore('companies', c),
  getCompanyById: (id: string): Company | undefined => db.getCompanies().find(c => c.id === id),

  // Context Categories
  getCategories: (): ContextCategory[] => getStore('categories', seedCategories),
  setCategories: (c: ContextCategory[]) => setStore('categories', c),

  // Context Values
  getValues: (): ContextValue[] => getStore('values', seedValues),
  setValues: (v: ContextValue[]) => setStore('values', v),
  getValuesByCategory: (catId: string): ContextValue[] => db.getValues().filter(v => v.categoryId === catId),

  // CAPs
  getCAPs: (): CAP[] => getStore('caps', seedCAPs),
  setCAPs: (c: CAP[]) => setStore('caps', c),
  getCAPById: (id: string): CAP | undefined => db.getCAPs().find(c => c.id === id),

  // Invites
  getInvites: (): ResponderInvite[] => getStore('invites', seedInvites),
  setInvites: (i: ResponderInvite[]) => setStore('invites', i),
  getInvitesByCAP: (capId: string): ResponderInvite[] => db.getInvites().filter(i => i.capId === capId),
  getInviteByToken: (token: string): ResponderInvite | undefined => db.getInvites().find(i => i.token === token),

  // Submissions
  getSubmissions: (): ResponseSubmission[] => getStore('submissions', seedSubmissions),
  setSubmissions: (s: ResponseSubmission[]) => setStore('submissions', s),
  getSubmissionsByCAP: (capId: string): ResponseSubmission[] => db.getSubmissions().filter(s => s.capId === capId),

  // Question Bank
  getQuestionBank: (): QuestionBank => getStore('questionBank', seedQuestionBank),
  setQuestionBank: (qb: QuestionBank) => setStore('questionBank', qb),

  // Bypass Codes
  getBypassCodes: (): BypassCode[] => getStore('bypassCodes', seedBypassCodes),
  setBypassCodes: (b: BypassCode[]) => setStore('bypassCodes', b),

  // Audit Log
  getAuditLog: (): AuditLogEntry[] => getStore('auditLog', seedAuditLog),
  setAuditLog: (a: AuditLogEntry[]) => setStore('auditLog', a),

  // Base Model
  getBaseModel: (): BaseModelWeights => getStore('baseModel', seedBaseModel),
  setBaseModel: (b: BaseModelWeights) => setStore('baseModel', b),

  // Multiplier Rules
  getMultiplierRules: (): ContextMultiplierRule[] => getStore('multiplierRules', seedMultiplierRules),
  setMultiplierRules: (r: ContextMultiplierRule[]) => setStore('multiplierRules', r),

  // Platform Settings
  getPlatformSettings: (): PlatformSettings => getStore('platformSettings', seedPlatformSettings),
  setPlatformSettings: (s: PlatformSettings) => setStore('platformSettings', s),

  // PDF Templates
  getPDFTemplates: (): PDFTemplate[] => getStore('pdfTemplates', seedPDFTemplates),
  setPDFTemplates: (t: PDFTemplate[]) => setStore('pdfTemplates', t),

  // Notifications
  getNotifications: (): Notification[] => getStore('notifications', seedNotifications),
  setNotifications: (n: Notification[]) => setStore('notifications', n),
  getNotificationsForUser: (userId: string): Notification[] => db.getNotifications().filter(n => n.userId === userId),

  // Payments
  getPayments: (): Payment[] => getStore('payments', seedPayments),
  setPayments: (p: Payment[]) => setStore('payments', p),

  // Context Change Requests
  getContextChangeRequests: (): ContextChangeRequest[] => getStore('contextChangeRequests', []),
  setContextChangeRequests: (r: ContextChangeRequest[]) => setStore('contextChangeRequests', r),

  // CAPOutputs stored within CAPs, but also independently
  getCAPOutputs: (): CAPOutput[] => getStore('capOutputs', []),
  setCAPOutputs: (o: CAPOutput[]) => setStore('capOutputs', o),

  // Reset all data
  reset: () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORE_VERSION));
    keys.forEach(k => localStorage.removeItem(k));
    seedIfNeeded();
  }
};
