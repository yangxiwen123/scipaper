"""
Export API routes — PDF/LaTeX/Word generation.
"""
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import os

from app.core.database import get_db
from app.core.config import settings
from app.models.paper import Paper, PaperSection
from app.models.reference import ReferenceEntry, PaperCitation
from app.models.figure import PaperFigure, PaperTable, PaperEquation
from app.models.journal import JournalTemplate
from app.services.export_service import ExportService
from app.services.validation_service import ValidationService
from app.schemas.export import (
    ExportRequest, ExportResponse, ExportPreCheckResponse,
    ValidationResult, ValidationIssue,
)

router = APIRouter(prefix="/api/export", tags=["export"])


def get_export_service() -> ExportService:
    return ExportService(
        template_dir=settings.TEMPLATE_DIR,
        export_dir=settings.EXPORT_DIR,
        xelatex_path=settings.XELATEX_PATH,
    )


@router.post("/validate/{paper_id}", response_model=ExportPreCheckResponse)
async def validate_before_export(
    paper_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """
    Run pre-export validation checks on a paper.
    Returns all issues found, categorized by severity.
    """
    # Load paper and all sections
    paper_result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = paper_result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    sections_result = await db.execute(
        select(PaperSection).where(PaperSection.paper_id == paper_id)
    )
    sections = {s.section_name: s for s in sections_result.scalars().all()}

    # Count related items
    figures_count = (await db.execute(
        select(PaperFigure).where(PaperFigure.paper_id == paper_id)
    )).scalars().first() is not None

    citations_count = (await db.execute(
        select(PaperCitation).where(PaperCitation.paper_id == paper_id)
    )).scalars().first() is not None

    refs_count = (await db.execute(
        select(ReferenceEntry).where(ReferenceEntry.paper_id == paper_id)
    )).scalars().first() is not None

    # Run validation
    service = ValidationService()
    sections_data = {
        name: {
            **s.__dict__,
            "citation_count": len(
                s.content_json.get("phrases_used", []) if s.content_json else []
            ),
        }
        for name, s in sections.items()
    }

    result = service.validate_paper(
        sections=sections_data,
        figures_count=1 if figures_count else 0,
        tables_count=1,
        citations_count=1 if citations_count else 0,
        references_count=1 if refs_count else 0,
    )

    issues = [
        {
            "rule_id": i.rule_id,
            "section": i.section,
            "severity": i.severity,
            "message": i.message,
            "auto_fix_hint": i.auto_fix_hint,
        }
        for i in result.issues
    ]

    return ExportPreCheckResponse(
        paper_id=paper_id,
        is_ready=result.is_valid,
        issues=issues,
    )


@router.post("/compile/{paper_id}", response_model=ExportResponse)
async def export_paper(
    paper_id: UUID,
    format: str = Query(default="pdf", regex="^(pdf|latex|docx)$"),
    journal_template: str = Query(default="ieee"),
    db: AsyncSession = Depends(get_db),
    export_service: ExportService = Depends(get_export_service),
):
    """
    Export (compile) a paper to PDF, LaTeX, or Word format.

    Pipeline: DB → DocumentAST → LaTeX/Word → PDF
    """
    # Load paper
    paper_result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = paper_result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    paper_data = {
        "id": str(paper.id),
        "title": paper.title,
        "citation_style": paper.citation_style,
        "journal_target": paper.journal_target or journal_template,
    }

    # Load sections
    sections_result = await db.execute(
        select(PaperSection).where(PaperSection.paper_id == paper_id)
    )
    sections_data = [
        {
            "id": str(s.id), "section_name": s.section_name,
            "content_json": s.content_json or {}, "plain_text": s.plain_text or "",
            "word_count": s.word_count or 0,
        }
        for s in sections_result.scalars().all()
    ]

    # Load figures
    figures_result = await db.execute(
        select(PaperFigure).where(PaperFigure.paper_id == paper_id)
    )
    figures_data = [
        {
            "id": str(f.id), "figure_number": f.figure_number or 0,
            "caption": f.caption or "", "file_path": f.file_path or "",
            "section_name": f.section_name or "", "label": f.label or f"fig:{f.id}",
        }
        for f in figures_result.scalars().all()
    ]

    # Load tables
    tables_result = await db.execute(
        select(PaperTable).where(PaperTable.paper_id == paper_id)
    )
    tables_data = [
        {
            "id": str(t.id), "table_number": t.table_number or 0,
            "caption": t.caption or "", "table_data": t.table_data or {},
            "section_name": t.section_name or "", "label": t.label or f"tab:{t.id}",
        }
        for t in tables_result.scalars().all()
    ]

    # Load equations
    equations_result = await db.execute(
        select(PaperEquation).where(PaperEquation.paper_id == paper_id)
    )
    equations_data = [
        {
            "id": str(e.id), "equation_number": e.equation_number or 0,
            "latex_code": e.latex_code or "", "section_name": e.section_name or "",
            "label": e.label or f"eq:{e.id}",
        }
        for e in equations_result.scalars().all()
    ]

    # Load references
    refs_result = await db.execute(
        select(ReferenceEntry).where(ReferenceEntry.paper_id == paper_id)
    )
    references_data = [
        {
            "id": str(r.id), "ref_type": r.ref_type, "title": r.title or "",
            "authors": r.authors or [], "journal": r.journal or "",
            "year": r.year, "volume": r.volume, "issue": r.issue,
            "pages": r.pages, "doi": r.doi, "cite_key": r.cite_key,
        }
        for r in refs_result.scalars().all()
    ]

    # Run export
    result = export_service.export(
        paper_data=paper_data,
        sections_data=sections_data,
        figures_data=figures_data,
        tables_data=tables_data,
        equations_data=equations_data,
        references_data=references_data,
        export_format=format,
        journal_template=journal_template or paper.citation_style,
        citation_style=paper.citation_style,
    )

    return ExportResponse(
        paper_id=paper_id,
        format=result.format,
        file_path=result.file_path,
        file_size=result.file_size,
        compile_log=result.compile_log,
        errors=result.errors,
        warnings=result.warnings,
    )


@router.get("/download/{paper_id}")
async def download_export(
    paper_id: UUID,
    format: str = Query(default="pdf", regex="^(pdf|latex|docx)$"),
    db: AsyncSession = Depends(get_db),
    export_service: ExportService = Depends(get_export_service),
):
    """
    Export and immediately download the compiled file.
    """
    # First, compile
    export_result = await export_paper(
        paper_id=paper_id, format=format, db=db, export_service=export_service
    )

    if not export_result.file_path or not os.path.exists(export_result.file_path):
        raise HTTPException(
            status_code=500,
            detail=f"Compilation failed: {export_result.errors}",
        )

    content_types = {
        "pdf": "application/pdf",
        "latex": "application/x-tex",
        "docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    }

    filename = f"paper_{paper_id}.{format if format != 'latex' else 'tex'}"

    return FileResponse(
        path=export_result.file_path,
        media_type=content_types.get(format, "application/octet-stream"),
        filename=filename,
    )


@router.get("/templates")
async def list_templates(db: AsyncSession = Depends(get_db)):
    """List available journal templates."""
    result = await db.execute(select(JournalTemplate).order_by(JournalTemplate.publisher))
    templates = result.scalars().all()
    return [
        {
            "id": str(t.id),
            "journal_name": t.journal_name,
            "publisher": t.publisher,
            "citation_style": t.citation_style,
            "formatting_rules": t.formatting_rules,
            "word_limits": t.word_limits,
        }
        for t in templates
    ]
