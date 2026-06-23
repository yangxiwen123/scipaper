"""
Journal template model — formatting specifications per journal/publisher.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Text, DateTime, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base


class JournalTemplate(Base):
    __tablename__ = "journal_templates"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    journal_name: Mapped[str] = mapped_column(String(200), nullable=False)
    publisher: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # IEEE, Elsevier, Springer, Nature
    latex_template: Mapped[str] = mapped_column(
        Text, nullable=False
    )  # Path to LaTeX template or inline cls content
    citation_style: Mapped[str] = mapped_column(
        String(20), nullable=False
    )  # ieee, apa, vancouver, nature
    formatting_rules: Mapped[dict] = mapped_column(JSONB, default=dict)
    # {
    #   "font_family": "Times New Roman",
    #   "font_size": 10,
    #   "line_spacing": 2.0,
    #   "paper_size": "US letter",
    #   "column_count": 2,
    #   "margin_top": "0.75in",
    #   "margin_bottom": "1in",
    #   "title_case": "upper_and_lower"
    # }
    section_order: Mapped[dict] = mapped_column(JSONB, default=list)
    # ["title", "abstract", "introduction", "methods", "results", "discussion", "conclusion"]
    word_limits: Mapped[dict] = mapped_column(JSONB, default=dict)
    # {"abstract": 250, "introduction": 800, "methods": 1500, "results": 2000, "discussion": 2000}
    figure_specs: Mapped[dict] = mapped_column(JSONB, default=dict)
    # {"dpi": 300, "formats": ["tiff", "eps"], "color_mode": "CMYK", "caption_position": "below"}
    reference_specs: Mapped[dict] = mapped_column(JSONB, default=dict)
    # {"max_refs": 60, "doi_required": true, "numbered": true, "bracket_style": "square"}
    reference_format: Mapped[str] = mapped_column(Text, nullable=True)
    # "[{number}] {authors}, \"{title},\" {journal}, vol. {volume}, pp. {pages}, {year}."
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
