"""
Document AST — Intermediate Representation for paper content.
Decouples frontend structured data from export format (LaTeX, Word, etc.).

Pipeline: Structured JSON → DocumentAST → LaTeX/Word/PDF
"""
from dataclasses import dataclass, field
from typing import List, Optional, Union, Dict, Any


# ---- Leaf-level Runs (inline elements) ----

@dataclass
class TextRun:
    """Plain or styled text."""
    text: str
    bold: bool = False
    italic: bool = False
    subscript: bool = False
    superscript: bool = False


@dataclass
class CitationRun:
    """Inline citation reference."""
    ref_ids: List[str]  # List of cite_keys


@dataclass
class FigureRef:
    """Cross-reference to a figure."""
    figure_label: str  # e.g. "fig:results_chart"


@dataclass
class TableRef:
    """Cross-reference to a table."""
    table_label: str  # e.g. "tab:demographics"


@dataclass
class EquationRef:
    """Cross-reference to an equation."""
    equation_label: str  # e.g. "eq:main_result"


# Union type for any inline run
Run = Union[TextRun, CitationRun, FigureRef, TableRef, EquationRef]


# ---- Block-level Elements ----

@dataclass
class Paragraph:
    """A paragraph containing a sequence of runs."""
    runs: List[Run] = field(default_factory=list)


@dataclass
class Section:
    """A paper section (Introduction, Methods, etc.)."""
    heading: str
    level: int = 1  # 1 = top-level section, 2 = subsection
    paragraphs: List[Paragraph] = field(default_factory=list)
    label: Optional[str] = None  # LaTeX label


@dataclass
class FigureElement:
    """A figure/illustration."""
    figure_id: str
    number: int
    caption: str
    image_path: str
    label: str  # e.g. "fig:results_chart"
    width: Optional[str] = None  # e.g. "0.8\\textwidth"


@dataclass
class TableElement:
    """A data table."""
    table_id: str
    number: int
    caption: str
    headers: List[str] = field(default_factory=list)
    rows: List[List[str]] = field(default_factory=list)
    label: str = ""  # e.g. "tab:demographics"


@dataclass
class EquationElement:
    """A mathematical equation."""
    equation_id: str
    number: int
    latex_code: str  # e.g. "E = mc^{2}"
    label: str = ""  # e.g. "eq:einstein"


@dataclass
class AuthorInfo:
    """Author metadata."""
    first_name: str
    last_name: str
    affiliation: str = ""
    email: str = ""
    orcid: str = ""


@dataclass
class ReferenceElement:
    """A formatted bibliography entry."""
    cite_key: str
    number: int  # Citation number in the paper
    formatted_text: str  # Formatted per citation style
    raw: Dict[str, Any] = field(default_factory=dict)


# ---- Root Document ----

@dataclass
class DocumentAST:
    """Root document node containing all paper content."""
    title: str
    authors: List[AuthorInfo] = field(default_factory=list)
    abstract: Optional[Section] = None
    sections: List[Section] = field(default_factory=list)
    figures: List[FigureElement] = field(default_factory=list)
    tables: List[TableElement] = field(default_factory=list)
    equations: List[EquationElement] = field(default_factory=list)
    references: List[ReferenceElement] = field(default_factory=list)
    citation_style: str = "ieee"  # ieee, apa, vancouver, nature
    journal_template: str = "ieee"  # Template identifier
    keywords: List[str] = field(default_factory=list)
    acknowledgments: Optional[str] = None
    appendices: List[Section] = field(default_factory=list)


# ---- AST Builder — constructs DocumentAST from structured JSON ----

class ASTBuilder:
    """
    Builds a DocumentAST from the structured JSON stored in PaperSection.content_json
    and related tables (PaperFigure, PaperTable, etc.).
    """

    @staticmethod
    def build(
        paper_data: Dict[str, Any],
        sections_data: List[Dict[str, Any]],
        figures_data: List[Dict[str, Any]],
        tables_data: List[Dict[str, Any]],
        equations_data: List[Dict[str, Any]],
        references_data: List[Dict[str, Any]],
        citation_style: str = "ieee",
        journal_template: str = "ieee",
    ) -> DocumentAST:
        """Construct a complete DocumentAST from raw database data."""
        # Parse sections
        parsed_sections = []
        abstract_section = None
        section_order = {
            "introduction": 1,
            "methods": 2,
            "methodology": 2,
            "results": 3,
            "discussion": 4,
            "conclusion": 5,
        }

        for sec in sorted(
            sections_data,
            key=lambda s: section_order.get(s.get("section_name", ""), 99),
        ):
            section_obj = ASTBuilder._parse_section(sec)
            if sec.get("section_name") == "abstract":
                abstract_section = section_obj
            elif sec.get("section_name") not in ("title",):
                parsed_sections.append(section_obj)

        # Parse figures, tables, equations
        figures = [
            FigureElement(
                figure_id=str(f.get("id", "")),
                number=f.get("figure_number", 0),
                caption=f.get("caption", ""),
                image_path=f.get("file_path", ""),
                label=f.get("label", f"fig:{f.get('id', '')}"),
            )
            for f in figures_data
        ]

        parsed_tables = [
            TableElement(
                table_id=str(t.get("id", "")),
                number=t.get("table_number", 0),
                caption=t.get("caption", ""),
                headers=t.get("table_data", {}).get("headers", []),
                rows=t.get("table_data", {}).get("rows", []),
                label=t.get("label", f"tab:{t.get('id', '')}"),
            )
            for t in tables_data
        ]

        parsed_equations = [
            EquationElement(
                equation_id=str(e.get("id", "")),
                number=e.get("equation_number", 0),
                latex_code=e.get("latex_code", ""),
                label=e.get("label", f"eq:{e.get('id', '')}"),
            )
            for e in equations_data
        ]

        # Parse references
        parsed_refs = [
            ReferenceElement(
                cite_key=r.get("cite_key", ""),
                number=idx + 1,
                formatted_text=r.get("formatted_text", ""),
                raw=r,
            )
            for idx, r in enumerate(references_data)
        ]

        return DocumentAST(
            title=paper_data.get("title", ""),
            abstract=abstract_section,
            sections=parsed_sections,
            figures=figures,
            tables=parsed_tables,
            equations=parsed_equations,
            references=parsed_refs,
            citation_style=citation_style,
            journal_template=journal_template,
        )

    @staticmethod
    def _parse_section(sec_data: Dict[str, Any]) -> Section:
        """Parse a single section's content_json into a Section AST node."""
        content = sec_data.get("content_json", {})
        paragraphs = []

        for p_data in content.get("paragraphs", []):
            runs = []
            for r_data in p_data.get("runs", []):
                run_type = r_data.get("type", "text")
                if run_type == "text":
                    runs.append(
                        TextRun(
                            text=r_data.get("text", ""),
                            bold=r_data.get("bold", False),
                            italic=r_data.get("italic", False),
                        )
                    )
                elif run_type == "citation":
                    runs.append(CitationRun(ref_ids=r_data.get("ref_ids", [])))
                elif run_type == "figure_ref":
                    runs.append(FigureRef(figure_label=r_data.get("figure_id", "")))
                elif run_type == "table_ref":
                    runs.append(TableRef(table_label=r_data.get("table_id", "")))
                elif run_type == "equation_ref":
                    runs.append(
                        EquationRef(equation_label=r_data.get("equation_id", ""))
                    )
            if runs:
                paragraphs.append(Paragraph(runs=runs))

        return Section(
            heading=sec_data.get("section_name", "").title(),
            level=1,
            paragraphs=paragraphs,
        )
