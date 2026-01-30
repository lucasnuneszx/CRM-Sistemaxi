from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from pydantic import BaseModel
from ....core.database import get_db
from ....schemas.kanban_column import KanbanColumnCreate, KanbanColumnResponse, KanbanColumnUpdate
from ....services.kanban_column_service import KanbanColumnService
from ....models.user import User
from ...deps import get_current_active_user

router = APIRouter()


class ReorderColumnsRequest(BaseModel):
    columns: List[dict]  # [{"id": "uuid", "order": 0}]


@router.get("/", response_model=List[KanbanColumnResponse])
@router.get("", response_model=List[KanbanColumnResponse])
def read_columns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all kanban columns"""
    columns = KanbanColumnService.get_columns(db)
    return columns


@router.get("/{column_id}", response_model=KanbanColumnResponse)
def read_column(
    column_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get column by ID"""
    column = KanbanColumnService.get_column(db, column_id=column_id)
    if column is None:
        raise HTTPException(status_code=404, detail="Column not found")
    return column


@router.post("/", response_model=KanbanColumnResponse)
@router.post("", response_model=KanbanColumnResponse)
def create_column(
    column: KanbanColumnCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create new kanban column"""
    return KanbanColumnService.create_column(db=db, column=column)


@router.put("/{column_id}", response_model=KanbanColumnResponse)
def update_column(
    column_id: UUID,
    column_update: KanbanColumnUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update kanban column"""
    column = KanbanColumnService.get_column(db, column_id=column_id)
    if column is None:
        raise HTTPException(status_code=404, detail="Column not found")
    
    updated_column = KanbanColumnService.update_column(db, column_id=column_id, column_update=column_update)
    return updated_column


@router.delete("/{column_id}")
def delete_column(
    column_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete kanban column"""
    column = KanbanColumnService.get_column(db, column_id=column_id)
    if column is None:
        raise HTTPException(status_code=404, detail="Column not found")
    
    success = KanbanColumnService.delete_column(db, column_id=column_id)
    if not success:
        raise HTTPException(status_code=404, detail="Column not found")
    
    return {"message": "Column deleted successfully"}


@router.post("/reorder", response_model=List[KanbanColumnResponse])
def reorder_columns(
    request: ReorderColumnsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Reorder kanban columns"""
    columns = KanbanColumnService.reorder_columns(db, request.columns)
    return columns


