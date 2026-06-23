/**
 * 结构化章节编辑器 — 把每个 SCI 章节变成"填空题"
 * 普通人不需要盯着白纸发呆，每个框都告诉你要写什么
 */
import React, { useCallback, useState } from 'react';
import { Input, Typography, Tag, Button, Tooltip, Progress, Space } from 'antd';
import { QuestionCircleOutlined, BulbOutlined, BookOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { usePaperStore } from '../../stores/paperStore';
import { SECTION_SCHEMAS, getDefaultFieldValues } from '../../data/sectionSchemas';
import type { FormField, FieldValues } from '../../data/sectionSchemas';

const { TextArea } = Input;
const { Text, Paragraph } = Typography;

interface Props { sectionName: string; }

export function StructuredSectionEditor({ sectionName }: Props) {
  const { sections, updateSectionContent, togglePhraseBrowser } = usePaperStore();
  const schema = SECTION_SCHEMAS[sectionName];
  const section = sections[sectionName];
  const fieldValues = recoverFieldValues(sectionName, section?.content_json as any);

  const totalFields = schema?.fields.length || 0;
  const filledFields = schema?.fields.filter((f) => fieldValues[f.key]?.trim()).length;
  const completionPercent = totalFields > 0 ? Math.round((filledFields / totalFields) * 100) : 0;

  const handleChange = useCallback((fieldKey: string, value: string) => {
    const newValues = { ...fieldValues, [fieldKey]: value };
    const content = (section?.content_json || {}) as Record<string, any>;
    const updated = {
      ...content,
      _fieldValues: newValues,
      paragraphs: schema.fields
        .filter((f) => (f.key === fieldKey ? value?.trim() : fieldValues[f.key]?.trim()))
        .map((f) => ({ id: `${sectionName}_${f.key}`, runs: [{ type: 'text', text: f.key === fieldKey ? value : (fieldValues[f.key] || '') }] })),
      phrases_used: content.phrases_used || [],
      figures_refs: content.figures_refs || [],
      table_refs: content.table_refs || [],
    };
    updateSectionContent(sectionName, updated);
  }, [sectionName, section, fieldValues, schema, updateSectionContent]);

  if (!schema) return <Text type="secondary">此章节暂无结构化表单。</Text>;

  return (
    <div>
      {/* 章节说明 */}
      <div style={{ background: 'rgba(226,176,74,0.04)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '14px 18px', marginBottom: 22 }}>
        <Space><BookOutlined style={{ color: 'var(--gold)' }} /><Text style={{ color: 'var(--text-soft)', fontSize: 13, lineHeight: 1.7 }}>{schema.description}</Text></Space>
      </div>

      {/* 完成进度 */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
        <Progress percent={completionPercent} size="small" style={{ flex: 1, margin: 0 }}
          strokeColor={completionPercent === 100 ? 'var(--teal)' : 'var(--gold)'} trailColor="var(--border)" />
        <Text style={{ color: 'var(--text-dim)', fontSize: 12, whiteSpace: 'nowrap' }}>{filledFields}/{totalFields} 项已填</Text>
        <Tag color={completionPercent === 100 ? 'success' : 'default'} style={{ fontSize: 10 }}>{completionPercent === 100 ? '✓ 完成' : '进行中'}</Tag>
      </div>

      {/* 字段卡片列表 */}
      <div className="stagger" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {schema.fields.map((field, idx) => (
          <FieldCard key={field.key} field={field} index={idx} value={fieldValues[field.key] || ''}
            onChange={(v) => handleChange(field.key, v)}
            onOpenPhrasebank={() => togglePhraseBrowser(sectionName)} />
        ))}
      </div>

      {/* 底部统计 */}
      <div style={{ marginTop: 22, textAlign: 'right' }}>
        <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>
          本节共 {estimateTotalWords(fieldValues)} 词 · {section?.is_complete ? '✓ 已标记完成' : '草稿中'}
        </Text>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FieldCard
   ═══════════════════════════════════════════════════════════════ */
function FieldCard({ field, index, value, onChange, onOpenPhrasebank }: {
  field: FormField; index: number; value: string; onChange: (v: string) => void; onOpenPhrasebank: () => void;
}) {
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const [minWords, maxWords] = field.words || [0, Infinity];
  const wordStatus: 'ok' | 'short' | 'over' = wordCount === 0 ? 'short' : wordCount < minWords ? 'short' : wordCount > maxWords ? 'over' : 'ok';
  const [showExample, setShowExample] = useState(false);
  const isFilled = !!value.trim();

  return (
    <div className="animate-fade-up"
      style={{
        background: isFilled ? 'var(--bg-card)' : 'var(--bg-surface)',
        border: `1px solid ${isFilled ? 'var(--border)' : 'rgba(224,85,106,0.25)'}`,
        borderRadius: 'var(--radius-md)',
        padding: 22,
        transition: 'all 0.3s ease',
        boxShadow: isFilled ? undefined : '0 0 0 1px rgba(224,85,106,0.06)',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.boxShadow = '0 0 0 2px rgba(226,176,74,0.08)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = isFilled ? 'var(--border)' : 'rgba(224,85,106,0.25)'; e.currentTarget.style.boxShadow = isFilled ? 'none' : '0 0 0 1px rgba(224,85,106,0.06)'; }}
    >
      {/* 字段头部 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <Space size={6}>
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 24, height: 24, borderRadius: '50%',
              background: isFilled ? 'var(--teal)' : 'var(--bg-elevated)',
              border: isFilled ? 'none' : '1px solid var(--border)',
              color: isFilled ? '#fff' : 'var(--text-dim)', fontSize: 11, fontWeight: 700,
              flexShrink: 0,
            }}>{isFilled ? '✓' : index + 1}</span>
            <Text strong style={{ color: 'var(--text-main)', fontSize: 14 }}>{field.label}</Text>
            {field.required && <Tag color="error" style={{ fontSize: 9, lineHeight: '16px' }}>必填</Tag>}
          </Space>
        </div>
        {field.words && (
          <Tooltip title={`建议 ${minWords}-${maxWords === Infinity ? '不限' : maxWords} 词`}>
            <Tag color={wordStatus === 'ok' ? 'success' : wordStatus === 'over' ? 'warning' : 'default'} style={{ fontSize: 10 }}>
              {wordCount}/{minWords}{maxWords < Infinity ? `-${maxWords}` : '+'} 词
            </Tag>
          </Tooltip>
        )}
      </div>

      {/* 提示 */}
      <Text style={{ color: 'var(--text-dim)', fontSize: 12, display: 'block', marginBottom: 10, lineHeight: 1.6 }}>
        <QuestionCircleOutlined style={{ marginRight: 5 }} />{field.hint}
      </Text>

      {/* 文本框 */}
      <TextArea value={value} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder}
        autoSize={{ minRows: 3, maxRows: 14 }}
        style={{
          fontFamily: 'inherit', background: 'var(--bg-surface)', borderColor: isFilled ? 'var(--border)' : 'rgba(224,85,106,0.25)',
          color: 'var(--text-main)', fontSize: 14, lineHeight: 1.85, resize: 'none', borderRadius: 'var(--radius-sm)',
        }} />

      {/* 操作栏 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
        <Space size={2}>
          {field.example && (
            <Button type="text" size="small" icon={<BulbOutlined />} onClick={() => setShowExample(!showExample)}
              style={{ color: 'var(--gold-light)', fontSize: 11 }}>{showExample ? '收起例句' : '查看例句'}</Button>
          )}
          <Button type="text" size="small" icon={<BookOutlined />} onClick={onOpenPhrasebank}
            style={{ color: 'var(--teal)', fontSize: 11 }}>句型库</Button>
        </Space>
        {wordStatus === 'short' && value.trim() && <Text style={{ color: 'var(--warn)', fontSize: 11 }}><ExclamationCircleOutlined /> 字数偏少</Text>}
        {wordStatus === 'over' && <Text style={{ color: 'var(--warn)', fontSize: 11 }}><ExclamationCircleOutlined /> 超过建议长度</Text>}
      </div>

      {/* 例句面板 */}
      {showExample && field.example && (
        <div style={{ marginTop: 12, padding: 14, background: 'rgba(226,176,74,0.04)', border: '1px dashed rgba(226,176,74,0.2)', borderRadius: 'var(--radius-sm)' }}>
          <Text style={{ color: 'var(--gold-light)', fontSize: 11 }}><BulbOutlined /> 参考例句:</Text>
          <Paragraph style={{ color: 'var(--text-soft)', fontSize: 12, marginTop: 6, marginBottom: 0, fontStyle: 'italic', lineHeight: 1.8 }}>{field.example}</Paragraph>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   工具函数
   ═══════════════════════════════════════════════════════════════ */
function recoverFieldValues(sectionName: string, content: Record<string, any> | null | undefined): FieldValues {
  if (content?._fieldValues && typeof content._fieldValues === 'object') return content._fieldValues as FieldValues;
  const schema = SECTION_SCHEMAS[sectionName];
  if (!schema) return getDefaultFieldValues(sectionName);
  const vals = getDefaultFieldValues(sectionName);
  const paras = content?.paragraphs || [];
  const keys = schema.fields.map((f) => f.key);
  for (let i = 0; i < paras.length && i < keys.length; i++) {
    const tr = paras[i]?.runs?.find((r: any) => r.type === 'text');
    if (tr?.text) vals[keys[i]] = tr.text;
  }
  return vals;
}

function estimateTotalWords(values: FieldValues): number {
  return Object.values(values).filter(Boolean).reduce((sum, t) => sum + t.split(/\s+/).filter(Boolean).length, 0);
}
