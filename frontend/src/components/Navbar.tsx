"use client";

import React, { useEffect, useState } from "react";
import { Shield, Heart, Activity, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "../lib/api";
import { SystemStatus, UserRole } from "../types";

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
    }, 12000);

    return () => clearInterval(interval);
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="sticky top-0 z-50 h-[76px] px-6 sm:px-12 md:px-16 flex items-center justify-between bg-white/95 backdrop-blur-md border-b border-brandBorder shadow-sm">
      {/* Brand Logo */}
      <div
        onClick={() => scrollToSection("home")}
        className="flex items-center gap-2.5 cursor-pointer text-primary font-extrabold text-2xl tracking-tight"
      >
        <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-accent-light text-secondary">
          <Shield className="w-6 h-6 stroke-[2.2]" />
          <Heart className="w-3 h-3 absolute fill-accent stroke-accent" />
        </div>
        <span>
          Health<span className="text-secondary font-black">Guard</span>
        </span>
      </div>

      {/* Nav Links */}
      <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-textMain">
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
      <div className="flex items-center gap-3.5">
        {/* Status Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700">
          <span
            className={`w-2 h-2 rounded-full ${
              status ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
            }`}
          />
          <span>{status ? "ZKP & Hardhat Ready" : "Local Mode"}</span>
        </div>

        {currentRole ? (
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-bold tracking-wider px-2.5 py-1 rounded-md bg-secondary-light text-secondary">
              {currentRole}
            </span>
            <button
              onClick={onLogout}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
            >
              Exit Portal
            </button>
          </div>
        ) : (
          <button
            onClick={() => scrollToSection("portals")}
            className="px-5 py-2.5 rounded-lg bg-primary hover:bg-secondary text-white text-sm font-bold shadow-sm transition-all duration-200 hover:-translate-y-0.5"
          >
            Get Started
          </button>
        )}
      </div>
    </nav>
  );
};
