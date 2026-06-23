/**
 * StructuredSectionEditor — fill-in-the-blank forms for each SCI section.
 *
 * This is THE core user experience. Instead of a blank textarea, users see
 * labeled sub-fields with hints, examples, word counters, and phrasebank
 * suggestions tailored to each writing function.
 */
import React, { useCallback, useState } from 'react';
import {
  Input, Typography, Tag, Button, Tooltip, Progress, Space,
} from 'antd';
import {
  QuestionCircleOutlined, BulbOutlined, BookOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import { usePaperStore } from '../../stores/paperStore';
import {
  SECTION_SCHEMAS,
  getDefaultFieldValues,
  fieldValuesToSectionContent,
} from '../../data/sectionSchemas';
import type { FormField, FieldValues } from '../../data/sectionSchemas';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface Props {
  sectionName: string;
}

export function StructuredSectionEditor({ sectionName }: Props) {
  const {
    sections, updateSectionContent, updateSectionPlainText,
    togglePhraseBrowser,
  } = usePaperStore();

  const schema = SECTION_SCHEMAS[sectionName];
  const section = sections[sectionName];

  // ---- Recover field values from content_json or use defaults ----
  const fieldValues = recoverFieldValues(sectionName, section?.content_json as any);

  // Count completed fields
  const totalFields = schema?.fields.length || 0;
  const filledFields = schema?.fields.filter(
    (f) => fieldValues[f.key]?.trim(),
  ).length;
  const completionPercent = totalFields > 0
    ? Math.round((filledFields / totalFields) * 100)
    : 0;

  // ---- Handle field change ----
  const handleFieldChange = useCallback(
    (fieldKey: string, value: string) => {
      const newValues = { ...fieldValues, [fieldKey]: value };

      // Save structured values into content_json
      const content = (section?.content_json || {}) as Record<string, any>;
      const updatedContent = {
        ...content,
        _fieldValues: newValues,
        paragraphs: schema.fields
          .filter((f) => (f.key === fieldKey ? value?.trim() : fieldValues[f.key]?.trim()) || (f.key !== fieldKey && fieldValues[f.key]?.trim()))
          .map((f) => ({
            id: `${sectionName}_field_${f.key}`,
            runs: [{ type: 'text', text: f.key === fieldKey ? value : (fieldValues[f.key] || '') }],
          })),
        phrases_used: content.phrases_used || [],
        figures_refs: content.figures_refs || [],
        table_refs: content.table_refs || [],
      };

      updateSectionContent(sectionName, updatedContent);
    },
    [sectionName, section, fieldValues, schema, updateSectionContent],
  );

  if (!schema) {
    return (
      <div style={{ padding: 40, textAlign: 'center' }}>
        <Text type="secondary">No structured form available for this section.</Text>
      </div>
    );
  }

  return (
    <div>
      {/* Section Description */}
      <div
        style={{
          background: 'rgba(56,189,248,0.04)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
        }}
      >
        <Space>
          <BookOutlined style={{ color: 'var(--accent-cyan)' }} />
          <Text style={{ color: 'var(--text-secondary)', fontSize: 13, fontFamily: 'inherit' }}>
            {schema.description}
          </Text>
        </Space>
      </div>

      {/* Progress Bar */}
      <div style={{ marginBottom: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Progress
          percent={completionPercent}
          size="small"
          style={{ flex: 1, margin: 0 }}
          strokeColor={
            completionPercent === 100
              ? 'var(--accent-green)'
              : 'var(--accent-cyan)'
          }
        />
        <Text style={{ color: 'var(--text3)', fontSize: 12, whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
          {filledFields}/{totalFields} fields
        </Text>
        {completionPercent === 100 ? (
          <Tag color="green" style={{ fontSize: 10 }}>Complete</Tag>
        ) : (
          <Tag style={{ fontSize: 10 }}>In Progress</Tag>
        )}
      </div>

      {/* Field Forms */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {schema.fields.map((field, idx) => (
          <FieldCard
            key={field.key}
            field={field}
            index={idx}
            value={fieldValues[field.key] || ''}
            onChange={(v) => handleFieldChange(field.key, v)}
            onOpenPhrasebank={() => togglePhraseBrowser(sectionName)}
          />
        ))}
      </div>

      {/* Section Word Count */}
      <div style={{ marginTop: 20, textAlign: 'right' }}>
        <Text style={{ color: 'var(--text3)', fontSize: 12, fontFamily: 'inherit' }}>
          Total: {estimateTotalWords(fieldValues)} words · {section?.is_complete ? '✓ Marked Complete' : 'Draft'}
        </Text>
      </div>
    </div>
  );
}

// ============================================================================
// FieldCard — individual field with label, hint, word count, example
// ============================================================================

function FieldCard({
  field, index, value, onChange, onOpenPhrasebank,
}: {
  field: FormField;
  index: number;
  value: string;
  onChange: (v: string) => void;
  onOpenPhrasebank: () => void;
}) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const [minWords, maxWords] = field.words || [0, Infinity];
  const wordStatus: 'ok' | 'short' | 'over' =
    wordCount === 0 ? 'short'
    : wordCount < minWords ? 'short'
    : wordCount > maxWords ? 'over'
    : 'ok';

  const [showExample, setShowExample] = useState(false);

  return (
    <div
      style={{
        background: 'var(--bg-elevated)',
        border: `1px solid ${value.trim() ? 'var(--border)' : 'rgba(248,113,113,0.2)'}`,
        borderRadius: 10,
        padding: 20,
        transition: 'border-color 0.2s',
      }}
    >
      {/* Field Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <Space size={6}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: value.trim()
                  ? 'var(--accent-green)'
                  : 'var(--bg-dark)',
                border: value.trim()
                  ? 'none'
                  : '1px solid var(--border)',
                color: value.trim() ? '#fff' : 'var(--text3)',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {value.trim() ? '✓' : index + 1}
            </span>
            <Text strong style={{ color: 'var(--text-primary)', fontSize: 14, fontFamily: 'inherit' }}>
              {field.label}
            </Text>
            {field.required && (
              <Tag color="red" style={{ fontSize: 9 }}>Required</Tag>
            )}
          </Space>
        </div>

        {/* Word count badge */}
        {field.words && (
          <Tooltip title={`Target: ${minWords}-${maxWords} words`}>
            <Tag
              color={wordStatus === 'ok' ? 'green' : wordStatus === 'over' ? 'orange' : 'default'}
              style={{ fontSize: 10, fontFamily: 'inherit' }}
            >
              {wordCount}/{minWords}
              {maxWords < Infinity ? `-${maxWords}` : '+'} words
            </Tag>
          </Tooltip>
        )}
      </div>

      {/* Hint */}
      <Text style={{ color: 'var(--text3)', fontSize: 12, display: 'block', marginBottom: 10, fontFamily: 'inherit', lineHeight: 1.6 }}>
        <QuestionCircleOutlined style={{ marginRight: 4 }} />
        {field.hint}
      </Text>

      {/* Textarea */}
      <TextArea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        autoSize={{ minRows: 3, maxRows: 15 }}
        style={{
          fontFamily: 'inherit',
          background: 'var(--bg-dark)',
          borderColor: value.trim() ? 'var(--border)' : 'rgba(248,113,113,0.25)',
          color: 'var(--text-primary)',
          fontSize: 14,
          lineHeight: 1.8,
          resize: 'none',
        }}
      />

      {/* Action bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <Space size={4}>
          {/* Toggle example */}
          {field.example && (
            <Button
              type="text"
              size="small"
              icon={<BulbOutlined />}
              onClick={() => setShowExample(!showExample)}
              style={{ color: 'var(--accent-orange)', fontSize: 11, fontFamily: 'inherit' }}
            >
              {showExample ? 'Hide Example' : 'Show Example'}
            </Button>
          )}
          {/* Open phrasebank for this section */}
          <Button
            type="text"
            size="small"
            icon={<BookOutlined />}
            onClick={onOpenPhrasebank}
            style={{ color: 'var(--accent-purple)', fontSize: 11, fontFamily: 'inherit' }}
          >
            Phrasebank
          </Button>
        </Space>

        {wordStatus === 'short' && value.trim() && (
          <Text style={{ color: 'var(--warning)', fontSize: 11 }}>
            <ExclamationCircleOutlined /> Below recommended length
          </Text>
        )}
        {wordStatus === 'over' && (
          <Text style={{ color: 'var(--warning)', fontSize: 11 }}>
            <ExclamationCircleOutlined /> Exceeds recommended length
          </Text>
        )}
      </div>

      {/* Example panel */}
      {showExample && field.example && (
        <div
          style={{
            marginTop: 10,
            padding: 12,
            background: 'rgba(251,191,36,0.06)',
            border: '1px dashed rgba(251,191,36,0.3)',
            borderRadius: 6,
          }}
        >
          <Text style={{ color: 'var(--accent-orange)', fontSize: 11, fontFamily: 'inherit' }}>
            <BulbOutlined /> Example:
          </Text>
          <Paragraph
            style={{
              color: 'var(--text-secondary)',
              fontSize: 12,
              marginTop: 4,
              marginBottom: 0,
              fontFamily: 'inherit',
              fontStyle: 'italic',
            }}
          >
            {field.example}
          </Paragraph>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function recoverFieldValues(
  sectionName: string,
  content: Record<string, any> | null | undefined,
): FieldValues {
  // Try to recover from _fieldValues (new format)
  if (content?._fieldValues && typeof content._fieldValues === 'object') {
    return content._fieldValues as FieldValues;
  }

  // Try to recover from paragraphs (old format: first text run of each paragraph)
  const schema = SECTION_SCHEMAS[sectionName];
  if (!schema) return getDefaultFieldValues(sectionName);

  const values = getDefaultFieldValues(sectionName);
  const paragraphs = content?.paragraphs || [];
  const fieldKeys = schema.fields.map((f) => f.key);

  for (let i = 0; i < paragraphs.length && i < fieldKeys.length; i++) {
    const firstTextRun = paragraphs[i]?.runs?.find(
      (r: any) => r.type === 'text',
    );
    if (firstTextRun?.text) {
      values[fieldKeys[i]] = firstTextRun.text;
    }
  }

  return values;
}

function estimateTotalWords(values: FieldValues): number {
  return Object.values(values)
    .filter(Boolean)
    .reduce((sum, text) => sum + text.split(/\s+/).filter(Boolean).length, 0);
}
