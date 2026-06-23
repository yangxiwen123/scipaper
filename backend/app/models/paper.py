"""
Paper and PaperSection models — the core domain entities.

These models store paper content as PostgreSQL JSONB, enabling
structured paragraph/run storage while retaining full SQL query
capabilities. The content_json field maps directly to the
DocumentAST Section → Paragraph → Run type hierarchy.
"""
import uuid
from datetime import datetime
from typing import Optional, TYPE_CHECKING

from sqlalchemy import (
    String, Integer, Text, Boolean, DateTime, ForeignKey, func,
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.engines.document_ast import Section as ASTSection
    from app.models.figure import PaperFigure, PaperTable, PaperEquation
    from app.models.reference import ReferenceEntry, PaperCitation
    from app.models.user import User


class Paper(Base):
    """The top-level paper record.

    Each paper has exactly one owner (user), one target journal template,
    and one citation style. All content lives in the related PaperSection
    records, not here.

    Status lifecycle: draft → in_progress → completed → exported
    """
    __tablename__ = "papers"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
        comment="Primary key",
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False,
        comment="Owner of this paper",
    )
    title: Mapped[str] = mapped_column(
        String(500), default="",
        comment="Paper title (may be updated during writing)",
    )
    status: Mapped[str] = mapped_column(
        String(50), default="draft",
        comment="draft | in_progress | completed | exported",
    )
    journal_target: Mapped[Optional[str]] = mapped_column(
        String(200), nullable=True,
        comment="Target journal name (e.g., 'IEEE Trans. on ...')",
    )
    citation_style: Mapped[str] = mapped_column(
        String(20), default="ieee",
        comment="ieee | apa | vancouver | nature | mla",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )

    # ---- Relationships ----
    user: Mapped["User"] = relationship("User", back_populates="papers")
    sections: Mapped[list["PaperSection"]] = relationship(
        "PaperSection", back_populates="paper", cascade="all, delete-orphan",
        order_by="PaperSection.section_name",
    )
    figures: Mapped[list["PaperFigure"]] = relationship(
        "PaperFigure", back_populates="paper", cascade="all, delete-orphan",
    )
    tables: Mapped[list["PaperTable"]] = relationship(
        "PaperTable", back_populates="paper", cascade="all, delete-orphan",
    )
    equations: Mapped[list["PaperEquation"]] = relationship(
        "PaperEquation", back_populates="paper", cascade="all, delete-orphan",
    )
    citations: Mapped[list["PaperCitation"]] = relationship(
        "PaperCitation", back_populates="paper", cascade="all, delete-orphan",
    )
    references: Mapped[list["ReferenceEntry"]] = relationship(
        "ReferenceEntry", back_populates="paper", cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<Paper id={self.id} title={self.title[:40]!r} status={self.status}>"


# ============================================================================
# Content JSON Schema (documented here as the single source of truth)
# ============================================================================
#
# The content_json field on PaperSection stores paragraphs as a JSONB array.
# This is the canonical structure:
#
# {
#   "paragraphs": [
#     {
#       "id": "para_uuid_v4",
#       "runs": [
#         {"type": "text", "text": "Hello", "bold": false, "italic": false,
#          "subscript": false, "superscript": false},
#         {"type": "citation", "ref_ids": ["smith2024nature"]},
#         {"type": "figure_ref", "figure_label": "fig:results_chart"},
#         {"type": "table_ref", "table_label": "tab:demographics"},
#         {"type": "equation_ref", "equation_label": "eq:main_result"},
#         {"type": "phrase_slot", "phrase_id": "uuid",
#          "template_text": "...{slot}...",
#          "slot_values": {"slot": "user value"},
#          "filled_text": "final assembled text"}
#       ]
#     }
#   ],
#   "phrases_used": ["phrase_uuid_1", "phrase_uuid_2"],
#   "figures_refs": ["fig_uuid_1"],
#   "table_refs": [],
#   "equation_refs": []
# }
# ============================================================================

class PaperSection(Base):
    """A single section of a paper (Introduction, Methods, etc.).

    The content_json field stores the structured paragraph data as
    PostgreSQL JSONB — this is the primary content store. The
    plain_text field is a denormalized text version used for
    full-text search and grammar checking.

    To deserialize content_json into the typed Document AST:
        >>> section = Section.from_dict(paper_section.content_json)

    To serialize back:
        >>> content_dict = section.to_dict()
        >>> paper_section.content_json = content_dict
    """
    __tablename__ = "paper_sections"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4,
    )
    paper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("papers.id", ondelete="CASCADE"),
        nullable=False, index=True,
    )
    section_name: Mapped[str] = mapped_column(
        String(50), nullable=False,
        comment="abstract | introduction | methods | results | discussion | conclusion",
    )
    content_json: Mapped[dict] = mapped_column(
        JSONB, default=dict,
        comment="Structured content: {paragraphs: [{id, runs: [{type, ...}]}], ...}",
    )
    plain_text: Mapped[str] = mapped_column(
        Text, default="",
        comment="Denormalized full text for search / grammar check",
    )
    word_count: Mapped[int] = mapped_column(
        Integer, default=0,
        comment="Cached word count (recalculated on save)",
    )
    is_complete: Mapped[bool] = mapped_column(
        Boolean, default=False,
        comment="Has the user marked this section as complete?",
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(),
    )

    # ---- Relationships ----
    paper: Mapped["Paper"] = relationship("Paper", back_populates="sections")

    # ---- Computed Properties ----

    @property
    def paragraph_count(self) -> int:
        """Number of paragraphs in this section."""
        paragraphs = self.content_json.get("paragraphs", []) if self.content_json else []
        return len(paragraphs)

    @property
    def citation_count(self) -> int:
        """Number of inline citations in this section."""
        if not self.content_json:
            return 0
        count = 0
        for p in self.content_json.get("paragraphs", []):
            for r in p.get("runs", []):
                if r.get("type") == "citation":
                    count += 1
        return count

    # ---- AST Bridge Methods ----

    def to_ast_section(self, heading: Optional[str] = None) -> "ASTSection":
        """Convert this PaperSection's content_json into a typed AST Section.

        This is the bridge from database → AST. Callers typically use
        ASTBuilder instead of calling this directly.

        Args:
            heading: Override heading text. If None, uses section_name.title().

        Returns:
            An immutable Section node from the Document AST.
        """
        from app.engines.document_ast import Section, Paragraph

        content: dict = self.content_json or {}
        raw_paragraphs: list = content.get("paragraphs", [])
        paragraphs = [Paragraph.from_dict(p) for p in raw_paragraphs]

        return Section(
            heading=heading or self.section_name.replace("_", " ").title(),
            level=1,
            paragraphs=paragraphs,
        )

    def update_from_ast_section(self, section: "ASTSection") -> None:
        """Replace this PaperSection's content_json with data from an AST Section.

        After calling this, you must still flush/commit the SQLAlchemy session.

        Args:
            section: An AST Section node to serialize back to JSONB.
        """
        self.content_json = section.to_dict()
        self.word_count = section.word_count

        # Rebuild plain_text for full-text search
        texts: list[str] = []
        for p in section.paragraphs:
            texts.append(p.extract_plain_text())
        self.plain_text = "\n\n".join(texts)

    def __repr__(self) -> str:
        return (
            f"<PaperSection paper_id={self.paper_id} "
            f"section={self.section_name!r} "
            f"paragraphs={self.paragraph_count} words={self.word_count}>"
        )
