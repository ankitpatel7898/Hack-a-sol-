"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Activity, Lock, Cpu, Server } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const INIT_STEPS = [
  { text: "Initializing AES-256-GCM Cryptographic Vault...", icon: Lock, pct: 25 },
  { text: "Connecting Circom Groth16 Prover & BN254 Curve...", icon: Cpu, pct: 55 },
  { text: "Syncing Hardhat Smart Contracts & Merkle Trees...", icon: Server, pct: 85 },
  { text: "Zero-Trust HealthShield Ecosystem Ready.", icon: Shield, pct: 100 }
];

export default function LoadingSplashPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [progress, setProgress] = useState(5);

  useEffect(() => {
    // If user is already authenticated, fast-forward directly to their role dashboard
    if (user) {
      if (user.role === "patient") router.replace("/patient/dashboard");
      else if (user.role === "hospital") router.replace("/hospital/dashboard");
      else if (user.role === "insurer") router.replace("/insurer/dashboard");
      return;
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            router.push("/home");
          }, 400);
          return 100;
        }

        const next = prev + 5;
        if (next >= 85) setCurrentStepIdx(3);
        else if (next >= 55) setCurrentStepIdx(2);
        else if (next >= 25) setCurrentStepIdx(1);
        else setCurrentStepIdx(0);

        return next;
      });
    }, 90);

    return () => clearInterval(interval);
  }, [user, router]);

  const StepIcon = INIT_STEPS[currentStepIdx].icon;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-[#0A2626] to-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden select-none">
      {/* Background Soft Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#136F63]/15 blur-3xl pointer-events-none" />

      {/* Main Container */}
      <div className="w-full max-w-md flex flex-col items-center text-center relative z-10">
        {/* Animated HealthShield Emblem */}
        <div className="relative mb-8">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#0F5C5C] to-[#14B8A6] p-0.5 shadow-2xl shadow-teal-500/20 flex items-center justify-center animate-pulse">
            <div className="w-full h-full bg-slate-900/90 rounded-[22px] flex items-center justify-center relative">
              <Shield className="w-12 h-12 text-teal-400 stroke-[1.8]" />
              <Activity className="w-6 h-6 text-white absolute fill-teal-400 stroke-teal-300 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Brand Titles */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight mb-2">
            Health<span className="text-teal-400">Shield</span>
          </h1>
          <p className="text-xs uppercase tracking-widest font-bold text-teal-300/80">
            Zero-Knowledge Healthcare Infrastructure
          </p>
        </div>

        {/* ECG Heartbeat Pulse SVG Animation */}
        <div className="w-full h-14 mb-8 flex items-center justify-center overflow-hidden px-4">
          <svg className="w-full h-12 stroke-teal-400 fill-none" viewBox="0 0 500 100">
            <path
              d="M 0 50 L 150 50 L 170 50 L 180 15 L 195 85 L 210 35 L 225 65 L 235 50 L 350 50 L 365 25 L 380 75 L 395 50 L 500 50"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="animate-pulse"
              style={{ strokeDasharray: "600", strokeDashoffset: "0" }}
            />
          </svg>
        </div>

        {/* Live Initializing Step Text */}
        <div className="flex items-center gap-2.5 text-xs font-semibold text-teal-100/90 mb-5 min-h-[24px]">
          <StepIcon className="w-4 h-4 text-teal-400 shrink-0 animate-spin" style={{ animationDuration: "3s" }} />
          <span>{INIT_STEPS[currentStepIdx].text}</span>
        </div>

        {/* Modern 0% -> 100% Progress Bar */}
        <div className="w-full bg-slate-800/80 border border-teal-500/20 rounded-full h-3 p-0.5 overflow-hidden shadow-inner mb-3">
          <div
            className="h-full bg-gradient-to-r from-[#0F5C5C] via-[#136F63] to-teal-400 rounded-full transition-all duration-100 ease-out shadow-sm"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Numeric Progress Percentage */}
        <div className="w-full flex justify-between items-center text-[11px] font-mono text-teal-300/70 font-semibold px-1">
          <span>Bootstrapping security</span>
          <span>{progress}%</span>
        </div>
      </div>
    </div>
  );
}
