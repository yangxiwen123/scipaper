/**
 * SCI Writer — zero-barrier SCI paper writing assistant.
 *
 * Standalone-first design: works fully in the browser with localStorage.
 * Backend connection is optional for LaTeX/PDF export.
 */
import { useState, useEffect } from 'react';
import { ConfigProvider, Layout, Typography, Button, Input, Select, Space, Card, Tag } from 'antd';
import { PlusOutlined, ExperimentOutlined, GithubOutlined, LaptopOutlined } from '@ant-design/icons';
import { usePaperStore } from './stores/paperStore';
import { PaperWizard } from './components/Wizard/PaperWizard';

const { Header, Content } = Layout;
const { Title, Text, Paragraph } = Typography;

export default function App() {
  const { paper, isLoading, isStandalone, createStandalonePaper, createPaper } = usePaperStore();
  const [showCreate, setShowCreate] = useState(true);
  const [newTitle, setNewTitle] = useState('');
  const [journal, setJournal] = useState('ieee');

  useEffect(() => { if (paper) setShowCreate(false); }, [paper]);

  const handleStartLocal = () => {
    createStandalonePaper('', journal);
    setShowCreate(false);
  };

  const handleCreateWithBackend = async () => {
    if (!newTitle.trim()) return;
    await createPaper(newTitle, journal || undefined);
    setShowCreate(false);
  };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#58a6ff', colorSuccess: '#3fb950', colorWarning: '#d2991d', colorError: '#f85149', borderRadius: 6, fontFamily: "'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace" } }}>
      <Layout style={{ minHeight: '100vh', background: 'var(--bg-dark)' }}>
        <Header style={{ background: 'var(--bg-card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', height: 56 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ExperimentOutlined style={{ fontSize: 22, color: 'var(--accent-cyan)' }} />
            <Title level={4} style={{ margin: 0, color: 'var(--accent-cyan)', letterSpacing: 1 }}>SCI WRITER</Title>
            <Tag color="purple" style={{ fontFamily: 'inherit' }}>MVP</Tag>
          </div>
          {paper && (
            <Space>
              {isStandalone && <Tag color="orange"><LaptopOutlined /> Local</Tag>}
              <Button type="text" onClick={() => setShowCreate(true)} icon={<PlusOutlined />} style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>New</Button>
              <Button type="text" onClick={() => window.open('https://github.com/yangxiwen123/scipaper', '_blank')} icon={<GithubOutlined />} style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>GitHub</Button>
            </Space>
          )}
        </Header>

        <Content style={{ padding: 24 }}>
          {showCreate ? (
            <div style={{ maxWidth: 640, margin: '40px auto' }}>
              {/* Quick Start (no backend) */}
              <Card className="glow-cyan" style={{ borderColor: 'var(--accent-cyan)', marginBottom: 20 }}
                title={<span style={{ color: 'var(--accent-cyan)', fontFamily: 'inherit' }}><LaptopOutlined /> Quick Start — No Backend Required</span>}>
                <Paragraph style={{ color: 'var(--text-secondary)', fontSize: 14, fontFamily: 'inherit', lineHeight: 1.8 }}>
                  Start writing immediately. All your data is saved in your browser's local storage. No server, no setup — just click below and begin filling in the guided forms.
                </Paragraph>
                <Space size="middle" style={{ width: '100%' }}>
                  <div style={{ flex: 1 }}>
                    <Text style={{ color: 'var(--text-secondary)', fontSize: 12, display: 'block', marginBottom: 8 }}>Target journal template (optional)</Text>
                    <Select value={journal} onChange={setJournal} style={{ width: 200, fontFamily: 'inherit' }} options={[
                      { label: 'IEEE', value: 'ieee' }, { label: 'Elsevier', value: 'elsevier' },
                      { label: 'Springer', value: 'springer' }, { label: 'Nature', value: 'nature' },
                      { label: 'Generic', value: 'generic' },
                    ]} />
                  </div>
                  <Button type="primary" size="large" onClick={handleStartLocal} icon={<ExperimentOutlined />} style={{ fontFamily: 'inherit', height: 48 }}>Start Writing Now</Button>
                </Space>
              </Card>

              {/* Connected Mode */}
              <Card style={{ borderColor: 'var(--border)' }}
                title={<span style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>or: New Paper (with Backend)</span>}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 8, fontFamily: 'inherit' }}>Paper Title</Text>
                    <Input size="large" placeholder="Enter your paper title..." value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onPressEnter={handleCreateWithBackend} style={{ fontFamily: 'inherit' }} />
                  </div>
                  <Button type="primary" size="large" block onClick={handleCreateWithBackend} loading={isLoading} icon={<PlusOutlined />}
                    style={{ fontFamily: 'inherit', height: 48 }}>Create & Start Writing (requires backend on :8000)</Button>
                </Space>
              </Card>
            </div>
          ) : paper ? (
            <PaperWizard />
          ) : (
            <div style={{ textAlign: 'center', marginTop: 120 }}>
              <Text style={{ color: 'var(--text-secondary)', fontFamily: 'inherit' }}>Loading...</Text>
            </div>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
