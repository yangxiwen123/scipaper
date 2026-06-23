"""
LaTeX Compiler — converts DocumentAST into a complete .tex file.
Supports multiple journal templates (IEEE, Elsevier, Springer, Nature).
"""
import os
import re
import subprocess
import tempfile
from pathlib import Path
from typing import Optional, Tuple
from app.engines.document_ast import (
    DocumentAST,
    Section,
    Paragraph,
    TextRun,
    CitationRun,
    FigureRef,
    TableRef,
    EquationRef,
    FigureElement,
    TableElement,
    EquationElement,
)


class LaTeXCompiler:
    """
    Compiles a DocumentAST into a LaTeX .tex file, then optionally to PDF via xelatex.
    """

    # LaTeX special characters that need escaping
    LATEX_ESCAPE_MAP = {
        "&": r"\&",
        "%": r"\%",
        "$": r"\$",
        "#": r"\#",
        "_": r"\_",
        "{": r"\{",
        "}": r"\}",
        "~": r"\textasciitilde{}",
        "^": r"\^{}",
        "\\": r"\textbackslash{}",
    }

    def __init__(self, template_dir: str = "../templates", xelatex_path: str = "xelatex"):
        self.template_dir = Path(template_dir)
        self.xelatex_path = xelatex_path

    def compile_to_tex(self, ast: DocumentAST) -> str:
        """
        Compile a DocumentAST into a complete LaTeX source string.

        Args:
            ast: The DocumentAST to compile.

        Returns:
            Complete .tex file content as a string.
        """
        parts = []

        # 1. Preamble
        parts.append(self._generate_preamble(ast))

        # 2. Begin document
        parts.append(r"\begin{document}")

        # 3. Title & authors
        parts.append(self._generate_title_block(ast))

        # 4. Abstract
        if ast.abstract:
            parts.append(self._generate_abstract(ast.abstract))

        # 5. Keywords
        if ast.keywords:
            kw_str = "; ".join(ast.keywords)
            parts.append(r"\begin{keywords}")
            parts.append(kw_str)
            parts.append(r"\end{keywords}")
            parts.append("")

        # 6. Body sections
        for section in ast.sections:
            parts.append(self._generate_section(section))

        # 7. Figures
        for fig in ast.figures:
            parts.append(self._generate_figure(fig))

        # 8. Tables
        for tbl in ast.tables:
            parts.append(self._generate_table(tbl))

        # 9. Equations
        for eq in ast.equations:
            parts.append(self._generate_equation(eq))

        # 10. Acknowledgments
        if ast.acknowledgments:
            parts.append(r"\section*{Acknowledgments}")
            parts.append(ast.acknowledgments)
            parts.append("")

        # 11. Appendices
        for apx in ast.appendices:
            parts.append(r"\appendix")
            parts.append(self._generate_section(apx))

        # 12. Bibliography
        parts.append(self._generate_bibliography(ast))

        # 13. End document
        parts.append(r"\end{document}")

        return "\n".join(parts)

    def compile_to_pdf(
        self, ast: DocumentAST, output_dir: str, filename: str = "paper"
    ) -> Tuple[str, str]:
        """
        Compile to .tex and then run xelatex to produce PDF.

        Returns:
            Tuple of (tex_file_path, pdf_file_path).
        """
        tex_content = self.compile_to_tex(ast)

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        tex_path = output_path / f"{filename}.tex"
        tex_path.write_text(tex_content, encoding="utf-8")

        # Run xelatex twice (for cross-references and TOC)
        for _ in range(2):
            result = subprocess.run(
                [self.xelatex_path, "-interaction=nonstopmode", "-output-directory",
                 str(output_path), str(tex_path)],
                capture_output=True,
                text=True,
                timeout=120,
            )

        pdf_path = output_path / f"{filename}.pdf"
        log = result.stdout + "\n" + result.stderr

        return str(tex_path), str(pdf_path) if pdf_path.exists() else "", log

    # ---- Private Methods ----

    def _generate_preamble(self, ast: DocumentAST) -> str:
        """Generate the LaTeX preamble based on journal template."""
        template = ast.journal_template.lower()

        lines = [r"% SCI Writer — Auto-generated LaTeX", f"% Template: {template}", ""]

        if template == "ieee":
            lines.extend([
                r"\documentclass[journal,10pt,twocolumn]{IEEEtran}",
                r"\usepackage{graphicx}",
                r"\usepackage{amsmath,amssymb}",
                r"\usepackage{cite}",
                r"\usepackage{hyperref}",
                r"\usepackage[utf8]{inputenc}",
                r"\hypersetup{colorlinks=true,linkcolor=blue,citecolor=blue,urlcolor=blue}",
                "",
            ])
        elif template == "elsevier":
            lines.extend([
                r"\documentclass[review]{elsarticle}",
                r"\usepackage{graphicx}",
                r"\usepackage{amsmath,amssymb}",
                r"\usepackage{hyperref}",
                r"\usepackage[utf8]{inputenc}",
                r"\hypersetup{colorlinks=true,linkcolor=blue,citecolor=blue,urlcolor=blue}",
                r"\journal{Journal Name}",
                "",
            ])
        elif template == "springer":
            lines.extend([
                r"\documentclass[twocolumn]{svjour3}",
                r"\usepackage{graphicx}",
                r"\usepackage{amsmath,amssymb}",
                r"\usepackage{hyperref}",
                r"\usepackage[utf8]{inputenc}",
                "",
            ])
        elif template == "nature":
            lines.extend([
                r"\documentclass{nature}",
                r"\usepackage{graphicx}",
                r"\usepackage{amsmath,amssymb}",
                r"\usepackage{hyperref}",
                r"\usepackage[utf8]{inputenc}",
                "",
            ])
        else:
            # Generic academic template
            lines.extend([
                r"\documentclass[11pt,a4paper]{article}",
                r"\usepackage[margin=1in]{geometry}",
                r"\usepackage{graphicx}",
                r"\usepackage{amsmath,amssymb}",
                r"\usepackage{hyperref}",
                r"\usepackage[utf8]{inputenc}",
                r"\usepackage{setspace}",
                r"\doublespacing",
                r"\hypersetup{colorlinks=true,linkcolor=blue,citecolor=blue,urlcolor=blue}",
                "",
            ])

        # Add custom commands
        lines.extend([
            r"% Custom commands",
            r"\newcommand{\figref}[1]{Fig.~\ref{#1}}",
            r"\newcommand{\tabref}[1]{Table~\ref{#1}}",
            r"\newcommand{\eqref}[1]{Eq.~\ref{#1}}",
            "",
        ])

        return "\n".join(lines)

    def _generate_title_block(self, ast: DocumentAST) -> str:
        """Generate title and author block."""
        lines = []

        # Title
        escaped_title = self._escape_latex(ast.title)
        lines.append(r"\title{" + escaped_title + "}")
        lines.append("")

        # Authors
        if ast.authors:
            author_strs = []
            for author in ast.authors:
                name = f"{author.first_name}~{author.last_name}"
                author_strs.append(r"\author{" + name + "}")
            lines.append("\n".join(author_strs))
            lines.append("")

        lines.append(r"\maketitle")
        lines.append("")

        return "\n".join(lines)

    def _generate_abstract(self, abstract: Section) -> str:
        """Generate the abstract section."""
        lines = [r"\begin{abstract}"]
        for para in abstract.paragraphs:
            para_text = self._compile_paragraph(para)
            lines.append(para_text)
        lines.append(r"\end{abstract}")
        lines.append("")
        return "\n".join(lines)

    def _generate_section(self, section: Section) -> str:
        """Generate a section with its content."""
        lines = []

        if section.label:
            heading_cmd = (
                r"\section" if section.level == 1 else r"\subsection"
            )
            lines.append(
                f"{heading_cmd}[{self._escape_latex(section.heading)}]"
                f"{{{self._escape_latex(section.heading)}}}"
                f"\\label{{{section.label}}}"
            )
        else:
            heading_cmd = (
                r"\section" if section.level == 1 else r"\subsection"
            )
            lines.append(f"{heading_cmd}{{{self._escape_latex(section.heading)}}}")

        lines.append("")

        for para in section.paragraphs:
            lines.append(self._compile_paragraph(para))
            lines.append("")

        return "\n".join(lines)

    def _compile_paragraph(self, para: Paragraph) -> str:
        """Compile a paragraph's runs into a LaTeX string."""
        parts = []
        for run in para.runs:
            if isinstance(run, TextRun):
                text = self._escape_latex(run.text)
                if run.bold:
                    text = r"\textbf{" + text + "}"
                if run.italic:
                    text = r"\textit{" + text + "}"
                if run.subscript:
                    text = r"\textsubscript{" + text + "}"
                if run.superscript:
                    text = r"\textsuperscript{" + text + "}"
                parts.append(text)
            elif isinstance(run, CitationRun):
                keys = ",".join(run.ref_ids)
                parts.append(r"\cite{" + keys + "}")
            elif isinstance(run, FigureRef):
                parts.append(r"\figref{" + run.figure_label + "}")
            elif isinstance(run, TableRef):
                parts.append(r"\tabref{" + run.table_label + "}")
            elif isinstance(run, EquationRef):
                parts.append(r"\eqref{" + run.equation_label + "}")
        return " ".join(parts)

    def _generate_figure(self, fig: FigureElement) -> str:
        """Generate a LaTeX figure environment."""
        lines = [
            r"\begin{figure}[htbp]",
            r"  \centering",
            r"  \includegraphics" + (f"[width={fig.width}]" if fig.width else "")
            + "{" + fig.image_path + "}",
            r"  \caption{" + self._escape_latex(fig.caption) + "}",
            r"  \label{" + fig.label + "}",
            r"\end{figure}",
            "",
        ]
        return "\n".join(lines)

    def _generate_table(self, tbl: TableElement) -> str:
        """Generate a LaTeX table environment."""
        num_cols = len(tbl.headers) if tbl.headers else (len(tbl.rows[0]) if tbl.rows else 1)
        col_spec = "|" + "c|" * num_cols

        lines = [
            r"\begin{table}[htbp]",
            r"  \centering",
            r"  \caption{" + self._escape_latex(tbl.caption) + "}",
            r"  \label{" + tbl.label + "}",
            r"  \begin{tabular}{" + col_spec + "}",
            r"    \hline",
        ]

        # Headers
        if tbl.headers:
            header_str = " & ".join(self._escape_latex(h) for h in tbl.headers)
            lines.append(f"    {header_str} \\\\")
            lines.append(r"    \hline")

        # Rows
        for row in tbl.rows:
            row_str = " & ".join(self._escape_latex(str(c)) for c in row)
            lines.append(f"    {row_str} \\\\")

        lines.extend([
            r"    \hline",
            r"  \end{tabular}",
            r"\end{table}",
            "",
        ])
        return "\n".join(lines)

    def _generate_equation(self, eq: EquationElement) -> str:
        """Generate a LaTeX equation environment."""
        lines = [
            r"\begin{equation}",
            f"  {eq.latex_code}",
            r"  \label{" + eq.label + "}",
            r"\end{equation}",
            "",
        ]
        return "\n".join(lines)

    def _generate_bibliography(self, ast: DocumentAST) -> str:
        """Generate bibliography section."""
        lines = []

        if ast.journal_template.lower() == "ieee":
            lines.append(r"\bibliographystyle{IEEEtran}")
        elif ast.citation_style == "apa":
            lines.append(r"\bibliographystyle{apacite}")
        elif ast.citation_style == "vancouver":
            lines.append(r"\bibliographystyle{vancouver}")
        else:
            lines.append(r"\bibliographystyle{plain}")

        lines.append(r"\bibliography{references}")
        lines.append("")
        return "\n".join(lines)

    @classmethod
    def _escape_latex(cls, text: str) -> str:
        """Escape special LaTeX characters in text."""
        for char, replacement in cls.LATEX_ESCAPE_MAP.items():
            text = text.replace(char, replacement)
        return text
