/**
 * Zustand 状态管理 — 论文写作核心数据层
 *
 * 两种模式:
 *   STANDALONE (isStandalone=true): 纯浏览器运行，数据存 localStorage，无需后端
 *   CONNECTED  (isStandalone=false): 对接 FastAPI 后端，完整 LaTeX/PDF 导出
 */
import { create } from 'zustand';
import type { Paper, PaperSection, SectionContent, Paragraph, TextRun } from '../api/client';
import * as api from '../api/client';

// ═══════════════════════════════════════════════════════════════
// 章节配置（中文）
// ═══════════════════════════════════════════════════════════════

export const SECTION_LABELS: Record<string, string> = {
  abstract:    '摘要',
  introduction:'引言',
  methods:     '研究方法',
  results:     '研究结果',
  discussion:  '讨论',
  conclusion:  '结论',
};

export const SECTION_HELP: Record<string, string> = {
  abstract: '摘要是论文的"名片"。按 ①背景→②目的→③方法→④结果→⑤结论 的顺序填写即可。通常 150-300 词。',
  introduction: '引言像讲故事：先让读者觉得"这个领域很重要"，然后告诉他"还有问题没解决"，最后说"所以我来解决"。核心是第 2 步（指出不足）。',
  methods: '方法部分的核心标准：别人看完你的描述，能不能把研究重复一遍？尽量具体，一步一步写清楚。',
  results: '⚠️ 结果部分只摆事实，不做解读。用数据和统计检验说话，解读留给"讨论"部分。',
  discussion: '讨论是展示思考深度的地方。按 5 步走：①回顾发现→②对比文献→③解释原因→④承认不足→⑤引申意义。',
  conclusion: '结论要简洁有力。2-3 句话说清楚：做了什么、贡献了什么、未来该做什么。不要引入新信息。',
};

export const SECTION_ORDER = ['abstract','introduction','methods','results','discussion','conclusion'];

// ═══════════════════════════════════════════════════════════════
// localStorage
// ═══════════════════════════════════════════════════════════════

const LS_PAPER = 'sciwriter_paper';
const LS_SECTIONS = 'sciwriter_sections';

function loadFromStorage(): { paper: Paper | null; sections: Record<string, PaperSection> } {
  try {
    const p = localStorage.getItem(LS_PAPER);
    const s = localStorage.getItem(LS_SECTIONS);
    if (p && s) return { paper: JSON.parse(p), sections: JSON.parse(s) };
  } catch {}
  return { paper: null, sections: {} };
}

function saveToStorage(paper: Paper | null, sections: Record<string, PaperSection>) {
  try {
    if (paper) localStorage.setItem(LS_PAPER, JSON.stringify(paper));
    localStorage.setItem(LS_SECTIONS, JSON.stringify(sections));
  } catch {}
}

function makeSection(paperId: string, name: string): PaperSection {
  return {
    id: `local_${name}_${Date.now()}`,
    paper_id: paperId,
    section_name: name,
    content_json: { paragraphs: [], phrases_used: [], figures_refs: [], table_refs: [], _fieldValues: {} },
    plain_text: '', word_count: 0, is_complete: false,
    updated_at: new Date().toISOString(),
  };
}

// ═══════════════════════════════════════════════════════════════
// Store
// ═══════════════════════════════════════════════════════════════

interface PaperStore {
  paper: Paper | null;
  sections: Record<string, PaperSection>;
  isLoading: boolean;
  error: string | null;
  currentStep: number;
  phraseBrowserOpen: boolean;
  activeSectionForPhrases: string | null;
  isStandalone: boolean;

  createStandalonePaper: (title: string, journal?: string) => void;
  createPaper: (title: string, journal?: string) => Promise<void>;
  loadPaper: (id: string) => Promise<void>;
  setCurrentStep: (step: number) => void;
  updateSectionContent: (sectionName: string, content: SectionContent) => Promise<void>;
  toggleSectionComplete: (sectionName: string) => Promise<void>;
  togglePhraseBrowser: (sectionName?: string) => void;
  closePhraseBrowser: () => void;
  insertPhraseIntoSection: (sectionName: string, fieldKey: string, text: string) => void;
  clearError: () => void;
}

export const usePaperStore = create<PaperStore>((set, get) => ({
  paper: null, sections: {}, isLoading: false, error: null,
  currentStep: 0, phraseBrowserOpen: false, activeSectionForPhrases: null,
  isStandalone: false,

  createStandalonePaper: (title, journal) => {
    const id = `local_paper_${Date.now()}`;
    const now = new Date().toISOString();
    const st = journal === 'nature' ? 'nature' : journal === 'elsevier' ? 'apa' : 'ieee';
    const paper: Paper = { id, user_id: 'local_user', title: title || '未命名论文', status: 'draft', journal_target: journal || null, citation_style: st, created_at: now, updated_at: now };
    const sections: Record<string, PaperSection> = {};
    for (const n of SECTION_ORDER) sections[n] = makeSection(id, n);
    saveToStorage(paper, sections);
    set({ paper, sections, isLoading: false, error: null, currentStep: 0, isStandalone: true });
  },

  createPaper: async (title, journal) => {
    set({ isLoading: true, error: null });
    try {
      const paper = await api.createPaper(title, journal);
      const list = await api.getSections(paper.id);
      const m: Record<string, PaperSection> = {};
      for (const s of list) m[s.section_name] = s;
      set({ paper, sections: m, isLoading: false, currentStep: 0, isStandalone: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  loadPaper: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const paper = await api.getPaper(id);
      const list = await api.getSections(paper.id);
      const m: Record<string, PaperSection> = {};
      for (const s of list) m[s.section_name] = s;
      set({ paper, sections: m, isLoading: false, isStandalone: false });
    } catch (e: any) { set({ error: e.message, isLoading: false }); }
  },

  setCurrentStep: (step) => set({ currentStep: step }),

  updateSectionContent: async (name, content) => {
    const { paper, sections, isStandalone } = get();
    if (!paper) return;
    const cur = sections[name]; if (!cur) return;
    const txt = extractText(content);
    const wc = txt.split(/\s+/).filter(Boolean).length;
    const upd: PaperSection = { ...cur, content_json: content as any, plain_text: txt, word_count: wc };
    const ns = { ...get().sections, [name]: upd };
    set({ sections: ns });
    if (isStandalone) { saveToStorage(paper, ns); return; }
    try {
      const r = await api.updateSection(paper.id, name, { content_json: content, plain_text: txt, word_count: wc });
      set({ sections: { ...get().sections, [name]: r } });
    } catch (e: any) { set({ error: e.message }); }
  },

  toggleSectionComplete: async (name) => {
    const { paper, sections, isStandalone } = get();
    if (!paper) return;
    const sec = sections[name]; if (!sec) return;
    const nv = !sec.is_complete;
    const ns = { ...sections, [name]: { ...sec, is_complete: nv } };
    set({ sections: ns });
    if (isStandalone) { saveToStorage(paper, ns); return; }
    try { await api.updateSection(paper.id, name, { is_complete: nv }); } catch {}
  },

  togglePhraseBrowser: (name) => {
    const s = get();
    if (s.phraseBrowserOpen && s.activeSectionForPhrases === name)
      set({ phraseBrowserOpen: false, activeSectionForPhrases: null });
    else
      set({ phraseBrowserOpen: true, activeSectionForPhrases: name || null });
  },
  closePhraseBrowser: () => set({ phraseBrowserOpen: false }),

  insertPhraseIntoSection: (name, fieldKey, text) => {
    const { sections } = get();
    const sec = sections[name]; if (!sec) return;
    const c = (sec.content_json || {}) as any;
    const fv = { ...(c._fieldValues || {}) };
    const ex = fv[fieldKey] || '';
    fv[fieldKey] = ex ? `${ex.trimEnd()} ${text}` : text;
    const nc = { ...c, _fieldValues: fv, paragraphs: Object.entries(fv).filter(([,v]) => String(v).trim()).map(([k,v]) => ({ id: `${name}_${k}`, runs: [{ type: 'text', text: String(v) }] })), phrases_used: c.phrases_used || [], figures_refs: c.figures_refs || [], table_refs: c.table_refs || [] };
    get().updateSectionContent(name, nc);
  },

  clearError: () => set({ error: null }),
}));

function extractText(c: SectionContent): string {
  if ((c as any)?._fieldValues) return Object.values((c as any)._fieldValues).filter(Boolean).join('\n\n');
  if (!c?.paragraphs) return '';
  return c.paragraphs.map((p: any) => (p.runs||[]).filter((r:any)=>r.type==='text').map((r:any)=>r.text||'').join(' ')).join('\n\n');
}
