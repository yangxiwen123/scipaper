/**
 * PhraseBrowser — slide-out drawer for browsing the academic phrasebank.
 * Users can search, filter by function, and insert phrases into the current section.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  Drawer, Tree, Card, Tag, Button, Input, Space, Typography,
  Spin, Empty, Tooltip, message, Select,
} from 'antd';
import {
  SearchOutlined, PlusOutlined, StarOutlined,
  ExperimentOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import { usePaperStore, SECTION_LABELS } from '../../stores/paperStore';
import { SECTION_SCHEMAS } from '../../data/sectionSchemas';
import * as api from '../../api/client';
import type { Phrase, CategoryTree } from '../../api/client';

const { Text, Paragraph } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  sectionName: string;
}

export function PhraseBrowser({ open, onClose, sectionName }: Props) {
  const { insertPhraseIntoSection } = usePaperStore();

  const [categories, setCategories] = useState<CategoryTree>({});
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedFuncTag, setSelectedFuncTag] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);

  // Load categories on open
  useEffect(() => {
    if (open) {
      loadCategories();
    }
  }, [open]);

  // Search when filters change
  useEffect(() => {
    if (open) {
      searchPhrases();
    }
  }, [open, sectionName, selectedFuncTag, selectedLevel, searchText]);

  const loadCategories = async () => {
    try {
      const data = await api.getPhraseCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load phrase categories', err);
    }
  };

  const searchPhrases = async () => {
    setLoading(true);
    try {
      const results = await api.searchPhrases({
        section: sectionName,
        function_tag: selectedFuncTag || undefined,
        search: searchText || undefined,
        limit: 50,
      });
      setPhrases(results);
    } catch (err) {
      console.error('Failed to search phrases', err);
    }
    setLoading(false);
  };

  // Determine target field for insertion (first field of current section)
  const schema = SECTION_SCHEMAS[sectionName];
  const fieldKey = schema?.fields?.[0]?.key || 'default';
  const fieldLabel = schema?.fields?.[0]?.label?.split('—')[0]?.trim() || sectionName;

  const handleInsert = useCallback(
    async (phrase: Phrase) => {
      insertPhraseIntoSection(sectionName, fieldKey, phrase.template_text);
      message.success(`Inserted into "${fieldLabel}". Fill in the template variables.`);
    },
    [sectionName, insertPhraseIntoSection]
  );

  // Build tree data from categories
  const sectionCategories = categories[sectionName] || [];
  const treeData = sectionCategories.map((cat) => ({
    title: (
      <span
        onClick={() => setSelectedFuncTag(cat.function_tag)}
        style={{
          color:
            selectedFuncTag === cat.function_tag
              ? 'var(--accent-cyan)'
              : 'var(--text-secondary)',
          fontFamily: 'inherit',
          fontSize: 13,
        }}
      >
        {cat.function_tag.replace(/_/g, ' ')} ({cat.total_count})
      </span>
    ),
    key: cat.function_tag,
    children: cat.sub_functions
      .filter((sf) => sf.name)
      .map((sf) => ({
        title: (
          <span
            style={{ color: 'var(--text-secondary)', fontFamily: 'inherit', fontSize: 12 }}
          >
            {sf.name.replace(/_/g, ' ')} ({sf.count})
          </span>
        ),
        key: `${cat.function_tag}::${sf.name}`,
        isLeaf: true,
      })),
  }));

  return (
    <Drawer
      title={
        <Space>
          <ExperimentOutlined style={{ color: 'var(--accent-cyan)' }} />
          <span style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}>
            Academic Phrasebank — {SECTION_LABELS[sectionName]}
          </span>
        </Space>
      }
      placement="right"
      width={520}
      open={open}
      onClose={onClose}
      styles={{ body: { padding: 16 } }}
    >
      {/* Search */}
      <Input
        prefix={<SearchOutlined style={{ color: 'var(--text-secondary)' }} />}
        placeholder="Search phrases..."
        value={searchText}
        onChange={(e) => setSearchText(e.target.value)}
        allowClear
        style={{ marginBottom: 16, fontFamily: 'inherit' }}
      />

      {/* Category Tree */}
      <div
        style={{
          marginBottom: 16,
          padding: 12,
          background: 'var(--bg-elevated)',
          borderRadius: 8,
          border: '1px solid var(--border)',
        }}
      >
        <Text style={{ color: 'var(--text-secondary)', fontSize: 12, marginBottom: 8, display: 'block' }}>
          Writing Functions
        </Text>
        {treeData.length > 0 ? (
          <Tree
            treeData={treeData}
            defaultExpandAll
            showLine={false}
            blockNode
            style={{ background: 'transparent' }}
          />
        ) : (
          <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
            No categories available for this section
          </Text>
        )}
      </div>

      {/* Phrase List */}
      <div style={{ maxHeight: 'calc(100vh - 380px)', overflow: 'auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin />
          </div>
        ) : phrases.length === 0 ? (
          <Empty description="No phrases found" />
        ) : (
          phrases.map((phrase) => (
            <Card
              key={phrase.id}
              size="small"
              style={{ marginBottom: 12 }}
              title={
                <Space size={4}>
                  <Tag color="cyan" style={{ fontSize: 10 }}>{phrase.academic_level}</Tag>
                  <Tag style={{ fontSize: 10 }}>{phrase.function_tag.replace(/_/g, ' ')}</Tag>
                </Space>
              }
              extra={
                <Button
                  type="primary"
                  size="small"
                  icon={<PlusOutlined />}
                  onClick={() => handleInsert(phrase)}
                  style={{ fontFamily: 'inherit' }}
                >
                  Insert
                </Button>
              }
            >
              {/* Template text with highlighted slots */}
              <Paragraph
                style={{ color: 'var(--text-primary)', marginBottom: 8, fontFamily: 'inherit' }}
              >
                {phrase.template_text.split(/(\{[^}]+\})/).map((part, i) => {
                  if (part.match(/^\{[^}]+\}$/)) {
                    return (
                      <span key={i} className="slot-placeholder">
                        {part}
                      </span>
                    );
                  }
                  return <span key={i}>{part}</span>;
                })}
              </Paragraph>

              {/* Example filled */}
              {phrase.example_filled && (
                <div>
                  <Tooltip title="Example of the filled template">
                    <Text
                      style={{
                        color: 'var(--accent-green)',
                        fontSize: 12,
                        fontFamily: 'inherit',
                      }}
                    >
                      <InfoCircleOutlined /> {phrase.example_filled}
                    </Text>
                  </Tooltip>
                </div>
              )}

              {/* Source */}
              {phrase.source && (
                <div style={{ marginTop: 4 }}>
                  <Text style={{ color: 'var(--text-secondary)', fontSize: 10 }}>
                    Source: {phrase.source} · Used {phrase.usage_count}×
                  </Text>
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </Drawer>
  );
}
