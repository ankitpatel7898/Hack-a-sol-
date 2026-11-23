"""
HealthShield Authentication Dependencies & Route Guards
"""

from typing import List, Dict, Any, Optional
from fastapi import Header, HTTPException, status, Depends, Request
from backend.app.core.security import decode_token
from backend.app.core.encryption import unwrap_dek, decrypt_with_dek, decrypt_json_pii
from backend.app.models.user import get_user_by_id


async def get_current_user(
    request: Request,
    authorization: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """
    Extracts Bearer token from header or cookie, decodes JWT,
    unwraps the per-user DEK, and decrypts PII attributes.
    """
    token = None
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ")[1]
    elif "access_token" in request.cookies:
        token = request.cookies.get("access_token")

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        payload = decode_token(token)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token claims.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_record = get_user_by_id(user_id)
    if not user_record:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user_record.get("is_active", 1):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account has been suspended.",
        )

    # Decrypt User PII using their unwrapped DEK
    try:
        dek = unwrap_dek(user_record["encrypted_dek"], user_record["dek_nonce"])
        decrypted_name = decrypt_with_dek(user_record["full_name_encrypted"], user_record["name_nonce"], dek)
        decrypted_email = decrypt_with_dek(user_record["email_encrypted"], user_record["email_nonce"], dek)
        decrypted_pii = decrypt_json_pii(user_record["profile_pii_encrypted"], user_record["pii_nonce"], dek)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to decrypt secure profile payload.",
        )

    return {
        "id": user_record["id"],
        "role": user_record["role"],
        "name": decrypted_name,
        "email": decrypted_email,
        "wallet_address": user_record["wallet_address"],
        "profile_pii": decrypted_pii,
        "created_at": user_record["created_at"],
        "_dek": dek  # Attached for downstream record decryption if needed
    }


def require_role(allowed_roles: List[str]):
    """Enforce strict Role-Based Access Control (RBAC) on route endpoints."""
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)) -> Dict[str, Any]:
        user_role = current_user.get("role", "").lower()
        normalized_allowed = [r.lower() for r in allowed_roles]
        if user_role not in normalized_allowed:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=(
                    f"Access Denied: Account '{current_user.get('email')}' is registered as '{user_role.upper()}'. "
                    f"This endpoint strictly requires one of: {', '.join(allowed_roles).upper()}."
                )
            )
        return current_user
    return role_checker
