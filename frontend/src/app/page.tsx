"use client";

import React, { useState } from "react";
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
import { LogOut, ArrowLeft } from "lucide-react";

export default function Home() {
  const [currentRole, setCurrentRole] = useState<UserRole | null>(null);

  const handleSelectRole = (role: UserRole) => {
    setCurrentRole(role);
    setTimeout(() => {
      const el = document.getElementById("active-dashboard");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }, 100);
  };

  const handleLogout = () => {
    setCurrentRole(null);
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

        {/* Dynamic Active Role Dashboard */}
        {currentRole && (
          <section
            id="active-dashboard"
            className="px-6 sm:px-12 md:px-16 py-20 bg-brandBg border-b border-brandBorder min-h-[700px]"
          >
            <div className="max-w-6xl mx-auto">
              {/* Dashboard Role Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10 pb-6 border-b border-brandBorder">
                <div>
                  <span className="tag-badge mb-2">HEALTHGUARD PLATFORM</span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-dark tracking-tight capitalize">
                    {currentRole} Dashboard
                  </h2>
                  <p className="text-xs sm:text-sm text-muted mt-1">
                    Welcome to the HealthGuard {currentRole} portal.
                  </p>
                </div>

                <button
                  onClick={handleLogout}
                  className="self-start sm:self-center flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold text-xs transition-colors shadow-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Exit {currentRole.charAt(0).toUpperCase() + currentRole.slice(1)} Portal
                </button>
              </div>

              {/* Render Role-Specific Component */}
              {currentRole === "patient" && <PatientDashboard />}
              {currentRole === "hospital" && <HospitalDashboard />}
              {currentRole === "insurer" && <InsurerDashboard />}
            </div>
          </section>
        )}

        <AboutSection />
      </main>

      <Footer />
    </div>
  );
}
