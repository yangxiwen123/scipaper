"""
Pydantic schemas for the export/formatting module.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime


class ExportRequest(BaseModel):
    paper_id: UUID
    format: str = Field(default="latex")  # "latex", "pdf", "docx"
    journal_template: Optional[str] = None  # e.g. "ieee", "elsevier", "springer", "nature"
    citation_style: Optional[str] = None  # Override paper's default


class ExportResponse(BaseModel):
    paper_id: UUID
    format: str
    file_path: str
    file_size: int
    compile_log: Optional[str] = None  # LaTeX compilation log if applicable
    errors: List[str] = Field(default_factory=list)
    warnings: List[str] = Field(default_factory=list)


class ExportPreCheckResponse(BaseModel):
    paper_id: UUID
    is_ready: bool
    issues: List[Dict[str, Any]] = Field(default_factory=list)
    # Each issue: {"severity": "error|warning", "section": "...", "message": "...", "auto_fix_hint": "..."}


class ValidationIssue(BaseModel):
    rule_id: str
    section: str
    severity: str  # error, warning
    message: str
    auto_fix_hint: Optional[str] = None


class ValidationResult(BaseModel):
    is_valid: bool
    issues: List[ValidationIssue] = Field(default_factory=list)


class GrammarCheckRequest(BaseModel):
    text: str
    language: str = "en-US"
    context: str = "academic"


class GrammarMatch(BaseModel):
    offset: int
    length: int
    message: str
    replacements: List[str] = Field(default_factory=list)
    rule: Optional[str] = None


class GrammarCheckResponse(BaseModel):
    text: str
    matches: List[GrammarMatch] = Field(default_factory=list)


class PlagiarismCheckRequest(BaseModel):
    text: str


class PlagiarismMatch(BaseModel):
    source: str
    text: str
    similarity: float


class PlagiarismCheckResponse(BaseModel):
    similarity_score: float
    matches: List[PlagiarismMatch] = Field(default_factory=list)
