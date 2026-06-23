"""
Paper and Section API routes.
"""
from uuid import UUID
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.core.database import get_db
from app.models.paper import Paper, PaperSection
from app.schemas.paper import (
    PaperCreate, PaperUpdate, PaperResponse, PaperSummary,
    SectionUpdate, SectionResponse, SectionContent,
)

router = APIRouter(prefix="/api/papers", tags=["papers"])


# ---- Paper CRUD ----

@router.post("", response_model=PaperResponse, status_code=201)
async def create_paper(data: PaperCreate, db: AsyncSession = Depends(get_db)):
    """Create a new paper project."""
    # For MVP: use a default user (in production, get from auth)
    paper = Paper(
        title=data.title,
        journal_target=data.journal_target,
        citation_style=data.citation_style,
        # user_id would come from auth in production
    )
    db.add(paper)
    await db.flush()
    await db.refresh(paper)

    # Auto-create all 7 standard sections
    section_names = [
        "abstract", "introduction", "methods", "results",
        "discussion", "conclusion",
    ]
    for name in section_names:
        section = PaperSection(
            paper_id=paper.id,
            section_name=name,
            content_json={"paragraphs": [], "phrases_used": [], "figures_refs": [], "table_refs": []},
            plain_text="",
            word_count=0,
        )
        db.add(section)

    await db.flush()
    await db.refresh(paper)
    return paper


@router.get("", response_model=List[PaperSummary])
async def list_papers(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List all papers for the current user."""
    query = (
        select(Paper)
        .order_by(Paper.updated_at.desc())
        .offset(offset)
        .limit(limit)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{paper_id}", response_model=PaperResponse)
async def get_paper(paper_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get a single paper by ID."""
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    return paper


@router.patch("/{paper_id}", response_model=PaperResponse)
async def update_paper(
    paper_id: UUID,
    data: PaperUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update paper metadata."""
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(paper, key, value)

    await db.flush()
    await db.refresh(paper)
    return paper


@router.delete("/{paper_id}", status_code=204)
async def delete_paper(paper_id: UUID, db: AsyncSession = Depends(get_db)):
    """Delete a paper and all associated data."""
    result = await db.execute(select(Paper).where(Paper.id == paper_id))
    paper = result.scalar_one_or_none()
    if not paper:
        raise HTTPException(status_code=404, detail="Paper not found")
    await db.delete(paper)
    await db.flush()


# ---- Section CRUD ----

@router.get("/{paper_id}/sections", response_model=List[SectionResponse])
async def list_sections(paper_id: UUID, db: AsyncSession = Depends(get_db)):
    """Get all sections for a paper."""
    query = (
        select(PaperSection)
        .where(PaperSection.paper_id == paper_id)
        .order_by(PaperSection.section_name)
    )
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{paper_id}/sections/{section_name}", response_model=SectionResponse)
async def get_section(
    paper_id: UUID,
    section_name: str,
    db: AsyncSession = Depends(get_db),
):
    """Get a specific section of a paper."""
    result = await db.execute(
        select(PaperSection).where(
            PaperSection.paper_id == paper_id,
            PaperSection.section_name == section_name,
        )
    )
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return section


@router.put("/{paper_id}/sections/{section_name}", response_model=SectionResponse)
async def update_section(
    paper_id: UUID,
    section_name: str,
    data: SectionUpdate,
    db: AsyncSession = Depends(get_db),
):
    """Update a section's content."""
    result = await db.execute(
        select(PaperSection).where(
            PaperSection.paper_id == paper_id,
            PaperSection.section_name == section_name,
        )
    )
    section = result.scalar_one_or_none()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(section, key, value)

    # Auto-calculate word count from plain_text
    if section.plain_text:
        section.word_count = len(section.plain_text.split())

    # Update paper's updated_at
    parent = await db.execute(select(Paper).where(Paper.id == paper_id))
    parent_paper = parent.scalar_one()
    parent_paper.updated_at = func.now()

    await db.flush()
    await db.refresh(section)
    return section
