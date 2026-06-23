/**
 * 导出面板 — 选择格式、期刊模板，一键下载
 */
import { useState } from 'react';
import { Modal, Button, Radio, Space, Typography, Alert, Tag, message } from 'antd';
import { DownloadOutlined, FilePdfOutlined, FileTextOutlined, FileWordOutlined, CheckCircleOutlined } from '@ant-design/icons';
import * as api from '../../api/client';

const { Text } = Typography;

interface Props { open: boolean; onClose: () => void; paperId: string; }
type ExportFormat = 'pdf' | 'latex' | 'docx';

export function ExportPreview({ open, onClose, paperId }: Props) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [template, setTemplate] = useState('ieee');
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true); setError(null); setResult(null);
    try {
      const data = await api.exportPaper(paperId, format, template);
      setResult(data);
      if (data.errors?.length > 0) setError(data.errors.join('；'));
      else message.success(`已成功导出为 ${format.toUpperCase()}！`);
    } catch (e: any) { setError(e.message || '导出失败'); }
    setExporting(false);
  };

  const handleDownload = () => window.open(api.getDownloadUrl(paperId, format), '_blank');

  const icons: Record<ExportFormat, React.ReactNode> = {
    pdf: <FilePdfOutlined style={{ fontSize: 26, color: '#e0556a' }} />,
    latex: <FileTextOutlined style={{ fontSize: 26, color: '#7eb8da' }} />,
    docx: <FileWordOutlined style={{ fontSize: 26, color: '#5ec4b0' }} />,
  };
  const labels: Record<ExportFormat, string> = {
    pdf: 'PDF（通过 LaTeX → xelatex 编译）',
    latex: 'LaTeX 源码（.tex 文件）',
    docx: 'Microsoft Word（.docx）',
  };

  return (
    <Modal title={<Space><DownloadOutlined style={{ color: 'var(--gold)' }} /><span>导出论文</span></Space>}
      open={open} onCancel={onClose} width={540}
      footer={[
        <Button key="close" onClick={onClose}>关闭</Button>,
        <Button key="download" type="primary" onClick={handleDownload} disabled={!result?.file_path} icon={<DownloadOutlined />}>下载文件</Button>,
        <Button key="export" type="primary" onClick={handleExport} loading={exporting} icon={<CheckCircleOutlined />} style={{ background: 'linear-gradient(135deg, var(--gold-dim), var(--gold))', border: 'none', fontWeight: 600 }}>编译并导出</Button>,
      ]}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 导出格式 */}
        <div>
          <Text style={{ color: 'var(--text-dim)', display: 'block', marginBottom: 12, fontSize: 12 }}>导出格式</Text>
          <Radio.Group value={format} onChange={(e) => setFormat(e.target.value)} style={{ width: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }}>
              {(Object.keys(labels) as ExportFormat[]).map((fmt) => (
                <Radio key={fmt} value={fmt} style={{
                  padding: '14px 18px', background: format === fmt ? 'rgba(226,176,74,0.06)' : 'var(--bg-surface)',
                  borderRadius: 'var(--radius-sm)', border: `1px solid ${format === fmt ? 'var(--gold)' : 'var(--border)'}`,
                  width: '100%', margin: 0, transition: 'all 0.2s',
                }}>
                  <Space>{icons[fmt]}<div><Text strong style={{ color: 'var(--text-main)' }}>{fmt.toUpperCase()}</Text><br /><Text style={{ color: 'var(--text-dim)', fontSize: 11 }}>{labels[fmt]}</Text></div></Space>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>
        {/* 期刊模板 */}
        <div>
          <Text style={{ color: 'var(--text-dim)', display: 'block', marginBottom: 12, fontSize: 12 }}>目标期刊模板</Text>
          <Radio.Group value={template} onChange={(e) => setTemplate(e.target.value)}>
            <Space wrap>
              {[{ v: 'ieee', l: 'IEEE' }, { v: 'elsevier', l: 'Elsevier' }, { v: 'springer', l: 'Springer' }, { v: 'nature', l: 'Nature' }, { v: 'generic', l: '通用' }].map((t) => (
                <Radio.Button key={t.v} value={t.v}>{t.l}</Radio.Button>
              ))}
            </Space>
          </Radio.Group>
        </div>
        {error && <Alert type="error" message="导出问题" description={error} showIcon />}
        {result?.file_path && !error && (
          <Alert type="success" message="导出成功" showIcon
            description={<div><Text>文件：{result.file_path?.split('/').pop() || result.file_path}</Text><br />
              <Text style={{ color: 'var(--text-dim)', fontSize: 11 }}>大小：{(result.file_size / 1024).toFixed(1)} KB</Text>
              {result.warnings?.length > 0 && <div style={{ marginTop: 8 }}>{result.warnings.map((w: string, i: number) => <Tag key={i} color="warning" style={{ fontSize: 10 }}>{w}</Tag>)}</div>}
            </div>} />
        )}
        {result?.compile_log && (
          <div>
            <Text style={{ color: 'var(--text-dim)', fontSize: 11 }}>编译日志：</Text>
            <pre style={{ background: 'var(--bg-root)', color: 'var(--text-dim)', padding: 12, borderRadius: 'var(--radius-sm)', fontSize: 10, maxHeight: 140, overflow: 'auto', fontFamily: 'monospace' }}>{result.compile_log.slice(-1500)}</pre>
          </div>
        )}
      </Space>
    </Modal>
  );
}
