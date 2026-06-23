"""
Citation Formatter — formats bibliography entries per citation style.
Supports IEEE, APA, Vancouver, Nature, and MLA styles.
"""
from typing import Dict, List, Any, Optional


class CitationFormatter:
    """
    Formats reference entries into styled citation strings.

    Supported styles: IEEE, APA 7th, Vancouver, Nature, MLA 9th.

    Usage:
        formatter = CitationFormatter("ieee")
        formatted = formatter.format(ref_entry_data, number=1)
    """

    STYLES = ["ieee", "apa", "vancouver", "nature", "mla"]

    def __init__(self, style: str = "ieee"):
        if style.lower() not in self.STYLES:
            raise ValueError(
                f"Unsupported citation style '{style}'. "
                f"Supported: {', '.join(self.STYLES)}"
            )
        self.style = style.lower()

    def format(self, ref: Dict[str, Any], number: int = 1) -> str:
        """
        Format a single reference entry.

        Args:
            ref: Reference data dict with keys like title, authors, journal, year, etc.
            number: Citation number (for numbered styles).

        Returns:
            Formatted citation string.
        """
        method = getattr(self, f"_format_{self.style}")
        return method(ref, number)

    def format_all(
        self, refs: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Format a list of references, adding 'formatted_text' to each.
        """
        results = []
        for i, ref in enumerate(refs, start=1):
            ref_copy = dict(ref)
            ref_copy["formatted_text"] = self.format(ref_copy, i)
            ref_copy["number"] = i
            results.append(ref_copy)
        return results

    # ---- IEEE Style ----
    # [1] J. K. Author, "Title of paper," Journal Name, vol. X, no. X, pp. XXX-XXX, Year.

    def _format_ieee(self, ref: Dict[str, Any], number: int) -> str:
        authors = self._format_authors_ieee(ref.get("authors", []))
        title = ref.get("title", "")
        journal = ref.get("journal", "")
        volume = ref.get("volume", "")
        issue = ref.get("issue", "")
        pages = ref.get("pages", "")
        year = ref.get("year", "")
        doi = ref.get("doi", "")

        parts = [f"[{number}]"]
        if authors:
            parts.append(f"{authors},")
        parts.append(f'"{title},"')
        if journal:
            parts.append(f"*{journal}*,")
        vol_info = []
        if volume:
            vol_info.append(f"vol. {volume}")
        if issue:
            vol_info.append(f"no. {issue}")
        if vol_info:
            parts.append(f"{', '.join(vol_info)},")
        if pages:
            parts.append(f"pp. {pages},")
        if year:
            parts.append(f"{year}.")
        if doi:
            parts.append(f"doi: {doi}.")

        return " ".join(parts)

    @staticmethod
    def _format_authors_ieee(authors: List[Dict[str, str]]) -> str:
        """Format authors as 'J. K. Author, S. M. Coauthor'"""
        if not authors:
            return ""
        formatted = []
        for a in authors:
            first = a.get("first", "")
            last = a.get("last", "")
            # Convert "John" to "J."
            initials = " ".join(
                f"{name[0]}." for name in first.split() if name
            )
            if initials:
                formatted.append(f"{initials} {last}")
            else:
                formatted.append(last)
        return ", ".join(formatted)

    # ---- APA 7th Style ----
    # Author, A. A., & Author, B. B. (Year). Title of article. Journal Name, Volume(Issue), pp-pp. https://doi.org/xxx

    def _format_apa(self, ref: Dict[str, Any], number: int) -> str:
        # APA is not numbered, but we accept number for consistency
        authors = self._format_authors_apa(ref.get("authors", []))
        year = ref.get("year", "")
        title = ref.get("title", "")
        journal = ref.get("journal", "")
        volume = ref.get("volume", "")
        issue = ref.get("issue", "")
        pages = ref.get("pages", "")
        doi = ref.get("doi", "")

        parts = []
        if authors:
            parts.append(f"{authors}")
        if year:
            parts.append(f"({year}).")
        parts.append(f"{title}.")
        if journal:
            journal_part = f"*{journal}*"
            if volume:
                journal_part += f", *{volume}*"
            if issue:
                journal_part += f"({issue})"
            parts.append(journal_part)
        if pages:
            parts.append(f"{pages}.")
        if doi:
            parts.append(f"https://doi.org/{doi}")

        return " ".join(parts)

    @staticmethod
    def _format_authors_apa(authors: List[Dict[str, str]]) -> str:
        """Format authors as 'Author, A. A., & Coauthor, B. B.'"""
        if not authors:
            return ""
        formatted = []
        for a in authors:
            last = a.get("last", "")
            first = a.get("first", "")
            initials = ". ".join(
                f"{name[0]}" for name in first.split() if name
            )
            if initials:
                formatted.append(f"{last}, {initials}.")
            else:
                formatted.append(last)

        if len(formatted) == 1:
            return formatted[0]
        elif len(formatted) == 2:
            return f"{formatted[0]}, & {formatted[1]}"
        else:
            return ", ".join(formatted[:-1]) + f", & {formatted[-1]}"

    # ---- Vancouver Style ----
    # 1. Author AB, Coauthor CD. Title. Journal. Year;Volume(Issue):Pages.

    def _format_vancouver(self, ref: Dict[str, Any], number: int) -> str:
        authors = self._format_authors_vancouver(ref.get("authors", []))
        title = ref.get("title", "")
        journal = ref.get("journal", "")
        year = ref.get("year", "")
        volume = ref.get("volume", "")
        issue = ref.get("issue", "")
        pages = ref.get("pages", "")

        parts = [f"{number}."]
        if authors:
            parts.append(f"{authors}.")
        parts.append(f"{title}.")
        if journal:
            parts.append(f"{journal}.")
        vol_info = str(year) if year else ""
        if volume:
            vol_info += f";{volume}"
        if issue:
            vol_info += f"({issue})"
        if pages:
            vol_info += f":{pages}"
        if vol_info:
            parts.append(f"{vol_info}.")

        return " ".join(parts)

    @staticmethod
    def _format_authors_vancouver(authors: List[Dict[str, str]]) -> str:
        """Format authors as 'Author AB, Coauthor CD'"""
        if not authors:
            return ""
        formatted = []
        for a in authors:
            last = a.get("last", "")
            first = a.get("first", "")
            initials = "".join(
                name[0] for name in first.split() if name
            )
            formatted.append(f"{last} {initials}")
        return ", ".join(formatted)

    # ---- Nature Style ----
    # Author, A. B. & Coauthor, C. D. Title. Journal Volume, Pages (Year).

    def _format_nature(self, ref: Dict[str, Any], number: int) -> str:
        authors = self._format_authors_nature(ref.get("authors", []))
        title = ref.get("title", "")
        journal = ref.get("journal", "")
        volume = ref.get("volume", "")
        pages = ref.get("pages", "")
        year = ref.get("year", "")

        parts = []
        if authors:
            parts.append(f"{authors}")
        parts.append(f"{title}.")
        if journal:
            parts.append(f"{journal}")
        if volume:
            parts.append(f"{volume},")
        if pages:
            parts.append(f"{pages}")
        if year:
            parts.append(f"({year}).")

        return " ".join(parts)

    @staticmethod
    def _format_authors_nature(authors: List[Dict[str, str]]) -> str:
        """Format authors as 'Author, A. B. & Coauthor, C. D.'"""
        if not authors:
            return ""
        formatted = []
        for a in authors:
            last = a.get("last", "")
            first = a.get("first", "")
            initials = ". ".join(
                f"{name[0]}" for name in first.split() if name
            )
            if initials:
                formatted.append(f"{last}, {initials}.")
            else:
                formatted.append(last)

        if len(formatted) == 1:
            return formatted[0]
        elif len(formatted) == 2:
            return f"{formatted[0]} & {formatted[1]}"
        else:
            return ", ".join(formatted[:-1]) + f" & {formatted[-1]}"

    # ---- MLA 9th Style ----
    # Author, First M., and First M. Coauthor. "Title." Journal, vol. X, no. X, Year, pp. XX-XX.

    def _format_mla(self, ref: Dict[str, Any], number: int) -> str:
        authors = self._format_authors_mla(ref.get("authors", []))
        title = ref.get("title", "")
        journal = ref.get("journal", "")
        volume = ref.get("volume", "")
        issue = ref.get("issue", "")
        year = ref.get("year", "")
        pages = ref.get("pages", "")
        doi = ref.get("doi", "")

        parts = []
        if authors:
            parts.append(f"{authors}.")
        parts.append(f'"{title}."')
        if journal:
            parts.append(f"*{journal}*,")
        if volume:
            parts.append(f"vol. {volume},")
        if issue:
            parts.append(f"no. {issue},")
        if year:
            parts.append(f"{year},")
        if pages:
            parts.append(f"pp. {pages}.")
        if doi:
            parts.append(f"doi:{doi}.")

        return " ".join(parts)

    @staticmethod
    def _format_authors_mla(authors: List[Dict[str, str]]) -> str:
        """Format authors MLA style: 'Smith, John M., and Jane D. Doe'"""
        if not authors:
            return ""
        formatted = []
        for a in authors:
            last = a.get("last", "")
            first = a.get("first", "")
            if first:
                formatted.append(f"{last}, {first}")
            else:
                formatted.append(last)

        if len(formatted) == 1:
            return formatted[0]
        elif len(formatted) == 2:
            return f"{formatted[0]}, and {formatted[1]}"
        else:
            return (
                ", ".join(formatted[:-1])
                + f", and {formatted[-1]}"
            )
