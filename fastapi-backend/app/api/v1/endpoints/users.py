from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Dict, Any, Union
import uuid
import logging
from ....core.database import get_db
from ....schemas.user import UserCreate, UserResponse, UserUpdate, UserResponseFrontend
from ....services.user_service import UserService
from ....services.minio_service import minio_service
from ....models.user import User
from ...deps import get_current_active_user, get_current_admin_user

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/me", response_model=UserResponseFrontend)
def read_user_me(current_user: User = Depends(get_current_active_user)):
    """Get current user info"""
    response = UserResponseFrontend.from_user(current_user)
    # Generate presigned URL for photo if available
    if response.foto_perfil and response.foto_perfil.strip():
        try:
            # Verificar se já é uma URL completa (não deve acontecer, mas por segurança)
            if response.foto_perfil.startswith('http://') or response.foto_perfil.startswith('https://'):
                # Já é uma URL, manter como está (pode ser uma presigned URL ainda válida)
                pass
            else:
                # É um object_name do MinIO, gerar presigned URL (válida por 7 dias)
                download_url = minio_service.get_download_url(response.foto_perfil, expires_in_seconds=604800)
                response.foto_perfil = download_url
        except Exception as e:
            logger.warning(f"Could not generate presigned URL for foto_perfil: {e}")
            # Se não conseguir gerar URL, limpar foto_perfil para mostrar iniciais
            response.foto_perfil = None
    return response


@router.put("/me", response_model=UserResponseFrontend)
def update_user_me(
    user_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update current user profile"""
    # Only allow updating own profile fields
    allowed_fields = ["name", "email", "telefone", "bio"]
    update_data = {k: v for k, v in user_data.items() if k in allowed_fields}
    
    user_update = UserUpdate(**update_data)
    db_user = UserService.update_user(db, user_id=current_user.id, user_update=user_update)
    
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    response = UserResponseFrontend.from_user(db_user)
    # Generate presigned URL for photo if available
    if response.foto_perfil:
        try:
            download_url = minio_service.get_download_url(response.foto_perfil, expires_in_seconds=604800)
            response.foto_perfil = download_url
        except Exception as e:
            logger.warning(f"Could not generate presigned URL for foto_perfil: {e}")
            pass
    return response


@router.post("/me/upload-photo", response_model=UserResponseFrontend)
def upload_user_photo(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Upload profile photo for current user"""
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Validate file size (max 5MB)
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )
    
    try:
        # Upload to MinIO
        object_name = minio_service.upload_file(file, folder="profile-photos")
        
        # Get download URL (or construct URL based on your setup)
        # For now, we'll store the object_name and construct URL on frontend
        # Or use presigned URL if needed
        foto_url = f"/uploads/profile-photos/{object_name.split('/')[-1]}" if '/' in object_name else f"/uploads/profile-photos/{object_name}"
        
        # Update user with photo URL
        user_update = UserUpdate(foto_perfil=object_name)  # Store MinIO object name
        db_user = UserService.update_user(db, user_id=current_user.id, user_update=user_update)
        
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Return user with photo URL
        response = UserResponseFrontend.from_user(db_user)
        # Override foto_perfil with presigned URL if available
        if response.foto_perfil:
            # Generate presigned URL (valid for 7 days)
            try:
                download_url = minio_service.get_download_url(response.foto_perfil, expires_in_seconds=604800)
                response.foto_perfil = download_url
            except Exception as e:
                # If presigned URL fails, keep the object name
                # Frontend can try to construct URL or request a new presigned URL
                logger.warning(f"Could not generate presigned URL for foto_perfil: {e}")
                # Keep the object_name so frontend knows there's a photo
                pass
        
        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading photo: {str(e)}"
        )


@router.get("/me/stats")
def get_user_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get current user statistics"""
    from sqlalchemy import func
    from ..models.project import Project
    from ..models.atividade import Atividade
    from ..models.lead import Lead
    from ..models.criativo import Criativo
    
    # Contar projetos onde o usuário é owner
    projects_count = db.query(Project).filter(Project.owner_id == current_user.id).count()
    
    # Contar atividades atribuídas ao usuário
    activities_count = db.query(Atividade).filter(Atividade.responsavel_id == current_user.id).count()
    
    # Contar leads criados pelo usuário
    leads_count = db.query(Lead).filter(Lead.criado_por_id == current_user.id).count()
    
    # Contar criativos criados pelo usuário
    criativos_count = db.query(Criativo).filter(Criativo.criado_por_id == current_user.id).count()
    
    # Contar atividades concluídas
    activities_completed = db.query(Atividade).filter(
        Atividade.responsavel_id == current_user.id,
        Atividade.status == "Concluída"
    ).count()
    
    # Contar atividades em andamento
    activities_in_progress = db.query(Atividade).filter(
        Atividade.responsavel_id == current_user.id,
        Atividade.status.in_(["Em Andamento", "Em Desenvolvimento"])
    ).count()
    
    return {
        "projects": projects_count,
        "activities": activities_count,
        "activities_completed": activities_completed,
        "activities_in_progress": activities_in_progress,
        "leads": leads_count,
        "criativos": criativos_count,
    }


@router.put("/me/change-password")
def change_password(
    password_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Change current user password"""
    from ....core.security import verify_password, get_password_hash
    
    old_password = password_data.get("old_password")
    new_password = password_data.get("new_password")
    
    if not old_password or not new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha antiga e nova senha são obrigatórias"
        )
    
    if len(new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A nova senha deve ter pelo menos 6 caracteres"
        )
    
    # Verificar senha antiga
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha antiga incorreta"
        )
    
    # Atualizar senha
    user_update = UserUpdate(password=get_password_hash(new_password))
    db_user = UserService.update_user(db, user_id=current_user.id, user_update=user_update)
    
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Senha alterada com sucesso"}


@router.get("/for-assignment")
def get_users_for_assignment(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get users for assignment (no admin required)"""
    users = UserService.get_users(db, skip=0, limit=1000)
    return [
        {
            "id": str(user.id),
            "name": user.name,
            "email": user.email
        }
        for user in users
        if user.is_active
    ]


@router.get("/", response_model=List[UserResponseFrontend])
@router.get("", response_model=List[UserResponseFrontend])
def read_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get all users (admin only)"""
    users = UserService.get_users(db, skip=skip, limit=limit)
    result = []
    for user in users:
        response = UserResponseFrontend.from_user(user)
        # Generate presigned URL for photo if available
        if response.foto_perfil and response.foto_perfil.strip():
            try:
                # Verificar se já é uma URL completa
                if response.foto_perfil.startswith('http'):
                    # Já é uma URL, manter como está
                    pass
                else:
                    # É um object_name do MinIO, gerar presigned URL
                    download_url = minio_service.get_download_url(response.foto_perfil, expires_in_seconds=604800)
                    response.foto_perfil = download_url
            except Exception as e:
                logger.warning(f"Could not generate presigned URL for foto_perfil: {e}")
                # Se não conseguir gerar URL, limpar foto_perfil para mostrar iniciais
                response.foto_perfil = None
        result.append(response)
    return result


@router.get("/{user_id}", response_model=UserResponseFrontend)
def read_user(
    user_id: Union[str, uuid.UUID],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Get user by ID (admin only)"""
    user = UserService.get_user(db, user_id=user_id)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    response = UserResponseFrontend.from_user(user)
    return response


@router.post("/", response_model=UserResponseFrontend)
def create_user(
    user_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Create new user (admin only) - Compatible with frontend"""
    # Convert frontend data format to internal format
    if "name" in user_data:
        # Frontend format: name -> name + generate username
        name = user_data.get("name", "")
        # Generate username from name (lowercase, no spaces)
        username = name.lower().replace(" ", "_").replace(".", "_")
        
        user_create_data = {
            "name": name,
            "username": username,
            "email": user_data.get("email", ""),
            "password": user_data.get("password", ""),
            "is_active": True,
            "is_admin": user_data.get("role") == "admin"
        }
        
        # Handle setorId - convert to UUID if provided and not "none"
        setor_id = user_data.get("setorId")
        if setor_id and setor_id != "none":
            try:
                user_create_data["setor_id"] = uuid.UUID(setor_id)
            except ValueError:
                # Invalid UUID, ignore
                pass
        
        user = UserCreate(**user_create_data)
    else:
        # Standard API format
        user = UserCreate(**user_data)
    
    # Check if user already exists
    db_user = UserService.get_user_by_email(db, email=user.email)
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    db_user = UserService.get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    created_user = UserService.create_user(db=db, user=user)
    response = UserResponseFrontend.from_user(created_user)
    return response


@router.put("/{user_id}", response_model=UserResponseFrontend)
def update_user(
    user_id: Union[str, uuid.UUID],
    user_data: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Update user (admin only) - Compatible with frontend"""
    # Convert frontend data format to internal format
    if "name" in user_data:
        # Frontend format: name -> name, role -> is_admin, setorId -> setor_id
        update_data = {}
        if user_data.get("name"):
            update_data["name"] = user_data["name"]
            # Also update username based on name
            update_data["username"] = user_data["name"].lower().replace(" ", "_").replace(".", "_")
        if user_data.get("email"):
            update_data["email"] = user_data["email"]
        if user_data.get("password"):
            update_data["password"] = user_data["password"]
        if "role" in user_data:
            update_data["is_admin"] = user_data["role"] == "admin"
        
        # Handle setorId - convert to UUID if provided and not "none"
        if "setorId" in user_data:
            setor_id = user_data.get("setorId")
            if setor_id and setor_id != "none":
                try:
                    update_data["setor_id"] = uuid.UUID(setor_id)
                except ValueError:
                    # Invalid UUID, ignore
                    pass
            else:
                # None or "none" - clear setor
                update_data["setor_id"] = None
        
        user_update = UserUpdate(**update_data)
    else:
        # Standard API format
        user_update = UserUpdate(**user_data)
    
    db_user = UserService.update_user(db, user_id=user_id, user_update=user_update)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponseFrontend.from_user(db_user)


@router.delete("/{user_id}")
def delete_user(
    user_id: Union[str, uuid.UUID],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_admin_user)
):
    """Delete user (admin only)
    
    Antes de excluir, transfere automaticamente:
    - Leads criados pelo usuário para um admin padrão
    - Criativos criados pelo usuário para um admin padrão
    - Remove referências de criativos editados pelo usuário
    - Remove referências de transações financeiras
    """
    try:
        success = UserService.delete_user(db, user_id=user_id)
        if not success:
            raise HTTPException(status_code=404, detail="Usuário não encontrado")
        return {"message": "Usuário excluído com sucesso"}
    except ValueError as e:
        # Erro de validação (ex: usuário é owner de projetos, não há outros usuários)
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        # Outros erros (ex: constraint violation)
        error_msg = str(e)
        # Melhorar mensagem de erro de foreign key
        if "ForeignKeyViolation" in error_msg or "foreign key constraint" in error_msg.lower():
            raise HTTPException(
                status_code=400,
                detail="Não é possível excluir este usuário pois ele possui registros associados que não puderam ser transferidos. Tente desativar o usuário ao invés de excluí-lo."
            )
        raise HTTPException(status_code=500, detail=f"Erro ao excluir usuário: {error_msg}") 