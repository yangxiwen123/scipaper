/**
 * Zustand store — central state management for the paper writing wizard.
 */
import { create } from 'zustand';
import type { Paper, PaperSection, SectionContent, Paragraph, TextRun } from '../api/client';
import * as api from '../api/client';

// Section display names (English for internal use, Chinese for display)
export const SECTION_LABELS: Record<string, string> = {
  abstract: 'Abstract',
  introduction: 'Introduction',
  methods: 'Methods',
  results: 'Results',
  discussion: 'Discussion',
  conclusion: 'Conclusion',
};

export const SECTION_HELP: Record<string, string> = {
  abstract: 'Structured summary: Background → Objective → Methods → Results → Conclusion. Typically 150-300 words.',
  introduction: 'Establish the research territory → Identify a gap → State your purpose. Use the phrasebank for academic language.',
  methods: 'Describe your study design, participants, materials, procedure, and statistical analysis in sufficient detail for replication.',
  results: 'Report your findings objectively. Use figures and tables. Describe patterns, statistics, and effect sizes. Do NOT interpret here.',
  discussion: 'Interpret your results → Compare with literature → Acknowledge limitations → State implications. Use the phrasebank for comparing findings.',
  conclusion: 'Summarize key findings → State contributions → Suggest future directions. Keep it concise and impactful.',
};

export const SECTION_ORDER = [
  'abstract',
  'introduction',
  'methods',
  'results',
  'discussion',
  'conclusion',
];

interface PaperStore {
  // Paper state
  paper: Paper | null;
  sections: Record<string, PaperSection>;
  isLoading: boolean;
  error: string | null;

  // Wizard state
  currentStep: number;

  // PhraseBrowser state
  phraseBrowserOpen: boolean;
  activeSectionForPhrases: string | null;

  // Actions
  createPaper: (title: string, journal?: string) => Promise<void>;
  loadPaper: (id: string) => Promise<void>;
  setCurrentStep: (step: number) => void;
  updateSectionContent: (sectionName: string, content: SectionContent) => Promise<void>;
  updateSectionPlainText: (sectionName: string, text: string) => Promise<void>;
  togglePhraseBrowser: (sectionName?: string) => void;
  closePhraseBrowser: () => void;
  insertPhraseIntoSection: (
    sectionName: string,
    paragraphIndex: number,
    phraseText: string,
  ) => void;
  addParagraph: (sectionName: string) => void;
  updateParagraphRun: (
    sectionName: string,
    paragraphIndex: number,
    runIndex: number,
    run: TextRun,
  ) => void;
}

export const usePaperStore = create<PaperStore>((set, get) => ({
  paper: null,
  sections: {},
  isLoading: false,
  error: null,
  currentStep: 0,
  phraseBrowserOpen: false,
  activeSectionForPhrases: null,

  createPaper: async (title, journal) => {
    set({ isLoading: true, error: null });
    try {
      const paper = await api.createPaper(title, journal);
      const sections = await api.getSections(paper.id);
      const sectionsMap: Record<string, PaperSection> = {};
      sections.forEach((s) => {
        sectionsMap[s.section_name] = s;
      });
      set({ paper, sections: sectionsMap, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  loadPaper: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const paper = await api.getPaper(id);
      const sections = await api.getSections(paper.id);
      const sectionsMap: Record<string, PaperSection> = {};
      sections.forEach((s) => {
        sectionsMap[s.section_name] = s;
      });
      set({ paper, sections: sectionsMap, isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  updateSectionContent: async (sectionName, content) => {
    const { paper, sections } = get();
    if (!paper) return;

    // Optimistic update
    const section = sections[sectionName];
    if (section) {
      const updated = { ...section, content_json: content as any };
      set({ sections: { ...sections, [sectionName]: updated } });
    }

    try {
      const result = await api.updateSection(paper.id, sectionName, {
        content_json: content,
        plain_text: extractPlainText(content),
        word_count: countWords(content),
      });
      set({
        sections: { ...get().sections, [sectionName]: result },
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  updateSectionPlainText: async (sectionName, text) => {
    const { paper } = get();
    if (!paper) return;

    try {
      const result = await api.updateSection(paper.id, sectionName, {
        plain_text: text,
        word_count: text.split(/\s+/).filter(Boolean).length,
      });
      set({
        sections: { ...get().sections, [sectionName]: result },
      });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  togglePhraseBrowser: (sectionName) => {
    const { phraseBrowserOpen, activeSectionForPhrases } = get();
    if (phraseBrowserOpen && activeSectionForPhrases === sectionName) {
      set({ phraseBrowserOpen: false, activeSectionForPhrases: null });
    } else {
      set({ phraseBrowserOpen: true, activeSectionForPhrases: sectionName || null });
    }
  },

  closePhraseBrowser: () => set({ phraseBrowserOpen: false, activeSectionForPhrases: null }),

  insertPhraseIntoSection: (sectionName, paragraphIndex, phraseText) => {
    const { sections } = get();
    const section = sections[sectionName];
    if (!section) return;

    const content = (section.content_json || {}) as SectionContent;
    const paragraphs = [...(content.paragraphs || [])];
    if (paragraphs[paragraphIndex]) {
      const runs = [...paragraphs[paragraphIndex].runs];
      runs.push({ type: 'text', text: phraseText });
      paragraphs[paragraphIndex] = { ...paragraphs[paragraphIndex], runs };
    }
    const newContent: SectionContent = { ...content, paragraphs };
    get().updateSectionContent(sectionName, newContent);
  },

  addParagraph: (sectionName) => {
    const { sections } = get();
    const section = sections[sectionName];
    if (!section) return;

    const content = (section.content_json || {}) as SectionContent;
    const paragraphs = [...(content.paragraphs || [])];
    paragraphs.push({
      id: `para_${Date.now()}`,
      runs: [{ type: 'text', text: '' }],
    });
    const newContent: SectionContent = { ...content, paragraphs };
    get().updateSectionContent(sectionName, newContent);
  },

  updateParagraphRun: (sectionName, paragraphIndex, runIndex, run) => {
    const { sections } = get();
    const section = sections[sectionName];
    if (!section) return;

    const content = (section.content_json || {}) as SectionContent;
    const paragraphs = [...(content.paragraphs || [])];
    if (paragraphs[paragraphIndex]) {
      const runs = [...paragraphs[paragraphIndex].runs];
      runs[runIndex] = run;
      paragraphs[paragraphIndex] = { ...paragraphs[paragraphIndex], runs };
    }
    const newContent: SectionContent = { ...content, paragraphs };
    get().updateSectionContent(sectionName, newContent);
  },
}));

// Helper functions
function extractPlainText(content: SectionContent): string {
  if (!content.paragraphs) return '';
  return content.paragraphs
    .map((p) =>
      p.runs
        .filter((r) => r.type === 'text')
        .map((r) => r.text || '')
        .join(' ')
    )
    .join('\n\n');
}

function countWords(content: SectionContent): number {
  const text = extractPlainText(content);
  return text.split(/\s+/).filter(Boolean).length;
}
