import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import CustomerDetail from './pages/CustomerDetail';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Challans from './pages/Challans';
import ChallanForm from './pages/ChallanForm';
import ChallanDetail from './pages/ChallanDetail';
import Users from './pages/Users';
import SplashScreen from './components/SplashScreen';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AuthProvider>
      {showSplash && <SplashScreen />}
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Portal Layout */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            
            <Route 
              path="customers" 
              element={
                <ProtectedRoute>
                  <Customers />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="customers/:id" 
              element={
                <ProtectedRoute>
                  <CustomerDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="products" 
              element={
                <ProtectedRoute>
                  <Products />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="products/:id" 
              element={
                <ProtectedRoute>
                  <ProductDetail />
                </ProtectedRoute>
              } 
            />
            
            <Route 
              path="challans" 
              element={
                <ProtectedRoute>
                  <Challans />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="challans/new" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Sales']}>
                  <ChallanForm />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="challans/:id" 
              element={
                <ProtectedRoute>
                  <ChallanDetail />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="challans/:id/edit" 
              element={
                <ProtectedRoute allowedRoles={['Admin', 'Sales']}>
                  <ChallanForm />
                </ProtectedRoute>
              } 
            />

            {/* Admin-only Route */}
            <Route 
              path="users" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <Users />
                </ProtectedRoute>
              } 
            />

            {/* Catch-all Not Found Route */}
            <Route 
              path="*" 
              element={
                <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
                  <h2 className="text-2xl font-bold text-gray-900">404 - Page Not Found</h2>
                  <p className="text-gray-500">The page you are looking for does not exist.</p>
                </div>
              } 
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
