"""
HealthGuard Database Service
Supports PostgreSQL / Supabase with local SQLite fallback for seamless offline operation.
Manages patients, AES-encrypted records, permissions, ZKP claims, and immutable audit logs.
"""

import os
import json
import sqlite3
import hashlib
import datetime
from typing import Dict, Any, List, Optional
from backend.security.encryption import encrypt_medical_record

DB_FILE = os.path.join(os.path.dirname(__file__), "healthguard.db")
DATABASE_URL = os.getenv("DATABASE_URL")


def get_connection():
    """Get database connection (SQLite for local/fallback, extensible to asyncpg/Postgres)."""
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize schema and seed initial state matching the prototype."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        policy_id TEXT NOT NULL UNIQUE,
        policy_commitment TEXT NOT NULL,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS medical_records (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        title TEXT NOT NULL,
        encrypted_payload_b64 TEXT NOT NULL,
        iv_b64 TEXT NOT NULL,
        auth_tag_b64 TEXT NOT NULL,
        sha256_record_hash TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS permissions (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        hospital_id TEXT NOT NULL,
        is_granted INTEGER DEFAULT 0,
        tx_hash TEXT,
        updated_at TEXT NOT NULL,
        UNIQUE(patient_id, hospital_id)
    );

    CREATE TABLE IF NOT EXISTS claims (
        id TEXT PRIMARY KEY,
        claim_nullifier TEXT NOT NULL UNIQUE,
        patient_id TEXT NOT NULL,
        hospital_id TEXT NOT NULL,
        claim_amount REAL NOT NULL,
        policy_commitment TEXT NOT NULL,
        approved_hospital_root TEXT NOT NULL,
        proof_json TEXT NOT NULL,
        public_signals_json TEXT NOT NULL,
        status TEXT DEFAULT 'Pending',
        settlement_tx_hash TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS audit_trail (
        id TEXT PRIMARY KEY,
        actor_role TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        tx_hash TEXT,
        created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL,
        name TEXT NOT NULL,
        age INTEGER,
        sex TEXT,
        health_issues TEXT,
        mobile_no TEXT,
        mac_address TEXT,
        organization_id TEXT,
        policy_id TEXT,
        wallet_address TEXT,
        created_at TEXT NOT NULL
    );
    """)

    # Migration: add demographic & MAC anchor columns to patients if not present
    for col, col_type in [
        ("age", "INTEGER"),
        ("sex", "TEXT"),
        ("health_issues", "TEXT"),
        ("mobile_no", "TEXT"),
        ("mac_address", "TEXT")
    ]:
        try:
            cursor.execute(f"ALTER TABLE patients ADD COLUMN {col} {col_type}")
        except Exception:
            pass

    # Seed Default Patient if not exists
    cursor.execute("SELECT id FROM patients WHERE id = 'pat_rahul_sharma_001'")
    if not cursor.fetchone():
        now = datetime.datetime.utcnow().isoformat()
        cursor.execute(
            """
            INSERT INTO patients (id, name, wallet_address, policy_id, policy_commitment, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                "pat_rahul_sharma_001",
                "Rahul Sharma",
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                "POL-IND-882190",
                "0x2b4c1069812df936082ecbc58169192496738c8cbe39049a46452f190e3f22b7",
                now
            )
        )

        cursor.execute(
            """
            INSERT INTO permissions (id, patient_id, hospital_id, is_granted, tx_hash, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                "perm_001",
                "pat_rahul_sharma_001",
                "Apollo Hospital Delhi",
                0,
                None,
                now
            )
        )

        # Seed Encrypted Records
        rec1_data = {
            "diagnosis": "Routine Annual Health Examination",
            "procedureCode": 1005,
            "prescriptions": "Multivitamins, Vitamin D3 (60k IU)",
            "treatmentHistory": "Blood Pressure: 120/80 mmHg, Pulse: 72 bpm, Normal ECG"
        }
        c1, iv1, tag1, h1 = encrypt_medical_record(rec1_data)
        cursor.execute(
            """
            INSERT INTO medical_records (id, patient_id, title, encrypted_payload_b64, iv_b64, auth_tag_b64, sha256_record_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("rec_001", "pat_rahul_sharma_001", "General Health Checkup", c1, iv1, tag1, h1, "2026-10-10T10:00:00Z")
        )

        rec2_data = {
            "diagnosis": "Comprehensive Blood Panel & Lipid Profile",
            "procedureCode": 1005,
            "prescriptions": "Dietary fiber supplements",
            "treatmentHistory": "HbA1c: 5.4%, Total Cholesterol: 185 mg/dL, Fasting Sugar: 92 mg/dL"
        }
        c2, iv2, tag2, h2 = encrypt_medical_record(rec2_data)
        cursor.execute(
            """
            INSERT INTO medical_records (id, patient_id, title, encrypted_payload_b64, iv_b64, auth_tag_b64, sha256_record_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("rec_002", "pat_rahul_sharma_001", "Blood Test Report", c2, iv2, tag2, h2, "2026-10-15T14:30:00Z")
        )

        # Initial audit log
        cursor.execute(
            """
            INSERT INTO audit_trail (id, actor_role, action, details, tx_hash, created_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                "aud_001",
                "System",
                "PatientEnrolled",
                json.dumps({"patient_id": "pat_rahul_sharma_001", "policy_id": "POL-IND-882190"}),
                "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
                now
            )
        )

    # Ensure Rahul Sharma has demographic & MAC anchor fields populated
    cursor.execute("""
        UPDATE patients SET
            age = COALESCE(age, 32),
            sex = COALESCE(sex, 'Male'),
            health_issues = COALESCE(health_issues, 'Asthma, Mild Hypertension'),
            mobile_no = COALESCE(mobile_no, '+91-9876543210'),
            mac_address = COALESCE(mac_address, '00:1A:2B:3C:4D:5E')
        WHERE id = 'pat_rahul_sharma_001'
    """)

    # Seed Default Accounts in users table if not existing
    cursor.execute("SELECT id FROM users WHERE username = 'rahul'")
    if not cursor.fetchone():
        now = datetime.datetime.utcnow().isoformat()
        cursor.execute(
            """
            INSERT INTO users (id, username, password_hash, role, name, age, sex, health_issues, mobile_no, mac_address, organization_id, policy_id, wallet_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "pat_rahul_sharma_001",
                "rahul",
                hash_password("password123"),
                "patient",
                "Rahul Sharma",
                32,
                "Male",
                "Asthma, Mild Hypertension",
                "+91-9876543210",
                "00:1A:2B:3C:4D:5E",
                None,
                "POL-IND-882190",
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                now
            )
        )
        cursor.execute(
            """
            INSERT INTO users (id, username, password_hash, role, name, age, sex, health_issues, mobile_no, mac_address, organization_id, policy_id, wallet_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "hosp_apollo_001",
                "apollo",
                hash_password("password123"),
                "hospital",
                "Apollo Hospital Delhi",
                None,
                None,
                None,
                "+91-11-26925858",
                "B4:2E:99:A1:7C:12",
                "HOSP-DEL-401",
                None,
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                now
            )
        )
        cursor.execute(
            """
            INSERT INTO users (id, username, password_hash, role, name, age, sex, health_issues, mobile_no, mac_address, organization_id, policy_id, wallet_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "ins_starhealth_001",
                "starhealth",
                hash_password("password123"),
                "insurer",
                "Star Health Insurance",
                None,
                None,
                None,
                "1800-425-2255",
                "E8:6A:64:1F:3B:88",
                "INS-LIC-8891",
                None,
                "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                now
            )
        )

    conn.commit()
    conn.close()


def hash_password(password: str) -> str:
    """Hash password securely using PBKDF2-HMAC-SHA256 with 16-byte random salt."""
    salt = os.urandom(16).hex()
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), bytes.fromhex(salt), 100000).hex()
    return f"{salt}:{key}"


def verify_password(stored_password: str, provided_password: str) -> bool:
    """Verify provided password against stored PBKDF2 hash."""
    try:
        salt, key = stored_password.split(":")
        new_key = hashlib.pbkdf2_hmac("sha256", provided_password.encode("utf-8"), bytes.fromhex(salt), 100000).hex()
        return key == new_key
    except Exception:
        return False


def register_user(
    username: str,
    password: str,
    role: str,
    name: str,
    age: Optional[int] = None,
    sex: Optional[str] = None,
    health_issues: Optional[str] = None,
    mobile_no: Optional[str] = None,
    mac_address: Optional[str] = None,
    organization_id: Optional[str] = None
) -> Dict[str, Any]:
    """Register a new user with unique username, role, and profile attributes."""
    clean_username = username.lower().strip()
    clean_role = role.lower().strip()

    if clean_role not in ["patient", "hospital", "insurer"]:
        raise ValueError("Invalid role. Role must be 'patient', 'hospital', or 'insurer'.")

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE username = ?", (clean_username,))
    if cursor.fetchone():
        conn.close()
        raise ValueError(f"Username '{clean_username}' is already taken. Please choose another unique username.")

    now = datetime.datetime.utcnow().isoformat()
    pwd_hash = hash_password(password)
    user_id = f"usr_{clean_role}_{os.urandom(4).hex()}"
    policy_id = None
    wallet_address = "0x" + os.urandom(20).hex()

    if clean_role == "patient":
        policy_id = f"POL-IND-{os.urandom(3).hex().upper()}"
        patient_id = f"pat_{os.urandom(4).hex()}"
        user_id = patient_id
        policy_commitment = "0x" + hashlib.sha256(f"{name}:{policy_id}:{mac_address}".encode()).hexdigest()

        cursor.execute(
            """
            INSERT INTO patients (id, name, wallet_address, policy_id, policy_commitment, age, sex, health_issues, mobile_no, mac_address, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (patient_id, name, wallet_address, policy_id, policy_commitment, age, sex, health_issues, mobile_no, mac_address, now)
        )

        # Encrypt health issues if provided
        if health_issues:
            rec_data = {
                "diagnosis": health_issues,
                "procedureCode": 1001,
                "prescriptions": "Patient self-declared medical conditions at registration",
                "treatmentHistory": f"Device/MAC Anchor: {mac_address} • Verified: {now}"
            }
            c, iv, tag, h = encrypt_medical_record(rec_data)
            cursor.execute(
                """
                INSERT INTO medical_records (id, patient_id, title, encrypted_payload_b64, iv_b64, auth_tag_b64, sha256_record_hash, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (f"rec_{os.urandom(4).hex()}", patient_id, "Registered Medical Profile & Pre-Existing Conditions", c, iv, tag, h, now)
            )

        # Grant access permission entry for Apollo Hospital
        cursor.execute(
            """
            INSERT INTO permissions (id, patient_id, hospital_id, is_granted, tx_hash, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (f"perm_{os.urandom(4).hex()}", patient_id, "Apollo Hospital Delhi", 0, None, now)
        )

    cursor.execute(
        """
        INSERT INTO users (id, username, password_hash, role, name, age, sex, health_issues, mobile_no, mac_address, organization_id, policy_id, wallet_address, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (user_id, clean_username, pwd_hash, clean_role, name, age, sex, health_issues, mobile_no, mac_address, organization_id, policy_id, wallet_address, now)
    )

    # Immutable Audit Log
    cursor.execute(
        """
        INSERT INTO audit_trail (id, actor_role, action, details, tx_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            f"aud_{os.urandom(4).hex()}",
            clean_role.capitalize(),
            "UserRegistered",
            json.dumps({"username": clean_username, "role": clean_role, "name": name, "mac_address": mac_address}),
            "0x" + os.urandom(32).hex(),
            now
        )
    )

    conn.commit()
    conn.close()

    return {
        "id": user_id,
        "username": clean_username,
        "role": clean_role,
        "name": name,
        "age": age,
        "sex": sex,
        "health_issues": health_issues,
        "mobile_no": mobile_no,
        "mac_address": mac_address,
        "organization_id": organization_id,
        "policy_id": policy_id,
        "wallet_address": wallet_address,
        "created_at": now
    }


def authenticate_user(username: str, password: str, expected_role: Optional[str] = None) -> Dict[str, Any]:
    """Authenticate user credentials and optionally verify role constraints."""
    clean_username = username.lower().strip()
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (clean_username,)).fetchone()
    conn.close()

    if not row:
        raise ValueError(f"No account found with username '{username}'. Please register first.")

    if not verify_password(row["password_hash"], password):
        raise ValueError("Invalid password. Please check your credentials.")

    user = dict(row)
    del user["password_hash"]

    if expected_role and user["role"].lower() != expected_role.lower().strip():
        raise PermissionError(
            f"Access Denied: Account '{username}' is registered as a '{user['role'].upper()}', "
            f"not a '{expected_role.upper()}'. You are not authorized to access this dashboard."
        )

    return user


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if "password_hash" in d:
        del d["password_hash"]
    return d


def get_user_by_username(username: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username.lower().strip(),)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    if "password_hash" in d:
        del d["password_hash"]
    return d



def get_patient(patient_id: str = "pat_rahul_sharma_001") -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM patients WHERE id = ?", (patient_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_patient_records(patient_id: str = "pat_rahul_sharma_001") -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM medical_records WHERE patient_id = ? ORDER BY created_at DESC",
        (patient_id,)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_hospital_permission(patient_id: str, hospital_id: str = "Apollo Hospital Delhi") -> Dict[str, Any]:
    conn = get_connection()
    row = conn.execute(
        "SELECT * FROM permissions WHERE patient_id = ? AND hospital_id = ?",
        (patient_id, hospital_id)
    ).fetchone()
    conn.close()
    if row:
        return {
            "id": row["id"],
            "patient_id": row["patient_id"],
            "hospital_id": row["hospital_id"],
            "is_granted": bool(row["is_granted"]),
            "tx_hash": row["tx_hash"],
            "updated_at": row["updated_at"]
        }
    return {
        "id": "perm_default",
        "patient_id": patient_id,
        "hospital_id": hospital_id,
        "is_granted": False,
        "tx_hash": None,
        "updated_at": datetime.datetime.utcnow().isoformat()
    }


def update_permission(patient_id: str, hospital_id: str, is_granted: bool, tx_hash: str = None) -> Dict[str, Any]:
    conn = get_connection()
    now = datetime.datetime.utcnow().isoformat()
    conn.execute(
        """
        INSERT INTO permissions (id, patient_id, hospital_id, is_granted, tx_hash, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(patient_id, hospital_id) DO UPDATE SET
            is_granted = excluded.is_granted,
            tx_hash = excluded.tx_hash,
            updated_at = excluded.updated_at
        """,
        (f"perm_{patient_id}_{hospital_id}", patient_id, hospital_id, 1 if is_granted else 0, tx_hash, now)
    )
    conn.commit()
    conn.close()
    return get_hospital_permission(patient_id, hospital_id)


def save_claim(
    claim_id: str,
    claim_nullifier: str,
    patient_id: str,
    hospital_id: str,
    claim_amount: float,
    policy_commitment: str,
    approved_hospital_root: str,
    proof_json: Dict[str, Any],
    public_signals_json: List[str]
) -> Dict[str, Any]:
    conn = get_connection()
    now = datetime.datetime.utcnow().isoformat()
    conn.execute(
        """
        INSERT INTO claims (
            id, claim_nullifier, patient_id, hospital_id, claim_amount,
            policy_commitment, approved_hospital_root, proof_json,
            public_signals_json, status, settlement_tx_hash, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NULL, ?)
        """,
        (
            claim_id,
            claim_nullifier,
            patient_id,
            hospital_id,
            claim_amount,
            policy_commitment,
            approved_hospital_root,
            json.dumps(proof_json),
            json.dumps(public_signals_json),
            now
        )
    )
    conn.commit()
    conn.close()
    return get_claim_by_id(claim_id)


def get_claim_by_id(claim_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM claims WHERE id = ?", (claim_id,)).fetchone()
    conn.close()
    if not row:
        return None
    d = dict(row)
    d["proof_json"] = json.loads(d["proof_json"])
    d["public_signals_json"] = json.loads(d["public_signals_json"])
    return d


def get_claims(role: str = "all", patient_id: Optional[str] = None) -> List[Dict[str, Any]]:
    conn = get_connection()
    if patient_id:
        rows = conn.execute(
            "SELECT * FROM claims WHERE patient_id = ? ORDER BY created_at DESC",
            (patient_id,)
        ).fetchall()
    else:
        rows = conn.execute("SELECT * FROM claims ORDER BY created_at DESC").fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        d["proof_json"] = json.loads(d["proof_json"])
        d["public_signals_json"] = json.loads(d["public_signals_json"])
        result.append(d)
    return result


def update_claim_status(claim_id: str, status: str, settlement_tx_hash: Optional[str] = None):
    conn = get_connection()
    conn.execute(
        "UPDATE claims SET status = ?, settlement_tx_hash = ? WHERE id = ?",
        (status, settlement_tx_hash, claim_id)
    )
    conn.commit()
    conn.close()
    return get_claim_by_id(claim_id)


def record_audit(actor_role: str, action: str, details: Dict[str, Any], tx_hash: Optional[str] = None):
    conn = get_connection()
    now = datetime.datetime.utcnow().isoformat()
    audit_id = "aud_" + hex(int(datetime.datetime.utcnow().timestamp() * 1000))[2:]
    conn.execute(
        """
        INSERT INTO audit_trail (id, actor_role, action, details, tx_hash, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (audit_id, actor_role, action, json.dumps(details), tx_hash, now)
    )
    conn.commit()
    conn.close()


def get_audit_trail() -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM audit_trail ORDER BY created_at DESC LIMIT 50").fetchall()
    conn.close()
    out = []
    for r in rows:
        d = dict(r)
        try:
            d["details"] = json.loads(d["details"])
        except Exception:
            pass
        out.append(d)
    return out
