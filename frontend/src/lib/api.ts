import {
  PatientProfile,
  MedicalRecord,
  PermissionState,
  ClaimItem,
  AuditLog,
  SystemStatus,
} from "../types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

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
        if (errorData.detail) {
          errorMsg = errorData.detail;
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
};
