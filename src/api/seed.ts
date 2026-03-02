// ============================================================
// Seed Data - Bootstrap the entire mock system
// ============================================================
import { generateId, generateToken, generateBypassCode } from '@/lib/utils';
import type {
  User, Company, ContextCategory, ContextValue, CAP, CAPOutput,
  ResponderInvite, ResponseSubmission, QuestionBank, BypassCode,
  AuditLogEntry, BaseModelWeights, ContextMultiplierRule,
  PlatformSettings, PDFTemplate, Notification, Payment, DimensionScore
} from '@/types';

const now = new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

// ---- Users ----
export const seedUsers: User[] = [
  { id: 'u-sa1', role: 'SUPER_ADMIN', name: 'Priya Sharma', email: 'priya@nexstephr.com', phone: '+91-9876543210', tenantCompanyId: null, status: 'active', createdAt: daysAgo(365), lastLoginAt: daysAgo(0) },
  { id: 'u-con1', role: 'CONSULTANT', name: 'Rahul Verma', email: 'rahul@consultingfirm.com', phone: '+91-9876543211', tenantCompanyId: null, status: 'active', createdAt: daysAgo(180), lastLoginAt: daysAgo(1), assignedCompanyIds: ['c-1', 'c-2'] },
  { id: 'u-sub1', role: 'SUB_ADMIN', name: 'Anita Desai', email: 'anita@nexstephr.com', tenantCompanyId: null, status: 'active', createdAt: daysAgo(120), lastLoginAt: daysAgo(2) },
  { id: 'u-sp1', role: 'SPONSOR', name: 'Vikram Patel', email: 'vikram@acmecorp.com', phone: '+91-9876543212', tenantCompanyId: 'c-1', status: 'active', createdAt: daysAgo(90), lastLoginAt: daysAgo(0) },
  { id: 'u-sp2', role: 'SPONSOR', name: 'Neha Gupta', email: 'neha@techstart.io', phone: '+91-9876543213', tenantCompanyId: 'c-2', status: 'active', createdAt: daysAgo(60), lastLoginAt: daysAgo(1) },
  { id: 'u-m1', role: 'MEMBER', name: 'Arjun Singh', email: 'arjun@acmecorp.com', tenantCompanyId: 'c-1', status: 'active', createdAt: daysAgo(80), lastLoginAt: daysAgo(3) },
  { id: 'u-m2', role: 'MEMBER', name: 'Meera Iyer', email: 'meera@acmecorp.com', tenantCompanyId: 'c-1', status: 'active', createdAt: daysAgo(75), lastLoginAt: daysAgo(5) },
  { id: 'u-m3', role: 'MEMBER', name: 'Deepak Kumar', email: 'deepak@techstart.io', tenantCompanyId: 'c-2', status: 'active', createdAt: daysAgo(50), lastLoginAt: daysAgo(2) },
  { id: 'u-m4', role: 'MEMBER', name: 'Kavita Reddy', email: 'kavita@techstart.io', tenantCompanyId: 'c-2', status: 'invited', createdAt: daysAgo(10), lastLoginAt: null },
];

// ---- Companies ----
export const seedCompanies: Company[] = [
  {
    id: 'c-1', name: 'Acme Corp', countryOfOperations: ['India', 'USA'],
    officialEmailDomain: 'acmecorp.com', supportContact: 'hr@acmecorp.com',
    createdAt: daysAgo(90), ownerUserId: 'u-sp1', consultantOwnerId: 'u-con1',
    settings: { memberCanInvite: true, memberCanEditCapContext: false, allowResubmission: false, requirePerRoleMinimums: false },
  },
  {
    id: 'c-2', name: 'TechStart.io', countryOfOperations: ['India'],
    officialEmailDomain: 'techstart.io', supportContact: 'people@techstart.io',
    howHeardAboutUs: 'LinkedIn', phone: '+91-1234567890',
    createdAt: daysAgo(60), ownerUserId: 'u-sp2', consultantOwnerId: 'u-con1',
    settings: { memberCanInvite: true, memberCanEditCapContext: true, allowResubmission: true, requirePerRoleMinimums: false },
  },
];

// ---- Context Master ----
export const seedCategories: ContextCategory[] = [
  { id: 'cat-1', name: 'Investment Stage', description: 'Current investment/funding stage of the company', isActive: true, sortOrder: 1 },
  { id: 'cat-2', name: 'Industry', description: 'Primary industry or sector', isActive: true, sortOrder: 2 },
  { id: 'cat-3', name: 'Company Size', description: 'Number of employees', isActive: true, sortOrder: 3 },
  { id: 'cat-4', name: 'Growth Ambition', description: 'Planned growth trajectory', isActive: true, sortOrder: 4 },
  { id: 'cat-5', name: 'Talent Scarcity', description: 'Difficulty in hiring key talent', isActive: true, sortOrder: 5 },
  { id: 'cat-6', name: 'Regulatory Load', description: 'Level of regulatory compliance required', isActive: true, sortOrder: 6 },
  { id: 'cat-7', name: 'Geographic Complexity', description: 'Number of operational geographies', isActive: true, sortOrder: 7 },
  { id: 'cat-8', name: 'Org Maturity', description: 'Organizational process maturity level', isActive: true, sortOrder: 8 },
  { id: 'cat-9', name: 'Revenue Model', description: 'Primary revenue model', isActive: true, sortOrder: 9 },
  { id: 'cat-10', name: 'Founder Involvement', description: 'Level of founder involvement in operations', isActive: true, sortOrder: 10 },
];

export const seedValues: ContextValue[] = [
  // Investment Stage
  { id: 'v-1', categoryId: 'cat-1', valueLabel: 'Pre-Seed', isActive: true, sortOrder: 1 },
  { id: 'v-2', categoryId: 'cat-1', valueLabel: 'Seed', isActive: true, sortOrder: 2 },
  { id: 'v-3', categoryId: 'cat-1', valueLabel: 'Series A', isActive: true, sortOrder: 3 },
  { id: 'v-4', categoryId: 'cat-1', valueLabel: 'Series B', isActive: true, sortOrder: 4 },
  { id: 'v-5', categoryId: 'cat-1', valueLabel: 'Series C', isActive: true, sortOrder: 5 },
  { id: 'v-6', categoryId: 'cat-1', valueLabel: 'Series D+', isActive: true, sortOrder: 6 },
  { id: 'v-7', categoryId: 'cat-1', valueLabel: 'Pre-IPO', isActive: true, sortOrder: 7 },
  { id: 'v-8', categoryId: 'cat-1', valueLabel: 'Public', isActive: true, sortOrder: 8 },
  { id: 'v-9', categoryId: 'cat-1', valueLabel: 'Bootstrapped', isActive: true, sortOrder: 9 },
  // Industry
  { id: 'v-10', categoryId: 'cat-2', valueLabel: 'SaaS/Tech', isActive: true, sortOrder: 1 },
  { id: 'v-11', categoryId: 'cat-2', valueLabel: 'Fintech', isActive: true, sortOrder: 2 },
  { id: 'v-12', categoryId: 'cat-2', valueLabel: 'Healthcare', isActive: true, sortOrder: 3 },
  { id: 'v-13', categoryId: 'cat-2', valueLabel: 'E-Commerce', isActive: true, sortOrder: 4 },
  { id: 'v-14', categoryId: 'cat-2', valueLabel: 'EdTech', isActive: true, sortOrder: 5 },
  { id: 'v-15', categoryId: 'cat-2', valueLabel: 'Manufacturing', isActive: true, sortOrder: 6 },
  { id: 'v-16', categoryId: 'cat-2', valueLabel: 'Consulting/Services', isActive: true, sortOrder: 7 },
  { id: 'v-17', categoryId: 'cat-2', valueLabel: 'Media/Entertainment', isActive: true, sortOrder: 8 },
  // Company Size
  { id: 'v-18', categoryId: 'cat-3', valueLabel: '1-10', isActive: true, sortOrder: 1 },
  { id: 'v-19', categoryId: 'cat-3', valueLabel: '11-50', isActive: true, sortOrder: 2 },
  { id: 'v-20', categoryId: 'cat-3', valueLabel: '51-200', isActive: true, sortOrder: 3 },
  { id: 'v-21', categoryId: 'cat-3', valueLabel: '201-500', isActive: true, sortOrder: 4 },
  { id: 'v-22', categoryId: 'cat-3', valueLabel: '500+', isActive: true, sortOrder: 5 },
  // Growth Ambition
  { id: 'v-23', categoryId: 'cat-4', valueLabel: 'Blitzscaling', isActive: true, sortOrder: 1 },
  { id: 'v-24', categoryId: 'cat-4', valueLabel: 'Aggressive', isActive: true, sortOrder: 2 },
  { id: 'v-25', categoryId: 'cat-4', valueLabel: 'Moderate', isActive: true, sortOrder: 3 },
  { id: 'v-26', categoryId: 'cat-4', valueLabel: 'Steady', isActive: true, sortOrder: 4 },
  { id: 'v-27', categoryId: 'cat-4', valueLabel: 'Consolidation', isActive: true, sortOrder: 5 },
  // Talent Scarcity
  { id: 'v-28', categoryId: 'cat-5', valueLabel: 'Very High', isActive: true, sortOrder: 1 },
  { id: 'v-29', categoryId: 'cat-5', valueLabel: 'High', isActive: true, sortOrder: 2 },
  { id: 'v-30', categoryId: 'cat-5', valueLabel: 'Moderate', isActive: true, sortOrder: 3 },
  { id: 'v-31', categoryId: 'cat-5', valueLabel: 'Low', isActive: true, sortOrder: 4 },
  // Regulatory Load
  { id: 'v-32', categoryId: 'cat-6', valueLabel: 'High', isActive: true, sortOrder: 1 },
  { id: 'v-33', categoryId: 'cat-6', valueLabel: 'Medium', isActive: true, sortOrder: 2 },
  { id: 'v-34', categoryId: 'cat-6', valueLabel: 'Low', isActive: true, sortOrder: 3 },
  // Geographic Complexity
  { id: 'v-35', categoryId: 'cat-7', valueLabel: 'Single City', isActive: true, sortOrder: 1 },
  { id: 'v-36', categoryId: 'cat-7', valueLabel: 'Multi-City', isActive: true, sortOrder: 2 },
  { id: 'v-37', categoryId: 'cat-7', valueLabel: 'Multi-State', isActive: true, sortOrder: 3 },
  { id: 'v-38', categoryId: 'cat-7', valueLabel: 'Multi-Country', isActive: true, sortOrder: 4 },
  // Org Maturity
  { id: 'v-39', categoryId: 'cat-8', valueLabel: 'Startup (Ad-hoc)', isActive: true, sortOrder: 1 },
  { id: 'v-40', categoryId: 'cat-8', valueLabel: 'Early Process', isActive: true, sortOrder: 2 },
  { id: 'v-41', categoryId: 'cat-8', valueLabel: 'Defined Processes', isActive: true, sortOrder: 3 },
  { id: 'v-42', categoryId: 'cat-8', valueLabel: 'Managed/Optimized', isActive: true, sortOrder: 4 },
  // Revenue Model
  { id: 'v-43', categoryId: 'cat-9', valueLabel: 'Subscription/SaaS', isActive: true, sortOrder: 1 },
  { id: 'v-44', categoryId: 'cat-9', valueLabel: 'Transactional', isActive: true, sortOrder: 2 },
  { id: 'v-45', categoryId: 'cat-9', valueLabel: 'Marketplace', isActive: true, sortOrder: 3 },
  { id: 'v-46', categoryId: 'cat-9', valueLabel: 'Services/Consulting', isActive: true, sortOrder: 4 },
  { id: 'v-47', categoryId: 'cat-9', valueLabel: 'Pre-Revenue', isActive: true, sortOrder: 5 },
  // Founder Involvement
  { id: 'v-48', categoryId: 'cat-10', valueLabel: 'Fully Hands-on', isActive: true, sortOrder: 1 },
  { id: 'v-49', categoryId: 'cat-10', valueLabel: 'Strategic Only', isActive: true, sortOrder: 2 },
  { id: 'v-50', categoryId: 'cat-10', valueLabel: 'Board Level', isActive: true, sortOrder: 3 },
  { id: 'v-51', categoryId: 'cat-10', valueLabel: 'Exited', isActive: true, sortOrder: 4 },
];

// ---- Base Model ----
export const seedBaseModel: BaseModelWeights = {
  version: 1,
  weights: [
    { key: 'founders_cxos', label: 'Founders/CXOs', baseWeight: 8.40 },
    { key: 'sr_mgmt_bench', label: 'Sr Mgmt/Bench', baseWeight: 21.08 },
    { key: 'org_design', label: 'Org Design', baseWeight: 12.55 },
    { key: 'talent_strategy', label: 'Talent Strategy', baseWeight: 14.48 },
    { key: 'culture', label: 'Culture', baseWeight: 14.01 },
    { key: 'esops', label: 'ESOPs', baseWeight: 9.21 },
    { key: 'hiring_engine', label: 'Hiring Engine', baseWeight: 11.91 },
    { key: 'people_continuity', label: 'People Continuity', baseWeight: 8.37 },
  ],
  updatedAt: daysAgo(30),
  updatedBy: 'u-sa1',
};

// ---- Context Multiplier Rules ----
export const seedMultiplierRules: ContextMultiplierRule[] = [
  // Investment Stage: Pre-Seed -> boost Founders, Hiring; reduce Org Design
  { id: 'r-1', categoryId: 'cat-1', valueId: 'v-1', dimensionKey: 'founders_cxos', multiplier: 1.5 },
  { id: 'r-2', categoryId: 'cat-1', valueId: 'v-1', dimensionKey: 'hiring_engine', multiplier: 1.3 },
  { id: 'r-3', categoryId: 'cat-1', valueId: 'v-1', dimensionKey: 'org_design', multiplier: 0.7 },
  // Seed
  { id: 'r-4', categoryId: 'cat-1', valueId: 'v-2', dimensionKey: 'founders_cxos', multiplier: 1.4 },
  { id: 'r-5', categoryId: 'cat-1', valueId: 'v-2', dimensionKey: 'hiring_engine', multiplier: 1.2 },
  // Series A
  { id: 'r-6', categoryId: 'cat-1', valueId: 'v-3', dimensionKey: 'talent_strategy', multiplier: 1.3 },
  { id: 'r-7', categoryId: 'cat-1', valueId: 'v-3', dimensionKey: 'sr_mgmt_bench', multiplier: 1.2 },
  // Series B
  { id: 'r-8', categoryId: 'cat-1', valueId: 'v-4', dimensionKey: 'org_design', multiplier: 1.3 },
  { id: 'r-9', categoryId: 'cat-1', valueId: 'v-4', dimensionKey: 'people_continuity', multiplier: 1.2 },
  // Series C -> boost Org Design, People Continuity; reduce Founders
  { id: 'r-10', categoryId: 'cat-1', valueId: 'v-5', dimensionKey: 'org_design', multiplier: 1.4 },
  { id: 'r-11', categoryId: 'cat-1', valueId: 'v-5', dimensionKey: 'people_continuity', multiplier: 1.3 },
  { id: 'r-12', categoryId: 'cat-1', valueId: 'v-5', dimensionKey: 'founders_cxos', multiplier: 0.7 },
  // Fintech -> boost compliance/culture, org design
  { id: 'r-13', categoryId: 'cat-2', valueId: 'v-11', dimensionKey: 'culture', multiplier: 1.3 },
  { id: 'r-14', categoryId: 'cat-2', valueId: 'v-11', dimensionKey: 'org_design', multiplier: 1.25 },
  { id: 'r-15', categoryId: 'cat-2', valueId: 'v-11', dimensionKey: 'people_continuity', multiplier: 1.2 },
  // Healthcare
  { id: 'r-16', categoryId: 'cat-2', valueId: 'v-12', dimensionKey: 'culture', multiplier: 1.2 },
  { id: 'r-17', categoryId: 'cat-2', valueId: 'v-12', dimensionKey: 'people_continuity', multiplier: 1.3 },
  // SaaS/Tech
  { id: 'r-18', categoryId: 'cat-2', valueId: 'v-10', dimensionKey: 'hiring_engine', multiplier: 1.2 },
  { id: 'r-19', categoryId: 'cat-2', valueId: 'v-10', dimensionKey: 'esops', multiplier: 1.3 },
  // Growth Ambition: Blitz -> boost Hiring, Talent Strategy; reduce People Continuity
  { id: 'r-20', categoryId: 'cat-4', valueId: 'v-23', dimensionKey: 'hiring_engine', multiplier: 1.4 },
  { id: 'r-21', categoryId: 'cat-4', valueId: 'v-23', dimensionKey: 'talent_strategy', multiplier: 1.3 },
  { id: 'r-22', categoryId: 'cat-4', valueId: 'v-23', dimensionKey: 'people_continuity', multiplier: 0.8 },
  // Aggressive
  { id: 'r-23', categoryId: 'cat-4', valueId: 'v-24', dimensionKey: 'hiring_engine', multiplier: 1.25 },
  { id: 'r-24', categoryId: 'cat-4', valueId: 'v-24', dimensionKey: 'talent_strategy', multiplier: 1.2 },
  // Talent Scarcity: Very High/High -> boost Talent Strategy, Sr Mgmt
  { id: 'r-25', categoryId: 'cat-5', valueId: 'v-28', dimensionKey: 'talent_strategy', multiplier: 1.4 },
  { id: 'r-26', categoryId: 'cat-5', valueId: 'v-28', dimensionKey: 'sr_mgmt_bench', multiplier: 1.3 },
  { id: 'r-27', categoryId: 'cat-5', valueId: 'v-29', dimensionKey: 'talent_strategy', multiplier: 1.25 },
  { id: 'r-28', categoryId: 'cat-5', valueId: 'v-29', dimensionKey: 'sr_mgmt_bench', multiplier: 1.15 },
  // Regulatory Load: High -> boost Org Design, Culture/People Continuity
  { id: 'r-29', categoryId: 'cat-6', valueId: 'v-32', dimensionKey: 'org_design', multiplier: 1.3 },
  { id: 'r-30', categoryId: 'cat-6', valueId: 'v-32', dimensionKey: 'culture', multiplier: 1.2 },
  { id: 'r-31', categoryId: 'cat-6', valueId: 'v-32', dimensionKey: 'people_continuity', multiplier: 1.2 },
  // Geographic: Multi-Country -> boost Org Design, People Continuity
  { id: 'r-32', categoryId: 'cat-7', valueId: 'v-38', dimensionKey: 'org_design', multiplier: 1.35 },
  { id: 'r-33', categoryId: 'cat-7', valueId: 'v-38', dimensionKey: 'people_continuity', multiplier: 1.3 },
  { id: 'r-34', categoryId: 'cat-7', valueId: 'v-37', dimensionKey: 'org_design', multiplier: 1.15 },
  { id: 'r-35', categoryId: 'cat-7', valueId: 'v-37', dimensionKey: 'people_continuity', multiplier: 1.15 },
  // Org Maturity: Startup -> boost Founders, reduce Org Design
  { id: 'r-36', categoryId: 'cat-8', valueId: 'v-39', dimensionKey: 'founders_cxos', multiplier: 1.3 },
  { id: 'r-37', categoryId: 'cat-8', valueId: 'v-39', dimensionKey: 'org_design', multiplier: 0.8 },
  // Founder Involvement: Fully Hands-on -> boost Founders
  { id: 'r-38', categoryId: 'cat-10', valueId: 'v-48', dimensionKey: 'founders_cxos', multiplier: 1.4 },
  { id: 'r-39', categoryId: 'cat-10', valueId: 'v-49', dimensionKey: 'sr_mgmt_bench', multiplier: 1.2 },
];

// ---- Question Bank ----
const dimensions = ['founders_cxos', 'sr_mgmt_bench', 'org_design', 'talent_strategy', 'culture', 'esops', 'hiring_engine', 'people_continuity'];
const roleNames = ['CXO/Founder', 'Senior Manager', 'Mid-Level Manager', 'Individual Contributor', 'HR/People Ops'];

function makeQuestions(role: string): import('@/types').Question[] {
  const qs: import('@/types').Question[] = [];
  const questionTexts: Record<string, string[]> = {
    founders_cxos: [
      'How effectively does the founding team set strategic direction?',
      'Rate the clarity of vision communicated by leadership.',
      'How well do founders delegate as the company scales?',
    ],
    sr_mgmt_bench: [
      'Rate the depth of your senior management bench.',
      'How effectively do senior leaders drive accountability?',
      'Is there adequate succession planning for key leadership roles?',
    ],
    org_design: [
      'How clear are reporting structures and role definitions?',
      'Rate the effectiveness of cross-functional collaboration.',
      'Are decision-making authorities well-defined?',
    ],
    talent_strategy: [
      'How well-defined is the company\'s talent acquisition strategy?',
      'Rate the effectiveness of employee development programs.',
      'How well does the company retain high-performing employees?',
    ],
    culture: [
      'How strong is the alignment between stated and practiced values?',
      'Rate the level of psychological safety in teams.',
      'How effectively does the company maintain culture during growth?',
    ],
    esops: [
      'How well-communicated is the ESOP/equity program?',
      'Rate employee understanding of their equity compensation.',
      'Is the vesting structure competitive for the industry?',
    ],
    hiring_engine: [
      'How efficient is the end-to-end hiring process?',
      'Rate the quality of candidates entering the pipeline.',
      'How well does onboarding prepare new hires for success?',
    ],
    people_continuity: [
      'How effective are knowledge transfer processes?',
      'Rate the robustness of business continuity planning for key roles.',
      'How well does the company manage transitions during departures?',
    ],
  };

  dimensions.forEach(dim => {
    const texts = questionTexts[dim] || [];
    texts.forEach((text, i) => {
      qs.push({
        id: `q-${role.replace(/[^a-zA-Z]/g, '')}-${dim}-${i}`,
        text: `[${role}] ${text}`,
        dimensionKey: dim,
        responseType: i === 2 ? 'likert' : 'likert',
        weight: 1,
        helpText: `Rate on a scale of 1 (Strongly Disagree) to 5 (Strongly Agree)`,
      });
    });
  });
  return qs;
}

export const seedQuestionBank: QuestionBank = {
  roles: roleNames,
  questionsByRole: Object.fromEntries(roleNames.map(r => [r, makeQuestions(r)])),
};

// ---- CAPs (various statuses) ----
const cap1Selections = [
  { categoryId: 'cat-1', categoryNameSnapshot: 'Investment Stage', valueId: 'v-3', valueLabelSnapshot: 'Series A' },
  { categoryId: 'cat-2', categoryNameSnapshot: 'Industry', valueId: 'v-10', valueLabelSnapshot: 'SaaS/Tech' },
  { categoryId: 'cat-3', categoryNameSnapshot: 'Company Size', valueId: 'v-20', valueLabelSnapshot: '51-200' },
  { categoryId: 'cat-4', categoryNameSnapshot: 'Growth Ambition', valueId: 'v-24', valueLabelSnapshot: 'Aggressive' },
  { categoryId: 'cat-5', categoryNameSnapshot: 'Talent Scarcity', valueId: 'v-29', valueLabelSnapshot: 'High' },
  { categoryId: 'cat-6', categoryNameSnapshot: 'Regulatory Load', valueId: 'v-33', valueLabelSnapshot: 'Medium' },
  { categoryId: 'cat-7', categoryNameSnapshot: 'Geographic Complexity', valueId: 'v-36', valueLabelSnapshot: 'Multi-City' },
  { categoryId: 'cat-8', categoryNameSnapshot: 'Org Maturity', valueId: 'v-40', valueLabelSnapshot: 'Early Process' },
];

const cap2Selections = [
  { categoryId: 'cat-1', categoryNameSnapshot: 'Investment Stage', valueId: 'v-1', valueLabelSnapshot: 'Pre-Seed' },
  { categoryId: 'cat-2', categoryNameSnapshot: 'Industry', valueId: 'v-11', valueLabelSnapshot: 'Fintech' },
  { categoryId: 'cat-3', categoryNameSnapshot: 'Company Size', valueId: 'v-18', valueLabelSnapshot: '1-10' },
  { categoryId: 'cat-4', categoryNameSnapshot: 'Growth Ambition', valueId: 'v-23', valueLabelSnapshot: 'Blitzscaling' },
  { categoryId: 'cat-5', categoryNameSnapshot: 'Talent Scarcity', valueId: 'v-28', valueLabelSnapshot: 'Very High' },
  { categoryId: 'cat-6', categoryNameSnapshot: 'Regulatory Load', valueId: 'v-32', valueLabelSnapshot: 'High' },
  { categoryId: 'cat-7', categoryNameSnapshot: 'Geographic Complexity', valueId: 'v-35', valueLabelSnapshot: 'Single City' },
  { categoryId: 'cat-8', categoryNameSnapshot: 'Org Maturity', valueId: 'v-39', valueLabelSnapshot: 'Startup (Ad-hoc)' },
];

export const seedCAPs: CAP[] = [
  {
    id: 'cap-1', companyId: 'c-1', title: 'Q1 2026 People Assessment', description: 'Comprehensive people strategy assessment for Series A scaling phase.',
    status: 'report_generated', createdByUserId: 'u-sp1', createdAt: daysAgo(45), updatedAt: daysAgo(2),
    contextSelections: cap1Selections, outputs: null,
    inviteSettings: { minSubmissionsTotal: 8, allowResubmission: false, inviteExpiryDays: 14 },
    respondersInvitedCount: 12, submissionsCount: 10, paymentStatus: 'paid', bypassCodeId: null,
    report: { id: 'rpt-1', capId: 'cap-1', version: 1, generatedAt: daysAgo(3), accessLevel: 'advanced' },
  },
  {
    id: 'cap-2', companyId: 'c-1', title: 'Culture Deep Dive', description: 'Focused assessment on culture and talent retention.',
    status: 'collecting', createdByUserId: 'u-sp1', createdAt: daysAgo(20), updatedAt: daysAgo(1),
    contextSelections: cap1Selections, outputs: null,
    inviteSettings: { minSubmissionsTotal: 8, allowResubmission: false, inviteExpiryDays: 14 },
    respondersInvitedCount: 10, submissionsCount: 5, paymentStatus: 'unpaid', bypassCodeId: null,
    report: null,
  },
  {
    id: 'cap-3', companyId: 'c-2', title: 'Founding Team Assessment', description: 'Early-stage assessment of founding team and hiring readiness.',
    status: 'ready', createdByUserId: 'u-sp2', createdAt: daysAgo(30), updatedAt: daysAgo(5),
    contextSelections: cap2Selections, outputs: null,
    inviteSettings: { minSubmissionsTotal: 8, allowResubmission: true, inviteExpiryDays: 21 },
    respondersInvitedCount: 15, submissionsCount: 9, paymentStatus: 'unpaid', bypassCodeId: null,
    report: null,
  },
  {
    id: 'cap-4', companyId: 'c-2', title: 'Org Structure Review', description: 'Review of organizational structure before next funding round.',
    status: 'draft', createdByUserId: 'u-sp2', createdAt: daysAgo(3), updatedAt: daysAgo(3),
    contextSelections: [], outputs: null,
    inviteSettings: { minSubmissionsTotal: 8, allowResubmission: false, inviteExpiryDays: 14 },
    respondersInvitedCount: 0, submissionsCount: 0, paymentStatus: 'unpaid', bypassCodeId: null,
    report: null,
  },
];

// ---- Responder Invites & Submissions for cap-1 ----
const tenureBands = ['0-1 years', '1-3 years', '3-5 years', '5-10 years', '10+ years'];
export const seedInvites: ResponderInvite[] = [];
export const seedSubmissions: ResponseSubmission[] = [];

for (let i = 0; i < 12; i++) {
  const token = generateToken();
  const invite: ResponderInvite = {
    id: `inv-1-${i}`, capId: 'cap-1', emailOrPhone: `responder${i + 1}@example.com`, token,
    status: i < 10 ? 'submitted' : i < 11 ? 'opened' : 'sent',
    sentAt: daysAgo(40 - i), expiresAt: daysAgo(26 - i), roleHint: roleNames[i % roleNames.length],
  };
  seedInvites.push(invite);

  if (i < 10) {
    const role = roleNames[i % roleNames.length];
    const questions = seedQuestionBank.questionsByRole[role] || [];
    const answers = questions.map(q => ({
      questionId: q.id,
      value: Math.floor(Math.random() * 3) + 3, // 3-5 for mostly positive
    }));
    const scores: DimensionScore[] = dimensions.map(dim => {
      const dimQs = questions.filter(q => q.dimensionKey === dim);
      const dimAnswers = answers.filter(a => dimQs.some(q => q.id === a.questionId));
      const avg = dimAnswers.length > 0
        ? dimAnswers.reduce((s, a) => s + (a.value as number), 0) / dimAnswers.length
        : 3;
      return { dimensionKey: dim, score: Math.round(avg * 20) }; // Scale to 100
    });
    seedSubmissions.push({
      id: `sub-1-${i}`, capId: 'cap-1', inviteId: invite.id,
      responderMeta: { name: `Responder ${i + 1}`, selectedRole: role, tenureBand: tenureBands[i % tenureBands.length] },
      answers, computedScores: scores, submittedAt: daysAgo(35 - i),
    });
  }
}

// Invites for cap-2 (collecting)
for (let i = 0; i < 10; i++) {
  const token = generateToken();
  seedInvites.push({
    id: `inv-2-${i}`, capId: 'cap-2', emailOrPhone: `cap2resp${i + 1}@example.com`, token,
    status: i < 5 ? 'submitted' : i < 7 ? 'opened' : 'sent',
    sentAt: daysAgo(15 - i), expiresAt: daysAgo(1 - i), roleHint: roleNames[i % roleNames.length],
  });
  if (i < 5) {
    const role = roleNames[i % roleNames.length];
    const questions = seedQuestionBank.questionsByRole[role] || [];
    const answers = questions.map(q => ({ questionId: q.id, value: Math.floor(Math.random() * 4) + 2 }));
    const scores: DimensionScore[] = dimensions.map(dim => {
      const dimQs = questions.filter(q => q.dimensionKey === dim);
      const dimAnswers = answers.filter(a => dimQs.some(q => q.id === a.questionId));
      const avg = dimAnswers.length > 0 ? dimAnswers.reduce((s, a) => s + (a.value as number), 0) / dimAnswers.length : 3;
      return { dimensionKey: dim, score: Math.round(avg * 20) };
    });
    seedSubmissions.push({
      id: `sub-2-${i}`, capId: 'cap-2', inviteId: `inv-2-${i}`,
      responderMeta: { selectedRole: role, tenureBand: tenureBands[(i + 2) % tenureBands.length] },
      answers, computedScores: scores, submittedAt: daysAgo(10 - i),
    });
  }
}

// Invites for cap-3 (ready)
for (let i = 0; i < 15; i++) {
  const token = generateToken();
  seedInvites.push({
    id: `inv-3-${i}`, capId: 'cap-3', emailOrPhone: `cap3resp${i + 1}@techstart.io`, token,
    status: i < 9 ? 'submitted' : i < 12 ? 'opened' : 'sent',
    sentAt: daysAgo(25 - i), expiresAt: daysAgo(4 - i),
  });
  if (i < 9) {
    const role = roleNames[i % roleNames.length];
    const questions = seedQuestionBank.questionsByRole[role] || [];
    const answers = questions.map(q => ({ questionId: q.id, value: Math.floor(Math.random() * 5) + 1 }));
    const scores: DimensionScore[] = dimensions.map(dim => {
      const dimQs = questions.filter(q => q.dimensionKey === dim);
      const dimAnswers = answers.filter(a => dimQs.some(q => q.id === a.questionId));
      const avg = dimAnswers.length > 0 ? dimAnswers.reduce((s, a) => s + (a.value as number), 0) / dimAnswers.length : 3;
      return { dimensionKey: dim, score: Math.round(avg * 20) };
    });
    seedSubmissions.push({
      id: `sub-3-${i}`, capId: 'cap-3', inviteId: `inv-3-${i}`,
      responderMeta: { selectedRole: role, tenureBand: tenureBands[i % tenureBands.length] },
      answers, computedScores: scores, submittedAt: daysAgo(20 - i),
    });
  }
}

// ---- Bypass Codes ----
export const seedBypassCodes: BypassCode[] = [
  { id: 'bc-1', code: 'NSHR-ABCD-1234', createdByUserId: 'u-sa1', createdAt: daysAgo(60) },
  { id: 'bc-2', code: 'NSHR-EFGH-5678', createdByUserId: 'u-sa1', createdAt: daysAgo(30), usedAt: daysAgo(25), usedForCapId: 'cap-1' },
];

// ---- Audit Log ----
export const seedAuditLog: AuditLogEntry[] = [
  { id: 'al-1', timestamp: daysAgo(90), userId: 'u-sa1', userName: 'Priya Sharma', action: 'Company Created', entityType: 'company', entityId: 'c-1', details: 'Created Acme Corp', companyId: 'c-1' },
  { id: 'al-2', timestamp: daysAgo(60), userId: 'u-sa1', userName: 'Priya Sharma', action: 'Company Created', entityType: 'company', entityId: 'c-2', details: 'Created TechStart.io', companyId: 'c-2' },
  { id: 'al-3', timestamp: daysAgo(45), userId: 'u-sp1', userName: 'Vikram Patel', action: 'CAP Created', entityType: 'cap', entityId: 'cap-1', details: 'Q1 2026 People Assessment', companyId: 'c-1' },
  { id: 'al-4', timestamp: daysAgo(44), userId: 'u-sp1', userName: 'Vikram Patel', action: 'Outputs Generated', entityType: 'cap', entityId: 'cap-1', details: 'Generated outputs for cap-1', companyId: 'c-1' },
  { id: 'al-5', timestamp: daysAgo(40), userId: 'u-sp1', userName: 'Vikram Patel', action: 'CAP Launched', entityType: 'cap', entityId: 'cap-1', details: 'Launched with 12 invites', companyId: 'c-1' },
  { id: 'al-6', timestamp: daysAgo(3), userId: 'u-sp1', userName: 'Vikram Patel', action: 'Report Generated', entityType: 'cap', entityId: 'cap-1', details: 'Version 1', companyId: 'c-1' },
  { id: 'al-7', timestamp: daysAgo(2), userId: 'u-sp1', userName: 'Vikram Patel', action: 'Payment Completed', entityType: 'cap', entityId: 'cap-1', details: 'INR 25,000', companyId: 'c-1' },
];

// ---- Notifications ----
export const seedNotifications: Notification[] = [
  { id: 'n-1', userId: 'u-sp1', title: 'Report Ready', message: 'Your Q1 2026 People Assessment report is ready for download.', read: false, createdAt: daysAgo(3), link: '/app/caps/cap-1/report' },
  { id: 'n-2', userId: 'u-sp1', title: 'Submission Received', message: '3 new responses received for Culture Deep Dive.', read: false, createdAt: daysAgo(1), link: '/app/caps/cap-2/submissions' },
  { id: 'n-3', userId: 'u-sp1', title: 'Invite Opened', message: '2 responders opened their assessment links.', read: true, createdAt: daysAgo(5) },
  { id: 'n-4', userId: 'u-sa1', title: 'New Company', message: 'A new company TechStart.io has been onboarded.', read: true, createdAt: daysAgo(60) },
  { id: 'n-5', userId: 'u-sp2', title: 'CAP Ready', message: 'Founding Team Assessment has reached minimum submissions.', read: false, createdAt: daysAgo(5), link: '/app/caps/cap-3' },
];

// ---- Payments ----
export const seedPayments: Payment[] = [
  { id: 'pay-1', capId: 'cap-1', status: 'completed', amount: 25000, currency: 'INR', initiatedAt: daysAgo(3), completedAt: daysAgo(3), providerMockRef: 'MOCK-PAY-001' },
];

// ---- Platform Settings ----
export const seedPlatformSettings: PlatformSettings = {
  materialityThresholds: { high: 14.0, medium: 9.0 },
  defaultInviteExpiryDays: 14,
  defaultMinSubmissions: 8,
  enableRandomFailures: false,
  failureRate: 0.05,
};

// ---- PDF Templates ----
export const seedPDFTemplates: PDFTemplate[] = [
  { id: 'tpl-1', name: 'Standard Report', description: 'Default comprehensive report template', isDefault: true, createdAt: daysAgo(365), updatedAt: daysAgo(30), sections: ['cover', 'executive_summary', 'context', 'materiality', 'charts', 'role_summary', 'recommendations', 'appendix'] },
  { id: 'tpl-2', name: 'Executive Brief', description: 'Concise 2-page executive summary', isDefault: false, createdAt: daysAgo(180), updatedAt: daysAgo(60), sections: ['cover', 'executive_summary', 'materiality', 'recommendations'] },
];
