import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Row,
  Col,
  Card,
  Button,
  Typography,
  Select,
  Tag,
  Empty,
  Spin,
  Pagination,
  Carousel,
  Input,
  message,
} from 'antd';
import {
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import { productsAPI, categoriesAPI } from '../../services/api';
import { getFirstImageUrl, handleImageError } from '../../utils/imageUtils';
import useScreenSize from '../../hooks/useScreenSize';
import type { Product } from '../../types';

const { Title, Text } = Typography;
const { Meta } = Card;
const { Option } = Select;
const { Search } = Input;

const bannerImages = [
  {
    url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=400&fit=crop',
    title: 'Bộ sưu tập mùa xuân 2025 - Coflar Mania',
    subtitle: 'Khám phá những xu hướng thời trang mới nhất',
  },
  {
    url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=400&fit=crop',
    title: 'Thời trang công sở',
    subtitle: 'Phong cách chuyên nghiệp, thanh lịch',
  },
  {
    url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=1200&h=400&fit=crop',
    title: 'Sale up to 50%',
    subtitle: 'Cơ hội mua sắm tuyệt vời không thể bỏ lỡ',
  },
];

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category: '',
    brand: '',
    priceRange: [0, 1000000] as [number, number],
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(12);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchParams] = useSearchParams();
  const [searchValue, setSearchValue] = useState('');
  const navigate = useNavigate();
  const { isMobile, isSmallMobile, isTablet } = useScreenSize();

  useEffect(() => {
    loadData();
    
    // Set search value from URL params
    const currentSearch = searchParams.get('search');
    if (currentSearch) {
      setSearchValue(currentSearch);
    } else {
      setSearchValue('');
    }
  }, [currentPage, filters, searchParams]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load categories
      const categoriesResponse = await categoriesAPI.getAll();
      if (categoriesResponse.success) {
        setCategories(categoriesResponse.data);
      }

      // Build query params for products
      const queryParams: Record<string, string> = {
        page: currentPage.toString(),
        limit: pageSize.toString()
      };
      
      const searchQuery = searchParams.get('search');
      if (searchQuery) {
        queryParams.search = searchQuery;
      }
      
      if (filters.category) {
        queryParams.categoryId = filters.category;
      }
      
      if (filters.brand) {
        queryParams.brand = filters.brand;
      }

      // Load products with filters
      const productsResponse = await productsAPI.getAll(queryParams);
      if (productsResponse.success) {
        setProducts(productsResponse.data || []);
        setTotalProducts(productsResponse.data?.length || 0);
      }
      
    } catch (error) {
      console.error('Error loading data:', error);
      message.error('Không thể tải dữ liệu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const handleProductClick = (productId: string) => {
    navigate(`/products/${productId}`);
  };

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
    setCurrentPage(1);
  };

  const handleSearch = (value: string) => {
    if (value.trim()) {
      navigate(`/?search=${encodeURIComponent(value.trim())}`);
    } else {
      // Navigate to homepage without search params to clear search
      navigate('/');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(price);
  };

  const getBrands = () => {
    const brands = [...new Set(products.map(p => p.brand))];
    return [
      { value: '', label: 'Tất cả thương hiệu' },
      ...brands.map(brand => ({ value: brand, label: brand }))
    ];
  };

  const getCategoryOptions = () => {
    return [
      { value: '', label: 'Tất cả danh mục' },
      ...categories.map(cat => ({ value: cat.id, label: cat.name }))
    ];
  };

  if (loading && products.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: '#FAF3E0', minHeight: '100vh' }}>
      {/* Hero Banner */}
      <div style={{ marginBottom: '20px' }}>
        <Carousel autoplay effect="fade" className="custom-dots">
          {bannerImages.map((banner, index) => (
            <div key={index}>
              <div
                style={{
                  height: isSmallMobile ? '250px' : isTablet ? '300px' : '400px',
                  background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${banner.url})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: 'white',
                  textAlign: 'center',
                  padding: '0 20px',
                }}
              >
                <Title 
                  level={1} 
                  style={{ 
                    color: 'white', 
                    fontSize: isSmallMobile ? '28px' : isTablet ? '36px' : '48px',
                    marginBottom: '16px',
                    lineHeight: '1.2'
                  }}
                >
                  {banner.title}
                </Title>
                <Text 
                  style={{ 
                    fontSize: isSmallMobile ? '14px' : isTablet ? '16px' : '20px',
                    color: 'rgba(255,255,255,0.9)',
                    textAlign: 'center'
                  }}
                >
                  {banner.subtitle}
                </Text>
              </div>
            </div>
          ))}
        </Carousel>
      </div>

      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
        {/* Stats Section */}
        <Row gutter={[16, 16]} style={{ marginBottom: '30px' }}>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center', backgroundColor: '#FFFFFF', height: '100%' }} className={isSmallMobile ? 'stats-card-mobile' : ''}>
              <div style={{ fontSize: '28px', color: '#D04925', marginBottom: '8px' }}>🚚</div>
              <Title level={4} style={{ margin: 0, fontSize: '16px' }}>Miễn phí vận chuyển</Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>Đơn hàng từ 500.000đ</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center', backgroundColor: '#FFFFFF', height: '100%' }} className={isSmallMobile ? 'stats-card-mobile' : ''}>
              <div style={{ fontSize: '28px', color: '#D04925', marginBottom: '8px' }}>🔄</div>
              <Title level={4} style={{ margin: 0, fontSize: '16px' }}>Đổi trả dễ dàng</Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>Trong vòng 7 ngày</Text>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card style={{ textAlign: 'center', backgroundColor: '#FFFFFF', height: '100%' }} className={isSmallMobile ? 'stats-card-mobile' : ''}>
              <div style={{ fontSize: '28px', color: '#D04925', marginBottom: '8px' }}>📱</div>
              <Title level={4} style={{ margin: 0, fontSize: '16px' }}>Hỗ trợ 24/7</Title>
              <Text type="secondary" style={{ fontSize: '12px' }}>Hotline: 1900 1234</Text>
            </Card>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: '20px' }} bodyStyle={{ padding: isMobile ? '12px' : '16px' }}>
          <Row gutter={[8, 12]} align="middle">
            {/* Search Bar */}
            <Col xs={24} sm={24} md={24} lg={24} style={{ marginBottom: isMobile ? '8px' : '12px' }}>
              <Text strong style={{ fontSize: isMobile ? '13px' : '14px', display: 'block', marginBottom: '4px' }}>
                Tìm kiếm sản phẩm:
              </Text>
              <Search
                placeholder={isMobile ? "Nhập tên sản phẩm..." : "Nhập tên sản phẩm, thương hiệu..."}
                allowClear
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onSearch={handleSearch}
                style={{ 
                  width: '100%',
                  maxWidth: isMobile ? '100%' : '400px'
                }}
                size={isMobile ? 'large' : 'large'}
                enterButton={
                  <Button type="primary" icon={<SearchOutlined />} style={{ backgroundColor: '#D04925', borderColor: '#D04925' }}>
                    {isMobile ? '' : 'Tìm kiếm'}
                  </Button>
                }
              />
            </Col>
            
            {/* Category and Brand Filters */}
            <Col xs={24} sm={12} md={8} lg={6}>
              <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>Danh mục:</Text>
              <Select
                style={{ width: '100%', marginTop: '4px' }}
                value={filters.category}
                onChange={(value) => handleFilterChange('category', value)}
                placeholder="Chọn danh mục"
                size={isMobile ? 'large' : 'middle'}
              >
                {getCategoryOptions().map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={12} md={8} lg={6}>
              <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>Thương hiệu:</Text>
              <Select
                style={{ width: '100%', marginTop: '4px' }}
                value={filters.brand}
                onChange={(value) => handleFilterChange('brand', value)}
                placeholder="Chọn thương hiệu"
                size={isMobile ? 'large' : 'middle'}
              >
                {getBrands().map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col xs={24} sm={24} md={8} lg={12}>
              <div style={{ 
                display: 'flex', 
                flexWrap: 'wrap', 
                gap: '6px', 
                alignItems: 'center',
                marginTop: isMobile ? '8px' : '20px'
              }}>
                <Text strong style={{ fontSize: isMobile ? '13px' : '14px' }}>
                  Tìm thấy {totalProducts} sản phẩm
                </Text>
                {searchParams.get('search') && (
                  <Tag 
                    color="blue" 
                    style={{ fontSize: isMobile ? '11px' : '12px' }}
                    closable
                    onClose={() => {
                      setSearchValue('');
                      navigate('/');
                    }}
                  >
                    Tìm kiếm: "{searchParams.get('search')}"
                  </Tag>
                )}
                {filters.category && (
                  <Tag 
                    color="green" 
                    style={{ fontSize: isMobile ? '11px' : '12px' }}
                    closable
                    onClose={() => handleFilterChange('category', '')}
                  >
                    Danh mục: {categories.find(c => c.id === filters.category)?.name}
                  </Tag>
                )}
                {filters.brand && (
                  <Tag 
                    color="orange" 
                    style={{ fontSize: isMobile ? '11px' : '12px' }}
                    closable
                    onClose={() => handleFilterChange('brand', '')}
                  >
                    Thương hiệu: {filters.brand}
                  </Tag>
                )}
              </div>
            </Col>
          </Row>
        </Card>

        {/* Products Grid */}
        {products.length === 0 ? (
          <Empty
            description="Không tìm thấy sản phẩm nào"
            style={{ padding: '40px' }}
          />
        ) : (
          <>
            <Row gutter={[12, 12]} style={{ marginBottom: '30px' }}>
              {products.map((product) => (
                <Col key={product.id} xs={12} sm={12} md={8} lg={6} xl={4}>
                  <Card
                    hoverable
                    cover={
                      <div style={{ 
                        height: isSmallMobile ? '120px' : isMobile ? '160px' : '200px',
                        overflow: 'hidden',
                        position: 'relative'
                      }}>
                        <img
                          alt={product.name}
                          src={getFirstImageUrl(product.images)}
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover',
                            transition: 'transform 0.3s ease'
                          }}
                          onError={handleImageError}
                          className="product-image"
                        />
                        {product.purchasePrice && product.purchasePrice > product.salePrice && (
                          <div style={{
                            position: 'absolute',
                            top: '8px',
                            right: '8px',
                            background: '#ff4d4f',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 'bold'
                          }}>
                            -{Math.round(((product.purchasePrice - product.salePrice) / product.purchasePrice) * 100)}%
                          </div>
                        )}
                      </div>
                    }
                    actions={[
                      <Button
                        key="view"
                        type="link"
                        icon={<EyeOutlined />}
                        onClick={() => handleProductClick(product.id)}
                        size={isSmallMobile ? 'small' : 'middle'}
                        style={{ fontSize: isSmallMobile ? '11px' : '13px' }}
                      >
                        {isSmallMobile ? 'Xem' : 'Chi tiết'}
                      </Button>
                    ]}
                    style={{ 
                      height: '100%',
                      borderRadius: '8px',
                      overflow: 'hidden'
                    }}
                    bodyStyle={{ 
                      padding: isSmallMobile ? '8px' : '12px',
                      height: 'auto'
                    }}
                    className={isSmallMobile ? 'product-card-mobile' : ''}
                  >
                    <Meta
                      title={
                        <div>
                          <div style={{ 
                            fontSize: isSmallMobile ? '11px' : '14px',
                            fontWeight: 'bold', 
                            marginBottom: '2px',
                            lineHeight: '1.2',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                            minHeight: isSmallMobile ? '22px' : '28px'
                          }}>
                            {product.name}
                          </div>
                          <div style={{ 
                            fontSize: isSmallMobile ? '9px' : '11px',
                            color: '#999',
                            marginBottom: '4px'
                          }}>
                            {product.brand}
                          </div>
                        </div>
                      }
                      description={
                        <div>
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: isSmallMobile ? '4px' : '6px',
                            flexWrap: 'wrap'
                          }}>
                            <Text style={{ 
                              fontSize: isSmallMobile ? '12px' : '15px',
                              fontWeight: 'bold', 
                              color: '#D04925' 
                            }}>
                              {formatPrice(product.salePrice)}
                            </Text>
                            {product.purchasePrice && product.purchasePrice > product.salePrice && (
                              <Text delete style={{ 
                                fontSize: isSmallMobile ? '9px' : '11px',
                                color: '#999' 
                              }}>
                                {formatPrice(product.purchasePrice)}
                              </Text>
                            )}
                          </div>
                        </div>
                      }
                    />
                  </Card>
                </Col>
              ))}
            </Row>

            {/* Pagination */}
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <Pagination
                current={currentPage}
                total={totalProducts}
                pageSize={pageSize}
                onChange={(page) => setCurrentPage(page)}
                showSizeChanger={false}
                showQuickJumper={!isMobile}
                showTotal={(total, range) =>
                  isSmallMobile 
                    ? `${range[0]}-${range[1]}/${total}`
                    : `${range[0]}-${range[1]} của ${total} sản phẩm`
                }
                size={isSmallMobile ? 'small' : 'default'}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default HomePage;
