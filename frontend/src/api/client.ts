/**
 * API client — centralized HTTP requests to backend.
 */
import axios from 'axios';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Papers ----

export interface Paper {
  id: string;
  user_id: string;
  title: string;
  status: string;
  journal_target: string | null;
  citation_style: string;
  created_at: string;
  updated_at: string;
}

export interface PaperSection {
  id: string;
  paper_id: string;
  section_name: string;
  content_json: Record<string, any>;
  plain_text: string;
  word_count: number;
  is_complete: boolean;
  updated_at: string;
}

export interface SectionContent {
  paragraphs: Paragraph[];
  phrases_used: string[];
  figures_refs: string[];
  table_refs: string[];
}

export interface Paragraph {
  id: string;
  runs: TextRun[];
}

export interface TextRun {
  type: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  ref_ids?: string[];
  figure_id?: string;
  phrase_id?: string;
  slot_values?: Record<string, string>;
}

export async function createPaper(title: string, journal?: string): Promise<Paper> {
  const { data } = await apiClient.post('/papers', { title, journal_target: journal });
  return data;
}

export async function getPaper(id: string): Promise<Paper> {
  const { data } = await apiClient.get(`/papers/${id}`);
  return data;
}

export async function listPapers(): Promise<Paper[]> {
  const { data } = await apiClient.get('/papers');
  return data;
}

export async function getSections(paperId: string): Promise<PaperSection[]> {
  const { data } = await apiClient.get(`/papers/${paperId}/sections`);
  return data;
}

export async function updateSection(
  paperId: string,
  sectionName: string,
  content: Record<string, any>,
): Promise<PaperSection> {
  const { data } = await apiClient.put(`/papers/${paperId}/sections/${sectionName}`, content);
  return data;
}

// ---- Phrasebank ----

export interface Phrase {
  id: string;
  section: string;
  function_tag: string;
  sub_function: string | null;
  template_text: string;
  slots: Record<string, any>;
  example_filled: string | null;
  academic_level: string;
  source: string | null;
  usage_count: number;
}

export interface CategoryTree {
  [section: string]: {
    function_tag: string;
    sub_functions: { name: string; count: number }[];
    total_count: number;
  }[];
}

export async function getPhraseCategories(): Promise<CategoryTree> {
  const { data } = await apiClient.get('/phrasebank/categories');
  return data;
}

export async function searchPhrases(params: {
  section?: string;
  function_tag?: string;
  search?: string;
  limit?: number;
  offset?: number;
}): Promise<Phrase[]> {
  const { data } = await apiClient.get('/phrasebank/search', { params });
  return data;
}

export async function assemblePhrase(
  phraseId: string,
  slotValues: Record<string, string>,
): Promise<{
  phrase_id: string;
  template_text: string;
  filled_text: string;
  missing_slots: string[];
  is_complete: boolean;
}> {
  const { data } = await apiClient.post('/phrasebank/assemble', {
    phrase_id: phraseId,
    slot_values: slotValues,
  });
  return data;
}

// ---- References ----

export async function importReferences(
  paperId: string,
  rawData: string,
  format: string = 'auto',
) {
  const { data } = await apiClient.post('/references/import', {
    paper_id: paperId,
    raw_data: rawData,
    format,
  });
  return data;
}

// ---- Export ----

export async function validatePaper(paperId: string) {
  const { data } = await apiClient.post(`/export/validate/${paperId}`);
  return data;
}

export async function exportPaper(paperId: string, format: string = 'pdf', template: string = 'ieee') {
  const { data } = await apiClient.post(`/export/compile/${paperId}`, null, {
    params: { format, journal_template: template },
  });
  return data;
}

export function getDownloadUrl(paperId: string, format: string = 'pdf'): string {
  return `${API_BASE}/export/download/${paperId}?format=${format}`;
}

// ---- Journal Templates ----

export async function getJournalTemplates() {
  const { data } = await apiClient.get('/export/templates');
  return data;
}
