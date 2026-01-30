from pydantic import BaseModel
from typing import Optional, List, TYPE_CHECKING
from datetime import datetime
import uuid

if TYPE_CHECKING:
    from .lead import LeadResponse


class KanbanColumnBase(BaseModel):
    title: str
    order: int = 0
    color: Optional[str] = None


class KanbanColumnCreate(KanbanColumnBase):
    pass


class KanbanColumnUpdate(BaseModel):
    title: Optional[str] = None
    order: Optional[int] = None
    color: Optional[str] = None


class KanbanColumnResponse(KanbanColumnBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: Optional[datetime] = None
    leads: List['LeadResponse'] = []

    class Config:
        from_attributes = True

