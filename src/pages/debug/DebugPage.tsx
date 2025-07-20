import React, { useEffect, useState } from 'react';
import { Card, Typography, Button } from 'antd';
import { productsAPI } from '../../services/api';
import { getFirstImageUrl } from '../../utils/imageUtils';

const { Title, Text } = Typography;

const DebugPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getAll();
      console.log('API response:', response);
      if (response.success) {
        setProducts(response.data || []);
        console.log('Products loaded:', response.data);
      }
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <Title level={2}>Debug Page</Title>
      
      <Button onClick={loadProducts} loading={loading} style={{ marginBottom: '20px' }}>
        Reload Products
      </Button>

      <div>
        <Title level={3}>Products Debug Info:</Title>
        {products.map((product, index) => {
          const imageUrl = getFirstImageUrl(product.images);
          return (
            <Card key={product.id} style={{ marginBottom: '16px' }}>
              <Title level={4}>Product {index + 1}: {product.name}</Title>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>ID:</Text> {product.id}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Raw images:</Text> {JSON.stringify(product.images)}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Processed image URL:</Text> {imageUrl}
              </div>
              <div style={{ marginBottom: '8px' }}>
                <Text strong>Test image:</Text>
                <br />
                <img 
                  src={imageUrl} 
                  alt={product.name}
                  style={{ width: '200px', height: '150px', objectFit: 'cover', border: '1px solid #ccc' }}
                  onLoad={() => console.log('Image loaded successfully:', imageUrl)}
                  onError={(e) => {
                    console.error('Image failed to load:', imageUrl);
                    console.error('Error event:', e);
                  }}
                />
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default DebugPage;
