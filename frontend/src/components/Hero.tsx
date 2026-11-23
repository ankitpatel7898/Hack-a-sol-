"use client";

import React from "react";
import { Lock, ArrowRight, ShieldCheck, CheckCircle2 } from "lucide-react";

interface HeroProps {
  onExplore: () => void;
  onLearnMore: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onExplore, onLearnMore }) => {
  return (
    <section
      id="home"
      className="hero-gradient min-h-[640px] px-6 sm:px-12 md:px-16 py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center"
    >
      {/* Left Content Column */}
      <div className="lg:col-span-7 flex flex-col items-start max-w-2xl">
        <span className="tag-badge mb-6">
          <Lock className="w-3.5 h-3.5" />
          Privacy First Healthcare
        </span>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-dark tracking-tight leading-[1.12] mb-6">
          Your Health Records.
          <br />
          <span className="text-secondary font-black">Your Privacy.</span>
          <br />
          Our Priority.
        </h1>

        <p className="text-muted text-base sm:text-lg leading-relaxed mb-8 max-w-xl">
          A secure healthcare insurance platform powered by{" "}
          <strong className="text-textMain font-semibold">Zero-Knowledge Proofs (Groth16)</strong> and{" "}
          <strong className="text-textMain font-semibold">Blockchain Smart Contracts</strong>.
          Verify medical eligibility without revealing private diagnosis, prescriptions, or clinical notes.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-4 mb-12">
          <button
            onClick={onExplore}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-md transition-all duration-200 hover:-translate-y-0.5"
          >
            Explore Platform
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onLearnMore}
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-primary border border-brandBorder font-bold text-sm transition-all duration-200 hover:border-accent"
          >
            Learn More
          </button>
        </div>

        {/* Hero Stats */}
        <div className="flex items-center gap-8 sm:gap-12 pt-6 border-t border-slate-200/80 w-full">
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-primary">100%</h3>
            <p className="text-xs sm:text-sm font-medium text-muted">Privacy Focused</p>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-secondary">ZKP</h3>
            <p className="text-xs sm:text-sm font-medium text-muted">Secure Verification</p>
          </div>
          <div>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-primary">Web3</h3>
            <p className="text-xs sm:text-sm font-medium text-muted">Blockchain Powered</p>
          </div>
        </div>
      </div>

      {/* Right Visual 3D Card */}
      <div className="lg:col-span-5 flex justify-center items-center">
        <div className="card-tilt w-full max-w-[340px] bg-white p-8 rounded-3xl shadow-hero border border-brandBorder text-center">
          <div className="w-20 h-20 rounded-2xl mx-auto mb-6 bg-accent-light text-secondary flex items-center justify-center text-3xl shadow-sm">
            <ShieldCheck className="w-10 h-10" />
          </div>

          <h3 className="text-xl font-bold text-dark mb-2">Secure Verification</h3>
          <p className="text-xs text-muted mb-6">
            Your medical records stay encrypted off-chain. Only cryptographic zero-knowledge proofs touch the blockchain.
          </p>

          <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs mb-6 border border-emerald-100">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Privacy Protected by AES-256-GCM</span>
          </div>

          <div className="flex items-center justify-between text-[11px] text-muted pt-4 border-t border-brandBorder font-semibold">
            <span>Zero-Knowledge Proof (Groth16)</span>
            <Lock className="w-3.5 h-3.5 text-secondary" />
          </div>
        </div>
      </div>
    </section>
  );
};
