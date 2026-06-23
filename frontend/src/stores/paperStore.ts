/**
 * Zustand store — central state management for the paper writing wizard.
 *
 * Architecture decisions:
 *   - Zustand over Redux: the state tree is shallow (one paper + N sections),
 *     so Redux middleware overhead is unjustified.
 *   - Optimistic updates: section content changes are applied to local state
 *     immediately, then synced to the backend. On failure, the error is
 *     surfaced but the local state is NOT rolled back (the user's work
 *     should never be lost due to a network hiccup).
 *   - Mock data injection: when ?demo=1 is present in the URL or when
 *     `initWithMockData()` is called, the store is populated with a
 *     realistic H-MODRL agricultural logistics research scenario.
 */
import { create } from 'zustand';
import type {
  Paper, PaperSection, SectionContent, Paragraph, TextRun,
} from '../api/client';
import * as api from '../api/client';
import {
  MOCK_PAPER, MOCK_SECTIONS,
} from '../data/mockPaperData';

// ============================================================================
// Constants
// ============================================================================

export const SECTION_LABELS: Record<string, string> = {
  abstract: 'Abstract',
  introduction: 'Introduction',
  methods: 'Methods',
  results: 'Results',
  discussion: 'Discussion',
  conclusion: 'Conclusion',
};

export const SECTION_HELP: Record<string, string> = {
  abstract: (
    'Structured summary following the IMRaD convention. Include: Background '
    + '(what is known), Objective (what you aimed to do), Methods (how you did it), '
    + 'Results (what you found), Conclusion (what it means). Typically 150-300 words.'
  ),
  introduction: (
    'Three-move structure: (1) Establish the research territory — demonstrate '
    + 'the importance of the topic; (2) Identify a gap — what previous research '
    + 'has not addressed; (3) State your purpose — what this paper aims to '
    + 'contribute. End with a clear hypothesis or research question.'
  ),
  methods: (
    'Describe your study in sufficient detail that another researcher could '
    + 'replicate it. Include: study design type, participant/sample information, '
    + 'materials and instruments, procedure, and statistical analysis plan. '
    + 'For computational studies: algorithm architecture, parameter settings, '
    + 'baseline methods, evaluation metrics, and hardware/software environment.'
  ),
  results: (
    'Report your findings objectively. Do NOT interpret results here — that '
    + 'belongs in the Discussion. Include: descriptive statistics, inferential '
    + 'test results (with test statistics, p-values, effect sizes), and clear '
    + 'references to all figures and tables. Report non-significant findings too.'
  ),
  discussion: (
    'Interpret your results: (1) Summarize key findings; (2) Compare with '
    + 'previous literature (cite at least 3 works); (3) Explain mechanisms or '
    + 'reasons for your findings; (4) Acknowledge limitations honestly; '
    + '(5) Discuss practical and theoretical implications; (6) Suggest '
    + 'specific future research directions.'
  ),
  conclusion: (
    'Summarize the core contribution in 2-3 sentences. State what this work '
    + 'adds to the literature. Suggest one or two concrete future directions. '
    + 'Keep it concise — the conclusion is not a second abstract.'
  ),
};

export const SECTION_ORDER: string[] = [
  'abstract',
  'introduction',
  'methods',
  'results',
  'discussion',
  'conclusion',
];

// ============================================================================
// Validation severity type
// ============================================================================

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationIssue {
  rule_id: string;
  section: string;
  severity: ValidationSeverity;
  message: string;
  auto_fix_hint: string | null;
}

// ============================================================================
// Store interface
// ============================================================================

interface PaperStore {
  // ---- Paper state ----
  paper: Paper | null;
  sections: Record<string, PaperSection>;
  isLoading: boolean;
  error: string | null;

  // ---- Wizard state ----
  currentStep: number;

  // ---- PhraseBrowser state ----
  phraseBrowserOpen: boolean;
  activeSectionForPhrases: string | null;

  // ---- Validation state ----
  validationIssues: ValidationIssue[];

  // ---- Demo mode ----
  isDemoMode: boolean;

  // ---- Actions ----
  /** Initialize the store with mock demo data (no server required). */
  initWithMockData: () => void;

  /** Create a new paper via the backend API. */
  createPaper: (title: string, journal?: string) => Promise<void>;

  /** Load an existing paper from the backend. */
  loadPaper: (id: string) => Promise<void>;

  /** Navigate to a specific wizard step. */
  setCurrentStep: (step: number) => void;

  /** Persist a section's structured content to backend and local state. */
  updateSectionContent: (
    sectionName: string, content: SectionContent,
  ) => Promise<void>;

  /** Update only the plain text field of a section. */
  updateSectionPlainText: (
    sectionName: string, text: string,
  ) => Promise<void>;

  /** Mark a section as complete / incomplete. */
  toggleSectionComplete: (sectionName: string) => Promise<void>;

  /** Toggle the phrase browser for a section. */
  togglePhraseBrowser: (sectionName?: string) => void;

  /** Close the phrase browser. */
  closePhraseBrowser: () => void;

  /** Insert phrase text into a specific paragraph within a section. */
  insertPhraseIntoSection: (
    sectionName: string,
    paragraphIndex: number,
    phraseText: string,
  ) => void;

  /** Append a new empty paragraph to a section. */
  addParagraph: (sectionName: string) => void;

  /** Delete a paragraph from a section by index. */
  deleteParagraph: (sectionName: string, paragraphIndex: number) => void;

  /** Update a single run within a paragraph. */
  updateParagraphRun: (
    sectionName: string,
    paragraphIndex: number,
    runIndex: number,
    run: TextRun,
  ) => void;

  /** Insert a new run into a paragraph at a specific position. */
  insertRunIntoParagraph: (
    sectionName: string,
    paragraphIndex: number,
    runIndex: number,
    run: TextRun,
  ) => void;

  /** Clear all errors. */
  clearError: () => void;
}

// ============================================================================
// Store Implementation
// ============================================================================

export const usePaperStore = create<PaperStore>((set, get) => ({
  // ---- Initial State ----
  paper: null,
  sections: {},
  isLoading: false,
  error: null,
  currentStep: 0,
  phraseBrowserOpen: false,
  activeSectionForPhrases: null,
  validationIssues: [],
  isDemoMode: false,

  // ---- Demo Mode ----
  initWithMockData: () => {
    const { paper, sections } = MOCK_PAPER && MOCK_SECTIONS
      ? { paper: MOCK_PAPER, sections: MOCK_SECTIONS }
      : { paper: null, sections: {} };

    set({
      paper: paper as Paper | null,
      sections: sections as Record<string, PaperSection>,
      isLoading: false,
      error: null,
      currentStep: 2,  // Start on Methods (the richest section)
      isDemoMode: true,
    });
  },

  // ---- API Actions ----
  createPaper: async (title, journal) => {
    set({ isLoading: true, error: null });
    try {
      const paper = await api.createPaper(title, journal);
      const sectionList = await api.getSections(paper.id);
      const sectionsMap: Record<string, PaperSection> = {};
      for (const s of sectionList) {
        sectionsMap[s.section_name] = s;
      }
      set({
        paper,
        sections: sectionsMap,
        isLoading: false,
        currentStep: 0,
        isDemoMode: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      set({ error: msg, isLoading: false });
    }
  },

  loadPaper: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const paper = await api.getPaper(id);
      const sectionList = await api.getSections(paper.id);
      const sectionsMap: Record<string, PaperSection> = {};
      for (const s of sectionList) {
        sectionsMap[s.section_name] = s;
      }
      set({
        paper,
        sections: sectionsMap,
        isLoading: false,
        isDemoMode: false,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      set({ error: msg, isLoading: false });
    }
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  // ---- Section Content Operations ----

  updateSectionContent: async (sectionName, content) => {
    const { paper, sections, isDemoMode } = get();
    if (!paper) return;

    // Optimistic local update (never roll back — user data is sacred)
    const currentSection = sections[sectionName];
    if (currentSection) {
      const plainText = extractPlainText(content);
      const wordCount = countWords(content);
      const optimisticUpdate: PaperSection = {
        ...currentSection,
        content_json: content as unknown as Record<string, unknown>,
        plain_text: plainText,
        word_count: wordCount,
      } as PaperSection;

      set({
        sections: {
          ...get().sections,
          [sectionName]: optimisticUpdate,
        },
      });
    }

    // In demo mode, skip backend sync
    if (isDemoMode) return;

    // Backend sync (fire-and-forget for responsiveness)
    try {
      const result = await api.updateSection(paper.id, sectionName, {
        content_json: content,
        plain_text: extractPlainText(content),
        word_count: countWords(content),
      });
      set({
        sections: { ...get().sections, [sectionName]: result },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      set({ error: msg });
      // NOTE: local state is NOT rolled back — the user's changes persist
    }
  },

  updateSectionPlainText: async (sectionName, text) => {
    const { paper, isDemoMode } = get();
    if (!paper) return;

    if (isDemoMode) return;

    try {
      const result = await api.updateSection(paper.id, sectionName, {
        plain_text: text,
        word_count: text.split(/\s+/).filter(Boolean).length,
      });
      set({
        sections: { ...get().sections, [sectionName]: result },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      set({ error: msg });
    }
  },

  toggleSectionComplete: async (sectionName) => {
    const { paper, sections, isDemoMode } = get();
    if (!paper) return;

    const section = sections[sectionName];
    if (!section) return;

    const newIsComplete = !section.is_complete;

    // Optimistic update
    set({
      sections: {
        ...sections,
        [sectionName]: { ...section, is_complete: newIsComplete },
      },
    });

    if (isDemoMode) return;

    try {
      await api.updateSection(paper.id, sectionName, {
        is_complete: newIsComplete,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Save failed';
      set({ error: msg });
    }
  },

  // ---- Phrase Browser ----

  togglePhraseBrowser: (sectionName) => {
    const { phraseBrowserOpen, activeSectionForPhrases } = get();
    if (phraseBrowserOpen && activeSectionForPhrases === sectionName) {
      set({ phraseBrowserOpen: false, activeSectionForPhrases: null });
    } else {
      set({
        phraseBrowserOpen: true,
        activeSectionForPhrases: sectionName || null,
      });
    }
  },

  closePhraseBrowser: () => {
    set({ phraseBrowserOpen: false, activeSectionForPhrases: null });
  },

  // ---- Paragraph / Run Mutations ----

  insertPhraseIntoSection: (sectionName, paragraphIndex, phraseText) => {
    const { sections } = get();
    const section = sections[sectionName];
    if (!section) return;

    const content = (
      (section.content_json as unknown as SectionContent) || emptyContent()
    );
    const paragraphs = [...content.paragraphs];

    // Ensure the target paragraph exists
    while (paragraphs.length <= paragraphIndex) {
      paragraphs.push(emptyParagraph());
    }

    const runs = [...paragraphs[paragraphIndex].runs];
    runs.push({ type: 'text', text: phraseText });
    paragraphs[paragraphIndex] = { ...paragraphs[paragraphIndex], runs };

    get().updateSectionContent(sectionName, { ...content, paragraphs });
  },

  addParagraph: (sectionName) => {
    const { sections } = get();
    const section = sections[sectionName];
    if (!section) return;

    const content = (
      (section.content_json as unknown as SectionContent) || emptyContent()
    );
    const paragraphs = [...content.paragraphs];

    paragraphs.push(emptyParagraph());

    get().updateSectionContent(sectionName, { ...content, paragraphs });
  },

  deleteParagraph: (sectionName, paragraphIndex) => {
    const { sections } = get();
    const section = sections[sectionName];
    if (!section) return;

    const content = (
      (section.content_json as unknown as SectionContent) || emptyContent()
    );
    const paragraphs = content.paragraphs.filter((_, i) => i !== paragraphIndex);

    get().updateSectionContent(sectionName, { ...content, paragraphs });
  },

  updateParagraphRun: (sectionName, paragraphIndex, runIndex, run) => {
    const { sections } = get();
    const section = sections[sectionName];
    if (!section) return;

    const content = (
      (section.content_json as unknown as SectionContent) || emptyContent()
    );
    const paragraphs = [...content.paragraphs];

    if (paragraphs[paragraphIndex]) {
      const runs = [...paragraphs[paragraphIndex].runs];
      if (runs[runIndex]) {
        runs[runIndex] = { ...run };
        paragraphs[paragraphIndex] = { ...paragraphs[paragraphIndex], runs };
      }
    }

    get().updateSectionContent(sectionName, { ...content, paragraphs });
  },

  insertRunIntoParagraph: (sectionName, paragraphIndex, runIndex, run) => {
    const { sections } = get();
    const section = sections[sectionName];
    if (!section) return;

    const content = (
      (section.content_json as unknown as SectionContent) || emptyContent()
    );
    const paragraphs = [...content.paragraphs];

    if (paragraphs[paragraphIndex]) {
      const runs = [...paragraphs[paragraphIndex].runs];
      runs.splice(runIndex, 0, run);
      paragraphs[paragraphIndex] = { ...paragraphs[paragraphIndex], runs };
    }

    get().updateSectionContent(sectionName, { ...content, paragraphs });
  },

  clearError: () => set({ error: null }),
}));

// ============================================================================
// Helper Functions
// ============================================================================

function emptyParagraph(): Paragraph {
  return {
    id: `para_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    runs: [{ type: 'text', text: '' }],
  };
}

function emptyContent(): SectionContent {
  return {
    paragraphs: [],
    phrases_used: [],
    figures_refs: [],
    table_refs: [],
  };
}

function extractPlainText(content: SectionContent): string {
  if (!content?.paragraphs) return '';
  return content.paragraphs
    .map((p: Paragraph) =>
      (p.runs || [])
        .filter((r: TextRun) => r.type === 'text')
        .map((r: TextRun) => r.text || '')
        .join(' ')
    )
    .join('\n\n');
}

function countWords(content: SectionContent): number {
  const text = extractPlainText(content);
  return text.split(/\s+/).filter(Boolean).length;
}
