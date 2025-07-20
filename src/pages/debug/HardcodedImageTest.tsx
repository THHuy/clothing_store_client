import React from 'react';
import { Card, Typography } from 'antd';

const { Title } = Typography;

const HardcodedImageTest: React.FC = () => {
  const testUrls = [
    'http://localhost:3001/uploads/product-1752905953206-308442475.jpg',
    'http://localhost:3001/uploads/product-1752905989931-220237306.png',
    'http://localhost:3001/uploads/default-product.jpg'
  ];

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Hardcoded Image Test</Title>
      
      {testUrls.map((url, index) => (
        <Card key={index} style={{ marginBottom: '16px' }}>
          <Title level={4}>Test Image {index + 1}</Title>
          <div style={{ marginBottom: '8px' }}>
            <strong>URL:</strong> {url}
          </div>
          <img 
            src={url}
            alt={`Test ${index + 1}`}
            style={{ 
              width: '300px', 
              height: '200px', 
              objectFit: 'cover', 
              border: '1px solid #ccc',
              display: 'block',
              marginBottom: '8px'
            }}
            onLoad={() => console.log(`✅ Image ${index + 1} loaded successfully:`, url)}
            onError={(e) => {
              console.error(`❌ Image ${index + 1} failed to load:`, url);
              console.error('Error:', e);
              (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x200?text=Failed+to+Load';
            }}
          />
        </Card>
      ))}
    </div>
  );
};

export default HardcodedImageTest;
