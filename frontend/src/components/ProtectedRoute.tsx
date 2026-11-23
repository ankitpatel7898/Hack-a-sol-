"use client";

import React, { ReactNode } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import { ShieldAlert, Lock, ArrowRight } from "lucide-react";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  fallback,
}) => {
  const { user, isLoading, openAuthModal } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-brandBorder shadow-sm min-h-[300px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-[#0F5C5C] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Verifying zero-trust credentials...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="p-8 sm:p-12 bg-white rounded-2xl border border-dashed border-teal-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-teal-50 text-[#0F5C5C] flex items-center justify-center mx-auto mb-4">
          <Lock className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-dark mb-1">
          Authentication Required
        </h3>
        <p className="text-xs text-muted max-w-md mx-auto mb-6">
          Access to this healthcare workspace requires verified credentials and an active cryptographic session.
        </p>
        <button
          onClick={() => openAuthModal(allowedRoles[0], "signin")}
          className="px-5 py-2.5 rounded-xl bg-[#0F5C5C] hover:bg-[#136F63] text-white text-xs font-bold inline-flex items-center gap-2 shadow-sm transition-all"
        >
          Sign In to Access Workspace <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 sm:p-12 bg-rose-50/50 rounded-2xl border border-rose-200 text-center shadow-sm">
        <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-rose-900 mb-1">
          Cross-Role Access Prohibited
        </h3>
        <p className="text-xs text-rose-700 max-w-md mx-auto mb-4">
          You are authenticated as <strong className="uppercase">{user.role}</strong>. Your cryptographic keys do not permit access to this workspace ({allowedRoles.map((r) => r.toUpperCase()).join(", ")}).
        </p>
        <p className="text-[11px] text-slate-500 font-mono">
          Zero-Trust Boundary: DEK Envelope Isolation Enforced
        </p>
      </div>
    );
  }

  return <>{children}</>;
};
