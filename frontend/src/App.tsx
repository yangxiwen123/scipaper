/**
 * SCI Writer — 零门槛 SCI 论文写作助手
 * "就像做填空题一样写论文"
 */
import { useState, useEffect } from 'react';
import { ConfigProvider, Layout, Typography, Button, Select, Space, Card, Tag, Row, Col } from 'antd';
import { ExperimentOutlined, GithubOutlined, ThunderboltOutlined, SafetyCertificateOutlined, FormOutlined, BulbOutlined } from '@ant-design/icons';
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

  const handleStartLocal = () => { createStandalonePaper('', journal); setShowCreate(false); };
  const handleCreate = async () => { if (!newTitle.trim()) return; await createPaper(newTitle, journal); setShowCreate(false); };

  return (
    <ConfigProvider theme={{ token: { colorPrimary: '#e2b04a', borderRadius: 8, fontFamily: "'PingFang SC','Noto Sans SC','Microsoft YaHei',sans-serif" } }}>
      <Layout style={{ minHeight: '100vh', background: 'var(--bg-root)' }}>

        {/* ═══ 顶栏 ═══ */}
        <Header style={{ background: 'rgba(17,22,30,0.8)', backdropFilter: 'blur(16px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 28px', height: 56, position: 'sticky', top: 0, zIndex: 100 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>📝</span>
            <Title level={4} style={{ margin: 0, color: 'var(--gold)', fontWeight: 700, letterSpacing: 0.5 }}>SCI Writer</Title>
            <Tag style={{ background: 'rgba(226,176,74,0.12)', border: '1px solid rgba(226,176,74,0.25)', color: 'var(--gold-light)', fontSize: 10, fontWeight: 600 }}>MVP</Tag>
          </div>
          {paper && (
            <Space size={6}>
              {isStandalone && <Tag style={{ background: 'rgba(94,196,176,0.12)', border: '1px solid rgba(94,196,176,0.25)', color: 'var(--teal-light)', fontSize: 10 }}>💻 本地模式</Tag>}
              {!isStandalone && <Tag color="gold">{paper.citation_style?.toUpperCase()}</Tag>}
              <Button type="text" onClick={() => setShowCreate(true)} style={{ color: 'var(--text-soft)', fontSize: 13 }}>新建论文</Button>
              <Button type="text" onClick={() => window.open('https://github.com/yangxiwen123/scipaper','_blank')} icon={<GithubOutlined />} style={{ color: 'var(--text-dim)', fontSize: 13 }} />
            </Space>
          )}
        </Header>

        <Content style={{ padding: 24 }}>
          {showCreate ? (
            /* ═══════════════════════════════════════════════════════
               欢迎页
               ═══════════════════════════════════════════════════════ */
            <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0 60px' }}>
              {/* Hero */}
              <div style={{ textAlign: 'center', marginBottom: 48, paddingTop: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 16, animation: 'fadeIn 0.6s ease' }}>📝</div>
                <Title style={{ fontSize: 36, fontWeight: 800, marginBottom: 12, color: 'var(--text-main)', letterSpacing: 1, animation: 'fadeUp 0.6s ease both' }}>
                  像<mark style={{ background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', fontWeight: 900 }}>做填空题</mark>一样写 SCI 论文
                </Title>
                <Paragraph style={{ fontSize: 16, color: 'var(--text-soft)', maxWidth: 520, margin: '0 auto', lineHeight: 2, animation: 'fadeUp 0.6s 0.1s ease both' }}>
                  不需要学术背景 · 不需要懂 LaTeX · 不需要 AI 生成文字<br />
                  你只需要<strong style={{ color: 'var(--gold-light)' }}>按顺序填写</strong>，剩下的交给系统
                </Paragraph>
              </div>

              {/* 三列特色 */}
              <Row gutter={[20, 20]} style={{ marginBottom: 40 }}>
                {[
                  { icon: <FormOutlined style={{ fontSize: 28, color: 'var(--gold)' }} />, title: '结构化引导', desc: '每个章节拆成 3-5 个填空题，每个框都有提示、示例和字数指导。你不知道该写什么？看提示就行。' },
                  { icon: <BulbOutlined style={{ fontSize: 28, color: 'var(--teal)' }} />, title: '学术句型库', desc: '89 条地道 SCI 句型模板，按写作意图分类。不会学术表达？点一下句型，填入你的变量即可。' },
                  { icon: <ThunderboltOutlined style={{ fontSize: 28, color: 'var(--rose)' }} />, title: '一键排版导出', desc: '写完后自动编译为 LaTeX / PDF / Word，适配 IEEE、Elsevier 等期刊格式。不用学排版。' },
                ].map((feat, i) => (
                  <Col xs={24} sm={8} key={i}>
                    <Card style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', height: '100%', boxShadow: 'var(--shadow-card)', animation: `fadeUp 0.5s ${0.15+i*0.1}s ease both` }}
                      bodyStyle={{ padding: '28px 22px' }}>
                      <div style={{ marginBottom: 14 }}>{feat.icon}</div>
                      <Title level={5} style={{ color: 'var(--text-main)', marginBottom: 8, fontWeight: 600 }}>{feat.title}</Title>
                      <Text style={{ color: 'var(--text-soft)', fontSize: 13, lineHeight: 1.9 }}>{feat.desc}</Text>
                    </Card>
                  </Col>
                ))}
              </Row>

              {/* 立即开始卡片 */}
              <Card className="glow-gold"
                style={{ border: '1px solid var(--border-glow)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-glow)', animation: 'fadeUp 0.6s 0.4s ease both' }}
                bodyStyle={{ padding: '36px 40px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                  <span style={{ fontSize: 28 }}>🚀</span>
                  <div>
                    <Title level={4} style={{ margin: 0, color: 'var(--text-main)', fontWeight: 600 }}>立即开始写作</Title>
                    <Text style={{ color: 'var(--text-soft)', fontSize: 13 }}>无需注册 · 无需安装 · 数据保存在你的浏览器里</Text>
                  </div>
                </div>
                <Space size="middle" style={{ width: '100%' }} wrap>
                  <Select value={journal} onChange={setJournal} style={{ width: 180 }}
                    options={[
                      { label: '📘 IEEE', value: 'ieee' },
                      { label: '📗 Elsevier', value: 'elsevier' },
                      { label: '📙 Springer', value: 'springer' },
                      { label: '📕 Nature', value: 'nature' },
                      { label: '📓 通用格式', value: 'generic' },
                    ]} />
                  <Button type="primary" size="large" onClick={handleStartLocal}
                    icon={<ExperimentOutlined />}
                    style={{ height: 48, fontSize: 15, padding: '0 36px', fontWeight: 600 }}>
                    开始写作（本地模式）
                  </Button>
                </Space>
                <div style={{ marginTop: 16, display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}><SafetyCertificateOutlined /> 零 AI 依赖，纯确定性逻辑</Text>
                  <Text style={{ color: 'var(--text-dim)', fontSize: 12 }}>💾 自动保存到本地浏览器</Text>
                </div>
              </Card>

              {/* 后端模式（折叠） */}
              <Card style={{ marginTop: 24, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)' }}
                bodyStyle={{ padding: '24px 28px' }}
                title={<Text style={{ color: 'var(--text-dim)', fontSize: 13 }}>或者：输入标题连接后端（需要后端运行在 :8000）</Text>}>
                <Space.Compact style={{ width: '100%' }}>
                  <input style={{ flex: 1, background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)', padding: '10px 16px', color: 'var(--text-main)', fontSize: 14, fontFamily: 'inherit', outline: 'none' }}
                    placeholder="输入论文标题（可选）……" value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleCreate()} />
                  <Button type="primary" onClick={handleCreate} loading={isLoading} style={{ borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', height: 48 }}>连接后端创建</Button>
                </Space.Compact>
              </Card>
            </div>
          ) : paper ? (
            <PaperWizard />
          ) : (
            <div style={{ textAlign: 'center', marginTop: 120, color: 'var(--text-dim)' }}>加载中…</div>
          )}
        </Content>
      </Layout>
    </ConfigProvider>
  );
}
