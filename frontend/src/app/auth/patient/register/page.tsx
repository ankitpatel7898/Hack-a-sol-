"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { User, Lock, Mail, Phone, Calendar, FileText, ArrowLeft, ArrowRight, AlertCircle, CheckCircle2, Shield, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";

export default function PatientRegisterPage() {
  const router = useRouter();
  const { user, register, isLoading } = useAuth();

  const [name, setName] = useState("Aarav Sharma");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91-9876543210");
  const [dob, setDob] = useState("1997-04-16");
  const [policyId, setPolicyId] = useState("POL-HS-2026-9941");
  const [healthIssues, setHealthIssues] = useState("Acute Meniscus Tear, Mild Allergic Rhinitis");
  const [macAddress, setMacAddress] = useState("00:1A:2B:3C:4D:5E");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      if (user.role === "patient") router.replace("/patient/dashboard");
      else if (user.role === "hospital") router.replace("/hospital/dashboard");
      else if (user.role === "insurer") router.replace("/insurer/dashboard");
    }
  }, [user, router]);

  // Live password strength
  const criteria = {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(criteria).filter(Boolean).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (score < 4) {
      setError("Password must meet zero-trust criteria (min 10 chars, uppercase, lowercase, number, symbol).");
      return;
    }

    try {
      await register({
        email: email.trim(),
        password,
        name: name.trim(),
        role: "patient",
        date_of_birth: dob,
        policy_id: policyId.trim(),
        emergency_contact: phone.trim(),
        health_issues: healthIssues.trim(),
        mac_address: macAddress
      });
      router.push("/patient/dashboard");
    } catch (err: any) {
      const raw = err?.message || err;
      const msg = typeof raw === "string" ? raw : JSON.stringify(raw);
      setError(msg.includes("[object") ? "Registration failed. Please verify your details." : msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-12 px-6 flex flex-col justify-center items-center text-slate-900">
      <div className="w-full max-w-lg">
        {/* Back to Home Link */}
        <Link href="/home" className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#0F5C5C] mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> ← Back to Home
        </Link>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-[#E6F4F1] text-[#0F5C5C] flex items-center justify-center mx-auto mb-4">
              <User className="w-7 h-7" />
            </div>
            <span className="inline-block px-3 py-1 rounded-full bg-[#E6F4F1] text-[#0F5C5C] text-[10px] font-extrabold uppercase tracking-wider mb-2">
              Patient Registration
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Create Sovereign Patient Vault</h1>
            <p className="text-xs text-slate-500 mt-1">Generates unique 32-byte DEK envelope key for off-chain encryption.</p>
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
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C]"
                  />
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone Number (2FA Anchor)</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91-9876543210"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C]"
                  />
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Login ID)</label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. aarav.sharma@healthshield.io"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C]"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C]"
                  />
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Insurance Policy Number</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={policyId}
                    onChange={(e) => setPolicyId(e.target.value)}
                    placeholder="POL-HS-2026-9941"
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C]"
                  />
                  <FileText className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#E6F4F1]/60 rounded-xl border border-[#cbebe4] space-y-2">
              <span className="text-[11px] font-bold text-[#0F5C5C] uppercase tracking-wider block">
                Sensitive Clinical History [Encrypted via DEK]
              </span>
              <input
                type="text"
                required
                value={healthIssues}
                onChange={(e) => setHealthIssues(e.target.value)}
                placeholder="e.g. Acute Meniscus Tear, Mild Allergic Rhinitis"
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white"
              />
              <p className="text-[10px] text-slate-500">
                Encrypted client-side off-chain with AES-256-GCM. Concealed from insurers via ZKP.
              </p>
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
                    className="w-full pl-8 pr-8 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C]"
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
                    className="w-full pl-8 pr-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C]"
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                </div>
              </div>
            </div>

            {/* Live Password Strength Meter */}
            {password.length > 0 && (
              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[10px]">
                <div className="flex justify-between items-center font-bold text-slate-600 mb-1">
                  <span>Zero-Trust Password Strength:</span>
                  <span className={score >= 4 ? "text-teal-700" : "text-amber-600"}>
                    {score >= 4 ? "Argon2id Compliant ✓" : "Needs 10+ chars, uppercase, lowercase, digit, symbol"}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${score <= 2 ? "bg-rose-500" : score <= 4 ? "bg-amber-500" : "bg-teal-600"}`}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-[#0F5C5C] hover:bg-[#136F63] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-all hover:-translate-y-0.5 disabled:opacity-50 mt-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Generate DEK & Register Patient Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Login */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-600">
            Already registered?{" "}
            <Link href="/auth/patient/login" className="font-bold text-[#0F5C5C] hover:underline">
              Sign In to Patient Portal →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
