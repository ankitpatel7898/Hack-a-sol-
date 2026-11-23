"use client";

import React from "react";
import { User, Building2, Shield, ArrowRight } from "lucide-react";
import { UserRole } from "../types";

interface PortalsSectionProps {
  onSelectRole: (role: UserRole) => void;
}

export const PortalsSection: React.FC<PortalsSectionProps> = ({ onSelectRole }) => {
  const portals = [
    {
      role: "patient" as UserRole,
      title: "Patient Portal",
      desc: "Manage encrypted medical records, control hospital data permissions in real time, and track claims on the blockchain.",
      icon: User,
      iconBg: "bg-blue-50 text-rolePatient",
      btnText: "Enter Patient Portal",
      accentBorder: "hover:border-rolePatient/50",
      btnBg: "bg-rolePatient hover:bg-blue-700",
    },
    {
      role: "hospital" as UserRole,
      title: "Hospital Portal",
      desc: "Verify patient authorization, log treatment details, and generate Circom Groth16 zero-knowledge proofs for instant claims.",
      icon: Building2,
      iconBg: "bg-teal-50 text-roleHospital",
      btnText: "Enter Hospital Portal",
      accentBorder: "hover:border-roleHospital/50",
      btnBg: "bg-roleHospital hover:bg-teal-800",
    },
    {
      role: "insurer" as UserRole,
      title: "Insurance Portal",
      desc: "Audit claims with zero exposure to sensitive medical data, verify ZKP on-chain, and execute automated payout settlements.",
      icon: Shield,
      iconBg: "bg-purple-50 text-roleInsurer",
      btnText: "Enter Insurance Portal",
      accentBorder: "hover:border-roleInsurer/50",
      btnBg: "bg-roleInsurer hover:bg-purple-800",
    },
  ];

  return (
    <section id="portals" className="px-6 sm:px-12 md:px-16 py-24 bg-[#eaf2f8] border-b border-brandBorder">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="tag-badge mb-4">GET STARTED</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-dark tracking-tight mb-4">
          Choose Your <span className="text-secondary">Portal</span>
        </h2>
        <p className="text-muted text-sm sm:text-base">
          Select your role to access the privacy-preserving HealthGuard ecosystem.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {portals.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.role}
              className={`bg-white p-8 sm:p-10 rounded-2xl border border-brandBorder shadow-sm hover:shadow-card transition-all duration-300 hover:-translate-y-1.5 flex flex-col justify-between text-center ${p.accentBorder}`}
            >
              <div>
                <div
                  className={`w-18 h-18 w-[72px] h-[72px] rounded-2xl mx-auto mb-6 flex items-center justify-center text-3xl shadow-sm ${p.iconBg}`}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-dark mb-3">{p.title}</h3>
                <p className="text-xs sm:text-sm text-muted leading-relaxed mb-8">{p.desc}</p>
              </div>

              <button
                onClick={() => onSelectRole(p.role)}
                className={`w-full py-3.5 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-all duration-200 hover:-translate-y-0.5 ${p.btnBg}`}
              >
                {p.btnText}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </section>
  );
};
