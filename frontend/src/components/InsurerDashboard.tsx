"use client";

import React, { useState, useEffect } from "react";
import {
  Shield,
  FileCheck2,
  Clock,
  CheckCircle2,
  Lock,
  Fingerprint,
  Cpu,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import { api } from "../lib/api";
import { ClaimItem } from "../types";
import { VerificationModal } from "./VerificationModal";

export const InsurerDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [selectedClaim, setSelectedClaim] = useState<ClaimItem | null>(null);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0 });

  const fetchInsurerClaims = async () => {
    try {
      setLoading(true);
      const data = await api.getInsurerClaims();
      setClaims(data.claims || []);
      setStats(data.stats || { total: 0, pending: 0, approved: 0 });
    } catch (err: any) {
      console.error("Failed to fetch insurer claims:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsurerClaims();
  }, []);

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Insurer Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-roleInsurer flex items-center justify-center font-bold">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-2xl font-extrabold text-dark">
              HealthGuard Assurance
            </h3>
            <p className="text-xs text-muted">
              Zero-Knowledge Verification Engine • Alt_bn128 Pairing Contract
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="tag-badge bg-purple-50 text-roleInsurer">
            Smart Contract Settlement
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-roleInsurer flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-dark">
              {loading ? "..." : stats.total}
            </h4>
            <p className="text-xs font-semibold text-muted">Total Submitted Claims</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-dark">
              {loading ? "..." : stats.pending}
            </h4>
            <p className="text-xs font-semibold text-muted">Awaiting ZKP Verification</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-dark">
              {loading ? "..." : stats.approved}
            </h4>
            <p className="text-xs font-semibold text-muted">On-Chain Settled</p>
          </div>
        </div>
      </div>

      {/* Claims Verification Table / List */}
      <div className="p-8 rounded-2xl bg-white border border-brandBorder shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-bold text-dark">
            Insurance Claim Verification & Settlement
          </h3>
          <span className="badge-protected flex items-center gap-1">
            <Lock className="w-3 h-3" />
            100% Medical Data Redacted
          </span>
        </div>
        <p className="text-xs text-muted mb-8">
          The insurer only receives public ZKP cryptographic commitments and proofs. Private diagnosis, clinical procedures, and prescriptions are mathematically hidden.
        </p>

        {claims.length === 0 ? (
          <p className="text-sm text-muted">No claims available for verification.</p>
        ) : (
          <div className="space-y-4">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="p-6 rounded-2xl border border-brandBorder bg-slate-50/50 hover:bg-slate-50 transition-all space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brandBorder pb-4">
                  <div>
                    <span className="text-xs font-mono font-bold text-dark">
                      Claim ID: #{claim.id}
                    </span>
                    <span className="text-xs text-muted ml-3">
                      Hospital: <strong className="text-textMain">{claim.hospital_id}</strong>
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
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
                    <span className="text-sm font-extrabold text-dark">
                      ₹{claim.claim_amount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {/* Zero-Knowledge Privacy Demonstration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[11px] text-muted font-semibold block mb-1">
                      Diagnosis (ICD-10)
                    </span>
                    <span className="badge-redacted">REDACTED BY ZKP</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[11px] text-muted font-semibold block mb-1">
                      Procedure Code
                    </span>
                    <span className="badge-redacted">REDACTED BY ZKP</span>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200/80">
                    <span className="text-[11px] text-muted font-semibold block mb-1">
                      Prescription Items
                    </span>
                    <span className="badge-redacted">REDACTED BY ZKP</span>
                  </div>
                </div>

                {/* Public Cryptographic Signals */}
                <div className="p-3.5 rounded-xl bg-purple-50/50 border border-purple-100 font-mono text-[11px] text-slate-700 space-y-1">
                  <p className="truncate">
                    <strong className="text-roleInsurer">Claim Nullifier (Anti-Replay):</strong>{" "}
                    {claim.claim_nullifier}
                  </p>
                  <p className="truncate">
                    <strong className="text-roleInsurer">Policy Commitment:</strong>{" "}
                    {claim.policy_commitment}
                  </p>
                  <p className="truncate">
                    <strong className="text-roleInsurer">Approved Hospital Root:</strong>{" "}
                    {claim.approved_hospital_root}
                  </p>
                  {claim.settlement_tx_hash && (
                    <p className="text-emerald-700 font-bold truncate pt-1">
                      Settlement Tx: {claim.settlement_tx_hash}
                    </p>
                  )}
                </div>

                {/* Action Controls */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  {claim.status === "Pending" && (
                    <button
                      onClick={() => setSelectedClaim(claim)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-roleInsurer hover:bg-purple-800 text-white font-bold text-xs shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                    >
                      <Fingerprint className="w-4 h-4" />
                      Verify ZKP & Settle On-Chain
                    </button>
                  )}

                  {claim.status === "Settled" && (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Settled On-Chain (Funds Released)</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Verification Modal */}
      {selectedClaim && (
        <VerificationModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
          onSettledSuccess={() => {
            fetchInsurerClaims();
          }}
        />
      )}
    </div>
  );
};
