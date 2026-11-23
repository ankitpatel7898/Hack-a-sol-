"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, Eye, EyeOff, ArrowLeft, ArrowRight, AlertCircle } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";

export default function InsurerLoginPage() {
  const router = useRouter();
  const { user, login, isLoading } = useAuth();
  const [email, setEmail] = useState("insurer@healthshield.io");
  const [password, setPassword] = useState("Insurer@12345!");
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
        role: "insurer",
        remember_me: rememberMe
      });
      router.push("/insurer/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check insurer credentials.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6 text-slate-900">
      <div className="w-full max-w-md">
        <Link href="/home" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> ← Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-[10px] font-extrabold uppercase tracking-wider mb-2 border border-purple-200">
              Insurer Audit Portal
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Insurance Officer Sign In</h1>
            <p className="text-xs text-slate-500 mt-1">Audit Groth16 zk-SNARK claims and execute automated settlements.</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Corporate Insurer Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="insurer@healthshield.io"
                  className="w-full pl-9 pr-3 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700"
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
                  className="w-full pl-9 pr-10 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:-translate-y-0.5 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Enter Insurer Workspace <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 pt-5 border-t border-slate-100 text-center">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              ⚡ 1-Click Pre-Seeded Insurer (HealthSecure Insurance Ltd.):
            </span>
            <button
              type="button"
              onClick={() => { setEmail("insurer@healthshield.io"); setPassword("Insurer@12345!"); }}
              className="px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-semibold transition-colors border border-purple-200"
            >
              🛡️ Fill Demo: insurer@healthshield.io
            </button>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Need to register an insurance underwriter?{" "}
            <Link href="/auth/insurer/register" className="font-bold text-purple-800 hover:underline">
              Register Insurer Organization →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
