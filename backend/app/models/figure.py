"""
Figure, Table, and Equation models — managing display elements.
"""
import uuid
from datetime import datetime
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey, func
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.core.database import Base


class PaperFigure(Base):
    __tablename__ = "paper_figures"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    paper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("papers.id", ondelete="CASCADE"),
        nullable=False,
    )
    figure_number: Mapped[int] = mapped_column(Integer, nullable=False)
    caption: Mapped[str] = mapped_column(Text, nullable=False)
    alt_text: Mapped[str] = mapped_column(String(500), nullable=True)
    file_path: Mapped[str] = mapped_column(String(1000), nullable=True)
    section_name: Mapped[str] = mapped_column(String(50), nullable=True)
    figure_type: Mapped[str] = mapped_column(
        String(50), default="image"
    )  # image, chart, diagram, scheme
    width: Mapped[int] = mapped_column(Integer, nullable=True)
    height: Mapped[int] = mapped_column(Integer, nullable=True)
    dpi: Mapped[int] = mapped_column(Integer, default=300)
    label: Mapped[str] = mapped_column(String(200), nullable=True)  # fig:results_chart
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    paper = relationship("Paper", back_populates="figures")


class PaperTable(Base):
    __tablename__ = "paper_tables"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    paper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("papers.id", ondelete="CASCADE"),
        nullable=False,
    )
    table_number: Mapped[int] = mapped_column(Integer, nullable=False)
    caption: Mapped[str] = mapped_column(Text, nullable=False)
    table_data: Mapped[dict] = mapped_column(JSONB, default=dict)
    # {
    #   "headers": ["Variable", "Mean", "SD", "p-value"],
    #   "rows": [
    #     ["Age", "34.2", "5.1", "-"],
    #     ["Score", "78.5", "12.3", "0.001"]
    #   ]
    # }
    section_name: Mapped[str] = mapped_column(String(50), nullable=True)
    label: Mapped[str] = mapped_column(
        String(200), nullable=True
    )  # tab:demographics
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    paper = relationship("Paper", back_populates="tables")


class PaperEquation(Base):
    __tablename__ = "paper_equations"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    paper_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("papers.id", ondelete="CASCADE"),
        nullable=False,
    )
    equation_number: Mapped[int] = mapped_column(Integer, nullable=False)
    latex_code: Mapped[str] = mapped_column(Text, nullable=False)
    # e.g. "E = mc^{2}"
    section_name: Mapped[str] = mapped_column(String(50), nullable=True)
    label: Mapped[str] = mapped_column(
        String(200), nullable=True
    )  # eq:main_result
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    paper = relationship("Paper", back_populates="equations")
