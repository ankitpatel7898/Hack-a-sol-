"use client";

import React from "react";
import { useAuth } from "../context/AuthContext";
import { ShieldAlert, LogOut, ArrowRight, X } from "lucide-react";

export const RbacBlockModal: React.FC = () => {
  const { rbacError, clearRbacError, user, openAuthModal, logout } = useAuth();

  if (!rbacError) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-rose-200 w-full max-w-md overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-100 shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <span className="inline-block px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-widest mb-2">
            Zero-Trust Access Control
          </span>

          <h3 className="text-xl font-bold text-dark mb-2">
            Cross-Role Access Prohibited
          </h3>

          <p className="text-xs text-muted mb-6 leading-relaxed">
            {rbacError}
          </p>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-left text-[11px] text-slate-600 space-y-1 mb-6">
            <div className="flex justify-between">
              <span className="text-slate-400">Authenticated Identity:</span>
              <span className="font-semibold">{user?.name || "Anonymous"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Cryptographic Role:</span>
              <span className="font-bold uppercase text-[#0F5C5C]">{user?.role}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Security Clearance:</span>
              <span className="font-mono text-[10px] text-emerald-600 font-bold">DEK-ENVELOPE ISOLATED</span>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                clearRbacError();
                // Scroll to authorized dashboard
                const el = document.getElementById("active-dashboard");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F5C5C] hover:bg-[#136F63] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              Return to My {user?.role.toUpperCase()} Workspace
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => {
                clearRbacError();
                logout();
                openAuthModal(undefined, "signin");
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign Out & Switch Role
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
