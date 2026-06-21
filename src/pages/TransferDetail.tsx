import { useEffect, useState } from 'react';
import {
  Card, Descriptions, Button, Space, Typography, Tag, Spin, Empty, Steps, Alert, message, Row, Col, Statistic,
} from 'antd';
import {
  ArrowLeftOutlined, CarOutlined, ThunderboltOutlined, CheckCircleOutlined, ForwardOutlined, FormOutlined, HomeOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import { useAuthStore } from '@/store/auth';
import StatusTag from '@/components/StatusTag';
import { transferStatusLabel, formatDateTime } from '@/utils/labels';
import type { Transfer, TransferStatus } from '@/types';

const stepOrder: TransferStatus[] = ['dispatched', 'in_transit', 'arrived', 'received', 'closed'];
const stepLabels = ['已派车', '转运中', '已到达', '已接收', '已闭环'];

export default function TransferDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [transfer, setTransfer] = useState<Transfer | null>(null);
  const [advancing, setAdvancing] = useState(false);

  useEffect(() => {
    void load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      setTransfer(await api.getTransfer(id));
    } finally {
      setLoading(false);
    }
  };

  const advance = async (status: TransferStatus) => {
    setAdvancing(true);
    try {
      const t = await api.updateTransferStatus(id, status);
      setTransfer(t);
      message.success(`状态已更新为：${transferStatusLabel[status]}`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '更新失败');
    } finally {
      setAdvancing(false);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!transfer) return <Empty description="转运单不存在" />;

  const canOperate = user?.role === 'coordinator' || user?.role === 'admin';
  const currentStep = stepOrder.indexOf(transfer.status);
  const nextStatus: TransferStatus | null = currentStep >= 0 && currentStep < stepOrder.length - 1
    ? stepOrder[currentStep + 1]
    : null;

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/transfers')}>返回</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>转运单详情</Typography.Title>
        <StatusTag status={transfer.status} label={transferStatusLabel[transfer.status]} />
        {transfer.greenChannel && transfer.status !== 'closed' && <Tag color="error" icon={<ThunderboltOutlined />}>绿色通道</Tag>}
      </Space>

      {transfer.greenChannel && transfer.status !== 'closed' && (
        <Alert type="error" banner showIcon icon={<ThunderboltOutlined />} message="绿色通道病例，请优先推进转运流程。" />
      )}

      <Card>
        <Steps
          current={currentStep}
          status={transfer.status === 'closed' ? 'finish' : 'process'}
          items={stepLabels.map((label, idx) => ({
            title: label,
            icon: idx === 0 ? <CarOutlined /> : idx === 3 ? <HomeOutlined /> : idx === 4 ? <CheckCircleOutlined /> : undefined,
          }))}
        />
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title="转运信息">
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="患者">{transfer.patientName}</Descriptions.Item>
              <Descriptions.Item label="协调员">{transfer.coordinatorName}</Descriptions.Item>
              <Descriptions.Item label="救护车">
                {transfer.ambulancePlate ? <Tag icon={<CarOutlined />}>{transfer.ambulancePlate}</Tag> : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="接收床位">
                {transfer.bedNumber ? `${transfer.bedNumber}（${transfer.department}）` : '—'}
              </Descriptions.Item>
              <Descriptions.Item label="出发时间">{formatDateTime(transfer.departureTime)}</Descriptions.Item>
              <Descriptions.Item label="到达时间">{formatDateTime(transfer.arrivalTime)}</Descriptions.Item>
              <Descriptions.Item label="创建时间" span={2}>{formatDateTime(transfer.createdAt)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={10}>
          <Card title="流程操作">
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="当前状态" value={transferStatusLabel[transfer.status]} valueStyle={{ fontSize: 16, color: '#0E7C7B' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="下一步" value={nextStatus ? transferStatusLabel[nextStatus] : '—'} valueStyle={{ fontSize: 16 }} />
                </Col>
                <Col span={8}>
                  <Statistic title="通道" value={transfer.greenChannel ? '绿色' : '普通'} valueStyle={{ fontSize: 16, color: transfer.greenChannel ? '#E5484D' : '#6b7280' }} />
                </Col>
              </Row>

              {canOperate && nextStatus && transfer.status !== 'received' && (
                <Button
                  type="primary"
                  size="large"
                  block
                  icon={<ForwardOutlined />}
                  loading={advancing}
                  onClick={() => advance(nextStatus)}
                >
                  推进至：{transferStatusLabel[nextStatus]}
                </Button>
              )}

              {transfer.status === 'received' && (
                <Alert type="success" showIcon message="患者已接收，可回填接诊结果关闭闭环。" />
              )}

              {(transfer.status === 'received' || transfer.status === 'closed') && (
                <Button
                  type={transfer.status === 'closed' ? 'default' : 'primary'}
                  size="large"
                  block
                  icon={<FormOutlined />}
                  onClick={() => navigate(`/admissions/${transfer.id}`)}
                >
                  {transfer.status === 'closed' ? '查看接诊结果' : '回填接诊结果'}
                </Button>
              )}

              {transfer.status === 'closed' && (
                <Alert type="info" showIcon icon={<CheckCircleOutlined />} message="转诊闭环已完成。" />
              )}
            </Space>
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
