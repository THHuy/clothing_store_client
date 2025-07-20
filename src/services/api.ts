// API configuration and base setup
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const SERVER_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

// Helper to get auth token with expiration check
const getAuthToken = (): string | null => {
  const authData = localStorage.getItem('auth');
  if (authData) {
    try {
      const parsedData = JSON.parse(authData);
      const { token } = parsedData;
      let { tokenExpiration } = parsedData;
      
      if (!token) return null;
      
      // Nếu không có tokenExpiration (từ phiên cũ), tạo mới với 7 ngày
      if (!tokenExpiration) {
        tokenExpiration = Date.now() + (7 * 24 * 60 * 60 * 1000);
        console.log('🔐 No expiration in API, setting 7 days from now');
        
        // Cập nhật localStorage với tokenExpiration
        const { user } = parsedData;
        if (user) {
          localStorage.setItem('auth', JSON.stringify({ token, user, tokenExpiration }));
        }
      }
      
      // Check if token is still valid
      if (Date.now() < tokenExpiration) {
        return token;
      } else {
        // Token expired, clear auth data
        console.log('🔐 Token expired in API service, clearing auth data');
        localStorage.removeItem('auth');
        return null;
      }
    } catch (error) {
      console.error('🔐 Error parsing auth data in API service:', error);
      localStorage.removeItem('auth');
      return null;
    }
  }
  return null;
};

// Helper to create request headers
const createHeaders = (includeAuth = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
};

// Generic API request handler
const apiRequest = async (endpoint: string, options: RequestInit & { auth?: boolean } = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    ...options,
    headers: {
      ...createHeaders(options.auth !== false),
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.log('🔐 Authentication failed, clearing auth data');
        localStorage.removeItem('auth');
        
        // Redirect to admin login
        if (window.location.pathname.startsWith('/admin') || 
            window.location.pathname === '/inventory' ||
            window.location.pathname === '/products-management' ||
            window.location.pathname === '/reports' ||
            window.location.pathname === '/users') {
          window.location.href = '/admin/login';
        }
        
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// Authentication API
export const authAPI = {
  login: async (credentials: { username: string; password: string }) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
      auth: false,
    });
  },

  logout: async () => {
    return apiRequest('/auth/logout', { method: 'POST' });
  },

  getProfile: async () => {
    return apiRequest('/auth/profile');
  },

  updateProfile: async (profileData: any) => {
    return apiRequest('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// FormData API request handler (for file uploads)
const apiFormDataRequest = async (endpoint: string, formData: FormData, method: string = 'POST') => {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getAuthToken();
  
  const config: RequestInit = {
    method,
    body: formData,
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        console.log('🔐 Authentication failed, clearing auth data');
        localStorage.removeItem('auth');
        
        // Redirect to admin login
        if (window.location.pathname.startsWith('/admin') || 
            window.location.pathname === '/inventory' ||
            window.location.pathname === '/products-management' ||
            window.location.pathname === '/reports' ||
            window.location.pathname === '/users') {
          window.location.href = '/admin/login';
        }
        
        throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      }
      throw new Error(data.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error('API FormData Request Error:', error);
    throw error;
  }
};

// Products API
export const productsAPI = {
  getAll: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/products?${searchParams}`, { auth: false });
  },

  getAllForAdmin: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/products/admin/all?${searchParams}`);
  },

  getById: async (id: number | string) => {
    return apiRequest(`/products/${id}`, { auth: false });
  },

  create: async (productData: any) => {
    return apiRequest('/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  createWithFormData: async (formData: FormData) => {
    return apiFormDataRequest('/products', formData, 'POST');
  },

  updateStatus: async (id: number | string, isActive: boolean) => {
    return apiRequest(`/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive }),
    });
  },

  update: async (id: number | string, productData: any) => {
    return apiRequest(`/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  updateWithFormData: async (id: number | string, formData: FormData) => {
    return apiFormDataRequest(`/products/${id}`, formData, 'PUT');
  },

  delete: async (id: number | string) => {
    return apiRequest(`/products/${id}`, { method: 'DELETE' });
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    return apiRequest('/categories', { auth: false });
  },

  getById: async (id: number | string) => {
    return apiRequest(`/categories/${id}`, { auth: false });
  },

  create: async (categoryData: any) => {
    return apiRequest('/categories', {
      method: 'POST',
      body: JSON.stringify(categoryData),
    });
  },

  update: async (id: number | string, categoryData: any) => {
    return apiRequest(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(categoryData),
    });
  },

  delete: async (id: number | string) => {
    return apiRequest(`/categories/${id}`, { method: 'DELETE' });
  },
};

// Product Variants API
export const variantsAPI = {
  getByProductId: async (productId: number | string) => {
    return apiRequest(`/variants/product/${productId}`, { auth: false });
  },

  getById: async (id: number | string) => {
    return apiRequest(`/variants/${id}`, { auth: false });
  },

  create: async (variantData: any) => {
    return apiRequest('/variants', {
      method: 'POST',
      body: JSON.stringify(variantData),
    });
  },

  update: async (id: number | string, variantData: any) => {
    return apiRequest(`/variants/${id}`, {
      method: 'PUT',
      body: JSON.stringify(variantData),
    });
  },

  updateStock: async (id: number | string, stockData: any) => {
    return apiRequest(`/variants/${id}/stock`, {
      method: 'PATCH',
      body: JSON.stringify(stockData),
    });
  },

  delete: async (id: number | string) => {
    return apiRequest(`/variants/${id}`, { method: 'DELETE' });
  },

  getLowStockAlerts: async () => {
    return apiRequest('/variants/alerts/low-stock');
  },
};

// Inventory API
export const inventoryAPI = {
  getVariants: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/inventory/variants?${searchParams}`);
  },

  getTransactions: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/inventory/transactions?${searchParams}`);
  },

  stockIn: async (stockData: any) => {
    return apiRequest('/inventory/stock-in', {
      method: 'POST',
      body: JSON.stringify(stockData),
    });
  },

  stockOut: async (stockData: any) => {
    return apiRequest('/inventory/stock-out', {
      method: 'POST',
      body: JSON.stringify(stockData),
    });
  },

  adjustStock: async (stockData: any) => {
    return apiRequest('/inventory/stock-adjust', {
      method: 'POST',
      body: JSON.stringify(stockData),
    });
  },

  getSummary: async () => {
    return apiRequest('/inventory/summary');
  },
};

// Users API
export const usersAPI = {
  getAll: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/users?${searchParams}`);
  },

  getById: async (id: number | string) => {
    return apiRequest(`/users/${id}`);
  },

  create: async (userData: any) => {
    return apiRequest('/users', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  update: async (id: number | string, userData: any) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  changePassword: async (id: number | string, passwordData: any) => {
    return apiRequest(`/users/${id}/password`, {
      method: 'PATCH',
      body: JSON.stringify(passwordData),
    });
  },

  toggleStatus: async (id: number | string) => {
    return apiRequest(`/users/${id}/toggle-status`, { method: 'PATCH' });
  },

  delete: async (id: number | string) => {
    return apiRequest(`/users/${id}`, { method: 'DELETE' });
  },

  getStats: async () => {
    return apiRequest('/users/stats/overview');
  },
};

// Reports API
export const reportsAPI = {
  getSalesReport: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/reports/sales?${searchParams}`);
  },

  getInventoryReport: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/reports/inventory?${searchParams}`);
  },

  getProfitReport: async (params: Record<string, any> = {}) => {
    const searchParams = new URLSearchParams(params);
    return apiRequest(`/reports/profit?${searchParams}`);
  },

  getDashboardData: async () => {
    return apiRequest('/reports/dashboard');
  },
};

export default {
  auth: authAPI,
  products: productsAPI,
  categories: categoriesAPI,
  variants: variantsAPI,
  inventory: inventoryAPI,
  users: usersAPI,
  reports: reportsAPI,
};

// Export SERVER_BASE_URL for image handling
export { SERVER_BASE_URL };
