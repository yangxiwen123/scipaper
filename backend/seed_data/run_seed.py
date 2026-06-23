"""
Database seed script — populates phrasebank and journal templates.
Run with: python -m seed_data.run_seed
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from app.core.config import settings
from app.core.database import Base
from app.models.phrasebank import PhrasebankEntry
from app.models.journal import JournalTemplate
from seed_data.phrasebank_seed import PHRASEBANK_SEED
from seed_data.journal_templates_seed import JOURNAL_TEMPLATES_SEED


async def seed_phrasebank(session: AsyncSession):
    """Insert phrasebank entries, skipping duplicates by template_text."""
    count = 0
    for entry in PHRASEBANK_SEED:
        # Check if already exists
        from sqlalchemy import select
        existing = await session.execute(
            select(PhrasebankEntry).where(
                PhrasebankEntry.template_text == entry["template_text"]
            )
        )
        if existing.scalar_one_or_none():
            continue

        phrase = PhrasebankEntry(**entry)
        session.add(phrase)
        count += 1

    await session.flush()
    print(f"  Phrasebank: {count} new entries inserted (total {len(PHRASEBANK_SEED)} in seed)")


async def seed_journal_templates(session: AsyncSession):
    """Insert journal templates, skipping duplicates by journal_name."""
    count = 0
    for entry in JOURNAL_TEMPLATES_SEED:
        from sqlalchemy import select
        existing = await session.execute(
            select(JournalTemplate).where(
                JournalTemplate.journal_name == entry["journal_name"]
            )
        )
        if existing.scalar_one_or_none():
            continue

        template = JournalTemplate(**entry)
        session.add(template)
        count += 1

    await session.flush()
    print(f"  Journal Templates: {count} new entries inserted (total {len(JOURNAL_TEMPLATES_SEED)} in seed)")


async def main():
    """Run all seed operations."""
    print("🌱 Seeding SCI Writer database...")

    engine = create_async_engine(settings.DATABASE_URL, echo=False)

    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        await seed_phrasebank(session)
        await seed_journal_templates(session)
        await session.commit()

    await engine.dispose()
    print("✅ Database seeding complete.")


if __name__ == "__main__":
    asyncio.run(main())
