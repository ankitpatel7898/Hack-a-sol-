"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeSync, SyncEvent } from "@/hooks/useRealtimeSync";
import { api } from "@/lib/api";
import {
  Shield,
  LogOut,
  User,
  Activity,
  FileText,
  DollarSign,
  UserCheck,
  Pill,
  Lock,
  Smartphone,
  Laptop,
  Globe,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ExternalLink,
  ChevronRight,
  X,
  RefreshCw,
  Sliders,
  ShieldCheck,
  Radio,
  FileCheck2,
} from "lucide-react";

export default function PatientDashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<"medical" | "claims" | "doctors" | "prescriptions">("medical");
  const [vaultData, setVaultData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [revokingSessions, setRevokingSessions] = useState<boolean>(false);
  const [togglingDoctorId, setTogglingDoctorId] = useState<string | null>(null);
  const [liveNotification, setLiveNotification] = useState<string | null>(null);

  // Load vault data
  const loadVaultData = useCallback(async () => {
    try {
      const data = await api.getPatientFullVault(user?.id || "pat_rahul_sharma_001");
      setVaultData(data);
    } catch (err) {
      console.error("Failed to load patient vault:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Real-time SSE listener
  const handleEvent = useCallback((evt: SyncEvent) => {
    if (
      evt.event === "HOSPITAL_CLAIM_PASSED" ||
      evt.event === "INSURER_CLAIM_APPROVED" ||
      evt.event === "INSURER_CLAIM_REJECTED" ||
      evt.event === "CLAIM_SETTLED_ONCHAIN" ||
      evt.event === "DOCTOR_ACCESS_UPDATED"
    ) {
      setLiveNotification(`Live update received: ${evt.event.replace(/_/g, " ")}`);
      setTimeout(() => setLiveNotification(null), 5000);
      loadVaultData();
    }
  }, [loadVaultData]);

  const { isConnected } = useRealtimeSync(handleEvent);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/patient/login");
        return;
      }
      if (user.role !== "patient") {
        router.push(`/${user.role}/dashboard`);
        return;
      }
      loadVaultData();
    }
  }, [user, authLoading, router, loadVaultData]);

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    router.push("/home");
  };

  // Toggle Doctor Access
  const handleToggleDoctorAccess = async (visitId: string) => {
    setTogglingDoctorId(visitId);
    try {
      await api.toggleDoctorAccess(visitId);
      await loadVaultData();
    } catch (err) {
      console.error("Failed to toggle doctor access:", err);
    } finally {
      setTogglingDoctorId(null);
    }
  };

  // Revoke other sessions
  const handleRevokeOtherSessions = async () => {
    setRevokingSessions(true);
    try {
      const res = await api.revokeOtherSessions(user?.id || "pat_rahul_sharma_001");
      setLiveNotification(`Success: ${res.message}`);
      setTimeout(() => setLiveNotification(null), 5000);
      await loadVaultData();
    } catch (err) {
      console.error("Failed to revoke sessions:", err);
    } finally {
      setRevokingSessions(false);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#0F5C5C] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Decrypting Patient AES-256-GCM Vault...</p>
      </div>
    );
  }

  const patient = vaultData?.patient || {};
  const records = vaultData?.records || [];
  const claims = vaultData?.claims || [];
  const doctorVisits = vaultData?.doctor_visits || [];
  const prescriptions = vaultData?.prescriptions || [];
  const loginAudits = vaultData?.login_audits || [];
  const totalCoverage = vaultData?.total_coverage || 500000;
  const remainingBalance = vaultData?.remaining_balance || 417500;
  const coverageUsedPercent = Math.min(100, Math.round(((totalCoverage - remainingBalance) / totalCoverage) * 100));

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 pb-16">
      {/* Real-time Notification Banner */}
      {liveNotification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0F5C5C] text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 border border-teal-400/30 animate-bounce">
          <Radio className="w-4 h-4 text-emerald-300 animate-pulse" />
          <span className="text-xs font-semibold">{liveNotification}</span>
        </div>
      )}

      {/* Top Clinical Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Left Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#0F5C5C] text-white flex items-center justify-center shadow-sm">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-[#0F5C5C]">HealthShield</span>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-50 text-[#0F5C5C] px-2 py-0.5 rounded-full border border-teal-200">
                  Patient Vault
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Zero-Knowledge Medical Cryptography</p>
            </div>
          </div>

          {/* Center Identity */}
          <div className="hidden md:flex flex-col items-center">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-[#0F5C5C]" />
              <span className="font-bold text-sm text-slate-900">{patient.full_name || "Aarav Sharma"}</span>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2 py-0.5 rounded-md">
                Verified ID: {patient.id || "PAT-9941"}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>Policy: <strong className="text-slate-700">{patient.policy_id || "POL-HS-2026-9941"}</strong></span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">Active Policy Commitment</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Live Sync Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-ping" : "bg-amber-400"}`} />
              <span className="hidden sm:inline">{isConnected ? "Live Sync Active" : "Sync Connecting"}</span>
            </div>

            {/* Session Activity Button */}
            <button
              onClick={() => setIsDrawerOpen(true)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
              title="View Security & Login Details"
            >
              <Lock className="w-3.5 h-3.5 text-teal-700" />
              <span className="hidden sm:inline">Device & Security</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exit Account</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Profile & Policy Summary Card */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Column 1: Patient Demographic & Hardware Binding */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 text-[#0F5C5C] flex items-center justify-center font-bold text-lg border border-teal-100">
                  {patient.full_name?.charAt(0) || "A"}
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                    {patient.full_name || "Aarav Sharma"}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Age: {patient.age || 32} Yrs • Sex: {patient.sex || "Male"} • DOB: {patient.dob || "1992-05-14"}
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Registered Phone:</span>
                  <span className="font-semibold text-slate-800">{patient.phone || "+91-9876543210"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Email / Login ID:</span>
                  <span className="font-semibold text-slate-800">{patient.email || "aarav@healthshield.io"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">EVM Wallet:</span>
                  <span className="font-mono text-[11px] text-teal-700 font-semibold truncate max-w-[170px]">
                    {patient.wallet_address || "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-1">
                  <span className="text-slate-400 font-medium">Hardware MAC Binding:</span>
                  <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    4A:9B:C2:5E:11:8A (Verified)
                  </span>
                </div>
              </div>
            </div>

            {/* Column 2: Health Issues & Encryption Architecture */}
            <div className="space-y-4 border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Recorded Health Issues</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(patient.health_issues?.split(",") || ["Hypertension", "Meniscal Ligament Tear"]).map(
                    (issue: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-50 text-[#0F5C5C] border border-teal-200/60"
                      >
                        {issue.trim()}
                      </span>
                    )
                  )}
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/70 text-xs space-y-2">
                <div className="flex items-center gap-2 text-teal-800 font-bold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Zero-Trust Envelope Protection</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Clinical records and prescriptions are encrypted at rest with your unique AES-256-GCM Data Encryption Key (DEK). Hospital and insurer access is cryptographically restricted.
                </p>
              </div>
            </div>

            {/* Column 3: Live Policy Balance & Financial Limits */}
            <div className="border-t lg:border-t-0 lg:border-l border-slate-100 lg:pl-6 space-y-4">
              <div>
                <div className="flex justify-between items-baseline mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Remaining Insurance Balance</span>
                  <span className="text-xs font-bold text-emerald-700">Policy Active</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-[#0F5C5C] tracking-tight">
                    ₹{remainingBalance.toLocaleString("en-IN")}
                  </span>
                  <span className="text-xs text-slate-400">/ ₹{totalCoverage.toLocaleString("en-IN")} limit</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0F5C5C] h-full rounded-full transition-all duration-500"
                    style={{ width: `${100 - coverageUsedPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 mt-1.5 font-medium">
                  <span>{(100 - coverageUsedPercent)}% Coverage Available</span>
                  <span>{coverageUsedPercent}% Consumed</span>
                </div>
              </div>

              <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 flex items-center justify-between text-xs">
                <span className="text-teal-900 font-medium">Policy ID:</span>
                <span className="font-mono font-bold text-[#0F5C5C]">{patient.policy_id || "POL-HS-2026-9941"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-200 mb-6 overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab("medical")}
            className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "medical"
                ? "bg-[#0F5C5C] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Activity className="w-4 h-4" />
            Medical History ({records.length})
          </button>

          <button
            onClick={() => setActiveTab("claims")}
            className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "claims"
                ? "bg-[#0F5C5C] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <FileText className="w-4 h-4" />
            Insurance Claims ({claims.length})
          </button>

          <button
            onClick={() => setActiveTab("doctors")}
            className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "doctors"
                ? "bg-[#0F5C5C] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            Doctor History & Access ({doctorVisits.length})
          </button>

          <button
            onClick={() => setActiveTab("prescriptions")}
            className={`px-5 py-3 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${
              activeTab === "prescriptions"
                ? "bg-[#0F5C5C] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            }`}
          >
            <Pill className="w-4 h-4" />
            Prescriptions ({prescriptions.length})
          </button>
        </div>

        {/* Tab 1: Medical History */}
        {activeTab === "medical" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-bold text-slate-900">Decrypted Longitudinal Clinical Records</h3>
              <span className="text-xs text-slate-500 font-medium">Decrypted on-the-fly using Patient DEK</span>
            </div>

            {records.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                No medical records uploaded yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {records.map((rec: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-xs hover:border-teal-200 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F5C5C] flex items-center justify-center font-bold">
                          <Activity className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">
                            {rec.treatment || "General Orthopedic Consultation"}
                          </h4>
                          <p className="text-xs text-slate-500">
                            Admission: {rec.admission_date || "2026-03-12"} • Facility: Apollo Multispeciality Hospital
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-slate-100 text-slate-700 px-3 py-1 rounded-full font-mono font-medium">
                          ICD: {rec.diagnosis_code || "M23.22"}
                        </span>
                        <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-semibold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Decrypted
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400 font-medium">Clinical Diagnosis Summary:</span>
                        <p className="text-slate-700 mt-1 font-medium bg-slate-50 p-3 rounded-xl border border-slate-100">
                          {rec.diagnosis_summary ||
                            "Grade II tear of medial meniscus confirmed via MRI Right Knee. Mild joint effusion present."}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400 font-medium">Attending Physician:</span>
                        <p className="text-slate-700 mt-1 font-semibold">{rec.doctor_name || "Dr. R. K. Verma (M.S. Ortho)"}</p>
                        <div className="mt-2 text-[11px] text-slate-400 font-mono truncate">
                          Envelope Hash: {rec.encrypted_hash || "0x89ab...32de"}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Insurance Claim History */}
        {activeTab === "claims" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-bold text-slate-900">Live Insurance Claim Submissions</h3>
              <span className="text-xs text-slate-500 font-medium">Synchronized via Zero-Knowledge Groth16 Prover</span>
            </div>

            {claims.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                No active insurance claims on record.
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                      <tr>
                        <th className="py-3.5 px-4">Claim ID</th>
                        <th className="py-3.5 px-4">Hospital</th>
                        <th className="py-3.5 px-4">Health Subcategory (Upper-View)</th>
                        <th className="py-3.5 px-4">Claimed</th>
                        <th className="py-3.5 px-4">Status</th>
                        <th className="py-3.5 px-4">On-Chain Settlement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {claims.map((claim: any, idx: number) => {
                        const status = claim.status || "ASKED";
                        return (
                          <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-4 px-4 font-mono font-bold text-slate-900">{claim.claim_id}</td>
                            <td className="py-4 px-4 font-medium text-slate-800">
                              {claim.hospital_name || "Apollo Multispeciality Hospital"}
                            </td>
                            <td className="py-4 px-4">
                              <span className="px-2.5 py-1 rounded-md bg-teal-50 text-[#0F5C5C] font-semibold border border-teal-100">
                                {claim.health_subcategory || "Orthopedics - Knee Injury"}
                              </span>
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-900">
                              ₹{(claim.claimed_amount || 82500).toLocaleString("en-IN")}
                            </td>
                            <td className="py-4 px-4">
                              {status === "ASKED" && (
                                <span className="px-2.5 py-1 rounded-full text-amber-700 bg-amber-50 border border-amber-200 font-semibold inline-flex items-center gap-1">
                                  <Clock className="w-3 h-3" /> Asked (Pending)
                                </span>
                              )}
                              {status === "APPROVED" && (
                                <span className="px-2.5 py-1 rounded-full text-blue-700 bg-blue-50 border border-blue-200 font-semibold inline-flex items-center gap-1">
                                  <FileCheck2 className="w-3 h-3" /> Approved by Insurer
                                </span>
                              )}
                              {status === "PASSED" && (
                                <span className="px-2.5 py-1 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200 font-semibold inline-flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3" /> Settled On-Chain
                                </span>
                              )}
                              {status === "REJECTED" && (
                                <span className="px-2.5 py-1 rounded-full text-rose-700 bg-rose-50 border border-rose-200 font-semibold inline-flex items-center gap-1">
                                  <XCircle className="w-3 h-3" /> Rejected
                                </span>
                              )}
                            </td>
                            <td className="py-4 px-4">
                              {claim.tx_hash ? (
                                <a
                                  href={`https://etherscan.io/tx/${claim.tx_hash}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="font-mono text-[11px] text-teal-700 hover:underline inline-flex items-center gap-1"
                                >
                                  {claim.tx_hash.slice(0, 10)}...
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              ) : (
                                <span className="text-slate-400 italic">Pending payout</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Doctor History & Access Delegation */}
        {activeTab === "doctors" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h3 className="text-base font-bold text-slate-900">Doctor Consultations & Permission Control</h3>
                <p className="text-xs text-slate-500">
                  Grant or revoke doctor access to your AES-256 decrypted records in real time.
                </p>
              </div>
            </div>

            {doctorVisits.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                No doctor visits recorded.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctorVisits.map((visit: any, idx: number) => {
                  const isGranted = Boolean(visit.is_access_granted);
                  const isProcessing = togglingDoctorId === visit.visit_id;
                  return (
                    <div
                      key={idx}
                      className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F5C5C] flex items-center justify-center font-bold">
                              <UserCheck className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-slate-900">{visit.doctor_name}</h4>
                              <p className="text-xs text-teal-800 font-medium">{visit.specialization}</p>
                            </div>
                          </div>
                          <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                            {visit.visit_date}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4 space-y-1">
                          <p>
                            <span className="text-slate-400">Hospital:</span> {visit.hospital_name}
                          </p>
                          <p>
                            <span className="text-slate-400">Consultation Notes:</span> {visit.diagnosis_notes}
                          </p>
                        </div>
                      </div>

                      {/* Access Toggle Button */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isGranted ? "bg-emerald-500" : "bg-slate-400"
                            }`}
                          />
                          <span className={isGranted ? "text-emerald-700" : "text-slate-500"}>
                            {isGranted ? "Access Active" : "Access Revoked"}
                          </span>
                        </div>

                        <button
                          disabled={isProcessing}
                          onClick={() => handleToggleDoctorAccess(visit.visit_id)}
                          className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                            isGranted
                              ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                              : "bg-[#0F5C5C] text-white hover:bg-[#136F63]"
                          }`}
                        >
                          {isProcessing ? (
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          ) : isGranted ? (
                            "Revoke Access"
                          ) : (
                            "Grant Access"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Medicine & Prescription History */}
        {activeTab === "prescriptions" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-base font-bold text-slate-900">Active Prescriptions & Medication Regimens</h3>
              <span className="text-xs text-slate-500 font-medium">Digital Prescription Ledger</span>
            </div>

            {prescriptions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
                No active prescriptions recorded.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {prescriptions.map((rx: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:border-teal-200 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F5C5C] flex items-center justify-center font-bold">
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-slate-900">{rx.medicine_name}</h4>
                          <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {rx.dosage} • {rx.frequency}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-md border border-teal-100">
                        {rx.duration}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                      <p>
                        <span className="text-slate-400 font-medium">Instructions:</span> {rx.instructions}
                      </p>
                      <p>
                        <span className="text-slate-400 font-medium">Prescribed By:</span> {rx.prescribed_by}
                      </p>
                      <p className="text-[11px] text-slate-400 pt-1">Date: {rx.prescribed_date}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Security & Login Activity Slide-over Drawer */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl p-6 flex flex-col justify-between overflow-y-auto">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-200 mb-6">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0F5C5C] flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">Device & Login Details</h3>
                    <p className="text-xs text-slate-500">Security audit trail & session management</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Patient Verification Card */}
              <div className="p-4 rounded-2xl bg-teal-50/60 border border-teal-100 mb-6 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Account Owner:</span>
                  <span className="font-bold text-slate-800">{patient.full_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Bound Phone:</span>
                  <span className="font-bold text-slate-800">{patient.phone || "+91-9876543210"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500 font-medium">Client Cryptography:</span>
                  <span className="text-emerald-700 font-semibold">AES-256-GCM Hardware Encrypted</span>
                </div>
              </div>

              {/* Login Audit List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Recent Login Activity</h4>
                {loginAudits.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No historical login records.</p>
                ) : (
                  loginAudits.map((audit: any, idx: number) => {
                    const isActive = audit.status === "ACTIVE";
                    return (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white text-xs space-y-2 shadow-xs"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <Laptop className="w-4 h-4 text-slate-500" />
                            <span className="font-semibold text-slate-800">{audit.device_info}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                            }`}
                          >
                            {isActive ? "Active Now" : "Terminated"}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-500 pt-1">
                          <div>
                            <span className="text-slate-400">IP:</span> {audit.ip_address}
                          </div>
                          <div>
                            <span className="text-slate-400">Location:</span> {audit.location}
                          </div>
                          <div className="col-span-2 text-slate-400">
                            Logged in: {new Date(audit.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

              {/* Drawer Footer Actions */}
            <div className="pt-6 border-t border-slate-200 mt-6 space-y-2">
              <button
                disabled={revokingSessions}
                onClick={handleRevokeOtherSessions}
                className="w-full py-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                {revokingSessions ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <LogOut className="w-4 h-4" />
                )}
                Revoke All Other Device Sessions
              </button>

              <button
                onClick={() => setIsDrawerOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
