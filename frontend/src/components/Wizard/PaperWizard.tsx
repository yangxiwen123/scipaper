/**
 * PaperWizard — the main stepper-based writing interface.
 *
 * Guides users through all 6 SCI paper sections with structured
 * fill-in-the-blank forms, integrated phrasebank, and real-time
 * progress tracking. Works in two modes:
 *   1. Standalone (localStorage) — no backend needed
 *   2. Connected (API) — full backend with LaTeX/PDF export
 */
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Steps, Button, Space, Card, Progress, Typography, Tooltip,
  Tag, message, Alert,
} from 'antd';
import {
  CheckCircleOutlined, DownloadOutlined, BookOutlined,
  LeftOutlined, RightOutlined, ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  usePaperStore, SECTION_ORDER, SECTION_LABELS, SECTION_HELP,
} from '../../stores/paperStore';
import { SECTION_SCHEMAS } from '../../data/sectionSchemas';
import { StructuredSectionEditor } from '../StepForm/StructuredSectionEditor';
import { PhraseBrowser } from '../PhraseBrowser/PhraseBrowser';
import { ExportPreview } from '../ExportPreview/ExportPreview';

const { Title, Text } = Typography;

export function PaperWizard() {
  const {
    paper, sections, currentStep, setCurrentStep,
    phraseBrowserOpen, togglePhraseBrowser, closePhraseBrowser,
    toggleSectionComplete, isStandalone,
  } = usePaperStore();

  const [showExport, setShowExport] = useState(false);
  const [localIssues, setLocalIssues] = useState<any[]>([]);

  if (!paper) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Text type="secondary" style={{ fontFamily: 'inherit' }}>No paper loaded.</Text>
      </div>
    );
  }

  const currentSectionName = SECTION_ORDER[currentStep];
  const schema = SECTION_SCHEMAS[currentSectionName];

  const completedSections = SECTION_ORDER.filter(
    (name) => sections[name]?.is_complete,
  ).length;
  const progressPercent = Math.round((completedSections / SECTION_ORDER.length) * 100);

  const totalWords = Object.values(sections).reduce(
    (sum, s) => sum + (s.word_count || 0), 0,
  );

  const handleNext = () => {
    if (currentStep < SECTION_ORDER.length - 1) setCurrentStep(currentStep + 1);
  };
  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleValidate = () => {
    const issues: any[] = [];
    for (const name of SECTION_ORDER) {
      const sec = sections[name];
      const s = SECTION_SCHEMAS[name];
      if (!s) continue;
      const fv = (sec?.content_json as any)?._fieldValues || {};
      for (const field of s.fields) {
        if (field.required && !fv[field.key]?.trim()) {
          issues.push({
            severity: 'error',
            section: name,
            message: `"${field.label.split(' —')[0]}" is required.`,
          });
        }
      }
    }
    setLocalIssues(issues);
    if (issues.length === 0) {
      message.success('All required fields are complete. Ready to export!');
    } else {
      message.warning(`${issues.length} required field(s) still need attention.`);
    }
  };

  const stepItems = useMemo(
    () =>
      SECTION_ORDER.map((name) => ({
        title: SECTION_LABELS[name],
        description: sections[name]?.is_complete ? (
          <Tag color="green" style={{ fontSize: 10 }}>Done</Tag>
        ) : (
          <Tag style={{ fontSize: 10 }}>Pending</Tag>
        ),
      })),
    [sections],
  );

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', paddingBottom: 80 }}>
      {/* Header Bar */}
      <Card
        className="glow-cyan"
        style={{ marginBottom: 20, borderColor: 'var(--accent-cyan)', background: 'var(--bg-card)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <Title level={3} style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'inherit', wordBreak: 'break-word' }}>
              {paper.title || 'Untitled'}
            </Title>
            <Space size={8} wrap style={{ marginTop: 10 }}>
              {isStandalone && <Tag color="orange">LOCAL DEMO</Tag>}
              <Tag color="cyan">{paper.citation_style?.toUpperCase()}</Tag>
              <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {totalWords.toLocaleString()} words · {completedSections}/{SECTION_ORDER.length} sections done
              </Text>
            </Space>
          </div>
          <Progress type="circle" percent={progressPercent} size={60}
            strokeColor={{ '0%': 'var(--accent-cyan)', '100%': 'var(--accent-purple)' }} />
        </div>
      </Card>

      {/* Steps */}
      <Card style={{ marginBottom: 20 }}>
        <Steps current={currentStep} onChange={setCurrentStep} items={stepItems} size="small" style={{ cursor: 'pointer' }} />
      </Card>

      {/* Section Editor */}
      <Card
        style={{ marginBottom: 20 }}
        title={
          <Space size={8} wrap>
            <span style={{ color: 'var(--accent-cyan)', fontFamily: 'inherit', fontWeight: 600, fontSize: 16 }}>
              Step {currentStep + 1}: {SECTION_LABELS[currentSectionName]}
            </span>
            {sections[currentSectionName]?.is_complete && <Tag color="green" style={{ fontSize: 11 }}>✓ Done</Tag>}
            <Tooltip title={SECTION_HELP[currentSectionName]}>
              <BookOutlined style={{ color: 'var(--text-secondary)', cursor: 'help' }} />
            </Tooltip>
            <Button type="primary" ghost size="small" onClick={() => togglePhraseBrowser(currentSectionName)}
              style={{ fontFamily: 'inherit' }}>📚 Phrasebank</Button>
          </Space>
        }
        extra={
          <Space>
            <Button onClick={handlePrev} disabled={currentStep === 0} icon={<LeftOutlined />}
              style={{ fontFamily: 'inherit' }}>Previous</Button>
            <Button onClick={() => toggleSectionComplete(currentSectionName)}
              icon={sections[currentSectionName]?.is_complete ? <CheckCircleOutlined /> : undefined}
              style={{ fontFamily: 'inherit' }}>
              {sections[currentSectionName]?.is_complete ? '✓ Done' : 'Mark Done'}
            </Button>
            <Button type="primary" onClick={handleNext} disabled={currentStep === SECTION_ORDER.length - 1}
              icon={<RightOutlined />} style={{ fontFamily: 'inherit' }}>Next</Button>
          </Space>
        }
      >
        <StructuredSectionEditor sectionName={currentSectionName} />
      </Card>

      {/* Validation Issues */}
      {localIssues.length > 0 && (
        <Card style={{ marginBottom: 20 }} size="small"
          title={<Space><ExclamationCircleOutlined style={{ color: 'var(--error)' }} />
            <span style={{ fontFamily: 'inherit' }}>Issues ({localIssues.length})</span></Space>}>
          {localIssues.map((issue: any, i: number) => (
            <Alert key={i} type={issue.severity === 'error' ? 'error' : 'warning'} showIcon
              message={<span style={{ fontFamily: 'inherit' }}>[{issue.section}] {issue.message}</span>}
              style={{ marginBottom: 6, background: 'var(--bg-elevated)', fontFamily: 'inherit' }} />
          ))}
        </Card>
      )}

      {/* Bottom Buttons */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24, flexWrap: 'wrap' }}>
        <Button onClick={handleValidate} icon={<CheckCircleOutlined />} size="large" style={{ fontFamily: 'inherit' }}>
          Validate All Fields
        </Button>
        <Button type="primary" size="large" icon={<DownloadOutlined />} onClick={() => setShowExport(true)}
          className="glow-cyan" style={{ fontFamily: 'inherit' }}>Export Paper</Button>
      </div>

      <PhraseBrowser open={phraseBrowserOpen} onClose={closePhraseBrowser} sectionName={currentSectionName} />
      <ExportPreview open={showExport} onClose={() => setShowExport(false)} paperId={paper.id} />
    </div>
  );
}
