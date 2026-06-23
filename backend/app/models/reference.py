"""
Reference and Citation models — bibliography management.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class ReferenceEntry(Base):
    __tablename__ = "reference_entries"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    paper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("papers.id", ondelete="CASCADE"),
        nullable=False,
    )
    ref_type: Mapped[str] = mapped_column(
        String(20), nullable=False, default="article"
    )  # article, book, conference, thesis, webpage
    title: Mapped[str] = mapped_column(String(1000), nullable=False)
    authors: Mapped[dict] = mapped_column(JSONB, default=list)
    # [{"first": "J.", "last": "Smith", "affiliation": "..."}]
    journal: Mapped[str] = mapped_column(String(500), nullable=True)
    year: Mapped[int] = mapped_column(Integer, nullable=True)
    volume: Mapped[str] = mapped_column(String(50), nullable=True)
    issue: Mapped[str] = mapped_column(String(50), nullable=True)
    pages: Mapped[str] = mapped_column(String(50), nullable=True)
    doi: Mapped[str] = mapped_column(String(500), nullable=True)
    url: Mapped[str] = mapped_column(String(1000), nullable=True)
    abstract: Mapped[str] = mapped_column(Text, nullable=True)
    keywords: Mapped[dict] = mapped_column(JSONB, default=list)
    raw_bibtex: Mapped[str] = mapped_column(Text, nullable=True)
    raw_ris: Mapped[str] = mapped_column(Text, nullable=True)
    cite_key: Mapped[str] = mapped_column(String(200), unique=True, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    paper = relationship("Paper", back_populates="references")
    citations = relationship(
        "PaperCitation", back_populates="reference", cascade="all, delete-orphan"
    )


class PaperCitation(Base):
    __tablename__ = "paper_citations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    paper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("papers.id", ondelete="CASCADE"),
        nullable=False,
    )
    reference_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("reference_entries.id", ondelete="CASCADE"),
        nullable=False,
    )
    section_name: Mapped[str] = mapped_column(String(50), nullable=True)
    citation_context: Mapped[str] = mapped_column(Text, nullable=True)
    citation_order: Mapped[int] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    paper = relationship("Paper", back_populates="citations")
    reference = relationship("ReferenceEntry", back_populates="citations")
