/**
 * 论文写作向导 — 6 步引导式表单
 * "像做填空题一样写 SCI 论文"
 */
import { useState, useMemo } from 'react';
import { Steps, Button, Space, Card, Progress, Typography, Tooltip, Tag, message, Alert } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, BookOutlined, LeftOutlined, RightOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { usePaperStore, SECTION_ORDER, SECTION_LABELS, SECTION_HELP } from '../../stores/paperStore';
import { SECTION_SCHEMAS } from '../../data/sectionSchemas';
import { StructuredSectionEditor } from '../StepForm/StructuredSectionEditor';
import { PhraseBrowser } from '../PhraseBrowser/PhraseBrowser';
import { ExportPreview } from '../ExportPreview/ExportPreview';

const { Title, Text } = Typography;

export function PaperWizard() {
  const { paper, sections, currentStep, setCurrentStep, isStandalone, phraseBrowserOpen, togglePhraseBrowser, closePhraseBrowser, toggleSectionComplete } = usePaperStore();
  const [showExport, setShowExport] = useState(false);
  const [issues, setIssues] = useState<any[]>([]);

  if (!paper) return <div style={{ textAlign: 'center', padding: 80, color: 'var(--text-dim)' }}>未加载论文。</div>;

  const name = SECTION_ORDER[currentStep];
  const done = SECTION_ORDER.filter((n) => sections[n]?.is_complete).length;
  const totalWords = Object.values(sections).reduce((s, sec) => s + (sec.word_count || 0), 0);

  const handleValidate = () => {
    const iss: any[] = [];
    for (const n of SECTION_ORDER) {
      const fv = (sections[n]?.content_json as any)?._fieldValues || {};
      const sc = SECTION_SCHEMAS[n];
      if (!sc) continue;
      for (const f of sc.fields) {
        if (f.required && !fv[f.key]?.trim())
          iss.push({ severity: 'error', section: SECTION_LABELS[n], message: `「${f.label.split('—')[0].trim()}」还未填写` });
      }
    }
    setIssues(iss);
    if (iss.length === 0) message.success('🎉 所有必填项已完成！可以导出了。');
    else message.warning(`还有 ${iss.length} 个必填项需要填写。`);
  };

  const stepItems = useMemo(() => SECTION_ORDER.map((n) => ({
    title: SECTION_LABELS[n],
    description: sections[n]?.is_complete ? <Tag color="success" style={{ fontSize: 10 }}>✓ 完成</Tag> : <Tag style={{ fontSize: 10 }}>待填</Tag>,
  })), [sections]);

  return (
    <div style={{ maxWidth: 1060, margin: '0 auto', paddingBottom: 80 }}>

      {/* ═══ 顶栏：论文信息 ═══ */}
      <Card className="glow-gold"
        style={{ marginBottom: 18, border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)' }}
        bodyStyle={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 260 }}>
            <Title level={4} style={{ margin: 0, color: 'var(--text-main)', fontWeight: 700, wordBreak: 'break-word' }}>{paper.title || '未命名论文'}</Title>
            <Space size={8} wrap style={{ marginTop: 10 }}>
              {isStandalone && <Tag style={{ background: 'rgba(94,196,176,0.12)', border: '1px solid rgba(94,196,176,0.25)', color: 'var(--teal-light)', fontSize: 10 }}>💻 本地模式</Tag>}
              <Tag style={{ background: 'rgba(226,176,74,0.1)', color: 'var(--gold-light)', fontSize: 10 }}>{paper.citation_style?.toUpperCase()}</Tag>
              <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>{totalWords.toLocaleString()} 词 · {done}/{SECTION_ORDER.length} 节已完成</Text>
            </Space>
          </div>
          <Progress type="circle" percent={Math.round((done / SECTION_ORDER.length) * 100)} size={56}
            strokeColor={{ '0%': 'var(--gold)', '100%': 'var(--teal)' }}
            format={(p) => <span style={{ color: 'var(--text-main)', fontSize: 13, fontWeight: 600 }}>{p}%</span>} />
        </div>
      </Card>

      {/* ═══ 步骤导航 ═══ */}
      <Card style={{ marginBottom: 18, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
        bodyStyle={{ padding: '16px 24px' }}>
        <Steps current={currentStep} onChange={(s) => setCurrentStep(s)} items={stepItems} size="small" style={{ cursor: 'pointer' }} />
      </Card>

      {/* ═══ 章节编辑区 ═══ */}
      <Card style={{ marginBottom: 18, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-card)' }}
        title={
          <Space size={10} wrap>
            <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: 17 }}>第 {currentStep + 1} 步：{SECTION_LABELS[name]}</span>
            {sections[name]?.is_complete && <Tag color="success" style={{ fontSize: 10 }}>✓ 已完成</Tag>}
            <Tooltip title={SECTION_HELP[name]} placement="bottom">
              <BookOutlined style={{ color: 'var(--text-dim)', cursor: 'help', fontSize: 14 }} />
            </Tooltip>
            <Button type="primary" ghost size="small" onClick={() => togglePhraseBrowser(name)}
              style={{ borderColor: 'var(--gold)', color: 'var(--gold-light)' }}>📚 打开句型库</Button>
          </Space>
        }
        extra={
          <Space size={8}>
            <Button onClick={() => setCurrentStep(Math.max(0, currentStep - 1))} disabled={currentStep === 0}
              icon={<LeftOutlined />}>上一步</Button>
            <Button onClick={() => toggleSectionComplete(name)}
              icon={sections[name]?.is_complete ? <CheckCircleOutlined /> : undefined}>
              {sections[name]?.is_complete ? '✓ 已标记完成' : '标记完成'}
            </Button>
            <Button type="primary" onClick={() => setCurrentStep(Math.min(SECTION_ORDER.length - 1, currentStep + 1))}
              disabled={currentStep === SECTION_ORDER.length - 1} icon={<RightOutlined />}>下一步</Button>
          </Space>
        }>
        <StructuredSectionEditor sectionName={name} />
      </Card>

      {/* ═══ 校验结果 ═══ */}
      {issues.length > 0 && (
        <Card style={{ marginBottom: 18, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
          size="small" title={<Space><ExclamationCircleOutlined style={{ color: 'var(--danger)' }} /><span>待处理问题（{issues.length}）</span></Space>}>
          {issues.map((iss, i) => (
            <Alert key={i} type={iss.severity === 'error' ? 'error' : 'warning'} showIcon
              message={`[${iss.section}] ${iss.message}`}
              style={{ marginBottom: 6, background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)' }} />
          ))}
        </Card>
      )}

      {/* ═══ 底部操作 ═══ */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 28 }}>
        <Button onClick={handleValidate} icon={<CheckCircleOutlined />} size="large">校验必填项</Button>
        <Button type="primary" size="large" icon={<DownloadOutlined />} onClick={() => setShowExport(true)}
          style={{ fontWeight: 600 }}>导出论文</Button>
      </div>

      <PhraseBrowser open={phraseBrowserOpen} onClose={closePhraseBrowser} sectionName={name} />
      <ExportPreview open={showExport} onClose={() => setShowExport(false)} paperId={paper.id} />
    </div>
  );
}
