/**
 * SectionEditor — writing interface for a single paper section.
 * Displays paragraphs as editable text areas with phrase and citation support.
 */
import { useCallback } from 'react';
import { Input, Button, Space, Empty, Typography, Tag } from 'antd';
import { PlusOutlined, DeleteOutlined, HolderOutlined } from '@ant-design/icons';
import { usePaperStore, SECTION_LABELS } from '../../stores/paperStore';
import type { SectionContent, Paragraph, TextRun } from '../../api/client';

const { TextArea } = Input;
const { Text } = Typography;

interface Props {
  sectionName: string;
}

export function SectionEditor({ sectionName }: Props) {
  const {
    sections, addParagraph, updateSectionContent,
    updateParagraphRun,
  } = usePaperStore();

  const section = sections[sectionName];
  const content: SectionContent = (section?.content_json || {
    paragraphs: [],
    phrases_used: [],
    figures_refs: [],
    table_refs: [],
  }) as SectionContent;

  const paragraphs = content.paragraphs || [];

  const handleTextChange = useCallback(
    (paraIndex: number, runIndex: number, text: string) => {
      const para = paragraphs[paraIndex];
      if (!para) return;
      const runs = [...para.runs];
      if (runs[runIndex] && runs[runIndex].type === 'text') {
        runs[runIndex] = { ...runs[runIndex], text };
        const newParas = [...paragraphs];
        newParas[paraIndex] = { ...para, runs };
        updateSectionContent(sectionName, { ...content, paragraphs: newParas });
      }
    },
    [sectionName, content, paragraphs, updateSectionContent]
  );

  const handleDeleteParagraph = useCallback(
    (paraIndex: number) => {
      const newParas = paragraphs.filter((_, i) => i !== paraIndex);
      updateSectionContent(sectionName, { ...content, paragraphs: newParas });
    },
    [sectionName, content, paragraphs, updateSectionContent]
  );

  const getPlainTextForParagraph = (para: Paragraph): string => {
    return para.runs
      .filter((r) => r.type === 'text')
      .map((r) => r.text || '')
      .join('');
  };

  if (paragraphs.length === 0) {
    return (
      <Empty
        description={
          <span style={{ color: 'var(--text-secondary)' }}>
            Start writing your {SECTION_LABELS[sectionName]} section...
          </span>
        }
      >
        <Button
          type="dashed"
          onClick={() => addParagraph(sectionName)}
          icon={<PlusOutlined />}
          style={{ fontFamily: 'inherit', borderColor: 'var(--accent-cyan)', color: 'var(--accent-cyan)' }}
        >
          Add Paragraph
        </Button>
      </Empty>
    );
  }

  return (
    <div>
      {paragraphs.map((para, pIdx) => {
        const textRuns = para.runs.filter((r) => r.type === 'text');
        const citationRuns = para.runs.filter((r) => r.type === 'citation');

        return (
          <div
            key={para.id || pIdx}
            style={{
              marginBottom: 16,
              padding: 16,
              background: 'var(--bg-elevated)',
              borderRadius: 8,
              border: '1px solid var(--border)',
              position: 'relative',
            }}
          >
            {/* Paragraph toolbar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 8,
                alignItems: 'center',
              }}
            >
              <Space>
                <HolderOutlined style={{ color: 'var(--text-secondary)', cursor: 'grab' }} />
                <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  Paragraph {pIdx + 1}
                </Text>
                {citationRuns.length > 0 && (
                  <Tag color="purple" style={{ fontSize: 11 }}>
                    {citationRuns.length} citation(s)
                  </Tag>
                )}
              </Space>
              <Button
                type="text"
                danger
                size="small"
                icon={<DeleteOutlined />}
                onClick={() => handleDeleteParagraph(pIdx)}
              />
            </div>

            {/* Text runs — render as editable textareas */}
            {textRuns.map((run, rIdx) => {
              const actualRunIdx = para.runs.indexOf(run);
              return (
                <TextArea
                  key={`${pIdx}-${actualRunIdx}`}
                  value={run.text || ''}
                  onChange={(e) => handleTextChange(pIdx, actualRunIdx, e.target.value)}
                  placeholder={`Write your ${SECTION_LABELS[sectionName]} content here...`}
                  autoSize={{ minRows: 3, maxRows: 15 }}
                  style={{
                    fontFamily: 'inherit',
                    background: 'var(--bg-dark)',
                    borderColor: 'var(--border)',
                    color: 'var(--text-primary)',
                    resize: 'none',
                  }}
                />
              );
            })}

            {/* Show citations in this paragraph */}
            {citationRuns.length > 0 && (
              <div style={{ marginTop: 8 }}>
                {citationRuns.map((run, cIdx) => (
                  <Tag key={cIdx} color="purple" style={{ fontSize: 11, fontFamily: 'inherit' }}>
                    [{run.ref_ids?.join(', ')}]
                  </Tag>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Add paragraph button */}
      <Button
        type="dashed"
        onClick={() => addParagraph(sectionName)}
        icon={<PlusOutlined />}
        block
        style={{
          fontFamily: 'inherit',
          borderColor: 'var(--border)',
          color: 'var(--text-secondary)',
          marginTop: 8,
        }}
      >
        Add Paragraph
      </Button>

      {/* Word count */}
      <div style={{ marginTop: 16, textAlign: 'right' }}>
        <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
          {section?.word_count || 0} words
        </Text>
      </div>
    </div>
  );
}
