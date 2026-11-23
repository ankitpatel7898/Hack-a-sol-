"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  FileCheck2,
  CheckCircle2,
  Lock,
  ExternalLink,
  Shield,
  Clock,
  History,
  Copy,
  Check,
} from "lucide-react";
import { api } from "../lib/api";
import { MedicalRecord, PermissionState, ClaimItem, AuditLog } from "../types";

export const PatientDashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState(false);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [permission, setPermission] = useState<PermissionState | null>(null);
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [auditTrail, setAuditTrail] = useState<AuditLog[]>([]);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const data = await api.getPatientDashboard("pat_rahul_sharma_001");
      setRecords(data.records || []);
      setPermission(data.permission);
      setClaims(data.claims || []);
      setAuditTrail(data.audit_trail || []);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleToggle = async (checked: boolean) => {
    try {
      setToggleLoading(true);
      const res = await api.updatePermission(
        "pat_rahul_sharma_001",
        "Apollo Hospital Delhi",
        checked
      );
      setPermission(res.permission);
      fetchDashboard();
    } catch (err: any) {
      alert("Failed to update hospital permission: " + err.message);
    } finally {
      setToggleLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const approvedClaims = claims.filter(
    (c) => c.status === "Approved" || c.status === "Settled"
  ).length;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Patient Header Banner */}
      <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-extrabold tracking-wider text-rolePatient bg-blue-50 px-3 py-1 rounded-full">
            Verified Identity
          </span>
          <h3 className="text-2xl font-extrabold text-dark mt-2">Rahul Sharma</h3>
          <p className="text-xs sm:text-sm text-muted">
            Policy ID:{" "}
            <span className="font-mono text-textMain font-semibold">POL-IND-882190</span> •
            Wallet:{" "}
            <span className="font-mono text-textMain font-semibold">
              0x7099...79C8
            </span>
          </p>
        </div>

        <div className="flex flex-col items-start md:items-end">
          <span className="text-[11px] text-muted font-medium">On-Chain Policy Commitment</span>
          <div className="flex items-center gap-1.5 mt-1 font-mono text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 max-w-xs truncate">
            <span>0x2b4c...22b7</span>
            <button
              onClick={() =>
                copyToClipboard(
                  "0x2b4c1069812df936082ecbc58169192496738c8cbe39049a46452f190e3f22b7"
                )
              }
              className="text-muted hover:text-dark ml-1"
            >
              {copiedHash?.includes("2b4c") ? (
                <Check className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-rolePatient flex items-center justify-center">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-dark">
              {loading ? "..." : String(records.length).padStart(2, "0")}
            </h4>
            <p className="text-xs font-semibold text-muted">Medical Records (AES-256)</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <FileCheck2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-dark">
              {loading ? "..." : claims.length}
            </h4>
            <p className="text-xs font-semibold text-muted">Total Insurance Claims</p>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-white border border-brandBorder shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-2xl font-black text-dark">
              {loading ? "..." : approvedClaims}
            </h4>
            <p className="text-xs font-semibold text-muted">Settled Claims</p>
          </div>
        </div>
      </div>

      {/* My Medical Records Panel */}
      <div className="p-8 rounded-2xl bg-white border border-brandBorder shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-dark">My Encrypted Medical Records</h3>
            <p className="text-xs text-muted">
              Payloads are AES-256-GCM encrypted off-chain. Only cryptographic SHA-256 integrity hashes are anchored on-chain.
            </p>
          </div>
          <span className="badge-protected flex items-center gap-1">
            <Shield className="w-3 h-3" />
            AES-256-GCM
          </span>
        </div>

        <div className="space-y-4">
          {records.map((rec) => (
            <div
              key={rec.id}
              className="p-5 rounded-xl border border-brandBorder bg-slate-50/50 hover:bg-slate-50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-rolePatient flex items-center justify-center flex-shrink-0 mt-0.5">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-dark">{rec.title}</h4>
                    <span className="badge-protected">Protected</span>
                  </div>
                  <p className="text-xs text-muted mt-0.5 font-mono">
                    Ciphertext: {rec.encrypted_preview}
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono mt-1">
                    SHA-256 Hash: {rec.sha256_record_hash}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => copyToClipboard(rec.sha256_record_hash)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 flex items-center gap-1.5"
                >
                  {copiedHash === rec.sha256_record_hash ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied Hash</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Proof</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Data Access Permission Panel */}
      <div className="p-8 rounded-2xl bg-white border border-brandBorder shadow-sm">
        <h3 className="text-lg font-bold text-dark mb-1">
          Hospital Data Access Permission
        </h3>
        <p className="text-xs text-muted mb-6">
          Grant or revoke Apollo Hospital Delhi permission to decrypt treatment history. Every toggle update is recorded on-chain.
        </p>

        <div className="flex items-center justify-between p-5 rounded-xl bg-slate-50 border border-brandBorder mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                permission?.is_granted ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
              }`}
            />
            <div>
              <p className="text-sm font-bold text-dark">
                Apollo Hospital Delhi Access
              </p>
              <p className="text-xs text-muted">
                {permission?.is_granted
                  ? "Access permission is active. Hospital can create treatment claims."
                  : "Access permission is disabled. Hospital cannot access records."}
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={permission?.is_granted || false}
              disabled={toggleLoading}
              onChange={(e) => handleToggle(e.target.checked)}
            />
            <div className="w-12 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-secondary"></div>
          </label>
        </div>

        {permission?.tx_hash && (
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-700 bg-emerald-50 border border-emerald-200/60 p-3 rounded-xl">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>On-Chain Permission Event Recorded:</span>
            <span className="font-semibold">{permission.tx_hash}</span>
          </div>
        )}
      </div>

      {/* My Insurance Claims */}
      <div className="p-8 rounded-2xl bg-white border border-brandBorder shadow-sm">
        <h3 className="text-lg font-bold text-dark mb-4">My Insurance Claims</h3>
        {claims.length === 0 ? (
          <p className="text-sm text-muted">No insurance claims filed yet.</p>
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
                    Amount:{" "}
                    <span className="font-semibold text-textMain">
                      ₹{claim.claim_amount.toLocaleString("en-IN")}
                    </span>{" "}
                    • Nullifier:{" "}
                    <span className="font-mono text-[11px]">
                      {claim.claim_nullifier.slice(0, 16)}...
                    </span>
                  </p>
                  {claim.settlement_tx_hash && (
                    <p className="text-[11px] text-emerald-600 font-mono mt-0.5">
                      Settlement Tx: {claim.settlement_tx_hash}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
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

      {/* Immutable Audit Trail */}
      <div className="p-8 rounded-2xl bg-white border border-brandBorder shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <History className="w-5 h-5 text-secondary" />
          <h3 className="text-lg font-bold text-dark">Immutable Audit Trail</h3>
        </div>
        <p className="text-xs text-muted mb-6">
          Verifiable ledger of all authorization, claim submission, and settlement events.
        </p>

        <div className="space-y-3 font-mono text-xs">
          {auditTrail.map((log) => (
            <div
              key={log.id}
              className="p-3.5 rounded-xl bg-slate-50 border border-brandBorder flex flex-col md:flex-row md:items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5">
                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-800 text-[10px] font-bold">
                  {log.actor_role}
                </span>
                <span className="font-semibold text-dark">{log.action}</span>
              </div>
              <div className="text-[11px] text-muted flex items-center gap-3">
                {log.tx_hash && (
                  <span className="text-emerald-700 truncate max-w-xs">
                    Tx: {log.tx_hash.slice(0, 18)}...
                  </span>
                )}
                <span>{new Date(log.created_at).toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
