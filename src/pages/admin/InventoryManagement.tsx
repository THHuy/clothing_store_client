import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Card,
  Table,
  Button,
  Input,
  Select,
  Space,
  Tag,
  Modal,
  Form,
  InputNumber,
  message,
  Row,
  Col,
  Statistic,
  Tooltip,
  Badge,
  Image,
  Typography,
  Tabs,
  DatePicker,
  Spin,
  Alert,
} from 'antd';
import PlusOutlined from '@ant-design/icons/es/icons/PlusOutlined';
import MinusOutlined from '@ant-design/icons/es/icons/MinusOutlined';
import EditOutlined from '@ant-design/icons/es/icons/EditOutlined';
import SearchOutlined from '@ant-design/icons/es/icons/SearchOutlined';
import ReloadOutlined from '@ant-design/icons/es/icons/ReloadOutlined';
import WarningOutlined from '@ant-design/icons/es/icons/WarningOutlined';
import ShoppingCartOutlined from '@ant-design/icons/es/icons/ShoppingCartOutlined';
import DollarOutlined from '@ant-design/icons/es/icons/DollarOutlined';
import InboxOutlined from '@ant-design/icons/es/icons/InboxOutlined';
import UserOutlined from '@ant-design/icons/es/icons/UserOutlined';
import type { ColumnsType } from 'antd/es/table';
import dayjs, { Dayjs } from 'dayjs';
import { getImageUrl } from '../../utils/imageUtils';
import { useAuth } from '../../contexts/AuthContext';

// API request function
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const getAuthToken = (): string | null => {
  const authData = localStorage.getItem('auth');
  if (authData) {
    try {
      const parsedData = JSON.parse(authData);
      const { token } = parsedData;
      let { tokenExpiration } = parsedData;
      
      if (!token) return null;
      
      // Nếu không có tokenExpiration (từ phiên cũ), coi như token vẫn hợp lệ và tạo expiration mới
      if (!tokenExpiration) {
        tokenExpiration = Date.now() + (7 * 24 * 60 * 60 * 1000);
        console.log('🔐 No expiration in Inventory, setting 7 days from now');
        
        // Cập nhật localStorage với tokenExpiration
        const { user } = parsedData;
        if (user) {
          localStorage.setItem('auth', JSON.stringify({ token, user, tokenExpiration }));
        }
        return token; // Trả về token vì chúng ta vừa tạo expiration mới
      }
      
      // Check if token is still valid
      if (Date.now() < tokenExpiration) {
        return token;
      } else {
        // Token expired, clear auth data
        localStorage.removeItem('auth');
        window.location.href = '/admin/login';
        return null;
      }
    } catch (error) {
      console.error('Error parsing auth data:', error);
      localStorage.removeItem('auth');
      return null;
    }
  }
  return null;
};

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  if (!token) {
    throw new Error('No valid authentication token available');
  }
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  };

  const response = await fetch(url, config);
  
  // Handle token expiration
  if (response.status === 401 || response.status === 403) {
    localStorage.removeItem('auth');
    window.location.href = '/login';
    throw new Error('Authentication failed. Please login again.');
  }
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};

const { Option } = Select;
const { Text, Title } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

// Types từ API response
interface InventoryVariant {
  id: number;
  size: string;
  color: string;
  stock: number;
  minStock: number;
  currentStock: number;
  product: {
    id: number;
    name: string;
    sku: string;
    category: {
      id: number;
      name: string;
      slug: string;
    } | string;
    images?: string[];
  };
}

interface Product {
  id: number;
  name: string;
  sku: string;
  category: {
    id: number;
    name: string;
    slug: string;
  } | string;
  brand: string;
  material: string;
  description: string;
  images: string[];
  purchasePrice: number;
  salePrice: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProductVariant {
  id?: number;
  productId: number;
  size: string;
  color: string;
  stock: number;
  minStock: number;
}

interface InventoryTransaction {
  id: number;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  supplier?: string;
  createdAt: string;
  variant: {
    id: number;
    size: string;
    color: string;
    currentStock: number;
  };
  product: {
    id: number;
    name: string;
    sku: string;
    category: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
  };
}

interface InventorySummary {
  overview: {
    totalProducts: number;
    totalVariants: number;
    totalStockUnits: number;
    totalStockValue: number;
    lowStockVariants: number;
    outOfStockVariants: number;
  };
  categoryBreakdown: Array<{
    id: number;
    name: string;
    productCount: number;
    variantCount: number;
    totalStock: number;
    stockValue: number;
  }>;
  recentTransactions: Array<{
    id: number;
    type: string;
    quantity: number;
    reason: string;
    createdAt: string;
    product: {
      name: string;
      sku: string;
      variant: string;
    };
    user: string;
  }>;
}

const InventoryManagement: React.FC = () => {
  const { state: authState } = useAuth();
  const [searchParams] = useSearchParams();
  
  // State management
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Handle URL parameters for tab navigation
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['overview', 'variants', 'transactions', 'add-products'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);
  
  // Overview data
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  
  // Variants data
  const [variants, setVariants] = useState<InventoryVariant[]>([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [variantsFilter, setVariantsFilter] = useState({
    search: '',
    category: '',
    lowStock: false,
    outOfStock: false,
  });
  
  // Products data for adding to inventory
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsFilter, setProductsFilter] = useState({
    search: '',
    category: '',
  });
  
  // Transactions data
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [transactionsPagination, setTransactionsPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });
  const [transactionsFilter, setTransactionsFilter] = useState({
    type: '',
    dateRange: null as [Dayjs, Dayjs] | null,
    search: '',
  });
  
  // Modals
  const [stockInModal, setStockInModal] = useState({ visible: false, variant: null as InventoryVariant | null });
  const [stockOutModal, setStockOutModal] = useState({ visible: false, variant: null as InventoryVariant | null });
  const [adjustModal, setAdjustModal] = useState({ visible: false, variant: null as InventoryVariant | null });
  const [addProductModal, setAddProductModal] = useState({ visible: false, product: null as Product | null });
  const [variantModal, setVariantModal] = useState({ visible: false, product: null as Product | null, variant: null as ProductVariant | null });
  const [operationLoading, setOperationLoading] = useState(false);
  
  // Forms
  const [stockInForm] = Form.useForm();
  const [stockOutForm] = Form.useForm();
  const [adjustForm] = Form.useForm();
  const [addProductForm] = Form.useForm();
  const [variantForm] = Form.useForm();

  // Load data functions
  const loadSummary = async () => {
    try {
      setLoading(true);
      
      // Kiểm tra authentication trước khi gọi API
      if (!authState.isAuthenticated || !authState.token) {
        message.warning('Vui lòng đăng nhập để truy cập trang này');
        return;
      }
      
      console.log('🔍 Loading summary data...');
      const response = await apiRequest('/inventory/summary');
      console.log('📊 Summary response:', response);
      
      if (response.success) {
        setSummary(response.data);
        console.log('✅ Summary data set successfully:', response.data);
      } else {
        console.error('❌ Summary API failed:', response);
        message.error('Không thể tải tổng quan kho hàng');
      }
    } catch (error: any) {
      console.error('❌ Load summary error:', error);
      if (error.message.includes('403')) {
        message.error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
      } else {
        message.error('Lỗi khi tải tổng quan kho hàng');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadVariants = async () => {
    try {
      setVariantsLoading(true);
      
      // Kiểm tra authentication
      if (!authState.isAuthenticated || !authState.token) {
        message.warning('Vui lòng đăng nhập để truy cập dữ liệu');
        return;
      }
      
      const params = new URLSearchParams();
      
      if (variantsFilter.search) {
        params.append('search', variantsFilter.search);
      }
      if (variantsFilter.category) {
        params.append('category', variantsFilter.category);
      }
      if (variantsFilter.lowStock) {
        params.append('lowStock', 'true');
      }
      if (variantsFilter.outOfStock) {
        params.append('outOfStock', 'true');
      }
      
      const response = await apiRequest(`/inventory/variants?${params.toString()}`);
      if (response.success) {
        setVariants(response.data);
      } else {
        message.error('Không thể tải danh sách biến thể');
      }
    } catch (error: any) {
      console.error('Load variants error:', error);
      if (error.message.includes('403')) {
        message.error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
      } else {
        message.error('Lỗi khi tải danh sách biến thể');
      }
    } finally {
      setVariantsLoading(false);
    }
  };

  const loadTransactions = async (page = 1, pageSize = 10) => {
    try {
      setTransactionsLoading(true);
      const params = new URLSearchParams();
      
      params.append('page', page.toString());
      params.append('limit', pageSize.toString());
      
      if (transactionsFilter.type) {
        params.append('type', transactionsFilter.type);
      }
      if (transactionsFilter.search) {
        params.append('search', transactionsFilter.search);
      }
      if (transactionsFilter.dateRange) {
        params.append('startDate', transactionsFilter.dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', transactionsFilter.dateRange[1].format('YYYY-MM-DD'));
      }
      
      const response = await apiRequest(`/inventory/transactions?${params.toString()}`);
      if (response.success) {
        setTransactions(response.data);
        // Check if pagination exists in response
        if (response.pagination) {
          setTransactionsPagination({
            current: response.pagination.page,
            pageSize: response.pagination.limit,
            total: response.pagination.total,
          });
        } else {
          // Fallback if no pagination in response
          setTransactionsPagination({
            current: page,
            pageSize: pageSize,
            total: response.data.length,
          });
        }
      } else {
        message.error('Không thể tải lịch sử giao dịch');
      }
    } catch (error) {
      console.error('Load transactions error:', error);
      message.error('Lỗi khi tải lịch sử giao dịch');
    } finally {
      setTransactionsLoading(false);
    }
  };

  const loadProducts = async () => {
    try {
      setProductsLoading(true);
      
      // Kiểm tra authentication
      if (!authState.isAuthenticated || !authState.token) {
        message.warning('Vui lòng đăng nhập để truy cập dữ liệu');
        return;
      }
      
      const params = new URLSearchParams();
      
      if (productsFilter.search) {
        params.append('search', productsFilter.search);
      }
      if (productsFilter.category) {
        params.append('category', productsFilter.category);
      }
      
      const response = await apiRequest(`/products/admin/all?${params.toString()}`);
      if (response.success) {
        setProducts(response.data);
      } else {
        message.error('Không thể tải danh sách sản phẩm');
      }
    } catch (error: any) {
      console.error('Load products error:', error);
      if (error.message.includes('403')) {
        message.error('Không có quyền truy cập. Vui lòng đăng nhập lại.');
      } else {
        message.error('Lỗi khi tải danh sách sản phẩm');
      }
    } finally {
      setProductsLoading(false);
    }
  };

  // Stock operations
  const handleStockIn = async (values: any) => {
    try {
      setOperationLoading(true);
      const response = await apiRequest('/inventory/stock-in', {
        method: 'POST',
        body: JSON.stringify({
          variantId: stockInModal.variant?.id,
          quantity: values.quantity,
          reason: values.reason,
          supplier: values.supplier,
        }),
      });
      
      if (response.success) {
        message.success('Nhập kho thành công');
        setStockInModal({ visible: false, variant: null });
        stockInForm.resetFields();
        loadVariants();
        loadSummary();
        if (activeTab === 'transactions') {
          loadTransactions();
        }
      } else {
        message.error(response.message || 'Không thể nhập kho');
      }
    } catch (error: any) {
      console.error('Stock in error:', error);
      message.error('Lỗi khi nhập kho');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleCreateVariant = async (values: any) => {
    try {
      setOperationLoading(true);
      const variantData = {
        productId: variantModal.product?.id,
        size: values.size,
        color: values.color,
        stock: values.stock || 0,
        minStock: values.minStock || 0,
      };

      const response = await apiRequest('/variants', {
        method: 'POST',
        body: JSON.stringify(variantData),
      });
      
      if (response.success) {
        message.success('Thêm biến thể thành công');
        setVariantModal({ visible: false, product: null, variant: null });
        variantForm.resetFields();
        loadVariants();
        loadSummary();
      } else {
        message.error(response.message || 'Không thể thêm biến thể');
      }
    } catch (error: any) {
      console.error('Create variant error:', error);
      message.error('Lỗi khi thêm biến thể');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleBulkStockIn = async (values: any) => {
    try {
      setOperationLoading(true);
      const stockData = {
        transactions: values.variants?.map((variant: any) => ({
          productId: addProductModal.product?.id,
          size: variant.size,
          color: variant.color,
          quantity: variant.quantity,
          minStock: variant.minStock || 5,
          type: 'IN'
        })) || [],
        reason: values.reason,
        supplier: values.supplier,
      };

      const response = await apiRequest('/inventory/bulk-transaction', {
        method: 'POST',
        body: JSON.stringify(stockData),
      });
      
      if (response.success) {
        message.success('Nhập kho nhiều biến thể thành công');
        setAddProductModal({ visible: false, product: null });
        addProductForm.resetFields();
        loadVariants();
        loadSummary();
      } else {
        message.error(response.message || 'Không thể nhập kho');
      }
    } catch (error: any) {
      console.error('Bulk stock in error:', error);
      message.error('Lỗi khi nhập kho');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleStockOut = async (values: any) => {
    try {
      setOperationLoading(true);
      const response = await apiRequest('/inventory/stock-out', {
        method: 'POST',
        body: JSON.stringify({
          variantId: stockOutModal.variant?.id,
          quantity: values.quantity,
          reason: values.reason,
          // Customer information for order creation
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          customerEmail: values.customerEmail,
        }),
      });
      
      if (response.success) {
        message.success('Xuất kho thành công - Đơn hàng đã được tạo tự động');
        setStockOutModal({ visible: false, variant: null });
        stockOutForm.resetFields();
        loadVariants();
        loadSummary();
        if (activeTab === 'transactions') {
          loadTransactions();
        }
      } else {
        message.error(response.message || 'Không thể xuất kho');
      }
    } catch (error: any) {
      console.error('Stock out error:', error);
      message.error('Lỗi khi xuất kho');
    } finally {
      setOperationLoading(false);
    }
  };

  const handleStockAdjust = async (values: any) => {
    try {
      setOperationLoading(true);
      const response = await apiRequest('/inventory/stock-adjust', {
        method: 'POST',
        body: JSON.stringify({
          variantId: adjustModal.variant?.id,
          newStock: values.newStock,
          reason: values.reason,
        }),
      });
      
      if (response.success) {
        message.success('Điều chỉnh kho thành công');
        setAdjustModal({ visible: false, variant: null });
        adjustForm.resetFields();
        loadVariants();
        loadSummary();
        if (activeTab === 'transactions') {
          loadTransactions();
        }
      } else {
        message.error(response.message || 'Không thể điều chỉnh kho');
      }
    } catch (error: any) {
      console.error('Stock adjust error:', error);
      message.error('Lỗi khi điều chỉnh kho');
    } finally {
      setOperationLoading(false);
    }
  };

  // Load data on component mount and tab change
  useEffect(() => {
    if (authState.isAuthenticated) {
      loadSummary();
    }
  }, [authState.isAuthenticated]);

  useEffect(() => {
    if (authState.isAuthenticated) {
      if (activeTab === 'variants') {
        loadVariants();
      } else if (activeTab === 'transactions') {
        loadTransactions(1, 10);
      } else if (activeTab === 'add-products') {
        loadProducts();
      }
    }
  }, [activeTab, authState.isAuthenticated]);

  useEffect(() => {
    if (authState.isAuthenticated && activeTab === 'variants') {
      loadVariants();
    }
  }, [variantsFilter, authState.isAuthenticated]);

  useEffect(() => {
    if (authState.isAuthenticated && activeTab === 'add-products') {
      loadProducts();
    }
  }, [productsFilter, authState.isAuthenticated]);

  useEffect(() => {
    if (authState.isAuthenticated && activeTab === 'transactions') {
      loadTransactions(1, transactionsPagination.pageSize);
    }
  }, [transactionsFilter, authState.isAuthenticated]);

  // Table columns for variants
  const variantColumns: ColumnsType<InventoryVariant> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 350, // Increased width to better accommodate text
      render: (_, record) => (
        <Space size={12}>
          <Image
            width={50}
            height={50}
            src={getImageUrl(record.product.images?.[0] || '')}
            fallback="/default-product.jpg"
            preview={false}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.product.name}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>SKU: {record.product.sku}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>Category: {typeof record.product.category === 'object' ? record.product.category.name : record.product.category}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Biến thể',
      key: 'variant',
      width: 150, // Increased width for better tag display
      render: (_, record) => (
        <div>
          <Tag color="blue">{record.size}</Tag>
          <Tag color="purple">{record.color}</Tag>
        </div>
      ),
    },
    {
      title: 'Tồn kho hiện tại',
      dataIndex: 'stock',
      key: 'stock',
      width: 100,
      align: 'center',
      render: (stock, record) => {
        let color = 'green';
        if (stock === 0) color = 'red';
        else if (stock <= record.minStock) color = 'orange';
        
        return (
          <Badge
            count={stock <= record.minStock ? <WarningOutlined style={{ color: '#ff4d4f' }} /> : 0}
            offset={[10, 0]}
          >
            <Tag color={color} style={{ minWidth: 50, textAlign: 'center' }}>
              {stock}
            </Tag>
          </Badge>
        );
      },
    },
    {
      title: 'Tồn kho tối thiểu',
      dataIndex: 'minStock',
      key: 'minStock',
      width: 80,
      align: 'center',
      render: (minStock) => <Text type="secondary">{minStock}</Text>,
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 100,
      render: (_, record) => {
        if (record.stock === 0) {
          return <Tag color="red">Hết hàng</Tag>;
        } else if (record.stock <= record.minStock) {
          return <Tag color="orange">Sắp hết</Tag>;
        } else {
          return <Tag color="green">Còn hàng</Tag>;
        }
      },
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Nhập kho">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setStockInModal({ visible: true, variant: record })}
            />
          </Tooltip>
          <Tooltip title="Xuất kho">
            <Button
              size="small"
              icon={<MinusOutlined />}
              onClick={() => setStockOutModal({ visible: true, variant: record })}
              disabled={record.stock === 0}
            />
          </Tooltip>
          <Tooltip title="Điều chỉnh tồn kho">
            <Button
              size="small"
              icon={<EditOutlined />}
              onClick={() => setAdjustModal({ visible: true, variant: record })}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Table columns for transactions
  const transactionColumns: ColumnsType<InventoryTransaction> = [
    {
      title: 'Ngày tháng',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
    },
    {
      title: 'Loại',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type) => {
        const config = {
          in: { color: 'green', icon: <PlusOutlined />, text: 'Nhập kho' },
          out: { color: 'red', icon: <MinusOutlined />, text: 'Xuất kho' },
          adjustment: { color: 'blue', icon: <EditOutlined />, text: 'Điều chỉnh' },
        };
        const item = config[type as keyof typeof config];
        return (
          <Tag color={item.color} icon={item.icon}>
            {item.text}
          </Tag>
        );
      },
    },
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 200,
      render: (_, record) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{record.product.name}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>
            {record.product.sku} - {record.variant.size}/{record.variant.color}
          </div>
        </div>
      ),
    },
    {
      title: 'Số lượng',
      dataIndex: 'quantity',
      key: 'quantity',
      width: 80,
      align: 'center',
      render: (quantity, record) => (
        <Text style={{ color: record.type === 'out' ? '#ff4d4f' : '#52c41a' }}>
          {record.type === 'out' ? '-' : '+'}{quantity}
        </Text>
      ),
    },
    {
      title: 'Lý do',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Người thực hiện',
      key: 'user',
      width: 150,
      render: (_, record) => (
        <div>
          <div>{record.user.name}</div>
          <div style={{ color: '#666', fontSize: '12px' }}>{record.user.email}</div>
        </div>
      ),
    },
  ];

  // Table columns for products (to add to inventory)
  const productColumns: ColumnsType<Product> = [
    {
      title: 'Sản phẩm',
      key: 'product',
      width: 300,
      render: (_, record) => (
        <Space size={12}>
          <Image
            width={50}
            height={50}
            src={getImageUrl(record.images?.[0] || '')}
            fallback="/default-product.jpg"
            preview={false}
            style={{ objectFit: 'cover', borderRadius: 4 }}
          />
          <div>
            <div style={{ fontWeight: 'bold' }}>{record.name}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>SKU: {record.sku}</div>
            <div style={{ color: '#666', fontSize: '12px' }}>Brand: {record.brand}</div>
          </div>
        </Space>
      ),
    },
    {
      title: 'Danh mục',
      dataIndex: 'category',
      key: 'category',
      width: 120,
      render: (category) => <Tag color="blue">{typeof category === 'object' ? category.name : category}</Tag>,
    },
    {
      title: 'Giá nhập',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      width: 100,
      align: 'right',
      render: (price) => `${price?.toLocaleString('vi-VN')}₫`,
    },
    {
      title: 'Giá bán',
      dataIndex: 'salePrice',
      key: 'salePrice',
      width: 100,
      align: 'right',
      render: (price) => `${price?.toLocaleString('vi-VN')}₫`,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 80,
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? 'Hoạt động' : 'Ngưng bán'}
        </Tag>
      ),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Thêm biến thể">
            <Button
              type="primary"
              size="small"
              icon={<PlusOutlined />}
              onClick={() => setVariantModal({ visible: true, product: record, variant: null })}
            >
              Biến thể
            </Button>
          </Tooltip>
          <Tooltip title="Nhập kho hàng loạt">
            <Button
              size="small"
              icon={<InboxOutlined />}
              onClick={() => setAddProductModal({ visible: true, product: record })}
            >
              Nhập kho
            </Button>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Kiểm tra authentication */}
      {!authState.isAuthenticated ? (
        <div style={{ textAlign: 'center', marginTop: '100px' }}>
          <Alert
            message="Yêu cầu đăng nhập"
            description="Bạn cần đăng nhập với tài khoản admin hoặc manager để truy cập trang quản lý kho hàng."
            type="warning"
            showIcon
            action={
              <Button type="primary" onClick={() => window.location.href = '/login'}>
                Đăng nhập
              </Button>
            }
          />
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={2} style={{ margin: 0 }}>
              <InboxOutlined style={{ marginRight: '8px' }} />
              Quản lý kho hàng
            </Title>
            <Space>
              <Text type="secondary">Xin chào, {authState.user?.name}</Text>
              <Button
                type="primary"
                icon={<ReloadOutlined />}
                onClick={() => {
                  loadSummary();
                  if (activeTab === 'variants') loadVariants();
                  if (activeTab === 'transactions') loadTransactions();
                }}
              >
                Làm mới
              </Button>
            </Space>
          </div>

      <Tabs activeKey={activeTab} onChange={setActiveTab}>
        <TabPane tab="Tổng quan" key="overview">
          <Spin spinning={loading}>
            
            {summary ? (
              <>
                {/* Overview Statistics */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tổng sản phẩm"
                        value={summary.overview.totalProducts}
                        prefix={<ShoppingCartOutlined />}
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Tổng số lượng tồn kho"
                        value={summary.overview.totalStockUnits}
                        prefix={<InboxOutlined />}
                        valueStyle={{ color: '#52c41a' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Giá trị tồn kho"
                        value={summary.overview.totalStockValue}
                        prefix={<DollarOutlined />}
                        precision={0}
                        suffix="₫"
                        valueStyle={{ color: '#722ed1' }}
                      />
                    </Card>
                  </Col>
                  <Col xs={24} sm={12} md={6}>
                    <Card>
                      <Statistic
                        title="Cảnh báo sắp hết hàng"
                        value={summary.overview.lowStockVariants}
                        prefix={<WarningOutlined />}
                        valueStyle={{ color: '#fa8c16' }}
                      />
                    </Card>
                  </Col>
                </Row>

                {/* Alerts */}
                <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                  {summary.overview.outOfStockVariants > 0 && (
                    <Col span={24}>
                      <Alert
                        message={`${summary.overview.outOfStockVariants} sản phẩm đã hết hàng`}
                        type="error"
                        showIcon
                        action={
                          <Button size="small" danger onClick={() => setActiveTab('variants')}>
                            Xem chi tiết
                          </Button>
                        }
                      />
                    </Col>
                  )}
                  {summary.overview.lowStockVariants > 0 && (
                    <Col span={24}>
                      <Alert
                        message={`${summary.overview.lowStockVariants} sản phẩm sắp hết hàng`}
                        type="warning"
                        showIcon
                        action={
                          <Button size="small" onClick={() => setActiveTab('variants')}>
                            Xem chi tiết
                          </Button>
                        }
                      />
                    </Col>
                  )}
                </Row>

                {/* Recent Transactions */}
                <Card title="Giao dịch gần đây" style={{ marginBottom: '24px' }}>
                  <Table
                    dataSource={summary.recentTransactions}
                    columns={[
                      {
                        title: 'Ngày tháng',
                        dataIndex: 'createdAt',
                        render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
                      },
                      {
                        title: 'Loại',
                        dataIndex: 'type',
                        render: (type) => {
                          const config = {
                            in: { color: 'green', text: 'Nhập kho' },
                            out: { color: 'red', text: 'Xuất kho' },
                            adjustment: { color: 'blue', text: 'Điều chỉnh' },
                          };
                          const item = config[type as keyof typeof config];
                          return <Tag color={item.color}>{item.text}</Tag>;
                        },
                      },
                      {
                        title: 'Sản phẩm',
                        render: (_, record) => (
                          <div>
                            <div>{record.product.name}</div>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {record.product.sku} - {record.product.variant}
                            </Text>
                          </div>
                        ),
                      },
                      {
                        title: 'Số lượng',
                        dataIndex: 'quantity',
                        align: 'center',
                      },
                      {
                        title: 'Người thực hiện',
                        dataIndex: 'user',
                      },
                    ]}
                    pagination={false}
                    size="small"
                    rowKey="id"
                  />
                </Card>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '50px' }}>
                <Text type="secondary">Không có dữ liệu tổng quan</Text>
              </div>
            )}
          </Spin>
        </TabPane>

        <TabPane tab="Quản lý tồn kho" key="variants">
          <div style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col xs={24} sm={8} md={6}>
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  prefix={<SearchOutlined />}
                  value={variantsFilter.search}
                  onChange={(e) => setVariantsFilter({ ...variantsFilter, search: e.target.value })}
                />
              </Col>
              <Col xs={24} sm={8} md={6}>
                <Select
                  placeholder="Lọc theo danh mục"
                  style={{ width: '100%' }}
                  value={variantsFilter.category}
                  onChange={(value) => setVariantsFilter({ ...variantsFilter, category: value })}
                  allowClear
                >
                  {summary?.categoryBreakdown.map(category => (
                    <Option key={category.id} value={category.name}>{category.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={8} md={12}>
                <Space>
                  <Button
                    type={variantsFilter.lowStock ? 'primary' : 'default'}
                    onClick={() => setVariantsFilter({ ...variantsFilter, lowStock: !variantsFilter.lowStock })}
                  >
                    Chỉ sắp hết hàng
                  </Button>
                  <Button
                    type={variantsFilter.outOfStock ? 'primary' : 'default'}
                    onClick={() => setVariantsFilter({ ...variantsFilter, outOfStock: !variantsFilter.outOfStock })}
                  >
                    Chỉ hết hàng
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          <Table
            dataSource={variants}
            columns={variantColumns}
            loading={variantsLoading}
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => `Tổng cộng ${total} biến thể`,
            }}
          />
        </TabPane>

        <TabPane tab="Lịch sử giao dịch" key="transactions">
          <div style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col xs={24} sm={8} md={6}>
                <Input
                  placeholder="Tìm kiếm giao dịch..."
                  prefix={<SearchOutlined />}
                  value={transactionsFilter.search}
                  onChange={(e) => setTransactionsFilter({ ...transactionsFilter, search: e.target.value })}
                />
              </Col>
              <Col xs={24} sm={8} md={6}>
                <Select
                  placeholder="Lọc theo loại"
                  style={{ width: '100%' }}
                  value={transactionsFilter.type}
                  onChange={(value) => setTransactionsFilter({ ...transactionsFilter, type: value })}
                  allowClear
                >
                  <Option value="in">Nhập kho</Option>
                  <Option value="out">Xuất kho</Option>
                  <Option value="adjustment">Điều chỉnh</Option>
                </Select>
              </Col>
              <Col xs={24} sm={8} md={12}>
                <RangePicker
                  style={{ width: '100%' }}
                  value={transactionsFilter.dateRange}
                  onChange={(dates) => setTransactionsFilter({ 
                    ...transactionsFilter, 
                    dateRange: dates as [Dayjs, Dayjs] | null 
                  })}
                />
              </Col>
            </Row>
          </div>

          <Table
            dataSource={transactions}
            columns={transactionColumns}
            loading={transactionsLoading}
            rowKey="id"
            pagination={{
              ...transactionsPagination,
              showSizeChanger: true,
              showTotal: (total) => `Tổng cộng ${total} giao dịch`,
              onChange: (page, pageSize) => {
                loadTransactions(page, pageSize);
              },
            }}
          />
        </TabPane>

        <TabPane tab="Thêm sản phẩm vào kho" key="add-products">
          <div style={{ marginBottom: '16px' }}>
            <Row gutter={16}>
              <Col xs={24} sm={8} md={6}>
                <Input
                  placeholder="Tìm kiếm sản phẩm..."
                  prefix={<SearchOutlined />}
                  value={productsFilter.search}
                  onChange={(e) => setProductsFilter({ ...productsFilter, search: e.target.value })}
                />
              </Col>
              <Col xs={24} sm={8} md={6}>
                <Select
                  placeholder="Lọc theo danh mục"
                  style={{ width: '100%' }}
                  value={productsFilter.category}
                  onChange={(value) => setProductsFilter({ ...productsFilter, category: value })}
                  allowClear
                >
                  {summary?.categoryBreakdown.map(category => (
                    <Option key={category.id} value={category.name}>{category.name}</Option>
                  ))}
                </Select>
              </Col>
              <Col xs={24} sm={8} md={12}>
                <Space>
                  <Button
                    type="primary"
                    icon={<ReloadOutlined />}
                    onClick={loadProducts}
                  >
                    Làm mới
                  </Button>
                </Space>
              </Col>
            </Row>
          </div>

          <Table
            dataSource={products}
            columns={productColumns}
            loading={productsLoading}
            rowKey="id"
            pagination={{
              showSizeChanger: true,
              showTotal: (total) => `Tổng cộng ${total} sản phẩm`,
            }}
          />
        </TabPane>
      </Tabs>

      {/* Stock In Modal */}
      <Modal
        title={
          <div>
            <PlusOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            Nhập kho - {stockInModal.variant?.product.name}
          </div>
        }
        open={stockInModal.visible}
        onCancel={() => setStockInModal({ visible: false, variant: null })}
        footer={null}
        width={500}
      >
        <Spin spinning={operationLoading}>
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Biến thể:</Text>
                <div>
                  <Tag color="blue">{stockInModal.variant?.size}</Tag>
                  <Tag color="purple">{stockInModal.variant?.color}</Tag>
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Tồn kho hiện tại:</Text>
                <div style={{ fontSize: '16px', color: '#1890ff', fontWeight: 'bold' }}>
                  {stockInModal.variant?.stock} sản phẩm
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Người thực hiện:</Text>
                <div style={{ fontSize: '14px', color: '#52c41a' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {authState.user?.name || 'N/A'}
                </div>
              </Col>
            </Row>
          </div>
          
          <Form form={stockInForm} onFinish={handleStockIn} layout="vertical">
            <Form.Item
              label="Số lượng nhập"
              name="quantity"
              rules={[
                { required: true, message: 'Vui lòng nhập số lượng' },
                { type: 'number', min: 1, message: 'Số lượng phải ít nhất là 1' },
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={1} 
                placeholder="Nhập số lượng"
                addonAfter="sản phẩm"
              />
            </Form.Item>
            <Form.Item
              label="Nhà cung cấp"
              name="supplier"
            >
              <Input placeholder="Nhập tên nhà cung cấp (tùy chọn)" />
            </Form.Item>
            <Form.Item
              label="Lý do"
              name="reason"
              rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
              initialValue="Nhập hàng từ nhà cung cấp"
            >
              <TextArea rows={3} placeholder="Nhập lý do nhập kho" />
            </Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setStockInModal({ visible: false, variant: null })}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={operationLoading}>
                  Nhập kho
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Stock Out Modal */}
      <Modal
        title={
          <div>
            <MinusOutlined style={{ marginRight: 8, color: '#ff4d4f' }} />
            Xuất kho - {stockOutModal.variant?.product.name}
          </div>
        }
        open={stockOutModal.visible}
        onCancel={() => setStockOutModal({ visible: false, variant: null })}
        footer={null}
        width={700}
      >
        <Spin spinning={operationLoading}>
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Biến thể:</Text>
                <div>
                  <Tag color="blue">{stockOutModal.variant?.size}</Tag>
                  <Tag color="purple">{stockOutModal.variant?.color}</Tag>
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Tồn kho hiện tại:</Text>
                <div style={{ fontSize: '16px', color: '#1890ff', fontWeight: 'bold' }}>
                  {stockOutModal.variant?.stock} sản phẩm
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Người thực hiện:</Text>
                <div style={{ fontSize: '14px', color: '#ff4d4f' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {authState.user?.name || 'N/A'}
                </div>
              </Col>
            </Row>
          </div>
          
          <Form form={stockOutForm} onFinish={handleStockOut} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Số lượng xuất"
                  name="quantity"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số lượng' },
                    { type: 'number', min: 1, max: stockOutModal.variant?.stock, message: `Số lượng phải từ 1 đến ${stockOutModal.variant?.stock}` },
                  ]}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={1} 
                    max={stockOutModal.variant?.stock}
                    placeholder="Nhập số lượng"
                    addonAfter="sản phẩm"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Tên khách hàng"
                  name="customerName"
                  rules={[{ required: true, message: 'Vui lòng nhập tên khách hàng' }]}
                >
                  <Input placeholder="Nhập tên khách hàng" />
                </Form.Item>
              </Col>
            </Row>
            
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Số điện thoại"
                  name="customerPhone"
                  rules={[
                    { required: true, message: 'Vui lòng nhập số điện thoại' },
                    { pattern: /^[0-9]{10,11}$/, message: 'Số điện thoại không hợp lệ' }
                  ]}
                >
                  <Input placeholder="Nhập số điện thoại" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Email khách hàng"
                  name="customerEmail"
                  rules={[
                    { type: 'email', message: 'Email không hợp lệ' }
                  ]}
                >
                  <Input placeholder="Nhập email (tùy chọn)" />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item
              label="Lý do"
              name="reason"
              rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
              initialValue="Bán hàng/Xuất kho"
            >
              <TextArea rows={3} placeholder="Nhập lý do xuất kho" />
            </Form.Item>
            
            <Alert
              message="Thông báo"
              description="Khi xuất kho, hệ thống sẽ tự động tạo đơn hàng cho khách hàng này."
              type="info"
              showIcon
              style={{ marginBottom: 16 }}
            />
            
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setStockOutModal({ visible: false, variant: null })}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={operationLoading}>
                  Xuất kho & Tạo đơn hàng
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Stock Adjust Modal */}
      <Modal
        title={
          <div>
            <EditOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Điều chỉnh tồn kho - {adjustModal.variant?.product.name}
          </div>
        }
        open={adjustModal.visible}
        onCancel={() => setAdjustModal({ visible: false, variant: null })}
        footer={null}
        width={500}
      >
        <Spin spinning={operationLoading}>
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Biến thể:</Text>
                <div>
                  <Tag color="blue">{adjustModal.variant?.size}</Tag>
                  <Tag color="purple">{adjustModal.variant?.color}</Tag>
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Tồn kho hiện tại:</Text>
                <div style={{ fontSize: '16px', color: '#1890ff', fontWeight: 'bold' }}>
                  {adjustModal.variant?.stock} sản phẩm
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Người thực hiện:</Text>
                <div style={{ fontSize: '14px', color: '#1890ff' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {authState.user?.name || 'N/A'}
                </div>
              </Col>
            </Row>
          </div>
          
          <Form form={adjustForm} onFinish={handleStockAdjust} layout="vertical">
            <Form.Item
              label="Tồn kho mới"
              name="newStock"
              rules={[
                { required: true, message: 'Vui lòng nhập mức tồn kho mới' },
                { type: 'number', min: 0, message: 'Tồn kho không thể âm' },
              ]}
            >
              <InputNumber 
                style={{ width: '100%' }} 
                min={0}
                placeholder="Nhập mức tồn kho mới"
                addonAfter="sản phẩm"
              />
            </Form.Item>
            <Form.Item
              label="Lý do"
              name="reason"
              rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
              initialValue="Điều chỉnh tồn kho"
            >
              <TextArea rows={3} placeholder="Nhập lý do điều chỉnh" />
            </Form.Item>
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setAdjustModal({ visible: false, variant: null })}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={operationLoading}>
                  Điều chỉnh
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Add Variant Modal */}
      <Modal
        title={
          <div>
            <PlusOutlined style={{ marginRight: 8, color: '#52c41a' }} />
            Thêm biến thể - {variantModal.product?.name}
          </div>
        }
        open={variantModal.visible}
        onCancel={() => setVariantModal({ visible: false, product: null, variant: null })}
        footer={null}
        width={500}
      >
        <Spin spinning={operationLoading}>
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <Row gutter={16}>
              <Col span={12}>
                <Text strong>Sản phẩm:</Text>
                <div style={{ fontWeight: 'bold' }}>{variantModal.product?.name}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>SKU: {variantModal.product?.sku}</div>
              </Col>
              <Col span={12}>
                <Text strong>Danh mục:</Text>
                <div>
                  <Tag color="blue">{typeof variantModal.product?.category === 'object' ? variantModal.product.category.name : variantModal.product?.category}</Tag>
                </div>
              </Col>
            </Row>
          </div>
          
          <Form form={variantForm} onFinish={handleCreateVariant} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Kích thước"
                  name="size"
                  rules={[{ required: true, message: 'Vui lòng chọn kích thước' }]}
                >
                  <Select placeholder="Chọn kích thước">
                    <Option value="XS">XS</Option>
                    <Option value="S">S</Option>
                    <Option value="M">M</Option>
                    <Option value="L">L</Option>
                    <Option value="XL">XL</Option>
                    <Option value="XXL">XXL</Option>
                    <Option value="XXXL">XXXL</Option>
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Màu sắc"
                  name="color"
                  rules={[{ required: true, message: 'Vui lòng nhập màu sắc' }]}
                >
                  <Input placeholder="Nhập màu sắc" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item
                  label="Số lượng ban đầu"
                  name="stock"
                  initialValue={0}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0}
                    placeholder="Số lượng tồn kho ban đầu"
                    addonAfter="sản phẩm"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Tồn kho tối thiểu"
                  name="minStock"
                  initialValue={5}
                >
                  <InputNumber 
                    style={{ width: '100%' }} 
                    min={0}
                    placeholder="Ngưỡng cảnh báo"
                    addonAfter="sản phẩm"
                  />
                </Form.Item>
              </Col>
            </Row>
            <div style={{ textAlign: 'right' }}>
              <Space>
                <Button onClick={() => setVariantModal({ visible: false, product: null, variant: null })}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={operationLoading}>
                  Thêm biến thể
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>

      {/* Bulk Stock In Modal */}
      <Modal
        title={
          <div>
            <InboxOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            Nhập kho hàng loạt - {addProductModal.product?.name}
          </div>
        }
        open={addProductModal.visible}
        onCancel={() => setAddProductModal({ visible: false, product: null })}
        footer={null}
        width={700}
      >
        <Spin spinning={operationLoading}>
          <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f5f5f5', borderRadius: '6px' }}>
            <Row gutter={16}>
              <Col span={8}>
                <Text strong>Sản phẩm:</Text>
                <div style={{ fontWeight: 'bold' }}>{addProductModal.product?.name}</div>
                <div style={{ color: '#666', fontSize: '12px' }}>SKU: {addProductModal.product?.sku}</div>
              </Col>
              <Col span={8}>
                <Text strong>Giá nhập:</Text>
                <div style={{ fontSize: '14px', color: '#52c41a', fontWeight: 'bold' }}>
                  {addProductModal.product?.purchasePrice?.toLocaleString('vi-VN')}₫
                </div>
              </Col>
              <Col span={8}>
                <Text strong>Người thực hiện:</Text>
                <div style={{ fontSize: '14px', color: '#1890ff' }}>
                  <UserOutlined style={{ marginRight: 4 }} />
                  {authState.user?.name || 'N/A'}
                </div>
              </Col>
            </Row>
          </div>
          
          <Form form={addProductForm} onFinish={handleBulkStockIn} layout="vertical">
            <Form.Item
              label="Nhà cung cấp"
              name="supplier"
            >
              <Input placeholder="Nhập tên nhà cung cấp (tùy chọn)" />
            </Form.Item>
            <Form.Item
              label="Lý do nhập kho"
              name="reason"
              rules={[{ required: true, message: 'Vui lòng nhập lý do' }]}
              initialValue="Nhập hàng mới từ nhà cung cấp"
            >
              <TextArea rows={2} placeholder="Nhập lý do nhập kho" />
            </Form.Item>
            
            <Form.List name="variants">
              {(fields, { add, remove }) => (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <Text strong>Danh sách biến thể:</Text>
                    <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />}>
                      Thêm biến thể
                    </Button>
                  </div>
                  {fields.map(({ key, name, ...restField }) => (
                    <Card key={key} size="small" style={{ marginBottom: 8 }}>
                      <Row gutter={8}>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'size']}
                            rules={[{ required: true, message: 'Chọn size' }]}
                          >
                            <Select placeholder="Size">
                              <Option value="XS">XS</Option>
                              <Option value="S">S</Option>
                              <Option value="M">M</Option>
                              <Option value="L">L</Option>
                              <Option value="XL">XL</Option>
                              <Option value="XXL">XXL</Option>
                              <Option value="XXXL">XXXL</Option>
                            </Select>
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'color']}
                            rules={[{ required: true, message: 'Nhập màu' }]}
                          >
                            <Input placeholder="Màu sắc" />
                          </Form.Item>
                        </Col>
                        <Col span={6}>
                          <Form.Item
                            {...restField}
                            name={[name, 'quantity']}
                            rules={[{ required: true, message: 'Nhập SL' }]}
                          >
                            <InputNumber 
                              placeholder="Số lượng" 
                              min={1} 
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={4}>
                          <Form.Item
                            {...restField}
                            name={[name, 'minStock']}
                            initialValue={5}
                          >
                            <InputNumber 
                              placeholder="Min" 
                              min={0} 
                              style={{ width: '100%' }}
                            />
                          </Form.Item>
                        </Col>
                        <Col span={2}>
                          <Button 
                            type="text" 
                            danger 
                            icon={<MinusOutlined />} 
                            onClick={() => remove(name)}
                          />
                        </Col>
                      </Row>
                    </Card>
                  ))}
                </>
              )}
            </Form.List>
            
            <div style={{ textAlign: 'right', marginTop: 16 }}>
              <Space>
                <Button onClick={() => setAddProductModal({ visible: false, product: null })}>
                  Hủy
                </Button>
                <Button type="primary" htmlType="submit" loading={operationLoading}>
                  Nhập kho
                </Button>
              </Space>
            </div>
          </Form>
        </Spin>
      </Modal>
      </>
      )}
    </div>
  );
};

export default InventoryManagement;
