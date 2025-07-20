import React from 'react';
import { Card, Typography, Image, Row, Col } from 'antd';

const { Title, Text } = Typography;

const ImageDebugPage: React.FC = () => {
  const testImages = [
    '/uploads/product-1752905953206-308442475.jpg',
    '/uploads/product-1752905989931-220237306.png',
    '/uploads/default-product.jpg'
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <Title level={2}>Image Debug Page</Title>
      
      <Row gutter={[16, 16]}>
        {testImages.map((imagePath, index) => (
          <Col key={index} xs={24} sm={12} md={8}>
            <Card title={`Image ${index + 1}`}>
              <Text strong>Path:</Text> {imagePath}<br />
              <Text strong>Full URL:</Text> {`http://localhost:3001${imagePath}`}<br /><br />
              
              <Image
                src={`http://localhost:3001${imagePath}`}
                alt={`Test image ${index + 1}`}
                style={{ width: '100%', height: '200px', objectFit: 'cover' }}
                placeholder={<div style={{ height: '200px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>}
                onError={(e) => {
                  console.error('Image load error:', e);
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Error';
                }}
              />
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default ImageDebugPage;
