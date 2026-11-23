"""
HealthShield User & Session Database Models
Compatible with both Supabase PostgreSQL and local SQLite fallback.
"""

import os
import sqlite3
import datetime
import hashlib
from typing import Dict, Any, Optional, List

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "db", "healthguard.db")


def get_db():
    """Get SQLite database connection with Row factory."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_user_db():
    """Initialize zero-trust users and refresh_tokens tables with auto-migration."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.executescript("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL,
        email_blind_index TEXT,
        email_encrypted TEXT,
        email_nonce TEXT,
        password_hash TEXT NOT NULL,
        full_name_encrypted TEXT,
        name_nonce TEXT,
        profile_pii_encrypted TEXT,
        pii_nonce TEXT,
        encrypted_dek TEXT,
        dek_nonce TEXT,
        wallet_address TEXT,
        is_active INTEGER DEFAULT 1,
        failed_login_attempts INTEGER DEFAULT 0,
        locked_until TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TEXT NOT NULL,
        revoked INTEGER DEFAULT 0,
        created_at TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
    """)

    # Inspect columns and migrate missing zero-trust envelope fields
    cursor.execute("PRAGMA table_info(users)")
    existing_cols = {row["name"] for row in cursor.fetchall()}

    needed_cols = [
        ("email_blind_index", "TEXT"),
        ("email_encrypted", "TEXT"),
        ("email_nonce", "TEXT"),
        ("full_name_encrypted", "TEXT"),
        ("name_nonce", "TEXT"),
        ("profile_pii_encrypted", "TEXT"),
        ("pii_nonce", "TEXT"),
        ("encrypted_dek", "TEXT"),
        ("dek_nonce", "TEXT"),
        ("wallet_address", "TEXT"),
        ("is_active", "INTEGER DEFAULT 1"),
        ("failed_login_attempts", "INTEGER DEFAULT 0"),
        ("locked_until", "TEXT"),
        ("updated_at", "TEXT")
    ]
    for col_name, col_type in needed_cols:
        if col_name not in existing_cols:
            try:
                cursor.execute(f"ALTER TABLE users ADD COLUMN {col_name} {col_type}")
            except Exception:
                pass

    try:
        cursor.execute("CREATE INDEX IF NOT EXISTS idx_users_blind_index ON users(email_blind_index)")
    except Exception:
        pass

    conn.commit()
    conn.close()


def get_user_by_blind_index(blind_index: str) -> Optional[Dict[str, Any]]:
    """O(1) Indexed lookup by blind index."""
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE email_blind_index = ?", (blind_index,)).fetchone()
    conn.close()
    return dict(row) if row else None


def get_user_by_id(user_id: str) -> Optional[Dict[str, Any]]:
    """Lookup user by primary key ID."""
    conn = get_db()
    row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    conn.close()
    return dict(row) if row else None


def create_user_record(user_data: Dict[str, Any]) -> Dict[str, Any]:
    """Insert a newly encrypted user into the database dynamically supporting all schemas."""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("PRAGMA table_info(users)")
    cols = {r["name"] for r in cursor.fetchall()}

    # Populate backward-compatible username if column exists in table
    if "username" in cols and "username" not in user_data:
        user_data["username"] = user_data.get("id")

    insert_cols = [k for k in user_data.keys() if k in cols]
    col_names = ", ".join(insert_cols)
    placeholders = ", ".join([f":{k}" for k in insert_cols])

    cursor.execute(f"INSERT INTO users ({col_names}) VALUES ({placeholders})", user_data)
    conn.commit()
    conn.close()
    return user_data


def update_login_attempts(user_id: str, failed_count: int, locked_until: Optional[str] = None):
    """Record failed login attempt and potential account lockout."""
    conn = get_db()
    conn.execute(
        "UPDATE users SET failed_login_attempts = ?, locked_until = ?, updated_at = ? WHERE id = ?",
        (failed_count, locked_until, datetime.datetime.now(datetime.timezone.utc).isoformat(), user_id)
    )
    conn.commit()
    conn.close()


def reset_login_attempts(user_id: str):
    """Clear failed attempts on successful authentication."""
    conn = get_db()
    conn.execute(
        "UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = ? WHERE id = ?",
        (datetime.datetime.now(datetime.timezone.utc).isoformat(), user_id)
    )
    conn.commit()
    conn.close()


# --- Refresh Token Store ---

def store_refresh_token(user_id: str, raw_token: str, expires_at: datetime.datetime):
    """Store hashed refresh token."""
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    token_id = f"rt_{os.urandom(8).hex()}"
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    conn = get_db()
    conn.execute(
        """
        INSERT OR REPLACE INTO refresh_tokens (id, user_id, token_hash, expires_at, revoked, created_at)
        VALUES (?, ?, ?, ?, 0, ?)
        """,
        (token_id, user_id, token_hash, expires_at.isoformat(), now)
    )
    conn.commit()
    conn.close()


def verify_and_revoke_refresh_token(raw_token: str) -> Optional[str]:
    """Verify refresh token hash. If valid and not expired/revoked, revoke it and return user_id."""
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    conn = get_db()
    row = conn.execute("SELECT * FROM refresh_tokens WHERE token_hash = ?", (token_hash,)).fetchone()
    if not row:
        conn.close()
        return None

    row_dict = dict(row)
    if row_dict["revoked"]:
        conn.close()
        return None

    # Check expiry
    try:
        exp = datetime.datetime.fromisoformat(row_dict["expires_at"].replace("Z", "+00:00"))
        if exp < datetime.datetime.now(datetime.timezone.utc):
            conn.close()
            return None
    except Exception:
        pass

    # Revoke (rotation)
    conn.execute("UPDATE refresh_tokens SET revoked = 1 WHERE token_hash = ?", (token_hash,))
    conn.commit()
    conn.close()
    return row_dict["user_id"]


def revoke_all_user_tokens(user_id: str):
    """Revoke all refresh tokens for a user (on logout or security breach)."""
    conn = get_db()
    conn.execute("UPDATE refresh_tokens SET revoked = 1 WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()
