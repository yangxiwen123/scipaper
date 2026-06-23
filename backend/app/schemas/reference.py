"""
Pydantic schemas for Reference management.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class ReferenceResponse(BaseModel):
    id: UUID
    paper_id: UUID
    ref_type: str
    title: str
    authors: List[Dict[str, str]]
    journal: Optional[str]
    year: Optional[int]
    volume: Optional[str]
    issue: Optional[str]
    pages: Optional[str]
    doi: Optional[str]
    url: Optional[str]
    cite_key: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class ReferenceImportRequest(BaseModel):
    paper_id: UUID
    raw_data: str  # Raw BibTeX or RIS string
    format: str = "bibtex"  # "bibtex" or "ris"


class ReferenceImportResponse(BaseModel):
    imported_count: int
    skipped_count: int
    entries: List[ReferenceResponse]


class CitationCreate(BaseModel):
    reference_id: UUID
    section_name: str
    citation_context: Optional[str] = None


class CitationResponse(BaseModel):
    id: UUID
    paper_id: UUID
    reference_id: UUID
    section_name: Optional[str]
    citation_context: Optional[str]
    citation_order: Optional[int]

    class Config:
        from_attributes = True


class CitationReorderRequest(BaseModel):
    """Re-order citations by providing the new order of citation IDs."""
    citation_ids: List[UUID]
