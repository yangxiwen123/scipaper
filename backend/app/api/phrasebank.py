"""
Phrasebank API routes — search, assemble, favorites.
"""
from uuid import UUID
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.services.phrase_service import PhraseService
from app.schemas.phrasebank import (
    PhrasebankResponse, PhrasebankListRequest,
    PhraseAssembleRequest, PhraseAssembleResponse,
    PhraseFavoriteRequest, PhraseFavoriteResponse,
)

router = APIRouter(prefix="/api/phrasebank", tags=["phrasebank"])


def get_phrase_service(db: AsyncSession = Depends(get_db)) -> PhraseService:
    return PhraseService(db)


@router.get("/categories")
async def get_categories(service: PhraseService = Depends(get_phrase_service)):
    """
    Get the phrasebank category tree for building the browser UI.
    Returns sections -> function_tags -> sub_functions with counts.
    """
    tree = await service.get_functions_by_section()
    return tree


@router.get("/search", response_model=List[PhrasebankResponse])
async def search_phrases(
    section: Optional[str] = Query(None, description="Filter by section"),
    function_tag: Optional[str] = Query(None, description="Filter by function"),
    academic_level: Optional[str] = Query(None, description="basic/intermediate/advanced"),
    search: Optional[str] = Query(None, description="Full-text search in template text"),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    service: PhraseService = Depends(get_phrase_service),
):
    """Search phrases with optional filters."""
    phrases = await service.search_phrases(
        section=section,
        function_tag=function_tag,
        academic_level=academic_level,
        search=search,
        limit=limit,
        offset=offset,
    )
    return phrases


@router.post("/assemble", response_model=PhraseAssembleResponse)
async def assemble_phrase(
    data: PhraseAssembleRequest,
    service: PhraseService = Depends(get_phrase_service),
):
    """
    Assemble (fill) a phrase template with user-provided slot values.
    Returns the filled text and validation info.
    """
    try:
        result = await service.assemble_phrase(data.phrase_id, data.slot_values)
        return result
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=422, detail=str(e))


@router.get("/favorites", response_model=List[PhrasebankResponse])
async def get_favorites(
    service: PhraseService = Depends(get_phrase_service),
    db: AsyncSession = Depends(get_db),
):
    """Get user's favorited phrases."""
    # For MVP: use a default user_id
    # In production, get user_id from auth
    return []


@router.post("/favorites", response_model=PhraseFavoriteResponse)
async def add_favorite(
    data: PhraseFavoriteRequest,
    service: PhraseService = Depends(get_phrase_service),
):
    """Add a phrase to user's favorites."""
    # MVP: placeholder — requires auth
    raise HTTPException(status_code=501, detail="Authentication required for favorites")


@router.delete("/favorites/{phrase_id}", status_code=204)
async def remove_favorite(
    phrase_id: UUID,
    service: PhraseService = Depends(get_phrase_service),
):
    """Remove a phrase from favorites."""
    raise HTTPException(status_code=501, detail="Authentication required for favorites")
