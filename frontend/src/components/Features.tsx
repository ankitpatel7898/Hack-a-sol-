"use client";

import React from "react";
import { ShieldCheck, Fingerprint, Cpu, Zap } from "lucide-react";

export const Features: React.FC = () => {
  const features = [
    {
      icon: ShieldCheck,
      title: "Data Privacy",
      desc: "Protect sensitive medical information through AES-256-GCM encryption with SHA-256 integrity commitments and granular patient access permissions.",
    },
    {
      icon: Fingerprint,
      title: "Zero-Knowledge Proof",
      desc: "Prove policy validity, hospital authorization, and procedure coverage under Groth16 without revealing raw diagnosis or medications.",
    },
    {
      icon: Cpu,
      title: "Blockchain Security",
      desc: "Maintain immutable audit logs, prevent double-claims using cryptographic nullifiers, and execute trustless settlement on Hardhat EVM.",
    },
    {
      icon: Zap,
      title: "Instant Settlement",
      desc: "Streamline insurance verification and claim payouts directly into hospital smart contract wallets with automated execution.",
    },
  ];

  return (
    <section id="features" className="px-6 sm:px-12 md:px-16 py-24 bg-white border-b border-brandBorder">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <span className="tag-badge mb-4">OUR TECHNOLOGY</span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-dark tracking-tight mb-4">
          Healthcare Meets <span className="text-secondary">Web3 & ZKP</span>
        </h2>
        <p className="text-muted text-sm sm:text-base">
          Next-generation privacy-preserving infrastructure for transparent, fraud-proof healthcare claims.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <div
              key={i}
              className="p-8 rounded-2xl bg-white border border-brandBorder hover:border-secondary/40 shadow-sm hover:shadow-card transition-all duration-300 hover:-translate-y-1.5 flex flex-col items-start group"
            >
              <div className="w-14 h-14 rounded-xl bg-secondary-light text-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-dark mb-3">{f.title}</h3>
              <p className="text-xs sm:text-sm text-muted leading-relaxed">{f.desc}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
};
