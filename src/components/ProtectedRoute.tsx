import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  redirectTo
}) => {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0A0D14] text-[#F5F2ED] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin" />
        <p className="text-xs text-slate-400 font-mono tracking-wider uppercase">Verifiserer tilgang...</p>
      </div>
    );
  }

  // If roles specified, enforce RBAC
  if (allowedRoles && allowedRoles.length > 0) {
    // Admin always has access to all portals
    const hasRole = role === 'admin' || (user && allowedRoles.includes(user.role)) || allowedRoles.includes(role);

    if (!hasRole) {
      // Determine default redirect
      let defaultRedirect = '/login';
      if (allowedRoles.includes('admin')) {
        defaultRedirect = '/admin/login';
      } else if (allowedRoles.includes('driver')) {
        defaultRedirect = '/driver/login';
      }

      return <Navigate to={redirectTo || defaultRedirect} state={{ from: location }} replace />;
    }
  }

  // If no user at all and not in a guest session
  if (!user) {
    return <Navigate to={redirectTo || '/login'} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
