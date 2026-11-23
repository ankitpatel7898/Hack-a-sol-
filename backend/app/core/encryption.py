"""
HealthShield Multi-Layer Envelope Encryption & Blind Indexing Module
Uses AES-256-GCM (AEAD) via cryptography.hazmat.primitives.ciphers.aead.AESGCM
"""

import os
import hmac
import json
import base64
import hashlib
from typing import Tuple, Dict, Any, Optional
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Environment Master Secrets
# Default 32-byte production master key for envelope wrapping
RAW_MASTER_KEY = os.getenv(
    "ENCRYPTION_MASTER_KEY",
    os.getenv("AES_MASTER_KEY", "e2b9c78d4a6f81e3d09a5c71b3e8f4201948d3c52a71e09f4b62d85a13c9e782")
)

# Blind index secret for HMAC-SHA256 searchable indexes
BLIND_INDEX_SECRET = os.getenv(
    "BLIND_INDEX_SECRET",
    "healthshield-blind-index-hmac-sha256-secret-salt-2026"
)

# Parse master key to exact 32 bytes
def _get_master_key_bytes() -> bytes:
    try:
        if len(RAW_MASTER_KEY) == 64:
            return bytes.fromhex(RAW_MASTER_KEY)
        elif len(RAW_MASTER_KEY) == 44:
            return base64.b64decode(RAW_MASTER_KEY)
        else:
            return hashlib.sha256(RAW_MASTER_KEY.encode()).digest()
    except Exception:
        return hashlib.sha256(RAW_MASTER_KEY.encode()).digest()

MASTER_KEY_BYTES = _get_master_key_bytes()


def compute_blind_index(email: str, secret: str = BLIND_INDEX_SECRET) -> str:
    """
    Compute deterministic HMAC-SHA256 blind index for fast O(1) email lookups
    without exposing plaintext emails in database queries.
    """
    normalized = email.strip().lower()
    return hmac.new(secret.encode("utf-8"), normalized.encode("utf-8"), hashlib.sha256).hexdigest()


# --- Envelope Key Management ---

def generate_user_dek() -> bytes:
    """Generate a cryptographically secure 256-bit (32-byte) per-user Data Encryption Key."""
    return AESGCM.generate_key(bit_length=256)


def wrap_dek(dek: bytes, master_key: bytes = MASTER_KEY_BYTES) -> Tuple[str, str]:
    """
    Wrap (encrypt) the user's DEK with the master key using AES-256-GCM.
    Returns (encrypted_dek_b64, dek_nonce_b64).
    """
    aesgcm = AESGCM(master_key)
    nonce = os.urandom(12)  # Standard 96-bit nonce for AES-GCM
    encrypted = aesgcm.encrypt(nonce, dek, None)
    return base64.b64encode(encrypted).decode("utf-8"), base64.b64encode(nonce).decode("utf-8")


def unwrap_dek(encrypted_dek_b64: str, dek_nonce_b64: str, master_key: bytes = MASTER_KEY_BYTES) -> bytes:
    """
    Unwrap (decrypt) the user's DEK using the master key and stored nonce.
    Returns the raw 32-byte user DEK.
    """
    aesgcm = AESGCM(master_key)
    ciphertext = base64.b64decode(encrypted_dek_b64.encode("utf-8"))
    nonce = base64.b64decode(dek_nonce_b64.encode("utf-8"))
    return aesgcm.decrypt(nonce, ciphertext, None)


# --- Multi-Layer Data & PII Envelope Encryption ---

def encrypt_with_dek(plaintext: str, dek: bytes) -> Tuple[str, str]:
    """
    Encrypt plaintext payload using user's DEK via AES-256-GCM.
    Returns (ciphertext_b64, nonce_b64).
    """
    aesgcm = AESGCM(dek)
    nonce = os.urandom(12)
    ciphertext = aesgcm.encrypt(nonce, plaintext.encode("utf-8"), None)
    return base64.b64encode(ciphertext).decode("utf-8"), base64.b64encode(nonce).decode("utf-8")


def decrypt_with_dek(ciphertext_b64: str, nonce_b64: str, dek: bytes) -> str:
    """
    Decrypt AES-256-GCM payload using user's DEK.
    """
    aesgcm = AESGCM(dek)
    ciphertext = base64.b64decode(ciphertext_b64.encode("utf-8"))
    nonce = base64.b64decode(nonce_b64.encode("utf-8"))
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    return plaintext.decode("utf-8")


def encrypt_json_pii(data: Dict[str, Any], dek: bytes) -> Tuple[str, str]:
    """Serialize and envelope-encrypt a dictionary of PII fields."""
    serialized = json.dumps(data)
    return encrypt_with_dek(serialized, dek)


def decrypt_json_pii(ciphertext_b64: str, nonce_b64: str, dek: bytes) -> Dict[str, Any]:
    """Decrypt and deserialize an envelope-encrypted PII JSON payload."""
    raw_json = decrypt_with_dek(ciphertext_b64, nonce_b64, dek)
    return json.loads(raw_json)
