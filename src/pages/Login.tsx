import { useState } from 'react';
import { Card, Form, Input, Button, Typography, Alert, Space, Tag } from 'antd';
import { HeartOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { roleLabel } from '@/utils/labels';

const demoAccounts = [
  { username: 'doctor1', role: 'doctor', desc: '提交病历与影像' },
  { username: 'expert1', role: 'expert', desc: '出具会诊意见' },
  { username: 'coord1', role: 'coordinator', desc: '调度救护车床位' },
  { username: 'admin1', role: 'admin', desc: '全功能管理' },
];

export default function Login() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true);
    setError('');
    try {
      await login(values.username, values.password);
      navigate('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(circle at 20% 20%, #0E7C7B 0%, transparent 45%), radial-gradient(circle at 80% 70%, #2BB3A3 0%, transparent 40%), linear-gradient(135deg, #0A5453 0%, #06302F 100%)',
        padding: 24,
      }}
    >
      <div style={{ width: '100%', maxWidth: 880, display: 'flex', gap: 32, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
        <div style={{ flex: '1 1 320px', minWidth: 280, color: '#fff' }}>
          <Space direction="vertical" size="middle">
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <HeartOutlined style={{ fontSize: 28, color: '#2BB3A3' }} />
              </div>
              <Typography.Title level={2} style={{ color: '#fff', margin: 0, fontFamily: '"Noto Serif SC", serif' }}>
                山区远程会诊转诊
              </Typography.Title>
            </div>
            <Typography.Paragraph style={{ color: '#9FD3CF', fontSize: 16, lineHeight: 1.8 }}>
              打通"病历影像提交 → 专家远程会诊 → 救护车转运 → 床位接收 → 接诊结果回填"闭环链路，让偏远乡镇患者在数小时内获得县级专家会诊与转运接收。
            </Typography.Paragraph>
            <Space wrap>
              <Tag color="#0E7C7B" style={{ color: '#fff', border: 'none' }}>危急值绿色通道</Tag>
              <Tag color="#0E7C7B" style={{ color: '#fff', border: 'none' }}>影像校验</Tag>
              <Tag color="#0E7C7B" style={{ color: '#fff', border: 'none' }}>结果回填闭环</Tag>
            </Space>
          </Space>
        </div>

        <Card style={{ width: 380, borderRadius: 16, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }} bordered={false}>
          <Typography.Title level={3} style={{ marginBottom: 8, fontFamily: '"Noto Serif SC", serif' }}>
            账号登录
          </Typography.Title>
          <Typography.Text type="secondary">请选择角色身份进入系统</Typography.Text>
          <Form layout="vertical" onFinish={onFinish} style={{ marginTop: 20 }} initialValues={{ username: 'doctor1', password: '123456' }}>
            <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
              <Input size="large" prefix={<UserOutlined />} placeholder="用户名" />
            </Form.Item>
            <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
              <Input.Password size="large" prefix={<LockOutlined />} placeholder="密码" />
            </Form.Item>
            {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}
            <Button type="primary" htmlType="submit" size="large" block loading={loading}>
              登 录
            </Button>
          </Form>
          <div style={{ marginTop: 16, borderTop: '1px dashed #e5e7eb', paddingTop: 12 }}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>演示账号（密码均为 123456）：</Typography.Text>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {demoAccounts.map((a) => (
                <Space key={a.username} size="small">
                  <Tag color="default">{a.username}</Tag>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>{roleLabel[a.role]} · {a.desc}</Typography.Text>
                </Space>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
