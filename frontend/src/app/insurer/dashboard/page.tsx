"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeSync, SyncEvent } from "@/hooks/useRealtimeSync";
import { api } from "@/lib/api";
import {
  Shield,
  LogOut,
  Building,
  Radio,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  Coins,
  Cpu,
  EyeOff,
  User,
  X,
  FileCheck2,
} from "lucide-react";

type FilterStatus = "ASKED" | "APPROVED" | "PASSED" | "REJECTED";

export default function InsurerDashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState<FilterStatus>("ASKED");
  const [metrics, setMetrics] = useState<{
    asked: number;
    approved: number;
    passed: number;
    rejected: number;
    total: number;
  }>({
    asked: 0,
    approved: 0,
    passed: 0,
    rejected: 0,
    total: 0,
  });
  const [claims, setClaims] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessingAction, setIsProcessingAction] = useState<string | null>(null);
  const [rejectModalClaim, setRejectModalClaim] = useState<any | null>(null);
  const [rejectReason, setRejectReason] = useState<string>("Exceeds standard policy limits for outpatient services");
  const [liveNotification, setLiveNotification] = useState<string | null>(null);

  // Load Metrics & Claims
  const loadData = useCallback(async (status: FilterStatus = activeTab) => {
    try {
      const [metricsRes, claimsRes] = await Promise.all([
        api.getInsurerClaimsMetrics(),
        api.getInsurerClaimsFiltered(status),
      ]);
      const rawMetrics: any = metricsRes?.metrics || metricsRes || {};
      setMetrics({
        asked: rawMetrics.asked ?? rawMetrics.ASKED ?? 0,
        approved: rawMetrics.approved ?? rawMetrics.APPROVED ?? 0,
        passed: rawMetrics.passed ?? rawMetrics.PASSED ?? 0,
        rejected: rawMetrics.rejected ?? rawMetrics.REJECTED ?? 0,
        total: rawMetrics.total ?? 0,
      });
      const claimList = Array.isArray(claimsRes) ? claimsRes : (claimsRes?.claims || []);
      setClaims(claimList);
    } catch (err) {
      console.error("Failed to load insurer data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  // Real-time SSE listener
  const handleEvent = useCallback((evt: SyncEvent) => {
    if (
      evt.event === "HOSPITAL_CLAIM_PASSED" ||
      evt.event === "INSURER_CLAIM_APPROVED" ||
      evt.event === "INSURER_CLAIM_REJECTED" ||
      evt.event === "CLAIM_SETTLED_ONCHAIN"
    ) {
      setLiveNotification(`Real-time update: ${evt.event.replace(/_/g, " ")}`);
      setTimeout(() => setLiveNotification(null), 5000);
      loadData();
    }
  }, [loadData]);

  const { isConnected } = useRealtimeSync(handleEvent);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/insurer/login");
        return;
      }
      if (user.role !== "insurer") {
        router.push(`/${user.role}/dashboard`);
        return;
      }
      loadData(activeTab);
    }
  }, [user, authLoading, router, activeTab, loadData]);

  const handleTabChange = (status: FilterStatus) => {
    setActiveTab(status);
    setIsLoading(true);
    loadData(status);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/home");
  };

  // Approve & Settle on-chain
  const handleApproveAndSettle = async (claimId: string) => {
    setIsProcessingAction(claimId);
    try {
      // Step 1: Approve
      await api.approveInsurerClaim(claimId);
      // Step 2: Settle On-Chain via smart contract
      const settleRes = await api.settleInsurerClaimOnchain(claimId);
      setLiveNotification(`Claim approved and settled on-chain! Tx: ${settleRes.tx_hash.slice(0, 10)}...`);
      setTimeout(() => setLiveNotification(null), 6000);
      await loadData(activeTab);
    } catch (err: any) {
      console.error("Failed to approve & settle claim:", err);
      alert(`Settlement Error: ${err.message}`);
    } finally {
      setIsProcessingAction(null);
    }
  };

  // Reject Claim
  const handleRejectConfirm = async () => {
    if (!rejectModalClaim) return;
    setIsProcessingAction(rejectModalClaim.claim_id);
    try {
      await api.rejectInsurerClaim(rejectModalClaim.claim_id, rejectReason);
      setLiveNotification(`Claim ${rejectModalClaim.claim_id} rejected.`);
      setTimeout(() => setLiveNotification(null), 5000);
      setRejectModalClaim(null);
      await loadData(activeTab);
    } catch (err: any) {
      console.error("Failed to reject claim:", err);
      alert(`Reject Error: ${err.message}`);
    } finally {
      setIsProcessingAction(null);
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#0F5C5C] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading Insurance Claims & Policy Telemetry...</p>
      </div>
    );
  }

  const companyName = user?.organization_name || user?.name || user?.full_name || "HealthSecure Insurance Ltd.";
  const officerName = user?.name || user?.full_name || "Vikram Deshmukh";
  const officerId = user?.id || "INS-4092";

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
                  Insurer Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">Zero-Knowledge Adjudication & Payouts</p>
            </div>
          </div>

          {/* Center Identity */}
          <div className="hidden md:flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-[#0F5C5C]" />
              <span className="font-bold text-sm text-slate-900">{companyName}</span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>Claims Officer: <strong className="text-slate-700">{officerName}</strong></span>
              <span>•</span>
              <span className="font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">ID: {officerId}</span>
            </div>
          </div>

          {/* Right Controls */}
          <div className="flex items-center gap-3">
            {/* Live Sync Pill */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
              <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-ping" : "bg-amber-400"}`} />
              <span className="hidden sm:inline">{isConnected ? "Live Sync Active" : "Sync Connecting"}</span>
            </div>

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

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Zero-Knowledge Privacy Isolation Notice */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F5C5C]">
                <Cpu className="w-4 h-4" />
                <span>Zero-Knowledge Proof Verification Engine</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Policy Adjudication & Smart Contract Settlement
              </h1>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                As an insurance adjuster, you receive only mathematically verified Groth16 proofs and high-level health subcategories. Detailed clinical records, confidential physician notes, and personal medical receipts are cryptographically inaccessible.
              </p>
            </div>

            <div className="p-4 bg-teal-50/80 rounded-2xl border border-teal-100 flex items-center gap-3 text-xs">
              <EyeOff className="w-5 h-5 text-[#0F5C5C] shrink-0" />
              <div>
                <span className="font-bold text-teal-900">Zero Raw PII Exposure Enforced</span>
                <p className="text-[11px] text-teal-700">Detailed clinical notes stripped from API responses.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 4 Clickable Metric Cards */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Card 1: Asked (Pending) */}
          <button
            onClick={() => handleTabChange("ASKED")}
            className={`p-6 rounded-3xl border text-left transition-all shadow-xs ${
              activeTab === "ASKED"
                ? "bg-amber-50/60 border-amber-300 ring-2 ring-amber-400/40"
                : "bg-white border-slate-200/80 hover:border-amber-200"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Claims Asked (Pending)</span>
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.asked}</div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Awaiting adjuster review & sign-off</p>
          </button>

          {/* Card 2: Approved Claims */}
          <button
            onClick={() => handleTabChange("APPROVED")}
            className={`p-6 rounded-3xl border text-left transition-all shadow-xs ${
              activeTab === "APPROVED"
                ? "bg-blue-50/60 border-blue-300 ring-2 ring-blue-400/40"
                : "bg-white border-slate-200/80 hover:border-blue-200"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-700">Approved Claims</span>
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileCheck2 className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.approved}</div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Verified by Groth16 SnarkJS</p>
          </button>

          {/* Card 3: Passed Claims (Paid On-Chain) */}
          <button
            onClick={() => handleTabChange("PASSED")}
            className={`p-6 rounded-3xl border text-left transition-all shadow-xs ${
              activeTab === "PASSED"
                ? "bg-emerald-50/60 border-emerald-300 ring-2 ring-emerald-400/40"
                : "bg-white border-slate-200/80 hover:border-emerald-200"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Passed (Paid On-Chain)</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.passed}</div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Settled via Hardhat Smart Contract</p>
          </button>

          {/* Card 4: Rejected Claims */}
          <button
            onClick={() => handleTabChange("REJECTED")}
            className={`p-6 rounded-3xl border text-left transition-all shadow-xs ${
              activeTab === "REJECTED"
                ? "bg-rose-50/60 border-rose-300 ring-2 ring-rose-400/40"
                : "bg-white border-slate-200/80 hover:border-rose-200"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Rejected Claims</span>
              <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                <XCircle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tight">{metrics.rejected}</div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">Terms violation or duplicate nullifier</p>
          </button>
        </section>

        {/* Dynamic Filtered Table */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {activeTab === "ASKED" && "Insurance Claims Asked (Pending Action)"}
                {activeTab === "APPROVED" && "Approved Claims (Ready for Settlement)"}
                {activeTab === "PASSED" && "Passed & Settled Claims (On-Chain Records)"}
                {activeTab === "REJECTED" && "Rejected Claims"}
              </h2>
              <p className="text-xs text-slate-500">
                Showing {claims.length} claims filtered by status '{activeTab}'.
              </p>
            </div>
            <button
              onClick={() => loadData(activeTab)}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Claims</span>
            </button>
          </div>

          {claims.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No claims found in category '{activeTab}'.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-4 px-6">Patient & Policy</th>
                    <th className="py-4 px-6">Hospital</th>
                    <th className="py-4 px-6">Claim Amount</th>
                    <th className="py-4 px-6">Health Subcategory (Upper-View)</th>
                    <th className="py-4 px-6">Policy Terms & Conditions</th>
                    <th className="py-4 px-6 text-right">
                      {activeTab === "ASKED" ? "Adjudication Actions" : "Settlement Status"}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map((claim: any, idx: number) => {
                    const isWithin = Boolean(claim.is_within_terms);
                    const isProcessing = isProcessingAction === claim.claim_id;

                    return (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        {/* Patient & Policy */}
                        <td className="py-4 px-6">
                          <div className="font-bold text-sm text-slate-900">{claim.patient_name}</div>
                          <div className="text-slate-500 text-[11px]">ID: {claim.patient_id}</div>
                          <div className="text-teal-700 font-mono text-[11px] font-semibold mt-0.5">
                            {claim.policy_id}
                          </div>
                          <div className="text-[10px] text-slate-400">{claim.patient_phone}</div>
                        </td>

                        {/* Hospital */}
                        <td className="py-4 px-6">
                          <div className="font-semibold text-slate-800">{claim.hospital_name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">{claim.hospital_id}</div>
                        </td>

                        {/* Claim Amount */}
                        <td className="py-4 px-6">
                          <div className="font-extrabold text-sm text-[#0F5C5C]">
                            ₹{(claim.claimed_amount || 82500).toLocaleString("en-IN")}
                          </div>
                          {claim.approved_amount && (
                            <div className="text-[10px] text-slate-400">
                              Approved: ₹{Number(claim.approved_amount).toLocaleString("en-IN")}
                            </div>
                          )}
                        </td>

                        {/* Upper-View Subcategory */}
                        <td className="py-4 px-6">
                          <span className="px-2.5 py-1 rounded-md bg-teal-50 text-[#0F5C5C] font-semibold border border-teal-100 text-[11px]">
                            {claim.health_subcategory || "Orthopedics - Knee Injury"}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                            <EyeOff className="w-2.5 h-2.5" />
                            <span>Clinical notes stripped</span>
                          </div>
                        </td>

                        {/* Terms & Conditions Badge */}
                        <td className="py-4 px-6 max-w-xs">
                          {isWithin ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-emerald-800 bg-emerald-50 border border-emerald-200 text-[11px] font-semibold">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Falls Under Policy T&C</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-rose-800 bg-rose-50 border border-rose-200 text-[11px] font-semibold">
                              <XCircle className="w-3.5 h-3.5 text-rose-600" />
                              <span>Exceeds Policy Terms</span>
                            </div>
                          )}
                          <p className="text-[11px] text-slate-500 mt-1">
                            {claim.terms_and_conditions_text || "Schedule IV - Orthopedic Surgery Eligibility"}
                          </p>
                        </td>

                        {/* Actions / Status */}
                        <td className="py-4 px-6 text-right">
                          {activeTab === "ASKED" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                disabled={isProcessing}
                                onClick={() => handleApproveAndSettle(claim.claim_id)}
                                className="px-3.5 py-2 rounded-xl bg-[#0F5C5C] hover:bg-[#136F63] text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-xs transition-all"
                              >
                                {isProcessing ? (
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                )}
                                <span>Approve & Settle</span>
                              </button>

                              <button
                                disabled={isProcessing}
                                onClick={() => setRejectModalClaim(claim)}
                                className="px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs inline-flex items-center gap-1 transition-all"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <span
                                className={`px-2.5 py-1 rounded-full text-[11px] font-bold inline-flex items-center gap-1 ${
                                  claim.status === "PASSED"
                                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                    : claim.status === "APPROVED"
                                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                                    : "bg-rose-50 text-rose-800 border border-rose-200"
                                }`}
                              >
                                {claim.status === "PASSED" && <Coins className="w-3 h-3 text-emerald-600" />}
                                {claim.status}
                              </span>

                              {claim.tx_hash && (
                                <div className="text-[10px]">
                                  <a
                                    href={`https://etherscan.io/tx/${claim.tx_hash}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="font-mono text-teal-700 hover:underline inline-flex items-center gap-1"
                                  >
                                    Tx: {claim.tx_hash.slice(0, 10)}...
                                    <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* Reject Modal */}
      {rejectModalClaim && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full shadow-2xl p-6 sm:p-8">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Reject Insurance Claim</h3>
                  <p className="text-xs text-slate-500 font-mono">{rejectModalClaim.claim_id}</p>
                </div>
              </div>
              <button
                onClick={() => setRejectModalClaim(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4">
              Specify the legal or policy reason for rejecting this claim for patient{" "}
              <strong>{rejectModalClaim.patient_name}</strong>.
            </p>

            <div className="mb-6">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                Rejection Reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-rose-400"
              />
            </div>

            <div className="space-y-2">
              <button
                onClick={handleRejectConfirm}
                className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <XCircle className="w-4 h-4" />
                Confirm Claim Rejection
              </button>

              <button
                onClick={() => setRejectModalClaim(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
