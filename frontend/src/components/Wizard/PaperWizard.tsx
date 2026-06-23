/**
 * PaperWizard — the main stepper-based writing interface.
 * Guides users through all SCI paper sections step by step.
 */
import { useState } from 'react';
import {
  Steps, Button, Space, Card, Progress, Typography, Tooltip, Modal,
  Tag, message,
} from 'antd';
import {
  CheckCircleOutlined, ExclamationCircleOutlined,
  DownloadOutlined, BookOutlined, LeftOutlined, RightOutlined,
} from '@ant-design/icons';
import { usePaperStore, SECTION_ORDER, SECTION_LABELS, SECTION_HELP } from '../../stores/paperStore';
import { SectionEditor } from '../StepForm/SectionEditor';
import { PhraseBrowser } from '../PhraseBrowser/PhraseBrowser';
import { ExportPreview } from '../ExportPreview/ExportPreview';
import * as api from '../../api/client';

const { Title, Text } = Typography;

export function PaperWizard() {
  const {
    paper, sections, currentStep, setCurrentStep,
    phraseBrowserOpen, togglePhraseBrowser, closePhraseBrowser,
  } = usePaperStore();

  const [showExport, setShowExport] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationIssues, setValidationIssues] = useState<any[]>([]);

  if (!paper) return null;

  const currentSectionName = SECTION_ORDER[currentStep];
  const currentSection = sections[currentSectionName];

  // Completion stats
  const completedSections = SECTION_ORDER.filter(
    (name) => sections[name]?.is_complete
  ).length;
  const totalSections = SECTION_ORDER.length;
  const progressPercent = Math.round((completedSections / totalSections) * 100);

  // Total word count
  const totalWords = Object.values(sections).reduce(
    (sum, s) => sum + (s.word_count || 0), 0
  );

  const handleNext = () => {
    if (currentStep < SECTION_ORDER.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (step: number) => {
    setCurrentStep(step);
  };

  const handleValidate = async () => {
    setValidating(true);
    try {
      const result = await api.validatePaper(paper.id);
      setValidationIssues(result.issues || []);
      if (result.is_ready) {
        message.success('Paper is ready for export!');
      } else {
        const errorCount = result.issues?.filter((i: any) => i.severity === 'error').length || 0;
        if (errorCount > 0) {
          message.warning(`${errorCount} issues need attention before export.`);
        }
      }
      // Show validation modal
      if (result.issues?.length > 0) {
        Modal.info({
          title: 'Pre-Export Validation',
          content: (
            <div>
              {result.issues.map((issue: any, i: number) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  <Tag color={issue.severity === 'error' ? 'red' : 'orange'}>
                    {issue.severity.toUpperCase()}
                  </Tag>
                  <Text style={{ color: 'var(--text-primary)' }}>{issue.message}</Text>
                  {issue.auto_fix_hint && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        💡 {issue.auto_fix_hint}
                      </Text>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ),
          width: 600,
        });
      }
    } catch (err) {
      message.error('Validation failed');
    }
    setValidating(false);
  };

  const stepItems = SECTION_ORDER.map((name, idx) => ({
    title: SECTION_LABELS[name],
    description: sections[name]?.is_complete ? (
      <Tag color="green" style={{ fontSize: 10 }}>Complete</Tag>
    ) : (
      <Tag style={{ fontSize: 10 }}>In Progress</Tag>
    ),
  }));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Paper Title Bar */}
      <Card
        className="glow-cyan"
        style={{ marginBottom: 24, borderColor: 'var(--accent-cyan)' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <Title level={3} style={{ margin: 0, color: 'var(--text-primary)', fontFamily: 'inherit' }}>
              {paper.title || 'Untitled Paper'}
            </Title>
            <Space style={{ marginTop: 8 }}>
              <Tag color="cyan">{paper.citation_style.toUpperCase()}</Tag>
              <Text style={{ color: 'var(--text-secondary)' }}>
                {totalWords.toLocaleString()} words · {completedSections}/{totalSections} sections
              </Text>
            </Space>
          </div>
          <Progress
            type="circle"
            percent={progressPercent}
            size={60}
            strokeColor={{
              '0%': 'var(--accent-cyan)',
              '100%': 'var(--accent-purple)',
            }}
          />
        </div>
      </Card>

      {/* Wizard Steps */}
      <Card style={{ marginBottom: 24 }}>
        <Steps
          current={currentStep}
          onChange={handleStepClick}
          items={stepItems}
          size="small"
          style={{ cursor: 'pointer' }}
        />
      </Card>

      {/* Section Editor */}
      <div style={{ display: 'flex', gap: 24 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card
            title={
              <Space>
                <span style={{ color: 'var(--accent-cyan)', fontFamily: 'inherit' }}>
                  {SECTION_LABELS[currentSectionName]}
                </span>
                <Tooltip title={SECTION_HELP[currentSectionName]}>
                  <BookOutlined style={{ color: 'var(--text-secondary)', cursor: 'help' }} />
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
              <Space>
                <Button
                  onClick={handlePrev}
                  disabled={currentStep === 0}
                  icon={<LeftOutlined />}
                  style={{ fontFamily: 'inherit' }}
                >
                  Previous
                </Button>
                <Button
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

          {/* Bottom actions */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
            <Button
              onClick={handleValidate}
              loading={validating}
              icon={<CheckCircleOutlined />}
              style={{ fontFamily: 'inherit' }}
            >
              Validate Paper
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={() => setShowExport(true)}
              className="glow-cyan"
              style={{ fontFamily: 'inherit' }}
            >
              Export Paper
            </Button>
          </div>
        </div>
      </div>

      {/* Phrase Browser Drawer */}
      <PhraseBrowser
        open={phraseBrowserOpen}
        onClose={closePhraseBrowser}
        sectionName={currentSectionName}
      />

      {/* Export Modal */}
      <ExportPreview
        open={showExport}
        onClose={() => setShowExport(false)}
        paperId={paper.id}
      />
    </div>
  );
}
