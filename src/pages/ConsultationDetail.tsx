import { useEffect, useState } from 'react';
import {
  Card, Row, Col, Descriptions, Button, Space, Typography, List, Tag, Form, Input, Switch, Spin, Empty, Alert, message, Divider,
} from 'antd';
import { ArrowLeftOutlined, CheckOutlined, FileImageOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '@/api';
import { useAuthStore } from '@/store/auth';
import StatusTag from '@/components/StatusTag';
import { consultStatusLabel, recordStatusLabel, imagingTypeLabel, formatDateTime } from '@/utils/labels';
import type { Consultation, ImagingIndex, MedicalRecord } from '@/types';

interface FormValues {
  opinion: string;
  diagnosis: string;
  recommendation: string;
  isCritical: boolean;
}

export default function ConsultationDetail() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [consult, setConsult] = useState<Consultation | null>(null);
  const [record, setRecord] = useState<MedicalRecord | null>(null);
  const [images, setImages] = useState<ImagingIndex[]>([]);
  const [form] = Form.useForm<FormValues>();
  const [isCritical, setIsCritical] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    void load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    try {
      const con = await api.getConsultation(id);
      setConsult(con);
      const [rec, imgs] = await Promise.all([api.getRecord(con.recordId), api.listImages(con.recordId)]);
      setRecord(rec);
      setImages(imgs);
    } finally {
      setLoading(false);
    }
  };

  const onComplete = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await api.completeConsultation(id, values, user!);
      message.success(values.isCritical ? '会诊意见已提交，病例已自动纳入绿色通道' : '会诊意见已提交');
      navigate('/consultations');
    } catch (e) {
      message.error(e instanceof Error ? e.message : '提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Spin style={{ display: 'block', margin: '80px auto' }} />;
  if (!consult || !record) return <Empty description="会诊不存在" />;

  const isExpert = user?.role === 'expert' || user?.role === 'admin';
  const completed = consult.status === 'completed';

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/consultations')}>返回</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>会诊详情</Typography.Title>
        <StatusTag status={consult.status} label={consultStatusLabel[consult.status]} />
        {consult.isCritical && <Tag color="error" icon={<ThunderboltOutlined />}>危急值</Tag>}
      </Space>

      {isExpert && !completed && (
        <Alert type="info" showIcon message="请仔细查看病历与影像资料后填写会诊意见。若标记为危急值，系统将自动将该病例纳入绿色通道。" />
      )}

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={13}>
          <Card title={`病历：${record.patientName}`} extra={<StatusTag status={record.status} label={recordStatusLabel[record.status]} />}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label="姓名">{record.patientName}</Descriptions.Item>
              <Descriptions.Item label="年龄/性别">{record.patientAge} / {record.patientGender}</Descriptions.Item>
              <Descriptions.Item label="体温">{record.temperature ?? '—'} ℃</Descriptions.Item>
              <Descriptions.Item label="心率">{record.heartRate ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="血压">{record.systolicBP && record.diastolicBP ? `${record.systolicBP}/${record.diastolicBP}` : '—'}</Descriptions.Item>
              <Descriptions.Item label="血氧">{record.spo2 ?? '—'} %</Descriptions.Item>
              <Descriptions.Item label="主诉" span={2}>{record.chiefComplaint}</Descriptions.Item>
              <Descriptions.Item label="现病史" span={2}>{record.presentIllness || '—'}</Descriptions.Item>
              <Descriptions.Item label="既往史" span={2}>{record.pastHistory || '—'}</Descriptions.Item>
            </Descriptions>

            <Divider orientation="left">影像资料</Divider>
            {images.length === 0 ? (
              <Empty description="无影像" />
            ) : (
              <List
                grid={{ gutter: 12, column: 2 }}
                dataSource={images}
                renderItem={(img) => (
                  <List.Item>
                    <Card size="small" hoverable>
                      <Space direction="vertical" size={4} style={{ width: '100%' }}>
                        <Tag color="default">{imagingTypeLabel[img.type]}</Tag>
                        <div style={{ height: 90, borderRadius: 8, background: 'linear-gradient(135deg,#0E7C7B22,#2BB3A322)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0E7C7B' }}>
                          <FileImageOutlined style={{ fontSize: 32 }} />
                        </div>
                        <Typography.Text ellipsis style={{ fontSize: 12 }}>{img.fileName}</Typography.Text>
                      </Space>
                    </Card>
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>

        <Col xs={24} lg={11}>
          <Card title="会诊意见">
            {completed ? (
              <Descriptions column={1} size="small" bordered>
                <Descriptions.Item label="会诊专家">{consult.expertName}</Descriptions.Item>
                <Descriptions.Item label="诊断">{consult.diagnosis}</Descriptions.Item>
                <Descriptions.Item label="会诊意见">{consult.opinion}</Descriptions.Item>
                <Descriptions.Item label="处置建议">{consult.recommendation}</Descriptions.Item>
                <Descriptions.Item label="危急值">{consult.isCritical ? '是（已入绿色通道）' : '否'}</Descriptions.Item>
                <Descriptions.Item label="完成时间">{formatDateTime(consult.completedAt)}</Descriptions.Item>
              </Descriptions>
            ) : isExpert ? (
              <Form form={form} layout="vertical" onFinish={onComplete} initialValues={{ isCritical: false }}>
                <Form.Item name="diagnosis" label="诊断" rules={[{ required: true, message: '请输入诊断' }]}>
                  <Input placeholder="例：急性心肌梗死" />
                </Form.Item>
                <Form.Item name="opinion" label="会诊意见" rules={[{ required: true, message: '请输入会诊意见' }]}>
                  <Input.TextArea rows={3} placeholder="结合病史与影像的判断与分析" />
                </Form.Item>
                <Form.Item name="recommendation" label="处置建议" rules={[{ required: true, message: '请输入处置建议' }]}>
                  <Input.TextArea rows={3} placeholder="转运、用药、术前准备等" />
                </Form.Item>
                <Form.Item name="isCritical" label="标记为危急值" valuePropName="checked">
                  <Switch
                    checkedChildren="危急值"
                    unCheckedChildren="普通"
                    onChange={(v) => setIsCritical(v)}
                  />
                </Form.Item>
                {isCritical && (
                  <Alert type="error" showIcon style={{ marginBottom: 12 }} message="提交后该病例将自动进入绿色通道并通知协调员优先调度。" />
                )}
                <Space>
                  <Button type="primary" htmlType="submit" loading={submitting} icon={<CheckOutlined />}>
                    提交会诊意见
                  </Button>
                  <Button onClick={() => navigate('/consultations')}>取消</Button>
                </Space>
              </Form>
            ) : (
              <Empty description="等待专家处理中" />
            )}
          </Card>
        </Col>
      </Row>
    </Space>
  );
}
