"""
Pydantic schemas for Phrasebank.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class PhrasebankResponse(BaseModel):
    id: UUID
    section: str
    function_tag: str
    sub_function: Optional[str]
    template_text: str
    slots: Dict[str, Any]
    example_filled: Optional[str]
    academic_level: str
    source: Optional[str]
    usage_count: int

    class Config:
        from_attributes = True


class PhrasebankListRequest(BaseModel):
    section: Optional[str] = None
    function_tag: Optional[str] = None
    academic_level: Optional[str] = None
    search: Optional[str] = None
    limit: int = Field(default=50, ge=1, le=200)
    offset: int = Field(default=0, ge=0)


class PhraseAssembleRequest(BaseModel):
    phrase_id: UUID
    slot_values: Dict[str, str] = Field(default_factory=dict)


class PhraseAssembleResponse(BaseModel):
    phrase_id: UUID
    template_text: str
    filled_text: str
    missing_slots: List[str]


class PhraseFavoriteRequest(BaseModel):
    phrase_id: UUID


class PhraseFavoriteResponse(BaseModel):
    id: UUID
    phrase_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True
