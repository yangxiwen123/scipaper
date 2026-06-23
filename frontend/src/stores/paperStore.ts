/**
 * Zustand store — paper state management with standalone localStorage support.
 *
 * Two modes:
 *   STANDALONE (isStandalone=true): All data in localStorage, zero backend dependency.
 *     Use this for demo, development, and competition judging.
 *   CONNECTED (isStandalone=false): Syncs with FastAPI backend for full pipeline.
 */
import { create } from 'zustand';
import type { Paper, PaperSection, SectionContent, Paragraph, TextRun } from '../api/client';
import * as api from '../api/client';

// ============================================================================
// Constants
// ============================================================================

export const SECTION_LABELS: Record<string, string> = {
  abstract: 'Abstract', introduction: 'Introduction', methods: 'Methods',
  results: 'Results', discussion: 'Discussion', conclusion: 'Conclusion',
};

export const SECTION_HELP: Record<string, string> = {
  abstract: 'Structured summary: Background → Objective → Methods → Results → Conclusion. Each sub-section is typically 2-3 sentences. 150-300 words total.',
  introduction: 'Three moves: (1) Establish importance of the topic; (2) Identify what previous research has NOT addressed (the gap); (3) State your research purpose and hypothesis.',
  methods: 'Describe in enough detail that another researcher could replicate your study. Include: study design, participants/materials, procedure, and statistical analysis.',
  results: 'Report findings objectively — do NOT interpret here. Include descriptive stats, inferential test results (with test statistics and p-values), and references to all figures and tables.',
  discussion: '(1) Summarize key findings; (2) Compare with literature (cite ≥3 works); (3) Explain mechanisms; (4) Acknowledge limitations; (5) State implications.',
  conclusion: 'Summarize the core contribution in 2-3 sentences. State what this work adds to the field. Suggest 1-2 concrete future directions. Keep it concise.',
};

export const SECTION_ORDER = ['abstract', 'introduction', 'methods', 'results', 'discussion', 'conclusion'];

// ============================================================================
// localStorage keys
// ============================================================================

const LS_PAPER_KEY = 'sciwriter_paper';
const LS_SECTIONS_KEY = 'sciwriter_sections';

// ============================================================================
// Store interface
// ============================================================================

interface PaperStore {
  paper: Paper | null;
  sections: Record<string, PaperSection>;
  isLoading: boolean;
  error: string | null;
  currentStep: number;
  phraseBrowserOpen: boolean;
  activeSectionForPhrases: string | null;
  isStandalone: boolean;

  /** Create a blank paper in localStorage (no backend). */
  createStandalonePaper: (title: string, journal?: string) => void;
  /** Create a paper via the backend API. */
  createPaper: (title: string, journal?: string) => Promise<void>;
  /** Load paper from backend. */
  loadPaper: (id: string) => Promise<void>;
  setCurrentStep: (step: number) => void;
  /** Update a section's structured content. Persists to localStorage or backend. */
  updateSectionContent: (sectionName: string, content: SectionContent) => Promise<void>;
  toggleSectionComplete: (sectionName: string) => Promise<void>;
  togglePhraseBrowser: (sectionName?: string) => void;
  closePhraseBrowser: () => void;
  insertPhraseIntoSection: (sectionName: string, fieldKey: string, phraseText: string) => void;
  clearError: () => void;
}

// ============================================================================
// localStorage helpers
// ============================================================================

function loadFromStorage(): { paper: Paper | null; sections: Record<string, PaperSection> } {
  try {
    const paperStr = localStorage.getItem(LS_PAPER_KEY);
    const sectionsStr = localStorage.getItem(LS_SECTIONS_KEY);
    if (paperStr && sectionsStr) {
      return {
        paper: JSON.parse(paperStr),
        sections: JSON.parse(sectionsStr),
      };
    }
  } catch { /* corrupted data, ignore */ }
  return { paper: null, sections: {} };
}

function saveToStorage(paper: Paper | null, sections: Record<string, PaperSection>) {
  try {
    if (paper) localStorage.setItem(LS_PAPER_KEY, JSON.stringify(paper));
    localStorage.setItem(LS_SECTIONS_KEY, JSON.stringify(sections));
  } catch { /* quota exceeded, ignore */ }
}

function makeSection(paperId: string, name: string): PaperSection {
  return {
    id: `local_${name}_${Date.now()}`,
    paper_id: paperId,
    section_name: name,
    content_json: { paragraphs: [], phrases_used: [], figures_refs: [], table_refs: [], _fieldValues: {} },
    plain_text: '',
    word_count: 0,
    is_complete: false,
    updated_at: new Date().toISOString(),
  };
}

// ============================================================================
// Store
// ============================================================================

export const usePaperStore = create<PaperStore>((set, get) => ({
  paper: null,
  sections: {},
  isLoading: false,
  error: null,
  currentStep: 0,
  phraseBrowserOpen: false,
  activeSectionForPhrases: null,
  isStandalone: false,

  // ---- Standalone: Create paper in localStorage ----
  createStandalonePaper: (title, journal) => {
    const id = `local_paper_${Date.now()}`;
    const now = new Date().toISOString();
    const paper: Paper = {
      id,
      user_id: 'local_user',
      title: title || 'Untitled Paper',
      status: 'draft',
      journal_target: journal || null,
      citation_style: journal === 'nature' ? 'nature' : journal === 'elsevier' ? 'apa' : 'ieee',
      created_at: now,
      updated_at: now,
    };
    const sections: Record<string, PaperSection> = {};
    for (const name of SECTION_ORDER) {
      sections[name] = makeSection(id, name);
    }
    saveToStorage(paper, sections);
    set({ paper, sections, isLoading: false, error: null, currentStep: 0, isStandalone: true });
  },

  // ---- Connected: Create paper via API ----
  createPaper: async (title, journal) => {
    set({ isLoading: true, error: null });
    try {
      const paper = await api.createPaper(title, journal);
      const list = await api.getSections(paper.id);
      const map: Record<string, PaperSection> = {};
      for (const s of list) map[s.section_name] = s;
      set({ paper, sections: map, isLoading: false, currentStep: 0, isStandalone: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  loadPaper: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const paper = await api.getPaper(id);
      const list = await api.getSections(paper.id);
      const map: Record<string, PaperSection> = {};
      for (const s of list) map[s.section_name] = s;
      set({ paper, sections: map, isLoading: false, isStandalone: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  // ---- Update section content ----
  updateSectionContent: async (sectionName, content) => {
    const { paper, sections, isStandalone } = get();
    if (!paper) return;

    // Build section
    const current = sections[sectionName];
    if (!current) return;
    const plainText = extractText(content);
    const updated: PaperSection = {
      ...current,
      content_json: content as any,
      plain_text: plainText,
      word_count: plainText.split(/\s+/).filter(Boolean).length,
    };

    // Optimistic update
    const newSections = { ...get().sections, [sectionName]: updated };
    set({ sections: newSections });

    // Persist
    if (isStandalone) {
      saveToStorage(paper, newSections);
      return;
    }

    try {
      const result = await api.updateSection(paper.id, sectionName, {
        content_json: content,
        plain_text: plainText,
        word_count: updated.word_count,
      });
      set({ sections: { ...get().sections, [sectionName]: result } });
    } catch (err: any) {
      set({ error: err.message });
    }
  },

  toggleSectionComplete: async (sectionName) => {
    const { paper, sections, isStandalone } = get();
    if (!paper) return;
    const sec = sections[sectionName];
    if (!sec) return;
    const newVal = !sec.is_complete;
    const newSections = { ...sections, [sectionName]: { ...sec, is_complete: newVal } };
    set({ sections: newSections });

    if (isStandalone) {
      saveToStorage(paper, newSections);
      return;
    }
    try { await api.updateSection(paper.id, sectionName, { is_complete: newVal }); } catch {}
  },

  togglePhraseBrowser: (sectionName) => {
    const s = get();
    if (s.phraseBrowserOpen && s.activeSectionForPhrases === sectionName) {
      set({ phraseBrowserOpen: false, activeSectionForPhrases: null });
    } else {
      set({ phraseBrowserOpen: true, activeSectionForPhrases: sectionName || null });
    }
  },
  closePhraseBrowser: () => set({ phraseBrowserOpen: false }),

  insertPhraseIntoSection: (sectionName, fieldKey, phraseText) => {
    const { sections } = get();
    const sec = sections[sectionName];
    if (!sec) return;

    const content = (sec.content_json || {}) as any;
    const fv = { ...(content._fieldValues || {}) };
    const existing = fv[fieldKey] || '';
    fv[fieldKey] = existing ? `${existing.trimEnd()} ${phraseText}` : phraseText;

    const newContent = {
      ...content,
      _fieldValues: fv,
      paragraphs: Object.entries(fv)
        .filter(([, v]) => String(v).trim())
        .map(([k, v]) => ({ id: `${sectionName}_${k}`, runs: [{ type: 'text', text: String(v) }] })),
      phrases_used: content.phrases_used || [],
      figures_refs: content.figures_refs || [],
      table_refs: content.table_refs || [],
    };

    get().updateSectionContent(sectionName, newContent);
  },

  clearError: () => set({ error: null }),
}));

// ============================================================================
// Helpers
// ============================================================================

function extractText(content: SectionContent): string {
  if ((content as any)?._fieldValues) {
    return Object.values((content as any)._fieldValues).filter(Boolean).join('\n\n');
  }
  if (!content?.paragraphs) return '';
  return content.paragraphs
    .map((p: any) => (p.runs || []).filter((r: any) => r.type === 'text').map((r: any) => r.text || '').join(' '))
    .join('\n\n');
}
