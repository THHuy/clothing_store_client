// Types for Product Management
export interface Product {
  id: string;
  sku: string; // Mã sản phẩm
  name: string; // Tên sản phẩm
  category: ProductCategory;
  brand: string; // Thương hiệu
  material: string; // Chất liệu
  description: string; // Mô tả chi tiết
  images: string[]; // Ảnh sản phẩm
  purchasePrice: number; // Giá nhập
  salePrice: number; // Giá bán
  variants: ProductVariant[]; // Biến thể theo size, màu
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface ProductVariant {
  id: string;
  productId: string;
  size: string;
  color: string;
  stock: number; // Số lượng tồn kho
  minStock: number; // Ngưỡng cảnh báo tồn kho thấp
}

export interface ProductCategory {
  id: string;
  name: string; // áo, quần, váy, phụ kiện...
  slug: string;
  description?: string;
  parentId?: string; // Cho danh mục con
}

// Types for Inventory Management
export interface InventoryTransaction {
  id: string;
  productVariantId: string;
  type: 'IN' | 'OUT'; // Nhập kho / Xuất kho
  quantity: number;
  price?: number; // Giá nhập (nếu là nhập kho)
  reason: string; // Lý do nhập/xuất
  referenceNumber?: string; // Số phiếu tham chiếu
  notes?: string;
  createdBy: string; // ID người tạo
  createdAt: string;
}

export interface InventoryAlert {
  id: string;
  productVariant: ProductVariant & { product: Product };
  alertType: 'LOW_STOCK' | 'OUT_OF_STOCK';
  currentStock: number;
  minStock: number;
  createdAt: string;
  isResolved: boolean;
}

// Types for Statistics & Reports
export interface SalesReport {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  topProducts: {
    product: Product;
    quantity: number;
    revenue: number;
  }[];
}

export interface InventoryReport {
  totalProducts: number;
  totalVariants: number;
  totalStock: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalInventoryValue: number;
}

// Types for User Management
export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  tokenExpiration: number | null; // Timestamp khi token hết hạn
  isInitialized: boolean; // Đã hoàn thành việc check localStorage chưa
}

// Types for API responses
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Common types
export interface FilterParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  color?: string;
  size?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DashboardStats {
  totalProducts: number;
  totalCategories: number;
  lowStockAlerts: number;
  totalRevenue: number;
  recentTransactions: InventoryTransaction[];
}
