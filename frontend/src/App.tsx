/**
 * SCI Writer — Main Application
 *
 * Wizard-based SCI paper writing assistant with phrasebank.
 * Supports two modes:
 *   1. Demo mode (?demo=1 or click "Load Demo") — pre-loaded with
 *      H-MODRL agricultural logistics research scenario
 *   2. Live mode — connects to the FastAPI backend
 */
import { useState, useEffect } from 'react';
import {
  ConfigProvider, Layout, Typography, Button, Input, Select,
  Space, Card, Tag, Divider,
} from 'antd';
import {
  PlusOutlined, FileTextOutlined, ExperimentOutlined,
  ApiOutlined, GithubOutlined,
} from '@ant-design/icons';
import { usePaperStore } from './stores/paperStore';
import { PaperWizard } from './components/Wizard/PaperWizard';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function App() {
  const {
    paper, isLoading, isDemoMode,
    createPaper, initWithMockData,
  } = usePaperStore();

  const [showCreate, setShowCreate] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [journal, setJournal] = useState('ieee');

  // Auto-hide create form when paper is loaded
  useEffect(() => {
    if (paper) setShowCreate(false);
  }, [paper]);

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createPaper(newTitle, journal || undefined);
    setShowCreate(false);
  };

  const handleLoadDemo = () => {
    initWithMockData();
    setShowCreate(false);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: undefined,  // Use the CSS variable-based dark theme
        token: {
          colorPrimary: '#58a6ff',
          colorSuccess: '#3fb950',
          colorWarning: '#d2991d',
          colorError: '#f85149',
          colorInfo: '#58a6ff',
          borderRadius: 6,
          fontFamily:
            "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
        {/* ===== Header ===== */}
        <Header
          style={{
            background: 'var(--bg-card)',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            height: 56,
          }}
        >
          {/* Left: Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ExperimentOutlined
              style={{ fontSize: 22, color: 'var(--accent-cyan)' }}
            />
            <Title
              level={4}
              style={{
                margin: 0,
                color: 'var(--accent-cyan)',
                letterSpacing: 1,
              }}
            >
              SCI WRITER
            </Title>
            <Tag color="purple" style={{ fontFamily: 'inherit' }}>
              MVP
            </Tag>
            {isDemoMode && (
              <Tag color="orange" style={{ fontFamily: 'inherit' }}>
                <ExperimentOutlined /> DEMO MODE
              </Tag>
            )}
          </div>

          {/* Right: Actions */}
          <Space size={8}>
            {paper && (
              <>
                {!isDemoMode && (
                  <Tag color="cyan" style={{ fontFamily: 'inherit' }}>
                    {paper.citation_style.toUpperCase()}
                  </Tag>
                )}
                <Button
                  type="text"
                  onClick={() => setShowCreate(true)}
                  icon={<PlusOutlined />}
                  style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}
                >
                  New Paper
                </Button>
                <Button
                  type="text"
                  onClick={() => window.open(
                    'https://github.com/yangxiwen123/scipaper', '_blank',
                  )}
                  icon={<GithubOutlined />}
                  style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}
                >
                  GitHub
                </Button>
              </>
            )}
          </Space>
        </Header>

        {/* ===== Content ===== */}
        <Content style={{ padding: 24 }}>
          {showCreate ? (
            /* ------ Create/Load Screen ------ */
            <div style={{ maxWidth: 640, margin: '60px auto' }}>
              <Card
                className="glow-cyan"
                style={{ borderColor: 'var(--accent-cyan)', marginBottom: 24 }}
                title={
                  <span style={{ color: 'var(--accent-cyan)', fontFamily: 'inherit' }}>
                    <FileTextOutlined /> Create New Paper
                  </span>
                }
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Text
                      style={{
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: 8,
                        fontFamily: 'inherit',
                      }}
                    >
                      Paper Title
                    </Text>
                    <Input
                      size="large"
                      placeholder="Enter your paper title..."
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      onPressEnter={handleCreate}
                      style={{ fontFamily: 'inherit' }}
                    />
                  </div>
                  <div>
                    <Text
                      style={{
                        color: 'var(--text-secondary)',
                        display: 'block',
                        marginBottom: 8,
                        fontFamily: 'inherit',
                      }}
                    >
                      Target Journal Template
                    </Text>
                    <Select
                      size="large"
                      value={journal}
                      onChange={setJournal}
                      style={{ width: '100%', fontFamily: 'inherit' }}
                      options={[
                        { label: 'IEEE (Transactions)', value: 'ieee' },
                        { label: 'Elsevier (Journal)', value: 'elsevier' },
                        { label: 'Springer (Journal)', value: 'springer' },
                        { label: 'Nature', value: 'nature' },
                        { label: 'Generic / Other', value: 'generic' },
                      ]}
                    />
                  </div>
                  <Button
                    type="primary"
                    size="large"
                    block
                    onClick={handleCreate}
                    loading={isLoading}
                    icon={<PlusOutlined />}
                    style={{ fontFamily: 'inherit', height: 48 }}
                  >
                    Start Writing
                  </Button>
                </Space>
              </Card>

              <Divider>
                <Text style={{ color: 'var(--text3)', fontSize: 13, fontFamily: 'inherit' }}>
                  or
                </Text>
              </Divider>

              {/* Demo Mode Card */}
              <Card
                className="glow-purple"
                style={{ borderColor: 'var(--accent-purple)' }}
                title={
                  <span style={{ color: 'var(--accent-purple)', fontFamily: 'inherit' }}>
                    <ExperimentOutlined /> Load Demo Scenario
                  </span>
                }
              >
                <Text
                  style={{
                    color: 'var(--text-secondary)',
                    display: 'block',
                    marginBottom: 16,
                    fontFamily: 'inherit',
                    lineHeight: 1.8,
                  }}
                >
                  <strong style={{ color: 'var(--accent-purple)' }}>
                    基于多目标动态优化的农业物流路径规划方法与应用研究
                  </strong>
                  <br />
                  A complete, realistic SCI paper with the full Methods section
                  describing the H-MODRL (Hybrid Multi-Objective Deep Reinforcement
                  Learning) algorithm for cold chain logistics optimization. No
                  backend required — all data lives in the browser.
                </Text>
                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleLoadDemo}
                  icon={<ExperimentOutlined />}
                  style={{
                    fontFamily: 'inherit',
                    height: 48,
                    background: 'linear-gradient(135deg, var(--accent-purple), var(--accent-cyan))',
                    border: 'none',
                  }}
                >
                  Load Demo Data
                </Button>
              </Card>
            </div>
          ) : paper ? (
            /* ------ Wizard (Active Paper) ------ */
            <PaperWizard />
          ) : (
            /* ------ Loading / Empty ------ */
            <div style={{ textAlign: 'center', marginTop: 120 }}>
              <Text style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>
                Loading...
              </Text>
            </div>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
