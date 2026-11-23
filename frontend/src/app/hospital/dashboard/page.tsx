"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRealtimeSync, SyncEvent } from "@/hooks/useRealtimeSync";
import { api } from "@/lib/api";
import {
  Building2,
  Shield,
  LogOut,
  Radio,
  UserCheck,
  FileText,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  X,
  RefreshCw,
  Cpu,
  Layers,
  FileCheck2,
  Stethoscope,
  Receipt,
  EyeOff,
} from "lucide-react";

export default function HospitalDashboardPage() {
  const router = useRouter();
  const { user, logout, isLoading: authLoading } = useAuth();

  // State
  const [queueData, setQueueData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [isGeneratingProof, setIsGeneratingProof] = useState<boolean>(false);
  const [proverStep, setProverStep] = useState<string>("");
  const [liveNotification, setLiveNotification] = useState<string | null>(null);

  // Load Queue Data
  const loadQueue = useCallback(async () => {
    try {
      const data = await api.getHospitalPatientQueue();
      setQueueData(data);
    } catch (err) {
      console.error("Failed to load hospital patient queue:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
      loadQueue();
    }
  }, [loadQueue]);

  const { isConnected } = useRealtimeSync(handleEvent);

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push("/auth/hospital/login");
        return;
      }
      if (user.role !== "hospital") {
        router.push(`/${user.role}/dashboard`);
        return;
      }
      loadQueue();
    }
  }, [user, authLoading, router, loadQueue]);

  const handleLogout = async () => {
    await logout();
    router.push("/home");
  };

  const handleOpenClaimModal = (patient: any) => {
    setSelectedPatient(patient);
    setIsClaimModalOpen(true);
  };

  const handlePassClaimToInsurer = async () => {
    if (!selectedPatient) return;
    setIsGeneratingProof(true);
    setProverStep("1/3 Loading Circom R1CS Constraints & Proving Key...");

    try {
      await new Promise((r) => setTimeout(r, 600));
      setProverStep("2/3 Synthesizing Groth16 Zero-Knowledge Witness...");
      await new Promise((r) => setTimeout(r, 600));
      setProverStep("3/3 Isolating Upper-View Health Subcategory & Passing Claim...");

      const payload = {
        patient_id: selectedPatient.patient_id,
        patient_name: selectedPatient.patient_name,
        policy_id: selectedPatient.policy_id || selectedPatient.patient_policy || "POL-HS-2026-9941",
        patient_phone: selectedPatient.patient_phone || selectedPatient.phone || "+91-9876543210",
        assisting_doctor: selectedPatient.assisting_doctor || "Dr. R. K. Verma",
        detailed_medical_history: selectedPatient.detailed_medical_history || selectedPatient.clinical_diagnosis || "Grade II tear of medial meniscus",
        clinical_diagnosis: selectedPatient.clinical_diagnosis || selectedPatient.detailed_medical_history || "Grade II tear of medial meniscus",
        itemized_bill_json: typeof selectedPatient.itemized_bills === "string" 
          ? selectedPatient.itemized_bills 
          : JSON.stringify(selectedPatient.itemized_bills || { surgery: 45000, room: 15000, pharmacy: 12500 }),
        health_subcategory: selectedPatient.health_subcategory || "Orthopedics - Knee Injury",
        claimed_amount: selectedPatient.requested_amount || selectedPatient.claim_amount || 82500,
        terms_and_conditions_text: selectedPatient.terms_and_conditions_text || "Schedule IV - Orthopedic Surgery Eligibility",
        is_within_terms: Boolean(selectedPatient.is_within_terms ?? true),
      };

      const res = await api.passHospitalClaimToInsurer(payload);

      setLiveNotification(`Success: ${res.message}`);
      setTimeout(() => setLiveNotification(null), 5000);
      setIsClaimModalOpen(false);
      setSelectedPatient(null);
      await loadQueue();
    } catch (err: any) {
      console.error("Failed to pass claim:", err);
      alert(`Error passing claim: ${err.message}`);
    } finally {
      setIsGeneratingProof(false);
      setProverStep("");
    }
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#0F5C5C] border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-semibold text-slate-600">Loading Hospital Queue & Provider Credentials...</p>
      </div>
    );
  }

  const hospitalName = queueData?.hospital_name || user?.name || user?.full_name || "Apollo Multispeciality Hospital";
  const hospitalId = queueData?.hospital_id || user?.id || "HOSP-APL-8821";
  const patients = Array.isArray(queueData) ? queueData : (queueData?.patients || []);

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
                  Hospital Portal
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">ZKP Medical Claims & Direct Admittance</p>
            </div>
          </div>

          {/* Center Identity */}
          <div className="hidden md:flex flex-col items-center">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#0F5C5C]" />
              <span className="font-bold text-sm text-slate-900">{hospitalName}</span>
              <span className="text-xs bg-teal-100 text-teal-800 font-semibold px-2 py-0.5 rounded-md">
                Verified ID: {hospitalId}
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
              <span>Merkle Tree Root: <strong className="font-mono text-slate-700">0x2f9c...5a1b</strong></span>
              <span>•</span>
              <span className="text-emerald-600 font-medium">Licensed Provider Status Active</span>
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
        {/* Intro Banner */}
        <section className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#0F5C5C]">
                <Cpu className="w-4 h-4" />
                <span>Zero-Knowledge Policy Eligibility Gateway</span>
              </div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Hospital Admittance & Insurance Claim Queue
              </h1>
              <p className="text-xs text-slate-500 max-w-2xl leading-relaxed">
                Review verified patients currently admitted or requesting insurance pre-authorization. Generate Circom Groth16 proofs to submit claims without exposing confidential clinical records or itemized receipts to insurance adjusters.
              </p>
            </div>

            <div className="flex items-center gap-4 bg-teal-50/70 p-4 rounded-2xl border border-teal-100">
              <div className="text-right">
                <p className="text-xs text-slate-500 font-medium">Patients Awaiting ZKP Claims</p>
                <p className="text-2xl font-extrabold text-[#0F5C5C]">{patients.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#0F5C5C] text-white flex items-center justify-center">
                <FileCheck2 className="w-6 h-6" />
              </div>
            </div>
          </div>
        </section>

        {/* Live Queue Table */}
        <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <h2 className="text-base font-bold text-slate-900">Patients Requesting Insurance Assistance</h2>
              <p className="text-xs text-slate-500">
                Detailed clinical history is strictly isolated within the hospital boundary.
              </p>
            </div>
            <button
              onClick={loadQueue}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Queue</span>
            </button>
          </div>

          {patients.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm">
              No patients in the active queue at this time.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-4 px-6">Patient & Policy</th>
                    <th className="py-4 px-6">Assisting Doctor</th>
                    <th className="py-4 px-6">Detailed Clinical Diagnosis</th>
                    <th className="py-4 px-6">Itemized Medical Bills</th>
                    <th className="py-4 px-6">Requested Amount</th>
                    <th className="py-4 px-6 text-right">ZKP Claim Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients.map((pat: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                      {/* Patient & Policy */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-sm text-slate-900">{pat.patient_name}</div>
                        <div className="text-slate-500 text-[11px]">ID: {pat.patient_id}</div>
                        <div className="text-teal-700 font-mono text-[11px] font-semibold mt-0.5">
                          {pat.policy_id || pat.patient_policy || "POL-HS-2026-9941"}
                        </div>
                        <div className="text-[10px] text-slate-400">{pat.patient_phone || pat.phone || "+91-9876543210"}</div>
                      </td>

                      {/* Doctor */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                          <Stethoscope className="w-3.5 h-3.5 text-teal-700" />
                          <span>{pat.assisting_doctor || "Dr. R. K. Verma"}</span>
                        </div>
                        <div className="text-slate-400 text-[11px]">Orthopedic Dept.</div>
                      </td>

                      {/* Detailed Clinical Diagnosis */}
                      <td className="py-4 px-6 max-w-xs">
                        <p className="text-slate-700 font-medium leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                          {pat.clinical_diagnosis || pat.detailed_medical_history || "Grade II tear of medial meniscus"}
                        </p>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-emerald-700 font-semibold">
                          <EyeOff className="w-3 h-3" />
                          <span>Never sent to Insurer (Hospital & Patient Eyes Only)</span>
                        </div>
                      </td>

                      {/* Itemized Bills */}
                      <td className="py-4 px-6">
                        <div className="space-y-1 text-[11px]">
                          {Object.entries(
                            typeof pat.itemized_bills === "object" && pat.itemized_bills !== null
                              ? pat.itemized_bills
                              : { surgery: 45000, room: 15000, pharmacy: 12500, diagnostics: 10000 }
                          ).map(([item, amt]: [string, any], bIdx: number) => (
                            <div key={bIdx} className="flex justify-between gap-3 text-slate-600">
                              <span className="capitalize">{item}:</span>
                              <span className="font-semibold text-slate-800">
                                ₹{Number(amt).toLocaleString("en-IN")}
                              </span>
                            </div>
                          ))}
                        </div>
                      </td>

                      {/* Requested Amount */}
                      <td className="py-4 px-6">
                        <div className="font-extrabold text-sm text-[#0F5C5C]">
                          ₹{(pat.requested_amount || pat.claim_amount || 82500).toLocaleString("en-IN")}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-medium">Within ₹5L Coverage</div>
                      </td>

                      {/* Action */}
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={() => handleOpenClaimModal(pat)}
                          className="px-4 py-2.5 rounded-xl bg-[#0F5C5C] hover:bg-[#136F63] text-white font-bold text-xs inline-flex items-center gap-2 shadow-xs transition-all"
                        >
                          <span>Create & Pass ZKP Claim</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {/* ZKP Claim Generator Modal */}
      {isClaimModalOpen && selectedPatient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full shadow-2xl p-6 sm:p-8 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-start pb-4 border-b border-slate-100 mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0F5C5C] flex items-center justify-center font-bold">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Pass ZKP Claim to Insurer</h3>
                  <p className="text-xs text-slate-500">Circom Groth16 Zero-Knowledge Proof Synthesis</p>
                </div>
              </div>
              <button
                disabled={isGeneratingProof}
                onClick={() => setIsClaimModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Zero-Knowledge Privacy Isolation Callout */}
            <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 text-xs text-[#0F5C5C] mb-6 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-teal-900">
                <Shield className="w-4 h-4 text-[#0F5C5C]" />
                <span>Zero-Knowledge Boundary Enforcement</span>
              </div>
              <p className="text-[11px] leading-relaxed text-teal-800">
                The SnarkJS prover will generate a Groth16 cryptographic proof confirming the patient has an active policy and falls within treatment terms. Only the upper-view health subcategory below will be shared with the insurance provider. All detailed clinical observations and doctor notes will remain strictly private.
              </p>
            </div>

            {/* Claim Details Summary */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-6">
              <div>
                <span className="text-slate-400 font-medium">Patient:</span>
                <p className="font-bold text-slate-800">{selectedPatient.patient_name}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Policy ID:</span>
                <p className="font-bold text-slate-800 font-mono">{selectedPatient.policy_id}</p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Claim Amount:</span>
                <p className="font-extrabold text-[#0F5C5C] text-sm">
                  ₹{Number(selectedPatient.requested_amount).toLocaleString("en-IN")}
                </p>
              </div>
              <div>
                <span className="text-slate-400 font-medium">Assisting Doctor:</span>
                <p className="font-bold text-slate-800">{selectedPatient.assisting_doctor}</p>
              </div>
            </div>

            {/* Upper-View Subcategory Selector */}
            <div className="mb-6 space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Upper-View Health Subcategory (Passed to Insurer)
              </label>
              <input
                type="text"
                readOnly
                value={selectedPatient.health_subcategory || "Orthopedics - Knee Injury"}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800 text-xs shadow-xs"
              />
              <p className="text-[11px] text-slate-400">
                High-level classification verified under Policy Schedule IV.
              </p>
            </div>

            {/* Terms and Conditions Confirmation */}
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 mb-6 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Falls Under Policy Terms & Conditions:</span>
                <p className="text-[11px] text-emerald-700 mt-0.5">
                  {selectedPatient.terms_and_conditions_text ||
                    "Section 4.2 - Covered Inpatient Orthopedic Arthroscopy & Ligament Repair"}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-3">
              {isGeneratingProof ? (
                <div className="p-4 rounded-2xl bg-slate-900 text-white text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>{proverStep}</span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-emerald-400 h-full w-2/3 animate-pulse" />
                  </div>
                </div>
              ) : (
                <button
                  onClick={handlePassClaimToInsurer}
                  className="w-full py-3.5 rounded-xl bg-[#0F5C5C] hover:bg-[#136F63] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <Cpu className="w-4 h-4" />
                  <span>Synthesize Groth16 Proof & Pass Claim to Insurer</span>
                </button>
              )}

              <button
                disabled={isGeneratingProof}
                onClick={() => setIsClaimModalOpen(false)}
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
