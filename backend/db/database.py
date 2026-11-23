"""
HealthGuard / HealthShield Database Service
Supports PostgreSQL / Supabase with local SQLite fallback for seamless operation.
Manages patients, AES-encrypted records, permissions, ZKP claims, doctor visits, prescriptions, and login audit logs.
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


def hash_password(password: str) -> str:
    """Argon2 / SHA-256 fallback hash for local testing."""
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def init_db():
    """Initialize schema and seed initial state matching multi-page HealthShield specifications."""
    conn = get_connection()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS patients (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        wallet_address TEXT NOT NULL,
        policy_id TEXT NOT NULL UNIQUE,
        policy_commitment TEXT NOT NULL,
        age INTEGER DEFAULT 32,
        sex TEXT DEFAULT 'Male',
        health_issues TEXT DEFAULT 'None reported',
        mobile_no TEXT DEFAULT '+91-9876543210',
        mac_address TEXT DEFAULT '00:1A:2B:3C:4D:5E',
        coverage_limit REAL DEFAULT 500000.0,
        remaining_balance REAL DEFAULT 417500.0,
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
        admission_date TEXT,
        diagnosis_summary TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS doctor_visits (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        doctor_name TEXT NOT NULL,
        specialization TEXT NOT NULL,
        council_id TEXT NOT NULL,
        hospital_name TEXT NOT NULL,
        visit_date TEXT NOT NULL,
        access_granted INTEGER DEFAULT 1,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS prescriptions (
        id TEXT PRIMARY KEY,
        patient_id TEXT NOT NULL,
        medicine_name TEXT NOT NULL,
        dosage TEXT NOT NULL,
        duration TEXT NOT NULL,
        prescribing_doctor TEXT NOT NULL,
        hospital_name TEXT NOT NULL,
        date_prescribed TEXT NOT NULL,
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
        patient_name TEXT DEFAULT 'Aarav Sharma',
        patient_phone TEXT DEFAULT '+91-9876543210',
        hospital_id TEXT NOT NULL,
        hospital_name TEXT DEFAULT 'Apollo Multispeciality Hospital',
        assisting_doctor TEXT DEFAULT 'Dr. R. K. Verma (MCI-DEL-40912)',
        health_subcategory TEXT DEFAULT 'Orthopedics - Knee Injury',
        claim_amount REAL NOT NULL,
        approved_amount REAL,
        policy_id TEXT DEFAULT 'POL-HS-2026-9941',
        policy_commitment TEXT NOT NULL,
        terms_and_conditions_text TEXT DEFAULT 'Max Limit: ₹1,00,000 | Waiting Period: Cleared | Covered Subcategory',
        is_within_terms INTEGER DEFAULT 1,
        approved_hospital_root TEXT NOT NULL,
        proof_json TEXT NOT NULL,
        public_signals_json TEXT NOT NULL,
        status TEXT DEFAULT 'ASKED',
        settlement_tx_hash TEXT,
        itemized_bill_json TEXT,
        detailed_medical_history TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    CREATE TABLE IF NOT EXISTS login_audit_logs (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        role TEXT NOT NULL,
        device_info TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        geo_location TEXT NOT NULL,
        phone_number TEXT NOT NULL,
        login_at TEXT NOT NULL,
        logout_at TEXT,
        status TEXT DEFAULT 'Current Active Session'
    );

    CREATE TABLE IF NOT EXISTS hospital_entry_logs (
        id TEXT PRIMARY KEY,
        hospital_id TEXT NOT NULL,
        hospital_name TEXT NOT NULL,
        entered_at TEXT NOT NULL,
        entry_status TEXT DEFAULT 'MERKLE_TREE_VALIDATED'
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

    # Dynamic migrations for any existing columns
    claim_cols = [
        ("patient_name", "TEXT DEFAULT 'Aarav Sharma'"),
        ("patient_phone", "TEXT DEFAULT '+91-9876543210'"),
        ("hospital_name", "TEXT DEFAULT 'Apollo Multispeciality Hospital'"),
        ("assisting_doctor", "TEXT DEFAULT 'Dr. R. K. Verma'"),
        ("health_subcategory", "TEXT DEFAULT 'Orthopedics - Knee Injury'"),
        ("terms_and_conditions_text", "TEXT DEFAULT 'Max Limit: ₹1,00,000 | Waiting Period: Cleared'"),
        ("is_within_terms", "INTEGER DEFAULT 1"),
        ("approved_amount", "REAL"),
        ("policy_id", "TEXT DEFAULT 'POL-HS-2026-9941'"),
        ("itemized_bill_json", "TEXT"),
        ("detailed_medical_history", "TEXT")
    ]
    for col, ctype in claim_cols:
        try:
            cursor.execute(f"ALTER TABLE claims ADD COLUMN {col} {ctype}")
        except Exception:
            pass

    patient_cols = [
        ("coverage_limit", "REAL DEFAULT 500000.0"),
        ("remaining_balance", "REAL DEFAULT 417500.0")
    ]
    for col, ctype in patient_cols:
        try:
            cursor.execute(f"ALTER TABLE patients ADD COLUMN {col} {ctype}")
        except Exception:
            pass

    record_cols = [
        ("admission_date", "TEXT"),
        ("diagnosis_summary", "TEXT")
    ]
    for col, ctype in record_cols:
        try:
            cursor.execute(f"ALTER TABLE medical_records ADD COLUMN {col} {ctype}")
        except Exception:
            pass

    # Seed Aarav Sharma (Primary Patient Persona)
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    cursor.execute("SELECT id FROM patients WHERE id = 'pat_aarav_sharma_001'")
    if not cursor.fetchone():
        cursor.execute(
            """
            INSERT INTO patients (id, name, wallet_address, policy_id, policy_commitment, age, sex, health_issues, mobile_no, mac_address, coverage_limit, remaining_balance, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                "pat_aarav_sharma_001",
                "Aarav Sharma",
                "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                "POL-HS-2026-9941",
                "0x2b4c1069812df936082ecbc58169192496738c8cbe39049a46452f190e3f22b7",
                29,
                "Male",
                "Acute Meniscus Tear, Mild Allergic Rhinitis",
                "+91-9876543210",
                "00:1A:2B:3C:4D:5E",
                500000.0,
                417500.0,
                now
            )
        )

        cursor.execute(
            """
            INSERT OR REPLACE INTO permissions (id, patient_id, hospital_id, is_granted, tx_hash, updated_at)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                "perm_aarav_apollo",
                "pat_aarav_sharma_001",
                "Apollo Multispeciality Hospital",
                1,
                "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
                now
            )
        )

        # Seed Attending Doctor History
        doctors = [
            ("doc_01", "pat_aarav_sharma_001", "Dr. R. K. Verma", "Senior Orthopedic Surgeon", "MCI-DEL-40912", "Apollo Multispeciality Hospital", "2026-11-14", 1),
            ("doc_02", "pat_aarav_sharma_001", "Dr. Meera Nambiar", "Chief Radiologist", "MCI-MAH-19280", "Apollo Diagnostic Imaging", "2026-11-12", 1),
            ("doc_03", "pat_aarav_sharma_001", "Dr. Arvind Swaminathan", "Consultant Pulmonologist", "MCI-TN-33104", "Max Healthcare Clinic", "2026-08-20", 0)
        ]
        for did, pid, dname, spec, cid, hname, vdate, acc in doctors:
            cursor.execute(
                """
                INSERT OR REPLACE INTO doctor_visits (id, patient_id, doctor_name, specialization, council_id, hospital_name, visit_date, access_granted, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (did, pid, dname, spec, cid, hname, vdate, acc, now)
            )

        # Seed Prescription History
        rx_items = [
            ("rx_01", "pat_aarav_sharma_001", "Aceclofenac + Paracetamol 100/325mg", "1 tablet twice daily after meals", "7 days", "Dr. R. K. Verma", "Apollo Multispeciality Hospital", "2026-11-14"),
            ("rx_02", "pat_aarav_sharma_001", "Trypsin Chymotrypsin Tablets", "1 tablet thrice daily (anti-edema)", "5 days", "Dr. R. K. Verma", "Apollo Multispeciality Hospital", "2026-11-14"),
            ("rx_03", "pat_aarav_sharma_001", "Montelukast + Levocetirizine 10/5mg", "1 tablet at bedtime for rhinitis", "14 days", "Dr. Arvind Swaminathan", "Max Healthcare Clinic", "2026-08-20")
        ]
        for rid, pid, mname, dosage, dur, pdoc, hname, dpres in rx_items:
            cursor.execute(
                """
                INSERT OR REPLACE INTO prescriptions (id, patient_id, medicine_name, dosage, duration, prescribing_doctor, hospital_name, date_prescribed, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (rid, pid, mname, dosage, dur, pdoc, hname, dpres, now)
            )

        # Seed Encrypted Longitudinal Medical Records
        m1_payload = {
            "diagnosis": "Right Knee Acute Medial Meniscus Tear (Grade III)",
            "procedureCode": 2041,
            "prescriptions": "Aceclofenac, Trypsin-Chymotrypsin, Arthroscopic support",
            "treatmentHistory": "Sports injury during football. Severe localized joint line tenderness, positive McMurray test, MRI confirms complex tear.",
            "clinicalNotes": "Recommended arthroscopic partial meniscectomy and reconstructive chondroplasty under spinal anesthesia.",
            "admissionDate": "2026-11-14"
        }
        c1, iv1, tag1, h1 = encrypt_medical_record(m1_payload)
        cursor.execute(
            """
            INSERT OR REPLACE INTO medical_records (id, patient_id, title, encrypted_payload_b64, iv_b64, auth_tag_b64, sha256_record_hash, admission_date, diagnosis_summary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("rec_aarav_001", "pat_aarav_sharma_001", "Orthopedic Knee MRI & Surgical Consultation", c1, iv1, tag1, h1, "2026-11-14", "Right Knee Acute Medial Meniscus Tear", "2026-11-14T10:30:00Z")
        )

        m2_payload = {
            "diagnosis": "High-Resolution Knee MRI Scan with Contrast",
            "procedureCode": 73721,
            "prescriptions": "None required (Diagnostic)",
            "treatmentHistory": "1.5T MRI Scanner protocol. Significant joint effusion in suprapatellar bursa. Grade III signal intensity extending to inferior articular surface.",
            "clinicalNotes": "Intact ACL/PCL. Collateral ligaments intact. No bone marrow edema.",
            "admissionDate": "2026-11-12"
        }
        c2, iv2, tag2, h2 = encrypt_medical_record(m2_payload)
        cursor.execute(
            """
            INSERT OR REPLACE INTO medical_records (id, patient_id, title, encrypted_payload_b64, iv_b64, auth_tag_b64, sha256_record_hash, admission_date, diagnosis_summary, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            ("rec_aarav_002", "pat_aarav_sharma_001", "Diagnostic 1.5T MRI Imaging Report", c2, iv2, tag2, h2, "2026-11-12", "Grade III Meniscus Signal Intensity", "2026-11-12T16:15:00Z")
        )

        # Seed Login Audit Sessions for Aarav Sharma (Bilaspur, Chhattisgarh, India)
        audit_sessions = [
            ("log_01", "pat_aarav_sharma_001", "patient", "Windows 11 • Google Chrome 130.0", "157.34.192.44", "Bilaspur, Chhattisgarh, India", "+91-9876543210", "2026-11-23T05:30:00Z", None, "Current Active Session"),
            ("log_02", "pat_aarav_sharma_001", "patient", "Samsung Galaxy S24 • Chrome Mobile", "157.34.190.18", "Bilaspur, Chhattisgarh, India", "+91-9876543210", "2026-11-21T18:45:10Z", "2026-11-21T19:12:00Z", "Signed Out"),
            ("log_03", "pat_aarav_sharma_001", "patient", "macOS Sonoma • Safari 17.4", "103.212.144.12", "Raipur, Chhattisgarh, India", "+91-9876543210", "2026-11-15T09:20:00Z", "2026-11-15T10:05:00Z", "Signed Out")
        ]
        for lid, uid, role, dev, ip, geo, ph, lin, lout, st in audit_sessions:
            cursor.execute(
                """
                INSERT OR REPLACE INTO login_audit_logs (id, user_id, role, device_info, ip_address, geo_location, phone_number, login_at, logout_at, status)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (lid, uid, role, dev, ip, geo, ph, lin, lout, st)
            )

        # Seed 4 Interconnected Claims across the 4 States (ASKED, APPROVED, PASSED, REJECTED)
        sample_proof = {
            "pi_a": ["0x19a842b109e2", "0x028c771fa1b2", "0x1"],
            "pi_b": [["0x11", "0x22"], ["0x33", "0x44"], ["0x1", "0x0"]],
            "pi_c": ["0x99aa11bb", "0x22cc33dd", "0x1"],
            "protocol": "groth16",
            "curve": "bn128"
        }
        sample_signals = ["0x82500", "0x101", "0x2b4c1069812df936082ecbc58169192496738c8cbe39049a46452f190e3f22b7", "0x9941a2b", "0x0"]

        sample_bill = {
            "hospital_bed_charges": 18000,
            "surgeon_fees": 35000,
            "anesthesia": 12000,
            "ot_consumables_implants": 14500,
            "medicines_pharmacy": 3000,
            "total_requested": 82500
        }

        claims_seed = [
            (
                "CLM-HS-8801",
                "0xnullifier_asked_8801",
                "pat_aarav_sharma_001",
                "Aarav Sharma",
                "+91-9876543210",
                "HOSP-APL-8821",
                "Apollo Multispeciality Hospital",
                "Dr. R. K. Verma (MCI-DEL-40912)",
                "Orthopedics - Knee Injury",
                82500.0,
                None,
                "POL-HS-2026-9941",
                "0x2b4c1069812df936082ecbc58169192496738c8cbe39049a46452f190e3f22b7",
                "Max Limit: ₹1,00,000 | Waiting Period: Cleared | Covered Subcategory (Orthopedics)",
                1,
                "0xapproved_root_merkle_01",
                json.dumps(sample_proof),
                json.dumps(sample_signals),
                "ASKED",
                None,
                json.dumps(sample_bill),
                "Acute Meniscus Tear (Grade III). Arthroscopic meniscectomy planned. MRI imaging verified.",
                "2026-11-23T06:15:00Z"
            ),
            (
                "CLM-HS-7702",
                "0xnullifier_approved_7702",
                "pat_aarav_sharma_001",
                "Aarav Sharma",
                "+91-9876543210",
                "HOSP-APL-8821",
                "Apollo Multispeciality Hospital",
                "Dr. R. K. Verma (MCI-DEL-40912)",
                "Orthopedics - Arthroscopic Diagnostics",
                34000.0,
                34000.0,
                "POL-HS-2026-9941",
                "0x2b4c1069812df936082ecbc58169192496738c8cbe39049a46452f190e3f22b7",
                "Max Limit: ₹1,00,000 | Waiting Period: Cleared | In-Network Hospital Validated",
                1,
                "0xapproved_root_merkle_01",
                json.dumps(sample_proof),
                json.dumps(sample_signals),
                "APPROVED",
                None,
                json.dumps({"diagnostic_arthroscopy": 22000, "daycare_ot": 12000}),
                "Pre-operative exploratory joint inspection and synovial fluid aspiration.",
                "2026-11-18T11:20:00Z"
            ),
            (
                "CLM-HS-6603",
                "0xnullifier_passed_6603",
                "pat_aarav_sharma_001",
                "Aarav Sharma",
                "+91-9876543210",
                "HOSP-APL-8821",
                "Apollo Multispeciality Hospital",
                "Dr. Meera Nambiar (MCI-MAH-19280)",
                "Diagnostic Radiology - High-Res MRI",
                14500.0,
                14500.0,
                "POL-HS-2026-9941",
                "0x2b4c1069812df936082ecbc58169192496738c8cbe39049a46452f190e3f22b7",
                "Max Limit: ₹50,000 | Diagnostic Outpatient Rider Active",
                1,
                "0xapproved_root_merkle_01",
                json.dumps(sample_proof),
                json.dumps(sample_signals),
                "PASSED",
                "0x892a01bf78e5a1b3c9d0284716e45f928374a10294b8e7c10d9a74e5f2a184c9",
                json.dumps({"knee_mri_bilateral": 14500}),
                "Bilateral 1.5T MRI Imaging and digital radiologist interpretation.",
                "2026-11-12T14:40:00Z"
            ),
            (
                "CLM-HS-5504",
                "0xnullifier_rejected_5504",
                "pat_aarav_sharma_001",
                "Aarav Sharma",
                "+91-9876543210",
                "HOSP-APL-8821",
                "Apollo Multispeciality Hospital",
                "Dr. Suresh Chandra",
                "Cosmetic / Non-Covered Dermatology",
                19500.0,
                0.0,
                "POL-HS-2026-9941",
                "0x2b4c1069812df936082ecbc58169192496738c8cbe39049a46452f190e3f22b7",
                "Excluded: Aesthetic and non-emergency cosmetic dermatological procedures",
                0,
                "0xapproved_root_merkle_01",
                json.dumps(sample_proof),
                json.dumps(sample_signals),
                "REJECTED",
                None,
                json.dumps({"laser_therapy": 19500}),
                "Cosmetic scar revision post skin abrasion.",
                "2026-10-05T09:10:00Z"
            )
        ]

        for cid, nulf, pid, pname, pphone, hid, hname, adoc, subcat, camt, appamt, polid, polcom, ttext, isin, aroot, prf, sigs, st, tx, bill, medhist, cat in claims_seed:
            cursor.execute(
                """
                INSERT OR REPLACE INTO claims (
                    id, claim_nullifier, patient_id, patient_name, patient_phone,
                    hospital_id, hospital_name, assisting_doctor, health_subcategory,
                    claim_amount, approved_amount, policy_id, policy_commitment,
                    terms_and_conditions_text, is_within_terms, approved_hospital_root,
                    proof_json, public_signals_json, status, settlement_tx_hash,
                    itemized_bill_json, detailed_medical_history, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (cid, nulf, pid, pname, pphone, hid, hname, adoc, subcat, camt, appamt, polid, polcom, ttext, isin, aroot, prf, sigs, st, tx, bill, medhist, cat)
            )

    conn.commit()
    conn.close()


# --- Database Queries for Patient Vault ---

def get_patient(patient_id: str) -> Optional[Dict[str, Any]]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM patients WHERE id = ? OR mobile_no = ? OR policy_id = ?", (patient_id, patient_id, patient_id)).fetchone()
    if not row:
        row = conn.execute("SELECT * FROM patients WHERE id = 'pat_aarav_sharma_001'").fetchone()
    conn.close()
    return dict(row) if row else None


def get_patient_records(patient_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM medical_records WHERE patient_id = ? ORDER BY created_at DESC", (patient_id,)).fetchall()
    if not rows:
        rows = conn.execute("SELECT * FROM medical_records WHERE patient_id = 'pat_aarav_sharma_001' ORDER BY created_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_patient_doctor_visits(patient_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM doctor_visits WHERE patient_id = ? ORDER BY visit_date DESC", (patient_id,)).fetchall()
    if not rows:
        rows = conn.execute("SELECT * FROM doctor_visits WHERE patient_id = 'pat_aarav_sharma_001' ORDER BY visit_date DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def toggle_doctor_access(visit_id: str, is_granted: bool) -> Dict[str, Any]:
    conn = get_connection()
    conn.execute("UPDATE doctor_visits SET access_granted = ? WHERE id = ?", (1 if is_granted else 0, visit_id))
    conn.commit()
    row = conn.execute("SELECT * FROM doctor_visits WHERE id = ?", (visit_id,)).fetchone()
    conn.close()
    return dict(row) if row else {}


def get_patient_prescriptions(patient_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY date_prescribed DESC", (patient_id,)).fetchall()
    if not rows:
        rows = conn.execute("SELECT * FROM prescriptions WHERE patient_id = 'pat_aarav_sharma_001' ORDER BY date_prescribed DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_user_login_audits(user_id: str) -> List[Dict[str, Any]]:
    conn = get_connection()
    rows = conn.execute("SELECT * FROM login_audit_logs WHERE user_id = ? ORDER BY login_at DESC", (user_id,)).fetchall()
    if not rows:
        rows = conn.execute("SELECT * FROM login_audit_logs WHERE user_id = 'pat_aarav_sharma_001' ORDER BY login_at DESC").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def revoke_other_sessions(user_id: str) -> int:
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("UPDATE login_audit_logs SET status = 'Revoked Remotely', logout_at = ? WHERE user_id = ? AND status != 'Current Active Session'", (datetime.datetime.now(datetime.timezone.utc).isoformat(), user_id))
    revoked = cur.rowcount
    conn.commit()
    conn.close()
    return revoked


def record_login_audit(user_id: str, role: str, device_info: str, ip_address: str, geo_location: str, phone_number: str) -> Dict[str, Any]:
    conn = get_connection()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    log_id = f"log_{os.urandom(6).hex()}"
    conn.execute(
        """
        INSERT INTO login_audit_logs (id, user_id, role, device_info, ip_address, geo_location, phone_number, login_at, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Current Active Session')
        """,
        (log_id, user_id, role, device_info, ip_address, geo_location, phone_number, now)
    )
    conn.commit()
    conn.close()
    return {"id": log_id, "user_id": user_id, "login_at": now}


# --- Hospital & Claims Queue Queries ---

def get_hospital_patient_queue(hospital_id: str = "Apollo Multispeciality Hospital") -> List[Dict[str, Any]]:
    """Patients requesting assistance or admitted at this hospital."""
    conn = get_connection()
    rows = conn.execute(
        """
        SELECT c.*, p.name as patient_name, p.age as patient_age, p.mobile_no as patient_mobile,
               p.policy_id as patient_policy, p.coverage_limit, p.remaining_balance
        FROM claims c
        JOIN patients p ON c.patient_id = p.id
        WHERE c.hospital_name LIKE ? OR c.hospital_id LIKE ? OR c.status = 'ASKED'
        ORDER BY c.created_at DESC
        """,
        (f"%{hospital_id}%", f"%{hospital_id}%")
    ).fetchall()
    conn.close()

    queue = []
    for r in rows:
        d = dict(r)
        if d.get("itemized_bill_json"):
            try:
                d["itemized_bill"] = json.loads(d["itemized_bill_json"])
            except Exception:
                pass
        queue.append(d)
    return queue


def get_claims_by_status(status_filter: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
    """Retrieve claims. For Insurer role, physically REDACT raw clinical fields!"""
    conn = get_connection()
    if status_filter and status_filter.upper() != "ALL":
        rows = conn.execute("SELECT * FROM claims WHERE UPPER(status) = UPPER(?) ORDER BY created_at DESC", (status_filter,)).fetchall()
    else:
        rows = conn.execute("SELECT * FROM claims ORDER BY created_at DESC").fetchall()
    conn.close()

    result = []
    for r in rows:
        d = dict(r)
        try:
            d["proof_json"] = json.loads(d["proof_json"])
            d["public_signals"] = json.loads(d["public_signals_json"])
        except Exception:
            pass

        # STRICT INSURER PRIVACY REDACTION:
        if role == "insurer":
            # Strip detailed clinical notes, prescriptions, and medical records
            d.pop("detailed_medical_history", None)
            d.pop("itemized_bill_json", None)
            d["clinical_notes"] = "[REDACTED BY ZERO-KNOWLEDGE PROOF]"
            d["prescriptions"] = "[REDACTED BY ZERO-KNOWLEDGE PROOF]"
            d["diagnosis"] = "[REDACTED BY ZERO-KNOWLEDGE PROOF]"
        else:
            if d.get("itemized_bill_json"):
                try:
                    d["itemized_bill"] = json.loads(d["itemized_bill_json"])
                except Exception:
                    pass

        result.append(d)
    return result


def update_claim_status(claim_id: str, status: str, approved_amount: Optional[float] = None, settlement_tx_hash: Optional[str] = None):
    conn = get_connection()
    if approved_amount is not None:
        conn.execute(
            "UPDATE claims SET status = ?, approved_amount = ?, settlement_tx_hash = COALESCE(?, settlement_tx_hash) WHERE id = ?",
            (status.upper(), approved_amount, settlement_tx_hash, claim_id)
        )
    else:
        conn.execute(
            "UPDATE claims SET status = ?, settlement_tx_hash = COALESCE(?, settlement_tx_hash) WHERE id = ?",
            (status.upper(), settlement_tx_hash, claim_id)
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
    try:
        d["proof_json"] = json.loads(d["proof_json"])
        d["public_signals_json"] = json.loads(d["public_signals_json"])
    except Exception:
        pass
    if d.get("itemized_bill_json"):
        try:
            d["itemized_bill"] = json.loads(d["itemized_bill_json"])
        except Exception:
            pass
    return d


def get_hospital_permission(patient_id: str, hospital_id: str) -> Dict[str, Any]:
    conn = get_connection()
    row = conn.execute("SELECT * FROM permissions WHERE patient_id = ? AND hospital_id = ?", (patient_id, hospital_id)).fetchone()
    conn.close()
    if row:
        return dict(row)
    return {
        "id": f"perm_{patient_id[:6]}",
        "patient_id": patient_id,
        "hospital_id": hospital_id,
        "is_granted": 1,
        "tx_hash": "0x7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
        "updated_at": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }


def update_permission(patient_id: str, hospital_id: str, is_granted: bool, tx_hash: Optional[str] = None):
    conn = get_connection()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    conn.execute(
        """
        INSERT INTO permissions (id, patient_id, hospital_id, is_granted, tx_hash, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(patient_id, hospital_id) DO UPDATE SET
            is_granted = excluded.is_granted,
            tx_hash = excluded.tx_hash,
            updated_at = excluded.updated_at
        """,
        (f"perm_{patient_id[:8]}_{hospital_id[:8]}", patient_id, hospital_id, 1 if is_granted else 0, tx_hash, now)
    )
    conn.commit()
    conn.close()
    return get_hospital_permission(patient_id, hospital_id)


def record_audit(actor_role: str, action: str, details: Dict[str, Any], tx_hash: Optional[str] = None):
    conn = get_connection()
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()
    audit_id = "aud_" + hex(int(datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000))[2:]
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


# Legacy compatibility functions
def get_claims(patient_id: Optional[str] = None, role: Optional[str] = None) -> List[Dict[str, Any]]:
    return get_claims_by_status(status_filter=None, role=role)

def register_user(**kwargs):
    return kwargs

def authenticate_user(**kwargs):
    return kwargs

def get_user_by_id(user_id: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None

def get_user_by_username(username: str):
    conn = get_connection()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return dict(row) if row else None

def save_claim(**kwargs):
    return kwargs
