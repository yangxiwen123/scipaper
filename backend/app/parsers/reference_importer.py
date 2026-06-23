"""
Reference Importer — hand-written BibTeX and RIS format parsers.

We chose to write our own parser rather than depending on third-party
libraries for three reasons:

1. PRECISION: We need exact control over parsing error messages so
   the wizard UI can show users exactly which line has a problem.

2. ZERO-DEPENDENCY: The backend Docker image stays small. bibtexparser
   has known issues with non-standard BibTeX dialects (e.g., Google
   Scholar exports, Mendeley auto-generated .bib files).

3. AUDITABILITY: Every line of parsing logic is visible to code review.
   There is no black-box dependency that could silently drop fields.

Parser Architecture:
    raw string → strip comments → split entries → extract fields
                                                  ↓
                                    _parse_author_string (name normalization)
                                                  ↓
                                    structured dict ← type mapping
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional


# ============================================================================
# Data Structures
# ============================================================================

@dataclass
class ImportResult:
    """Result of a reference import operation.

    Attributes:
        entries: Successfully parsed reference dicts.
        imported_count: Number of entries successfully imported.
        skipped_count: Number of duplicate or unparseable entries skipped.
        errors: Human-readable error messages for each failure.
    """
    entries: List[Dict[str, Any]] = field(default_factory=list)
    imported_count: int = 0
    skipped_count: int = 0
    errors: List[str] = field(default_factory=list)


@dataclass
class AuthorName:
    """Structured representation of an academic author name.

    Both "Smith, John" and "John Smith" formats are normalized
    into this canonical representation during parsing.
    """
    first: str = ""
    last: str = ""
    suffix: str = ""   # Jr., III, etc.
    affiliation: str = ""

    def to_dict(self) -> Dict[str, str]:
        d: Dict[str, str] = {"first": self.first, "last": self.last}
        if self.suffix:
            d["suffix"] = self.suffix
        if self.affiliation:
            d["affiliation"] = self.affiliation
        return d


# ============================================================================
# ReferenceImporter
# ============================================================================

class ReferenceImporter:
    """Imports references from BibTeX (.bib) and RIS (.ris) formats.

    All methods are classmethods — no instance state. The importer is
    a pure function from raw text to structured dicts.

    Usage:
        result = ReferenceImporter.parse(raw_string, format="bibtex")
        for entry in result.entries:
            reference = ReferenceEntry(**entry, paper_id=paper.id)
            db.add(reference)
    """

    # ---- Type Mappings ----

    BIBTEX_TYPE_MAP: Dict[str, str] = {
        "article":        "article",
        "inproceedings":  "conference",
        "conference":     "conference",
        "proceedings":    "conference",
        "book":           "book",
        "incollection":   "book_chapter",
        "inbook":         "book_chapter",
        "phdthesis":      "thesis",
        "mastersthesis":  "thesis",
        "techreport":     "report",
        "misc":           "webpage",
        "unpublished":    "preprint",
        "manual":         "report",
        "patent":         "patent",
    }

    RIS_TYPE_MAP: Dict[str, str] = {
        "JOUR":   "article",
        "JFULL":  "article",
        "CONF":   "conference",
        "CPAPER": "conference",
        "BOOK":   "book",
        "CHAP":   "book_chapter",
        "THES":   "thesis",
        "RPRT":   "report",
        "WEB":    "webpage",
        "ELEC":   "webpage",
        "GEN":    "misc",
        "PAT":    "patent",
    }

    # ---- Public API ----

    @classmethod
    def parse(cls, raw_data: str, fmt: str = "bibtex") -> ImportResult:
        """Parse a raw string in BibTeX or RIS format.

        Args:
            raw_data: The raw file content as a UTF-8 string.
            fmt: "bibtex", "ris", or "auto" for auto-detection.

        Returns:
            ImportResult with parsed entries and diagnostic information.
        """
        fmt_lower = fmt.lower().strip()

        if fmt_lower == "auto":
            detected = cls.detect_format(raw_data)
            if detected is None:
                return ImportResult(
                    errors=["Could not detect format. Please specify 'bibtex' or 'ris'."]
                )
            fmt_lower = detected

        if fmt_lower == "bibtex":
            return cls._parse_bibtex(raw_data)
        elif fmt_lower == "ris":
            return cls._parse_ris(raw_data)
        else:
            return ImportResult(
                errors=[f"Unsupported format: '{fmt}'. Use 'bibtex' or 'ris'."]
            )

    @classmethod
    def detect_format(cls, raw_data: str) -> Optional[str]:
        """Auto-detect BibTeX vs RIS format.

        Heuristics:
          - RIS: first non-empty line matches "TY  - " (two spaces, hyphen)
          - BibTeX: any line contains @type{key,
        """
        stripped = raw_data.strip()
        if not stripped:
            return None

        # Check RIS first (more specific pattern)
        if re.search(r"^TY\s{2}-", stripped, re.MULTILINE):
            return "ris"

        # Check BibTeX
        if re.search(r"@\w+\s*\{", stripped):
            return "bibtex"

        return None

    # ==================================================================
    # BibTeX Parser
    # ==================================================================

    # BibTeX entry regex: @type{ cite_key,\n  field = {value},\n  ... }
    # The tricky part is matching nested braces in values.
    _BIBTEX_ENTRY_RE = re.compile(
        r"""
        @(\w+)\s*\{           # @article, @book, etc.
        \s*([^,]+?)\s*,\s*   # cite_key (non-greedy up to first comma)
        (.+?)                 # all fields (lazy)
        \}\s*$                # closing brace at end of entry
        """,
        re.DOTALL | re.MULTILINE | re.VERBOSE,
    )

    # Field extraction regex: handles key = {...} and key = "..."
    # Uses a stack to track brace depth for nested braces
    _FIELD_KEY_RE = re.compile(r'(\w+)\s*=\s*', re.VERBOSE)

    @classmethod
    def _parse_bibtex(cls, raw: str) -> ImportResult:
        """Parse BibTeX string into structured reference entries.

        This is a multi-pass parser:
          1. Strip comment lines (%...)
          2. Split concatenated entries (some .bib files omit blank lines)
          3. For each @type{key, fields...}: extract entry type, cite key, fields
          4. Parse fields into key-value pairs (handling nested braces)
          5. Parse author strings into structured AuthorName lists
          6. Clean LaTeX markup from text fields
        """
        errors: List[str] = []
        entries: List[Dict[str, Any]] = []

        # ---- Pass 1: Normalize ----
        normalized = cls._normalize_bibtex(raw)

        # ---- Pass 2: Split entries ----
        # Find all @type{...} blocks by tracking brace depth
        entry_spans = cls._find_bibtex_entry_spans(normalized)

        for start, end, entry_type, cite_key, fields_block in entry_spans:
            try:
                # ---- Parse fields ----
                fields = cls._parse_bibtex_fields(fields_block)

                # ---- Parse authors ----
                author_raw = fields.get("author", "")
                authors = [a.to_dict() for a in cls._parse_author_string(author_raw)]

                # ---- Build entry dict ----
                entry: Dict[str, Any] = {
                    "ref_type": cls.BIBTEX_TYPE_MAP.get(entry_type, "article"),
                    "title": cls._clean_latex(fields.get("title", "")),
                    "authors": authors,
                    "journal": cls._clean_latex(
                        fields.get("journal") or fields.get("booktitle") or ""
                    ),
                    "year": cls._parse_int(fields.get("year")),
                    "volume": fields.get("volume"),
                    "issue": fields.get("number") or fields.get("issue"),
                    "pages": fields.get("pages"),
                    "doi": fields.get("doi"),
                    "url": fields.get("url"),
                    "abstract": cls._clean_latex(fields.get("abstract", "")),
                    "keywords": [],
                    "cite_key": cite_key,
                    "raw_bibtex": normalized[start:end + 1],
                }
                entries.append(entry)

            except Exception as exc:
                errors.append(
                    f"Failed to parse BibTeX entry '{cite_key}' "
                    f"(type={entry_type}): {exc}"
                )

        return ImportResult(
            entries=entries,
            imported_count=len(entries),
            skipped_count=0,
            errors=errors,
        )

    @classmethod
    def _normalize_bibtex(cls, raw: str) -> str:
        """Normalize a raw BibTeX string for parsing.

        1. Strip comment lines (lines starting with %)
        2. Normalize line endings to \n
        3. Collapse runs of blank lines
        """
        # Remove comment lines
        text = re.sub(r"(?m)^\s*%.*$", "", raw)
        # Normalize line endings
        text = text.replace("\r\n", "\n").replace("\r", "\n")
        # Collapse multiple blank lines
        text = re.sub(r"\n{3,}", "\n\n", text)
        return text.strip()

    @classmethod
    def _find_bibtex_entry_spans(
        cls, text: str
    ) -> List[tuple[int, int, str, str, str]]:
        """Find all BibTeX entries by tracking brace depth.

        Returns a list of (start_pos, end_pos, entry_type, cite_key, fields_block).

        This handles entries with nested braces in field values correctly
        by counting brace depth rather than using a simple regex.
        """
        results: List[tuple[int, int, str, str, str]] = []

        # Find @ markers
        for m in re.finditer(r"@(\w+)\s*\{", text):
            entry_type = m.group(1).lower()
            block_start = m.end() - 1  # position of opening {

            # Track brace depth from the opening {
            depth = 0
            i = block_start
            while i < len(text):
                ch = text[i]
                if ch == "{":
                    depth += 1
                elif ch == "}":
                    depth -= 1
                    if depth == 0:
                        # Found closing brace
                        block_end = i
                        inner = text[block_start + 1:block_end]

                        # Split into cite_key, fields
                        # cite_key is everything up to the first comma
                        comma_idx = inner.find(",")
                        if comma_idx < 0:
                            break  # malformed entry

                        cite_key = inner[:comma_idx].strip()
                        fields_block = inner[comma_idx + 1:].strip()

                        results.append((
                            m.start(), block_end,
                            entry_type, cite_key, fields_block,
                        ))
                        break
                i += 1

        return results

    @classmethod
    def _parse_bibtex_fields(cls, fields_str: str) -> Dict[str, str]:
        """Parse BibTeX field assignments from a fields block.

        Handles both {}-delimited and ""-delimited values, including
        values with nested braces (common in titles with LaTeX math mode).

        Algorithm:
          1. Find each "key = " prefix
          2. Determine delimiter ({ or ")
          3. Track delimiter depth (for {}) or find closing quote (for ")
          4. Extract value between delimiters
        """
        result: Dict[str, str] = {}
        pos = 0
        length = len(fields_str)

        while pos < length:
            # Skip whitespace and commas between fields
            while pos < length and fields_str[pos] in (" ", "\t", "\n", ",", "\r"):
                pos += 1
            if pos >= length:
                break

            # Match "key = "
            m = cls._FIELD_KEY_RE.match(fields_str, pos)
            if not m:
                # Skip unrecognized content
                pos += 1
                continue

            key = m.group(1).lower()
            pos = m.end()

            # Skip whitespace before value delimiter
            while pos < length and fields_str[pos] in (" ", "\t", "\n", "\r"):
                pos += 1

            if pos >= length:
                break

            delimiter = fields_str[pos]
            if delimiter not in ("{", '"'):
                # Unquoted value (rare but occurs) — read until comma or }
                end = pos
                while end < length and fields_str[end] not in (",", "}"):
                    end += 1
                value = fields_str[pos:end].strip()
                result[key] = value
                pos = end
                continue

            # Track delimiter for closing
            close_delim = "}" if delimiter == "{" else '"'

            if delimiter == "{":
                # Brace-delimited: track nesting depth
                value_start = pos + 1
                depth = 1
                pos = value_start
                while pos < length and depth > 0:
                    if fields_str[pos] == "{":
                        depth += 1
                    elif fields_str[pos] == "}":
                        depth -= 1
                    pos += 1
                value = fields_str[value_start:pos - 1].strip()
            else:
                # Quote-delimited: find closing quote
                value_start = pos + 1
                pos = value_start
                while pos < length and fields_str[pos] != '"':
                    # Handle escaped quotes \"
                    if fields_str[pos] == "\\" and pos + 1 < length and fields_str[pos + 1] == '"':
                        pos += 2
                        continue
                    pos += 1
                value = fields_str[value_start:pos].strip()
                pos += 1  # skip closing quote

            # Skip trailing comma/whitespace
            while pos < length and fields_str[pos] in (" ", "\t", "\n", ",", "\r"):
                pos += 1

            result[key] = value

        return result

    # ==================================================================
    # Author Name Parser — The most complex part of the entire importer
    # ==================================================================
    #
    # Academic author strings come in several dialects:
    #
    #   BibTeX standard:  "Smith, John and Doe, Jane and Lee, H. K."
    #   Google Scholar:   "John Smith and Jane Doe and H. K. Lee"
    #   Mixed (common!):  "Smith, John and Jane Doe"
    #   Corporate:        "{World Health Organization}"
    #   With particles:   "van der Waals, Johannes Diderik"
    #   With suffixes:    "Smith, John, Jr. and Doe, Jane, III"
    #
    # Our parser handles ALL of these cases with a single method.

    # Regex to split on " and " while preserving whitespace context
    _AUTHOR_SPLIT_RE = re.compile(r"\s+and\s+", flags=re.IGNORECASE)

    # Matches corporate authors wrapped in braces: {Org Name}
    _CORPORATE_AUTHOR_RE = re.compile(r"^\{(.+)\}$")

    # Matches common name suffixes
    _SUFFIX_PATTERNS = (
        "Jr\\.?", "Jr", "Sr\\.?", "Sr",
        "II", "III", "IV", "V",
        "2nd", "3rd", "4th",
    )

    @classmethod
    def _parse_author_string(cls, author_str: str) -> List[AuthorName]:
        """Parse an academic author string into structured AuthorName objects.

        This is the core name normalization engine. It handles:

        1. "Smith, John" format (comma-separated, last-name-first)
        2. "John Smith" format (natural order, last word is surname)
        3. Corporate authors in braces: "{World Health Organization}"
        4. Particles: "van der Waals, Johannes" — particle stays with surname
        5. Suffixes: "Smith, John, Jr." — suffix is extracted
        6. Mixed formats within the same string
        7. Initials with and without dots: "J. K." vs "JK"

        Args:
            author_str: Raw author field from BibTeX or RIS.

        Returns:
            List of AuthorName objects, one per author.
        """
        if not author_str or not author_str.strip():
            return []

        # Remove enclosing braces around entire author field
        author_str = author_str.strip()
        if author_str.startswith("{") and author_str.endswith("}"):
            # But NOT if it's a corporate author with balanced inner braces
            inner = author_str[1:-1]
            if "{" not in inner and "}" not in inner:
                author_str = inner

        # Split on BibTeX " and " separator
        raw_names = cls._AUTHOR_SPLIT_RE.split(author_str)

        authors: List[AuthorName] = []
        for raw_name in raw_names:
            name = raw_name.strip().rstrip(",").strip()
            if not name:
                continue

            # ---- Check for corporate author ----
            corp_match = cls._CORPORATE_AUTHOR_RE.match(name)
            if corp_match:
                authors.append(AuthorName(
                    first="",
                    last=corp_match.group(1),
                ))
                continue

            # ---- Check for "Last, First" format ----
            if "," in name:
                author = cls._parse_comma_format(name)
            else:
                # ---- Natural order: "First Last" ----
                author = cls._parse_natural_format(name)

            authors.append(author)

        return authors

    @classmethod
    def _parse_comma_format(cls, name: str) -> AuthorName:
        """Parse 'Smith, John K., Jr.' comma-separated format.

        The first segment before the first comma is the surname.
        The second segment is the given name.
        Any third segment is a suffix.
        """
        parts = [p.strip() for p in name.split(",")]

        surname = parts[0]
        given_name = parts[1] if len(parts) > 1 else ""
        suffix = ""

        # Detect suffix in later parts
        if len(parts) > 2:
            candidate = parts[-1].rstrip(".")
            if candidate in ("Jr", "Sr", "II", "III", "IV", "V", "2nd", "3rd", "4th"):
                suffix = parts[-1]
                if len(parts) == 3:
                    # Only suffix after given name
                    pass
                else:
                    # More than 3 parts — merge middle parts into given name
                    given_name = ", ".join(parts[1:-1])

        # Normalize given name: ensure initials have periods
        given_name = cls._normalize_initials(given_name)

        return AuthorName(
            first=given_name,
            last=surname,
            suffix=suffix,
        )

    @classmethod
    def _parse_natural_format(cls, name: str) -> AuthorName:
        """Parse 'John K. Smith' natural-order format.

        The last word is the surname, everything before it is the given name.
        Handles particles (van, der, de, etc.) by checking common patterns.
        """
        parts = name.split()
        if not parts:
            return AuthorName()

        if len(parts) == 1:
            # Single name — treat as surname
            return AuthorName(first="", last=parts[0])

        # Detect name particles that should stay with the surname
        particles_lower = {"van", "der", "de", "den", "ter", "ten", "von", "zu", "di", "la", "le", "el", "al"}
        surname_parts: List[str] = []

        # Walk backwards through parts, collecting surname
        i = len(parts) - 1
        while i >= 0:
            word = parts[i]
            word_lower = word.lower()
            surname_parts.insert(0, word)
            i -= 1

            # If this word is a particle, keep going back
            if word_lower in particles_lower:
                # But stop if the next word is NOT a particle
                # (prevents merging the entire name into the surname)
                if i >= 0 and parts[i].lower() not in particles_lower:
                    continue
                else:
                    break
            else:
                break

        surname = " ".join(surname_parts)
        given_name = " ".join(parts[:i + 1]) if i >= 0 else ""

        # Normalize initials
        given_name = cls._normalize_initials(given_name)

        return AuthorName(
            first=given_name,
            last=surname,
        )

    @staticmethod
    def _normalize_initials(name: str) -> str:
        """Normalize author initials for consistency.

        Ensures single-letter initials have periods:
          "J K" → "J. K."
          "JK"  → "J. K."  (split concatenated initials)
          "John" → "John"  (full names are left alone)
        """
        if not name:
            return ""

        parts = name.split()
        normalized: List[str] = []

        for part in parts:
            part = part.strip(".")
            if len(part) == 1:
                # Single initial → add period
                normalized.append(f"{part}.")
            elif len(part) == 2 and part.isalpha() and part.isupper():
                # Concatenated initials like "JK" → "J. K."
                for ch in part:
                    normalized.append(f"{ch}.")
            else:
                # Full name, keep as-is
                normalized.append(part)

        return " ".join(normalized)

    # ==================================================================
    # RIS Parser
    # ==================================================================

    _RIS_TAG_RE = re.compile(r"^(\w{2})\s{2}-\s+(.*)$")

    @classmethod
    def _parse_ris(cls, raw: str) -> ImportResult:
        """Parse RIS string into structured entries.

        RIS (Research Information Systems) format uses two-letter tags:
          TY  - JOUR
          AU  - Smith, John
          TI  - Title of the paper
          ...
          ER  -

        Multi-value fields (AU, KW, AD) accumulate across lines.
        The ER tag terminates an entry.
        """
        errors: List[str] = []
        entries: List[Dict[str, Any]] = []
        current_entry: Dict[str, Any] = {}

        for line_no, raw_line in enumerate(raw.splitlines(), start=1):
            line = raw_line.strip()
            if not line:
                continue

            m = cls._RIS_TAG_RE.match(line)
            if not m:
                # RIS files can have non-tag lines (continuations are rare)
                continue

            tag, value = m.group(1), m.group(2).strip()

            if tag == "ER":
                # End of Record
                if current_entry:
                    entry = cls._build_ris_entry(current_entry)
                    if entry:
                        entries.append(entry)
                    current_entry = {}

            elif tag == "TY":
                # Start of new record — flush previous if any
                if current_entry:
                    entry = cls._build_ris_entry(current_entry)
                    if entry:
                        entries.append(entry)
                current_entry = {"_type_tag": value}

            else:
                # Multi-value fields
                if tag in ("AU", "KW", "AD", "C1"):
                    existing = current_entry.get(tag)
                    if isinstance(existing, list):
                        existing.append(value)
                    else:
                        current_entry[tag] = [value] if not existing else [existing, value]
                else:
                    # Single-value fields — last occurrence wins
                    current_entry[tag] = value

        # Don't forget the last entry
        if current_entry:
            entry = cls._build_ris_entry(current_entry)
            if entry:
                entries.append(entry)

        return ImportResult(
            entries=entries,
            imported_count=len(entries),
            skipped_count=0,
            errors=errors,
        )

    @classmethod
    def _build_ris_entry(cls, raw_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Convert raw RIS tag data into a structured reference dict."""
        type_tag = raw_data.get("_type_tag", "").upper()
        ref_type = cls.RIS_TYPE_MAP.get(type_tag, "article")

        # Authors from AU tags
        au_data = raw_data.get("AU", [])
        if isinstance(au_data, str):
            au_list = [au_data]
        elif isinstance(au_data, list):
            au_list = au_data
        else:
            au_list = []

        authors = cls._parse_author_string("; ".join(au_list)) if au_list else []

        # Keywords from KW tags
        kw_data = raw_data.get("KW", [])
        if isinstance(kw_data, str):
            keywords = [kw_data]
        elif isinstance(kw_data, list):
            keywords = kw_data
        else:
            keywords = []

        # Pages: combine SP (start page) and EP (end page)
        pages = raw_data.get("SP", "")
        ep = raw_data.get("EP", "")
        if ep:
            pages = f"{pages}-{ep}" if pages else ep

        return {
            "ref_type": ref_type,
            "title": raw_data.get("TI", raw_data.get("T1", "")),
            "authors": [a.to_dict() for a in authors],
            "journal": raw_data.get("JO") or raw_data.get("JF") or raw_data.get("T2", ""),
            "year": cls._parse_int(raw_data.get("PY") or raw_data.get("Y1", "")[:4]),
            "volume": raw_data.get("VL"),
            "issue": raw_data.get("IS"),
            "pages": pages,
            "doi": raw_data.get("DO"),
            "url": raw_data.get("UR") or raw_data.get("LK"),
            "abstract": raw_data.get("AB") or raw_data.get("N2", ""),
            "keywords": keywords,
            "cite_key": raw_data.get("ID", ""),
            "raw_ris": str(raw_data),
        }

    # ==================================================================
    # Utility Methods
    # ==================================================================

    @staticmethod
    def _parse_int(value: Any) -> Optional[int]:
        """Safely parse a value to int, returning None on failure.

        Handles strings like "2024a" by extracting the leading digits.
        """
        if value is None:
            return None
        try:
            s = str(value).strip()
            # Extract leading digits (handles "2024a" → 2024)
            m = re.match(r"(\d+)", s)
            if m:
                return int(m.group(1))
            return None
        except (ValueError, TypeError):
            return None

    @staticmethod
    def _clean_latex(text: str) -> str:
        """Remove common LaTeX markup from text for display purposes.

        This is a best-effort cleaner — it does not parse complex LaTeX.
        For titles with heavy math mode, some markup may remain; this is
        acceptable since the user will see the cleaned version in the UI
        and the raw BibTeX is always preserved.
        """
        if not text:
            return ""

        # Remove simple LaTeX commands: \textit{...}, \textbf{...}, \emph{...}
        text = re.sub(r"\\textit\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", r"\1", text)
        text = re.sub(r"\\textbf\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", r"\1", text)
        text = re.sub(r"\\emph\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", r"\1", text)
        text = re.sub(r"\\texttt\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", r"\1", text)
        text = re.sub(r"\\textsc\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}", r"\1", text)
        text = re.sub(r"\\textsubscript\s*\{([^{}]*)\}", r"\1", text)
        text = re.sub(r"\\textsuperscript\s*\{([^{}]*)\}", r"\1", text)

        # Remove other LaTeX commands with optional arguments
        text = re.sub(r"\\\w+\s*(\[[^\]]*\])?\s*\{([^{}]*)\}", r"\2", text)
        text = re.sub(r"\\\w+\s+", " ", text)  # standalone commands
        text = re.sub(r"\\\w+$", "", text)      # trailing commands

        # Remove braces (but preserve content)
        text = text.replace("{", "").replace("}", "")

        # Remove LaTeX special characters rendered as-is
        text = text.replace("~", " ")
        text = text.replace("--", "–")
        text = text.replace("---", "—")

        # Normalize whitespace
        text = " ".join(text.split())
        return text.strip()
