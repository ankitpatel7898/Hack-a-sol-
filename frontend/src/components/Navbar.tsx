"use client";

import React, { useEffect, useState } from "react";
import { Shield, Heart, User, LogOut, Key, CheckCircle2, ChevronDown } from "lucide-react";
import { api } from "../lib/api";
import { SystemStatus, UserRole } from "../types";
import { useAuth } from "../context/AuthContext";

interface NavbarProps {
  currentRole: UserRole | null;
  onSelectRole: (role: UserRole) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onSelectRole,
  onLogout,
}) => {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout, openAuthModal } = useAuth();

  useEffect(() => {
    api
      .getSystemStatus()
      .then((data) => setStatus(data))
      .catch(() => setStatus(null));

    const interval = setInterval(() => {
      api
        .getSystemStatus()
        .then((data) => setStatus(data))
        .catch(() => setStatus(null));
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const roleBadgeColors: Record<UserRole, string> = {
    patient: "bg-[#E6F4F1] text-[#0F5C5C] border-[#0F5C5C]/30",
    hospital: "bg-teal-50 text-teal-800 border-teal-300",
    insurer: "bg-purple-50 text-purple-800 border-purple-300",
  };

  return (
    <nav className="sticky top-0 z-50 h-[76px] px-4 sm:px-8 md:px-16 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-brandBorder shadow-sm">
      {/* Brand Logo */}
      <div
        onClick={() => scrollToSection("home")}
        className="flex items-center gap-2.5 cursor-pointer text-[#0F5C5C] font-extrabold text-2xl tracking-tight"
      >
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-[#E6F4F1] text-[#136F63]">
          <Shield className="w-6 h-6 stroke-[2.2]" />
          <Heart className="w-3 h-3 absolute fill-teal-500 stroke-teal-500" />
        </div>
        <span>
          Health<span className="text-[#136F63] font-black">Shield</span>
        </span>
      </div>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-6 lg:gap-8 text-sm font-semibold text-textMain">
        <button
          onClick={() => scrollToSection("home")}
          className="hover:text-secondary transition-colors"
        >
          Home
        </button>
        <button
          onClick={() => scrollToSection("features")}
          className="hover:text-secondary transition-colors"
        >
          Features
        </button>
        <button
          onClick={() => scrollToSection("portals")}
          className="hover:text-secondary transition-colors"
        >
          Portals
        </button>
        <button
          onClick={() => scrollToSection("about")}
          className="hover:text-secondary transition-colors"
        >
          About
        </button>
      </div>

      {/* Right Controls: Blockchain Status & Role / Action */}
      <div className="flex items-center gap-3">
        {/* Status Pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
          <span
            className={`w-2 h-2 rounded-full ${
              status ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span>{status ? "ZKP & Hardhat Ready" : "Local Mode"}</span>
        </div>

        {user ? (
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white shadow-sm transition-all text-left"
            >
              <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F5C5C] flex items-center justify-center font-bold text-xs uppercase">
                {user.name.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-dark truncate max-w-[120px]">
                  {user.name}
                </div>
                <div className="text-[10px] text-muted flex items-center gap-1">
                  <span className={`px-1.5 py-0.2 rounded font-extrabold uppercase border text-[9px] ${roleBadgeColors[user.role]}`}>
                    {user.role}
                  </span>
                  <span>{user.masked_email}</span>
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Profile Dropdown */}
            {dropdownOpen && (
              <div 
                className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-brandBorder shadow-xl p-3 z-50 animate-fadeIn"
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <div className="p-2 border-b border-slate-100 mb-2">
                  <div className="text-xs font-bold text-dark">{user.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono truncate">{user.email}</div>
                  {user.wallet_address && (
                    <div className="text-[10px] font-mono text-teal-700 bg-teal-50/60 p-1.5 rounded-lg mt-1.5 truncate border border-teal-100">
                      Wallet: {user.wallet_address}
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onSelectRole(user.role);
                      const el = document.getElementById("active-dashboard");
                      if (el) el.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-lg flex items-center justify-between"
                  >
                    <span>Open {user.role.toUpperCase()} Workspace</span>
                    <span className="text-[10px] text-teal-600 font-bold">Active</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                      onLogout();
                    }}
                    className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAuthModal(undefined, "signin")}
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-slate-700 hover:text-[#0F5C5C] hover:bg-slate-100 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => openAuthModal(undefined, "register")}
              className="px-4 py-2 rounded-xl bg-[#0F5C5C] hover:bg-[#136F63] text-white text-xs sm:text-sm font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5"
            >
              Create Account
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};
