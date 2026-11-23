"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Shield, User, Lock, Mail, Eye, EyeOff, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";

export default function PatientLoginPage() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();
  const [email, setEmail] = useState("patient@healthshield.io");
  const [password, setPassword] = useState("Patient@12345!");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.role === "patient") router.replace("/patient/dashboard");
      else if (user.role === "hospital") router.replace("/hospital/dashboard");
      else if (user.role === "insurer") router.replace("/insurer/dashboard");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login({
        email: email.trim(),
        password,
        role: "patient",
        remember_me: rememberMe
      });
      router.push("/patient/dashboard");
    } catch (err: any) {
      const raw = err?.message || err;
      const msg = typeof raw === "string" ? raw : JSON.stringify(raw);
      setError(msg.includes("[object") ? "Failed to sign in. Please check your credentials." : msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 text-slate-900">
      <div className="w-full max-w-md">
        {/* Back to Home Link */}
        <Link href="/home" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0F5C5C] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> ← Back to Home
        </Link>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-[#E6F4F1] text-[#0F5C5C] flex items-center justify-center mx-auto mb-4">
              <User className="w-7 h-7" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#E6F4F1] text-[#0F5C5C] text-[10px] font-extrabold uppercase tracking-wider mb-2">
              Patient Portal Authentication
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Sign In to Health Vault</h1>
            <p className="text-xs text-slate-500 mt-1">Access your encrypted longitudinal records & policy claims.</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{typeof error === "string" ? error : JSON.stringify(error)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Registered Email / Login ID
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="patient@healthshield.io or aarav@healthshield.io"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C] focus:border-transparent"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C] focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-slate-300 text-[#0F5C5C] focus:ring-[#0F5C5C]"
                />
                <span>Remember session for 7 days</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#0F5C5C] hover:bg-[#136F63] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:-translate-y-0.5 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Sign In to Patient Workspace <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Fill Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              ⚡ 1-Click Pre-Seeded Patient Account (Aarav Sharma):
            </span>
            <button
              type="button"
              onClick={() => { setEmail("patient@healthshield.io"); setPassword("Patient@12345!"); }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-[#0F5C5C] text-slate-600 text-xs font-semibold transition-colors border border-slate-200"
            >
              👤 Fill Demo: patient@healthshield.io
            </button>
          </div>

          {/* Switch to Register */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Don't have a patient account?{" "}
            <Link href="/auth/patient/register" className="font-bold text-[#0F5C5C] hover:underline">
              Create Patient Account →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
