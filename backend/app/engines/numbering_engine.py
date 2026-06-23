"""
Numbering Engine — automatic sequential numbering for figures, tables, equations.
Supports both sequential (Fig. 1, 2, 3) and chapter-based (Fig. 2.1, 2.2) numbering.
"""
from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass
from enum import Enum


class NumberingStyle(str, Enum):
    SEQUENTIAL = "sequential"
    CHAPTER_BASED = "chapter_based"


@dataclass
class NumberedElement:
    """An element that needs numbering."""
    id: str
    type: str  # "figure", "table", "equation"
    section_name: Optional[str] = None
    order_key: Any = None  # Custom sort key


class NumberingEngine:
    """
    Manages auto-numbering of figures, tables, and equations across a paper.

    Usage:
        engine = NumberingEngine(NumberingStyle.SEQUENTIAL)
        numbered = engine.assign_numbers(elements, section_map)
        # numbered = {"fig_uuid_1": 1, "tab_uuid_1": 1, "fig_uuid_2": 2, ...}
    """

    def __init__(self, style: NumberingStyle = NumberingStyle.SEQUENTIAL):
        self.style = style
        self._counters: Dict[str, int] = {"figure": 0, "table": 0, "equation": 0}
        self._chapter_counters: Dict[str, Dict[str, int]] = {}

    def assign_numbers(
        self,
        elements: List[NumberedElement],
        section_map: Optional[Dict[str, str]] = None,
        existing_numbers: Optional[Dict[str, Union[int, str]]] = None,
    ) -> Dict[str, Union[int, str]]:
        """
        Assign sequential numbers to all elements.

        Args:
            elements: List of elements to number.
            section_map: Optional mapping of element.id -> section_name.
            existing_numbers: Already-assigned numbers to preserve (e.g. on reorder).

        Returns:
            Dict mapping element.id -> assigned number (int or str like "2.1").
        """
        self._counters = {"figure": 0, "table": 0, "equation": 0}
        self._chapter_counters = {}

        # Sort elements by section order, then by their custom order key
        sorted_elements = sorted(
            elements,
            key=lambda e: (
                section_map.get(e.id, "zzz") if section_map else "",
                e.order_key if e.order_key is not None else 0,
            ),
        )

        results: Dict[str, Union[int, str]] = {}

        for elem in sorted_elements:
            etype = elem.type
            section = section_map.get(elem.id, "1") if section_map else "1"

            if self.style == NumberingStyle.SEQUENTIAL:
                self._counters[etype] += 1
                results[elem.id] = self._counters[etype]

            elif self.style == NumberingStyle.CHAPTER_BASED:
                if section not in self._chapter_counters:
                    self._chapter_counters[section] = {
                        "figure": 0,
                        "table": 0,
                        "equation": 0,
                    }
                self._chapter_counters[section][etype] += 1
                results[elem.id] = (
                    f"{section}.{self._chapter_counters[section][etype]}"
                )

        # Merge with existing numbers (for elements not reprocessed)
        if existing_numbers:
            for k, v in existing_numbers.items():
                if k not in results:
                    results[k] = v

        return results

    def renumber(
        self,
        elements: List[NumberedElement],
        section_map: Optional[Dict[str, str]] = None,
    ) -> Dict[str, Union[int, str]]:
        """
        Full renumber — clears existing numbers and reassigns.
        Should be called when elements are added, removed, or reordered.
        """
        return self.assign_numbers(elements, section_map)

    def get_next_number(self, element_type: str) -> int:
        """Get the next number for a given element type (for preview)."""
        return self._counters.get(element_type, 0) + 1

    @staticmethod
    def format_label(
        element_type: str,
        number: Union[int, str],
        style: str = "long",
    ) -> str:
        """
        Format an element number as a display label.

        Args:
            element_type: "figure", "table", "equation"
            number: The assigned number (int or "2.1")
            style: "long" -> "Figure 1", "short" -> "Fig. 1"

        Returns:
            Formatted label string.
        """
        labels = {
            "figure": {"long": "Figure", "short": "Fig."},
            "table": {"long": "Table", "short": "Tab."},
            "equation": {"long": "Equation", "short": "Eq."},
        }
        label = labels.get(element_type, {}).get(style, element_type.title())
        return f"{label} {number}"

    def generate_labels(
        self,
        numbered_elements: Dict[str, Union[int, str]],
        element_type_map: Dict[str, str],
        style: str = "short",
    ) -> Dict[str, str]:
        """
        Generate display labels for all numbered elements.

        Returns:
            Dict of element_id -> formatted label.
        """
        return {
            elem_id: self.format_label(
                element_type_map.get(elem_id, "figure"), num, style
            )
            for elem_id, num in numbered_elements.items()
        }
