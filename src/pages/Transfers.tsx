import { useEffect, useState } from 'react';
import {
  Card, Table, Button, Space, Typography, Tag, Spin, Modal, Form, Select, message, Segmented, Empty,
} from 'antd';
import { PlusOutlined, ThunderboltOutlined, CarOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useAuthStore } from '@/store/auth';
import StatusTag from '@/components/StatusTag';
import { transferStatusLabel, formatDateTime } from '@/utils/labels';
import type { Ambulance, Bed, MedicalRecord, Transfer, TransferStatus } from '@/types';

const statusOptions = [
  { label: '全部', value: 'all' },
  { label: '待派车', value: 'pending_dispatch' },
  { label: '已派车', value: 'dispatched' },
  { label: '转运中', value: 'in_transit' },
  { label: '已到达', value: 'arrived' },
  { label: '已接收', value: 'received' },
  { label: '已闭环', value: 'closed' },
];

export default function Transfers() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [ambulances, setAmbulances] = useState<Ambulance[]>([]);
  const [beds, setBeds] = useState<Bed[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form] = Form.useForm<{ recordId: string; ambulanceId: string; bedId: string }>();

  useEffect(() => {
    void load();
  }, [filter]);

  const load = async () => {
    setLoading(true);
    try {
      const params: { status?: TransferStatus } = {};
      if (filter !== 'all') params.status = filter as TransferStatus;
      setTransfers(await api.listTransfers(params));
    } finally {
      setLoading(false);
    }
  };

  const openCreate = async () => {
    try {
      const [recs, ambs, bedList] = await Promise.all([
        api.listRecords({}),
        api.listAmbulances(),
        api.listBeds(),
      ]);
      const eligible = recs.filter((r) => r.status === 'pending_consult' || r.status === 'consulting' || r.status === 'transferring');
      setRecords(eligible);
      setAmbulances(ambs.filter((a) => a.status === 'idle'));
      setBeds(bedList.filter((b) => b.status === 'available'));
      setCreateOpen(true);
      form.resetFields();
    } catch (e) {
      message.error(e instanceof Error ? e.message : '加载失败');
    }
  };

  const onCreate = async (values: { recordId: string; ambulanceId: string; bedId: string }) => {
    setSubmitting(true);
    try {
      const t = await api.createTransfer(values, user!);
      message.success(`已为 ${t.patientName} 创建转运单`);
      setCreateOpen(false);
      navigate(`/transfers/${t.id}`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '创建失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Title level={4} style={{ margin: 0 }}>转运管理</Typography.Title>
        {(user?.role === 'coordinator' || user?.role === 'admin') && (
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建转运</Button>
        )}
      </div>

      <Card styles={{ body: { padding: 16 } }}>
        <Space style={{ marginBottom: 12 }}>
          <Segmented options={statusOptions} value={filter} onChange={(v) => setFilter(v as string)} />
        </Space>
        <Spin spinning={loading}>
          {transfers.length === 0 && !loading ? (
            <Empty description="暂无转运单，请新建转运" />
          ) : (
            <Table
              rowKey="id"
              dataSource={transfers}
              onRow={(r) => ({ onClick: () => navigate(`/transfers/${r.id}`), style: { cursor: 'pointer' } })}
              columns={[
                {
                  title: '患者', dataIndex: 'patientName', width: 100,
                  render: (v, r) => (
                    <Space>
                      <span style={{ fontWeight: 500 }}>{v}</span>
                      {r.greenChannel && r.status !== 'closed' && <Tag icon={<ThunderboltOutlined />} color="error" style={{ margin: 0 }}>绿通</Tag>}
                    </Space>
                  ),
                },
                { title: '救护车', dataIndex: 'ambulancePlate', width: 110, render: (v) => v ? <Tag icon={<CarOutlined />}>{v}</Tag> : '—' },
                { title: '接收床位', dataIndex: 'bedNumber', width: 110, render: (v, r) => v ? `${v}（${r.department}）` : '—' },
                { title: '协调员', dataIndex: 'coordinatorName', width: 100 },
                { title: '状态', dataIndex: 'status', width: 90, render: (v) => <StatusTag status={v} label={transferStatusLabel[v]} /> },
                { title: '出发时间', dataIndex: 'departureTime', width: 150, render: formatDateTime },
                { title: '到达时间', dataIndex: 'arrivalTime', width: 150, render: formatDateTime },
              ]}
            />
          )}
        </Spin>
      </Card>

      <Modal
        title="新建转运单"
        open={createOpen}
        onCancel={() => setCreateOpen(false)}
        onOk={() => form.submit()}
        confirmLoading={submitting}
        okText="创建转运"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" onFinish={onCreate} style={{ marginTop: 12 }}>
          <Form.Item name="recordId" label="选择病历" rules={[{ required: true, message: '请选择病历' }]}>
            <Select
              placeholder="选择已会诊的病历"
              options={records.map((r) => ({ value: r.id, label: `${r.patientName}（${r.chiefComplaint.slice(0, 14)}）${r.greenChannel ? ' ⚡绿通' : ''}` }))}
              notFoundContent="暂无可转运病历（需先完成会诊）"
            />
          </Form.Item>
          <Form.Item name="ambulanceId" label="选择救护车" rules={[{ required: true, message: '请选择救护车' }]}>
            <Select
              placeholder="选择待命救护车"
              options={ambulances.map((a) => ({ value: a.id, label: `${a.plateNumber} - ${a.driver}` }))}
              notFoundContent="暂无待命救护车"
            />
          </Form.Item>
          <Form.Item name="bedId" label="分配接收床位" rules={[{ required: true, message: '请选择床位' }]}>
            <Select
              placeholder="选择空闲床位"
              options={beds.map((b) => ({ value: b.id, label: `${b.bedNumber}（${b.department}）` }))}
              notFoundContent="暂无空闲床位"
            />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
