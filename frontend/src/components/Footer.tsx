"use client";

import React from "react";
import { Shield, Heart } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-dark text-white px-6 sm:px-12 md:px-16 py-12 mt-auto">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-accent text-dark">
            <Shield className="w-5 h-5 stroke-[2.2]" />
            <Heart className="w-2.5 h-2.5 absolute fill-dark stroke-dark" />
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            Health<span className="text-accent">Guard</span>
          </span>
        </div>

        <div className="text-xs text-slate-400">
          <p className="font-medium text-slate-300">
            Privacy First. Trust Always.
          </p>
          <p className="mt-1 text-[11px] text-slate-500">
            Circom 2.x • SnarkJS Groth16 • Solidity 0.8.20 • AES-256-GCM • FastAPI • Next.js
          </p>
        </div>

        <div className="text-xs text-slate-500">
          © {new Date().getFullYear()} HealthGuard. All rights reserved.
        </div>
      </div>
    </footer>
  );
};
