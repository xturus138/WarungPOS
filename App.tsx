
import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { useAuth } from './hooks/useAuth';
import LoginPage from './pages/Login';
import AdminLayout from './components/layouts/AdminLayout';
import PosLayout from './components/layouts/PosLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import ProductManagement from './pages/admin/ProductManagement';
import SupplierManagement from './pages/admin/SupplierManagement';
import IncomingGoods from './pages/admin/IncomingGoods';
import CustomerManagement from './pages/admin/CustomerManagement';
import AdminReports from './pages/admin/AdminReports';
import PosDashboard from './pages/pos/PosDashboard';
import PosProducts from './pages/pos/PosProducts';
import RetailTransaction from './pages/pos/RetailTransaction';
import WholesaleTransaction from './pages/pos/WholesaleTransaction';
import PosReports from './pages/pos/PosReports';
import ProtectedRoute from './components/ProtectedRoute';
import AppErrorBoundary from './components/ErrorBoundary';

const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="products" element={<ProductManagement />} />
        <Route path="suppliers" element={<SupplierManagement />} />
        <Route path="incoming-goods" element={<IncomingGoods />} />
        <Route path="customers" element={<CustomerManagement />} />
        <Route path="reports" element={<AdminReports />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route
        path="/pos"
        element={
          <ProtectedRoute role="CASHIER">
            <AppErrorBoundary>
              <PosLayout />
            </AppErrorBoundary>
          </ProtectedRoute>
        }
      >
        <Route path="dashboard" element={<PosDashboard />} />
        <Route path="products" element={<PosProducts />} />
        <Route path="retail" element={<RetailTransaction />} />
        <Route path="wholesale" element={<WholesaleTransaction />} />
        <Route path="reports" element={<PosReports />} />
        <Route index element={<Navigate to="dashboard" replace />} />
      </Route>
      <Route
        path="/"
        element={
          user ? (
            user.role === 'ADMIN' ? (
              <Navigate to="/admin" replace />
            ) : (
              <Navigate to="/pos" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </HashRouter>
  );
};

export default App;
