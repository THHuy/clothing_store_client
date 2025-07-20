import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  Form,
  Input,
  Button,
  Card,
  Typography,
  Row,
  Col,
  Divider,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
  LoginOutlined,
  HomeOutlined,
} from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const { Title, Text } = Typography;

interface LoginFormData {
  username: string;
  password: string;
}

interface LoginProps {
  adminMode?: boolean;
}

const Login: React.FC<LoginProps> = ({ adminMode = false }) => {
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || (adminMode ? '/admin/dashboard' : '/');

  const onFinish = async (values: LoginFormData) => {
    setLoading(true);
    
    try {
      await login(values.username, values.password);
      navigate(from, { replace: true });
    } catch (error) {
      // Error message is already shown by the AuthContext
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #FAF3E0 0%, #F5E6C8 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <Row justify="center" style={{ width: '100%', maxWidth: '400px' }}>
        <Col xs={24}>
          <Card
            style={{
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
              borderRadius: '12px',
              border: 'none',
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                fontSize: '48px',
                marginBottom: '16px'
              }}>
                👔
              </div>
              <Title level={2} style={{ color: '#D04925', marginBottom: '8px' }}>
                {adminMode ? 'Admin - Coflar Mania' : 'Đăng nhập'}
              </Title>
              <Text type="secondary">
                {adminMode 
                  ? 'Hệ thống quản lý Coflar Mania' 
                  : 'Chào mừng đến với Coflar Mania'
                }
              </Text>
            </div>

            <Form
              name="login"
              onFinish={onFinish}
              layout="vertical"
              size="large"
            >
              <Form.Item
                label="Username"
                name="username"
                rules={[
                  { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                ]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Nhập tên đăng nhập"
                />
              </Form.Item>

              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[
                  { required: true, message: 'Vui lòng nhập mật khẩu!' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Nhập mật khẩu"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  block
                  icon={<LoginOutlined />}
                  style={{ height: '48px', fontSize: '16px' }}
                >
                  Đăng nhập
                </Button>
              </Form.Item>
            </Form>

            {adminMode && (
              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  Demo: username = "admin", password = "123456"
                </Text>
              </div>
            )}

            <Divider />

            <div style={{ textAlign: 'center' }}>
              <Link to="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <HomeOutlined />
                Về trang chủ
              </Link>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Login;
