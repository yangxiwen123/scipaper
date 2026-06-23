/**
 * 句型浏览器 — 学术句型工具箱
 * 按写作意图分类浏览，一键插入当前章节
 */
import { useState, useEffect, useCallback } from 'react';
import { Drawer, Tree, Card, Tag, Button, Input, Space, Typography, Spin, Empty, Tooltip, message } from 'antd';
import { SearchOutlined, PlusOutlined, ExperimentOutlined, InfoCircleOutlined, BulbOutlined } from '@ant-design/icons';
import { usePaperStore, SECTION_LABELS } from '../../stores/paperStore';
import { SECTION_SCHEMAS } from '../../data/sectionSchemas';
import * as api from '../../api/client';
import type { Phrase, CategoryTree } from '../../api/client';

const { Text, Paragraph } = Typography;

interface Props { open: boolean; onClose: () => void; sectionName: string; }

export function PhraseBrowser({ open, onClose, sectionName }: Props) {
  const { insertPhraseIntoSection } = usePaperStore();
  const [categories, setCategories] = useState<CategoryTree>({});
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFuncTag, setSelectedFuncTag] = useState<string | null>(null);

  useEffect(() => { if (open) loadCategories(); }, [open]);
  useEffect(() => { if (open) searchPhrases(); }, [open, sectionName, selectedFuncTag, searchText]);

  const loadCategories = async () => {
    try { setCategories(await api.getPhraseCategories()); } catch {}
  };
  const searchPhrases = async () => {
    setLoading(true);
    try {
      setPhrases(await api.searchPhrases({ section: sectionName, function_tag: selectedFuncTag || undefined, search: searchText || undefined, limit: 50 }));
    } catch {}
    setLoading(false);
  };

  const schema = SECTION_SCHEMAS[sectionName];
  const fieldKey = schema?.fields?.[0]?.key || 'default';
  const fieldLabel = schema?.fields?.[0]?.label?.split('—')[0]?.trim() || SECTION_LABELS[sectionName];

  const handleInsert = useCallback(async (phrase: Phrase) => {
    insertPhraseIntoSection(sectionName, fieldKey, phrase.template_text);
    message.success(`已插入到「${fieldLabel}」。请在编辑框中修改 {} 中的变量。`);
  }, [sectionName, fieldKey, fieldLabel, insertPhraseIntoSection]);

  const sectionCategories = categories[sectionName] || [];
  const treeData = sectionCategories.map((cat: any) => ({
    title: <span onClick={() => setSelectedFuncTag(cat.function_tag)}
      style={{ color: selectedFuncTag === cat.function_tag ? 'var(--gold-light)' : 'var(--text-soft)', fontSize: 13, fontFamily: 'inherit' }}>
      {formatFuncTag(cat.function_tag)} ({cat.total_count})</span>,
    key: cat.function_tag,
    children: (cat.sub_functions || []).filter((sf: any) => sf.name).map((sf: any) => ({
      title: <span style={{ color: 'var(--text-dim)', fontSize: 12, fontFamily: 'inherit' }}>{formatFuncTag(sf.name)} ({sf.count})</span>,
      key: `${cat.function_tag}::${sf.name}`, isLeaf: true,
    })),
  }));

  return (
    <Drawer title={<Space><ExperimentOutlined style={{ color: 'var(--gold)' }} /><span style={{ color: 'var(--text-main)', fontWeight: 600 }}>学术句型库 — {SECTION_LABELS[sectionName]}</span></Space>}
      placement="right" width={520} open={open} onClose={onClose}
      styles={{ body: { padding: 16, background: 'var(--bg-surface)' } }}
      extra={<Text style={{ color: 'var(--text-dim)', fontSize: 11 }}>句型插入到「{fieldLabel}」</Text>}>
      {/* 搜索框 */}
      <Input prefix={<SearchOutlined style={{ color: 'var(--text-dim)' }} />} placeholder="搜索句型……" value={searchText}
        onChange={(e) => setSearchText(e.target.value)} allowClear style={{ marginBottom: 16, fontFamily: 'inherit', borderRadius: 'var(--radius-sm)' }} />
      {/* 分类树 */}
      <div style={{ marginBottom: 16, padding: 12, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}>
        <Text style={{ color: 'var(--text-dim)', fontSize: 11, marginBottom: 8, display: 'block' }}>写作意图分类</Text>
        {treeData.length > 0 ? <Tree treeData={treeData} defaultExpandAll showLine={false} blockNode style={{ background: 'transparent' }} />
          : <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>当前章节暂无分类数据</Text>}
      </div>
      {/* 句型列表 */}
      <div style={{ maxHeight: 'calc(100vh - 400px)', overflow: 'auto' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
          : phrases.length === 0 ? <Empty description="未找到句型" />
          : phrases.map((phrase) => (
            <Card key={phrase.id} size="small" style={{ marginBottom: 10, background: 'var(--bg-card)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' }}
              title={<Space size={4}><Tag color="gold" style={{ fontSize: 9 }}>{phrase.academic_level}</Tag><Tag style={{ fontSize: 9 }}>{formatFuncTag(phrase.function_tag)}</Tag></Space>}
              extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => handleInsert(phrase)}>插入</Button>}>
              <Paragraph style={{ color: 'var(--text-main)', marginBottom: 8, fontSize: 13, lineHeight: 1.8 }}>
                {phrase.template_text.split(/(\{[^}]+\})/).map((part, i) =>
                  part.match(/^\{[^}]+\}$/) ? <span key={i} style={{ display: 'inline-block', background: 'rgba(226,176,74,0.15)', border: '1px dashed var(--gold)', borderRadius: 4, padding: '0 6px', color: 'var(--gold-light)', fontWeight: 500, margin: '0 1px' }}>{part}</span> : <span key={i}>{part}</span>
                )}
              </Paragraph>
              {phrase.example_filled && (
                <Tooltip title="填写示例">
                  <Text style={{ color: 'var(--teal)', fontSize: 11, fontStyle: 'italic' }}><BulbOutlined /> {phrase.example_filled}</Text>
                </Tooltip>
              )}
              {phrase.source && <div style={{ marginTop: 4 }}><Text style={{ color: 'var(--text-dim)', fontSize: 9 }}>来源: {phrase.source} · 使用 {phrase.usage_count} 次</Text></div>}
            </Card>
          ))}
      </div>
    </Drawer>
  );
}

function formatFuncTag(tag: string): string {
  return tag.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
