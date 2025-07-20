import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { state, checkTokenValidity } = useAuth();
  const location = useLocation();

  console.log('🛡️ ProtectedRoute check:', {
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    isInitialized: state.isInitialized,
    hasToken: !!state.token,
    hasUser: !!state.user,
    tokenValid: state.isInitialized ? checkTokenValidity() : 'not-initialized',
    currentPath: location.pathname
  });

  // Wait for initialization to complete
  if (!state.isInitialized || state.isLoading) {
    console.log('⏳ ProtectedRoute: Waiting for initialization or showing loading state');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin size="large" />
      </div>
    );
  }

  // Check if user is authenticated and token is still valid
  if (!state.isAuthenticated || !checkTokenValidity()) {
    console.log('🚫 ProtectedRoute: Not authenticated or token invalid, redirecting to /admin/login');
    // Redirect to login page with return url
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  console.log('✅ ProtectedRoute: Access granted');
  return <>{children}</>;
};

export default ProtectedRoute;
