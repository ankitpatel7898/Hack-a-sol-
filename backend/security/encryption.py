"""
HealthGuard AES-256-GCM Cryptographic Security Module
Handles off-chain medical record encryption, SHA-256 hash commitments, and verified decryption.
"""

import os
import base64
import json
import hashlib
from typing import Dict, Any, Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

# Default 256-bit master key for development/demo (can be overridden via env)
DEFAULT_AES_KEY_HEX = os.getenv(
    "AES_MASTER_KEY",
    "e2b9c78d4a6f81e3d09a5c71b3e8f4201948d3c52a71e09f4b62d85a13c9e782"
)

def get_aes_key() -> bytes:
    """Retrieve 32-byte (256-bit) encryption key."""
    key_hex = os.getenv("AES_MASTER_KEY", DEFAULT_AES_KEY_HEX)
    try:
        key = bytes.fromhex(key_hex)
        if len(key) != 32:
            # Pad or hash to ensure exactly 32 bytes
            key = hashlib.sha256(key_hex.encode("utf-8")).digest()
    except Exception:
        key = hashlib.sha256(key_hex.encode("utf-8")).digest()
    return key


def encrypt_medical_record(
    data: Dict[str, Any],
    custom_key: bytes = None
) -> Tuple[str, str, str, str]:
    """
    Encrypt sensitive medical record payload using AES-256-GCM.
    
    Parameters:
        data: Dictionary containing diagnosis, procedureCode, prescriptions, treatmentHistory.
        custom_key: Optional 32-byte key.
        
    Returns:
        encrypted_payload_b64: Base64 string of ciphertext
        iv_b64: Base64 string of 12-byte initialization vector (96-bit nonce)
        auth_tag_b64: Base64 string of 16-byte authentication tag
        sha256_record_hash: Hex string (0x...) of SHA-256 hash anchored on-chain
    """
    key = custom_key or get_aes_key()
    aesgcm = AESGCM(key)
    
    # 96-bit unique IV (12 bytes) recommended for AES-GCM
    iv = os.urandom(12)
    
    # Serialize JSON payload
    plaintext_bytes = json.dumps(data, sort_keys=True).encode("utf-8")
    
    # In cryptography AESGCM.encrypt returns ciphertext + 16-byte tag appended
    ciphertext_with_tag = aesgcm.encrypt(iv, plaintext_bytes, None)
    
    ciphertext = ciphertext_with_tag[:-16]
    tag = ciphertext_with_tag[-16:]
    
    encrypted_payload_b64 = base64.b64encode(ciphertext).decode("utf-8")
    iv_b64 = base64.b64encode(iv).decode("utf-8")
    auth_tag_b64 = base64.b64encode(tag).decode("utf-8")
    
    # Calculate SHA-256 hash of the entire encrypted ciphertext + IV + tag for immutable on-chain anchoring
    hasher = hashlib.sha256()
    hasher.update(ciphertext)
    hasher.update(iv)
    hasher.update(tag)
    sha256_record_hash = "0x" + hasher.hexdigest()
    
    return encrypted_payload_b64, iv_b64, auth_tag_b64, sha256_record_hash


def decrypt_medical_record(
    encrypted_payload_b64: str,
    iv_b64: str,
    auth_tag_b64: str,
    is_granted: bool = True,
    custom_key: bytes = None
) -> Dict[str, Any]:
    """
    Decrypt an AES-256-GCM medical record only if patient permission is granted.
    """
    if not is_granted:
        raise PermissionError("Access Denied: Patient has not granted hospital permission to decrypt records.")
        
    key = custom_key or get_aes_key()
    aesgcm = AESGCM(key)
    
    ciphertext = base64.b64decode(encrypted_payload_b64)
    iv = base64.b64decode(iv_b64)
    tag = base64.b64decode(auth_tag_b64)
    
    ciphertext_with_tag = ciphertext + tag
    decrypted_bytes = aesgcm.decrypt(iv, ciphertext_with_tag, None)
    
    return json.loads(decrypted_bytes.decode("utf-8"))


def compute_record_hash(encrypted_payload_b64: str, iv_b64: str, auth_tag_b64: str) -> str:
    """Helper to recompute record hash for verification."""
    ciphertext = base64.b64decode(encrypted_payload_b64)
    iv = base64.b64decode(iv_b64)
    tag = base64.b64decode(auth_tag_b64)
    hasher = hashlib.sha256()
    hasher.update(ciphertext)
    hasher.update(iv)
    hasher.update(tag)
    return "0x" + hasher.hexdigest()
