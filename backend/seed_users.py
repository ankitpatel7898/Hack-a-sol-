"""
HealthShield Standalone Database Seeder
Seeds production-grade demo accounts with Argon2id password hashing,
AES-256-GCM envelope encryption, and HMAC-SHA256 blind indexing.
"""

import os
import sys
import datetime

# Ensure project root is in sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from backend.app.core.security import hash_password
from backend.app.core.encryption import (
    compute_blind_index,
    generate_user_dek,
    wrap_dek,
    encrypt_with_dek,
    encrypt_json_pii
)
from backend.app.models.user import (
    init_user_db,
    get_user_by_blind_index,
    create_user_record
)

DEMO_ACCOUNTS = [
    {
        "role": "patient",
        "email": "patient@healthshield.io",
        "password": "Patient@12345!",
        "full_name": "Rahul Sharma",
        "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "pii": {
            "email_plain": "patient@healthshield.io",
            "date_of_birth": "1994-05-12",
            "policy_id": "POL-IND-882190",
            "emergency_contact": "+91-9876543210",
            "health_issues": "Asthma, Mild Hypertension",
            "mac_address": "00:1A:2B:3C:4D:5E"
        }
    },
    {
        "role": "hospital",
        "email": "hospital@healthshield.io",
        "password": "Hospital@12345!",
        "full_name": "Apollo Hospital Delhi",
        "wallet_address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        "pii": {
            "email_plain": "hospital@healthshield.io",
            "hospital_license_id": "HOSP-DEL-401",
            "department": "Emergency & Critical Care",
            "mobile_contact": "+91-11-26925858",
            "mac_address": "B4:2E:99:A1:7C:12"
        }
    },
    {
        "role": "insurer",
        "email": "insurer@healthshield.io",
        "password": "Insurer@12345!",
        "full_name": "Star Health Insurance",
        "wallet_address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
        "pii": {
            "email_plain": "insurer@healthshield.io",
            "insurer_license_code": "INS-LIC-8891",
            "company_name": "Star Health & Allied Insurance Co.",
            "hotline": "1800-425-2255",
            "mac_address": "E8:6A:64:1F:3B:88"
        }
    }
]


def seed_database():
    """Seed zero-trust demo accounts."""
    init_user_db()
    print("Zero-trust database tables verified.")

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    seeded_count = 0

    for acc in DEMO_ACCOUNTS:
        email = acc["email"]
        blind_idx = compute_blind_index(email)

        existing = get_user_by_blind_index(blind_idx)
        if existing:
            print(f"[SKIP] Account '{email}' ({acc['role']}) already seeded.")
            continue

        print(f"[SEED] Processing '{email}' ({acc['role']}) with Argon2id & AES-256-GCM...")

        # 1. Per-User DEK
        user_dek = generate_user_dek()
        enc_dek, dek_nonce = wrap_dek(user_dek)

        # 2. Argon2id Hash
        pwd_hash = hash_password(acc["password"])

        # 3. AES-256-GCM PII & Metadata Encryption
        name_enc, name_nonce = encrypt_with_dek(acc["full_name"], user_dek)
        email_enc, email_nonce = encrypt_with_dek(email, user_dek)
        pii_enc, pii_nonce = encrypt_json_pii(acc["pii"], user_dek)

        user_id = f"usr_{acc['role']}_seeded_{email.split('@')[0]}"

        record = {
            "id": user_id,
            "username": email,
            "name": acc["full_name"],
            "role": acc["role"],
            "email_blind_index": blind_idx,
            "email_encrypted": email_enc,
            "email_nonce": email_nonce,
            "password_hash": pwd_hash,
            "full_name_encrypted": name_enc,
            "name_nonce": name_nonce,
            "profile_pii_encrypted": pii_enc,
            "pii_nonce": pii_nonce,
            "encrypted_dek": enc_dek,
            "dek_nonce": dek_nonce,
            "wallet_address": acc["wallet_address"],
            "is_active": 1,
            "failed_login_attempts": 0,
            "locked_until": None,
            "created_at": now_iso,
            "updated_at": now_iso
        }

        create_user_record(record)
        seeded_count += 1
        print(f"[SUCCESS] Successfully seeded '{email}' [ID: {user_id}]")

    print(f"\nSeeding complete: {seeded_count} new accounts created.")


if __name__ == "__main__":
    seed_database()
