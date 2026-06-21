import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Segmented, Typography, Tag, Spin } from 'antd';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import StatusTag from '@/components/StatusTag';
import { consultStatusLabel, formatDateTime } from '@/utils/labels';
import type { Consultation } from '@/types';

export default function Consultations() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [consults, setConsults] = useState<Consultation[]>([]);
  const [filter, setFilter] = useState<string>('pending');

  useEffect(() => {
    void load();
  }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const params: { status?: 'pending' | 'completed' } = {};
      if (filter !== 'all') params.status = filter as 'pending' | 'completed';
      setConsults(await api.listConsultations(params));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>会诊管理</Typography.Title>
      <Card styles={{ body: { padding: 16 } }}>
        <Space style={{ marginBottom: 12 }}>
          <Segmented
            options={[
              { label: '待处理', value: 'pending' },
              { label: '已完成', value: 'completed' },
              { label: '全部', value: 'all' },
            ]}
            value={filter}
            onChange={(v) => setFilter(v as string)}
          />
        </Space>
        <Spin spinning={loading}>
          <Table
            rowKey="id"
            dataSource={consults}
            onRow={(r) => ({ onClick: () => navigate(`/consultations/${r.id}`), style: { cursor: 'pointer' } })}
            columns={[
              { title: '会诊编号', dataIndex: 'id', width: 120, render: (v) => v.slice(0, 10) },
              { title: '病历', dataIndex: 'recordId', width: 120, render: (v) => v.slice(0, 10) },
              { title: '会诊专家', dataIndex: 'expertName', render: (v) => v || <Tag>待分配</Tag> },
              { title: '诊断', dataIndex: 'diagnosis', ellipsis: true, render: (v) => v || '—' },
              { title: '危急值', dataIndex: 'isCritical', width: 80, render: (v: boolean) => (v ? <Tag color="error">危急</Tag> : '—') },
              { title: '状态', dataIndex: 'status', width: 90, render: (v) => <StatusTag status={v} label={consultStatusLabel[v]} /> },
              { title: '发起时间', dataIndex: 'createdAt', width: 150, render: formatDateTime },
            ]}
          />
        </Spin>
      </Card>
    </Space>
  );
}
