"""
Pydantic schemas for Paper and PaperSection — request/response validation.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


# ---- Paper ----
class PaperCreate(BaseModel):
    title: str = Field(default="", max_length=500)
    journal_target: Optional[str] = None
    citation_style: str = Field(default="ieee")


class PaperUpdate(BaseModel):
    title: Optional[str] = None
    journal_target: Optional[str] = None
    citation_style: Optional[str] = None
    status: Optional[str] = None


class PaperResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    status: str
    journal_target: Optional[str]
    citation_style: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaperSummary(BaseModel):
    """Lightweight paper info for listing."""
    id: UUID
    title: str
    status: str
    journal_target: Optional[str]
    updated_at: datetime

    class Config:
        from_attributes = True


# ---- Paper Section ----
class TextRun(BaseModel):
    type: str  # "text", "citation", "figure_ref", "table_ref", "equation_ref", "phrase_slot"
    text: Optional[str] = None
    bold: bool = False
    italic: bool = False
    ref_ids: Optional[List[str]] = None
    figure_id: Optional[str] = None
    table_id: Optional[str] = None
    equation_id: Optional[str] = None
    phrase_id: Optional[str] = None
    slot_values: Optional[Dict[str, str]] = None


class Paragraph(BaseModel):
    id: str
    runs: List[TextRun] = Field(default_factory=list)


class SectionContent(BaseModel):
    paragraphs: List[Paragraph] = Field(default_factory=list)
    phrases_used: List[str] = Field(default_factory=list)
    figures_refs: List[str] = Field(default_factory=list)
    table_refs: List[str] = Field(default_factory=list)


class SectionUpdate(BaseModel):
    content_json: Optional[SectionContent] = None
    plain_text: Optional[str] = None
    word_count: Optional[int] = None
    is_complete: Optional[bool] = None


class SectionResponse(BaseModel):
    id: UUID
    paper_id: UUID
    section_name: str
    content_json: Dict[str, Any]
    plain_text: str
    word_count: int
    is_complete: bool
    updated_at: datetime

    class Config:
        from_attributes = True
