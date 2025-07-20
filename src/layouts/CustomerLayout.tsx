import React, { useState } from 'react';
import { Outlet, Link } from 'react-router-dom';
import {
  Layout,
  Button,
  Drawer,
} from 'antd';
import {
  MenuOutlined,
} from '@ant-design/icons';
import useScreenSize from '../hooks/useScreenSize';

const { Header, Content, Footer } = Layout;

const CustomerLayout: React.FC = () => {
  const [drawerVisible, setDrawerVisible] = useState(false);
  const { isMobile } = useScreenSize();
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          width: '100%',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: isMobile ? '0 12px' : '0 20px',
          height: isMobile ? '56px' : '64px',
        }}
      >
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between',
          maxWidth: '1200px',
          margin: '0 auto',
          height: '100%',
          width: '100%',
        }}>
          {/* Logo */}
          <Link to="/" style={{ textDecoration: 'none', flex: 'none' }}>
            <div style={{ 
              fontSize: isMobile ? '18px' : '24px', 
              fontWeight: 'bold', 
              color: '#D04925',
              display: 'flex',
              alignItems: 'center',
              whiteSpace: 'nowrap',
            }}>
              👔 Coflar Mania
            </div>
          </Link>

          {/* Center spacer for desktop */}
          {!isMobile && <div style={{ flex: 1 }}></div>}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined />}
              onClick={() => setDrawerVisible(true)}
              className="mobile-menu-btn"
              size="small"
              style={{ 
                minWidth: '32px',
                width: '32px',
                height: '32px',
                padding: '0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            />
          )}
        </div>
      </Header>

      {/* Mobile Drawer - Simple contact info if needed */}
      <Drawer
        title="Thông tin liên hệ"
        placement="right"
        onClose={() => setDrawerVisible(false)}
        open={drawerVisible}
        width={280}
      >
        <div style={{ padding: '20px 0' }}>
          <h4 style={{ color: '#D04925', marginBottom: '16px' }}>Coflar Mania</h4>
          <p style={{ marginBottom: '12px' }}>
            📍 123 Đường ABC, Quận 1, TP.HCM
          </p>
          <p style={{ marginBottom: '12px' }}>
            📞 0123 456 789
          </p>
          <p style={{ marginBottom: '12px' }}>
            ✉️ info@coflarmania.com
          </p>
          <p style={{ marginBottom: '12px' }}>
            🕒 8:00 - 22:00 (Thứ 2 - Chủ nhật)
          </p>
        </div>
      </Drawer>

      <Content style={{ backgroundColor: '#FAF3E0' }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: isMobile ? '12px' : '20px',
          minHeight: 'calc(100vh - 140px)',
        }}>
          <Outlet />
        </div>
      </Content>

      <Footer
        style={{
          textAlign: 'center',
          backgroundColor: '#2B2B2B',
          color: '#FFFFFF',
          padding: isMobile ? '20px 12px' : '40px 20px',
        }}
      >
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: isMobile ? '20px' : '30px',
            marginBottom: '20px',
          }}>
            <div>
              <h3 style={{ 
                color: '#D04925', 
                marginBottom: '16px',
                fontSize: isMobile ? '18px' : '20px'
              }}>
                Coflar Mania
              </h3>
              <p style={{ 
                color: '#6E6E6E',
                fontSize: isMobile ? '14px' : '16px',
                lineHeight: '1.6'
              }}>
                Cửa hàng thời trang uy tín với nhiều năm kinh nghiệm trong ngành
              </p>
            </div>
            <div>
              <h4 style={{ 
                color: '#FFFFFF', 
                marginBottom: '16px',
                fontSize: isMobile ? '16px' : '18px'
              }}>
                Liên hệ
              </h4>
              <p style={{ 
                color: '#6E6E6E',
                fontSize: isMobile ? '13px' : '14px',
                lineHeight: '1.6'
              }}>
                📍 123 Đường ABC, Quận 1, TP.HCM<br />
                📞 0123 456 789<br />
                ✉️ info@coflarmania.com<br />
                🕒 8:00 - 22:00 (Thứ 2 - Chủ nhật)
              </p>
            </div>
            <div>
              <h4 style={{ 
                color: '#FFFFFF', 
                marginBottom: '16px',
                fontSize: isMobile ? '16px' : '18px'
              }}>
                Chính sách
              </h4>
              <p style={{ 
                color: '#6E6E6E',
                fontSize: isMobile ? '13px' : '14px',
                lineHeight: '1.6'
              }}>
                • Miễn phí vận chuyển từ 500K<br />
                • Đổi trả trong 7 ngày<br />
                • Bảo hành chất lượng<br />
                • Hỗ trợ 24/7
              </p>
            </div>
          </div>
          <div style={{ 
            borderTop: '1px solid #444', 
            paddingTop: '20px',
            color: '#6E6E6E',
            fontSize: isMobile ? '12px' : '14px'
          }}>
            © 2025 Coflar Mania. All rights reserved.
          </div>
        </div>
      </Footer>
    </Layout>
  );
};

export default CustomerLayout;
