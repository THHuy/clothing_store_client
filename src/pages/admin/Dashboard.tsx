import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Statistic,
  Typography,
  List,
  Tag,
  Button,
  Space,
  Avatar,
  Spin,
  message,
} from 'antd';
import {
  ShoppingOutlined,
  DollarOutlined,
  AlertOutlined,
  TrophyOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { reportsAPI, variantsAPI } from '../../services/api';

const { Title, Text } = Typography;

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load dashboard data and low stock alerts in parallel
      const [dashboardResponse, lowStockResponse] = await Promise.all([
        reportsAPI.getDashboardData(),
        variantsAPI.getLowStockAlerts(),
      ]);

      if (dashboardResponse.success) {
        setDashboardData(dashboardResponse.data);
      }

      if (lowStockResponse.success) {
        setLowStockAlerts(lowStockResponse.data);
      }
    } catch (error: any) {
      console.error('Failed to load dashboard data:', error);
      message.error('Không thể tải dữ liệu dashboard');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      return { color: 'red', text: 'Hết hàng' };
    } else if (currentStock <= minStock) {
      return { color: 'orange', text: 'Sắp hết' };
    } else {
      return { color: 'green', text: 'Bình thường' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  const todayStats = dashboardData?.todayStats || {};
  const monthStats = dashboardData?.monthStats || {};
  const inventoryAlerts = dashboardData?.inventoryAlerts || {};
  const recentActivity = dashboardData?.recentActivity || {};

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <Title level={2} style={{ marginBottom: '24px' }}>
        Dashboard
      </Title>

      {/* Stats Cards */}
      <Row gutter={[24, 24]} style={{ marginBottom: '32px', width: '100%' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Đơn hàng hôm nay"
              value={todayStats.orders || 0}
              prefix={<ShoppingOutlined />}
              valueStyle={{ color: '#1E4D40' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu hôm nay"
              value={todayStats.revenue || 0}
              precision={0}
              prefix={<DollarOutlined />}
              valueStyle={{ color: '#D04925' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Cảnh báo tồn kho"
              value={(inventoryAlerts.lowStock || 0) + (inventoryAlerts.outOfStock || 0)}
              prefix={<AlertOutlined />}
              valueStyle={{ color: '#A31E22' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Doanh thu tháng"
              value={monthStats.revenue || 0}
              prefix={<TrophyOutlined />}
              valueStyle={{ color: '#F28C28' }}
              formatter={(value) => formatCurrency(Number(value))}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[24, 24]} style={{ width: '100%' }}>
        {/* Low Stock Alerts */}
        <Col xs={24} lg={12}>
          <Card 
            title="Cảnh báo tồn kho" 
            extra={
              <Button 
                type="link"
                onClick={() => navigate('/admin/inventory?tab=variants')}
              >
                Xem tất cả
              </Button>
            }
          >
            <List
              dataSource={lowStockAlerts.slice(0, 5)}
              renderItem={(item: any) => {
                const status = getStockStatus(item.stock, item.minStock);
                return (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <Avatar
                          style={{ 
                            backgroundColor: status.color,
                            color: 'white'
                          }}
                        >
                          <AlertOutlined />
                        </Avatar>
                      }
                      title={`${item.product?.name || 'Product'} (${item.size}/${item.color})`}
                      description={
                        <Space>
                          <Text>Tồn kho: {item.stock}/{item.minStock}</Text>
                          <Tag color={status.color}>{status.text}</Tag>
                        </Space>
                      }
                    />
                    <Button 
                      size="small" 
                      icon={<EyeOutlined />}
                      type="text"
                      onClick={() => navigate('/admin/inventory?tab=variants')}
                    >
                      Xem
                    </Button>
                  </List.Item>
                );
              }}
            />
          </Card>
        </Col>

        {/* Recent Transactions */}
        <Col xs={24} lg={12}>
          <Card 
            title="Giao dịch gần đây" 
            extra={
              <Button 
                type="link"
                onClick={() => navigate('/admin/inventory?tab=transactions')}
              >
                Xem tất cả
              </Button>
            }
          >
            <List
              dataSource={recentActivity.transactions || []}
              renderItem={(item: any) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        style={{ 
                          backgroundColor: item.type === 'in' ? '#52c41a' : '#ff4d4f',
                          color: 'white'
                        }}
                      >
                        {item.type === 'in' ? '+' : '-'}
                      </Avatar>
                    }
                    title={`${item.productName} (${item.variant})`}
                    description={
                      <Space>
                        <Text type="secondary">{item.reason}</Text>
                        <Text>{item.quantity} sản phẩm</Text>
                      </Space>
                    }
                  />
                  <Tag 
                    color={item.type === 'in' ? 'green' : 'red'}
                  >
                    {item.type === 'in' ? 'Nhập' : 'Xuất'}
                  </Tag>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
