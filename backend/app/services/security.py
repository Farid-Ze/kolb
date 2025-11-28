from datetime import datetime, timedelta, timezone
from typing import Optional

from fastapi import Header, HTTPException, Depends
from jose import jwt, JWTError
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.core.config import settings
from app.db.repositories import UserRepository
from app.i18n.id_messages import AuthorizationMessages, SecurityMessages

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


def create_refresh_token(subject: str, expires_days: Optional[int] = None) -> str:
    """Create JWT refresh token with longer lifetime.
    
    Args:
        subject: User identifier
        expires_days: Token lifetime in days (default 7)
    """
    now = datetime.now(timezone.utc)
    expire_delta = timedelta(days=expires_days or 7)
    expire = now + expire_delta
    
    to_encode = {
        "sub": subject,
        "exp": expire,
        "nbf": now,
        "iss": settings.jwt_issuer,
        "aud": settings.jwt_audience,
        "type": "refresh",  # Explicit type claim
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
            raise ValueError(SecurityMessages.TOKEN_MISSING_SUB)
            
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError(SecurityMessages.TOKEN_EXPIRED)
    except (jwt.JWTError, ValueError) as e:
        raise ValueError(str(e))


def verify_refresh_token(token: str) -> str:
    """Verify refresh token and return subject."""
    try:
        payload = decode_access_token(token)
        if payload.get("type") != "refresh":
            raise ValueError("Invalid token type")
        return payload["sub"]
    except Exception:
        raise ValueError("Invalid refresh token")
        
        return payload
        
    except JWTError as e:
        # Map jose errors to ValueError for consistent exception handling
        raise ValueError(SecurityMessages.INVALID_JWT_TOKEN.format(detail=str(e)))
    except Exception as e:
        raise ValueError(SecurityMessages.TOKEN_VALIDATION_FAILED.format(detail=str(e)))


from fastapi.security import OAuth2PasswordBearer

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login", scheme_name="BearerAuth")
oauth2_scheme_optional = OAuth2PasswordBearer(tokenUrl="/auth/login", scheme_name="BearerAuth", auto_error=False)


def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    """FastAPI dependency for extracting and validating current user from JWT.
    
    Args:
        token: JWT token extracted by OAuth2PasswordBearer
        db: Database session for user lookup
    
    Returns:
        User object if authentication successful
    
    Raises:
        HTTPException 401: If token is missing, invalid, or user not found
    """
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))
    except (KeyError, TypeError):
        raise HTTPException(status_code=401, detail=SecurityMessages.INVALID_TOKEN_PAYLOAD)
    
    if not db:
        raise HTTPException(status_code=500, detail=SecurityMessages.DB_SESSION_REQUIRED)

    user_repo = UserRepository(db)
    user = user_repo.get(user_id)
    if not user:
        raise HTTPException(status_code=401, detail=SecurityMessages.USER_NOT_FOUND)
    
    return user


def get_current_user_optional(token: str | None = Depends(oauth2_scheme_optional), db: Session = Depends(get_db)):
    """FastAPI dependency for optional user authentication.
    
    Returns:
        User object if token is valid, None otherwise.
    """
    if not token:
        return None
    
    try:
        payload = decode_access_token(token)
        user_id = int(payload["sub"])
        repo = UserRepository(db)
        return repo.get(user_id)
    except (ValueError, JWTError):
        return None



class GuestUser:
    """Ephemeral user context for guest sessions."""
    def __init__(self, guest_token: str):
        self.id = None
        self.email = None
        self.role = "GUEST"
        self.guest_token = guest_token
        self.is_guest = True

def get_current_user_or_guest(
    token: str | None = Depends(oauth2_scheme_optional),
    x_guest_token: str | None = Header(None, alias="X-Guest-Token"),
    db: Session = Depends(get_db)
):
    """Authenticate user via Bearer token OR Guest token."""
    # 1. Try Bearer Token (Registered User)
    if token:
        user = get_current_user_optional(token, db)
        if user:
            user.is_guest = False
            return user
            
    # 2. Try Guest Token (Anonymous)
    if x_guest_token:
        # Basic validation of UUID format could go here
        return GuestUser(guest_token=x_guest_token)
        
    # 3. Fail
    raise HTTPException(
        status_code=401, 
        detail=SecurityMessages.AUTHENTICATION_REQUIRED or "Authentication required (Bearer or X-Guest-Token)"
    )

def require_mediator(user, detail: str | None = None) -> None:
    """Ensure the authenticated user has MEDIATOR role.

    Args:
        user: ORM user model returned by `get_current_user`.
        detail: Optional localized message for HTTP 403 errors.

    Raises:
        HTTPException: When `user.role` is not MEDIATOR.
    """
    if getattr(user, "role", None) != "MEDIATOR":
        raise HTTPException(
            status_code=403,
            detail=detail or AuthorizationMessages.MEDIATOR_REQUIRED,
        )
