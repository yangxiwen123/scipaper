"""
Phrasebank models — the academic sentence template library.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PhrasebankEntry(Base):
    __tablename__ = "phrasebank"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    section: Mapped[str] = mapped_column(
        String(50), nullable=False, index=True
    )  # introduction, methods, results, discussion
    function_tag: Mapped[str] = mapped_column(
        String(100), nullable=False, index=True
    )  # establishing_territory, describing_trends, comparing_findings
    sub_function: Mapped[str] = mapped_column(
        String(100), nullable=True
    )  # increasing_trend, significant_difference
    template_text: Mapped[str] = mapped_column(Text, nullable=False)
    # e.g. "A significant {direction} was observed in {variable} (p < {value})"
    slots: Mapped[dict] = mapped_column(JSONB, default=dict)
    # e.g. {"direction": {"type": "select", "options": ["increase", "decrease"]},
    #       "variable": {"type": "text", "hint": "name of measured variable"},
    #       "value": {"type": "number", "hint": "p-value"}}
    example_filled: Mapped[str] = mapped_column(Text, nullable=True)
    # e.g. "A significant increase was observed in reaction time (p < 0.01)"
    academic_level: Mapped[str] = mapped_column(
        String(20), default="intermediate"
    )  # basic, intermediate, advanced
    source: Mapped[str] = mapped_column(String(255), nullable=True)
    usage_count: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )


class UserPhraseFavorite(Base):
    __tablename__ = "user_phrase_favorites"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    phrase_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("phrasebank.id", ondelete="CASCADE"),
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user = relationship("User", back_populates="phrase_favorites")
