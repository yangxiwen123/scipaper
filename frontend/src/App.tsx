/**
 * SCI Writer — Main Application
 * Wizard-based SCI paper writing assistant with phrasebank.
 */
import { useState } from 'react';
import { ConfigProvider, theme, Layout, Typography, Button, Input, Select, Space, Card, Tag } from 'antd';
import { PlusOutlined, FileTextOutlined, ExperimentOutlined } from '@ant-design/icons';
import { usePaperStore } from './stores/paperStore';
import { PaperWizard } from './components/Wizard/PaperWizard';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function App() {
  const { paper, isLoading, createPaper } = usePaperStore();
  const [showCreate, setShowCreate] = useState(!paper);
  const [newTitle, setNewTitle] = useState('');
  const [journal, setJournal] = useState('ieee');

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await createPaper(newTitle, journal || undefined);
    setShowCreate(false);
  };

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          colorPrimary: '#58a6ff',
          colorSuccess: '#3fb950',
          colorWarning: '#d2991d',
          colorError: '#f85149',
          colorInfo: '#58a6ff',
          borderRadius: 6,
          fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        },
      }}
    >
      <Layout style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ExperimentOutlined
              style={{ fontSize: 22, color: 'var(--accent-cyan)' }}
            />
            <Title level={4} style={{ margin: 0, color: 'var(--accent-cyan)', letterSpacing: 1 }}>
              SCI WRITER
            </Title>
            <Tag color="purple" style={{ fontFamily: 'inherit' }}>BETA</Tag>
          </div>
          {paper && (
            <Space>
              <Tag color="cyan" style={{ fontFamily: 'inherit' }}>
                {paper.citation_style.toUpperCase()}
              </Tag>
              <Button
                type="text"
                onClick={() => setShowCreate(true)}
                icon={<PlusOutlined />}
                style={{ color: 'var(--text-secondary)' }}
              >
                New Paper
              </Button>
            </Space>
          )}
        </Header>

        <Content style={{ padding: 24 }}>
          {showCreate ? (
            <div
              style={{
                maxWidth: 600,
                margin: '80px auto',
                padding: 0,
              }}
            >
              <Card
                className="glow-cyan"
                style={{ borderColor: 'var(--accent-cyan)' }}
                title={
                  <span style={{ color: 'var(--accent-cyan)', fontFamily: 'inherit' }}>
                    <FileTextOutlined /> Create New Paper
                  </span>
                }
              >
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
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
                    <Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 8 }}>
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
            </div>
          ) : paper ? (
            <PaperWizard />
          ) : (
            <div style={{ textAlign: 'center', marginTop: 120 }}>
              <Text style={{ color: 'var(--text-secondary)' }}>
                Loading...
              </Text>
            </div>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
