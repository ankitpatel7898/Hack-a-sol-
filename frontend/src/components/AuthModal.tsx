"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import { 
  ShieldCheck, 
  User, 
  Building2, 
  Shield, 
  X, 
  Eye, 
  EyeOff, 
  Lock, 
  Mail, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight,
  Cpu,
  KeyRound
} from "lucide-react";

interface PasswordCriteria {
  length: boolean;
  uppercase: boolean;
  lowercase: boolean;
  number: boolean;
  special: boolean;
}

export const AuthModal: React.FC = () => {
  const { 
    isAuthModalOpen, 
    closeAuthModal, 
    authModalMode, 
    authModalRole, 
    login, 
    register, 
    isLoading 
  } = useAuth();

  const [mode, setMode] = useState<"signin" | "register">("signin");
  const [selectedRole, setSelectedRole] = useState<UserRole>("patient");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [name, setName] = useState<string>("");
  const [walletAddress, setWalletAddress] = useState<string>("");

  // Role-specific fields
  const [dob, setDob] = useState<string>("1994-05-12");
  const [policyId, setPolicyId] = useState<string>("POL-IND-882190");
  const [emergencyContact, setEmergencyContact] = useState<string>("+91-9876543210");
  const [healthIssues, setHealthIssues] = useState<string>("Asthma, Mild Hypertension");
  const [macAddress, setMacAddress] = useState<string>("00:1A:2B:3C:4D:5E");

  const [hospitalLicense, setHospitalLicense] = useState<string>("HOSP-LIC-DEL-9941");
  const [department, setDepartment] = useState<string>("Emergency & Critical Care");

  const [insurerCode, setInsurerCode] = useState<string>("INS-STAR-2024");
  const [companyName, setCompanyName] = useState<string>("Star Health Insurance Ltd");

  useEffect(() => {
    if (isAuthModalOpen) {
      setMode(authModalMode);
      setSelectedRole(authModalRole);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isAuthModalOpen, authModalMode, authModalRole]);

  if (!isAuthModalOpen) return null;

  // Password strength calculation
  const criteria: PasswordCriteria = {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };

  const strengthScore = Object.values(criteria).filter(Boolean).length;
  const getStrengthColor = () => {
    if (strengthScore <= 2) return "bg-rose-500";
    if (strengthScore <= 4) return "bg-amber-500";
    return "bg-teal-600";
  };
  const getStrengthText = () => {
    if (strengthScore <= 2) return "Weak (Min 10 chars, uppercase, lowercase, number, symbol)";
    if (strengthScore <= 4) return "Moderate (Almost there)";
    return "Strong (Zero-Trust Argon2id Ready)";
  };

  // Quick fill helper
  const handleQuickFill = (role: UserRole) => {
    setSelectedRole(role);
    setMode("signin");
    setError(null);
    if (role === "patient") {
      setEmail("patient@healthshield.io");
      setPassword("Patient@12345!");
    } else if (role === "hospital") {
      setEmail("hospital@healthshield.io");
      setPassword("Hospital@12345!");
    } else if (role === "insurer") {
      setEmail("insurer@healthshield.io");
      setPassword("Insurer@12345!");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (mode === "signin") {
      try {
        await login({
          email,
          password,
          role: selectedRole,
          remember_me: rememberMe,
        });
      } catch (err: any) {
        setError(err.message || "Failed to sign in. Please verify credentials.");
      }
    } else {
      // Register validation
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
      if (strengthScore < 4) {
        setError("Password does not meet zero-trust security criteria (min 10 chars, upper, lower, digit, symbol).");
        return;
      }

      try {
        await register({
          email,
          password,
          name: name.trim() || (selectedRole === "patient" ? "Patient User" : selectedRole === "hospital" ? "Hospital Admin" : "Insurer Lead"),
          role: selectedRole,
          wallet_address: walletAddress.trim() || undefined,
          date_of_birth: selectedRole === "patient" ? dob : undefined,
          policy_id: selectedRole === "patient" ? policyId : undefined,
          emergency_contact: selectedRole === "patient" ? emergencyContact : undefined,
          health_issues: selectedRole === "patient" ? healthIssues : undefined,
          mac_address: macAddress,
          hospital_license: selectedRole === "hospital" ? hospitalLicense : undefined,
          department: selectedRole === "hospital" ? department : undefined,
          insurer_code: selectedRole === "insurer" ? insurerCode : undefined,
          company_name: selectedRole === "insurer" ? companyName : undefined,
        });
        setSuccessMsg("Account registered and envelope keys generated successfully!");
      } catch (err: any) {
        setError(err.message || "Registration failed. Please check inputs.");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-brandBorder w-full max-w-4xl max-h-[92vh] overflow-hidden flex flex-col md:flex-row relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 z-20 text-slate-400 hover:text-slate-700 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Hero Panel: HealthShield Zero-Trust Branding */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-[#0F5C5C] to-[#136F63] p-8 text-white flex-col justify-between relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-teal-400/10 blur-2xl pointer-events-none" />
          <div className="absolute -left-12 -top-12 w-48 h-48 rounded-full bg-teal-300/15 blur-xl pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 mb-8">
              <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-teal-200" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">HealthShield</span>
            </div>

            <span className="inline-block px-3 py-1 rounded-full bg-teal-400/20 text-teal-200 text-[10px] font-bold tracking-widest uppercase mb-4 border border-teal-300/30">
              Zero-Trust Architecture
            </span>

            <h3 className="text-2xl font-black leading-snug tracking-tight mb-4">
              Your health data. <br />
              <span className="text-teal-200">Your sovereign control.</span>
            </h3>

            <p className="text-xs text-teal-100/80 leading-relaxed mb-6">
              Production-grade role-based access with Argon2id password hashing, AES-256-GCM envelope encryption, and Groth16 zero-knowledge proof verification.
            </p>

            <div className="space-y-3 text-xs text-teal-50">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
                <span>HMAC-SHA256 Blind Indexing (No raw email storage)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Per-User Envelope Encryption Keys (DEK)</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Hardware & MAC Cryptographic Fingerprinting</span>
              </div>
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-teal-300 shrink-0" />
                <span>Role-Isolated Workspaces (Zero cross-access)</span>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-teal-500/30 text-[11px] text-teal-200/70 flex items-center justify-between">
            <span>HealthShield v2.4</span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5" /> Hardhat & Supabase
            </span>
          </div>
        </div>

        {/* Right Panel: Dual-Mode Auth Card */}
        <div className="w-full md:w-7/12 p-6 sm:p-8 overflow-y-auto">
          {/* Top Mode Toggle Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === "signin"
                  ? "bg-white text-dark shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setMode("register"); setError(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                mode === "register"
                  ? "bg-white text-dark shadow-sm"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Role Selector Pills */}
          <div className="mb-6">
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Your Workspace Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSelectedRole("patient")}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all ${
                  selectedRole === "patient"
                    ? "bg-[#E6F4F1] border-[#0F5C5C] text-[#0F5C5C] font-bold shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                }`}
              >
                <User className="w-4 h-4 mb-1" />
                <span className="text-xs">Patient</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("hospital")}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all ${
                  selectedRole === "hospital"
                    ? "bg-teal-50 border-teal-700 text-teal-800 font-bold shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                }`}
              >
                <Building2 className="w-4 h-4 mb-1" />
                <span className="text-xs">Hospital</span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole("insurer")}
                className={`flex flex-col items-center justify-center py-2.5 px-2 rounded-xl border text-center transition-all ${
                  selectedRole === "insurer"
                    ? "bg-purple-50 border-purple-700 text-purple-800 font-bold shadow-sm"
                    : "border-slate-200 text-slate-600 hover:border-slate-300 bg-white"
                }`}
              >
                <Shield className="w-4 h-4 mb-1" />
                <span className="text-xs">Insurer</span>
              </button>
            </div>
          </div>

          {/* Feedback messages */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Common: Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address (Login ID)
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={
                    selectedRole === "patient" 
                      ? "patient@healthshield.io" 
                      : selectedRole === "hospital" 
                      ? "hospital@healthshield.io" 
                      : "insurer@healthshield.io"
                  }
                  className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C] focus:border-transparent"
                />
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            {/* Registration: Full Name */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {selectedRole === "patient" ? "Full Legal Name" : "Organization / Facility Name"}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    selectedRole === "patient" ? "Rahul Sharma" : selectedRole === "hospital" ? "Apollo Multispecialty Hospital" : "Star Health Insurance"
                  }
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C] focus:border-transparent"
                />
              </div>
            )}

            {/* Common: Password */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-semibold text-slate-700">Password</label>
                {mode === "signin" && (
                  <span className="text-[11px] text-[#0F5C5C] hover:underline cursor-pointer">
                    Forgot password?
                  </span>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C] focus:border-transparent"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Live Password Strength Meter in Register Mode */}
              {mode === "register" && password.length > 0 && (
                <div className="mt-2 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center text-[10px] font-semibold text-slate-600 mb-1">
                    <span>Password Strength:</span>
                    <span className="font-bold">{getStrengthText()}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getStrengthColor()}`}
                      style={{ width: `${(strengthScore / 5) * 100}%` }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] text-slate-500">
                    <span className={criteria.length ? "text-teal-600 font-bold" : ""}>✓ Min 10 Chars</span>
                    <span className={criteria.uppercase ? "text-teal-600 font-bold" : ""}>✓ Uppercase Letter</span>
                    <span className={criteria.lowercase ? "text-teal-600 font-bold" : ""}>✓ Lowercase Letter</span>
                    <span className={criteria.number ? "text-teal-600 font-bold" : ""}>✓ Number</span>
                    <span className={criteria.special ? "text-teal-600 font-bold" : ""}>✓ Special Character</span>
                  </div>
                </div>
              )}
            </div>

            {/* Registration: Confirm Password */}
            {mode === "register" && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#0F5C5C] focus:border-transparent"
                  />
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            )}

            {/* Role-Specific Fields in Register Mode */}
            {mode === "register" && selectedRole === "patient" && (
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 space-y-3">
                <span className="text-[11px] font-bold text-[#0F5C5C] uppercase tracking-wider block">
                  Patient Health Vault Details (Encrypted with User DEK)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Date of Birth</label>
                    <input
                      type="date"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Policy ID</label>
                    <input
                      type="text"
                      value={policyId}
                      onChange={(e) => setPolicyId(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Emergency Contact</label>
                    <input
                      type="text"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Device MAC Address</label>
                    <input
                      type="text"
                      value={macAddress}
                      onChange={(e) => setMacAddress(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">Known Health Issues / Notes</label>
                  <input
                    type="text"
                    value={healthIssues}
                    onChange={(e) => setHealthIssues(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>
            )}

            {mode === "register" && selectedRole === "hospital" && (
              <div className="p-3 bg-teal-50/50 rounded-xl border border-teal-100 space-y-3">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider block">
                  Hospital Verification Credentials
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">License ID (Merkle Verified)</label>
                    <input
                      type="text"
                      value={hospitalLicense}
                      onChange={(e) => setHospitalLicense(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Facility / Department</label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {mode === "register" && selectedRole === "insurer" && (
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-3">
                <span className="text-[11px] font-bold text-purple-800 uppercase tracking-wider block">
                  Insurance Provider Credentials
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Insurer License Code</label>
                    <input
                      type="text"
                      value={insurerCode}
                      onChange={(e) => setInsurerCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 mb-1">Company Legal Name</label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Remember Me */}
            {mode === "signin" && (
              <div className="flex items-center justify-between text-xs text-slate-600">
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
            )}

            {/* Primary Action Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0F5C5C] hover:bg-[#136F63] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all hover:-translate-y-0.5 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : mode === "signin" ? (
                <>
                  Sign In to Workspace <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  Generate DEK & Create Account <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Discreet Quick-Fill Demo Credentials Helper */}
          <div className="mt-6 pt-5 border-t border-slate-200 text-center">
            <span className="text-[11px] font-semibold text-slate-400 block mb-2">
              ⚡ 1-Click Quick-Fill Demo Accounts (Hackathon Evaluator)
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill("patient")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-[#0F5C5C] text-slate-600 text-[11px] font-medium transition-colors border border-slate-200"
              >
                👤 Patient Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("hospital")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-600 text-[11px] font-medium transition-colors border border-slate-200"
              >
                🏥 Hospital Demo
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill("insurer")}
                className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-600 text-[11px] font-medium transition-colors border border-slate-200"
              >
                🛡️ Insurer Demo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
