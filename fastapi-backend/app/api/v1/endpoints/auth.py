from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ....core.database import get_db
from ....schemas.auth import LoginRequest, Token
from ....services.auth_service import AuthService
from ....api.deps import get_current_active_user
from ....models.user import User
from ....schemas.user import UserResponse

router = APIRouter()


@router.post("/login", response_model=Token)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    """Login endpoint"""
    result = AuthService.login(db, login_data)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "access_token": result["access_token"],
        "token_type": result["token_type"]
    }


@router.get("/test")
def test_endpoint():
    """Test endpoint"""
    return {"status": "ok"}


@router.get("/me")
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    """Get current user information"""
    try:
        return {
            "id": str(current_user.id),
            "name": getattr(current_user, 'name', None) or getattr(current_user, 'username', '') or "Usuário",
            "username": getattr(current_user, 'username', '') or getattr(current_user, 'email', '').split('@')[0] or "user",
            "email": getattr(current_user, 'email', '') or "",
            "is_active": getattr(current_user, 'is_active', True),
            "is_admin": getattr(current_user, 'is_admin', False),
            "role": "admin" if getattr(current_user, 'is_admin', False) else "creative_user",
        }
    except Exception as e:
        print(f"Erro no /me: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Erro ao buscar informações do usuário: {str(e)}"
        )