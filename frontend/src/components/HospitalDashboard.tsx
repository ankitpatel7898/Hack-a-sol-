"use client";

import React, { useState, useEffect } from "react";
import {
  Building2,
  FileText,
  Clock,
  Shield,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Cpu,
} from "lucide-react";
import { api } from "../lib/api";
import { ClaimItem, PermissionState } from "../types";

export const HospitalDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [zkpFeedback, setZkpFeedback] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [patientName, setPatientName] = useState("Rahul Sharma");
  const [policyId, setPolicyId] = useState("POL-IND-882190");
  const [treatment, setTreatment] = useState("Appendectomy");
  const [diagnosis, setDiagnosis] = useState("Acute Appendicitis (ICD-10 K35.8)");
  const [prescriptions, setPrescriptions] = useState("Ceftriaxone 1g IV, Metronidazole 500mg, Tramadol 50mg");
  const [claimAmount, setClaimAmount] = useState<number>(20000);

  const fetchHospitalData = async () => {
    try {
      setLoading(true);
      const permData = await api.getPatientDashboard("pat_rahul_sharma_001");
      setPermission(permData.permission);
      const claimsData = await api.getHospitalClaims();
      setClaims(claimsData.claims || []);
    } catch (err: any) {
      console.error("Error fetching hospital dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHospitalData();
  }, []);

  const handleSubmitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setZkpFeedback(null);

    if (!permission?.is_granted) {
      setErrorMsg(
        "Patient access permission is disabled! Please toggle hospital access in the Patient Portal first."
      );
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.createHospitalClaim({
        patient_name: patientName,
        patient_id: "pat_rahul_sharma_001",
        policy_id: policyId,
        treatment: treatment,
        diagnosis: diagnosis,
        prescriptions: prescriptions,
        claim_amount: Number(claimAmount),
        hospital_id: "Apollo Hospital Delhi",
      });

      setZkpFeedback(res);
      fetchHospitalData();
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to generate Groth16 proof and submit claim.");
    } finally {
      setSubmitting(false);
    }
  };

  const pendingClaims = claims.filter((c) => c.status === "Pending").length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hospital Identity Header */}
      <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-roleHospital flex items-center justify-center font-bold">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-dark">
              Apollo Hospital Delhi
            </h3>
            <p className="text-xs text-muted">
              Hospital ID: <span className="font-mono text-textMain font-semibold">101</span> •
              Authorized Merkle Leaf in Insurer Registry
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="tag-badge bg-teal-50 text-roleHospital">
            Authorized Healthcare Provider
          </span>
        </div>
      </div>

      {/* Permission Status Banner */}
      {permission?.is_granted ? (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs sm:text-sm font-medium flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <div>
            <strong>Patient Access Granted:</strong> Rahul Sharma has authorized Apollo Hospital to create treatment claims and compute Zero-Knowledge proofs.
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs sm:text-sm font-medium flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <strong>Access Revoked / Disabled:</strong> Rahul Sharma has not granted hospital access. You must enable permission from the Patient Portal before submitting a claim.
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-50 text-roleHospital flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-dark">
              {loading ? "..." : claims.length}
            </h4>
            <p className="text-xs font-semibold text-muted">Claims Created</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-dark">
              {loading ? "..." : pendingClaims}
            </h4>
            <p className="text-xs font-semibold text-muted">Pending Verification</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-roleInsurer flex items-center justify-center">
            <Fingerprint className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-dark">Groth16</h4>
            <p className="text-xs font-semibold text-muted">ZKP Proof System</p>
          </div>
        </div>
      </div>

      {/* Create New Insurance Claim Form */}
      <div className="p-8 rounded-2xl bg-white border border-brandBorder shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-dark">
            Create New Insurance Claim & Generate ZKP
          </h3>
          <span className="badge-protected flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Zero-Knowledge Preserved
          </span>
        </div>
        <p className="text-xs text-muted mb-8">
          The fields marked <span className="font-semibold text-secondary">[PRIVATE]</span> are used to generate the Groth16 mathematical witness and are stripped prior to submitting the claim to the insurer.
        </p>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmitClaim} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold text-dark mb-2">
                Patient Name
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => setPatientName(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-brandBorder bg-white text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark mb-2">
                Policy ID
              </label>
              <input
                type="text"
                value={policyId}
                onChange={(e) => setPolicyId(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-brandBorder bg-white text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark mb-2 flex items-center justify-between">
                <span>Treatment / Procedure</span>
                <span className="text-[11px] text-secondary font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> [Private Signal]
                </span>
              </label>
              <input
                type="text"
                value={treatment}
                onChange={(e) => setTreatment(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-brandBorder bg-white text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark mb-2">
                Claim Amount (₹)
              </label>
              <input
                type="number"
                min="1"
                value={claimAmount}
                onChange={(e) => setClaimAmount(Number(e.target.value))}
                required
                className="w-full px-4 py-3 rounded-xl border border-brandBorder bg-white text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark mb-2 flex items-center justify-between">
                <span>Diagnosis Details</span>
                <span className="text-[11px] text-secondary font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> [Private Signal]
                </span>
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-brandBorder bg-white text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-dark mb-2 flex items-center justify-between">
                <span>Prescriptions & Medications</span>
                <span className="text-[11px] text-secondary font-semibold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> [Private Signal]
                </span>
              </label>
              <input
                type="text"
                value={prescriptions}
                onChange={(e) => setPrescriptions(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-xl border border-brandBorder bg-white text-sm focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-8 py-3.5 rounded-xl bg-roleHospital hover:bg-teal-800 text-white font-bold text-sm shadow-sm transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Cpu className="w-4 h-4 animate-spin" />
                  Generating Groth16 Proof...
                </>
              ) : (
                <>
                  Generate ZKP & Submit Claim
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* Live ZKP Generation Telemetry Feedback */}
        {zkpFeedback && (
          <div className="mt-8 p-6 rounded-2xl bg-teal-50/60 border border-teal-200 space-y-4">
            <div className="flex items-center gap-2 text-roleHospital font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Groth16 Zero-Knowledge Proof Generated Successfully!</span>
            </div>

            <p className="text-xs text-slate-700">
              Claim ID: <span className="font-mono font-bold">{zkpFeedback.claim_id}</span> • Nullifier:{" "}
              <span className="font-mono text-[11px]">
                {zkpFeedback.claim_nullifier.slice(0, 20)}...
              </span>
            </p>

            <div className="p-3 bg-white rounded-xl border border-teal-100 text-xs font-mono text-slate-600 overflow-x-auto">
              <p className="text-roleHospital font-bold mb-1">
                Groth16 Proof Elements (pi_a, pi_b, pi_c):
              </p>
              <pre className="text-[11px] leading-tight">
                {JSON.stringify(zkpFeedback.proof, null, 2)}
              </pre>
            </div>

            <div className="p-3 rounded-xl bg-emerald-100/60 text-emerald-900 text-xs flex items-center gap-2 font-medium">
              <Shield className="w-4 h-4 text-emerald-700 flex-shrink-0" />
              <span>{zkpFeedback.privacy_notice}</span>
            </div>
          </div>
        )}
      </div>

      {/* Hospital Claim History */}
      <div className="p-8 rounded-2xl bg-white border border-brandBorder shadow-sm">
        <h3 className="text-lg font-bold text-dark mb-4">Hospital Claim History</h3>
        {claims.length === 0 ? (
          <p className="text-sm text-muted">No claims created yet.</p>
        ) : (
          <div className="divide-y divide-brandBorder">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <h4 className="text-sm font-bold text-dark">
                    Claim #{claim.id}
                  </h4>
                  <p className="text-xs text-muted">
                    Amount: ₹{claim.claim_amount.toLocaleString("en-IN")} • Status:{" "}
                    <span className="font-semibold text-textMain">{claim.status}</span>
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Nullifier: {claim.claim_nullifier.slice(0, 24)}...
                  </p>
                </div>

                <div>
                  <span
                    className={
                      claim.status === "Settled"
                        ? "badge-settled"
                        : claim.status === "Approved"
                        ? "badge-verified"
                        : "badge-pending"
                    }
                  >
                    {claim.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
