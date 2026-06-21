import { useEffect, useState } from 'react';
import { Card, Row, Col, Typography, Space, Button, Empty, Spin, Tag, Statistic, Alert, message } from 'antd';
import { ThunderboltOutlined, CarOutlined, MessageOutlined, FileTextOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useAuthStore } from '@/store/auth';
import StatusTag from '@/components/StatusTag';
import { recordStatusLabel, formatDateTime } from '@/utils/labels';
import type { MedicalRecord } from '@/types';

export default function GreenChannel() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MedicalRecord[]>([]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      setRecords(await api.listGreenChannel());
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <ThunderboltOutlined style={{ color: '#E5484D', fontSize: 28 }} />
          <Typography.Title level={4} style={{ margin: 0, color: '#E5484D' }}>绿色通道</Typography.Title>
        </Space>
        <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
      </div>

      <Alert
        type="error"
        showIcon
        banner
        icon={<ThunderboltOutlined />}
        message="危急值病例优先处置通道"
        description="专家会诊标记为危急值的病例将自动进入绿色通道，协调员需优先调度救护车与接收床位，缩短危重患者救治时间。"
      />

      <Row gutter={[16, 16]}>
        <Col xs={12} md={6}><Card bordered={false}><Statistic title="通道病例" value={records.length} valueStyle={{ color: '#E5484D' }} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false}><Statistic title="待会诊" value={records.filter((r) => r.status === 'pending_consult').length} valueStyle={{ color: '#F5A623' }} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false}><Statistic title="会诊中" value={records.filter((r) => r.status === 'consulting').length} valueStyle={{ color: '#0E7C7B' }} /></Card></Col>
        <Col xs={12} md={6}><Card bordered={false}><Statistic title="转运中" value={records.filter((r) => r.status === 'transferring').length} valueStyle={{ color: '#0969DA' }} /></Card></Col>
      </Row>

      <Spin spinning={loading}>
        {records.length === 0 ? (
          <Card>
            <Empty description="当前无绿色通道病例" />
          </Card>
        ) : (
          <Row gutter={[16, 16]}>
            {records.map((r) => (
              <Col key={r.id} xs={24} md={12} xl={8}>
                <Card
                  hoverable
                  style={{ borderLeft: `4px solid #E5484D` }}
                  onClick={() => navigate(`/records/${r.id}`)}
                  title={
                    <Space>
                      <Tag color="error" icon={<ThunderboltOutlined />}>危急值</Tag>
                      <span style={{ fontWeight: 600 }}>{r.patientName}</span>
                      <span style={{ color: '#6b7280', fontSize: 12 }}>{r.patientAge}岁 / {r.patientGender}</span>
                    </Space>
                  }
                  extra={<StatusTag status={r.status} label={recordStatusLabel[r.status]} />}
                >
                  <Space direction="vertical" size="small" style={{ width: '100%' }}>
                    <Typography.Text ellipsis type="secondary">主诉：{r.chiefComplaint}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>录入：{r.doctorName} · {formatDateTime(r.createdAt)}</Typography.Text>
                    <Space style={{ marginTop: 8 }}>
                      <Button size="small" icon={<FileTextOutlined />} onClick={(e) => { e.stopPropagation(); navigate(`/records/${r.id}`); }}>病历</Button>
                      {r.status === 'pending_consult' && (
                        <Button size="small" type="primary" icon={<MessageOutlined />} onClick={(e) => { e.stopPropagation(); navigate('/consultations'); }}>去会诊</Button>
                      )}
                      {(r.status === 'consulting' || r.status === 'pending_consult') && (user?.role === 'coordinator' || user?.role === 'admin') && (
                        <Button size="small" type="primary" danger icon={<CarOutlined />} onClick={(e) => { e.stopPropagation(); navigate('/transfers'); }}>优先转运</Button>
                      )}
                    </Space>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        )}
      </Spin>
    </Space>
  );
}
