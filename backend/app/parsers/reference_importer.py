"""
Reference Importer — parses BibTeX and RIS files into structured reference data.
"""
import re
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class ImportResult:
    """Result of a reference import operation."""
    entries: List[Dict[str, Any]]
    imported_count: int
    skipped_count: int
    errors: List[str]


class ReferenceImporter:
    """
    Imports references from BibTeX (.bib) and RIS (.ris) formats.
    Returns structured dicts compatible with the ReferenceEntry model.
    """

    # BibTeX entry type mapping
    BIBTEX_TYPE_MAP = {
        "article": "article",
        "inproceedings": "conference",
        "conference": "conference",
        "book": "book",
        "incollection": "book_chapter",
        "phdthesis": "thesis",
        "mastersthesis": "thesis",
        "techreport": "report",
        "misc": "webpage",
        "unpublished": "preprint",
    }

    # RIS type mapping
    RIS_TYPE_MAP = {
        "JOUR": "article",
        "JFULL": "article",
        "CONF": "conference",
        "CPAPER": "conference",
        "BOOK": "book",
        "CHAP": "book_chapter",
        "THES": "thesis",
        "RPRT": "report",
        "WEB": "webpage",
        "ELEC": "webpage",
        "GEN": "misc",
    }

    @classmethod
    def parse(cls, raw_data: str, format: str = "bibtex") -> ImportResult:
        """
        Parse a raw string in BibTeX or RIS format.

        Args:
            raw_data: The raw file content string.
            format: "bibtex" or "ris".

        Returns:
            ImportResult with parsed entries and error info.
        """
        if format.lower() == "bibtex":
            return cls._parse_bibtex(raw_data)
        elif format.lower() == "ris":
            return cls._parse_ris(raw_data)
        else:
            return ImportResult(entries=[], imported_count=0, skipped_count=0,
                               errors=[f"Unsupported format: {format}"])

    @classmethod
    def detect_format(cls, raw_data: str) -> Optional[str]:
        """
        Auto-detect whether the raw data is BibTeX or RIS format.
        Returns "bibtex", "ris", or None.
        """
        # RIS detection: starts with TY tag
        if re.search(r"^TY\s{2}-", raw_data.strip(), re.MULTILINE):
            return "ris"
        # BibTeX detection: contains @article{ or @book{ etc.
        if re.search(r"@\w+\{", raw_data.strip()):
            return "bibtex"
        return None

    # ---- BibTeX Parser ----

    @classmethod
    def _parse_bibtex(cls, raw: str) -> ImportResult:
        """
        Parse BibTeX string into structured entries.
        Custom parser — avoids dependency on bibtexparser for MVP.
        """
        entries = []
        errors = []

        # Normalize: remove comments and extra whitespace
        raw = re.sub(r"(?m)^%.*$", "", raw)  # Remove comment lines
        raw = re.sub(r"\n\s*\n", "\n", raw)

        # Match each @type{key, ...} entry
        entry_pattern = re.compile(
            r"@(\w+)\s*\{\s*([^,]+)\s*,\s*(.+?)\}\s*$",
            re.DOTALL | re.MULTILINE,
        )

        for match in entry_pattern.finditer(raw):
            try:
                entry_type = match.group(1).lower()
                cite_key = match.group(2).strip()
                fields_str = match.group(3)

                fields = cls._parse_bibtex_fields(fields_str)

                # Extract authors
                authors = cls._parse_author_string(
                    fields.get("author", "")
                )

                entry = {
                    "ref_type": cls.BIBTEX_TYPE_MAP.get(entry_type, "article"),
                    "title": cls._clean_latex(fields.get("title", "")),
                    "authors": authors,
                    "journal": cls._clean_latex(
                        fields.get("journal") or fields.get("booktitle", "")
                    ),
                    "year": cls._parse_int(fields.get("year")),
                    "volume": fields.get("volume"),
                    "issue": fields.get("number") or fields.get("issue"),
                    "pages": fields.get("pages"),
                    "doi": fields.get("doi"),
                    "url": fields.get("url"),
                    "abstract": cls._clean_latex(fields.get("abstract", "")),
                    "cite_key": cite_key,
                    "raw_bibtex": match.group(0),
                }
                entries.append(entry)
            except Exception as e:
                errors.append(f"Failed to parse BibTeX entry: {e}")

        return ImportResult(
            entries=entries,
            imported_count=len(entries),
            skipped_count=0,
            errors=errors,
        )

    @classmethod
    def _parse_bibtex_fields(cls, fields_str: str) -> Dict[str, str]:
        """Parse key = {value} or key = "value" pairs from BibTeX fields."""
        result = {}
        # Handle nested braces
        # Match field = {value} or field = "value"
        field_pattern = re.compile(
            r'(\w+)\s*=\s*[{"](.+?)[}"](?=\s*,|\s*$)', re.DOTALL
        )
        for fm in field_pattern.finditer(fields_str):
            result[fm.group(1).lower()] = fm.group(2).strip()
        return result

    # ---- RIS Parser ----

    @classmethod
    def _parse_ris(cls, raw: str) -> ImportResult:
        """
        Parse RIS string into structured entries.
        RIS format uses two-letter tags (TY, AU, TI, etc.).
        """
        entries = []
        errors = []
        current_entry: Dict[str, Any] = {}
        current_tag: Optional[str] = None

        for line in raw.splitlines():
            line = line.strip()
            if not line:
                continue

            # RIS tags: "TY  - value" (two spaces + hyphen)
            match = re.match(r"^(\w{2})\s{2}-\s+(.*)$", line)
            if not match:
                continue

            tag, value = match.group(1), match.group(2).strip()

            if tag == "ER":
                # End of record
                if current_entry:
                    entries.append(cls._build_ris_entry(current_entry))
                    current_entry = {}
            elif tag == "TY":
                # Start of new record
                if current_entry:
                    entries.append(cls._build_ris_entry(current_entry))
                current_entry = {"type_tag": value}
            else:
                # Multi-value fields (AU, KW)
                if tag in ("AU", "KW", "AD"):
                    if tag not in current_entry:
                        current_entry[tag] = []
                    current_entry[tag].append(value)
                else:
                    current_entry[tag] = value

        # Don't forget the last entry
        if current_entry:
            entries.append(cls._build_ris_entry(current_entry))

        return ImportResult(
            entries=entries,
            imported_count=len(entries),
            skipped_count=0,
            errors=errors,
        )

    @classmethod
    def _build_ris_entry(cls, raw_data: Dict[str, Any]) -> Dict[str, Any]:
        """Convert raw RIS tag data into structured reference dict."""
        ref_type = cls.RIS_TYPE_MAP.get(
            raw_data.get("type_tag", "").upper(), "article"
        )

        # Authors from AU tags
        authors = cls._parse_author_string(
            "; ".join(raw_data.get("AU", []))
        ) if isinstance(raw_data.get("AU"), list) else []

        return {
            "ref_type": ref_type,
            "title": raw_data.get("TI", ""),
            "authors": authors,
            "journal": raw_data.get("JO") or raw_data.get("JF", ""),
            "year": cls._parse_int(raw_data.get("PY")),
            "volume": raw_data.get("VL"),
            "issue": raw_data.get("IS"),
            "pages": raw_data.get("SP", ""),
            "doi": raw_data.get("DO"),
            "url": raw_data.get("UR"),
            "abstract": raw_data.get("AB", ""),
            "keywords": raw_data.get("KW", []) if isinstance(raw_data.get("KW"), list) else [],
            "cite_key": raw_data.get("ID", ""),
            "raw_ris": str(raw_data),
        }

    # ---- Utility Methods ----

    @staticmethod
    def _parse_author_string(author_str: str) -> List[Dict[str, str]]:
        """
        Parse "Smith, John and Doe, Jane" or "John Smith and Jane Doe"
        into [{"first": "John", "last": "Smith"}, ...]
        """
        if not author_str:
            return []

        # Split on ' and ' (BibTeX convention)
        names = re.split(r"\s+and\s+", author_str, flags=re.IGNORECASE)

        authors = []
        for name in names:
            name = name.strip().rstrip(",").strip()
            if not name:
                continue

            if "," in name:
                # Format: "Smith, John"
                parts = name.split(",", 1)
                last = parts[0].strip()
                first = parts[1].strip() if len(parts) > 1 else ""
                authors.append({"first": first, "last": last})
            else:
                # Format: "John Smith" — last word is last name
                parts = name.split()
                if len(parts) == 1:
                    authors.append({"first": "", "last": parts[0]})
                else:
                    first = " ".join(parts[:-1])
                    last = parts[-1]
                    authors.append({"first": first, "last": last})

        return authors

    @staticmethod
    def _parse_int(value: Any) -> Optional[int]:
        """Safely parse a value to int, returning None on failure."""
        if value is None:
            return None
        try:
            return int(str(value))
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _clean_latex(text: str) -> str:
        """Remove common LaTeX commands from text for display purposes."""
        if not text:
            return ""
        # Remove common LaTeX markup
        text = re.sub(r"\\textit\{([^}]*)\}", r"\1", text)
        text = re.sub(r"\\textbf\{([^}]*)\}", r"\1", text)
        text = re.sub(r"\\emph\{([^}]*)\}", r"\1", text)
        text = re.sub(r"\\\w+\{?([^}]*)\}?", r"\1", text)
        # Remove braces
        text = text.replace("{", "").replace("}", "")
        # Normalize whitespace
        text = " ".join(text.split())
        return text.strip()
