"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ShieldCheck, Lock, Mail, User, Building2, ArrowLeft, ArrowRight, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";

export default function InsurerRegisterPage() {
  const router = useRouter();
  const { user, register, isLoading } = useAuth();

  const [companyName, setCompanyName] = useState("HealthSecure Insurance Ltd.");
  const [insurerCode, setInsurerCode] = useState("INS-LIC-8891");
  const [officerName, setOfficerName] = useState("Vikram Deshmukh");
  const [officerId, setOfficerId] = useState("INS-4092");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [macAddress, setMacAddress] = useState("00:1A:2B:3C:4D:BB");
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

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 10) {
      setError("Password must be at least 10 characters.");
      return;
    }

    try {
      await register({
        email: email.trim(),
        password,
        name: `${companyName} (${officerName})`,
        role: "insurer",
        company_name: companyName.trim(),
        insurer_code: insurerCode.trim(),
        mac_address: macAddress
      });
      router.push("/insurer/dashboard");
    } catch (err: any) {
      const raw = err?.message || err;
      const msg = typeof raw === "string" ? raw : JSON.stringify(raw);
      setError(msg.includes("[object") ? "Registration failed. Please verify your details." : msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 flex flex-col justify-center items-center text-slate-900">
      <div className="w-full max-w-lg">
        <Link href="/home" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-purple-800 mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> ← Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-800 flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-purple-50 text-purple-800 text-[10px] font-extrabold uppercase tracking-wider mb-2 border border-purple-200">
              Insurance Underwriter Registration
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Register Insurance Organization</h1>
            <p className="text-xs text-slate-500 mt-1">Audit Groth16 zk-SNARK claims and execute automated settlements.</p>
          </div>

          {error && (
            <div className="mb-5 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{typeof error === "string" ? error : JSON.stringify(error)}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Insurance Company Legal Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="HealthSecure Insurance Ltd."
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                  <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Insurer License ID</label>
                <input
                  type="text"
                  required
                  value={insurerCode}
                  onChange={(e) => setInsurerCode(e.target.value)}
                  placeholder="INS-LIC-8891"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700 font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Audit Officer Full Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={officerName}
                    onChange={(e) => setOfficerName(e.target.value)}
                    placeholder="Vikram Deshmukh"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Officer ID Code</label>
                <input
                  type="text"
                  required
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  placeholder="INS-4092"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700 font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Corporate Email Address (Login ID)</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="v.deshmukh@healthsecure.com"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 10 characters"
                    className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-2.5 text-slate-400"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm password"
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-700"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:-translate-y-0.5 disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Register Insurer Organization <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Already registered?{" "}
            <Link href="/auth/insurer/login" className="font-bold text-purple-800 hover:underline">
              Sign In to Insurer Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
