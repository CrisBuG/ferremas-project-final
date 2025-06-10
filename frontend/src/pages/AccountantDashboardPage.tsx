import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  FaClipboardList, 
  FaChartLine,
  FaDollarSign,
  FaShoppingCart
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { productService, orderService } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
}

interface Product {
  id: number;
  name: string;
  category: Category | string;
  price: number;
  stock: number;
  created_at: string;
  updated_at: string;
}

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  payment_status: string;
}

interface Stats {
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalProducts: number;
}

// Styled Components
const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  flex-direction: column;
`;

const DashboardContainer = styled.div`
  flex: 1;
  max-width: 1400px;
  margin: 2rem auto;
  padding: 2rem;
  width: 100%;
  box-sizing: border-box;
`;

const Title = styled.h1`
  color: white;
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 700;
  text-align: center;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
`;

const StatCard = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  }
`;

const StatIcon = styled.div`
  font-size: 2.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatTitle = styled.h3`
  color: rgba(255, 255, 255, 0.9);
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 500;
`;

const StatValue = styled.div`
  color: white;
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  font-size: 1.2rem;
  color: white;
`;

const ErrorContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 107, 107, 0.5);
  border-radius: 10px;
  padding: 1rem;
  margin: 1rem 0;
  color: white;
`;

const AccountantDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<Stats>({ 
    totalRevenue: 0, 
    pendingOrders: 0, 
    completedOrders: 0, 
    totalProducts: 0 
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  const loadProducts = useCallback(async () => {
    try {
      console.log('Loading products for accountant...');
      const response = await productService.getProducts();
      setProducts(response.data);
      console.log('Products loaded:', response.data.length);
    } catch (err) {
      console.error('Error loading products:', err);
      throw new Error('Error al cargar productos');
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      console.log('Loading orders for accountant...');
      const response = await orderService.getOrders();
      setOrders(response.data);
      
      // Calcular estadísticas
      const totalRevenue = response.data
        .filter((order: Order) => order.status === 'completado')
        .reduce((sum: number, order: Order) => sum + order.total, 0);
      
      const pendingOrders = response.data.filter((order: Order) => order.status === 'pendiente').length;
      const completedOrders = response.data.filter((order: Order) => order.status === 'completado').length;
      
      setStats({
        totalRevenue,
        pendingOrders,
        completedOrders,
        totalProducts: products.length
      });
      
      console.log('Orders loaded:', response.data.length);
    } catch (err) {
      console.error('Error loading orders:', err);
      throw new Error('Error al cargar órdenes');
    }
  }, [products.length]);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Initializing accountant dashboard...');
        
        if (!user) {
          console.error('User not authenticated');
          navigate('/login');
          return;
        }
        
        console.log('User authenticated:', user);
        
        await Promise.all([
          loadProducts(),
          loadOrders()
        ]);
        
        console.log('Accountant dashboard data loaded successfully');
      } catch (err) {
        console.error('Error initializing accountant dashboard:', err);
        setError('Error al cargar el dashboard. Por favor, recarga la página.');
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [user, navigate, loadProducts, loadOrders]);

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <DashboardContainer>
          <LoadingContainer>
            Cargando dashboard de contabilidad...
          </LoadingContainer>
        </DashboardContainer>
        <Footer />
      </PageContainer>
    );
  }

  if (error) {
    return (
      <PageContainer>
        <Navbar />
        <DashboardContainer>
          <ErrorContainer>
            <h3>Error</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Recargar página
            </button>
          </ErrorContainer>
        </DashboardContainer>
        <Footer />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Navbar />
      <DashboardContainer>
        <Title>Dashboard de Contabilidad</Title>
        
        <StatsGrid>
          <StatCard>
            <StatIcon>
              <FaDollarSign />
            </StatIcon>
            <StatContent>
              <StatTitle>Ingresos Totales</StatTitle>
              <StatValue>${stats.totalRevenue.toLocaleString()}</StatValue>
            </StatContent>
          </StatCard>
          
          <StatCard>
            <StatIcon>
              <FaClipboardList />
            </StatIcon>
            <StatContent>
              <StatTitle>Órdenes Pendientes</StatTitle>
              <StatValue>{stats.pendingOrders}</StatValue>
            </StatContent>
          </StatCard>
          
          <StatCard>
            <StatIcon>
              <FaShoppingCart />
            </StatIcon>
            <StatContent>
              <StatTitle>Órdenes Completadas</StatTitle>
              <StatValue>{stats.completedOrders}</StatValue>
            </StatContent>
          </StatCard>
          
          <StatCard>
            <StatIcon>
              <FaChartLine />
            </StatIcon>
            <StatContent>
              <StatTitle>Total Productos</StatTitle>
              <StatValue>{stats.totalProducts}</StatValue>
            </StatContent>
          </StatCard>
        </StatsGrid>
        
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.1)', 
          borderRadius: '20px', 
          padding: '2rem',
          marginTop: '2rem'
        }}>
          <h3 style={{ color: 'white', marginBottom: '1rem' }}>Resumen Financiero</h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Total de órdenes: {orders.length}
          </p>
          <p style={{ color: 'rgba(255, 255, 255, 0.9)' }}>
            Promedio por orden: ${orders.length > 0 ? (stats.totalRevenue / stats.completedOrders || 0).toFixed(2) : '0.00'}
          </p>
        </div>
      </DashboardContainer>
      <Footer />
    </PageContainer>
  );
};

export default AccountantDashboardPage;