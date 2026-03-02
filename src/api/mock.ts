// ============================================================
// Mock API Layer - Simulates real backend with delays & errors
// ============================================================
import type {
  User, Company, ContextCategory, ContextValue, CAP, CAPOutput,
  ResponderInvite, ResponseSubmission, BypassCode, AuditLogEntry,
  BaseModelWeights, ContextMultiplierRule, PlatformSettings, PDFTemplate,
  Notification, Payment, ContextChangeRequest, QuestionBank, UserRole,
  CAPInviteSettings, ContextSelection, Question
} from '@/types';
import { db, seedIfNeeded } from './store';
import { computeOutputs, computeSubmissionScores, generateRecommendations } from './engine';
import { generateId, generateToken, generateBypassCode, randomDelay, longDelay, delay } from '@/lib/utils';

seedIfNeeded();

// Simulated error check
function maybeError(): void {
  const settings = db.getPlatformSettings();
  if (settings.enableRandomFailures && Math.random() < settings.failureRate) {
    throw new Error('Server error: Please try again.');
  }
}

function addAudit(userId: string, userName: string, action: string, entityType: string, entityId: string, details: string, companyId?: string) {
  const log = db.getAuditLog();
  log.unshift({
    id: generateId(),
    timestamp: new Date().toISOString(),
    userId, userName, action, entityType, entityId, details, companyId,
  });
  db.setAuditLog(log);
}

function addNotification(userId: string, title: string, message: string, link?: string) {
  const notifs = db.getNotifications();
  notifs.unshift({
    id: generateId(),
    userId, title, message, read: false,
    createdAt: new Date().toISOString(), link,
  });
  db.setNotifications(notifs);
}

// ============================================================
// AUTH
// ============================================================
export const apiAuth = {
  async login(email: string, _password: string): Promise<User> {
    await randomDelay();
    maybeError();
    const users = db.getUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.status === 'active');
    if (!user) throw new Error('Invalid credentials. Please check your email and password.');
    // Update last login
    const idx = users.findIndex(u => u.id === user.id);
    users[idx] = { ...user, lastLoginAt: new Date().toISOString() };
    db.setUsers(users);
    return users[idx];
  },

  async forgotPassword(email: string): Promise<{ success: boolean }> {
    await randomDelay();
    return { success: true }; // Always succeed in mock
  },

  async acceptInvite(token: string, name: string, password: string): Promise<User> {
    await randomDelay();
    const users = db.getUsers();
    const user = users.find(u => u.status === 'invited' && u.email.includes(token.slice(0, 5)));
    if (!user) throw new Error('Invalid or expired invite token.');
    const idx = users.findIndex(u => u.id === user.id);
    users[idx] = { ...user, name, status: 'active', lastLoginAt: new Date().toISOString() };
    db.setUsers(users);
    return users[idx];
  },
};

// ============================================================
// USERS
// ============================================================
export const apiUsers = {
  async list(filters?: { role?: UserRole; companyId?: string }): Promise<User[]> {
    await randomDelay();
    maybeError();
    let users = db.getUsers();
    if (filters?.role) users = users.filter(u => u.role === filters.role);
    if (filters?.companyId) users = users.filter(u => u.tenantCompanyId === filters.companyId);
    return users;
  },

  async getById(id: string): Promise<User> {
    await randomDelay();
    const user = db.getUserById(id);
    if (!user) throw new Error('User not found');
    return user;
  },

  async create(data: Partial<User> & { email: string; role: UserRole }): Promise<User> {
    await randomDelay();
    maybeError();
    const users = db.getUsers();
    if (users.find(u => u.email === data.email)) throw new Error('Email already exists');
    const newUser: User = {
      id: generateId(),
      role: data.role,
      name: data.name || data.email.split('@')[0],
      email: data.email,
      phone: data.phone,
      tenantCompanyId: data.tenantCompanyId || null,
      status: 'invited',
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
      assignedCompanyIds: data.assignedCompanyIds,
    };
    users.push(newUser);
    db.setUsers(users);
    return newUser;
  },

  async update(id: string, data: Partial<User>): Promise<User> {
    await randomDelay();
    const users = db.getUsers();
    const idx = users.findIndex(u => u.id === id);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...data };
    db.setUsers(users);
    return users[idx];
  },

  async suspend(id: string): Promise<User> {
    return apiUsers.update(id, { status: 'suspended' });
  },

  async activate(id: string): Promise<User> {
    return apiUsers.update(id, { status: 'active' });
  },
};

// ============================================================
// COMPANIES
// ============================================================
export const apiCompanies = {
  async list(): Promise<Company[]> {
    await randomDelay();
    maybeError();
    return db.getCompanies();
  },

  async getById(id: string): Promise<Company> {
    await randomDelay();
    const company = db.getCompanyById(id);
    if (!company) throw new Error('Company not found');
    return company;
  },

  async create(data: Partial<Company> & { name: string; ownerUserId: string }): Promise<Company> {
    await randomDelay();
    maybeError();
    const companies = db.getCompanies();
    const newCompany: Company = {
      id: generateId(),
      name: data.name,
      countryOfOperations: data.countryOfOperations || [],
      officialEmailDomain: data.officialEmailDomain,
      supportContact: data.supportContact,
      howHeardAboutUs: data.howHeardAboutUs,
      phone: data.phone,
      createdAt: new Date().toISOString(),
      ownerUserId: data.ownerUserId,
      consultantOwnerId: data.consultantOwnerId,
      settings: data.settings || { memberCanInvite: true, memberCanEditCapContext: false, allowResubmission: false, requirePerRoleMinimums: false },
    };
    companies.push(newCompany);
    db.setCompanies(companies);
    addAudit(data.ownerUserId, 'System', 'Company Created', 'company', newCompany.id, `Created ${data.name}`);
    return newCompany;
  },

  async update(id: string, data: Partial<Company>): Promise<Company> {
    await randomDelay();
    const companies = db.getCompanies();
    const idx = companies.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Company not found');
    companies[idx] = { ...companies[idx], ...data };
    db.setCompanies(companies);
    return companies[idx];
  },
};

// ============================================================
// CONTEXT MASTER
// ============================================================
export const apiContextMaster = {
  async listCategories(): Promise<ContextCategory[]> {
    await randomDelay();
    return db.getCategories().sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async listValues(categoryId?: string): Promise<ContextValue[]> {
    await randomDelay();
    const vals = db.getValues();
    return categoryId ? vals.filter(v => v.categoryId === categoryId).sort((a, b) => a.sortOrder - b.sortOrder) : vals;
  },

  async createCategory(data: { name: string; description: string }): Promise<ContextCategory> {
    await randomDelay();
    maybeError();
    const cats = db.getCategories();
    const cat: ContextCategory = {
      id: generateId(), name: data.name, description: data.description,
      isActive: true, sortOrder: cats.length + 1,
    };
    cats.push(cat);
    db.setCategories(cats);
    return cat;
  },

  async updateCategory(id: string, data: Partial<ContextCategory>): Promise<ContextCategory> {
    await randomDelay();
    const cats = db.getCategories();
    const idx = cats.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('Category not found');
    cats[idx] = { ...cats[idx], ...data };
    db.setCategories(cats);
    return cats[idx];
  },

  async createValue(data: { categoryId: string; valueLabel: string }): Promise<ContextValue> {
    await randomDelay();
    maybeError();
    const vals = db.getValues();
    const catVals = vals.filter(v => v.categoryId === data.categoryId);
    const val: ContextValue = {
      id: generateId(), categoryId: data.categoryId, valueLabel: data.valueLabel,
      isActive: true, sortOrder: catVals.length + 1,
    };
    vals.push(val);
    db.setValues(vals);
    return val;
  },

  async updateValue(id: string, data: Partial<ContextValue>): Promise<ContextValue> {
    await randomDelay();
    const vals = db.getValues();
    const idx = vals.findIndex(v => v.id === id);
    if (idx === -1) throw new Error('Value not found');
    vals[idx] = { ...vals[idx], ...data };
    db.setValues(vals);
    return vals[idx];
  },
};

// ============================================================
// CAP
// ============================================================
export const apiCAP = {
  async list(companyId?: string): Promise<CAP[]> {
    await randomDelay();
    maybeError();
    let caps = db.getCAPs();
    if (companyId) caps = caps.filter(c => c.companyId === companyId);
    return caps;
  },

  async getById(id: string): Promise<CAP> {
    await randomDelay();
    const cap = db.getCAPById(id);
    if (!cap) throw new Error('CAP not found');
    return cap;
  },

  async create(data: { companyId: string; title: string; description: string; createdByUserId: string; inviteSettings?: Partial<CAPInviteSettings> }): Promise<CAP> {
    await randomDelay();
    maybeError();
    const caps = db.getCAPs();
    const cap: CAP = {
      id: generateId(), companyId: data.companyId, title: data.title, description: data.description,
      status: 'draft', createdByUserId: data.createdByUserId,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
      contextSelections: [], outputs: null,
      inviteSettings: {
        minSubmissionsTotal: data.inviteSettings?.minSubmissionsTotal || 8,
        allowResubmission: data.inviteSettings?.allowResubmission || false,
        inviteExpiryDays: data.inviteSettings?.inviteExpiryDays || 14,
        ...(data.inviteSettings?.minSubmissionsByRole && { minSubmissionsByRole: data.inviteSettings.minSubmissionsByRole }),
      },
      respondersInvitedCount: 0, submissionsCount: 0,
      paymentStatus: 'unpaid', bypassCodeId: null, report: null,
    };
    caps.push(cap);
    db.setCAPs(caps);
    const user = db.getUserById(data.createdByUserId);
    addAudit(data.createdByUserId, user?.name || 'Unknown', 'CAP Created', 'cap', cap.id, data.title, data.companyId);
    return cap;
  },

  async update(id: string, data: Partial<CAP>): Promise<CAP> {
    await randomDelay();
    const caps = db.getCAPs();
    const idx = caps.findIndex(c => c.id === id);
    if (idx === -1) throw new Error('CAP not found');
    caps[idx] = { ...caps[idx], ...data, updatedAt: new Date().toISOString() };
    db.setCAPs(caps);
    return caps[idx];
  },

  async setContextSelections(capId: string, selections: ContextSelection[]): Promise<CAP> {
    await randomDelay();
    if (selections.length !== 8) throw new Error('Exactly 8 context selections are required.');
    const caps = db.getCAPs();
    const idx = caps.findIndex(c => c.id === capId);
    if (idx === -1) throw new Error('CAP not found');
    caps[idx].contextSelections = selections;
    caps[idx].updatedAt = new Date().toISOString();
    db.setCAPs(caps);
    return caps[idx];
  },

  async generateOutputs(capId: string): Promise<CAPOutput> {
    await longDelay();
    maybeError();
    const cap = db.getCAPById(capId);
    if (!cap) throw new Error('CAP not found');
    if (cap.contextSelections.length !== 8) throw new Error('8 context selections required before generating outputs.');
    const output = computeOutputs(capId, cap.contextSelections);
    // Store in cap
    const caps = db.getCAPs();
    const idx = caps.findIndex(c => c.id === capId);
    caps[idx].outputs = output;
    caps[idx].updatedAt = new Date().toISOString();
    db.setCAPs(caps);
    // Also store independently
    const outputs = db.getCAPOutputs();
    outputs.push(output);
    db.setCAPOutputs(outputs);
    const user = db.getUserById(cap.createdByUserId);
    addAudit(cap.createdByUserId, user?.name || 'System', 'Outputs Generated', 'cap', capId, `Generated outputs for ${cap.title}`, cap.companyId);
    return output;
  },

  async launch(capId: string): Promise<CAP> {
    await randomDelay();
    const caps = db.getCAPs();
    const idx = caps.findIndex(c => c.id === capId);
    if (idx === -1) throw new Error('CAP not found');
    if (!caps[idx].outputs) throw new Error('Generate outputs before launching.');
    caps[idx].status = 'active';
    caps[idx].updatedAt = new Date().toISOString();
    db.setCAPs(caps);
    const user = db.getUserById(caps[idx].createdByUserId);
    addAudit(caps[idx].createdByUserId, user?.name || 'System', 'CAP Launched', 'cap', capId, `Launched ${caps[idx].title}`, caps[idx].companyId);
    return caps[idx];
  },
};

// ============================================================
// RESPONDER INVITES
// ============================================================
export const apiInvites = {
  async listByCAP(capId: string): Promise<ResponderInvite[]> {
    await randomDelay();
    return db.getInvitesByCAP(capId);
  },

  async create(data: { capId: string; emails: string[]; roleHint?: string }): Promise<ResponderInvite[]> {
    await randomDelay();
    maybeError();
    const invites = db.getInvites();
    const caps = db.getCAPs();
    const capIdx = caps.findIndex(c => c.id === data.capId);
    if (capIdx === -1) throw new Error('CAP not found');

    const created: ResponderInvite[] = data.emails.map(email => ({
      id: generateId(), capId: data.capId, emailOrPhone: email, token: generateToken(),
      status: 'sent' as const,
      sentAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + caps[capIdx].inviteSettings.inviteExpiryDays * 86400000).toISOString(),
      roleHint: data.roleHint,
    }));

    invites.push(...created);
    db.setInvites(invites);

    // Update CAP counts and status
    caps[capIdx].respondersInvitedCount += created.length;
    if (caps[capIdx].status === 'active') caps[capIdx].status = 'collecting';
    caps[capIdx].updatedAt = new Date().toISOString();
    db.setCAPs(caps);

    return created;
  },

  async resend(inviteId: string): Promise<ResponderInvite> {
    await randomDelay();
    const invites = db.getInvites();
    const idx = invites.findIndex(i => i.id === inviteId);
    if (idx === -1) throw new Error('Invite not found');
    invites[idx].sentAt = new Date().toISOString();
    invites[idx].status = 'sent';
    db.setInvites(invites);
    return invites[idx];
  },

  async revoke(inviteId: string): Promise<void> {
    await randomDelay();
    const invites = db.getInvites();
    const idx = invites.findIndex(i => i.id === inviteId);
    if (idx === -1) throw new Error('Invite not found');
    invites[idx].status = 'expired';
    db.setInvites(invites);
  },

  async getByToken(token: string): Promise<ResponderInvite & { cap: CAP }> {
    await randomDelay();
    const invite = db.getInviteByToken(token);
    if (!invite) throw new Error('Invalid or expired invite link.');
    if (invite.status === 'expired') throw new Error('This invite has expired.');
    const cap = db.getCAPById(invite.capId);
    if (!cap) throw new Error('Assessment not found.');
    // Mark as opened
    if (invite.status === 'sent') {
      const invites = db.getInvites();
      const idx = invites.findIndex(i => i.id === invite.id);
      invites[idx].status = 'opened';
      db.setInvites(invites);
    }
    return { ...invite, cap };
  },
};

// ============================================================
// SUBMISSIONS
// ============================================================
export const apiSubmissions = {
  async listByCAP(capId: string): Promise<ResponseSubmission[]> {
    await randomDelay();
    return db.getSubmissionsByCAP(capId);
  },

  async getById(id: string): Promise<ResponseSubmission> {
    await randomDelay();
    const sub = db.getSubmissions().find(s => s.id === id);
    if (!sub) throw new Error('Submission not found');
    return sub;
  },

  async submit(data: {
    capId: string;
    inviteId: string;
    responderMeta: { name?: string; selectedRole: string; tenureBand: string };
    answers: { questionId: string; value: number | string | boolean }[];
  }): Promise<ResponseSubmission> {
    await longDelay();
    maybeError();
    const qb = db.getQuestionBank();
    const questions = qb.questionsByRole[data.responderMeta.selectedRole] || [];
    const scores = computeSubmissionScores(data.answers, questions);

    const submission: ResponseSubmission = {
      id: generateId(), capId: data.capId, inviteId: data.inviteId,
      responderMeta: data.responderMeta,
      answers: data.answers, computedScores: scores,
      submittedAt: new Date().toISOString(),
    };

    const subs = db.getSubmissions();
    subs.push(submission);
    db.setSubmissions(subs);

    // Update invite status
    const invites = db.getInvites();
    const invIdx = invites.findIndex(i => i.id === data.inviteId);
    if (invIdx !== -1) invites[invIdx].status = 'submitted';
    db.setInvites(invites);

    // Update CAP submission count and check threshold
    const caps = db.getCAPs();
    const capIdx = caps.findIndex(c => c.id === data.capId);
    if (capIdx !== -1) {
      caps[capIdx].submissionsCount += 1;
      if (caps[capIdx].submissionsCount >= caps[capIdx].inviteSettings.minSubmissionsTotal) {
        if (caps[capIdx].status === 'collecting' || caps[capIdx].status === 'active') {
          caps[capIdx].status = 'ready';
        }
      }
      caps[capIdx].updatedAt = new Date().toISOString();
      db.setCAPs(caps);

      // Notify sponsor
      const company = db.getCompanyById(caps[capIdx].companyId);
      if (company) {
        addNotification(company.ownerUserId, 'New Submission',
          `A new response has been submitted for "${caps[capIdx].title}". Total: ${caps[capIdx].submissionsCount}/${caps[capIdx].inviteSettings.minSubmissionsTotal}`,
          `/app/caps/${data.capId}/submissions`);
      }
    }

    return submission;
  },
};

// ============================================================
// REPORTS
// ============================================================
export const apiReports = {
  async generate(capId: string): Promise<CAP> {
    // Multi-step generation with delays
    await delay(800); // Compiling...
    await delay(600); // Scoring...
    await delay(700); // Layout...
    await delay(500); // Finalizing...
    maybeError();

    const caps = db.getCAPs();
    const idx = caps.findIndex(c => c.id === capId);
    if (idx === -1) throw new Error('CAP not found');

    caps[idx].report = {
      id: generateId(), capId, version: (caps[idx].report?.version || 0) + 1,
      generatedAt: new Date().toISOString(), accessLevel: 'basic',
    };
    caps[idx].status = 'report_generated';
    caps[idx].updatedAt = new Date().toISOString();
    db.setCAPs(caps);

    const user = db.getUserById(caps[idx].createdByUserId);
    addAudit(caps[idx].createdByUserId, user?.name || 'System', 'Report Generated', 'cap', capId, `Version ${caps[idx].report!.version}`, caps[idx].companyId);
    addNotification(caps[idx].createdByUserId, 'Report Ready', `Report for "${caps[idx].title}" is ready.`, `/app/caps/${capId}/report`);

    return caps[idx];
  },

  async getReportData(capId: string) {
    await randomDelay();
    const cap = db.getCAPById(capId);
    if (!cap) throw new Error('CAP not found');
    const submissions = db.getSubmissionsByCAP(capId);
    const output = cap.outputs;

    // Compute avg scores per dimension
    const dimScores: Record<string, number[]> = {};
    submissions.forEach(sub => {
      sub.computedScores.forEach(sc => {
        if (!dimScores[sc.dimensionKey]) dimScores[sc.dimensionKey] = [];
        dimScores[sc.dimensionKey].push(sc.score);
      });
    });

    const avgScores: Record<string, number> = {};
    Object.entries(dimScores).forEach(([key, scores]) => {
      avgScores[key] = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
    });

    // Role summary
    const roleCounts: Record<string, { count: number; totalScore: number }> = {};
    submissions.forEach(sub => {
      const r = sub.responderMeta.selectedRole;
      if (!roleCounts[r]) roleCounts[r] = { count: 0, totalScore: 0 };
      roleCounts[r].count += 1;
      const avg = sub.computedScores.reduce((a, b) => a + b.score, 0) / (sub.computedScores.length || 1);
      roleCounts[r].totalScore += avg;
    });

    const roleResponseSummary = Object.entries(roleCounts).map(([role, data]) => ({
      role, count: data.count, avgScore: Math.round(data.totalScore / data.count),
    }));

    const recommendations = output
      ? generateRecommendations(output.parameters, avgScores)
      : ['No outputs available. Please generate outputs first.'];

    return {
      cap,
      executiveSummary: `This assessment evaluated ${submissions.length} responses across ${roleResponseSummary.length} roles for "${cap.title}". The analysis covers ${output?.parameters.length || 8} key dimensions of organizational health and people strategy.`,
      contextSelections: cap.contextSelections,
      materialityTable: output?.parameters || [],
      roleResponseSummary,
      dimensionScores: (output?.parameters || []).map(p => ({
        dimension: p.label,
        avgScore: avgScores[p.key] || 50,
        weight: p.weightPct,
        materiality: p.materialityLevel,
      })),
      recommendations,
      avgScores,
      submissionCount: submissions.length,
    };
  },
};

// ============================================================
// BILLING / PAYMENT
// ============================================================
export const apiBilling = {
  async initiatePayment(capId: string, amount: number, currency: string): Promise<Payment> {
    await randomDelay();
    const payment: Payment = {
      id: generateId(), capId, status: 'pending', amount, currency,
      initiatedAt: new Date().toISOString(), providerMockRef: `MOCK-PAY-${Date.now()}`,
    };
    const payments = db.getPayments();
    payments.push(payment);
    db.setPayments(payments);
    return payment;
  },

  async completePayment(paymentId: string): Promise<Payment> {
    await delay(2500); // Processing time
    maybeError();
    const payments = db.getPayments();
    const idx = payments.findIndex(p => p.id === paymentId);
    if (idx === -1) throw new Error('Payment not found');
    payments[idx].status = 'completed';
    payments[idx].completedAt = new Date().toISOString();
    db.setPayments(payments);

    // Update CAP
    const caps = db.getCAPs();
    const capIdx = caps.findIndex(c => c.id === payments[idx].capId);
    if (capIdx !== -1) {
      caps[capIdx].paymentStatus = 'paid';
      if (caps[capIdx].report) caps[capIdx].report!.accessLevel = 'advanced';
      caps[capIdx].updatedAt = new Date().toISOString();
      db.setCAPs(caps);
      addAudit(caps[capIdx].createdByUserId, 'System', 'Payment Completed', 'cap', caps[capIdx].id,
        `${payments[idx].currency} ${payments[idx].amount.toLocaleString()}`, caps[capIdx].companyId);
    }
    return payments[idx];
  },

  async applyBypassCode(capId: string, code: string): Promise<CAP> {
    await randomDelay();
    const codes = db.getBypassCodes();
    const codeIdx = codes.findIndex(c => c.code === code && !c.usedAt);
    if (codeIdx === -1) throw new Error('Invalid or already used bypass code.');

    codes[codeIdx].usedAt = new Date().toISOString();
    codes[codeIdx].usedForCapId = capId;
    db.setBypassCodes(codes);

    const caps = db.getCAPs();
    const capIdx = caps.findIndex(c => c.id === capId);
    if (capIdx === -1) throw new Error('CAP not found');
    caps[capIdx].paymentStatus = 'bypassed';
    caps[capIdx].bypassCodeId = codes[codeIdx].id;
    if (caps[capIdx].report) caps[capIdx].report!.accessLevel = 'advanced';
    caps[capIdx].updatedAt = new Date().toISOString();
    db.setCAPs(caps);

    addAudit(caps[capIdx].createdByUserId, 'System', 'Bypass Code Applied', 'cap', capId, `Code: ${code}`, caps[capIdx].companyId);
    return caps[capIdx];
  },
};

// ============================================================
// BYPASS CODES (Super Admin)
// ============================================================
export const apiBypassCodes = {
  async list(): Promise<BypassCode[]> {
    await randomDelay();
    return db.getBypassCodes();
  },

  async create(userId: string): Promise<BypassCode> {
    await randomDelay();
    const codes = db.getBypassCodes();
    const code: BypassCode = {
      id: generateId(), code: generateBypassCode(),
      createdByUserId: userId, createdAt: new Date().toISOString(),
    };
    codes.push(code);
    db.setBypassCodes(codes);
    return code;
  },
};

// ============================================================
// BASE MODEL & RULES (Super Admin)
// ============================================================
export const apiModel = {
  async getBaseModel(): Promise<BaseModelWeights> {
    await randomDelay();
    return db.getBaseModel();
  },

  async updateBaseModel(weights: BaseModelWeights['weights'], userId: string): Promise<BaseModelWeights> {
    await randomDelay();
    const model = db.getBaseModel();
    const updated: BaseModelWeights = {
      version: model.version + 1, weights,
      updatedAt: new Date().toISOString(), updatedBy: userId,
    };
    db.setBaseModel(updated);
    return updated;
  },

  async getRules(): Promise<ContextMultiplierRule[]> {
    await randomDelay();
    return db.getMultiplierRules();
  },

  async updateRules(rules: ContextMultiplierRule[]): Promise<ContextMultiplierRule[]> {
    await randomDelay();
    db.setMultiplierRules(rules);
    return rules;
  },

  async addRule(rule: Omit<ContextMultiplierRule, 'id'>): Promise<ContextMultiplierRule> {
    await randomDelay();
    const rules = db.getMultiplierRules();
    const newRule = { ...rule, id: generateId() };
    rules.push(newRule);
    db.setMultiplierRules(rules);
    return newRule;
  },

  async deleteRule(id: string): Promise<void> {
    await randomDelay();
    const rules = db.getMultiplierRules().filter(r => r.id !== id);
    db.setMultiplierRules(rules);
  },
};

// ============================================================
// QUESTION BANK
// ============================================================
export const apiQuestionBank = {
  async get(): Promise<QuestionBank> {
    await randomDelay();
    return db.getQuestionBank();
  },

  async updateRole(role: string, questions: Question[]): Promise<void> {
    await randomDelay();
    const qb = db.getQuestionBank();
    qb.questionsByRole[role] = questions;
    if (!qb.roles.includes(role)) qb.roles.push(role);
    db.setQuestionBank(qb);
  },

  async addQuestion(role: string, question: Omit<Question, 'id'>): Promise<Question> {
    await randomDelay();
    const qb = db.getQuestionBank();
    const q = { ...question, id: generateId() };
    if (!qb.questionsByRole[role]) qb.questionsByRole[role] = [];
    qb.questionsByRole[role].push(q);
    if (!qb.roles.includes(role)) qb.roles.push(role);
    db.setQuestionBank(qb);
    return q;
  },
};

// ============================================================
// NOTIFICATIONS
// ============================================================
export const apiNotifications = {
  async list(userId: string): Promise<Notification[]> {
    await randomDelay(200, 500);
    return db.getNotificationsForUser(userId);
  },

  async markRead(id: string): Promise<void> {
    const notifs = db.getNotifications();
    const idx = notifs.findIndex(n => n.id === id);
    if (idx !== -1) { notifs[idx].read = true; db.setNotifications(notifs); }
  },

  async markAllRead(userId: string): Promise<void> {
    const notifs = db.getNotifications();
    notifs.forEach(n => { if (n.userId === userId) n.read = true; });
    db.setNotifications(notifs);
  },
};

// ============================================================
// AUDIT LOG
// ============================================================
export const apiAudit = {
  async list(companyId?: string): Promise<AuditLogEntry[]> {
    await randomDelay();
    const log = db.getAuditLog();
    return companyId ? log.filter(a => a.companyId === companyId) : log;
  },
};

// ============================================================
// PLATFORM SETTINGS
// ============================================================
export const apiSettings = {
  async get(): Promise<PlatformSettings> {
    await randomDelay();
    return db.getPlatformSettings();
  },

  async update(data: Partial<PlatformSettings>): Promise<PlatformSettings> {
    await randomDelay();
    const current = db.getPlatformSettings();
    const updated = { ...current, ...data };
    db.setPlatformSettings(updated);
    return updated;
  },
};

// ============================================================
// PDF TEMPLATES
// ============================================================
export const apiPDFTemplates = {
  async list(): Promise<PDFTemplate[]> {
    await randomDelay();
    return db.getPDFTemplates();
  },

  async getById(id: string): Promise<PDFTemplate> {
    await randomDelay();
    const tpl = db.getPDFTemplates().find(t => t.id === id);
    if (!tpl) throw new Error('Template not found');
    return tpl;
  },

  async update(id: string, data: Partial<PDFTemplate>): Promise<PDFTemplate> {
    await randomDelay();
    const templates = db.getPDFTemplates();
    const idx = templates.findIndex(t => t.id === id);
    if (idx === -1) throw new Error('Template not found');
    templates[idx] = { ...templates[idx], ...data, updatedAt: new Date().toISOString() };
    db.setPDFTemplates(templates);
    return templates[idx];
  },
};

// ============================================================
// CONTEXT CHANGE REQUESTS
// ============================================================
export const apiContextRequests = {
  async list(capId?: string): Promise<ContextChangeRequest[]> {
    await randomDelay();
    const reqs = db.getContextChangeRequests();
    return capId ? reqs.filter(r => r.capId === capId) : reqs;
  },

  async create(data: { capId: string; requestedByUserId: string; details: string }): Promise<ContextChangeRequest> {
    await randomDelay();
    const reqs = db.getContextChangeRequests();
    const req: ContextChangeRequest = {
      id: generateId(), capId: data.capId, requestedByUserId: data.requestedByUserId,
      requestedAt: new Date().toISOString(), status: 'pending', details: data.details,
    };
    reqs.push(req);
    db.setContextChangeRequests(reqs);
    return req;
  },

  async resolve(id: string, status: 'approved' | 'rejected', resolvedByUserId: string): Promise<ContextChangeRequest> {
    await randomDelay();
    const reqs = db.getContextChangeRequests();
    const idx = reqs.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Request not found');
    reqs[idx] = { ...reqs[idx], status, resolvedByUserId, resolvedAt: new Date().toISOString() };
    db.setContextChangeRequests(reqs);
    return reqs[idx];
  },
};

// Aggregate export
export const api = {
  auth: apiAuth,
  users: apiUsers,
  companies: apiCompanies,
  contextMaster: apiContextMaster,
  cap: apiCAP,
  invites: apiInvites,
  submissions: apiSubmissions,
  reports: apiReports,
  billing: apiBilling,
  bypassCodes: apiBypassCodes,
  model: apiModel,
  questionBank: apiQuestionBank,
  notifications: apiNotifications,
  audit: apiAudit,
  settings: apiSettings,
  pdfTemplates: apiPDFTemplates,
  contextRequests: apiContextRequests,
};
