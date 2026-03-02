import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppLayout, PublicLayout, ResponderLayout } from '@/components/layout/app-layout';
import { RouteGuard } from '@/components/layout/route-guard';
import { seedIfNeeded } from '@/api/store';
import { lazy, Suspense } from 'react';
import { PageSkeleton } from '@/components/shared/skeleton';

// Initialize seed data
seedIfNeeded();

// Lazy load all pages
const Landing = lazy(() => import('@/pages/public/landing'));
const Pricing = lazy(() => import('@/pages/public/pricing'));
const Security = lazy(() => import('@/pages/public/security'));
const Login = lazy(() => import('@/pages/auth/login'));
const ForgotPassword = lazy(() => import('@/pages/auth/forgot-password'));
const InviteAccept = lazy(() => import('@/pages/auth/invite-accept'));
const NotAuthorized = lazy(() => import('@/pages/auth/not-authorized'));

// Responder
const ResponderEntry = lazy(() => import('@/pages/responder/entry'));
const ResponderAssessment = lazy(() => import('@/pages/responder/assessment'));
const ResponderThankYou = lazy(() => import('@/pages/responder/thank-you'));

// Super Admin
const SADashboard = lazy(() => import('@/pages/superadmin/dashboard'));
const SACompanies = lazy(() => import('@/pages/superadmin/companies'));
const SACompanyDetail = lazy(() => import('@/pages/superadmin/company-detail'));
const SAUsers = lazy(() => import('@/pages/superadmin/users'));
const SAInvites = lazy(() => import('@/pages/superadmin/invites'));
const SAContextMaster = lazy(() => import('@/pages/superadmin/context-master'));
const SAContextValues = lazy(() => import('@/pages/superadmin/context-values'));
const SAModel = lazy(() => import('@/pages/superadmin/model'));
const SAModelRules = lazy(() => import('@/pages/superadmin/model-rules'));
const SAQuestionBank = lazy(() => import('@/pages/superadmin/question-bank'));
const SAQuestionBankRole = lazy(() => import('@/pages/superadmin/question-bank-role'));
const SAPDFTemplates = lazy(() => import('@/pages/superadmin/pdf-templates'));
const SAPDFTemplateEditor = lazy(() => import('@/pages/superadmin/pdf-template-editor'));
const SABypassCodes = lazy(() => import('@/pages/superadmin/bypass-codes'));
const SABypassCodesNew = lazy(() => import('@/pages/superadmin/bypass-codes-new'));
const SAImpersonate = lazy(() => import('@/pages/superadmin/impersonate'));
const SAAudit = lazy(() => import('@/pages/superadmin/audit'));
const SASettings = lazy(() => import('@/pages/superadmin/settings'));
const SASupport = lazy(() => import('@/pages/superadmin/support'));
const SAChangelog = lazy(() => import('@/pages/superadmin/changelog'));

// Consultant
const ConDashboard = lazy(() => import('@/pages/consultant/dashboard'));
const ConCompanies = lazy(() => import('@/pages/consultant/companies'));
const ConCompanyDetail = lazy(() => import('@/pages/consultant/company-detail'));
const ConCAPs = lazy(() => import('@/pages/consultant/caps'));
const ConCAPDetail = lazy(() => import('@/pages/consultant/cap-detail'));
const ConReports = lazy(() => import('@/pages/consultant/reports'));
const ConProfile = lazy(() => import('@/pages/consultant/profile'));
const ConHelp = lazy(() => import('@/pages/consultant/help'));

// App (Sponsor/Member)
const AppDashboard = lazy(() => import('@/pages/app/dashboard'));
const AppCompany = lazy(() => import('@/pages/app/company'));
const AppUsersList = lazy(() => import('@/pages/app/users-list'));
const AppUsersInvite = lazy(() => import('@/pages/app/users-invite'));
const AppCAPsList = lazy(() => import('@/pages/app/caps-list'));
const AppCAPCreate = lazy(() => import('@/pages/app/cap-create'));
const AppCAPContext = lazy(() => import('@/pages/app/cap-context'));
const AppCAPOverview = lazy(() => import('@/pages/app/cap-overview'));
const AppCAPContextView = lazy(() => import('@/pages/app/cap-context-view'));
const AppCAPOutputs = lazy(() => import('@/pages/app/cap-outputs'));
const AppCAPResponders = lazy(() => import('@/pages/app/cap-responders'));
const AppCAPRespondersNew = lazy(() => import('@/pages/app/cap-responders-new'));
const AppCAPSubmissions = lazy(() => import('@/pages/app/cap-submissions'));
const AppCAPSubmissionDetail = lazy(() => import('@/pages/app/cap-submission-detail'));
const AppCAPDashboardBasic = lazy(() => import('@/pages/app/cap-dashboard-basic'));
const AppCAPDashboardAdvanced = lazy(() => import('@/pages/app/cap-dashboard-advanced'));
const AppCAPReport = lazy(() => import('@/pages/app/cap-report'));
const AppCAPReportGenerate = lazy(() => import('@/pages/app/cap-report-generate'));
const AppCAPBilling = lazy(() => import('@/pages/app/cap-billing'));
const AppCAPAudit = lazy(() => import('@/pages/app/cap-audit'));
const AppSettings = lazy(() => import('@/pages/app/settings'));
const AppHelp = lazy(() => import('@/pages/app/help'));
const AppTemplates = lazy(() => import('@/pages/app/templates'));
const AppIntegrations = lazy(() => import('@/pages/app/integrations'));
const AppNotifications = lazy(() => import('@/pages/app/notifications'));
const AppActivity = lazy(() => import('@/pages/app/activity'));
const AppDataExport = lazy(() => import('@/pages/app/data-export'));

function SuspenseWrapper({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-right" richColors closeButton />
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<SuspenseWrapper><Landing /></SuspenseWrapper>} />
          <Route path="/pricing" element={<SuspenseWrapper><Pricing /></SuspenseWrapper>} />
          <Route path="/security" element={<SuspenseWrapper><Security /></SuspenseWrapper>} />
          <Route path="/login" element={<SuspenseWrapper><Login /></SuspenseWrapper>} />
          <Route path="/forgot-password" element={<SuspenseWrapper><ForgotPassword /></SuspenseWrapper>} />
          <Route path="/invite/accept" element={<SuspenseWrapper><InviteAccept /></SuspenseWrapper>} />
          <Route path="/not-authorized" element={<SuspenseWrapper><NotAuthorized /></SuspenseWrapper>} />
        </Route>

        {/* Responder Routes */}
        <Route element={<ResponderLayout />}>
          <Route path="/responder/:token" element={<SuspenseWrapper><ResponderEntry /></SuspenseWrapper>} />
          <Route path="/responder/:token/assessment" element={<SuspenseWrapper><ResponderAssessment /></SuspenseWrapper>} />
          <Route path="/responder/:token/thank-you" element={<SuspenseWrapper><ResponderThankYou /></SuspenseWrapper>} />
        </Route>

        {/* Super Admin Routes */}
        <Route element={<RouteGuard allowedRoles={['SUPER_ADMIN', 'SUB_ADMIN']}><AppLayout /></RouteGuard>}>
          <Route path="/sa" element={<SuspenseWrapper><SADashboard /></SuspenseWrapper>} />
          <Route path="/sa/companies" element={<SuspenseWrapper><SACompanies /></SuspenseWrapper>} />
          <Route path="/sa/companies/:id" element={<SuspenseWrapper><SACompanyDetail /></SuspenseWrapper>} />
          <Route path="/sa/users" element={<SuspenseWrapper><SAUsers /></SuspenseWrapper>} />
          <Route path="/sa/invites" element={<SuspenseWrapper><SAInvites /></SuspenseWrapper>} />
          <Route path="/sa/context-master" element={<SuspenseWrapper><SAContextMaster /></SuspenseWrapper>} />
          <Route path="/sa/context-master/:categoryId" element={<SuspenseWrapper><SAContextValues /></SuspenseWrapper>} />
          <Route path="/sa/model" element={<SuspenseWrapper><SAModel /></SuspenseWrapper>} />
          <Route path="/sa/model/rules" element={<SuspenseWrapper><SAModelRules /></SuspenseWrapper>} />
          <Route path="/sa/question-bank" element={<SuspenseWrapper><SAQuestionBank /></SuspenseWrapper>} />
          <Route path="/sa/question-bank/:role" element={<SuspenseWrapper><SAQuestionBankRole /></SuspenseWrapper>} />
          <Route path="/sa/pdf-templates" element={<SuspenseWrapper><SAPDFTemplates /></SuspenseWrapper>} />
          <Route path="/sa/pdf-templates/:id" element={<SuspenseWrapper><SAPDFTemplateEditor /></SuspenseWrapper>} />
          <Route path="/sa/bypass-codes" element={<SuspenseWrapper><SABypassCodes /></SuspenseWrapper>} />
          <Route path="/sa/bypass-codes/new" element={<SuspenseWrapper><SABypassCodesNew /></SuspenseWrapper>} />
          <Route path="/sa/impersonate" element={<SuspenseWrapper><SAImpersonate /></SuspenseWrapper>} />
          <Route path="/sa/audit" element={<SuspenseWrapper><SAAudit /></SuspenseWrapper>} />
          <Route path="/sa/settings" element={<SuspenseWrapper><SASettings /></SuspenseWrapper>} />
          <Route path="/sa/support" element={<SuspenseWrapper><SASupport /></SuspenseWrapper>} />
          <Route path="/sa/changelog" element={<SuspenseWrapper><SAChangelog /></SuspenseWrapper>} />
        </Route>

        {/* Consultant Routes */}
        <Route element={<RouteGuard allowedRoles={['CONSULTANT']}><AppLayout /></RouteGuard>}>
          <Route path="/consultant" element={<SuspenseWrapper><ConDashboard /></SuspenseWrapper>} />
          <Route path="/consultant/companies" element={<SuspenseWrapper><ConCompanies /></SuspenseWrapper>} />
          <Route path="/consultant/companies/:id" element={<SuspenseWrapper><ConCompanyDetail /></SuspenseWrapper>} />
          <Route path="/consultant/caps" element={<SuspenseWrapper><ConCAPs /></SuspenseWrapper>} />
          <Route path="/consultant/caps/:capId" element={<SuspenseWrapper><ConCAPDetail /></SuspenseWrapper>} />
          <Route path="/consultant/reports" element={<SuspenseWrapper><ConReports /></SuspenseWrapper>} />
          <Route path="/consultant/profile" element={<SuspenseWrapper><ConProfile /></SuspenseWrapper>} />
          <Route path="/consultant/help" element={<SuspenseWrapper><ConHelp /></SuspenseWrapper>} />
        </Route>

        {/* App Routes (Sponsor/Member) */}
        <Route element={<RouteGuard allowedRoles={['SPONSOR', 'MEMBER']}><AppLayout /></RouteGuard>}>
          <Route path="/app" element={<SuspenseWrapper><AppDashboard /></SuspenseWrapper>} />
          <Route path="/app/company" element={<SuspenseWrapper><AppCompany /></SuspenseWrapper>} />
          <Route path="/app/users" element={<SuspenseWrapper><AppUsersList /></SuspenseWrapper>} />
          <Route path="/app/users/invite" element={<SuspenseWrapper><AppUsersInvite /></SuspenseWrapper>} />
          <Route path="/app/caps" element={<SuspenseWrapper><AppCAPsList /></SuspenseWrapper>} />
          <Route path="/app/caps/new" element={<SuspenseWrapper><AppCAPCreate /></SuspenseWrapper>} />
          <Route path="/app/caps/new/context" element={<SuspenseWrapper><AppCAPContext /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId" element={<SuspenseWrapper><AppCAPOverview /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/context" element={<SuspenseWrapper><AppCAPContextView /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/outputs" element={<SuspenseWrapper><AppCAPOutputs /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/responders" element={<SuspenseWrapper><AppCAPResponders /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/responders/new" element={<SuspenseWrapper><AppCAPRespondersNew /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/submissions" element={<SuspenseWrapper><AppCAPSubmissions /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/submissions/:submissionId" element={<SuspenseWrapper><AppCAPSubmissionDetail /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/dashboard/basic" element={<SuspenseWrapper><AppCAPDashboardBasic /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/dashboard/advanced" element={<SuspenseWrapper><AppCAPDashboardAdvanced /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/report" element={<SuspenseWrapper><AppCAPReport /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/report/generate" element={<SuspenseWrapper><AppCAPReportGenerate /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/billing" element={<SuspenseWrapper><AppCAPBilling /></SuspenseWrapper>} />
          <Route path="/app/caps/:capId/audit" element={<SuspenseWrapper><AppCAPAudit /></SuspenseWrapper>} />
          <Route path="/app/settings" element={<SuspenseWrapper><AppSettings /></SuspenseWrapper>} />
          <Route path="/app/help" element={<SuspenseWrapper><AppHelp /></SuspenseWrapper>} />
          <Route path="/app/templates" element={<SuspenseWrapper><AppTemplates /></SuspenseWrapper>} />
          <Route path="/app/integrations" element={<SuspenseWrapper><AppIntegrations /></SuspenseWrapper>} />
          <Route path="/app/notifications" element={<SuspenseWrapper><AppNotifications /></SuspenseWrapper>} />
          <Route path="/app/activity" element={<SuspenseWrapper><AppActivity /></SuspenseWrapper>} />
          <Route path="/app/data-export" element={<SuspenseWrapper><AppDataExport /></SuspenseWrapper>} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
