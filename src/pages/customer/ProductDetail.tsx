import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Row,
  Col,
  Button,
  Typography,
  Select,
  Card,
  Image,
  Breadcrumb,
  Tag,
  Empty,
  Spin,
  Carousel,
  message,
} from 'antd';
import {
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { productsAPI } from '../../services/api';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import useScreenSize from '../../hooks/useScreenSize';
import type { Product } from '../../types';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [selectedVariant, setSelectedVariant] = useState<any>(null);
  const { isMobile } = useScreenSize();

  useEffect(() => {
    if (id) {
      loadProduct();
    }
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await productsAPI.getById(id!);
      
      if (response.success) {
        setProduct(response.data);
        
        // Set default variant if available
        if (response.data.variants && response.data.variants.length > 0) {
          const firstVariant = response.data.variants[0];
          setSelectedSize(firstVariant.size);
          setSelectedColor(firstVariant.color);
          setSelectedVariant(firstVariant);
        }
      } else {
        message.error('Không thể tải thông tin sản phẩm');
      }
    } catch (error) {
      console.error('Error loading product:', error);
      message.error('Có lỗi xảy ra khi tải sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product && selectedSize && selectedColor) {
      const variant = product.variants?.find(
        v => v.size === selectedSize && v.color === selectedColor
      );
      setSelectedVariant(variant || null);
    }
  }, [selectedSize, selectedColor, product]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getAvailableSizes = () => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map(v => v.size))];
  };

  const getAvailableColors = () => {
    if (!product?.variants) return [];
    return [...new Set(product.variants.map(v => v.color))];
  };

  const getStockStatus = (currentStock: number, minStock: number) => {
    if (currentStock === 0) {
      return { color: 'red', text: 'Hết hàng' };
    } else if (currentStock <= minStock) {
      return { color: 'orange', text: 'Sắp hết' };
    } else {
      return { color: 'green', text: 'Còn hàng' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!product) {
    return (
      <div style={{ padding: '40px' }}>
        <Empty description="Không tìm thấy sản phẩm" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FAF3E0', minHeight: '100vh', padding: isMobile ? '12px' : '20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Breadcrumb */}
        <Breadcrumb style={{ marginBottom: isMobile ? '16px' : '24px' }}>
          <Breadcrumb.Item>
            <Button 
              type="link" 
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/')}
              style={{ padding: 0 }}
              size={isMobile ? 'small' : 'middle'}
            >
              Trang chủ
            </Button>
          </Breadcrumb.Item>
          {!isMobile && (
            <Breadcrumb.Item>
              <span style={{ 
                maxWidth: '200px',
                display: 'inline-block',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {product.name}
              </span>
            </Breadcrumb.Item>
          )}
        </Breadcrumb>

        <Row gutter={[16, 24]}>
          {/* Product Images */}
          <Col xs={24} lg={12}>
            <Card style={{ height: 'fit-content' }}>
              {product.images && product.images.length > 0 ? (
                <Carousel autoplay>
                  {product.images.map((image, index) => (
                    <div key={index}>
                      <div style={{
                        width: '100%',
                        height: isMobile ? '300px' : '400px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                        backgroundColor: '#f8f8f8'
                      }}>
                        <Image
                          src={getImageUrl(image)}
                          alt={`${product.name} ${index + 1}`}
                          style={{ 
                            maxWidth: '100%',
                            maxHeight: '100%',
                            objectFit: 'contain',
                            display: 'block'
                          }}
                          placeholder={<div style={{ 
                            height: isMobile ? '300px' : '400px',
                            background: '#f0f0f0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999'
                          }}>
                            Đang tải...
                          </div>}
                          onError={handleImageError}
                          preview={{
                            mask: <div style={{ fontSize: '16px' }}>🔍 Xem chi tiết</div>
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </Carousel>
              ) : (
                <div style={{ 
                  height: isMobile ? '300px' : '400px',
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  color: '#999',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ fontSize: '48px' }}>📷</div>
                  <div>Không có hình ảnh</div>
                </div>
              )}
            </Card>
          </Col>

          {/* Product Info */}
          <Col xs={24} lg={12}>
            <div style={{ 
              backgroundColor: '#FFFFFF', 
              padding: isMobile ? '16px' : '24px',
              borderRadius: '8px' 
            }}>
              {/* Product Title */}
              <div style={{ marginBottom: '16px' }}>
                <Title 
                  level={isMobile ? 3 : 2}
                  style={{ 
                    marginBottom: '8px', 
                    color: '#2B2B2B',
                    fontSize: isMobile ? '20px' : '28px'
                  }}
                >
                  {product.name}
                </Title>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '8px' }}>
                  <Tag color="blue">{product.brand}</Tag>
                </div>
                <Text strong style={{ fontSize: '12px', color: '#666' }}>
                  SKU: {product.sku}
                </Text>
              </div>

              {/* Price */}
              <div style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <Text style={{ 
                    fontSize: isMobile ? '24px' : '32px',
                    fontWeight: 'bold', 
                    color: '#D04925' 
                  }}>
                    {formatPrice(product.salePrice)}
                  </Text>
                  {product.purchasePrice && product.purchasePrice > product.salePrice && (
                    <Text delete style={{ fontSize: isMobile ? '14px' : '18px', color: '#999' }}>
                      {formatPrice(product.purchasePrice)}
                    </Text>
                  )}
                </div>
                {product.purchasePrice && product.purchasePrice > product.salePrice && (
                  <Tag color="red">
                    Giảm {Math.round(((product.purchasePrice - product.salePrice) / product.purchasePrice) * 100)}%
                  </Tag>
                )}
              </div>

              {/* Size Selection */}
              {getAvailableSizes().length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Chọn kích thước:
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    value={selectedSize}
                    onChange={setSelectedSize}
                    placeholder="Chọn kích thước"
                  >
                    {getAvailableSizes().map(size => (
                      <Option key={size} value={size}>{size}</Option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Color Selection */}
              {getAvailableColors().length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <Text strong style={{ display: 'block', marginBottom: '8px' }}>
                    Chọn màu sắc:
                  </Text>
                  <Select
                    style={{ width: '100%' }}
                    value={selectedColor}
                    onChange={setSelectedColor}
                    placeholder="Chọn màu sắc"
                  >
                    {getAvailableColors().map(color => (
                      <Option key={color} value={color}>{color}</Option>
                    ))}
                  </Select>
                </div>
              )}

              {/* Stock Info */}
              <div style={{ marginBottom: '20px' }}>
                <Row gutter={[16, 16]}>
                  <Col xs={24}>
                    <Text strong>Tình trạng kho:</Text>
                    <div style={{ marginTop: '8px' }}>
                      {selectedVariant ? (
                        <Tag color={getStockStatus(selectedVariant.stock, selectedVariant.minStock || 5).color}>
                          {getStockStatus(selectedVariant.stock, selectedVariant.minStock || 5).text} 
                          ({selectedVariant.stock} sản phẩm)
                        </Tag>
                      ) : (
                        <Tag color="default">Chọn phân loại</Tag>
                      )}
                    </div>
                  </Col>
                </Row>
              </div>

              {/* Product Features */}
              <Card size="small" style={{ marginBottom: '20px' }}>
                <Row gutter={[12, 12]}>
                  <Col xs={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? '20px' : '24px', color: '#D04925' }}>🚚</div>
                      <Text style={{ fontSize: isMobile ? '11px' : '14px' }}>
                        Miễn phí vận chuyển
                      </Text>
                    </div>
                  </Col>
                  <Col xs={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? '20px' : '24px', color: '#D04925' }}>🔄</div>
                      <Text style={{ fontSize: isMobile ? '11px' : '14px' }}>
                        Đổi trả 7 ngày
                      </Text>
                    </div>
                  </Col>
                  <Col xs={8}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: isMobile ? '20px' : '24px', color: '#D04925' }}>✨</div>
                      <Text style={{ fontSize: isMobile ? '11px' : '14px' }}>
                        Chất lượng cao
                      </Text>
                    </div>
                  </Col>
                </Row>
              </Card>
            </div>
          </Col>
        </Row>

        {/* Product Details */}
        <Row gutter={[16, 24]} style={{ marginTop: isMobile ? '24px' : '40px' }}>
          <Col xs={24}>
            <Card title="Chi tiết sản phẩm" style={{ backgroundColor: '#FFFFFF' }}>
              <Paragraph style={{ 
                fontSize: isMobile ? '14px' : '16px',
                lineHeight: '1.6' 
              }}>
                {product.description}
              </Paragraph>
              
              <Title 
                level={4} 
                style={{ 
                  marginTop: '20px',
                  fontSize: isMobile ? '16px' : '18px'
                }}
              >
                Thông tin sản phẩm
              </Title>
              <ul style={{ fontSize: isMobile ? '13px' : '14px' }}>
                <li><Text strong>Chất liệu:</Text> {product.material}</li>
                <li><Text strong>Thương hiệu:</Text> {product.brand}</li>
                <li><Text strong>Xuất xứ:</Text> Việt Nam</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default ProductDetail;
