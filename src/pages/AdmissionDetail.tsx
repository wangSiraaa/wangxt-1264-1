import { useEffect, useState } from 'react';
import {
  Card, Descriptions, Button, Space, Typography, Form, Input, Select, Spin, Empty, Alert, message, Tag, Result,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import { useAuthStore } from '@/store/auth';
import StatusTag from '@/components/StatusTag';
import { transferStatusLabel, outcomeLabel, formatDateTime } from '@/utils/labels';
import type { AdmissionResult, Transfer } from '@/types';

interface FormValues {
  admissionDiagnosis: string;
  treatment?: string;
  outcome: string;
}

export default function AdmissionDetail() {
  const { transferId = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [existing, setExisting] = useState<AdmissionResult | null>(null);
  const [form] = Form.useForm<FormValues>();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void load();
  }, [transferId]);

  const load = async () => {
    setLoading(true);
    try {
      const t = await api.getTransfer(transferId);
      setTransfer(t);
      const all = (await api.listAdmissions()) as AdmissionResult[];
      setExisting(all.find((a) => a.transferId === transferId) ?? null);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await api.createAdmission(
        { transferId, admissionDiagnosis: values.admissionDiagnosis, treatment: values.treatment, outcome: values.outcome as AdmissionResult['outcome'] },
        user!,
      );
      message.success('接诊结果已回填，转诊闭环已完成');
      navigate('/admissions');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '回填失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!transfer) return <Empty description="转运单不存在" />;

  const canBackfill = transfer.status === 'received';

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/admissions')}>返回</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>接诊结果回填</Typography.Title>
        <StatusTag status={transfer.status} label={transferStatusLabel[transfer.status]} />
      </Space>

      {!canBackfill && !existing && (
        <Alert
          type="warning"
          showIcon
          message="该转运单尚未确认接收，无法回填接诊结果"
          description={'请先在转运详情中将状态推进至「已接收」，再回填接诊结果以关闭转诊闭环。'}
          action={<Button size="small" onClick={() => navigate(`/transfers/${transfer.id}`)}>前往转运详情</Button>}
        />
      )}

      <Card title="转运信息">
        <Descriptions column={2} bordered size="small">
          <Descriptions.Item label="患者">{transfer.patientName}</Descriptions.Item>
          <Descriptions.Item label="协调员">{transfer.coordinatorName}</Descriptions.Item>
          <Descriptions.Item label="救护车">{transfer.ambulancePlate ?? '—'}</Descriptions.Item>
          <Descriptions.Item label="接收床位">{transfer.bedNumber ? `${transfer.bedNumber}（${transfer.department}）` : '—'}</Descriptions.Item>
          <Descriptions.Item label="出发时间">{formatDateTime(transfer.departureTime)}</Descriptions.Item>
          <Descriptions.Item label="到达时间">{formatDateTime(transfer.arrivalTime)}</Descriptions.Item>
        </Descriptions>
      </Card>

      {existing ? (
        <Card title="接诊结果（已回填）">
          <Result
            icon={<CheckCircleOutlined style={{ color: '#30A46C' }} />}
            status="success"
            title="转诊闭环已完成"
            extra={
              <Descriptions column={1} bordered size="small" style={{ maxWidth: 600, margin: '0 auto' }}>
                <Descriptions.Item label="接诊诊断">{existing.admissionDiagnosis}</Descriptions.Item>
                <Descriptions.Item label="处置">{existing.treatment || '—'}</Descriptions.Item>
                <Descriptions.Item label="结局"><Tag>{outcomeLabel[existing.outcome]}</Tag></Descriptions.Item>
                <Descriptions.Item label="接收人">{existing.receivedByName}</Descriptions.Item>
                <Descriptions.Item label="回填时间">{formatDateTime(existing.receivedAt)}</Descriptions.Item>
              </Descriptions>
            }
          />
        </Card>
      ) : canBackfill ? (
        <Card title="填写接诊结果">
          <Form form={form} layout="vertical" onFinish={onSubmit} style={{ maxWidth: 640 }}>
            <Alert type="info" showIcon style={{ marginBottom: 16 }} message="回填后将关闭该转诊闭环，并释放床位占用（转为清洁中）。" />
            <Form.Item name="admissionDiagnosis" label="接诊诊断" rules={[{ required: true, message: '请输入接诊诊断' }]}>
              <Input placeholder="例：急性ST段抬高型心肌梗死" />
            </Form.Item>
            <Form.Item name="treatment" label="处置经过">
              <Input.TextArea rows={3} placeholder="急诊PCI、溶栓、药物保守治疗等" />
            </Form.Item>
            <Form.Item name="outcome" label="结局" rules={[{ required: true, message: '请选择结局' }]}>
              <Select
                placeholder="请选择"
                options={Object.entries(outcomeLabel).map(([value, label]) => ({ value, label }))}
              />
            </Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={submitting} icon={<SaveOutlined />}>
                提交回填，关闭闭环
              </Button>
              <Button onClick={() => navigate('/admissions')}>取消</Button>
            </Space>
          </Form>
        </Card>
      ) : null}
    </Space>
  );
}
