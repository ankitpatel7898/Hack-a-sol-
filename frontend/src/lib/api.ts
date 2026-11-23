import {
  PatientProfile,
  MedicalRecord,
  PermissionState,
  ClaimItem,
  AuditLog,
  SystemStatus,
} from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8001";

export async function fetchJson<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorMsg = `HTTP Error ${res.status}`;
      try {
        const errorData = await res.json();
        const detail = errorData.detail ?? errorData.message;
        if (detail) {
          if (typeof detail === "string") {
            errorMsg = detail;
          } else if (Array.isArray(detail)) {
            errorMsg = detail
              .map((d: any) => {
                if (typeof d === "string") return d;
                const field = Array.isArray(d?.loc) ? d.loc.slice(-1)[0] : "";
                const m = d?.msg || d?.message || JSON.stringify(d);
                return field ? `${field}: ${m}` : m;
              })
              .join("; ");
          } else if (typeof detail === "object") {
            errorMsg = detail.msg || detail.message || JSON.stringify(detail);
          }
        }
      } catch (e) {
        // ignore json parse error
      }
      throw new Error(errorMsg);
    }

    return (await res.json()) as T;
  } catch (err: any) {
    console.error(`API Request Failed [${endpoint}]:`, err.message);
    throw err;
  }
}

export const api = {
  getSystemStatus: async (): Promise<SystemStatus> => {
    return fetchJson<SystemStatus>("/api/system/status");
  },

  getPatientDashboard: async (patientId: string = "pat_rahul_sharma_001"): Promise<{
    patient: PatientProfile;
    stats: { records_count: number; claims_count: number; approved_count: number };
    records: MedicalRecord[];
    permission: PermissionState;
    claims: ClaimItem[];
    audit_trail: AuditLog[];
  }> => {
    return fetchJson(`/api/patient/${patientId}/dashboard`);
  },

  updatePermission: async (
    patientId: string,
    hospitalId: string,
    isGranted: boolean
  ): Promise<{
    success: boolean;
    permission: PermissionState;
    blockchain_telemetry: any;
  }> => {
    return fetchJson("/api/patient/permissions", {
      method: "POST",
      body: JSON.stringify({
        patient_id: patientId,
        hospital_id: hospitalId,
        is_granted: isGranted,
      }),
    });
  },

  getHospitalClaims: async (): Promise<{
    total: number;
    pending: number;
    claims: ClaimItem[];
  }> => {
    return fetchJson("/api/hospital/claims");
  },

  createHospitalClaim: async (data: {
    patient_name: string;
    patient_id?: string;
    policy_id: string;
    treatment: string;
    diagnosis?: string;
    procedure_code?: number;
    prescriptions?: string;
    claim_amount: number;
    hospital_id?: string;
  }): Promise<{
    success: boolean;
    claim_id: string;
    status: string;
    proof: any;
    public_signals: string[];
    claim_nullifier: string;
    policy_commitment: string;
    approved_hospital_root: string;
    encrypted_record_hash: string;
    privacy_notice: string;
  }> => {
    return fetchJson("/api/hospital/claims/generate-proof", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getInsurerClaims: async (): Promise<{
    stats: { total: number; pending: number; approved: number };
    claims: ClaimItem[];
  }> => {
    return fetchJson("/api/insurer/claims");
  },

  verifyAndSettleClaim: async (
    claimId: string
  ): Promise<{
    success: boolean;
    claim_id: string;
    status: string;
    proof_valid: boolean;
    replay_protected: boolean;
    tx_hash: string;
    contract_address: string;
    payout_released: boolean;
    settled_at: string;
    cryptographic_telemetry: any;
  }> => {
    return fetchJson(`/api/insurer/claims/${claimId}/verify-and-settle`, {
      method: "POST",
    });
  },

  getAuditTrail: async (): Promise<AuditLog[]> => {
    return fetchJson<AuditLog[]>("/api/audit");
  },

  // Multi-Page Real-Time Endpoints
  getPatientFullVault: async (patientId: string = "pat_rahul_sharma_001"): Promise<{
    patient: any;
    records: any[];
    claims: any[];
    doctor_visits: any[];
    prescriptions: any[];
    login_audits: any[];
    total_coverage: number;
    remaining_balance: number;
  }> => {
    return fetchJson(`/api/patient/${patientId}/full-vault`);
  },

  toggleDoctorAccess: async (visitId: string): Promise<{
    success: boolean;
    visit_id: string;
    is_access_granted: boolean;
  }> => {
    return fetchJson(`/api/patient/doctors/${visitId}/toggle-access`, {
      method: "POST",
    });
  },

  revokeOtherSessions: async (patientId: string): Promise<{
    success: boolean;
    revoked_count: number;
    message: string;
  }> => {
    return fetchJson("/api/patient/sessions/revoke-others", {
      method: "POST",
      body: JSON.stringify({ patient_id: patientId }),
    });
  },

  getHospitalPatientQueue: async (): Promise<{
    hospital_name: string;
    hospital_id: string;
    patients: any[];
  }> => {
    return fetchJson("/api/hospital/patient-queue");
  },

  passHospitalClaimToInsurer: async (data: {
    patient_id: string;
    patient_name: string;
    policy_id: string;
    patient_phone: string;
    assisting_doctor: string;
    detailed_medical_history: string;
    clinical_diagnosis: string;
    itemized_bill_json: string;
    health_subcategory: string;
    claimed_amount: number;
    terms_and_conditions_text: string;
    is_within_terms: boolean;
  }): Promise<{
    success: boolean;
    claim: any;
    message: string;
  }> => {
    return fetchJson("/api/hospital/claims/pass-to-insurer", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },

  getInsurerClaimsMetrics: async (): Promise<{
    metrics: {
      asked: number;
      approved: number;
      passed: number;
      rejected: number;
      total: number;
    };
  }> => {
    return fetchJson("/api/insurer/claims/metrics");
  },

  getInsurerClaimsFiltered: async (status: string = "ASKED"): Promise<{
    status: string;
    count: number;
    claims: any[];
  }> => {
    return fetchJson(`/api/insurer/claims/filtered?status=${encodeURIComponent(status)}`);
  },

  approveInsurerClaim: async (claimId: string): Promise<{
    success: boolean;
    claim: any;
    message: string;
  }> => {
    return fetchJson(`/api/insurer/claims/${claimId}/approve`, {
      method: "POST",
    });
  },

  settleInsurerClaimOnchain: async (claimId: string): Promise<{
    success: boolean;
    claim: any;
    tx_hash: string;
    message: string;
  }> => {
    return fetchJson(`/api/insurer/claims/${claimId}/settle-onchain`, {
      method: "POST",
    });
  },

  rejectInsurerClaim: async (claimId: string, reason: string = "Documentation incomplete"): Promise<{
    success: boolean;
    claim: any;
    message: string;
  }> => {
    return fetchJson(`/api/insurer/claims/${claimId}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  },
};
