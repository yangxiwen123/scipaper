/**
 * PaperWizard — the main stepper-based writing interface.
 *
 * Guides users through all 6 SCI paper sections with:
 *   - Real-time progress tracking
 *   - Integrated phrasebank browser
 *   - Pre-export validation with precise diagnostics
 *   - Demo mode with pre-loaded H-MODRL agricultural logistics data
 *
 * This component is the primary user-facing surface of the entire system.
 * It orchestrates the Zustand store, the SectionEditor, the PhraseBrowser,
 * and the ExportPreview into a unified writing experience.
 */
import {
  useState, useEffect, useCallback, useMemo,
} from 'react';
import {
  Steps, Button, Space, Card, Progress, Typography, Tooltip, Modal,
  Tag, message, Badge, Alert, Divider, Empty,
} from 'antd';
import {
  CheckCircleOutlined,
  DownloadOutlined,
  BookOutlined,
  LeftOutlined,
  RightOutlined,
  ExperimentOutlined,
  ExclamationCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import {
  usePaperStore,
  SECTION_ORDER,
  SECTION_LABELS,
  SECTION_HELP,
} from '../../stores/paperStore';
import type { ValidationIssue } from '../../stores/paperStore';
import { SectionEditor } from '../StepForm/SectionEditor';
import { PhraseBrowser } from '../PhraseBrowser/PhraseBrowser';
import { ExportPreview } from '../ExportPreview/ExportPreview';
import * as api from '../../api/client';

const { Title, Text, Paragraph } = Typography;

export function PaperWizard() {
  const {
    paper,
    sections,
    currentStep,
    setCurrentStep,
    isDemoMode,
    phraseBrowserOpen,
    togglePhraseBrowser,
    closePhraseBrowser,
    validationIssues,
    toggleSectionComplete,
    initWithMockData,
  } = usePaperStore();

  const [showExport, setShowExport] = useState(false);
  const [validating, setValidating] = useState(false);
  const [localIssues, setLocalIssues] = useState<ValidationIssue[]>([]);
  const [showDemoPrompt, setShowDemoPrompt] = useState(false);

  // ---- Auto-detect demo mode from URL ----
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === '1' && !paper) {
      setShowDemoPrompt(true);
    }
  }, [paper]);

  // ---- Guard: no paper loaded ----
  if (!paper) {
    return (
      <div style={{ maxWidth: 600, margin: '80px auto', textAlign: 'center' }}>
        {showDemoPrompt && (
          <Card
            className="glow-cyan"
            style={{ borderColor: 'var(--accent-cyan)' }}
            title={
              <span style={{ fontFamily: 'inherit', color: 'var(--accent-cyan)' }}>
                <ExperimentOutlined /> Demo Mode Available
              </span>
            }
          >
            <Paragraph style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
              A realistic agricultural logistics research scenario is available for testing.
              It includes a complete Methods section describing the H-MODRL algorithm.
            </Paragraph>
            <Button
              type="primary"
              size="large"
              onClick={() => {
                initWithMockData();
                setShowDemoPrompt(false);
              }}
              style={{ fontFamily: 'inherit' }}
              className="glow-cyan"
            >
              <ExperimentOutlined /> Load Demo Data
            </Button>
          </Card>
        )}
        {!showDemoPrompt && (
          <Empty description="No paper loaded. Create a new paper or load demo data." />
        )}
      </div>
    );
  }

  // ---- Derived State ----
  const currentSectionName = SECTION_ORDER[currentStep];
  const currentSection = sections[currentSectionName];

  const completedSections = SECTION_ORDER.filter(
    (name) => sections[name]?.is_complete,
  ).length;
  const totalSections = SECTION_ORDER.length;
  const progressPercent = Math.round((completedSections / totalSections) * 100);

  const totalWords = Object.values(sections).reduce(
    (sum, s) => sum + (s.word_count || 0), 0,
  );

  const currentSectionWordCount = currentSection?.word_count || 0;
  const currentSectionParaCount = (
    (currentSection?.content_json as any)?.paragraphs || []
  ).length;

  // ---- Handlers ----
  const handleNext = useCallback(() => {
    if (currentStep < SECTION_ORDER.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  }, [currentStep, setCurrentStep]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep, setCurrentStep]);

  const handleStepClick = useCallback(
    (step: number) => setCurrentStep(step),
    [setCurrentStep],
  );

  const handleToggleComplete = useCallback(() => {
    toggleSectionComplete(currentSectionName);
  }, [currentSectionName, toggleSectionComplete]);

  const handleValidate = useCallback(async () => {
    if (isDemoMode || !paper) {
      // In demo mode, run client-side validation only
      const demoIssues: ValidationIssue[] = [];
      const currentContent = currentSection?.content_json as any;
      const paragraphs = currentContent?.paragraphs || [];

      if (paragraphs.length === 0) {
        demoIssues.push({
          rule_id: 'section_empty',
          section: currentSectionName,
          severity: 'error',
          message: `The ${SECTION_LABELS[currentSectionName]} section is empty. Add at least one paragraph.`,
          auto_fix_hint: `Click "Add Paragraph" to start writing.`,
        });
      }

      if (totalWords < 500) {
        demoIssues.push({
          rule_id: 'min_total_words',
          section: 'paper',
          severity: 'warning',
          message: `Total word count (${totalWords}) is below the recommended minimum of 500 words.`,
          auto_fix_hint: 'Expand each section to at least 100 words.',
        });
      }

      setLocalIssues(demoIssues);

      if (demoIssues.length === 0) {
        message.success('All checks passed — paper is ready to export!');
      } else {
        const errCount = demoIssues.filter((i) => i.severity === 'error').length;
        if (errCount > 0) {
          message.warning(`${errCount} error(s) found. See details below.`);
        } else {
          message.info(`${demoIssues.length} warning(s). Paper may need revision.`);
        }
      }
      return;
    }

    // Server-side validation
    setValidating(true);
    try {
      const result = await api.validatePaper(paper.id);
      const issues: ValidationIssue[] = (result.issues || []).map((i: any) => ({
        rule_id: i.rule_id || '',
        section: i.section || '',
        severity: (i.severity || 'warning') as ValidationIssue['severity'],
        message: i.message || '',
        auto_fix_hint: i.auto_fix_hint || null,
      }));
      setLocalIssues(issues);

      if (result.is_ready) {
        message.success('All checks passed — paper is ready to export!');
      } else {
        const errCount = issues.filter((i) => i.severity === 'error').length;
        if (errCount > 0) {
          message.warning(`${errCount} error(s) must be fixed before export.`);
        }
      }
    } catch {
      message.error('Server validation failed. Check your connection.');
    }
    setValidating(false);
  }, [isDemoMode, paper, currentSection, currentSectionName, totalWords]);

  // ---- Build Step Items ----
  const stepItems = useMemo(
    () =>
      SECTION_ORDER.map((name) => ({
        title: SECTION_LABELS[name],
        description: sections[name]?.is_complete ? (
          <Tag color="green" style={{ fontSize: 10 }}>
            Complete
          </Tag>
        ) : (
          <Tag style={{ fontSize: 10 }}>Pending</Tag>
        ),
      })),
    [sections],
  );

  // =================================================================
  // RENDER
  // =================================================================

  return (
    <div style={{ maxWidth: 1240, margin: '0 auto', paddingBottom: 80 }}>
      {/* ===== Paper Header Bar ===== */}
      <Card
        className="glow-cyan"
        style={{
          marginBottom: 20,
          borderColor: 'var(--accent-cyan)',
          background: 'var(--bg-card)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          {/* Left: Title & Metadata */}
          <div style={{ flex: 1, minWidth: 280 }}>
            <Title
              level={3}
              style={{
                margin: 0,
                color: 'var(--text-primary)',
                fontFamily: 'inherit',
                wordBreak: 'break-word',
              }}
            >
              {paper.title || 'Untitled Paper'}
            </Title>
            <Space size={[8, 8]} wrap style={{ marginTop: 10 }}>
              {isDemoMode && (
                <Tag color="purple">
                  <ExperimentOutlined /> DEMO
                </Tag>
              )}
              <Tag color="cyan">{paper.citation_style.toUpperCase()}</Tag>
              {paper.journal_target && (
                <Tag color="blue">{paper.journal_target}</Tag>
              )}
              <Text style={{ color: 'var(--text-secondary)', fontSize: 13 }}>
                {totalWords.toLocaleString()} words · {completedSections}/
                {totalSections} sections · {currentSectionParaCount} paragraphs
              </Text>
            </Space>
          </div>

          {/* Right: Progress + Demo toggle */}
          <Space direction="vertical" align="center" size={4}>
            <Progress
              type="circle"
              percent={progressPercent}
              size={64}
              strokeColor={{
                '0%': 'var(--accent-cyan)',
                '100%': 'var(--accent-purple)',
              }}
              format={(pct) => (
                <span style={{ color: 'var(--text-primary)', fontSize: 14 }}>
                  {pct}%
                </span>
              )}
            />
            <Text style={{ color: 'var(--text3)', fontSize: 11 }}>Overall</Text>
          </Space>
        </div>
      </Card>

      {/* ===== Steps Bar ===== */}
      <Card style={{ marginBottom: 20 }}>
        <Steps
          current={currentStep}
          onChange={handleStepClick}
          items={stepItems}
          size="small"
          style={{ cursor: 'pointer' }}
        />
      </Card>

      {/* ===== Section Editor Card ===== */}
      <Card
        style={{ marginBottom: 20 }}
        title={
          <Space size={8} wrap>
            <span
              style={{
                color: 'var(--accent-cyan)',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              Step {currentStep + 1}: {SECTION_LABELS[currentSectionName]}
            </span>
            {/* Section-level stats badges */}
            <Tag color="geekblue" style={{ fontSize: 11 }}>
              {currentSectionWordCount} words
            </Tag>
            <Tag style={{ fontSize: 11 }}>
              {currentSectionParaCount} paragraphs
            </Tag>
            {currentSection?.is_complete && (
              <Tag color="green" style={{ fontSize: 11 }}>
                ✓ Marked Complete
              </Tag>
            )}
            <Tooltip title={SECTION_HELP[currentSectionName]} placement="bottom">
              <BookOutlined
                style={{ color: 'var(--text-secondary)', cursor: 'help', fontSize: 14 }}
              />
            </Tooltip>
            <Button
              type="primary"
              ghost
              size="small"
              onClick={() => togglePhraseBrowser(currentSectionName)}
              style={{ fontFamily: 'inherit' }}
            >
              📚 Phrasebank
            </Button>
          </Space>
        }
        extra={
          <Space size={8}>
            <Button
              onClick={handlePrev}
              disabled={currentStep === 0}
              icon={<LeftOutlined />}
              style={{ fontFamily: 'inherit' }}
            >
              Previous
            </Button>
            <Button
              onClick={handleToggleComplete}
              icon={
                currentSection?.is_complete ? (
                  <CheckCircleOutlined />
                ) : undefined
              }
              style={{ fontFamily: 'inherit' }}
            >
              {currentSection?.is_complete ? '✓ Done' : 'Mark Complete'}
            </Button>
            <Button
              type="primary"
              onClick={handleNext}
              disabled={currentStep === SECTION_ORDER.length - 1}
              icon={<RightOutlined />}
              style={{ fontFamily: 'inherit' }}
            >
              Next
            </Button>
          </Space>
        }
      >
        <SectionEditor sectionName={currentSectionName} />
      </Card>

      {/* ===== Validation Results Panel ===== */}
      {localIssues.length > 0 && (
        <Card
          style={{ marginBottom: 20 }}
          size="small"
          title={
            <Space>
              <ExclamationCircleOutlined
                style={{
                  color:
                    localIssues.some((i) => i.severity === 'error')
                      ? 'var(--error)'
                      : 'var(--warning)',
                }}
              />
              <span style={{ fontFamily: 'inherit' }}>
                Validation Results ({localIssues.length} issue
                {localIssues.length !== 1 ? 's' : ''})
              </span>
            </Space>
          }
        >
          {localIssues.map((issue, idx) => (
            <Alert
              key={idx}
              type={issue.severity === 'error' ? 'error' : 'warning'}
              showIcon
              message={
                <span style={{ fontFamily: 'inherit' }}>
                  <Tag
                    color={issue.severity === 'error' ? 'red' : 'orange'}
                    style={{ fontSize: 10, marginRight: 8 }}
                  >
                    {issue.severity.toUpperCase()}
                  </Tag>
                  <Text style={{ color: 'var(--text-primary)' }}>
                    [{issue.section}] {issue.message}
                  </Text>
                </span>
              }
              description={
                issue.auto_fix_hint ? (
                  <Text style={{ fontSize: 12, fontFamily: 'inherit' }}>
                    💡 {issue.auto_fix_hint}
                  </Text>
                ) : undefined
              }
              style={{
                marginBottom: 8,
                background: 'var(--bg-elevated)',
                fontFamily: 'inherit',
              }}
            />
          ))}
        </Card>
      )}

      {/* ===== Bottom Action Bar ===== */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 16,
          marginTop: 24,
          flexWrap: 'wrap',
        }}
      >
        <Button
          onClick={handleValidate}
          loading={validating}
          icon={<CheckCircleOutlined />}
          size="large"
          style={{ fontFamily: 'inherit' }}
        >
          Validate Paper
        </Button>
        <Button
          type="primary"
          size="large"
          icon={<DownloadOutlined />}
          onClick={() => setShowExport(true)}
          className="glow-cyan"
          style={{ fontFamily: 'inherit' }}
        >
          Export Paper
        </Button>
      </div>

      {/* ===== Phrase Browser Drawer ===== */}
      <PhraseBrowser
        open={phraseBrowserOpen}
        onClose={closePhraseBrowser}
        sectionName={currentSectionName}
      />

      {/* ===== Export Modal ===== */}
      <ExportPreview
        open={showExport}
        onClose={() => setShowExport(false)}
        paperId={paper.id}
      />
    </div>
  );
}
