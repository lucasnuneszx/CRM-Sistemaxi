from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import bcrypt
from .config import settings

# Password hashing - suporta múltiplos algoritmos (bcrypt, sha256_crypt, sha512_crypt)
pwd_context = CryptContext(schemes=["bcrypt", "sha256_crypt", "sha512_crypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    try:
        # Try passlib first
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        # Fallback to direct bcrypt
        try:
            if isinstance(plain_password, str):
                plain_password = plain_password.encode('utf-8')
            if isinstance(hashed_password, str):
                hashed_password = hashed_password.encode('utf-8')
            return bcrypt.checkpw(plain_password, hashed_password)
        except Exception:
            return False


def get_password_hash(password: str) -> str:
    """Generate password hash"""
    try:
        return pwd_context.hash(password)
    except Exception:
        # Fallback to direct bcrypt
        if isinstance(password, str):
            password = password.encode('utf-8')
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password, salt)
        return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.jwt_access_token_expire_minutes
        )
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(
        to_encode, 
        settings.jwt_secret_key, 
        algorithm=settings.jwt_algorithm
    )
    return encoded_jwt


def verify_token(token: str) -> Optional[str]:
    """Verify JWT token and return user ID"""
    try:
        payload = jwt.decode(
            token, 
            settings.jwt_secret_key, 
            algorithms=[settings.jwt_algorithm]
        )
        user_id: str = payload.get("sub")
        if user_id is None:
            return None
        return user_id
    except JWTError:
        return None 