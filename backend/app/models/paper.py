"""
Paper and PaperSection models — the core domain entities.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Text, Boolean, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class Paper(Base):
    __tablename__ = "papers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(500), default="")
    status: Mapped[str] = mapped_column(
        String(50), default="draft"
    )  # draft, in_progress, completed, exported
    journal_target: Mapped[str] = mapped_column(String(200), nullable=True)
    citation_style: Mapped[str] = mapped_column(
        String(20), default="ieee"
    )  # apa, mla, ieee, nature, vancouver
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    # Relationships
    user = relationship("User", back_populates="papers")
    sections = relationship(
        "PaperSection", back_populates="paper", cascade="all, delete-orphan"
    )
    figures = relationship(
        "PaperFigure", back_populates="paper", cascade="all, delete-orphan"
    )
    tables = relationship(
        "PaperTable", back_populates="paper", cascade="all, delete-orphan"
    )
    equations = relationship(
        "PaperEquation", back_populates="paper", cascade="all, delete-orphan"
    )
    citations = relationship(
        "PaperCitation", back_populates="paper", cascade="all, delete-orphan"
    )
    references = relationship(
        "ReferenceEntry", back_populates="paper", cascade="all, delete-orphan"
    )


class PaperSection(Base):
    __tablename__ = "paper_sections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    paper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("papers.id", ondelete="CASCADE"), nullable=False
    )
    section_name: Mapped[str] = mapped_column(
        String(50), nullable=False
    )  # title, abstract, introduction, methods, results, discussion, conclusion
    content_json: Mapped[dict] = mapped_column(JSONB, default=dict)
    # content_json structure:
    # {
    #   "paragraphs": [
    #     {
    #       "id": "para_1",
    #       "runs": [
    #         {"type": "text", "text": "...", "bold": false, "italic": false},
    #         {"type": "citation", "ref_ids": ["smith2024"]},
    #         {"type": "figure_ref", "figure_id": "uuid"},
    #         {"type": "phrase_slot", "phrase_id": "uuid", "slot_values": {...}}
    #       ]
    #     }
    #   ],
    #   "phrases_used": ["phrase_uuid_1", "phrase_uuid_2"],
    #   "figures_refs": ["fig_uuid_1"],
    #   "table_refs": []
    # }
    plain_text: Mapped[str] = mapped_column(Text, default="")
    word_count: Mapped[int] = mapped_column(Integer, default=0)
    is_complete: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    paper = relationship("Paper", back_populates="sections")
