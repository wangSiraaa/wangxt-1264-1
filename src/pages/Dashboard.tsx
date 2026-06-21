import { useEffect, useState } from 'react';
import { Card, Col, Row, Table, Typography, Button, Empty, Spin, Alert, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  MessageOutlined,
  EyeOutlined,
  CarOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  HomeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { api } from '@/api';
import { useAuthStore } from '@/store/auth';
import StatCard from '@/components/StatCard';
import StatusTag from '@/components/StatusTag';
import { recordStatusLabel, transferStatusLabel, consultStatusLabel, formatDateTime } from '@/utils/labels';
import type { Consultation, MedicalRecord, Transfer } from '@/types';

export default function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ pendingConsult: 0, consulting: 0, inTransit: 0, greenChannelActive: 0, completedToday: 0, availableBeds: 0 });
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [consults, setConsults] = useState<Consultation[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);

  useEffect(() => {
    void load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [s, recs] = await Promise.all([api.dashboardStats(), api.listRecords({})]);
      setStats(s);
      setRecords(recs.slice(0, 8));
      if (user?.role === 'expert' || user?.role === 'admin') {
        const cs = await api.listConsultations({ status: 'pending' });
        setConsults(cs.slice(0, 8));
      }
      if (user?.role === 'coordinator' || user?.role === 'admin') {
        const ts = await api.listTransfers({});
        setTransfers(ts.filter((t) => t.status !== 'closed').slice(0, 8));
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;

  const greenChannelRecords = records.filter((r) => r.greenChannel && r.status !== 'closed');

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Typography.Title level={4} style={{ marginBottom: 4 }}>
          {user?.name}，欢迎回来
        </Typography.Title>
        <Typography.Text type="secondary">{user?.orgName} · 当前角色工作台</Typography.Text>
      </div>

      {greenChannelRecords.length > 0 && (
        <Alert
          type="error"
          banner
          showIcon
          icon={<ThunderboltOutlined />}
          message={
            <Space>
              <strong>绿色通道告警：</strong>
              <span>当前有 {greenChannelRecords.length} 例危急值病例待优先处置</span>
              <Button size="small" type="primary" danger onClick={() => navigate('/green-channel')}>
                立即处置
              </Button>
            </Space>
          }
        />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={12} md={8} xl={4}>
          <StatCard title="待会诊" value={stats.pendingConsult} icon={<MessageOutlined />} color="#F5A623" />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <StatCard title="会诊中" value={stats.consulting} icon={<EyeOutlined />} color="#0E7C7B" />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <StatCard title="转运在途" value={stats.inTransit} icon={<CarOutlined />} color="#0969DA" />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <StatCard title="绿色通道" value={stats.greenChannelActive} icon={<ThunderboltOutlined />} color="#E5484D" />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <StatCard title="今日闭环" value={stats.completedToday} icon={<CheckCircleOutlined />} color="#30A46C" />
        </Col>
        <Col xs={12} md={8} xl={4}>
          <StatCard title="可用床位" value={stats.availableBeds} icon={<HomeOutlined />} color="#2BB3A3" suffix="张" />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        {(user?.role === 'expert' || user?.role === 'admin') && (
          <Col xs={24} lg={12}>
            <Card
              title="待处理会诊"
              extra={<Button type="link" onClick={() => navigate('/consultations')}>全部</Button>}
              styles={{ body: { padding: 0 } }}
            >
              {consults.length === 0 ? (
                <Empty style={{ padding: 32 }} description="暂无待会诊任务" />
              ) : (
                <Table
                  size="middle"
                  rowKey="id"
                  pagination={false}
                  dataSource={consults}
                  onRow={(r) => ({ onClick: () => navigate(`/consultations/${r.id}`), style: { cursor: 'pointer' } })}
                  columns={[
                    { title: '病历', dataIndex: 'recordId', render: (v) => v.slice(0, 8) },
                    { title: '状态', dataIndex: 'status', render: (v) => <StatusTag status={v} label={consultStatusLabel[v]} /> },
                    { title: '发起时间', dataIndex: 'createdAt', render: formatDateTime },
                  ]}
                />
              )}
            </Card>
          </Col>
        )}

        {(user?.role === 'coordinator' || user?.role === 'admin') && (
          <Col xs={24} lg={12}>
            <Card
              title="转运待办"
              extra={<Button type="link" onClick={() => navigate('/transfers')}>全部</Button>}
              styles={{ body: { padding: 0 } }}
            >
              {transfers.length === 0 ? (
                <Empty style={{ padding: 32 }} description="暂无转运任务" />
              ) : (
                <Table
                  size="middle"
                  rowKey="id"
                  pagination={false}
                  dataSource={transfers}
                  onRow={(r) => ({ onClick: () => navigate(`/transfers/${r.id}`), style: { cursor: 'pointer' } })}
                  columns={[
                    { title: '患者', dataIndex: 'patientName' },
                    { title: '状态', dataIndex: 'status', render: (v) => <StatusTag status={v} label={transferStatusLabel[v]} /> },
                    { title: '床位', dataIndex: 'bedNumber' },
                  ]}
                />
              )}
            </Card>
          </Col>
        )}

        <Col xs={24} lg={(user?.role === 'doctor') ? 24 : 12}>
          <Card
            title="最近病历"
            extra={
              <Space>
                {user?.role === 'doctor' && (
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/records/new')}>
                    新建病历
                  </Button>
                )}
                <Button type="link" onClick={() => navigate('/records')}>全部</Button>
              </Space>
            }
            styles={{ body: { padding: 0 } }}
          >
            <Table
              size="middle"
              rowKey="id"
              pagination={false}
              dataSource={records}
              onRow={(r) => ({ onClick: () => navigate(`/records/${r.id}`), style: { cursor: 'pointer' } })}
              columns={[
                { title: '患者', dataIndex: 'patientName' },
                { title: '年龄', dataIndex: 'patientAge', width: 60 },
                { title: '主诉', dataIndex: 'chiefComplaint', ellipsis: true },
                {
                  title: '危急值', dataIndex: 'isCritical', width: 80,
                  render: (v: boolean) => (v ? <StatusTag status="occupied" label="危急" /> : '—'),
                },
                { title: '状态', dataIndex: 'status', width: 90, render: (v) => <StatusTag status={v} label={recordStatusLabel[v]} /> },
              ]}
            />
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
