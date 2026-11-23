"use client";

import React, { useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { Hero } from "../components/Hero";
import { Features } from "../components/Features";
import { PortalsSection } from "../components/PortalsSection";
import { PatientDashboard } from "../components/PatientDashboard";
import { HospitalDashboard } from "../components/HospitalDashboard";
import { InsurerDashboard } from "../components/InsurerDashboard";
import { AboutSection } from "../components/AboutSection";
import { Footer } from "../components/Footer";
import { UserRole } from "../types";
import { LogOut, ShieldAlert, Lock, UserCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { 
    user, 
    currentRole, 
    selectDashboardRole, 
    logout, 
    openAuthModal 
  } = useAuth();

  const handleSelectRole = (role: UserRole) => {
    const success = selectDashboardRole(role);
    if (success) {
      setTimeout(() => {
        const el = document.getElementById("active-dashboard");
        if (el) {
          el.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    }
  };

  const handleLogout = () => {
    logout();
    const el = document.getElementById("portals");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar
        currentRole={currentRole}
        onSelectRole={handleSelectRole}
        onLogout={handleLogout}
      />

      <main className="flex-grow">
        {/* Landing Page Content */}
        <Hero
          onExplore={() => {
            const el = document.getElementById("portals");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
          onLearnMore={() => {
            const el = document.getElementById("about");
            if (el) el.scrollIntoView({ behavior: "smooth" });
          }}
        />

        <Features />

        <PortalsSection onSelectRole={handleSelectRole} />

        {/* Dynamic Active Role Dashboard (Protected by RBAC) */}
        {currentRole && user && user.role === currentRole ? (
          <section
            id="active-dashboard"
            className="px-6 sm:px-12 md:px-16 py-20 bg-brandBg border-b border-brandBorder min-h-[700px]"
          >
            <div className="max-w-6xl mx-auto">
              {/* Authenticated User Banner */}
              <div className="mb-6 p-4 rounded-2xl bg-white border border-teal-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F5C5C] flex items-center justify-center font-bold text-sm">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-dark">{user.name}</span>
                      <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-100 text-[#0F5C5C]">
                        {user.role} workspace
                      </span>
                    </div>
                    <div className="text-xs text-muted font-mono">
                      {user.masked_email} • {user.wallet_address ? `${user.wallet_address.slice(0, 8)}...${user.wallet_address.slice(-6)}` : "Hardware Key Authenticated"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                  </button>
                </div>
              </div>

              {/* Render Role-Specific Component */}
              {currentRole === "patient" && <PatientDashboard />}
              {currentRole === "hospital" && <HospitalDashboard />}
              {currentRole === "insurer" && <InsurerDashboard />}
            </div>
          </section>
        ) : null}

        <AboutSection />
      </main>

      <Footer />
    </div>
  );
}
