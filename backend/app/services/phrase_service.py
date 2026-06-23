"""
Phrase Service — manages the academic phrasebank library.
"""
from typing import List, Optional, Dict, Any
from uuid import UUID
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.phrasebank import PhrasebankEntry, UserPhraseFavorite
from app.engines.phrase_assembler import PhraseAssembler, SlotValidationError


class PhraseService:
    """
    Service layer for phrasebank operations.

    Usage:
        service = PhraseService(db_session)
        phrases = await service.search_phrases(section="introduction")
        result = await service.assemble_phrase(phrase_id, slot_values)
    """

    def __init__(self, db: AsyncSession):
        self.db = db

    async def search_phrases(
        self,
        section: Optional[str] = None,
        function_tag: Optional[str] = None,
        academic_level: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0,
    ) -> List[PhrasebankEntry]:
        """
        Search phrases with optional filters.
        """
        query = select(PhrasebankEntry)

        if section:
            query = query.where(PhrasebankEntry.section == section)
        if function_tag:
            query = query.where(PhrasebankEntry.function_tag == function_tag)
        if academic_level:
            query = query.where(PhrasebankEntry.academic_level == academic_level)
        if search:
            search_filter = or_(
                PhrasebankEntry.template_text.ilike(f"%{search}%"),
                PhrasebankEntry.function_tag.ilike(f"%{search}%"),
                PhrasebankEntry.sub_function.ilike(f"%{search}%"),
            )
            query = query.where(search_filter)

        query = query.order_by(
            PhrasebankEntry.usage_count.desc()
        ).offset(offset).limit(limit)

        result = await self.db.execute(query)
        return result.scalars().all()

    async def get_phrase(self, phrase_id: UUID) -> Optional[PhrasebankEntry]:
        """Get a single phrase by ID."""
        result = await self.db.execute(
            select(PhrasebankEntry).where(PhrasebankEntry.id == phrase_id)
        )
        return result.scalar_one_or_none()

    async def assemble_phrase(
        self, phrase_id: UUID, slot_values: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Assemble (fill) a phrase template with user values.
        Increments the phrase's usage_count.
        """
        phrase = await self.get_phrase(phrase_id)
        if not phrase:
            raise ValueError(f"Phrase not found: {phrase_id}")

        result = PhraseAssembler.preview(
            phrase.template_text,
            phrase.slots or {},
            slot_values,
        )

        # Increment usage counter
        phrase.usage_count = (phrase.usage_count or 0) + 1
        await self.db.flush()

        return {
            "phrase_id": str(phrase.id),
            "template_text": phrase.template_text,
            **result,
        }

    async def get_functions_by_section(self) -> Dict[str, List[Dict[str, Any]]]:
        """
        Get all function_tags grouped by section, for building the phrase browser tree.

        Returns:
            {
                "introduction": [
                    {"function_tag": "establishing_territory", "sub_functions": [...], "count": 15},
                    ...
                ],
                ...
            }
        """
        query = (
            select(
                PhrasebankEntry.section,
                PhrasebankEntry.function_tag,
                PhrasebankEntry.sub_function,
                func.count(PhrasebankEntry.id).label("count"),
            )
            .group_by(
                PhrasebankEntry.section,
                PhrasebankEntry.function_tag,
                PhrasebankEntry.sub_function,
            )
            .order_by(
                PhrasebankEntry.section,
                PhrasebankEntry.function_tag,
            )
        )
        result = await self.db.execute(query)
        rows = result.all()

        tree: Dict[str, Dict[str, Any]] = {}
        for row in rows:
            section = row.section
            func_tag = row.function_tag
            sub_func = row.sub_function
            count = row.count

            if section not in tree:
                tree[section] = {}

            if func_tag not in tree[section]:
                tree[section][func_tag] = {
                    "function_tag": func_tag,
                    "sub_functions": [],
                    "total_count": 0,
                }

            tree[section][func_tag]["sub_functions"].append({
                "name": sub_func or "",
                "count": count,
            })
            tree[section][func_tag]["total_count"] += count

        # Convert to list format for frontend tree component
        return {
            section: list(funcs.values())
            for section, funcs in tree.items()
        }

    # ---- Favorites ----

    async def add_favorite(self, user_id: UUID, phrase_id: UUID) -> UserPhraseFavorite:
        """Add a phrase to user's favorites."""
        # Check if already favorited
        existing = await self.db.execute(
            select(UserPhraseFavorite).where(
                UserPhraseFavorite.user_id == user_id,
                UserPhraseFavorite.phrase_id == phrase_id,
            )
        )
        if existing.scalar_one_or_none():
            raise ValueError("Phrase already in favorites")

        favorite = UserPhraseFavorite(user_id=user_id, phrase_id=phrase_id)
        self.db.add(favorite)
        await self.db.flush()
        return favorite

    async def remove_favorite(self, user_id: UUID, phrase_id: UUID) -> bool:
        """Remove a phrase from favorites. Returns True if deleted."""
        result = await self.db.execute(
            select(UserPhraseFavorite).where(
                UserPhraseFavorite.user_id == user_id,
                UserPhraseFavorite.phrase_id == phrase_id,
            )
        )
        favorite = result.scalar_one_or_none()
        if favorite:
            await self.db.delete(favorite)
            await self.db.flush()
            return True
        return False

    async def get_favorites(self, user_id: UUID) -> List[PhrasebankEntry]:
        """Get all favorited phrases for a user."""
        query = (
            select(PhrasebankEntry)
            .join(UserPhraseFavorite, UserPhraseFavorite.phrase_id == PhrasebankEntry.id)
            .where(UserPhraseFavorite.user_id == user_id)
            .order_by(UserPhraseFavorite.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.scalars().all()
