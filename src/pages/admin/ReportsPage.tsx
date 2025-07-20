import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Select,
  DatePicker,
  Row,
  Col,
  Space,
  message,
  Typography,
  Tag,
  Alert,
  Table,
  Spin,
  Tabs
} from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  BarChartOutlined,
  ShoppingCartOutlined,
  InboxOutlined,
  SwapOutlined,
  EyeOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

// API request function
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthToken = (): string | null => {
  const authData = localStorage.getItem('auth');
  if (authData) {
    try {
      const parsedData = JSON.parse(authData);
      return parsedData.token;
    } catch (error) {
      console.error('Error parsing auth data:', error);
      return null;
    }
  }
  return null;
};

const apiRequest = async (endpoint: string, options: any = {}) => {
  const token = getAuthToken();
  const url = `${API_BASE_URL}${endpoint}`;
  
  console.log('🌐 Making API request:', { url, hasToken: !!token });
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);
  
  console.log('📡 API Response:', { status: response.status, statusText: response.statusText });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response;
};

const ReportsPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [currentReportType, setCurrentReportType] = useState<string>('inventory-export');
  const [activeTab, setActiveTab] = useState<string>('1');
  const [categories, setCategories] = useState<any[]>([]);
  const [filters, setFilters] = useState({
    dateRange: null as [dayjs.Dayjs, dayjs.Dayjs] | null,
    category: '',
    status: '',
    type: ''
  });

  // Fetch categories from database
  const fetchCategories = async () => {
    try {
      console.log('🔍 Fetching categories...');
      const response = await apiRequest('/categories', {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('📁 Categories API response:', result);
        // Handle API response structure - result.data contains the categories array
        const categoriesData = result.data || result;
        const finalCategories = Array.isArray(categoriesData) ? categoriesData : [];
        console.log('✅ Final categories:', finalCategories);
        setCategories(finalCategories);
      } else {
        console.error('❌ Failed to fetch categories:', response.status);
        setCategories([]);
      }
    } catch (error) {
      console.error('❌ Error fetching categories:', error);
      setCategories([]);
    }
  };

  // Auto load data when component mounts and when filters change
  useEffect(() => {
    // Fetch categories on component mount
    console.log('🚀 Component mounted, fetching categories...');
    fetchCategories();
    
    // Check auth token
    const token = getAuthToken();
    console.log('🔑 Auth token:', token ? 'Available' : 'Missing');
  }, []);

  useEffect(() => {
    console.log('🔄 useEffect triggered - activeTab:', activeTab, 'filters:', filters);
    
    if (activeTab === '2') { // Only auto-load in Statistics tab
      console.log('✅ Auto-loading conditions met');
      
      // Auto-load inventory report on tab switch
      const inventoryParams: any = { showError: false };
      if (filters.category) {
        inventoryParams.category = filters.category;
      }
      
      console.log('📦 Auto-loading inventory with params:', inventoryParams);
      fetchReportData('inventory-export', inventoryParams);
    } else {
      console.log('❌ Auto-loading skipped - not on Statistics tab');
      // Clear report data when switching away from Statistics tab
      setReportData(null);
    }
  }, [filters, activeTab]); // Re-run when filters or activeTab changes

  // Hàm download file Excel
  const downloadExcelReport = async (reportType: string, params: any = {}) => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams({
        format: 'excel',
        ...params
      });

      console.log('🔍 Debug - Downloading Excel:', {
        reportType,
        originalParams: params,
        queryParamsString: queryParams.toString(),
        fullUrl: `${API_BASE_URL}/reports/${reportType}?${queryParams.toString()}`
      });

      const response = await apiRequest(`/reports/${reportType}?${queryParams.toString()}`, {
        method: 'GET'
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        // Lấy tên file từ header Content-Disposition
        const disposition = response.headers.get('Content-Disposition');
        let filename = `${reportType}_report.xlsx`;
        if (disposition && disposition.includes('filename=')) {
          const filenameMatch = disposition.match(/filename="(.+)"/);
          if (filenameMatch) {
            filename = filenameMatch[1];
          }
        }
        
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        message.success('Đã tải xuống báo cáo Excel thành công!');
      } else {
        throw new Error('Không thể tải xuống báo cáo');
      }
    } catch (error) {
      console.error('Download error:', error);
      message.error('Lỗi khi tải xuống báo cáo');
    } finally {
      setLoading(false);
    }
  };

  // Hàm fetch dữ liệu để hiển thị
  const fetchReportData = async (reportType: string, params: any = {}) => {
    try {
      setDataLoading(true);
      setCurrentReportType(reportType);
      
      // Use only provided params, don't auto-add all filters
      const finalParams = {
        format: 'json',
        ...params
      };

      console.log('🔍 Debug - Fetching report:', {
        reportType,
        originalParams: params,
        finalParams
      });

      const queryParams = new URLSearchParams(finalParams);
      const url = `/reports/${reportType}?${queryParams.toString()}`;
      
      console.log('🌐 API Request URL:', `${API_BASE_URL}${url}`);

      const response = await apiRequest(url, {
        method: 'GET'
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ API Response:', result);
        
        // Extract data from response structure
        let extractedData = result;
        if (result.success && result.data) {
          extractedData = result.data;
        } else if (Array.isArray(result)) {
          extractedData = result;
        }
        
        console.log('📊 Extracted data:', extractedData);
        console.log('📊 Data type:', typeof extractedData);
        console.log('📊 Is array:', Array.isArray(extractedData));
        console.log('📊 Data length:', extractedData?.length);
        
        setReportData(extractedData);
      } else {
        throw new Error('Không thể tải dữ liệu báo cáo');
      }
    } catch (error) {
      console.error('❌ Fetch error:', error);
      // Show error message only for manual actions, not auto-loading
      if (params.showError !== false) {
        message.error('Lỗi khi tải dữ liệu báo cáo. Vui lòng thử lại.');
      }
      setReportData(null);
    } finally {
      setDataLoading(false);
    }
  };

  // Hàm tạo cột cho bảng dựa trên loại dữ liệu
  const getTableColumns = () => {
    console.log('🏗️ Building table columns for reportData:', reportData);
    
    if (!reportData) {
      console.log('❌ No reportData');
      return [];
    }
    
    let dataArray = reportData;
    if (!Array.isArray(reportData)) {
      console.log('⚠️ reportData is not array, trying to extract...');
      if (reportData.data && Array.isArray(reportData.data)) {
        dataArray = reportData.data;
      } else {
        console.log('❌ Cannot find array data');
        return [];
      }
    }
    
    if (dataArray.length === 0) {
      console.log('❌ Empty data array');
      return [];
    }
    
    const firstRow = dataArray[0];
    console.log('🔍 First row sample:', firstRow);
    
    const columns = Object.keys(firstRow).map(key => ({
      title: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' '),
      dataIndex: key,
      key: key,
      sorter: (a: any, b: any) => {
        if (typeof a[key] === 'number' && typeof b[key] === 'number') {
          return a[key] - b[key];
        }
        if (typeof a[key] === 'string' && typeof b[key] === 'string') {
          return a[key].localeCompare(b[key]);
        }
        return 0;
      },
      render: (value: any) => {
        if (typeof value === 'number' && key.toLowerCase().includes('price')) {
          return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
          }).format(value);
        }
        if (typeof value === 'number' && (key.toLowerCase().includes('quantity') || key.toLowerCase().includes('stock'))) {
          return new Intl.NumberFormat('vi-VN').format(value);
        }
        if (key.toLowerCase().includes('date')) {
          return dayjs(value).format('DD/MM/YYYY HH:mm:ss');
        }
        return value;
      }
    }));
    
    console.log('🏗️ Generated columns:', columns.map(col => col.title));
    return columns;
  };

  // Hàm xử lý báo cáo tồn kho
  const handleInventoryReport = (action: 'excel' | 'view') => {
    const params: any = {};
    
    if (filters.category) {
      params.category = filters.category;
    }
    
    console.log('📦 Inventory Report Params:', params);
    
    if (action === 'excel') {
      downloadExcelReport('inventory-export', params);
    } else {
      // For inventory report, only pass category-specific params
      fetchReportData('inventory-export', { ...params, showError: true });
    }
  };

  // Hàm xử lý báo cáo giao dịch kho
  const handleTransactionsReport = (action: 'excel' | 'view') => {
    const params: any = {};
    
    console.log('🔍 DEBUG - handleTransactionsReport called with:', {
      action,
      filtersState: filters,
      dateRangeExists: !!filters.dateRange,
      dateRangeValues: filters.dateRange
    });
    
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
      params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      console.log('📅 Date range applied (Transactions):', {
        original: filters.dateRange,
        startDate: params.startDate,
        endDate: params.endDate,
        startDateType: typeof params.startDate,
        endDateType: typeof params.endDate
      });
    } else {
      console.log('📅 No date range selected for transactions - filters.dateRange:', filters.dateRange);
    }
    
    if (filters.type) {
      params.type = filters.type;
    }
    
    if (filters.category) {
      params.category = filters.category;
    }

    console.log('🔄 Transactions Report Params:', params);
    
    if (action === 'excel') {
      downloadExcelReport('transactions-export', params);
    } else {
      fetchReportData('transactions-export', { ...params, showError: true });
    }
  };

  // Hàm xử lý báo cáo đơn hàng
  const handleOrdersReport = (action: 'excel' | 'view') => {
    const params: any = {};
    
    console.log('🔍 DEBUG - handleOrdersReport called with:', {
      action,
      filtersState: filters,
      dateRangeExists: !!filters.dateRange,
      dateRangeValues: filters.dateRange
    });
    
    if (filters.dateRange && filters.dateRange[0] && filters.dateRange[1]) {
      params.startDate = filters.dateRange[0].format('YYYY-MM-DD');
      params.endDate = filters.dateRange[1].format('YYYY-MM-DD');
      console.log('📅 Orders date range applied:', {
        original: filters.dateRange,
        startDate: params.startDate,
        endDate: params.endDate,
        startDateType: typeof params.startDate,
        endDateType: typeof params.endDate
      });
    } else {
      console.log('📅 No date range selected for orders - filters.dateRange:', filters.dateRange);
    }
    
    if (filters.status) {
      params.status = filters.status;
    }

    console.log('🛒 Orders Report Params:', params);
    
    if (action === 'excel') {
      downloadExcelReport('orders-export', params);
    } else {
      fetchReportData('orders-export', { ...params, showError: true });
    }
  };

  // Define tab items for Tabs component
  const tabItems = [
    {
      key: '1',
      label: 'Xuất Excel',
      children: (
        <>
          {/* Bộ lọc cho xuất Excel */}
          <Card title="Bộ lọc báo cáo" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Text strong>Khoảng thời gian:</Text>
                <RangePicker
                  style={{ width: '100%', marginTop: 8 }}
                  value={filters.dateRange}
                  onChange={(dates) => {
                    console.log('📅 Date range changed (Reports):', dates);
                    if (dates) {
                      setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] });
                    } else {
                      setFilters({ ...filters, dateRange: null as any });
                    }
                  }}
                  format="DD/MM/YYYY"
                  allowClear
                />
              </Col>
              <Col span={8}>
                <Text strong>Danh mục:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn danh mục"
                  allowClear
                  value={filters.category}
                  onChange={(value) => setFilters({ ...filters, category: value })}
                >
                  {categories.map(category => (
                    <Option key={category.id} value={category.name}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <Text strong>Loại giao dịch:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn loại giao dịch"
                  allowClear
                  value={filters.type}
                  onChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <Option value="in">Nhập kho</Option>
                  <Option value="out">Xuất kho</Option>
                  <Option value="adjustment">Điều chỉnh</Option>
                </Select>
              </Col>
            </Row>
          </Card>

          <Row gutter={[24, 24]}>
            {/* Báo cáo tồn kho */}
            <Col span={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div style={{ 
                    padding: 24, 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    textAlign: 'center'
                  }}>
                    <InboxOutlined style={{ fontSize: 48, color: '#fff' }} />
                  </div>
                }
                actions={[
                  <Button
                    key="excel"
                    type="primary"
                    icon={<FileExcelOutlined />}
                    loading={loading}
                    onClick={() => handleInventoryReport('excel')}
                    block
                  >
                    Xuất Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      <Tag color="blue">Tồn kho</Tag>
                      <Text strong>Báo cáo tồn kho</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        Báo cáo chi tiết về tình trạng tồn kho các sản phẩm:
                      </Text>
                      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                        <li>Số lượng tồn kho hiện tại</li>
                        <li>Giá trị tồn kho</li>
                        <li>Sản phẩm sắp hết hàng</li>
                        <li>Phân loại theo danh mục</li>
                      </ul>
                    </div>
                  }
                />
              </Card>
            </Col>

            {/* Báo cáo giao dịch kho */}
            <Col span={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div style={{ 
                    padding: 24, 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    textAlign: 'center'
                  }}>
                    <SwapOutlined style={{ fontSize: 48, color: '#fff' }} />
                  </div>
                }
                actions={[
                  <Button
                    key="excel"
                    type="primary"
                    icon={<FileExcelOutlined />}
                    loading={loading}
                    onClick={() => handleTransactionsReport('excel')}
                    block
                  >
                    Xuất Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      <Tag color="purple">Giao dịch</Tag>
                      <Text strong>Báo cáo giao dịch kho</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        Báo cáo chi tiết về các giao dịch xuất nhập kho:
                      </Text>
                      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                        <li>Lịch sử nhập/xuất kho</li>
                        <li>Thông tin người thực hiện</li>
                        <li>Lý do giao dịch</li>
                        <li>Liên kết đơn hàng</li>
                      </ul>
                    </div>
                  }
                />
              </Card>
            </Col>

            {/* Báo cáo đơn hàng */}
            <Col span={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div style={{ 
                    padding: 24, 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    textAlign: 'center'
                  }}>
                    <ShoppingCartOutlined style={{ fontSize: 48, color: '#fff' }} />
                  </div>
                }
                actions={[
                  <Button
                    key="excel"
                    type="primary"
                    icon={<FileExcelOutlined />}
                    loading={loading}
                    onClick={() => handleOrdersReport('excel')}
                    block
                  >
                    Xuất Excel
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      <Tag color="cyan">Đơn hàng</Tag>
                      <Text strong>Báo cáo đơn hàng</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        Báo cáo tổng hợp về các đơn hàng:
                      </Text>
                      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                        <li>Thông tin khách hàng</li>
                        <li>Chi tiết sản phẩm</li>
                        <li>Trạng thái đơn hàng</li>
                        <li>Tổng doanh thu</li>
                      </ul>
                    </div>
                  }
                />
              </Card>
            </Col>
          </Row>
        </>
      )
    },
    {
      key: '2',
      label: 'Thống kê',
      children: (
        <>
          {/* Bộ lọc cho thống kê */}
          <Card title="Bộ lọc dữ liệu" style={{ marginBottom: 24 }}>
            <Row gutter={[16, 16]}>
              <Col span={8}>
                <Text strong>Khoảng thời gian:</Text>
                <RangePicker
                  style={{ width: '100%', marginTop: 8 }}
                  value={filters.dateRange}
                  onChange={(dates) => {
                    console.log('📅 Date range changed (Statistics):', dates);
                    if (dates) {
                      setFilters({ ...filters, dateRange: dates as [dayjs.Dayjs, dayjs.Dayjs] });
                    } else {
                      setFilters({ ...filters, dateRange: null as any });
                    }
                  }}
                  format="DD/MM/YYYY"
                  allowClear
                />
              </Col>
              <Col span={8}>
                <Text strong>Danh mục:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn danh mục"
                  allowClear
                  value={filters.category}
                  onChange={(value) => setFilters({ ...filters, category: value })}
                >
                  {categories.map(category => (
                    <Option key={category.id} value={category.name}>
                      {category.name}
                    </Option>
                  ))}
                </Select>
              </Col>
              <Col span={8}>
                <Text strong>Loại giao dịch:</Text>
                <Select
                  style={{ width: '100%', marginTop: 8 }}
                  placeholder="Chọn loại giao dịch"
                  allowClear
                  value={filters.type}
                  onChange={(value) => setFilters({ ...filters, type: value })}
                >
                  <Option value="in">Nhập kho</Option>
                  <Option value="out">Xuất kho</Option>
                  <Option value="adjustment">Điều chỉnh</Option>
                </Select>
              </Col>
            </Row>
          </Card>

          <Row gutter={[24, 24]}>
            {/* Báo cáo tồn kho */}
            <Col span={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div style={{ 
                    padding: 24, 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    textAlign: 'center'
                  }}>
                    <InboxOutlined style={{ fontSize: 48, color: '#fff' }} />
                  </div>
                }
                actions={[
                  <Button
                    key="view"
                    type="primary"
                    icon={<EyeOutlined />}
                    loading={dataLoading}
                    onClick={() => handleInventoryReport('view')}
                    block
                  >
                    Xem dữ liệu
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      <Tag color="blue">Tồn kho</Tag>
                      <Text strong>Báo cáo tồn kho</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        Hiển thị dữ liệu tồn kho trực tiếp trên trang:
                      </Text>
                      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                        <li>Số lượng tồn kho hiện tại</li>
                        <li>Giá trị tồn kho</li>
                        <li>Sản phẩm sắp hết hàng</li>
                        <li>Phân loại theo danh mục</li>
                      </ul>
                    </div>
                  }
                />
              </Card>
            </Col>

            {/* Báo cáo giao dịch kho */}
            <Col span={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div style={{ 
                    padding: 24, 
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    textAlign: 'center'
                  }}>
                    <SwapOutlined style={{ fontSize: 48, color: '#fff' }} />
                  </div>
                }
                actions={[
                  <Button
                    key="view"
                    type="primary"
                    icon={<EyeOutlined />}
                    loading={dataLoading}
                    onClick={() => handleTransactionsReport('view')}
                    block
                  >
                    Xem dữ liệu
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      <Tag color="purple">Giao dịch</Tag>
                      <Text strong>Báo cáo giao dịch kho</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        Hiển thị dữ liệu giao dịch kho trực tiếp:
                      </Text>
                      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                        <li>Lịch sử nhập/xuất kho</li>
                        <li>Thông tin người thực hiện</li>
                        <li>Lý do giao dịch</li>
                        <li>Liên kết đơn hàng</li>
                      </ul>
                    </div>
                  }
                />
              </Card>
            </Col>

            {/* Báo cáo đơn hàng */}
            <Col span={8}>
              <Card
                hoverable
                style={{ height: '100%' }}
                cover={
                  <div style={{ 
                    padding: 24, 
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    textAlign: 'center'
                  }}>
                    <ShoppingCartOutlined style={{ fontSize: 48, color: '#fff' }} />
                  </div>
                }
                actions={[
                  <Button
                    key="view"
                    type="primary"
                    icon={<EyeOutlined />}
                    loading={dataLoading}
                    onClick={() => handleOrdersReport('view')}
                    block
                  >
                    Xem dữ liệu
                  </Button>
                ]}
              >
                <Card.Meta
                  title={
                    <Space>
                      <Tag color="cyan">Đơn hàng</Tag>
                      <Text strong>Báo cáo đơn hàng</Text>
                    </Space>
                  }
                  description={
                    <div>
                      <Text type="secondary">
                        Hiển thị dữ liệu đơn hàng trực tiếp:
                      </Text>
                      <ul style={{ marginTop: 8, paddingLeft: 16 }}>
                        <li>Thông tin khách hàng</li>
                        <li>Chi tiết sản phẩm</li>
                        <li>Trạng thái đơn hàng</li>
                        <li>Tổng doanh thu</li>
                      </ul>
                    </div>
                  }
                />
              </Card>
            </Col>
          </Row>

          {/* Loading state cho tab Thống kê */}
          {dataLoading && (
            <Card 
              title={
                <Space>
                  <BarChartOutlined />
                  <Text strong>Đang tải dữ liệu...</Text>
                </Space>
              }
              style={{ marginTop: 24 }}
            >
              <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16, color: '#666' }}>
                  Đang tải dữ liệu báo cáo, vui lòng đợi...
                </div>
              </div>
            </Card>
          )}

          {/* Hiển thị dữ liệu báo cáo */}
          {reportData && (() => {
            // Extract data array for display
            let dataArray = reportData;
            if (!Array.isArray(reportData)) {
              if (reportData.data && Array.isArray(reportData.data)) {
                dataArray = reportData.data;
              } else {
                dataArray = [];
              }
            }
            
            console.log('📊 Final dataArray for display:', dataArray);
            
            return dataArray.length > 0 ? (
              <Card 
                title={
                  <Space>
                    <BarChartOutlined />
                    <Text strong>
                      {currentReportType === 'inventory-export' && 'Dữ liệu báo cáo tồn kho'}
                      {currentReportType === 'transactions-export' && 'Dữ liệu báo cáo giao dịch kho'}
                      {currentReportType === 'orders-export' && 'Dữ liệu báo cáo đơn hàng'}
                    </Text>
                    <Tag color="blue">{dataArray.length} mục</Tag>
                  </Space>
                }
                extra={
                  <Button 
                    type="text" 
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      const reportName = currentReportType.replace('-export', '');
                      if (reportName === 'inventory') handleInventoryReport('excel');
                      if (reportName === 'transactions') handleTransactionsReport('excel');
                      if (reportName === 'orders') handleOrdersReport('excel');
                    }}
                  >
                    Xuất Excel
                  </Button>
                }
                style={{ marginTop: 24 }}
              >
                <Spin spinning={dataLoading}>
                  <Table
                    dataSource={dataArray}
                    columns={getTableColumns()}
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showQuickJumper: true,
                      showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} mục`
                    }}
                    scroll={{ x: 'max-content' }}
                    size="small"
                    bordered
                  />
                </Spin>
              </Card>
            ) : (
              <Card 
                title={
                  <Space>
                    <BarChartOutlined />
                    <Text strong>
                      {currentReportType === 'inventory-export' && 'Dữ liệu báo cáo tồn kho'}
                      {currentReportType === 'transactions-export' && 'Dữ liệu báo cáo giao dịch kho'}
                      {currentReportType === 'orders-export' && 'Dữ liệu báo cáo đơn hàng'}
                    </Text>
                    <Tag color="orange">0 mục</Tag>
                  </Space>
                }
                style={{ marginTop: 24 }}
              >
                <Alert
                  message="Không có dữ liệu"
                  description="Không tìm thấy dữ liệu phù hợp với bộ lọc đã chọn. Vui lòng thử điều chỉnh bộ lọc hoặc chọn khoảng thời gian khác."
                  type="warning"
                  showIcon
                />
              </Card>
            );
          })()}
          
          {/* Hiển thị hướng dẫn khi chưa có dữ liệu */}
          {!dataLoading && !reportData && (
            <Card 
              title={
                <Space>
                  <BarChartOutlined />
                  <Text strong>Hướng dẫn xem dữ liệu</Text>
                </Space>
              }
              style={{ marginTop: 24 }}
            >
              <Alert
                message="Chưa có dữ liệu được tải"
                description={
                  <div>
                    <p>Để xem dữ liệu thống kê, vui lòng:</p>
                    <ol style={{ paddingLeft: 20 }}>
                      <li>Chọn bộ lọc phù hợp (khoảng thời gian, danh mục, loại giao dịch)</li>
                      <li>Click nút <strong>"Xem dữ liệu"</strong> trên loại báo cáo bạn muốn xem</li>
                      <li>Dữ liệu sẽ hiển thị dưới dạng bảng tại đây</li>
                    </ol>
                    <p><strong>Lưu ý:</strong> Báo cáo tồn kho sẽ tự động tải khi vào tab này.</p>
                  </div>
                }
                type="info"
                showIcon
              />
            </Card>
          )}
        </>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>
        <BarChartOutlined style={{ marginRight: 8, color: '#1890ff' }} />
        Báo cáo & Thống kê
      </Title>
      
      <Alert
        message="Hướng dẫn sử dụng"
        description="Chọn tab 'Xuất Excel' để tải file báo cáo hoặc tab 'Thống kê' để xem dữ liệu trực tiếp trên trang."
        type="info"
        showIcon
        style={{ marginBottom: 24 }}
      />

      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        defaultActiveKey="1" 
        size="large"
        items={tabItems}
      />
    </div>
  );
};

export default ReportsPage;
