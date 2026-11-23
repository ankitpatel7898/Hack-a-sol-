"use client";

import React from "react";
import { ShieldAlert, Lock, CheckCircle2, FileKey2 } from "lucide-react";

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="px-6 sm:px-12 md:px-16 py-24 bg-white border-b border-brandBorder">
      <div className="max-w-4xl mx-auto text-center">
        <span className="tag-badge mb-4">ABOUT HEALTHGUARD</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-dark tracking-tight mb-6">
          Privacy Should Never Be A <span className="text-secondary">Trade-Off.</span>
        </h2>
        <p className="text-muted text-base sm:text-lg leading-relaxed mb-12 max-w-3xl mx-auto">
          HealthGuard transforms health insurance through mathematical cryptography. By pairing{" "}
          <strong className="text-textMain font-semibold">Circom Groth16 Zero-Knowledge Proofs</strong> with{" "}
          <strong className="text-textMain font-semibold">Solidity Smart Contracts</strong> and{" "}
          <strong className="text-textMain font-semibold">AES-256-GCM encrypted off-chain storage</strong>,
          patients retain absolute sovereignty over their medical history while insurers verify eligibility with mathematical certainty.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="p-6 rounded-2xl bg-slate-50 border border-brandBorder">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-rolePatient flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-dark mb-2">Zero Data Exposure</h4>
            <p className="text-xs text-muted leading-relaxed">
              Diagnosis codes, medication history, and clinical notes are never revealed to insurers or stored on public chains.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-brandBorder">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-roleHospital flex items-center justify-center mb-4">
              <FileKey2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-dark mb-2">Anti-Replay Nullifiers</h4>
            <p className="text-xs text-muted leading-relaxed">
              Cryptographic nullifiers derived from patient salts and claim timestamps permanently prevent duplicate submissions.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-50 border border-brandBorder">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-roleInsurer flex items-center justify-center mb-4">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-dark mb-2">Trustless Settlement</h4>
            <p className="text-xs text-muted leading-relaxed">
              Solidity smart contracts automatically release payouts to authorized hospital wallets the instant a Groth16 proof validates.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};
