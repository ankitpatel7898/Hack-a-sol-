"""
HealthShield Core Security Module
Implements Argon2id password hashing, rate limiting, and JWT session management.
"""

import os
import time
import uuid
import datetime
from typing import Dict, Any, Optional, Tuple
import jwt
from argon2 import PasswordHasher, Type
from argon2.exceptions import VerifyMismatchError, InvalidHashError

# Environment Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "healthshield-super-secret-jwt-key-2026-production-32bytes")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Production-grade Argon2id Hasher with RFC 9106 recommended parameters
# time_cost=3, memory_cost=65536 (64MB), parallelism=4
pwd_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    type=Type.ID
)


def hash_password(password: str) -> str:
    """Hash password using Argon2id with per-user cryptographic salt."""
    if not password:
        raise ValueError("Password cannot be empty")
    return pwd_hasher.hash(password)


def verify_password(stored_hash: str, provided_password: str) -> bool:
    """Verify password against Argon2id hash."""
    try:
        return pwd_hasher.verify(stored_hash, provided_password)
    except (VerifyMismatchError, InvalidHashError):
        return False
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[datetime.timedelta] = None) -> str:
    """Generate short-lived JWT Access Token (15-min expiry)."""
    to_encode = data.copy()
    now = datetime.datetime.now(datetime.timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "jti": uuid.uuid4().hex,
        "type": "access"
    })
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def create_refresh_token(data: Dict[str, Any]) -> str:
    """Generate long-lived JWT Refresh Token (7-day expiry)."""
    to_encode = data.copy()
    now = datetime.datetime.now(datetime.timezone.utc)
    expire = now + datetime.timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    
    to_encode.update({
        "exp": expire,
        "iat": now,
        "jti": uuid.uuid4().hex,
        "type": "refresh"
    })
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT access or refresh token."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError("Token has expired. Please sign in again.")
    except jwt.InvalidTokenError:
        raise ValueError("Invalid authentication token.")


# In-Memory Rate Limiter for Login Protection
# Enforces max 5 failed attempts per 15 minutes per IP/email
class LoginRateLimiter:
    def __init__(self, max_attempts: int = 5, window_seconds: int = 900):
        self.max_attempts = max_attempts
        self.window_seconds = window_seconds
        self._attempts: Dict[str, list] = {}

    def is_rate_limited(self, identifier: str) -> Tuple[bool, int]:
        """Check if an identifier is locked. Returns (is_locked, remaining_seconds)."""
        now = time.time()
        attempts = self._attempts.get(identifier, [])
        # Filter attempts within window
        valid_attempts = [t for t in attempts if now - t < self.window_seconds]
        self._attempts[identifier] = valid_attempts

        if len(valid_attempts) >= self.max_attempts:
            oldest = valid_attempts[0]
            remaining = int(self.window_seconds - (now - oldest))
            return True, max(1, remaining)
        return False, 0

    def record_failure(self, identifier: str):
        """Record a failed login attempt."""
        now = time.time()
        if identifier not in self._attempts:
            self._attempts[identifier] = []
        self._attempts[identifier].append(now)

    def reset(self, identifier: str):
        """Reset failed attempts upon successful login."""
        if identifier in self._attempts:
            del self._attempts[identifier]


login_rate_limiter = LoginRateLimiter(max_attempts=5, window_seconds=900)
