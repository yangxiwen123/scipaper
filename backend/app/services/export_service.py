"""
Export Service — orchestrates the full export pipeline.
JSON → AST → LaTeX → PDF / Word (.docx)
"""
import os
import uuid
from pathlib import Path
from typing import Optional, List, Dict, Any
from dataclasses import dataclass

from app.engines.document_ast import ASTBuilder, DocumentAST
from app.engines.latex_compiler import LaTeXCompiler
from app.engines.docx_compiler import DocxCompiler
from app.engines.numbering_engine import NumberingEngine, NumberedElement, NumberingStyle
from app.engines.citation_formatter import CitationFormatter


@dataclass
class ExportResult:
    """Result of an export operation."""
    paper_id: str
    format: str
    file_path: str
    file_size: int
    compile_log: Optional[str] = None
    errors: List[str] = None
    warnings: List[str] = None

    def __post_init__(self):
        self.errors = self.errors or []
        self.warnings = self.warnings or []


class ExportService:
    """
    Orchestrates the paper export pipeline.

    Usage:
        service = ExportService(template_dir="/templates")
        result = service.export(paper_data, sections, figures, tables, equations, refs)
    """

    def __init__(
        self,
        template_dir: str = "../templates",
        export_dir: str = "./exports",
        xelatex_path: str = "xelatex",
    ):
        self.template_dir = Path(template_dir)
        self.export_dir = Path(export_dir)
        self.export_dir.mkdir(parents=True, exist_ok=True)
        self.xelatex_path = xelatex_path

    def export(
        self,
        paper_data: Dict[str, Any],
        sections_data: List[Dict[str, Any]],
        figures_data: List[Dict[str, Any]],
        tables_data: List[Dict[str, Any]],
        equations_data: List[Dict[str, Any]],
        references_data: List[Dict[str, Any]],
        export_format: str = "pdf",
        journal_template: str = "ieee",
        citation_style: str = "ieee",
    ) -> ExportResult:
        """
        Full export pipeline.

        Args:
            paper_data: Paper metadata (title, authors, etc.)
            sections_data: All paper sections with content_json
            figures_data: All figures with metadata
            tables_data: All tables with data
            equations_data: All equations with LaTeX code
            references_data: All reference entries
            export_format: "pdf", "latex", or "docx"
            journal_template: Template identifier
            citation_style: Citation style name

        Returns:
            ExportResult with file path and any warnings/errors.
        """
        errors = []
        warnings = []

        # 1. Format references with citation style
        try:
            formatter = CitationFormatter(style=citation_style)
            formatted_refs = formatter.format_all(references_data)
        except Exception as e:
            errors.append(f"Citation formatting error: {e}")
            formatted_refs = references_data

        # 2. Auto-number figures, tables, equations
        numbering = NumberingEngine(NumberingStyle.SEQUENTIAL)

        fig_elements = [
            NumberedElement(id=str(f.get("id", "")), type="figure",
                           section_name=f.get("section_name"))
            for f in figures_data
        ]
        tab_elements = [
            NumberedElement(id=str(t.get("id", "")), type="table",
                           section_name=t.get("section_name"))
            for t in tables_data
        ]
        eq_elements = [
            NumberedElement(id=str(e.get("id", "")), type="equation",
                           section_name=e.get("section_name"))
            for e in equations_data
        ]

        section_map = {}
        for s in sections_data:
            sid = str(s.get("id", ""))
            sn = s.get("section_name", "")
            section_map[sid] = sn

        # Merge section maps for elements
        elem_section_map = {}
        for e in fig_elements + tab_elements + eq_elements:
            if e.section_name:
                elem_section_map[e.id] = e.section_name

        fig_numbers = numbering.assign_numbers(fig_elements, elem_section_map)
        tab_numbers = numbering.assign_numbers(tab_elements, elem_section_map)
        eq_numbers = numbering.assign_numbers(eq_elements, elem_section_map)

        # Apply numbers back to data
        for f in figures_data:
            fid = str(f.get("id", ""))
            if fid in fig_numbers:
                f["figure_number"] = fig_numbers[fid]
        for t in tables_data:
            tid = str(t.get("id", ""))
            if tid in tab_numbers:
                t["table_number"] = tab_numbers[tid]
        for e in equations_data:
            eid = str(e.get("id", ""))
            if eid in eq_numbers:
                e["equation_number"] = eq_numbers[eid]

        # 3. Build Document AST
        try:
            ast = ASTBuilder.build(
                paper_data=paper_data,
                sections_data=sections_data,
                figures_data=figures_data,
                tables_data=tables_data,
                equations_data=equations_data,
                references_data=formatted_refs,
                citation_style=citation_style,
                journal_template=journal_template,
            )
        except Exception as e:
            errors.append(f"AST build error: {e}")
            return ExportResult(
                paper_id=str(paper_data.get("id", "")),
                format=export_format,
                file_path="",
                file_size=0,
                errors=errors,
                warnings=warnings,
            )

        # 4. Compile to target format
        file_id = str(uuid.uuid4())[:8]
        file_path = ""
        compile_log = None

        try:
            if export_format == "docx":
                compiler = DocxCompiler(str(self.template_dir))
                output_path = self.export_dir / f"paper_{file_id}.docx"
                file_path = compiler.compile(ast, str(output_path))

            elif export_format in ("latex", "pdf"):
                compiler = LaTeXCompiler(
                    str(self.template_dir), self.xelatex_path
                )
                if export_format == "latex":
                    tex_content = compiler.compile_to_tex(ast)
                    output_path = self.export_dir / f"paper_{file_id}.tex"
                    output_path.write_text(tex_content, encoding="utf-8")
                    file_path = str(output_path)
                else:
                    tex_path, pdf_path, log = compiler.compile_to_pdf(
                        ast, str(self.export_dir), f"paper_{file_id}"
                    )
                    file_path = pdf_path
                    compile_log = log
                    if not pdf_path:
                        errors.append("PDF compilation failed. Check compile_log.")
                        warnings.append("Falling back to .tex file.")
                        file_path = tex_path

        except Exception as e:
            errors.append(f"Compilation error: {e}")

        # 5. Determine file size
        file_size = 0
        if file_path and os.path.exists(file_path):
            file_size = os.path.getsize(file_path)

        return ExportResult(
            paper_id=str(paper_data.get("id", "")),
            format=export_format,
            file_path=file_path,
            file_size=file_size,
            compile_log=compile_log,
            errors=errors,
            warnings=warnings,
        )
