-- HealthGuard Database Schema (Supabase PostgreSQL Migration)
-- Privacy-Preserving Healthcare Records & Zero-Knowledge Proof Insurance Claims

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id TEXT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    wallet_address VARCHAR(42) NOT NULL,
    policy_id VARCHAR(64) NOT NULL UNIQUE,
    policy_commitment TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Medical Records Table (Encrypted off-chain storage)
-- Sensitive medical fields (diagnosis, procedure, medications, clinical notes) are encrypted via AES-256-GCM
CREATE TABLE IF NOT EXISTS medical_records (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    encrypted_payload_b64 TEXT NOT NULL,
    iv_b64 VARCHAR(64) NOT NULL,
    auth_tag_b64 VARCHAR(64) NOT NULL,
    sha256_record_hash VARCHAR(66) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Permissions Table (Patient-controlled granular access)
CREATE TABLE IF NOT EXISTS permissions (
    id TEXT PRIMARY KEY,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id VARCHAR(100) NOT NULL,
    is_granted BOOLEAN DEFAULT FALSE,
    tx_hash VARCHAR(66),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_patient_hospital UNIQUE(patient_id, hospital_id)
);

-- 4. Claims Table (Anchors ZKP signals and Groth16 proofs without raw medical data)
CREATE TABLE IF NOT EXISTS claims (
    id TEXT PRIMARY KEY,
    claim_nullifier VARCHAR(78) NOT NULL UNIQUE,
    patient_id TEXT NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    hospital_id VARCHAR(100) NOT NULL,
    claim_amount NUMERIC(14, 2) NOT NULL,
    policy_commitment VARCHAR(78) NOT NULL,
    approved_hospital_root VARCHAR(78) NOT NULL,
    proof_json JSONB NOT NULL,
    public_signals_json JSONB NOT NULL,
    status VARCHAR(30) DEFAULT 'Pending', -- Pending, Verified, Approved, Settled, Rejected
    settlement_tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Trail Table (Immutable ledger of all actions and on-chain tx references)
CREATE TABLE IF NOT EXISTS audit_trail (
    id TEXT PRIMARY KEY,
    actor_role VARCHAR(50) NOT NULL, -- Patient, Hospital, Insurer, System, SmartContract
    action VARCHAR(100) NOT NULL,
    details JSONB NOT NULL,
    tx_hash VARCHAR(66),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performant lookup
CREATE INDEX IF NOT EXISTS idx_records_patient ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_permissions_patient_hospital ON permissions(patient_id, hospital_id);
CREATE INDEX IF NOT EXISTS idx_claims_nullifier ON claims(claim_nullifier);
CREATE INDEX IF NOT EXISTS idx_claims_patient ON claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_trail(created_at DESC);

-- Initial Mock Data Seeding (Matches the prototype experience)
INSERT INTO patients (id, name, wallet_address, policy_id, policy_commitment)
VALUES (
    'pat_rahul_sharma_001',
    'Rahul Sharma',
    '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
    'POL-IND-882190',
    '0x2b4c1069812df936082ecbc58169192496738c8cbe39049a46452f190e3f22b7'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO permissions (id, patient_id, hospital_id, is_granted, tx_hash)
VALUES (
    'perm_001',
    'pat_rahul_sharma_001',
    'Apollo Hospital Delhi',
    FALSE,
    NULL
) ON CONFLICT (patient_id, hospital_id) DO NOTHING;
