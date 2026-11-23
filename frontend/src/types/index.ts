export interface PatientProfile {
  id: string;
  name: string;
  wallet_address: string;
  policy_id: string;
  policy_commitment: string;
  created_at: string;
}

export interface MedicalRecord {
  id: string;
  title: string;
  encrypted_preview: string;
  iv: string;
  auth_tag: string;
  sha256_record_hash: string;
  status: string;
  created_at: string;
}

export interface PermissionState {
  id: string;
  patient_id: string;
  hospital_id: string;
  is_granted: boolean;
  tx_hash: string | null;
  updated_at: string;
}

export interface Groth16Proof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: string;
  curve: string;
}

export interface ClaimItem {
  id: string;
  patient_id: string;
  hospital_id: string;
  claim_amount: number;
  policy_commitment: string;
  claim_nullifier: string;
  approved_hospital_root: string;
  status: "Pending" | "Verified" | "Approved" | "Settled" | "Rejected";
  settlement_tx_hash: string | null;
  created_at: string;
  proof_json: Groth16Proof;
  public_signals: string[];
  diagnosis?: string;
  procedure_code?: string;
  prescriptions?: string;
}

export interface AuditLog {
  id: string;
  actor_role: string;
  action: string;
  details: Record<string, any>;
  tx_hash: string | null;
  created_at: string;
}

export interface SystemStatus {
  status: string;
  blockchain_connected: boolean;
  rpc_url: string;
  contract_address: string;
  database: string;
  zkp_prover: string;
}

export type UserRole = "patient" | "hospital" | "insurer";

export interface UserProfilePII {
  email_plain?: string;
  date_of_birth?: string;
  policy_id?: string;
  emergency_contact?: string;
  health_issues?: string;
  mac_address?: string;
  hospital_license?: string;
  department?: string;
  insurer_code?: string;
  company_name?: string;
  terminal_mac?: string;
  phone?: string;
  age?: number;
  sex?: string;
  [key: string]: any;
}

export interface AuthUser {
  id: string;
  role: UserRole;
  name: string;
  email: string;
  masked_email: string;
  wallet_address?: string;
  profile_pii?: UserProfilePII;
}

export interface LoginCredentials {
  email: string;
  password: string;
  role?: UserRole;
  remember_me?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  wallet_address?: string;
  date_of_birth?: string;
  policy_id?: string;
  emergency_contact?: string;
  health_issues?: string;
  mac_address?: string;
  hospital_license?: string;
  department?: string;
  insurer_code?: string;
  company_name?: string;
  age?: number;
  sex?: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}
