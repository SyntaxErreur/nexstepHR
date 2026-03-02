import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import type { UserRole } from '@/types';

interface RouteGuardProps {
  allowedRoles: UserRole[];
  children: React.ReactNode;
}

export function RouteGuard({ allowedRoles, children }: RouteGuardProps) {
  const { user, isAuthenticated } = useAuthStore();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
}
