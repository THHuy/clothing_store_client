import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Layout,
  Menu,
  Button,
  Avatar,
  Dropdown,
  Space,
  Badge,
  notification,
  Tooltip,
  Typography,
} from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  InboxOutlined,
  BarChartOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import { useAuth } from '../contexts/AuthContext';
import { getTokenExpirationInfo, shouldShowExpirationWarning, formatExpirationDate } from '../utils/authUtils';
import type { MenuProps } from 'antd';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

const AdminLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [sessionInfo, setSessionInfo] = useState(getTokenExpirationInfo());
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Debug log để kiểm tra user role
  console.log('🔍 AdminLayout Debug - Current user:', state.user);
  console.log('🔍 AdminLayout Debug - User role:', state.user?.role);
  console.log('🔍 AdminLayout Debug - Is admin check:', state.user?.role === 'ADMIN');

  // Update session info every minute
  useEffect(() => {
    const updateSessionInfo = () => {
      setSessionInfo(getTokenExpirationInfo());
    };

    const interval = setInterval(updateSessionInfo, 60000); // Every minute
    return () => clearInterval(interval);
  }, []);

  // Show expiration warning notification
  useEffect(() => {
    if (shouldShowExpirationWarning() && sessionInfo.isValid) {
      notification.warning({
        message: 'Phiên đăng nhập sắp hết hạn',
        description: `Phiên của bạn sẽ hết hạn sau ${sessionInfo.timeLeft}. Vui lòng đăng nhập lại để tiếp tục sử dụng.`,
        duration: 10,
        key: 'session-warning',
      });
    }
  }, [sessionInfo]);

  const SessionInfo: React.FC = () => {
    if (!sessionInfo.isValid || !sessionInfo.expiresAt || !sessionInfo.timeLeft) {
      return null;
    }

    return (
      <Tooltip 
        title={`Phiên hết hạn lúc: ${formatExpirationDate(sessionInfo.expiresAt)}`}
        placement="bottom"
      >
        <Space size="small" style={{ color: '#6E6E6E', fontSize: '12px' }}>
          <ClockCircleOutlined />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            Còn: {sessionInfo.timeLeft}
          </Text>
        </Space>
      </Tooltip>
    );
  };

  const menuItems: MenuProps['items'] = [
    {
      key: '/admin/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
    },
    {
      key: '/admin/products',
      icon: <ShoppingOutlined />,
      label: 'Quản lý sản phẩm',
    },
    {
      key: '/admin/inventory',
      icon: <InboxOutlined />,
      label: 'Quản lý kho',
    },
    {
      key: '/admin/reports',
      icon: <BarChartOutlined />,
      label: 'Báo cáo thống kê',
    },
    // Chỉ hiển thị menu quản lý tài khoản cho Admin
    ...(state.user?.role === 'ADMIN' ? [{
      key: '/admin/users',
      icon: <UserOutlined />,
      label: 'Quản lý tài khoản',
    }] : []),
  ];

  const handleMenuClick = ({ key }: { key: string }) => {
    navigate(key);
  };

  const handleLogout = () => {
    logout();
    notification.success({
      message: 'Đăng xuất thành công',
      description: 'Bạn đã đăng xuất khỏi hệ thống.',
    });
    navigate('/admin/login');
  };

  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Thông tin cá nhân',
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Cài đặt',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Đăng xuất',
      onClick: handleLogout,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        style={{
          background: '#FFFFFF',
          boxShadow: '2px 0 8px rgba(0,0,0,0.1)',
        }}
      >
        <div style={{ 
          height: '64px', 
          padding: '16px', 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          borderBottom: '1px solid #f0f0f0',
        }}>
          {!collapsed ? (
            <h2 style={{ 
              margin: 0, 
              color: '#D04925',
              fontSize: '18px',
              fontWeight: 'bold'
            }}>
              👔 Coflar Mania Admin
            </h2>
          ) : (
            <h2 style={{ 
              margin: 0, 
              color: '#D04925',
              fontSize: '18px'
            }}>
              👔
            </h2>
          )}
        </div>

        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          style={{ 
            borderRight: 0,
            backgroundColor: 'transparent',
          }}
        />
      </Sider>

      <Layout>
        <Header
          style={{
            padding: '0 16px',
            background: '#FFFFFF',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />

          <Space size="middle">
            <SessionInfo />
            
            <Badge count={5}>
              <Button
                type="text"
                icon={<BellOutlined />}
                size="large"
                style={{ color: '#6E6E6E' }}
              />
            </Badge>

            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar 
                  style={{ backgroundColor: '#D04925' }}
                  icon={<UserOutlined />}
                />
                <span style={{ color: '#2B2B2B' }}>
                  {state.user?.username || 'Admin'}
                </span>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        <Content
          style={{
            margin: '16px',
            padding: '24px',
            background: '#FAF3E0',
            borderRadius: '8px',
            minHeight: 'calc(100vh - 112px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout;
