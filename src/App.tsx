import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import { theme } from './config/theme';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/auth/Login';
import HomePage from './pages/customer/HomePage';
import ProductDetail from './pages/customer/ProductDetail';
import Dashboard from './pages/admin/Dashboard';
import ProductManagement from './pages/admin/ProductManagement';
import InventoryManagement from './pages/admin/InventoryManagement';
import ReportsPage from './pages/admin/ReportsPage';
import UserManagement from './pages/admin/UserManagement';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import ImageDebugPage from './pages/debug/ImageDebugPage';
import DebugPage from './pages/debug/DebugPage';
import HardcodedImageTest from './pages/debug/HardcodedImageTest';

function App() {
  return (
    <ConfigProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public Customer Routes */}
            <Route path="/" element={<CustomerLayout />}>
              <Route index element={<HomePage />} />
              <Route path="products/:id" element={<ProductDetail />} />
              <Route path="debug/images" element={<ImageDebugPage />} />
              <Route path="debug" element={<DebugPage />} />
              <Route path="debug/hardcoded" element={<HardcodedImageTest />} />
            </Route>

            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/admin/login" element={<Login adminMode />} />

            {/* Protected Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="inventory" element={<InventoryManagement />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="users" element={<UserManagement />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ConfigProvider>
  );
}

export default App;
