from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Header, HTTPException
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.repositories import UserRepository

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    return pwd_context.verify(password, hashed)


def create_access_token(subject: str, expires_minutes: Optional[int] = None) -> str:
    """Create JWT access token with standard claims.
    
    Args:
        subject: User identifier (typically user.id or user.email)
        expires_minutes: Token lifetime in minutes (defaults to config)
    
    Returns:
        Encoded JWT string with sub, exp, nbf, iss, aud claims
    
    Security:
        - Uses HS256 algorithm (consider RS256 for production key rotation)
        - Includes nbf (not before) to prevent premature token usage
        - Includes iss (issuer) and aud (audience) for token scope validation
    """
    now = datetime.now(timezone.utc)
    expire_delta = timedelta(
        minutes=expires_minutes or settings.access_token_expire_minutes
    )
    expire = now + expire_delta
    
    to_encode = {
        "sub": subject,
        "exp": expire,
        "nbf": now,  # Not before - prevents premature token usage
        "iss": settings.jwt_issuer,  # Issuer claim
        "aud": settings.jwt_audience,  # Audience claim
    }
    return jwt.encode(
        to_encode, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )


def decode_access_token(token: str) -> dict:
    """Decode and validate JWT access token with explicit security checks.
    
    Args:
        token: JWT string (without 'Bearer ' prefix)
    
    Returns:
        Decoded payload dict with validated claims
    
    Raises:
        ValueError: If token is invalid, expired, or claims are incorrect
    
    Security Validations:
        - exp: Token expiration (automatic via jose with leeway)
        - nbf: Not before timestamp
        - iss: Issuer matches expected value
        - aud: Audience matches expected value
        - sub: Subject (user identifier) is present
    
    Reference:
        AERA/APA/NCME Standards 8.12 (Security and confidentiality)
    """
    try:
        # Decode with automatic exp validation (5 second leeway for clock skew)
        payload = jwt.decode(
            token,
            settings.jwt_secret_key,
            algorithms=[settings.jwt_algorithm],
            options={
                "verify_exp": True,
                "verify_nbf": True,
                "verify_iss": True,
                "verify_aud": True,
                "leeway": 5,  # 5 second clock skew tolerance
            },
            issuer=settings.jwt_issuer,
            audience=settings.jwt_audience,
        )
        
        # Explicit validation of required claims
        if "sub" not in payload:
            raise ValueError("Token missing 'sub' claim (user identifier)")
        
        return payload
        
    except JWTError as e:
        # Map jose errors to ValueError for consistent exception handling
        raise ValueError(f"Invalid JWT token: {str(e)}")
    except Exception as e:
        raise ValueError(f"Token validation failed: {str(e)}")


def get_current_user(authorization: str | None = Header(default=None), db: Session | None = None):
    """FastAPI dependency for extracting and validating current user from JWT.
    
    Args:
        authorization: Authorization header (expected format: "Bearer <token>")
        db: Database session for user lookup
    
    Returns:
        User object if authentication successful
    
    Raises:
        HTTPException 401: If token is missing, invalid, or user not found
    
    Usage:
        @router.get("/protected")
        def protected_route(current_user: User = Depends(get_current_user)):
            return {"user_id": current_user.id}
    
    Security:
        - Validates Bearer token format
        - Verifies all JWT claims (exp, nbf, iss, aud)
        - Ensures user exists in database
    """
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    
    parts = authorization.split(" ")
    if len(parts) != 2 or parts[0].lower() != "bearer":
        raise HTTPException(status_code=401, detail="Invalid Authorization header format. Expected: Bearer <token>")
    
    token = parts[1]
    
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except (KeyError, TypeError):
        raise HTTPException(status_code=401, detail="Invalid token payload")
    
    if not db:
        raise HTTPException(status_code=500, detail="Database session not provided")

    user_repo = UserRepository(db)
    user = user_repo.get(user_id)
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user
