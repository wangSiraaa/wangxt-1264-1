import { useState } from 'react';
import { Card, Form, Input, InputNumber, Select, Switch, Button, Space, Typography, Row, Col, Alert, message, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { api } from '@/api';
import { useAuthStore } from '@/store/auth';

interface FormValues {
  patientName: string;
  patientAge: number;
  patientGender: string;
  patientPhone?: string;
  chiefComplaint: string;
  presentIllness?: string;
  pastHistory?: string;
  temperature?: number;
  heartRate?: number;
  systolicBP?: number;
  diastolicBP?: number;
  spo2?: number;
  isCritical: boolean;
}

export default function RecordNew() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  const onFinish = async (values: FormValues) => {
    setLoading(true);
    try {
      const rec = await api.createRecord(values, user!);
      message.success('病历创建成功，请继续上传影像资料');
      navigate(`/records/${rec.id}`);
    } catch (e) {
      message.error(e instanceof Error ? e.message : '创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Space>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/records')}>返回</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>新建病历</Typography.Title>
      </Space>

      {isCritical && (
        <Alert
          type="error"
          showIcon
          message="已标记为危急值病例"
          description="危急值病历在专家确认后将自动进入绿色通道，协调员将优先调度救护车与床位。"
        />
      )}

      <Card>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ patientGender: '男', isCritical: false }}
          style={{ maxWidth: 860 }}
        >
          <Typography.Title level={5}>患者信息</Typography.Title>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="patientName" label="姓名" rules={[{ required: true, message: '请输入患者姓名' }]}>
                <Input placeholder="请输入" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="patientAge" label="年龄" rules={[{ required: true, message: '请输入年龄' }]}>
                <InputNumber min={0} max={150} style={{ width: '100%' }} placeholder="岁" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="patientGender" label="性别" rules={[{ required: true }]}>
                <Select options={[{ value: '男' }, { value: '女' }]} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="patientPhone" label="联系电话">
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
          </Row>

          <Typography.Title level={5}>病情描述</Typography.Title>
          <Form.Item name="chiefComplaint" label="主诉" rules={[{ required: true, message: '请输入主诉' }]}>
            <Input.TextArea rows={2} placeholder="例：突发胸痛3小时，伴大汗、气促" />
          </Form.Item>
          <Form.Item name="presentIllness" label="现病史">
            <Input.TextArea rows={2} placeholder="起病经过、主要症状特点、诊治情况等" />
          </Form.Item>
          <Form.Item name="pastHistory" label="既往史">
            <Input.TextArea rows={2} placeholder="高血压病史、糖尿病史、手术史、用药情况等" />
          </Form.Item>

          <Divider />
          <Typography.Title level={5}>生命体征</Typography.Title>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="temperature" label="体温 (℃)">
                <InputNumber min={30} max={45} step={0.1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="heartRate" label="心率 (次/分)">
                <InputNumber min={0} max={250} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item name="systolicBP" label="收缩压">
                <InputNumber min={40} max={260} style={{ width: '100%' }} placeholder="mmHg" />
              </Form.Item>
            </Col>
            <Col span={3}>
              <Form.Item name="diastolicBP" label="舒张压">
                <InputNumber min={20} max={180} style={{ width: '100%' }} placeholder="mmHg" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="spo2" label="血氧 (%)">
                <InputNumber min={0} max={100} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Divider />
          <Form.Item name="isCritical" label="危急值标记" valuePropName="checked">
            <Switch
              checkedChildren="危急值"
              unCheckedChildren="普通"
              onChange={(v) => setIsCritical(v)}
            />
          </Form.Item>

          <Space>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              保存病历
            </Button>
            <Button onClick={() => navigate('/records')}>取消</Button>
          </Space>
        </Form>
      </Card>
    </Space>
  );
}
