/**
 * Structured SCI Section Schemas
 *
 * Each SCI paper section is decomposed into labeled sub-fields with
 * hints, placeholders, and word guidance. This is the core of the
 * "zero-barrier" design — users fill in labeled blanks instead of
 * staring at an empty page.
 */

// ============================================================================
// Field Types
// ============================================================================

export type FieldType = 'textarea' | 'input' | 'select' | 'number' | 'richtext';

export interface FormField {
  /** Unique key for storing the field value in content_json */
  key: string;
  /** Human-readable label shown above the field */
  label: string;
  /** Sub-label explaining what this field should contain */
  hint: string;
  /** Placeholder text shown when the field is empty */
  placeholder: string;
  /** Field input type */
  type: FieldType;
  /** For select fields: dropdown options */
  options?: { label: string; value: string }[];
  /** Recommended word count range [min, max] */
  words?: [number, number];
  /** Is this field required to proceed? */
  required: boolean;
  /** Example filled text shown as a toggleable reference */
  example?: string;
}

export interface SectionSchema {
  /** Section identifier matching content_json key */
  sectionKey: string;
  /** Human-readable section name */
  title: string;
  /** Overall description of this section's purpose */
  description: string;
  /** Ordered list of sub-fields */
  fields: FormField[];
}

// ============================================================================
// Field Value Storage Type
// ============================================================================

/** Maps field keys to their user-entered values */
export type FieldValues = Record<string, string>;

// ============================================================================
// Section Schemas
// ============================================================================

export const SECTION_SCHEMAS: Record<string, SectionSchema> = {

  // ================================================================
  // ABSTRACT — 5 structured sub-sections
  // ================================================================
  abstract: {
    sectionKey: 'abstract',
    title: 'Abstract',
    description:
      'A structured summary of your entire paper. Each sub-section should be 1-3 sentences. Total: 150-300 words.',
    fields: [
      {
        key: 'background',
        label: 'Background — What is already known?',
        hint: '1-2 sentences establishing the broad research area and its importance.',
        placeholder:
          'e.g., Agricultural logistics plays a crucial role in food security, yet post-harvest losses remain a significant challenge...',
        type: 'textarea',
        words: [20, 60],
        required: true,
        example:
          'Post-harvest losses in agricultural supply chains account for approximately 30% of total production in developing countries, representing both an economic burden and a food security threat.',
      },
      {
        key: 'objective',
        label: 'Objective / Aim — What did you set out to do?',
        hint: '1 sentence stating the research purpose. Use verbs like "investigate", "examine", "determine".',
        placeholder:
          'e.g., This study aimed to investigate the effects of X on Y under Z conditions...',
        type: 'textarea',
        words: [10, 40],
        required: true,
        example:
          'This study aimed to develop and validate a hybrid optimization framework for reducing cold chain losses while minimizing transportation costs.',
      },
      {
        key: 'methods',
        label: 'Methods — How did you do it?',
        hint: 'Study design, sample, key measurements, and analysis approach. 1-2 sentences.',
        placeholder:
          'e.g., A randomized controlled trial was conducted with N participants... Data were analyzed using...',
        type: 'textarea',
        words: [15, 60],
        required: true,
        example:
          'A computational experiment was conducted using real-world logistics data from 50 distribution nodes. The proposed algorithm was compared against five established baselines across 30 independent runs.',
      },
      {
        key: 'results',
        label: 'Key Results — What did you find?',
        hint: 'The most important numerical findings. Include key statistics if applicable.',
        placeholder:
          'e.g., The intervention group showed a significant improvement of X% compared to the control group (p < 0.01)...',
        type: 'textarea',
        words: [15, 60],
        required: true,
        example:
          'The proposed method achieved a 17.3% reduction in loss rate and a 12.8% reduction in total cost compared to the best-performing baseline (p < 0.001).',
      },
      {
        key: 'conclusion',
        label: 'Conclusion — What does it mean?',
        hint: '1 sentence on the main takeaway and its broader significance.',
        placeholder:
          'e.g., These findings demonstrate that... suggesting potential applications in...',
        type: 'textarea',
        words: [10, 40],
        required: true,
        example:
          'These results confirm that integrating evolutionary optimization with reinforcement learning offers a viable path toward sustainable cold chain logistics management.',
      },
    ],
  },

  // ================================================================
  // INTRODUCTION — 4-move structure (Swales CARS model)
  // ================================================================
  introduction: {
    sectionKey: 'introduction',
    title: 'Introduction',
    description:
      'Follow the 4-move structure. Each move builds on the previous one to create a logical argument for why your study exists.',
    fields: [
      {
        key: 'research_territory',
        label: 'Move 1 — Establish the Research Territory',
        hint: 'Show that this research area is important, interesting, and relevant. Cite key works if you have references.',
        placeholder:
          'Start by stating the general topic and its significance. Then narrow down to your specific area...',
        type: 'textarea',
        words: [50, 200],
        required: true,
        example:
          'Agricultural supply chain optimization has emerged as a critical research area due to increasing global food demand and the urgent need to reduce post-harvest waste. Recent estimates indicate that...',
      },
      {
        key: 'research_gap',
        label: 'Move 2 — Identify the Gap / Problem',
        hint: 'What has previous research NOT addressed? Be specific. This is the most important paragraph of your introduction.',
        placeholder:
          'Despite considerable research on..., ...remains poorly understood. / A key limitation of previous studies is...',
        type: 'textarea',
        words: [50, 200],
        required: true,
        example:
          'Despite considerable research on vehicle routing for general logistics, the specific constraints of cold chain transportation — including time-varying temperature requirements and product freshness decay dynamics — remain poorly addressed.',
      },
      {
        key: 'research_purpose',
        label: 'Move 3 — State Your Purpose & Approach',
        hint: 'What exactly does this paper do? How? State your research question or hypothesis clearly.',
        placeholder:
          'The aim of this study is to... / We sought to determine whether... / We hypothesized that...',
        type: 'textarea',
        words: [30, 120],
        required: true,
        example:
          'This study proposes a hybrid multi-objective optimization framework that integrates evolutionary search with policy gradient learning to simultaneously optimize cost, freshness, and carbon emissions in cold chain logistics networks.',
      },
      {
        key: 'paper_structure',
        label: 'Move 4 — Outline the Paper Structure (Optional)',
        hint: 'Briefly tell the reader how the rest of the paper is organized. Common in longer papers.',
        placeholder:
          'The remainder of this paper is organized as follows. Section 2 describes...',
        type: 'textarea',
        words: [0, 80],
        required: false,
        example:
          'The remainder of this paper is structured as follows. Section 2 formalizes the problem and introduces the proposed framework. Section 3 presents experimental results. Section 4 discusses implications and limitations.',
      },
    ],
  },

  // ================================================================
  // METHODS — 5 structured sub-forms
  // ================================================================
  methods: {
    sectionKey: 'methods',
    title: 'Methods',
    description:
      'Describe your study in enough detail that another researcher could replicate it. Each sub-section is a required component of a complete Methods section.',
    fields: [
      {
        key: 'study_design',
        label: '1. Study Design',
        hint: 'What type of study is this? Specify the design and the overall methodological approach.',
        placeholder:
          'This study employed a [design type] design. The study was conducted at [location/setting] over a period of [duration]...',
        type: 'textarea',
        words: [30, 150],
        required: true,
        example:
          'A cross-sectional observational design was employed. Data were collected from three hospital sites between January and December 2024.',
      },
      {
        key: 'participants_or_materials',
        label: '2. Participants / Samples / Materials',
        hint: 'Who or what was studied? Include sample size, selection criteria, and key characteristics. For non-human studies: describe materials, data sources, or systems.',
        placeholder:
          'A total of N participants were recruited from... Inclusion criteria were... Exclusion criteria were...',
        type: 'textarea',
        words: [40, 200],
        required: true,
        example:
          'A total of 342 participants (48.5% male; mean age = 34.2 ± 8.7 years) were included in the final analysis. Inclusion criteria were: age ≥ 18 years, diagnosis confirmed by... Exclusion criteria included...',
      },
      {
        key: 'procedure',
        label: '3. Procedure / Data Collection',
        hint: 'Step-by-step description of what was done. Include measurement instruments, data collection methods, and experimental protocol.',
        placeholder:
          'Participants first completed... Then... [Variable] was measured using [instrument], a validated [scale type]...',
        type: 'textarea',
        words: [40, 200],
        required: true,
        example:
          'All participants completed the baseline assessment battery including the Beck Depression Inventory-II (BDI-II) and the State-Trait Anxiety Inventory (STAI). Physiological measures were collected using...',
      },
      {
        key: 'statistical_analysis',
        label: '4. Statistical Analysis',
        hint: 'What statistical methods were used? Include software, significance thresholds, and specific tests.',
        placeholder:
          'All analyses were conducted using [software] version [X]. Group differences were assessed using [test]. The significance threshold was set at α = 0.05...',
        type: 'textarea',
        words: [30, 150],
        required: true,
        example:
          'All statistical analyses were conducted using R (version 4.3.1). Group means were compared using one-way ANOVA with Bonferroni correction for multiple comparisons. A two-tailed significance level of α = 0.05 was applied throughout.',
      },
      {
        key: 'ethics',
        label: '5. Ethical Considerations & Limitations',
        hint: 'Was ethical approval obtained? Any methodological limitations to acknowledge upfront?',
        placeholder:
          'This study was approved by the [Institution] Ethics Committee (approval #...). All participants provided written informed consent...',
        type: 'textarea',
        words: [0, 100],
        required: false,
        example:
          'This study was approved by the Institutional Review Board of XXX University (Protocol #2024-001). All participants provided written informed consent prior to enrollment.',
      },
    ],
  },

  // ================================================================
  // RESULTS — 3 sub-forms
  // ================================================================
  results: {
    sectionKey: 'results',
    title: 'Results',
    description:
      'Report your findings objectively. Do not interpret — save that for Discussion. Reference all figures and tables you will include.',
    fields: [
      {
        key: 'descriptive_results',
        label: '1. Descriptive Statistics',
        hint: 'Report means, SDs, frequencies, percentages. Describe the sample and baseline characteristics.',
        placeholder:
          'Table 1 summarizes the baseline characteristics... The mean age was... The sample consisted of...',
        type: 'textarea',
        words: [30, 150],
        required: true,
        example:
          'Table 1 summarizes the demographic and baseline characteristics of the study sample. The mean age of participants was 34.2 years (SD = 8.7). The sample was 48.5% male and predominantly urban (72.3%).',
      },
      {
        key: 'inferential_results',
        label: '2. Inferential Statistics / Main Findings',
        hint: 'Report your hypothesis tests. Include test statistics, p-values, effect sizes, and confidence intervals.',
        placeholder:
          'A significant [difference/correlation/effect] was observed... t(df) = X.XX, p = 0.XXX, Cohen\'s d = X.XX...',
        type: 'textarea',
        words: [50, 300],
        required: true,
        example:
          'A significant reduction in symptom severity was observed in the treatment group (M = 12.3, SD = 3.1) compared to the control group (M = 18.7, SD = 4.2), t(58) = 5.43, p < 0.001, Cohen\'s d = 1.42.',
      },
      {
        key: 'additional_analyses',
        label: '3. Additional / Sensitivity Analyses (if any)',
        hint: 'Subgroup analyses, sensitivity checks, or unexpected findings that don\'t fit the main hypothesis.',
        placeholder:
          'Subgroup analysis revealed that... Sensitivity analysis confirmed that... No significant differences were found for...',
        type: 'textarea',
        words: [0, 150],
        required: false,
        example:
          'Subgroup analysis revealed that the treatment effect was larger in female participants (d = 1.8) than in male participants (d = 0.9). Sensitivity analyses excluding outliers did not change the significance of the primary outcome.',
      },
    ],
  },

  // ================================================================
  // DISCUSSION — 5 sub-forms
  // ================================================================
  discussion: {
    sectionKey: 'discussion',
    title: 'Discussion',
    description:
      'Now you can interpret your findings. Follow this 5-step structure for a complete Discussion.',
    fields: [
      {
        key: 'summary_of_findings',
        label: '1. Restate Key Findings (briefly)',
        hint: 'Start with a short summary of your main results. 2-3 sentences. Do not just repeat the Results section — distill the essence.',
        placeholder:
          'This study found that... The key finding was that...',
        type: 'textarea',
        words: [30, 100],
        required: true,
        example:
          'This study demonstrates that the proposed intervention significantly reduced symptom severity compared to standard care, with a large effect size (d = 1.42).',
      },
      {
        key: 'comparison_with_literature',
        label: '2. Compare with Previous Literature',
        hint: 'How do your findings align with or differ from previous studies? Cite specific works. Discuss at least 3 previous studies.',
        placeholder:
          'Our finding that... is consistent with previous work by [Author (Year)], who reported that... In contrast, [Author (Year)] found that...',
        type: 'textarea',
        words: [80, 300],
        required: true,
        example:
          'Our finding that the intervention reduced symptom severity aligns with the meta-analysis by Smith et al. (2023), who reported a pooled effect size of d = 1.2 across 15 trials. However, the magnitude of the effect in our study (d = 1.42) exceeds the upper bound of their 95% CI...',
      },
      {
        key: 'explanation',
        label: '3. Explain the Mechanisms',
        hint: 'Why do you think you got these results? What mechanisms or processes might explain the findings?',
        placeholder:
          'A possible explanation for these findings is that... This may be because... The mechanism underlying this effect could be...',
        type: 'textarea',
        words: [50, 200],
        required: true,
        example:
          'The larger effect size observed in our study may be attributable to the higher baseline severity of our sample compared to previous trials. Additionally, our intervention protocol included a booster session at week 4, which may have enhanced treatment adherence.',
      },
      {
        key: 'limitations',
        label: '4. Limitations',
        hint: 'Be honest about your study\'s weaknesses. Every study has them. Addressing limitations strengthens your credibility.',
        placeholder:
          'Several limitations should be noted. First, ... Second, ... These factors may limit the generalizability of our findings to...',
        type: 'textarea',
        words: [40, 200],
        required: true,
        example:
          'Several limitations should be noted. First, the sample was drawn from a single geographic region, which may limit generalizability. Second, the cross-sectional design precludes causal inference. Third, all outcome measures were self-reported.',
      },
      {
        key: 'implications',
        label: '5. Implications & Future Directions',
        hint: 'What does this mean for practice or theory? What should future research do?',
        placeholder:
          'These findings have implications for... Future research should examine whether...',
        type: 'textarea',
        words: [30, 150],
        required: true,
        example:
          'These findings suggest that incorporating booster sessions into treatment protocols may enhance outcomes. Future research should examine the long-term durability of these effects using a longitudinal design.',
      },
    ],
  },

  // ================================================================
  // CONCLUSION — 3 sub-forms
  // ================================================================
  conclusion: {
    sectionKey: 'conclusion',
    title: 'Conclusion',
    description:
      'A concise wrap-up. Do not introduce new information here.',
    fields: [
      {
        key: 'core_findings',
        label: '1. Core Finding Summary',
        hint: '1-2 sentences summarizing the main contribution. What is the one thing readers should remember?',
        placeholder:
          'In conclusion, this study demonstrates that...',
        type: 'textarea',
        words: [15, 60],
        required: true,
        example:
          'In conclusion, this study demonstrates that a brief, low-cost intervention can produce clinically meaningful reductions in anxiety symptoms among university students.',
      },
      {
        key: 'contributions',
        label: '2. Contributions to the Field',
        hint: 'What does this add to knowledge? Methodological innovation? Practical application? New theoretical insight?',
        placeholder:
          'This work contributes to the literature by...',
        type: 'textarea',
        words: [15, 80],
        required: true,
        example:
          'This work contributes to the literature by (a) providing the first evidence from a Chinese university context, and (b) demonstrating that even a 4-week intervention can produce effects comparable to 8-week programs.',
      },
      {
        key: 'future_work',
        label: '3. Future Research Directions',
        hint: '1-2 specific, actionable suggestions for what should be studied next.',
        placeholder:
          'Future research should...',
        type: 'textarea',
        words: [10, 60],
        required: false,
        example:
          'Future research should examine whether these effects persist beyond 12 months and whether the intervention is cost-effective at scale.',
      },
    ],
  },
};

// ============================================================================
// Utility: Get default empty values for a section schema
// ============================================================================

export function getDefaultFieldValues(sectionKey: string): FieldValues {
  const schema = SECTION_SCHEMAS[sectionKey];
  if (!schema) return {};
  const values: FieldValues = {};
  for (const field of schema.fields) {
    values[field.key] = '';
  }
  return values;
}

// ============================================================================
// Utility: Build a content_json SectionContent from structured field values
// ============================================================================

export function fieldValuesToSectionContent(
  sectionKey: string,
  values: FieldValues,
): { paragraphs: { id: string; runs: { type: string; text: string }[] }[]; phrases_used: string[]; figures_refs: string[]; table_refs: string[] } {
  const schema = SECTION_SCHEMAS[sectionKey];
  if (!schema) {
    return { paragraphs: [], phrases_used: [], figures_refs: [], table_refs: [] };
  }

  const paragraphs = schema.fields
    .filter((f) => values[f.key]?.trim())
    .map((f, i) => ({
      id: `${sectionKey}_field_${f.key}`,
      runs: [
        {
          type: 'text',
          text: values[f.key] || '',
        },
      ],
    }));

  return {
    paragraphs,
    phrases_used: [],
    figures_refs: [],
    table_refs: [],
  };
}
