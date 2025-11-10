import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import ProductsPage from './pages/ProductsPage'; 
import ProductDetailPage from './pages/ProductDetailPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AboutPage from './pages/AboutPage';
import ProfilePage from './pages/ProfilePage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
import PaymentSimulationPage from './pages/PaymentSimulationPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import WarehouseDashboardPage from './pages/WarehouseDashboardPage';
import AccountantDashboardPage from './pages/AccountantDashboardPage';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';
import PaymentIntegrationConfirmationPage from './pages/PaymentIntegrationConfirmationPage';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Rutas públicas */}
              <Route path="/" element={<HomePage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/:id" element={<ProductDetailPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/about" element={<AboutPage />} />
              
              {/* Rutas protegidas para usuarios autenticados */}
              <Route 
                path="/profile" 
                element={                  
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/cart" 
                element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <CartPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/checkout" 
                element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <CheckoutPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/payment-confirmation" 
                element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <PaymentConfirmationPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/payment-simulation" 
                element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <PaymentSimulationPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/payment-integration-confirmation" 
                element={
                  <ErrorBoundary>
                    <ProtectedRoute>
                      <PaymentIntegrationConfirmationPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              
              {/* Rutas protegidas por rol con ErrorBoundary */}
              <Route 
                path="/admin-dashboard" 
                element={
                  <ErrorBoundary>
                    <ProtectedRoute requiredRole="is_staff">
                      <AdminDashboardPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/warehouse-dashboard" 
                element={
                  <ErrorBoundary>
                    <ProtectedRoute requiredRole="is_staff">
                      <WarehouseDashboardPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
              <Route 
                path="/accountant-dashboard" 
                element={
                  <ErrorBoundary>
                    <ProtectedRoute requiredRole="is_staff">
                      <AccountantDashboardPage />
                    </ProtectedRoute>
                  </ErrorBoundary>
                } 
              />
            </Routes>
            
            {/* Configuración de ToastContainer para las notificaciones */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop={false}
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="light"
              style={{
                fontSize: '14px',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
