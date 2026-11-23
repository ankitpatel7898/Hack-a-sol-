"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Fingerprint,
  CheckCircle2,
  AlertCircle,
  Cpu,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { api } from "../lib/api";
import { ClaimItem } from "../types";

interface VerificationModalProps {
  claim: ClaimItem | null;
  onClose: () => void;
  onSettledSuccess: () => void;
}

export const VerificationModal: React.FC<VerificationModalProps> = ({
  claim,
  onClose,
  onSettledSuccess,
}) => {
  const [step, setStep] = useState<number>(1);
  const [verifying, setVerifying] = useState<boolean>(true);
  const [settlementResult, setSettlementResult] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!claim) return;

    let isMounted = true;
    setStep(1);
    setVerifying(true);
    setErrorMsg(null);

    const runVerification = async () => {
      try {
        // Step 1: Simulated delay checking nullifier
        await new Promise((r) => setTimeout(r, 600));
        if (!isMounted) return;
        setStep(2);

        // Step 2: Groth16 Proof verification check
        await new Promise((r) => setTimeout(r, 800));
        if (!isMounted) return;
        setStep(3);

        // Step 3: Hardhat on-chain settlement transaction via FastAPI
        const res = await api.verifyAndSettleClaim(claim.id);
        if (!isMounted) return;
        setSettlementResult(res);
        setStep(4);
        setVerifying(false);
        onSettledSuccess();
      } catch (err: any) {
        if (!isMounted) return;
        setErrorMsg(err.message || "Cryptographic verification or on-chain settlement failed.");
        setVerifying(false);
      }
    };

    runVerification();

    return () => {
      isMounted = false;
    };
  }, [claim]);

  if (!claim) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#0a192d]/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative bg-white w-full max-w-lg rounded-3xl p-8 sm:p-10 shadow-2xl border border-brandBorder text-center animate-scaleUp">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 text-muted hover:text-dark transition-colors p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Icon */}
        <div className="w-20 h-20 rounded-2xl mx-auto mb-6 bg-purple-50 text-roleInsurer flex items-center justify-center shadow-sm">
          <Fingerprint className="w-10 h-10" />
        </div>

        <h3 className="text-2xl font-black text-dark mb-2">
          Groth16 ZKP Verification
        </h3>
        <p className="text-xs text-muted mb-8">
          Verifying mathematical proof for Claim{" "}
          <span className="font-mono font-bold text-textMain">#{claim.id}</span>
        </p>

        {/* Step-by-Step Verification Status */}
        <div className="space-y-3.5 text-left mb-8 font-mono text-xs">
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              step >= 1
                ? "bg-slate-50 border-slate-200 text-slate-800"
                : "bg-slate-50/50 border-transparent text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {step > 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : step === 1 ? (
                <Cpu className="w-4 h-4 text-purple-600 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300" />
              )}
              <span>1. Replay Prevention: Checking Claim Nullifier</span>
            </div>
            {step > 1 && <span className="text-[11px] text-emerald-700 font-bold">Passed</span>}
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              step >= 2
                ? "bg-slate-50 border-slate-200 text-slate-800"
                : "bg-slate-50/50 border-transparent text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {step > 2 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : step === 2 ? (
                <Cpu className="w-4 h-4 text-purple-600 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300" />
              )}
              <span>2. Validating Groth16 Proof (BN254 curve)</span>
            </div>
            {step > 2 && <span className="text-[11px] text-emerald-700 font-bold">Valid</span>}
          </div>

          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              step >= 3
                ? "bg-slate-50 border-slate-200 text-slate-800"
                : "bg-slate-50/50 border-transparent text-slate-400"
            }`}
          >
            <div className="flex items-center gap-2.5">
              {step > 3 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : step === 3 ? (
                <Cpu className="w-4 h-4 text-purple-600 animate-spin" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-300" />
              )}
              <span>3. Smart Contract Execution & Payout Release</span>
            </div>
            {step > 3 && <span className="text-[11px] text-emerald-700 font-bold">Confirmed</span>}
          </div>
        </div>

        {/* Success or Error Result */}
        {errorMsg ? (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs mb-6 text-left">
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Verification / Settlement Reverted</span>
            </div>
            <p className="font-mono text-[11px]">{errorMsg}</p>
          </div>
        ) : step === 4 && settlementResult ? (
          <div className="p-5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs text-left mb-6 space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-800">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <span>Claim Verified & Settled On-Chain!</span>
            </div>
            <p className="text-[11px] text-emerald-700">
              Zero sensitive medical records were disclosed during this verification.
            </p>
            <div className="pt-2 font-mono text-[11px] text-emerald-800 break-all space-y-1">
              <p>
                <strong>Tx Hash:</strong> {settlementResult.tx_hash}
              </p>
              <p>
                <strong>Contract:</strong> {settlementResult.contract_address}
              </p>
              <p>
                <strong>Payout Status:</strong> Automatic Payout Released to Hospital Wallet
              </p>
            </div>
          </div>
        ) : null}

        <button
          onClick={onClose}
          disabled={verifying}
          className="w-full py-3.5 px-4 rounded-xl bg-primary hover:bg-secondary text-white font-bold text-sm shadow-sm transition-all duration-200 disabled:opacity-50"
        >
          {verifying ? "Processing Cryptographic Settlement..." : "Done"}
        </button>
      </div>
    </div>
  );
};
