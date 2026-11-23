"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  Shield, 
  Heart, 
  User, 
  Building2, 
  ShieldCheck, 
  ArrowRight, 
  Lock, 
  Cpu, 
  FileCheck2, 
  Coins, 
  CheckCircle2, 
  LogIn, 
  UserPlus, 
  Network
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function PublicHomePage() {
  const router = useRouter();
  const { user } = useAuth();

  // Redirect authenticated users immediately to their isolated role dashboard
  useEffect(() => {
    if (user) {
      if (user.role === "patient") router.replace("/patient/dashboard");
      else if (user.role === "hospital") router.replace("/hospital/dashboard");
      else if (user.role === "insurer") router.replace("/insurer/dashboard");
    }
  }, [user, router]);

  if (user) return null; // Prevent UI flash while redirecting

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-sans">
      {/* Clean Public Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 sm:px-12 md:px-16 h-18 flex items-center justify-between shadow-xs">
        {/* Brand Logo */}
        <Link href="/home" className="flex items-center gap-2.5 text-[#0F5C5C] font-extrabold text-2xl tracking-tight">
          <div className="w-10 h-10 rounded-xl bg-[#E6F4F1] text-[#0F5C5C] flex items-center justify-center">
            <Shield className="w-6 h-6 stroke-[2.2]" />
            <Heart className="w-3 h-3 absolute fill-[#0F5C5C] stroke-white stroke-[1.5]" />
          </div>
          <span>Health<span className="text-[#136F63]">Shield</span></span>
        </Link>

        {/* 3 Distinct Role Entry Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/auth/patient/login"
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-[#0F5C5C] bg-[#E6F4F1] hover:bg-[#d5eee8] transition-all flex items-center gap-1.5"
          >
            <User className="w-3.5 h-3.5" />
            <span>Patient Portal</span>
          </Link>
          <Link
            href="/auth/hospital/login"
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 transition-all flex items-center gap-1.5"
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Hospital Portal</span>
          </Link>
          <Link
            href="/auth/insurer/login"
            className="px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 transition-all flex items-center gap-1.5"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Insurer Portal</span>
          </Link>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="px-6 sm:px-12 md:px-16 pt-16 pb-12 max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#E6F4F1] text-[#0F5C5C] text-xs font-bold uppercase tracking-wider mb-6 border border-[#c5e6df]">
            <Lock className="w-3.5 h-3.5" />
            Zero-Trust Patient Data Sovereignty & ZKP Verification
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-slate-900 leading-[1.1] mb-6">
            Confidential Health Records.<br />
            <span className="bg-gradient-to-r from-[#0F5C5C] via-[#136F63] to-teal-500 bg-clip-text text-transparent">
              Zero-Knowledge Insurance Claims.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
            HealthShield decouples clinical medical privacy from financial claim settlement. Patients control raw diagnosis encryption while hospitals prove eligibility through Circom Groth16 zk-SNARKs.
          </p>
        </section>

        {/* 3 Role Gateway Cards (Isolated Routes) */}
        <section className="px-6 sm:px-12 md:px-16 pb-20 max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-[#0F5C5C] uppercase tracking-widest block mb-1">Select Your Workspace Gate</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">Choose Your Designated Portal</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Patient Gateway Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between hover:-translate-y-1 hover:border-[#0F5C5C]">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-[#E6F4F1] text-[#0F5C5C] flex items-center justify-center mb-6">
                  <User className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Patient Portal</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Manage your personal longitudinal medical records, grant or revoke attending doctor permissions, and view policy claim statuses.
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <Link
                  href="/auth/patient/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-[#0F5C5C] hover:bg-[#136F63] text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <LogIn className="w-4 h-4" /> Sign In to Patient Vault
                </Link>
                <Link
                  href="/auth/patient/register"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <UserPlus className="w-4 h-4" /> Register New Patient Account
                </Link>
              </div>
            </div>

            {/* Hospital Gateway Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between hover:-translate-y-1 hover:border-teal-700">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-teal-50 text-teal-800 flex items-center justify-center mb-6">
                  <Building2 className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Hospital Portal</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Review admitted patients, log treatments and itemized bills, and generate Circom Groth16 zero-knowledge proofs to pass claims to insurers.
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <Link
                  href="/auth/hospital/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <LogIn className="w-4 h-4" /> Sign In as Hospital
                </Link>
                <Link
                  href="/auth/hospital/register"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <UserPlus className="w-4 h-4" /> Register Hospital Facility
                </Link>
              </div>
            </div>

            {/* Insurer Gateway Card */}
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm hover:shadow-md transition-all flex flex-col justify-between hover:-translate-y-1 hover:border-purple-700">
              <div>
                <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center mb-6">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Insurance Portal</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Audit high-level claims with zero access to sensitive clinical notes, verify mathematical ZK proofs, and approve automated on-chain settlements.
                </p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-slate-100">
                <Link
                  href="/auth/insurer/login"
                  className="w-full py-2.5 px-4 rounded-xl bg-purple-800 hover:bg-purple-900 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-all"
                >
                  <LogIn className="w-4 h-4" /> Sign In as Insurance Underwriter
                </Link>
                <Link
                  href="/auth/insurer/register"
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <UserPlus className="w-4 h-4" /> Register Insurer Organization
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Technical Architecture Showcase Section */}
        <section className="bg-white border-t border-slate-200 py-20 px-6 sm:px-12 md:px-16">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold text-[#0F5C5C] uppercase tracking-widest block mb-2">Defense-In-Depth Security</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
                How HealthShield Preserves Privacy
              </h2>
              <p className="text-slate-600 text-sm">
                A tripartite architecture ensuring medical diagnosis confidentiality while eliminating insurance fraud.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Architecture 1: Off-Chain Privacy */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-[#E6F4F1] text-[#0F5C5C] flex items-center justify-center mb-5">
                  <Lock className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">1. Off-Chain Envelope Privacy</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  Medical records, doctor visits, and detailed diagnosis notes are encrypted using <strong>AES-256-GCM</strong> with unique per-user Data Encryption Keys (DEKs) wrapped by a Master Key in Supabase PostgreSQL.
                </p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>HMAC-SHA256 blind indexing for logins</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Hardware MAC address cryptographic salt</span>
                  </li>
                </ul>
              </div>

              {/* Architecture 2: Zero-Knowledge Verification */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center mb-5">
                  <Cpu className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">2. Zero-Knowledge Proofs</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  <strong>Circom & SnarkJS (Groth16 on BN254)</strong> proves that the treatment falls within active policy coverage and was performed at an approved hospital without ever revealing the private medical diagnosis to the insurer.
                </p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Policy commitment mathematical constraint</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Approved hospital Merkle tree verification</span>
                  </li>
                </ul>
              </div>

              {/* Architecture 3: On-Chain Settlement */}
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-5">
                  <Coins className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-900 mb-2">3. On-Chain Smart Settlement</h4>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-4">
                  <strong>Solidity Smart Contracts on Hardhat EVM</strong> enforce replay protection using cryptographic claim nullifiers and automatically release claim payments upon proof verification.
                </p>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Immutable double-claim nullifier defense</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0" />
                    <span>Instant automated fund release</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-10 px-6 sm:px-12 md:px-16 text-center text-xs">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-white font-bold">
            <Shield className="w-4 h-4 text-teal-400" />
            <span>HealthShield v2.4</span>
          </div>
          <p>© 2026 HealthShield. Zero-Knowledge Healthcare Cryptographic Protocol.</p>
          <div className="flex gap-4 text-slate-400">
            <span>Hardhat EVM</span>
            <span>•</span>
            <span>Circom Groth16</span>
            <span>•</span>
            <span>Supabase AES-256</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
