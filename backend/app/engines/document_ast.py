"""
Document AST — Intermediate Representation for paper content.
Decouples frontend structured data from export format (LaTeX, Word, etc.).

Pipeline: Structured JSON (PostgreSQL JSONB) → DocumentAST → LaTeX/Word/PDF

This module is the architectural cornerstone of the entire system.
Every export format shares this single compilation pipeline — adding
a new output format requires only a new Compiler class.

Key design decisions:
  - All AST nodes are frozen dataclasses (immutable after construction)
  - Serialization is bidirectional: dict ←→ AST (for JSONB round-trips)
  - Validation happens at the boundary (from_dict) — never silently corrupts
  - Type hints are complete and serve as living documentation
"""
from __future__ import annotations

import uuid
from dataclasses import dataclass, field, asdict
from typing import (
    Any, Dict, List, Optional, Type, TypeVar, Union, cast, get_args, get_origin,
)


# ============================================================================
# Type Aliases
# ============================================================================

# Union of all possible inline Run types
Run = Union[
    "TextRun", "CitationRun", "FigureRef", "TableRef", "EquationRef"
]

# JSON-compatible primitive types
JsonPrimitive = Union[str, int, float, bool, None]
JsonValue = Union[JsonPrimitive, List[Any], Dict[str, Any]]
JsonDict = Dict[str, JsonValue]


# ============================================================================
# Leaf-level Runs (inline elements within a Paragraph)
# ============================================================================

@dataclass(frozen=True)
class TextRun:
    """Plain or styled inline text.

    This is the most common Run type — every character the user types
    is stored as a TextRun. Styling is minimal by design (bold/italic
    and subscript/superscript cover 95% of academic formatting needs).

    Attributes:
        text: The raw text content. LaTeX special characters will be
              escaped by the Compiler, not here.
        bold: Whether this span should render as bold.
        italic: Whether this span should render as italic.
        subscript: Render as subscript (e.g., chemical formulas).
        superscript: Render as superscript (e.g., footnote markers).
    """
    type: str = "text"  # discriminator field for JSONB storage
    text: str = ""
    bold: bool = False
    italic: bool = False
    subscript: bool = False
    superscript: bool = False

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "TextRun":
        return cls(
            type="text",
            text=str(d.get("text", "")),
            bold=bool(d.get("bold", False)),
            italic=bool(d.get("italic", False)),
            subscript=bool(d.get("subscript", False)),
            superscript=bool(d.get("superscript", False)),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "text",
            "text": self.text,
            "bold": self.bold,
            "italic": self.italic,
            "subscript": self.subscript,
            "superscript": self.superscript,
        }


@dataclass(frozen=True)
class CitationRun:
    """Inline citation reference.

    Holds one or more cite_keys that will be resolved to sequential
    numbers during export. Multiple cite_keys in one CitationRun
    produce compact citations like [1,3-5] or (Smith, 2024; Doe, 2023).

    Attributes:
        ref_ids: List of cite_key strings (e.g., ["smith2024nature"]).
    """
    type: str = "citation"
    ref_ids: List[str] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "CitationRun":
        return cls(
            type="citation",
            ref_ids=[str(r) for r in d.get("ref_ids", [])],
        )

    def to_dict(self) -> Dict[str, Any]:
        return {"type": "citation", "ref_ids": list(self.ref_ids)}


@dataclass(frozen=True)
class FigureRef:
    """Cross-reference anchor pointing to a Figure.

    During LaTeX compilation this becomes Fig.~\ref{fig:label}.
    During Word compilation it resolves to "Fig. 3".

    Attributes:
        figure_label: The LaTeX label (e.g., "fig:results_chart") or
                      the UUID string of the figure record.
    """
    type: str = "figure_ref"
    figure_label: str = ""

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "FigureRef":
        return cls(
            type="figure_ref",
            figure_label=str(d.get("figure_label", "") or d.get("figure_id", "")),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {"type": "figure_ref", "figure_label": self.figure_label}


@dataclass(frozen=True)
class TableRef:
    """Cross-reference anchor pointing to a Table.

    Analogous to FigureRef but for tables. During LaTeX compilation
    this becomes Table~\ref{tab:label}.

    Attributes:
        table_label: The LaTeX label or table record UUID.
    """
    type: str = "table_ref"
    table_label: str = ""

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "TableRef":
        return cls(
            type="table_ref",
            table_label=str(d.get("table_label", "") or d.get("table_id", "")),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {"type": "table_ref", "table_label": self.table_label}


@dataclass(frozen=True)
class EquationRef:
    """Cross-reference anchor pointing to an Equation.

    During LaTeX compilation this becomes Eq.~\ref{eq:label}.

    Attributes:
        equation_label: The LaTeX label or equation record UUID.
    """
    type: str = "equation_ref"
    equation_label: str = ""

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "EquationRef":
        return cls(
            type="equation_ref",
            equation_label=str(d.get("equation_label", "") or d.get("equation_id", "")),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {"type": "equation_ref", "equation_label": self.equation_label}


@dataclass(frozen=True)
class PhraseSlotRun:
    """A phrasebank template that has been inserted into the text.

    This is NOT an AI-generated run — it is a hand-authored sentence
    template where the user has filled in slot variables. It is stored
    as a distinct Run type so the frontend can render it with slot
    highlighting and allow re-editing.

    Attributes:
        phrase_id: UUID of the PhrasebankEntry used.
        template_text: The original template with {slots}.
        slot_values: User-provided values keyed by slot name.
        filled_text: The fully assembled text after slot substitution.
    """
    type: str = "phrase_slot"
    phrase_id: str = ""
    template_text: str = ""
    slot_values: Dict[str, str] = field(default_factory=dict)
    filled_text: str = ""

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "PhraseSlotRun":
        return cls(
            type="phrase_slot",
            phrase_id=str(d.get("phrase_id", "")),
            template_text=str(d.get("template_text", "")),
            slot_values={str(k): str(v) for k, v in d.get("slot_values", {}).items()},
            filled_text=str(d.get("filled_text", "")),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "type": "phrase_slot",
            "phrase_id": self.phrase_id,
            "template_text": self.template_text,
            "slot_values": dict(self.slot_values),
            "filled_text": self.filled_text,
        }


# ============================================================================
# Run Deserialization Dispatch Table
# ============================================================================

_RUN_TYPE_MAP: Dict[str, Type] = {
    "text": TextRun,
    "citation": CitationRun,
    "figure_ref": FigureRef,
    "table_ref": TableRef,
    "equation_ref": EquationRef,
    "phrase_slot": PhraseSlotRun,
}


def run_from_dict(d: Dict[str, Any]) -> "Run":
    """Factory: deserialize a Run dict from JSONB into the correct Run subclass.

    This is the single entry point for Run deserialization. Every Run
    dict in the JSONB stores a "type" discriminator — this function
    dispatches to the appropriate from_dict() classmethod.

    Args:
        d: A dict with at least a "type" key.

    Returns:
        An immutable Run instance of the correct subclass.

    Raises:
        ValueError: If the "type" field is missing or unknown.
    """
    run_type = d.get("type", "")
    if not run_type:
        raise ValueError(f"Run dict missing 'type' discriminator: {d}")

    cls = _RUN_TYPE_MAP.get(run_type)
    if cls is None:
        raise ValueError(
            f"Unknown Run type '{run_type}'. "
            f"Known types: {list(_RUN_TYPE_MAP.keys())}"
        )

    return cast(Run, cls.from_dict(d))


# ============================================================================
# Block-level Elements
# ============================================================================

@dataclass(frozen=True)
class Paragraph:
    """A Paragraph — a sequence of inline Runs.

    The Paragraph is the fundamental unit of user-authored content.
    Each paragraph in the wizard editor corresponds to exactly one
    Paragraph node in the AST. A paragraph with zero runs is valid
    (empty paragraph) but will produce only whitespace in export.

    Attributes:
        id: Unique paragraph identifier (UUID string), used for
            drag-and-drop reordering in the frontend.
        runs: Ordered list of Run instances.
    """
    id: str = ""
    runs: List[Run] = field(default_factory=list)

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Paragraph":
        raw_runs = d.get("runs", [])
        runs = [run_from_dict(r) for r in raw_runs]
        return cls(id=str(d.get("id", "")), runs=runs)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "runs": [r.to_dict() for r in self.runs],
        }

    def extract_plain_text(self) -> str:
        """Extract readable plain text from all TextRuns in this paragraph."""
        parts: List[str] = []
        for run in self.runs:
            if isinstance(run, TextRun):
                parts.append(run.text)
            elif isinstance(run, PhraseSlotRun):
                parts.append(run.filled_text or run.template_text)
        return " ".join(parts)


@dataclass(frozen=True)
class Section:
    """A paper section (Introduction, Methods, Results, etc.).

    Each section in the wizard corresponds to one Section node.
    The heading is human-readable ("Introduction"), the label is
    the LaTeX cross-reference anchor ("sec:introduction"), and
    the level controls heading depth (1 = \\section, 2 = \\subsection).

    Attributes:
        heading: Human-readable heading text.
        level: Heading level (1 = top-level, 2 = subsection, 3 = subsubsection).
        paragraphs: Ordered list of Paragraph nodes.
        label: Optional LaTeX \\label{} value for cross-referencing.
    """
    heading: str = ""
    level: int = 1
    paragraphs: List[Paragraph] = field(default_factory=list)
    label: Optional[str] = None

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "Section":
        raw_paras = d.get("paragraphs", [])
        paragraphs = [Paragraph.from_dict(p) for p in raw_paras]
        return cls(
            heading=str(d.get("heading", "")),
            level=int(d.get("level", 1)),
            paragraphs=paragraphs,
            label=d.get("label"),
        )

    def to_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "heading": self.heading,
            "level": self.level,
            "paragraphs": [p.to_dict() for p in self.paragraphs],
        }
        if self.label:
            result["label"] = self.label
        return result

    @property
    def word_count(self) -> int:
        """Compute word count across all paragraphs."""
        text = " ".join(p.extract_plain_text() for p in self.paragraphs)
        return len(text.split()) if text.strip() else 0


# ============================================================================
# Display Element Nodes (figures, tables, equations)
# ============================================================================

@dataclass(frozen=True)
class FigureElement:
    """A figure / illustration in the paper.

    Attributes:
        figure_id: UUID string from the database.
        number: Sequential figure number (assigned by NumberingEngine).
        caption: Figure caption text.
        image_path: Server filesystem path to the image file.
        label: LaTeX label (e.g., "fig:results_chart").
        width: Optional LaTeX width spec (e.g., "0.8\\textwidth").
    """
    figure_id: str = ""
    number: int = 0
    caption: str = ""
    image_path: str = ""
    label: str = ""
    width: Optional[str] = None

    def to_dict(self) -> Dict[str, Any]:
        d: Dict[str, Any] = {
            "figure_id": self.figure_id,
            "number": self.number,
            "caption": self.caption,
            "image_path": self.image_path,
            "label": self.label,
        }
        if self.width:
            d["width"] = self.width
        return d


@dataclass(frozen=True)
class TableElement:
    """A data table in the paper.

    Attributes:
        table_id: UUID string from the database.
        number: Sequential table number.
        caption: Table caption text.
        headers: Column header strings.
        rows: Data rows (list of lists of strings).
        label: LaTeX label (e.g., "tab:demographics").
    """
    table_id: str = ""
    number: int = 0
    caption: str = ""
    headers: List[str] = field(default_factory=list)
    rows: List[List[str]] = field(default_factory=list)
    label: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "table_id": self.table_id,
            "number": self.number,
            "caption": self.caption,
            "headers": list(self.headers),
            "rows": [list(row) for row in self.rows],
            "label": self.label,
        }


@dataclass(frozen=True)
class EquationElement:
    """A mathematical equation in the paper.

    The LaTeX code is stored as-is — no parsing or validation is
    performed. It will be wrapped in \\begin{equation}...\\end{equation}
    during LaTeX compilation.

    Attributes:
        equation_id: UUID string from the database.
        number: Sequential equation number.
        latex_code: Raw LaTeX math code (e.g., "E = mc^{2}").
        label: LaTeX label (e.g., "eq:einstein").
    """
    equation_id: str = ""
    number: int = 0
    latex_code: str = ""
    label: str = ""

    def to_dict(self) -> Dict[str, Any]:
        return {
            "equation_id": self.equation_id,
            "number": self.number,
            "latex_code": self.latex_code,
            "label": self.label,
        }


# ============================================================================
# Metadata Nodes
# ============================================================================

@dataclass(frozen=True)
class AuthorInfo:
    """Author metadata for the paper.

    Attributes:
        first_name: Given name (e.g., "John").
        last_name: Family name (e.g., "Smith").
        affiliation: Institutional affiliation string.
        email: Corresponding author email.
        orcid: ORCID identifier (e.g., "0000-0002-1825-0097").
    """
    first_name: str = ""
    last_name: str = ""
    affiliation: str = ""
    email: str = ""
    orcid: str = ""

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "AuthorInfo":
        return cls(
            first_name=str(d.get("first_name", "")),
            last_name=str(d.get("last_name", "")),
            affiliation=str(d.get("affiliation", "")),
            email=str(d.get("email", "")),
            orcid=str(d.get("orcid", "")),
        )

    def to_dict(self) -> Dict[str, Any]:
        return {
            "first_name": self.first_name,
            "last_name": self.last_name,
            "affiliation": self.affiliation,
            "email": self.email,
            "orcid": self.orcid,
        }


@dataclass(frozen=True)
class ReferenceElement:
    """A formatted bibliography entry.

    The formatted_text field holds the citation-style-specific
    rendering (produced by CitationFormatter). The raw dict preserves
    the original database fields for potential re-formatting.

    Attributes:
        cite_key: Unique citation key (e.g., "smith2024nature").
        number: Citation number in the paper's reference list.
        formatted_text: Fully formatted citation string.
        raw: Original database record for re-formatting.
    """
    cite_key: str = ""
    number: int = 0
    formatted_text: str = ""
    raw: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "cite_key": self.cite_key,
            "number": self.number,
            "formatted_text": self.formatted_text,
        }


# ============================================================================
# Root Document AST
# ============================================================================

@dataclass(frozen=True)
class DocumentAST:
    """Root document node — the complete paper as a typed AST.

    This is the single source of truth consumed by all Compilers.
    It is constructed from database records by ASTBuilder.build()
    and then fed to LaTeXCompiler or DocxCompiler.

    All child nodes are immutable (frozen dataclasses). Once built,
    the AST can be safely passed to multiple compilers or cached
    for re-export without fear of mutation.
    """
    title: str = ""
    authors: List[AuthorInfo] = field(default_factory=list)
    abstract: Optional[Section] = None
    sections: List[Section] = field(default_factory=list)
    figures: List[FigureElement] = field(default_factory=list)
    tables: List[TableElement] = field(default_factory=list)
    equations: List[EquationElement] = field(default_factory=list)
    references: List[ReferenceElement] = field(default_factory=list)
    citation_style: str = "ieee"
    journal_template: str = "ieee"
    keywords: List[str] = field(default_factory=list)
    acknowledgments: Optional[str] = None
    appendices: List[Section] = field(default_factory=list)

    # ---- Serialization ----

    def to_dict(self) -> Dict[str, Any]:
        """Serialize the entire AST to a JSON-compatible dict.

        This is used for:
          - Storing a snapshot of the compiled AST alongside exports
          - Debugging / inspection (the dict is human-readable)
          - Potential caching of compiled documents for re-export
        """
        d: Dict[str, Any] = {
            "title": self.title,
            "citation_style": self.citation_style,
            "journal_template": self.journal_template,
            "keywords": list(self.keywords),
        }
        if self.authors:
            d["authors"] = [a.to_dict() for a in self.authors]
        if self.abstract is not None:
            d["abstract"] = self.abstract.to_dict()
        if self.sections:
            d["sections"] = [s.to_dict() for s in self.sections]
        if self.figures:
            d["figures"] = [f.to_dict() for f in self.figures]
        if self.tables:
            d["tables"] = [t.to_dict() for t in self.tables]
        if self.equations:
            d["equations"] = [e.to_dict() for e in self.equations]
        if self.references:
            d["references"] = [r.to_dict() for r in self.references]
        if self.acknowledgments:
            d["acknowledgments"] = self.acknowledgments
        if self.appendices:
            d["appendices"] = [a.to_dict() for a in self.appendices]
        return d

    @classmethod
    def from_dict(cls, d: Dict[str, Any]) -> "DocumentAST":
        """Deserialize a dict (e.g., from JSONB or JSON file) into a DocumentAST.

        This is the inverse of to_dict(). It performs validation at the
        boundary — any unrecognized keys are silently ignored, and missing
        keys receive their dataclass defaults.
        """
        authors = [AuthorInfo.from_dict(a) for a in d.get("authors", [])]
        abstract = (
            Section.from_dict(d["abstract"])
            if d.get("abstract") is not None
            else None
        )
        sections = [Section.from_dict(s) for s in d.get("sections", [])]
        figures = [
            FigureElement(**{k: v for k, v in f.items() if k in FigureElement.__dataclass_fields__})
            for f in d.get("figures", [])
        ]
        tables = [
            TableElement(**{k: v for k, v in t.items() if k in TableElement.__dataclass_fields__})
            for t in d.get("tables", [])
        ]
        equations = [
            EquationElement(**{k: v for k, v in e.items() if k in EquationElement.__dataclass_fields__})
            for e in d.get("equations", [])
        ]
        refs = [
            ReferenceElement(**{k: v for k, v in r.items() if k in ReferenceElement.__dataclass_fields__})
            for r in d.get("references", [])
        ]
        appendices = [Section.from_dict(a) for a in d.get("appendices", [])]

        return cls(
            title=str(d.get("title", "")),
            authors=authors,
            abstract=abstract,
            sections=sections,
            figures=figures,
            tables=tables,
            equations=equations,
            references=refs,
            citation_style=str(d.get("citation_style", "ieee")),
            journal_template=str(d.get("journal_template", "ieee")),
            keywords=[str(k) for k in d.get("keywords", [])],
            acknowledgments=d.get("acknowledgments"),
            appendices=appendices,
        )


# ============================================================================
# AST Builder — constructs DocumentAST from database records
# ============================================================================

class ASTBuilder:
    """Constructs a DocumentAST from the structured JSON stored in
    PaperSection.content_json and related database tables.

    This is the bridge between the relational database world and
    the typed AST world. It performs no business logic — only
    structural transformation.

    Usage:
        ast = ASTBuilder.build(paper_data, sections_data, figures_data, ...)
    """

    # Canonical section ordering for sorting
    _SECTION_ORDER: Dict[str, int] = {
        "abstract": 0,
        "introduction": 1,
        "methods": 2,
        "methodology": 2,
        "results": 3,
        "discussion": 4,
        "conclusion": 5,
    }

    @classmethod
    def build(
        cls,
        paper_data: Dict[str, Any],
        sections_data: List[Dict[str, Any]],
        figures_data: List[Dict[str, Any]],
        tables_data: List[Dict[str, Any]],
        equations_data: List[Dict[str, Any]],
        references_data: List[Dict[str, Any]],
        citation_style: str = "ieee",
        journal_template: str = "ieee",
    ) -> DocumentAST:
        """Construct a complete DocumentAST from raw database data.

        Args:
            paper_data: Paper metadata (id, title, etc.).
            sections_data: List of PaperSection records (as dicts).
            figures_data: List of PaperFigure records (as dicts).
            tables_data: List of PaperTable records (as dicts).
            equations_data: List of PaperEquation records (as dicts).
            references_data: List of ReferenceEntry records (as dicts).
            citation_style: Target citation style string.
            journal_template: Target journal template identifier.

        Returns:
            A fully constructed, immutable DocumentAST.
        """
        parsed_sections: List[Section] = []
        abstract_section: Optional[Section] = None

        # Sort sections by canonical order, fallback to alphabetical
        sorted_sections = sorted(
            sections_data,
            key=lambda s: cls._SECTION_ORDER.get(
                s.get("section_name", ""), 99
            ),
        )

        for sec in sorted_sections:
            section_obj = cls._parse_section(sec)
            if sec.get("section_name") == "abstract":
                abstract_section = section_obj
            else:
                parsed_sections.append(section_obj)

        # Parse display elements
        figures = [
            FigureElement(
                figure_id=str(f.get("id", "")),
                number=int(f.get("figure_number", 0)),
                caption=str(f.get("caption", "")),
                image_path=str(f.get("file_path", "")),
                label=str(f.get("label", f"fig:{f.get('id', '')}")),
                width=f.get("width"),
            )
            for f in figures_data
        ]

        parsed_tables = [
            TableElement(
                table_id=str(t.get("id", "")),
                number=int(t.get("table_number", 0)),
                caption=str(t.get("caption", "")),
                headers=[
                    str(h) for h in t.get("table_data", {}).get("headers", [])
                ],
                rows=[
                    [str(c) for c in row]
                    for row in t.get("table_data", {}).get("rows", [])
                ],
                label=str(t.get("label", f"tab:{t.get('id', '')}")),
            )
            for t in tables_data
        ]

        parsed_equations = [
            EquationElement(
                equation_id=str(e.get("id", "")),
                number=int(e.get("equation_number", 0)),
                latex_code=str(e.get("latex_code", "")),
                label=str(e.get("label", f"eq:{e.get('id', '')}")),
            )
            for e in equations_data
        ]

        # Parse references (already formatted by CitationFormatter before this point)
        parsed_refs = [
            ReferenceElement(
                cite_key=str(r.get("cite_key", "")),
                number=idx + 1,
                formatted_text=str(r.get("formatted_text", "")),
                raw=r,
            )
            for idx, r in enumerate(references_data)
        ]

        return DocumentAST(
            title=str(paper_data.get("title", "")),
            abstract=abstract_section,
            sections=parsed_sections,
            figures=figures,
            tables=parsed_tables,
            equations=parsed_equations,
            references=parsed_refs,
            citation_style=citation_style,
            journal_template=journal_template,
        )

    @classmethod
    def _parse_section(cls, sec_data: Dict[str, Any]) -> Section:
        """Parse a single section's content_json into a Section AST node.

        This is the primary deserialization bridge: it takes the JSONB
        stored in PaperSection.content_json and converts every paragraph
        and run into the corresponding typed AST node.
        """
        content: Dict[str, Any] = sec_data.get("content_json", {}) or {}
        raw_paragraphs: List[Dict[str, Any]] = content.get("paragraphs", [])
        paragraphs = [Paragraph.from_dict(p) for p in raw_paragraphs]

        return Section(
            heading=str(sec_data.get("section_name", "")).replace("_", " ").title(),
            level=1,
            paragraphs=paragraphs,
            label=sec_data.get("label"),
        )
