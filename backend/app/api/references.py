"""
Reference Management API routes.
"""
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.models.reference import ReferenceEntry, PaperCitation
from app.parsers.reference_importer import ReferenceImporter
from app.schemas.reference import (
    ReferenceResponse, ReferenceImportRequest, ReferenceImportResponse,
    CitationCreate, CitationResponse,
)

router = APIRouter(prefix="/api/references", tags=["references"])


@router.get("/paper/{paper_id}", response_model=List[ReferenceResponse])
async def list_references(
    paper_id: UUID,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all references for a paper."""
    query = (
        select(ReferenceEntry)
        .where(ReferenceEntry.paper_id == paper_id)
        .order_by(ReferenceEntry.year.desc(), ReferenceEntry.created_at)
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/import", response_model=ReferenceImportResponse)
async def import_references(
    data: ReferenceImportRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Import references from BibTeX or RIS format.
    Parses the raw data and creates ReferenceEntry records.
    """
    # Auto-detect format if not specified
    fmt = data.format
    if fmt == "auto" or not fmt:
        detected = ReferenceImporter.detect_format(data.raw_data)
        if not detected:
            raise HTTPException(
                status_code=400,
                detail="Could not detect reference format. Please specify 'bibtex' or 'ris'.",
            )
        fmt = detected

    # Parse
    result = ReferenceImporter.parse(data.raw_data, fmt)

    imported = []
    skipped = 0

    for entry_data in result.entries:
        entry_data["paper_id"] = data.paper_id

        # Skip duplicates by cite_key or DOI
        if entry_data.get("cite_key"):
            existing = await db.execute(
                select(ReferenceEntry).where(
                    ReferenceEntry.paper_id == data.paper_id,
                    ReferenceEntry.cite_key == entry_data["cite_key"],
                )
            )
            if existing.scalar_one_or_none():
                skipped += 1
                continue

        ref = ReferenceEntry(**entry_data)
        db.add(ref)
        await db.flush()
        await db.refresh(ref)
        imported.append(ref)

    await db.flush()

    return ReferenceImportResponse(
        imported_count=len(imported),
        skipped_count=skipped + result.skipped_count,
        entries=[ReferenceResponse.model_validate(r) for r in imported],
    )


@router.post("/import/file", response_model=ReferenceImportResponse)
async def import_references_file(
    paper_id: UUID = Form(...),
    file: UploadFile = File(...),
    format: str = Form(default="auto"),
    db: AsyncSession = Depends(get_db),
):
    """Import references from an uploaded .bib or .ris file."""
    content = await file.read()
    raw_data = content.decode("utf-8", errors="replace")

    req = ReferenceImportRequest(
        paper_id=paper_id,
        raw_data=raw_data,
        format=format,
    )
    return await import_references(req, db)


@router.delete("/{reference_id}", status_code=204)
async def delete_reference(
    reference_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """Delete a reference entry."""
    result = await db.execute(
        select(ReferenceEntry).where(ReferenceEntry.id == reference_id)
    )
    ref = result.scalar_one_or_none()
    if not ref:
        raise HTTPException(status_code=404, detail="Reference not found")
    await db.delete(ref)
    await db.flush()


# ---- Citations (paper-reference cross-references) ----

@router.get("/paper/{paper_id}/citations", response_model=List[CitationResponse])
async def list_citations(
    paper_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    """List all citation instances in a paper (ordered by appearance)."""
    query = (
        select(PaperCitation)
        .where(PaperCitation.paper_id == paper_id)
        .order_by(PaperCitation.citation_order)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.post("/paper/{paper_id}/citations", response_model=CitationResponse, status_code=201)
async def create_citation(
    paper_id: UUID,
    data: CitationCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a citation link between a paper section and a reference."""
    # Get next citation order
    max_order_result = await db.execute(
        select(PaperCitation.citation_order)
        .where(PaperCitation.paper_id == paper_id)
        .order_by(PaperCitation.citation_order.desc())
        .limit(1)
    )
    max_order = max_order_result.scalar_one_or_none()

    citation = PaperCitation(
        paper_id=paper_id,
        reference_id=data.reference_id,
        section_name=data.section_name,
        citation_context=data.citation_context,
        citation_order=(max_order or 0) + 1,
    )
    db.add(citation)
    await db.flush()
    await db.refresh(citation)
    return citation
