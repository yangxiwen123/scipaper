"""
Seed data for the Academic Phrasebank.
Categorized by section and function_tag, based on the Manchester Academic Phrasebank taxonomy.
Each entry has a template with {slots} that users fill in.
"""
from typing import List, Dict, Any

PHRASEBANK_SEED: List[Dict[str, Any]] = [
    # ============================================================
    # INTRODUCTION — Establishing the territory / importance
    # ============================================================
    {
        "section": "introduction",
        "function_tag": "establishing_importance",
        "sub_function": "claiming_centrality",
        "template_text": "{topic} plays a crucial role in {field}, with significant implications for {application_area}.",
        "slots": {
            "topic": {"type": "text", "required": True, "hint": "your research topic"},
            "field": {"type": "text", "required": True, "hint": "the broader field"},
            "application_area": {"type": "text", "required": True, "hint": "area where this matters"},
        },
        "example_filled": "Machine learning plays a crucial role in medical diagnostics, with significant implications for early cancer detection.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "introduction",
        "function_tag": "establishing_importance",
        "sub_function": "claiming_centrality",
        "template_text": "In recent years, there has been growing interest in {topic}, driven by {motivation}.",
        "slots": {
            "topic": {"type": "text", "required": True, "hint": "research topic"},
            "motivation": {"type": "text", "required": True, "hint": "what's driving this interest"},
        },
        "example_filled": "In recent years, there has been growing interest in renewable energy storage, driven by the urgent need for sustainable power solutions.",
        "academic_level": "basic",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "introduction",
        "function_tag": "establishing_importance",
        "sub_function": "claiming_centrality",
        "template_text": "{topic} has emerged as a {adjective} area of research within {field}.",
        "slots": {
            "topic": {"type": "text", "required": True, "hint": "your topic"},
            "adjective": {"type": "select", "required": True, "options": ["promising", "critical", "rapidly evolving", "controversial", "under-explored"]},
            "field": {"type": "text", "required": True, "hint": "academic field"},
        },
        "example_filled": "Quantum computing has emerged as a rapidly evolving area of research within computer science.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # INTRODUCTION — Identifying a gap / problem
    # ============================================================
    {
        "section": "introduction",
        "function_tag": "identifying_gap",
        "sub_function": "highlighting_problem",
        "template_text": "Despite considerable research on {existing_work}, {gap_description} remains poorly understood.",
        "slots": {
            "existing_work": {"type": "text", "required": True, "hint": "what has been studied"},
            "gap_description": {"type": "text", "required": True, "hint": "what we still don't know"},
        },
        "example_filled": "Despite considerable research on antibiotic resistance mechanisms, the role of environmental factors in resistance gene transfer remains poorly understood.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "introduction",
        "function_tag": "identifying_gap",
        "sub_function": "highlighting_problem",
        "template_text": "A key limitation of previous studies is that they {limitation}, which raises questions about {implication}.",
        "slots": {
            "limitation": {"type": "text", "required": True, "hint": "what previous studies failed to address"},
            "implication": {"type": "text", "required": True, "hint": "why this limitation matters"},
        },
        "example_filled": "A key limitation of previous studies is that they relied exclusively on self-reported data, which raises questions about measurement accuracy.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "introduction",
        "function_tag": "identifying_gap",
        "sub_function": "highlighting_problem",
        "template_text": "To date, no study has systematically examined {phenomenon} in the context of {context}.",
        "slots": {
            "phenomenon": {"type": "text", "required": True, "hint": "the thing that hasn't been studied"},
            "context": {"type": "text", "required": True, "hint": "the setting or population"},
        },
        "example_filled": "To date, no study has systematically examined the long-term effects of microplastic exposure in the context of human pregnancy outcomes.",
        "academic_level": "advanced",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "introduction",
        "function_tag": "identifying_gap",
        "sub_function": "contradictory_evidence",
        "template_text": "The evidence regarding {topic} is {contradiction_type}. While some studies suggest that {finding_a}, others report that {finding_b}.",
        "slots": {
            "topic": {"type": "text", "required": True, "hint": "the debated topic"},
            "contradiction_type": {"type": "select", "required": True, "options": ["inconclusive", "contradictory", "mixed", "limited"]},
            "finding_a": {"type": "text", "required": True, "hint": "what one side found"},
            "finding_b": {"type": "text", "required": True, "hint": "what the other side found"},
        },
        "example_filled": "The evidence regarding the effectiveness of cognitive behavioral therapy for chronic pain is inconclusive. While some studies suggest that it significantly reduces pain intensity, others report that its effects are comparable to placebo.",
        "academic_level": "advanced",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # INTRODUCTION — Stating purpose / objectives
    # ============================================================
    {
        "section": "introduction",
        "function_tag": "stating_purpose",
        "sub_function": "research_aim",
        "template_text": "The aim of this {study_type} is to {action} {target} in order to {purpose}.",
        "slots": {
            "study_type": {"type": "select", "required": True, "options": ["study", "investigation", "research", "randomized controlled trial", "systematic review"]},
            "action": {"type": "select", "required": True, "options": ["examine", "investigate", "evaluate", "compare", "determine", "characterize"]},
            "target": {"type": "text", "required": True, "hint": "what you are studying"},
            "purpose": {"type": "text", "required": True, "hint": "the broader purpose"},
        },
        "example_filled": "The aim of this study is to investigate the effects of sleep deprivation on cognitive performance in order to inform clinical guidelines for shift workers.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "introduction",
        "function_tag": "stating_purpose",
        "sub_function": "research_aim",
        "template_text": "We sought to {action} whether {hypothesis_or_question}.",
        "slots": {
            "action": {"type": "select", "required": True, "options": ["determine", "test", "investigate", "establish", "clarify"]},
            "hypothesis_or_question": {"type": "text", "required": True, "hint": "what you want to find out"},
        },
        "example_filled": "We sought to determine whether early intervention improves long-term outcomes in patients with mild cognitive impairment.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "introduction",
        "function_tag": "stating_purpose",
        "sub_function": "hypothesis",
        "template_text": "We hypothesized that {variable_a} would be {direction} associated with {variable_b}, after controlling for {covariates}.",
        "slots": {
            "variable_a": {"type": "text", "required": True, "hint": "independent variable"},
            "direction": {"type": "select", "required": True, "options": ["positively", "negatively", "significantly"]},
            "variable_b": {"type": "text", "required": True, "hint": "dependent variable"},
            "covariates": {"type": "text", "required": True, "hint": "control variables"},
        },
        "example_filled": "We hypothesized that physical activity would be positively associated with mental well-being, after controlling for age, gender, and socioeconomic status.",
        "academic_level": "advanced",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # INTRODUCTION — Outlining structure
    # ============================================================
    {
        "section": "introduction",
        "function_tag": "outlining_structure",
        "sub_function": "paper_structure",
        "template_text": "The remainder of this paper is structured as follows. Section {section_num_a} describes {content_a}. Section {section_num_b} presents {content_b}. Finally, Section {section_num_c} discusses {content_c}.",
        "slots": {
            "section_num_a": {"type": "text", "required": True, "hint": "section number (e.g., 2)"},
            "content_a": {"type": "text", "required": True, "hint": "what this section covers"},
            "section_num_b": {"type": "text", "required": True, "hint": "section number (e.g., 3)"},
            "content_b": {"type": "text", "required": True, "hint": "what this section covers"},
            "section_num_c": {"type": "text", "required": True, "hint": "section number (e.g., 4)"},
            "content_c": {"type": "text", "required": True, "hint": "what the final section covers"},
        },
        "example_filled": "The remainder of this paper is structured as follows. Section 2 describes the experimental methodology. Section 3 presents the main findings. Finally, Section 4 discusses the implications and limitations of this work.",
        "academic_level": "basic",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # METHODS — Describing experimental design
    # ============================================================
    {
        "section": "methods",
        "function_tag": "describing_design",
        "sub_function": "study_design",
        "template_text": "A {design_type} design was employed to {purpose}. Participants were recruited from {recruitment_source} between {start_date} and {end_date}.",
        "slots": {
            "design_type": {"type": "select", "required": True, "options": ["cross-sectional", "longitudinal", "randomized controlled", "quasi-experimental", "mixed-methods"]},
            "purpose": {"type": "text", "required": True, "hint": "what the design enables"},
            "recruitment_source": {"type": "text", "required": True, "hint": "where participants came from"},
            "start_date": {"type": "text", "required": True, "hint": "start of recruitment period"},
            "end_date": {"type": "text", "required": True, "hint": "end of recruitment period"},
        },
        "example_filled": "A cross-sectional design was employed to examine the prevalence of burnout among healthcare workers. Participants were recruited from three major hospitals between January 2024 and June 2024.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "methods",
        "function_tag": "describing_design",
        "sub_function": "participants",
        "template_text": "A total of {n} participants ({male_percent}% male; mean age = {mean_age} ± {sd_age} years) were included in the final analysis.",
        "slots": {
            "n": {"type": "number", "required": True, "hint": "total sample size"},
            "male_percent": {"type": "number", "required": False, "hint": "percentage of male participants"},
            "mean_age": {"type": "number", "required": False, "hint": "mean age"},
            "sd_age": {"type": "number", "required": False, "hint": "standard deviation of age"},
        },
        "example_filled": "A total of 342 participants (48.5% male; mean age = 34.2 ± 8.7 years) were included in the final analysis.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "methods",
        "function_tag": "describing_design",
        "sub_function": "inclusion_exclusion",
        "template_text": "Inclusion criteria were: {criteria_in}. Exclusion criteria were: {criteria_ex}.",
        "slots": {
            "criteria_in": {"type": "text", "required": True, "hint": "list inclusion criteria"},
            "criteria_ex": {"type": "text", "required": True, "hint": "list exclusion criteria"},
        },
        "example_filled": "Inclusion criteria were: age ≥ 18 years, diagnosis of type 2 diabetes, and ability to provide informed consent. Exclusion criteria were: pregnancy, severe renal impairment (eGFR < 30), and current participation in another clinical trial.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # METHODS — Data collection and measurement
    # ============================================================
    {
        "section": "methods",
        "function_tag": "data_collection",
        "sub_function": "measurement_instrument",
        "template_text": "{variable} was assessed using the {instrument} ({citation}), a validated {scale_type} with demonstrated {property} (Cronbach's α = {alpha}).",
        "slots": {
            "variable": {"type": "text", "required": True, "hint": "what was measured"},
            "instrument": {"type": "text", "required": True, "hint": "name of measurement tool"},
            "citation": {"type": "text", "required": True, "hint": "reference for the instrument"},
            "scale_type": {"type": "select", "required": True, "options": ["self-report questionnaire", "clinical interview", "behavioral task", "physiological measure"]},
            "property": {"type": "text", "required": True, "hint": "psychometric property (e.g., internal consistency)"},
            "alpha": {"type": "number", "required": False, "hint": "Cronbach's alpha value"},
        },
        "example_filled": "Depression severity was assessed using the Beck Depression Inventory-II (Beck et al., 1996), a validated self-report questionnaire with demonstrated internal consistency (Cronbach's α = 0.91).",
        "academic_level": "advanced",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # METHODS — Statistical analysis
    # ============================================================
    {
        "section": "methods",
        "function_tag": "statistical_analysis",
        "sub_function": "general_approach",
        "template_text": "All statistical analyses were conducted using {software} (version {version}). A {threshold}-tailed significance level of α = {alpha} was applied throughout.",
        "slots": {
            "software": {"type": "select", "required": True, "options": ["SPSS", "R", "Stata", "SAS", "Python"]},
            "version": {"type": "text", "required": True, "hint": "software version"},
            "threshold": {"type": "select", "required": True, "options": ["two", "one"]},
            "alpha": {"type": "number", "required": True, "hint": "significance level (usually 0.05)"},
        },
        "example_filled": "All statistical analyses were conducted using R (version 4.3.1). A two-tailed significance level of α = 0.05 was applied throughout.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "methods",
        "function_tag": "statistical_analysis",
        "sub_function": "specific_test",
        "template_text": "{comparison_type} were compared using {test_type}, with {adjustment} correction for multiple comparisons where appropriate.",
        "slots": {
            "comparison_type": {"type": "text", "required": True, "hint": "what is being compared (e.g., group means)"},
            "test_type": {"type": "select", "required": True, "options": ["independent t-tests", "paired t-tests", "one-way ANOVA", "repeated measures ANOVA", "chi-square tests", "Mann-Whitney U tests"]},
            "adjustment": {"type": "select", "required": True, "options": ["Bonferroni", "Holm-Bonferroni", "Benjamini-Hochberg", "Tukey's HSD"]},
        },
        "example_filled": "Group means were compared using one-way ANOVA, with Bonferroni correction for multiple comparisons where appropriate.",
        "academic_level": "advanced",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # RESULTS — Describing findings
    # ============================================================
    {
        "section": "results",
        "function_tag": "describing_findings",
        "sub_function": "significant_result",
        "template_text": "A significant {direction} in {variable} was observed between {group_a} (M = {mean_a}, SD = {sd_a}) and {group_b} (M = {mean_b}, SD = {sd_b}), {test_stat} = {value}, p {comparator} {p_value}.",
        "slots": {
            "direction": {"type": "select", "required": True, "options": ["increase", "decrease", "difference"]},
            "variable": {"type": "text", "required": True, "hint": "the measured variable"},
            "group_a": {"type": "text", "required": True, "hint": "name of first group"},
            "mean_a": {"type": "number", "required": True, "hint": "mean of group A"},
            "sd_a": {"type": "number", "required": True, "hint": "SD of group A"},
            "group_b": {"type": "text", "required": True, "hint": "name of second group"},
            "mean_b": {"type": "number", "required": True, "hint": "mean of group B"},
            "sd_b": {"type": "number", "required": True, "hint": "SD of group B"},
            "test_stat": {"type": "select", "required": True, "options": ["t({df})", "F({df1},{df2})", "χ²({df})", "U"]},
            "value": {"type": "number", "required": True, "hint": "test statistic value"},
            "comparator": {"type": "select", "required": True, "options": ["<", "=", ">"]},
            "p_value": {"type": "number", "required": True, "hint": "p-value (e.g., 0.001)"},
        },
        "example_filled": "A significant increase in reaction time was observed between the sleep-deprived group (M = 345.2, SD = 42.3) and the control group (M = 287.6, SD = 35.1), t(40) = 4.87, p < 0.001.",
        "academic_level": "advanced",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "results",
        "function_tag": "describing_findings",
        "sub_function": "non_significant_result",
        "template_text": "No significant difference in {variable} was found between {group_a} and {group_b}, {test_stat} = {value}, p = {p_value}.",
        "slots": {
            "variable": {"type": "text", "required": True, "hint": "the measured variable"},
            "group_a": {"type": "text", "required": True, "hint": "first group"},
            "group_b": {"type": "text", "required": True, "hint": "second group"},
            "test_stat": {"type": "select", "required": True, "options": ["t({df})", "F({df1},{df2})", "χ²({df})"]},
            "value": {"type": "number", "required": True, "hint": "test statistic"},
            "p_value": {"type": "number", "required": True, "hint": "p-value (e.g., 0.42)"},
        },
        "example_filled": "No significant difference in baseline anxiety scores was found between the treatment group and the control group, t(58) = 0.67, p = 0.51.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "results",
        "function_tag": "describing_findings",
        "sub_function": "correlation",
        "template_text": "A {strength} {direction} correlation was observed between {variable_a} and {variable_b}, r({df}) = {r_value}, p {comparator} {p_value}.",
        "slots": {
            "strength": {"type": "select", "required": True, "options": ["strong", "moderate", "weak"]},
            "direction": {"type": "select", "required": True, "options": ["positive", "negative"]},
            "variable_a": {"type": "text", "required": True, "hint": "first variable"},
            "variable_b": {"type": "text", "required": True, "hint": "second variable"},
            "df": {"type": "number", "required": True, "hint": "degrees of freedom"},
            "r_value": {"type": "number", "required": True, "hint": "correlation coefficient (e.g., 0.45)"},
            "comparator": {"type": "select", "required": True, "options": ["<", "=", ">"]},
            "p_value": {"type": "number", "required": True, "hint": "p-value"},
        },
        "example_filled": "A strong positive correlation was observed between physical activity levels and self-reported well-being, r(198) = 0.62, p < 0.001.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # RESULTS — Referring to figures and tables
    # ============================================================
    {
        "section": "results",
        "function_tag": "referring_to_displays",
        "sub_function": "figure_reference",
        "template_text": "As shown in Figure {figure_number}, {description_of_pattern}.",
        "slots": {
            "figure_number": {"type": "number", "required": True, "hint": "figure number"},
            "description_of_pattern": {"type": "text", "required": True, "hint": "what the figure shows"},
        },
        "example_filled": "As shown in Figure 2, reaction times increased linearly with sleep deprivation duration across all participant groups.",
        "academic_level": "basic",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "results",
        "function_tag": "referring_to_displays",
        "sub_function": "table_reference",
        "template_text": "Table {table_number} summarizes the {content_type} for {groups_or_conditions}.",
        "slots": {
            "table_number": {"type": "number", "required": True, "hint": "table number"},
            "content_type": {"type": "select", "required": True, "options": ["descriptive statistics", "regression results", "baseline characteristics", "outcome measures"]},
            "groups_or_conditions": {"type": "text", "required": True, "hint": "what groups or conditions are shown"},
        },
        "example_filled": "Table 1 summarizes the baseline characteristics for the treatment and control groups.",
        "academic_level": "basic",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # DISCUSSION — Interpreting results
    # ============================================================
    {
        "section": "discussion",
        "function_tag": "interpreting_results",
        "sub_function": "supporting_hypothesis",
        "template_text": "These findings are consistent with our hypothesis that {hypothesis_restatement}, suggesting that {interpretation}.",
        "slots": {
            "hypothesis_restatement": {"type": "text", "required": True, "hint": "restate your hypothesis"},
            "interpretation": {"type": "text", "required": True, "hint": "what the results mean"},
        },
        "example_filled": "These findings are consistent with our hypothesis that sleep quality mediates the relationship between screen time and academic performance, suggesting that interventions targeting sleep hygiene may be particularly effective.",
        "academic_level": "advanced",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "discussion",
        "function_tag": "interpreting_results",
        "sub_function": "unexpected_result",
        "template_text": "Contrary to expectations, we found that {unexpected_finding}. A possible explanation for this is that {tentative_explanation}.",
        "slots": {
            "unexpected_finding": {"type": "text", "required": True, "hint": "what was unexpected"},
            "tentative_explanation": {"type": "text", "required": True, "hint": "why this might be the case"},
        },
        "example_filled": "Contrary to expectations, we found that higher social media use was associated with lower reported loneliness. A possible explanation for this is that online interactions supplement rather than replace face-to-face social contact in this age group.",
        "academic_level": "advanced",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # DISCUSSION — Comparing with literature
    # ============================================================
    {
        "section": "discussion",
        "function_tag": "comparing_literature",
        "sub_function": "consistent_with",
        "template_text": "Our finding that {finding_summary} aligns with previous work by {author_citation}, who reported that {previous_finding}.",
        "slots": {
            "finding_summary": {"type": "text", "required": True, "hint": "your key finding"},
            "author_citation": {"type": "text", "required": True, "hint": "author name and year"},
            "previous_finding": {"type": "text", "required": True, "hint": "what previous study found"},
        },
        "example_filled": "Our finding that mindfulness training reduced cortisol levels aligns with previous work by Davidson et al. (2003), who reported that an 8-week mindfulness program significantly decreased stress hormone production.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "discussion",
        "function_tag": "comparing_literature",
        "sub_function": "contrasting_with",
        "template_text": "In contrast to {author_citation}, who found {previous_finding}, our data suggest that {different_finding}. This discrepancy may be attributable to {potential_reason}.",
        "slots": {
            "author_citation": {"type": "text", "required": True, "hint": "author and year of contrasting study"},
            "previous_finding": {"type": "text", "required": True, "hint": "what they found"},
            "different_finding": {"type": "text", "required": True, "hint": "what you found differently"},
            "potential_reason": {"type": "text", "required": True, "hint": "possible reason for difference"},
        },
        "example_filled": "In contrast to Smith et al. (2022), who found that remote work decreased productivity, our data suggest that hybrid work arrangements improved measured output. This discrepancy may be attributable to differences in industry sector and job role composition between the two samples.",
        "academic_level": "advanced",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # DISCUSSION — Acknowledging limitations
    # ============================================================
    {
        "section": "discussion",
        "function_tag": "acknowledging_limitations",
        "sub_function": "generalizability",
        "template_text": "Several limitations of this study should be noted. First, {limitation_a}. Second, {limitation_b}. These factors may limit the generalizability of our findings to {broader_context}.",
        "slots": {
            "limitation_a": {"type": "text", "required": True, "hint": "first limitation"},
            "limitation_b": {"type": "text", "required": True, "hint": "second limitation"},
            "broader_context": {"type": "text", "required": True, "hint": "what population/context this may not apply to"},
        },
        "example_filled": "Several limitations of this study should be noted. First, the sample was predominantly drawn from a single geographic region. Second, the cross-sectional design precludes causal inference. These factors may limit the generalizability of our findings to more diverse populations and clinical settings.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "discussion",
        "function_tag": "acknowledging_limitations",
        "sub_function": "methodological",
        "template_text": "A methodological limitation is that {method_issue}. Future studies should consider {improvement_suggestion}.",
        "slots": {
            "method_issue": {"type": "text", "required": True, "hint": "what methodological issue exists"},
            "improvement_suggestion": {"type": "text", "required": True, "hint": "how future studies can improve"},
        },
        "example_filled": "A methodological limitation is that all outcome measures were self-reported, which may introduce recall bias. Future studies should consider incorporating objective measures such as actigraphy or biomarker validation.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # DISCUSSION — Implications and future directions
    # ============================================================
    {
        "section": "discussion",
        "function_tag": "implications",
        "sub_function": "practical_implications",
        "template_text": "From a practical standpoint, these results suggest that {recommendation}. {stakeholder} should consider {action} when {context}.",
        "slots": {
            "recommendation": {"type": "text", "required": True, "hint": "what should be done"},
            "stakeholder": {"type": "text", "required": True, "hint": "who this applies to (e.g., clinicians, educators)"},
            "action": {"type": "text", "required": True, "hint": "specific action"},
            "context": {"type": "text", "required": True, "hint": "when/where this applies"},
        },
        "example_filled": "From a practical standpoint, these results suggest that workplace wellness programs should include sleep hygiene education. HR managers should consider offering flexible schedules when employees are recovering from night shift rotations.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "discussion",
        "function_tag": "implications",
        "sub_function": "future_research",
        "template_text": "Future research should examine whether {extension_question} using {suggested_method} in a {population} population.",
        "slots": {
            "extension_question": {"type": "text", "required": True, "hint": "what question remains"},
            "suggested_method": {"type": "select", "required": True, "options": ["a longitudinal design", "a randomized controlled trial", "qualitative methods", "a larger sample", "multi-site data collection"]},
            "population": {"type": "text", "required": True, "hint": "which population"},
        },
        "example_filled": "Future research should examine whether the observed effects persist beyond 12 months using a longitudinal design in a more ethnically diverse population.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },

    # ============================================================
    # CONCLUSION
    # ============================================================
    {
        "section": "conclusion",
        "function_tag": "summarizing_findings",
        "sub_function": "key_findings",
        "template_text": "In conclusion, this {study_type} demonstrates that {main_finding}. These findings contribute to our understanding of {broader_topic} by showing that {contribution}.",
        "slots": {
            "study_type": {"type": "select", "required": True, "options": ["study", "investigation", "randomized controlled trial", "systematic review", "meta-analysis"]},
            "main_finding": {"type": "text", "required": True, "hint": "your main finding"},
            "broader_topic": {"type": "text", "required": True, "hint": "the broader topic"},
            "contribution": {"type": "text", "required": True, "hint": "what this adds to knowledge"},
        },
        "example_filled": "In conclusion, this study demonstrates that a brief mindfulness intervention significantly reduces anxiety symptoms among university students. These findings contribute to our understanding of accessible mental health interventions by showing that even low-intensity programs can yield measurable clinical benefits.",
        "academic_level": "intermediate",
        "source": "Manchester Phrasebank",
    },
    {
        "section": "conclusion",
        "function_tag": "summarizing_findings",
        "sub_function": "contribution_statement",
        "template_text": "This work makes {number} key contributions to the {field} literature: ({contribution_a}) {description_a}, and ({contribution_b}) {description_b}.",
        "slots": {
            "number": {"type": "select", "required": True, "options": ["two", "three"]},
            "field": {"type": "text", "required": True, "hint": "your field"},
            "contribution_a": {"type": "text", "required": True, "hint": "label for first contribution (e.g., methodological)"},
            "description_a": {"type": "text", "required": True, "hint": "description of first contribution"},
            "contribution_b": {"type": "text", "required": True, "hint": "label for second contribution"},
            "description_b": {"type": "text", "required": True, "hint": "description of second contribution"},
        },
        "example_filled": "This work makes two key contributions to the cognitive neuroscience literature: (i) methodological — a validated paradigm for assessing working memory under dual-task conditions, and (ii) empirical — evidence that domain-general executive resources constrain multi-tasking performance.",
        "academic_level": "advanced",
        "source": "Manchester Phrasebank",
    },
]

# Total entries: 30 curated phrase templates covering all major sections and functions
