import { useMemo } from 'react';
import { Layout, Menu, Avatar, Dropdown, Space, Typography, Tag } from 'antd';
import {
  DashboardOutlined,
  FileTextOutlined,
  PictureOutlined,
  MessageOutlined,
  CarOutlined,
  HomeOutlined,
  ThunderboltOutlined,
  FormOutlined,
  UserOutlined,
  LogoutOutlined,
  HeartOutlined,
} from '@ant-design/icons';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/auth';
import { roleLabel } from '@/utils/labels';
import type { UserRole } from '@/types';

const { Header, Sider, Content } = Layout;

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  roles: UserRole[];
}

const allMenuItems: MenuItem[] = [
  { key: '/', label: '工作台', icon: <DashboardOutlined />, roles: ['doctor', 'expert', 'coordinator', 'admin'] },
  { key: '/records', label: '病历管理', icon: <FileTextOutlined />, roles: ['doctor', 'admin'] },
  { key: '/consultations', label: '会诊管理', icon: <MessageOutlined />, roles: ['expert', 'admin'] },
  { key: '/transfers', label: '转运管理', icon: <CarOutlined />, roles: ['coordinator', 'admin'] },
  { key: '/beds', label: '床位看板', icon: <HomeOutlined />, roles: ['coordinator', 'admin'] },
  { key: '/green-channel', label: '绿色通道', icon: <ThunderboltOutlined />, roles: ['doctor', 'expert', 'coordinator', 'admin'] },
  { key: '/admissions', label: '接诊结果', icon: <FormOutlined />, roles: ['doctor', 'expert', 'admin'] },
];

export default function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const items = useMemo(() => {
    if (!user) return [];
    return allMenuItems.filter((item) => item.roles.includes(user.role)).map((item) => ({
      key: item.key,
      icon: item.icon,
      label: item.label,
    }));
  }, [user]);

  const selectedKey = useMemo(() => {
    const path = location.pathname;
    const match = allMenuItems
      .filter((i) => path.startsWith(i.key) && i.key !== '/')
      .sort((a, b) => b.key.length - a.key.length)[0];
    return match?.key ?? '/';
  }, [location.pathname]);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider width={224} breakpoint="lg" collapsedWidth={0} theme="dark">
        <div style={{ height: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <HeartOutlined style={{ color: '#2BB3A3', fontSize: 22 }} />
          <Typography.Title level={4} style={{ color: '#fff', margin: 0, fontFamily: '"Noto Serif SC", serif' }}>
            山区远程会诊
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #eef0f2' }}>
          <Space>
            <Tag color={user.role === 'coordinator' ? 'processing' : user.role === 'expert' ? 'success' : user.role === 'admin' ? 'gold' : 'default'}>
              {roleLabel[user.role]}
            </Tag>
            <Typography.Text type="secondary">{user.orgName}</Typography.Text>
          </Space>
          <Dropdown menu={{ items: [{ key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: handleLogout }] }}>
            <Space style={{ cursor: 'pointer' }}>
              <Avatar icon={<UserOutlined />} style={{ backgroundColor: '#0E7C7B' }} />
              <Typography.Text>{user.name}</Typography.Text>
            </Space>
          </Dropdown>
        </Header>
        <Content style={{ margin: 16, padding: 24, background: '#fff', borderRadius: 12, minHeight: 'calc(100vh - 92px)' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
