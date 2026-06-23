"""
Phrase Assembler — template variable substitution engine.
Fills slot-based academic sentence templates with user-provided values.
"""
import re
from typing import Dict, List, Optional, Any
from uuid import UUID


class SlotValidationError(Exception):
    """Raised when required slots are missing or invalid."""


class PhraseAssembler:
    """
    Assembles filled academic phrases from templates with slot variables.

    Template syntax: "A significant {direction} was observed in {variable} (p < {value})"
    Slots config: {"direction": {"type": "select", "options": ["increase", "decrease"], "required": true},
                    "variable": {"type": "text", "required": true},
                    "value": {"type": "number", "required": false}}
    """

    SLOT_PATTERN = re.compile(r"\{(\w+)\}")

    @classmethod
    def extract_slots(cls, template_text: str) -> List[str]:
        """Extract all slot variable names from a template."""
        return cls.SLOT_PATTERN.findall(template_text)

    @classmethod
    def fill(
        cls,
        template_text: str,
        slots_config: Dict[str, Any],
        user_values: Dict[str, Any],
        validate: bool = True,
    ) -> str:
        """
        Fill template slots with user-provided values.

        Args:
            template_text: Template string with {slot_name} placeholders.
            slots_config: Slot definitions {name: {type, required, options, hint}}.
            user_values: User-provided slot values {name: value}.
            validate: Whether to validate required slots and types.

        Returns:
            Assembled text string with slots replaced by values.

        Raises:
            SlotValidationError: If validation fails.
        """
        if validate:
            cls._validate(template_text, slots_config, user_values)

        result = template_text
        slot_names = cls.extract_slots(template_text)

        for slot_name in slot_names:
            value = user_values.get(slot_name, "")
            placeholder = f"{{{slot_name}}}"
            result = result.replace(placeholder, str(value))

        return result

    @classmethod
    def preview(
        cls,
        template_text: str,
        slots_config: Dict[str, Any],
        user_values: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Generate a preview with filled slots highlighted, plus validation info.

        Returns:
            {
                "template_text": original template,
                "filled_text": assembled text,
                "filled_slots": {slot_name: value},
                "missing_slots": [slot_name, ...],
                "is_complete": bool
            }
        """
        missing = cls._get_missing_slots(template_text, slots_config, user_values)

        return {
            "template_text": template_text,
            "filled_text": cls.fill(template_text, slots_config, user_values, validate=False),
            "filled_slots": {
                name: user_values.get(name, "")
                for name in cls.extract_slots(template_text)
            },
            "missing_slots": missing,
            "is_complete": len(missing) == 0,
        }

    @classmethod
    def _validate(
        cls,
        template_text: str,
        slots_config: Dict[str, Any],
        user_values: Dict[str, Any],
    ) -> None:
        """Validate required slots are filled and types match."""
        errors = []

        # Check required slots
        missing = cls._get_missing_slots(template_text, slots_config, user_values)
        for slot_name in missing:
            hint = slots_config.get(slot_name, {}).get("hint", "")
            errors.append(f"Missing required slot '{slot_name}'" + (f": {hint}" if hint else ""))

        # Validate types
        for slot_name in cls.extract_slots(template_text):
            if slot_name not in user_values or not user_values[slot_name]:
                continue
            value = user_values[slot_name]
            slot_def = slots_config.get(slot_name, {})
            slot_type = slot_def.get("type", "text")

            if slot_type == "number":
                try:
                    float(str(value))
                except (ValueError, TypeError):
                    errors.append(
                        f"Slot '{slot_name}' expects a number, got: {value}"
                    )
            elif slot_type == "select":
                options = slot_def.get("options", [])
                if options and str(value) not in options:
                    errors.append(
                        f"Slot '{slot_name}' must be one of {options}, got: {value}"
                    )

        if errors:
            raise SlotValidationError("; ".join(errors))

    @classmethod
    def _get_missing_slots(
        cls,
        template_text: str,
        slots_config: Dict[str, Any],
        user_values: Dict[str, Any],
    ) -> List[str]:
        """Return list of required slots that are missing/empty."""
        missing = []
        for slot_name in cls.extract_slots(template_text):
            slot_def = slots_config.get(slot_name, {})
            if slot_def.get("required", True):
                if slot_name not in user_values or not str(user_values[slot_name]).strip():
                    missing.append(slot_name)
        return missing
