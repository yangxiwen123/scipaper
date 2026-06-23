/**
 * ExportPreview — modal for downloading/exporting the paper.
 * Allows format selection (PDF, LaTeX, Word) and shows download progress.
 */
import { useState } from 'react';
import {
  Modal, Button, Radio, Space, Typography, Progress, Alert, Tag, message,
} from 'antd';
import {
  DownloadOutlined, FilePdfOutlined, FileTextOutlined,
  FileWordOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import * as api from '../../api/client';

const { Text, Title } = Typography;

interface Props {
  open: boolean;
  onClose: () => void;
  paperId: string;
}

type ExportFormat = 'pdf' | 'latex' | 'docx';

export function ExportPreview({ open, onClose, paperId }: Props) {
  const [format, setFormat] = useState<ExportFormat>('pdf');
  const [template, setTemplate] = useState('ieee');
  const [exporting, setExporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExport = async () => {
    setExporting(true);
    setError(null);
    setResult(null);

    try {
      const data = await api.exportPaper(paperId, format, template);
      setResult(data);

      if (data.errors?.length > 0) {
        setError(data.errors.join('; '));
      } else {
        message.success(`Exported successfully as ${format.toUpperCase()}!`);
      }
    } catch (err: any) {
      setError(err.message || 'Export failed');
    }
    setExporting(false);
  };

  const handleDownload = () => {
    const url = api.getDownloadUrl(paperId, format);
    window.open(url, '_blank');
  };

  const formatIcons: Record<ExportFormat, React.ReactNode> = {
    pdf: <FilePdfOutlined style={{ fontSize: 24, color: '#f85149' }} />,
    latex: <FileTextOutlined style={{ fontSize: 24, color: '#58a6ff' }} />,
    docx: <FileWordOutlined style={{ fontSize: 24, color: '#3fb950' }} />,
  };

  const formatLabels: Record<ExportFormat, string> = {
    pdf: 'PDF (via LaTeX → xelatex)',
    latex: 'LaTeX Source (.tex)',
    docx: 'Microsoft Word (.docx)',
  };

  return (
    <Modal
      title={
        <Space>
          <DownloadOutlined style={{ color: 'var(--accent-cyan)' }} />
          <span style={{ fontFamily: 'inherit' }}>Export Paper</span>
        </Space>
      }
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} style={{ fontFamily: 'inherit' }}>
          Close
        </Button>,
        <Button
          key="download"
          type="primary"
          onClick={handleDownload}
          disabled={!result || !result.file_path}
          icon={<DownloadOutlined />}
          style={{ fontFamily: 'inherit' }}
        >
          Download
        </Button>,
        <Button
          key="export"
          type="primary"
          onClick={handleExport}
          loading={exporting}
          icon={<CheckCircleOutlined />}
          className="glow-cyan"
          style={{ fontFamily: 'inherit' }}
        >
          Compile & Export
        </Button>,
      ]}
      width={560}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* Format Selection */}
        <div>
          <Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 12 }}>
            Export Format
          </Text>
          <Radio.Group
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            style={{ width: '100%' }}
          >
            <Space direction="vertical" style={{ width: '100%' }}>
              {(Object.keys(formatLabels) as ExportFormat[]).map((fmt) => (
                <Radio
                  key={fmt}
                  value={fmt}
                  style={{
                    padding: '12px 16px',
                    background: format === fmt ? 'rgba(88,166,255,0.1)' : 'var(--bg-elevated)',
                    borderRadius: 8,
                    border: `1px solid ${format === fmt ? 'var(--accent-cyan)' : 'var(--border)'}`,
                    width: '100%',
                    margin: 0,
                  }}
                >
                  <Space>
                    {formatIcons[fmt]}
                    <div>
                      <Text strong style={{ color: 'var(--text-primary)', fontFamily: 'inherit' }}>
                        {fmt.toUpperCase()}
                      </Text>
                      <br />
                      <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                        {formatLabels[fmt]}
                      </Text>
                    </div>
                  </Space>
                </Radio>
              ))}
            </Space>
          </Radio.Group>
        </div>

        {/* Template Selection */}
        <div>
          <Text style={{ color: 'var(--text-secondary)', display: 'block', marginBottom: 12 }}>
            Journal Template
          </Text>
          <Radio.Group
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            <Space wrap>
              {[
                { value: 'ieee', label: 'IEEE', color: 'cyan' },
                { value: 'elsevier', label: 'Elsevier', color: 'purple' },
                { value: 'springer', label: 'Springer', color: 'green' },
                { value: 'nature', label: 'Nature', color: 'orange' },
                { value: 'generic', label: 'Generic', color: 'default' },
              ].map((t) => (
                <Radio.Button
                  key={t.value}
                  value={t.value}
                  style={{ fontFamily: 'inherit' }}
                >
                  {t.label}
                </Radio.Button>
              ))}
            </Space>
          </Radio.Group>
        </div>

        {/* Error */}
        {error && (
          <Alert
            type="error"
            message="Export Issues"
            description={error}
            showIcon
            style={{ fontFamily: 'inherit' }}
          />
        )}

        {/* Result */}
        {result && result.file_path && !error && (
          <Alert
            type="success"
            message="Export Successful"
            description={
              <div>
                <Text style={{ fontFamily: 'inherit' }}>
                  File: {result.file_path?.split('/').pop() || result.file_path}
                </Text>
                <br />
                <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  Size: {(result.file_size / 1024).toFixed(1)} KB
                </Text>
                {result.warnings?.length > 0 && (
                  <div style={{ marginTop: 8 }}>
                    {result.warnings.map((w: string, i: number) => (
                      <Tag key={i} color="orange" style={{ fontFamily: 'inherit' }}>
                        {w}
                      </Tag>
                    ))}
                  </div>
                )}
              </div>
            }
            showIcon
            style={{ fontFamily: 'inherit' }}
          />
        )}

        {/* Compilation log (for LaTeX) */}
        {result?.compile_log && (
          <div>
            <Text style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
              Compilation Log:
            </Text>
            <pre
              style={{
                background: 'var(--bg-dark)',
                color: 'var(--text-secondary)',
                padding: 12,
                borderRadius: 8,
                fontSize: 10,
                maxHeight: 150,
                overflow: 'auto',
                fontFamily: 'inherit',
              }}
            >
              {result.compile_log.slice(-2000)}
            </pre>
          </div>
        )}
      </Space>
    </Modal>
  );
}
