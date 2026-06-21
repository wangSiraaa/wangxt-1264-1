import { useEffect, useState } from 'react';
import { Card, Table, Button, Space, Segmented, Typography, Tag, Input, Spin } from 'antd';
import { PlusOutlined, SearchOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useAuthStore } from '@/store/auth';
import StatusTag from '@/components/StatusTag';
import { recordStatusLabel, formatDateTime } from '@/utils/labels';
import type { MedicalRecord, RecordStatus } from '@/types';

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '草稿', value: 'draft' },
  { label: '待会诊', value: 'pending_consult' },
  { label: '会诊中', value: 'consulting' },
  { label: '转运中', value: 'transferring' },
  { label: '已接收', value: 'received' },
  { label: '已闭环', value: 'closed' },
];

export default function Records() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [keyword, setKeyword] = useState('');

  useEffect(() => {
    void load();
  }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const params: { status?: RecordStatus } = {};
      if (filter !== 'all') params.status = filter as RecordStatus;
      const list = await api.listRecords(params);
      const filtered = keyword
        ? list.filter((r) => r.patientName.includes(keyword) || r.chiefComplaint.includes(keyword))
        : list;
      setRecords(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [keyword]);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>病历管理</Typography.Title>
        {user?.role === 'doctor' && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/records/new')}>
            新建病历
          </Button>
        )}
      </div>

      <Card styles={{ body: { padding: 16 } }}>
        <Space style={{ marginBottom: 12 }} wrap>
          <Segmented options={statusOptions} value={filter} onChange={(v) => setFilter(v as string)} />
          <Input
            allowClear
            prefix={<SearchOutlined />}
            placeholder="搜索患者姓名 / 主诉"
            style={{ width: 240 }}
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
        </Space>
        <Spin spinning={loading}>
          <Table
            rowKey="id"
            dataSource={records}
            onRow={(r) => ({ onClick: () => navigate(`/records/${r.id}`), style: { cursor: 'pointer' } })}
            columns={[
              {
                title: '患者', dataIndex: 'patientName', width: 100,
                render: (v, r) => (
                  <Space>
                    <span style={{ fontWeight: 500 }}>{v}</span>
                    {r.greenChannel && r.status !== 'closed' && (
                      <Tag icon={<ThunderboltOutlined />} color="error" style={{ margin: 0 }}>绿色通道</Tag>
                    )}
                  </Space>
                ),
              },
              { title: '年龄', dataIndex: 'patientAge', width: 60 },
              { title: '性别', dataIndex: 'patientGender', width: 60 },
              { title: '主诉', dataIndex: 'chiefComplaint', ellipsis: true },
              { title: '影像', dataIndex: 'imagingComplete', width: 80, render: (v: boolean) => (v ? <Tag color="success">已传</Tag> : <Tag color="warning">缺失</Tag>) },
              { title: '危急值', dataIndex: 'isCritical', width: 80, render: (v: boolean) => (v ? <StatusTag status="occupied" label="危急" /> : '—') },
              { title: '状态', dataIndex: 'status', width: 90, render: (v) => <StatusTag status={v} label={recordStatusLabel[v]} /> },
              { title: '创建时间', dataIndex: 'createdAt', width: 150, render: formatDateTime },
            ]}
          />
        </Spin>
      </Card>
    </Space>
  );
}
