import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types';
import {
  LayoutDashboard, Building2, Users, FileText, Settings, Shield, HelpCircle,
  Boxes, Database, BookOpen, CreditCard, Key, Eye, ClipboardList, Activity,
  ChevronDown, BriefcaseBusiness, BarChart3, FileDown, Bell, Layers,
  Target, UserCheck, Zap, History
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  children?: NavItem[];
}

function getNavItems(role: UserRole): NavItem[] {
  switch (role) {
    case 'SUPER_ADMIN':
      return [
        { label: 'Dashboard', href: '/sa', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Companies', href: '/sa/companies', icon: <Building2 className="h-4 w-4" /> },
        { label: 'Users', href: '/sa/users', icon: <Users className="h-4 w-4" /> },
        { label: 'Invites', href: '/sa/invites', icon: <UserCheck className="h-4 w-4" /> },
        { label: 'Context Master', href: '/sa/context-master', icon: <Boxes className="h-4 w-4" /> },
        { label: 'Base Model', href: '/sa/model', icon: <Database className="h-4 w-4" /> },
        { label: 'Question Bank', href: '/sa/question-bank', icon: <BookOpen className="h-4 w-4" /> },
        { label: 'PDF Templates', href: '/sa/pdf-templates', icon: <FileText className="h-4 w-4" /> },
        { label: 'Bypass Codes', href: '/sa/bypass-codes', icon: <Key className="h-4 w-4" /> },
        { label: 'Impersonate', href: '/sa/impersonate', icon: <Eye className="h-4 w-4" /> },
        { label: 'Audit Log', href: '/sa/audit', icon: <ClipboardList className="h-4 w-4" /> },
        { label: 'Settings', href: '/sa/settings', icon: <Settings className="h-4 w-4" /> },
        { label: 'Support Queue', href: '/sa/support', icon: <HelpCircle className="h-4 w-4" /> },
        { label: 'Changelog', href: '/sa/changelog', icon: <History className="h-4 w-4" /> },
      ];
    case 'CONSULTANT':
      return [
        { label: 'Dashboard', href: '/consultant', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Companies', href: '/consultant/companies', icon: <Building2 className="h-4 w-4" /> },
        { label: 'CAPs', href: '/consultant/caps', icon: <Target className="h-4 w-4" /> },
        { label: 'Reports', href: '/consultant/reports', icon: <BarChart3 className="h-4 w-4" /> },
        { label: 'Profile', href: '/consultant/profile', icon: <Users className="h-4 w-4" /> },
        { label: 'Help Center', href: '/consultant/help', icon: <HelpCircle className="h-4 w-4" /> },
      ];
    case 'SUB_ADMIN':
      return [
        { label: 'Dashboard', href: '/sa', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Companies', href: '/sa/companies', icon: <Building2 className="h-4 w-4" /> },
        { label: 'Users', href: '/sa/users', icon: <Users className="h-4 w-4" /> },
        { label: 'Support Queue', href: '/sa/support', icon: <HelpCircle className="h-4 w-4" /> },
      ];
    case 'SPONSOR':
    case 'MEMBER':
      return [
        { label: 'Dashboard', href: '/app', icon: <LayoutDashboard className="h-4 w-4" /> },
        { label: 'Company', href: '/app/company', icon: <Building2 className="h-4 w-4" /> },
        { label: 'Users', href: '/app/users', icon: <Users className="h-4 w-4" /> },
        { label: 'Assessments', href: '/app/caps', icon: <Target className="h-4 w-4" /> },
        { label: 'Settings', href: '/app/settings', icon: <Settings className="h-4 w-4" /> },
        { label: 'Help', href: '/app/help', icon: <HelpCircle className="h-4 w-4" /> },
      ];
    default:
      return [];
  }
}

export function Sidebar() {
  const { user } = useAuthStore();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;
  const navItems = getNavItems(user.role);

  return (
    <aside className={cn(
      'fixed left-0 top-16 bottom-0 z-30 border-r bg-background transition-all duration-200',
      collapsed ? 'w-16' : 'w-60'
    )}>
      <div className="flex flex-col h-full">
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map(item => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/sa' && item.href !== '/app' && item.href !== '/consultant' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                title={collapsed ? item.label : undefined}
              >
                {item.icon}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
        <div className="border-t p-3">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="flex items-center justify-center w-full rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
          >
            <ChevronDown className={cn('h-4 w-4 transition-transform', collapsed ? 'rotate-90' : '-rotate-90')} />
            {!collapsed && <span className="ml-2">Collapse</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
