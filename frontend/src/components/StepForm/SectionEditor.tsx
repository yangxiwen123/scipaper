/**
 * SectionEditor — paragraph-level editor for a single paper section.
 *
 * Each paragraph is an independently editable block with:
 *   - Auto-resizing textareas for TextRuns
 *   - Inline tags for citations, figure references, and phrase templates
 *   - Paragraph-level word count
 *   - Add/delete paragraph controls
 *
 * The editor delegates ALL state mutations to the Zustand store.
 * It never holds local state that could diverge from the store.
 */
import { useCallback } from 'react';
import {
  Input, Button, Space, Empty, Typography, Tag, Tooltip, Popconfirm,
} from 'antd';
import {
  PlusOutlined, DeleteOutlined, HolderOutlined,
  ExperimentOutlined, LinkOutlined,
} from '@ant-design/icons';
import { usePaperStore, SECTION_LABELS } from '../../stores/paperStore';
import type { SectionContent, Paragraph, TextRun } from '../../api/client';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  sectionName: string;
}

export function SectionEditor({ sectionName }: Props) {
  const {
    sections,
    addParagraph,
    deleteParagraph,
    updateParagraphRun,
  } = usePaperStore();

  const section = sections[sectionName];
  const content: SectionContent =
    ((section?.content_json as unknown as SectionContent) || {
      paragraphs: [],
      phrases_used: [],
      figures_refs: [],
      table_refs: [],
    });

  const paragraphs: Paragraph[] = content.paragraphs || [];

  // ---- Handlers ----
  const handleTextChange = useCallback(
    (paraIndex: number, runIndex: number, newText: string) => {
      updateParagraphRun(sectionName, paraIndex, runIndex, {
        type: 'text',
        text: newText,
      });
    },
    [sectionName, updateParagraphRun],
  );

  const handleDeleteParagraph = useCallback(
    (paraIndex: number) => {
      deleteParagraph(sectionName, paraIndex);
    },
    [sectionName, deleteParagraph],
  );

  const handleAddParagraph = useCallback(() => {
    addParagraph(sectionName);
  }, [sectionName, addParagraph]);

  // ---- Render: Empty State ----
  if (paragraphs.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '48px 0' }}>
        <Empty
          description={
            <span style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
              This section is empty. Click below to start writing.
            </span>
          }
        >
          <Button
            type="dashed"
            onClick={handleAddParagraph}
            icon={<PlusOutlined />}
            style={{
              fontFamily: 'inherit',
              borderColor: 'var(--accent-cyan)',
              color: 'var(--accent-cyan)',
            }}
          >
            Add Paragraph
          </Button>
        </Empty>
      </div>
    );
  }

  // ---- Render: Paragraphs ----
  return (
    <div>
      {paragraphs.map((para, pIdx) => {
        // Classify runs by type
        const textRuns: { run: TextRun; runIdx: number }[] = [];
        const citationRuns: { run: TextRun; runIdx: number }[] = [];
        const refRuns: { run: TextRun; runIdx: number }[] = [];
        const phraseRuns: { run: TextRun; runIdx: number }[] = [];

        para.runs.forEach((run: TextRun, idx: number) => {
          switch (run.type) {
            case 'text':
              textRuns.push({ run, runIdx: idx });
              break;
            case 'citation':
              citationRuns.push({ run, runIdx: idx });
              break;
            case 'figure_ref':
            case 'table_ref':
            case 'equation_ref':
              refRuns.push({ run, runIdx: idx });
              break;
            case 'phrase_slot':
              phraseRuns.push({ run, runIdx: idx });
              break;
          }
        });

        const paraWordCount = textRuns.reduce(
          (sum, { run }) =>
            sum + (run.text || '').split(/\s+/).filter(Boolean).length,
          0,
        );

        return (
          <div
            key={para.id || pIdx}
            style={{
              marginBottom: 14,
              padding: 16,
              background: 'var(--bg-elevated)',
              borderRadius: 10,
              border: '1px solid var(--border)',
              transition: 'border-color 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'var(--accent-cyan)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            {/* ---- Toolbar ---- */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 10,
              }}
            >
              <Space size={6}>
                <HolderOutlined
                  style={{ color: 'var(--text3)', cursor: 'grab', fontSize: 13 }}
                />
                <Text style={{ color: 'var(--text3)', fontSize: 11, fontFamily: 'inherit' }}>
                  ¶ {pIdx + 1}
                </Text>
                {/* Badges for special run types */}
                {citationRuns.length > 0 && (
                  <Tag color="purple" style={{ fontSize: 10 }}>
                    {citationRuns.length} cite
                  </Tag>
                )}
                {refRuns.length > 0 && (
                  <Tag color="cyan" style={{ fontSize: 10 }}>
                    <LinkOutlined /> {refRuns.length} ref
                  </Tag>
                )}
                {phraseRuns.length > 0 && (
                  <Tag color="green" style={{ fontSize: 10 }}>
                    <ExperimentOutlined /> template
                  </Tag>
                )}
                <Text style={{ color: 'var(--text3)', fontSize: 10 }}>
                  {paraWordCount}w
                </Text>
              </Space>

              <Popconfirm
                title="Delete paragraph?"
                onConfirm={() => handleDeleteParagraph(pIdx)}
                okText="Yes"
                cancelText="No"
              >
                <Button
                  type="text"
                  danger
                  size="small"
                  icon={<DeleteOutlined />}
                />
              </Popconfirm>
            </div>

            {/* ---- Text Runs ---- */}
            {textRuns.map(({ run, runIdx }) => (
              <TextArea
                key={`txt-${pIdx}-${runIdx}`}
                value={run.text || ''}
                onChange={(e) => handleTextChange(pIdx, runIdx, e.target.value)}
                placeholder={`Write ${SECTION_LABELS[sectionName]} content...`}
                autoSize={{ minRows: 3, maxRows: 20 }}
                style={{
                  fontFamily: 'inherit',
                  background: 'var(--bg-dark)',
                  borderColor: 'var(--border)',
                  color: 'var(--text-primary)',
                  resize: 'none',
                  fontSize: 14,
                  lineHeight: 1.8,
                  marginBottom: textRuns.length > 1 ? 8 : 0,
                }}
              />
            ))}

            {/* ---- Special Run Tags ---- */}
            {(citationRuns.length > 0 ||
              refRuns.length > 0 ||
              phraseRuns.length > 0) && (
              <div
                style={{
                  marginTop: 8,
                  paddingTop: 8,
                  borderTop: '1px dashed var(--border)',
                  display: 'flex',
                  gap: 4,
                  flexWrap: 'wrap',
                }}
              >
                {citationRuns.map(({ run }) => (
                  <Tooltip
                    key={`c-${run.ref_ids?.join(',')}`}
                    title={`Refs: ${(run.ref_ids || []).join(', ')}`}
                  >
                    <Tag color="purple" style={{ fontSize: 11, fontFamily: 'inherit' }}>
                      📖 [{run.ref_ids?.join(', ')}]
                    </Tag>
                  </Tooltip>
                ))}
                {refRuns.map(({ run }) => (
                  <Tag
                    key={`r-${(run as any).figure_label || (run as any).table_label || run.type}`}
                    color="cyan"
                    style={{ fontSize: 11, fontFamily: 'inherit' }}
                  >
                    {run.type === 'figure_ref'
                      ? `Fig. ${(run as any).figure_label || '?'}`
                      : run.type === 'table_ref'
                        ? `Table ${(run as any).table_label || '?'}`
                        : `Eq. ${(run as any).equation_label || '?'}`}
                  </Tag>
                ))}
                {phraseRuns.map(({ run }) => (
                  <Tag
                    key={`p-${(run as any).phrase_id || runIdx}`}
                    color="green"
                    style={{ fontSize: 11, fontFamily: 'inherit' }}
                  >
                    <ExperimentOutlined />{' '}
                    {(run as any).template_text?.slice(0, 50) ||
                      (run as any).phrase_id?.slice(0, 8)}
                    ...
                  </Tag>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add Paragraph */}
      <Button
        type="dashed"
        onClick={handleAddParagraph}
        icon={<PlusOutlined />}
        block
        style={{
          fontFamily: 'inherit',
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
          marginTop: 4,
        }}
      >
        Add Paragraph
      </Button>

      {/* Footer Stats */}
      <div
        style={{
          marginTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--text3)',
          fontSize: 12,
        }}
      >
        <span>
          {paragraphs.length} paragraph{paragraphs.length !== 1 ? 's' : ''}
        </span>
        <span>
          {section?.word_count || 0} words
          {section?.is_complete ? ' · ✓ Complete' : ' · Draft'}
        </span>
      </div>
    </div>
  );
}
