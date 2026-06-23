"""
Validation Service — multi-level completeness and correctness checking.
Enforces SCI paper writing rules through declarative JSON-based validation.
"""
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field
from enum import Enum


class Severity(str, Enum):
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"


@dataclass
class ValidationIssue:
    rule_id: str
    section: str
    severity: Severity
    message: str
    auto_fix_hint: Optional[str] = None


@dataclass
class ValidationResult:
    is_valid: bool
    issues: List[ValidationIssue] = field(default_factory=list)

    @property
    def errors(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == Severity.ERROR]

    @property
    def warnings(self) -> List[ValidationIssue]:
        return [i for i in self.issues if i.severity == Severity.WARNING]

    def add(self, issue: ValidationIssue):
        self.issues.append(issue)
        if issue.severity == Severity.ERROR:
            self.is_valid = False


# ---- Validation Rule Definitions ----
# Each rule is a dict that can be stored in DB or config file.
# condition uses a simple DSL: "field IS NULL", "field < value", "field NOT IN [...]"

DEFAULT_VALIDATION_RULES = [
    # === Methods Section ===
    {
        "rule_id": "methods_study_design",
        "section": "methods",
        "trigger": "on_section_complete",
        "check": "required_field",
        "field": "study_design",
        "message": "请说明实验设计类型（如随机对照试验、横断面研究、队列研究等）",
        "auto_fix_hint": "在Methods → 实验设计中填写研究设计类型",
        "severity": "error",
    },
    {
        "rule_id": "methods_sample_size",
        "section": "methods",
        "trigger": "on_section_complete",
        "check": "required_field",
        "field": "sample_size",
        "message": "请填写样本量（必须为正整数）",
        "auto_fix_hint": "在Methods → 参与者 → 样本量字段中填写",
        "severity": "error",
    },
    {
        "rule_id": "methods_inclusion_criteria",
        "section": "methods",
        "trigger": "on_section_complete",
        "check": "required_field",
        "field": "inclusion_criteria",
        "message": "请说明纳入和排除标准",
        "auto_fix_hint": "在Methods → 参与者 → 纳入/排除标准中填写",
        "severity": "error",
    },
    {
        "rule_id": "methods_main_outcome",
        "section": "methods",
        "trigger": "on_section_complete",
        "check": "required_field",
        "field": "primary_outcome",
        "message": "请明确主要结局指标",
        "auto_fix_hint": "在Methods → 结局指标中填写主要结局",
        "severity": "error",
    },
    {
        "rule_id": "methods_statistical_method",
        "section": "methods",
        "trigger": "on_section_complete",
        "check": "required_field",
        "field": "statistical_method",
        "message": "请说明使用的统计分析方法",
        "auto_fix_hint": "在Methods → 统计分析中填写",
        "severity": "error",
    },
    # === Results Section ===
    {
        "rule_id": "results_figure_caption_check",
        "section": "results",
        "trigger": "on_section_complete",
        "check": "figure_refs_exist",
        "message": "正文中引用的图表缺少对应的标题说明（caption）。请为每个图表添加标题。",
        "severity": "error",
    },
    {
        "rule_id": "results_table_data_check",
        "section": "results",
        "trigger": "on_section_complete",
        "check": "table_refs_exist",
        "message": "正文中引用的表格缺少实际数据。请上传或填写表格数据。",
        "severity": "error",
    },
    # === Discussion Section ===
    {
        "rule_id": "discussion_min_citations",
        "section": "discussion",
        "trigger": "on_section_complete",
        "check": "min_citations",
        "min_count": 3,
        "message": "Discussion部分应至少引用3篇文献进行结果对比讨论",
        "severity": "warning",
    },
    {
        "rule_id": "discussion_limitations",
        "section": "discussion",
        "trigger": "on_section_complete",
        "check": "required_field",
        "field": "limitations",
        "message": "请描述本研究的局限性",
        "severity": "warning",
    },
    # === Paper-level (pre-export) ===
    {
        "rule_id": "paper_citation_completeness",
        "section": "paper",
        "trigger": "on_export",
        "check": "citation_refs_match",
        "message": "正文中的所有引用标记必须在参考文献列表中有对应条目",
        "severity": "error",
    },
    {
        "rule_id": "paper_word_count_balance",
        "section": "paper",
        "trigger": "on_export",
        "check": "section_word_ratio",
        "max_ratio": 0.6,
        "message": "某个章节字数占比超过全文60%，请检查章节比例是否合理",
        "severity": "warning",
    },
    {
        "rule_id": "paper_title_exists",
        "section": "title",
        "trigger": "on_export",
        "check": "required_field",
        "field": "title",
        "message": "论文标题不能为空",
        "severity": "error",
    },
    # === Abstract ===
    {
        "rule_id": "abstract_word_limit",
        "section": "abstract",
        "trigger": "on_section_complete",
        "check": "word_count_range",
        "min_words": 150,
        "max_words": 300,
        "message": "摘要字数应在150-300词之间",
        "severity": "warning",
    },
    {
        "rule_id": "abstract_structure",
        "section": "abstract",
        "trigger": "on_section_complete",
        "check": "required_fields",
        "fields": ["background", "objective", "methods", "results", "conclusion"],
        "message": "摘要应包含Background、Objective、Methods、Results、Conclusion五个要素",
        "severity": "warning",
    },
]


class ValidationService:
    """
    Validates paper sections against predefined rules.

    Rules are checked at three levels:
    1. Field-level (onBlur) — instant feedback on single fields
    2. Section-level (on Next) — completeness check when moving to next step
    3. Paper-level (on Export) — full paper integrity before export
    """

    def __init__(self, rules: Optional[List[Dict[str, Any]]] = None):
        self.rules = rules or DEFAULT_VALIDATION_RULES

    def validate_section(
        self,
        section_name: str,
        content: Dict[str, Any],
        trigger: str = "on_section_complete",
    ) -> ValidationResult:
        """
        Validate a single section against applicable rules.

        Args:
            section_name: The section to validate (e.g. "methods", "results").
            content: The section data as a dict (content_json + metadata).
            trigger: The validation trigger ("on_blur", "on_section_complete", "on_export").

        Returns:
            ValidationResult with all issues found.
        """
        result = ValidationResult(is_valid=True)

        applicable_rules = [
            r for r in self.rules
            if r.get("section") == section_name and r.get("trigger") == trigger
        ]

        for rule in applicable_rules:
            issues = self._check_rule(rule, content)
            for issue in issues:
                result.add(issue)

        return result

    def validate_paper(
        self,
        sections: Dict[str, Dict[str, Any]],
        figures_count: int = 0,
        tables_count: int = 0,
        citations_count: int = 0,
        references_count: int = 0,
    ) -> ValidationResult:
        """
        Full paper validation before export.

        Args:
            sections: Dict of section_name -> section_data for all sections.
            figures_count: Total number of figures.
            tables_count: Total number of tables.
            citations_count: Total number of inline citations.
            references_count: Total number of reference entries.

        Returns:
            ValidationResult with all paper-level issues.
        """
        result = ValidationResult(is_valid=True)

        # Check paper-level rules
        paper_rules = [r for r in self.rules if r.get("trigger") == "on_export"]
        for rule in paper_rules:
            # Pass aggregated data for paper-level checks
            content = {
                "sections": sections,
                "figures_count": figures_count,
                "tables_count": tables_count,
                "citations_count": citations_count,
                "references_count": references_count,
            }
            issues = self._check_rule(rule, content)
            for issue in issues:
                result.add(issue)

        # Also validate each section
        for section_name, section_data in sections.items():
            section_result = self.validate_section(
                section_name, section_data, trigger="on_export"
            )
            result.issues.extend(section_result.issues)
            if not section_result.is_valid:
                result.is_valid = False

        return result

    def validate_field(
        self,
        section_name: str,
        field_name: str,
        value: Any,
    ) -> Optional[ValidationIssue]:
        """
        Quick field-level validation for real-time feedback.
        Returns a single issue or None if valid.
        """
        for rule in self.rules:
            if (
                rule.get("section") == section_name
                and rule.get("field") == field_name
                and rule.get("trigger") == "on_blur"
            ):
                if rule["check"] == "required_field" and not value:
                    return ValidationIssue(
                        rule_id=rule["rule_id"],
                        section=section_name,
                        severity=Severity(rule.get("severity", "error")),
                        message=rule["message"],
                        auto_fix_hint=rule.get("auto_fix_hint"),
                    )
        return None

    # ---- Rule Checking Logic ----

    def _check_rule(
        self, rule: Dict[str, Any], content: Dict[str, Any]
    ) -> List[ValidationIssue]:
        """Execute a single validation rule against content."""
        issues = []
        check_type = rule.get("check", "")

        if check_type == "required_field":
            field = rule.get("field", "")
            value = content.get(field)
            if value is None or (isinstance(value, (str, list, dict)) and not value):
                issues.append(self._make_issue(rule))

        elif check_type == "required_fields":
            fields = rule.get("fields", [])
            missing = [f for f in fields if not content.get(f)]
            if missing:
                issues.append(ValidationIssue(
                    rule_id=rule["rule_id"],
                    section=rule.get("section", ""),
                    severity=Severity(rule.get("severity", "error")),
                    message=f"{rule['message']}。缺少: {', '.join(missing)}",
                    auto_fix_hint=rule.get("auto_fix_hint"),
                ))

        elif check_type == "min_citations":
            min_count = rule.get("min_count", 1)
            citation_count = content.get("citation_count", 0)
            if citation_count < min_count:
                issues.append(self._make_issue(rule))

        elif check_type == "word_count_range":
            min_words = rule.get("min_words", 0)
            max_words = rule.get("max_words", float("inf"))
            word_count = content.get("word_count", 0)
            if word_count < min_words or word_count > max_words:
                issues.append(self._make_issue(rule))

        elif check_type == "citation_refs_match":
            if content.get("citations_count", 0) > content.get("references_count", 0):
                issues.append(self._make_issue(rule))

        elif check_type == "figure_refs_exist":
            figures_refs = content.get("figures_refs", [])
            figures_count = content.get("figures_count", 0)
            if len(figures_refs) > figures_count:
                issues.append(self._make_issue(rule))

        elif check_type == "table_refs_exist":
            table_refs = content.get("table_refs", [])
            tables_count = content.get("tables_count", 0)
            if len(table_refs) > tables_count:
                issues.append(self._make_issue(rule))

        return issues

    def _make_issue(self, rule: Dict[str, Any]) -> ValidationIssue:
        """Create a ValidationIssue from a rule definition."""
        return ValidationIssue(
            rule_id=rule["rule_id"],
            section=rule.get("section", ""),
            severity=Severity(rule.get("severity", "error")),
            message=rule["message"],
            auto_fix_hint=rule.get("auto_fix_hint"),
        )
