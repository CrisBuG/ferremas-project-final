import React, { useState, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { 
  FaClipboardList, 
  FaChartLine,
  FaDollarSign,
  FaShoppingCart,
  FaFileInvoiceDollar,
  FaDownload,
  FaEye,
  FaEdit,
  FaPlus,
  FaHistory,
  FaExclamationTriangle
} from 'react-icons/fa';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { productService, orderService, apiClient } from '../services/api';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface Stats {
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  totalProducts: number;
  totalOrders: number;
}

interface Order {
  id: number;
  total: number;
  status: string;
  created_at: string;
  payment_status: string;
}

interface Invoice {
  id: number;
  order: {
    id: number;
    total: number;
  };
  customer: {
    first_name: string;
    last_name: string;
    email: string;
  };
  invoice_number: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  invoice_type: 'factura' | 'boleta' | 'nota_credito' | 'nota_debito';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  issue_date: string;
  due_date: string;
}

interface Report {
  id: number;
  report_type: {
    id: number;
    name: string;
    description: string;
  };
  title: string;
  status: 'pending' | 'generating' | 'completed' | 'failed';
  generated_at: string;
  date_from: string;
  date_to: string;
  data: any;
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

const TabContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
`;

const Tab = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'};
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 1rem 1.5rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: ${props => props.active ? '600' : '400'};
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
  }
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
  background: rgba(255, 255, 255, 0.2);
  border-radius: 15px;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const StatContent = styled.div`
  flex: 1;
`;

const StatTitle = styled.h3`
  color: rgba(255, 255, 255, 0.8);
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

const ContentContainer = styled.div`
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  
  th, td {
    padding: 1rem;
    text-align: left;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    color: white;
  }
  
  th {
    background: rgba(255, 255, 255, 0.1);
    font-weight: 600;
  }
  
  tr:hover {
    background: rgba(255, 255, 255, 0.05);
  }
`;

const Button = styled.button`
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  padding: 0.5rem 1rem;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 0 0.25rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  &:hover {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: white;
  font-size: 1.2rem;
`;

const ErrorContainer = styled.div`
  background: rgba(255, 0, 0, 0.1);
  border: 1px solid rgba(255, 0, 0, 0.3);
  border-radius: 12px;
  padding: 1rem;
  color: white;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const EmptyState = styled.div`
  text-align: center;
  color: rgba(255, 255, 255, 0.7);
  padding: 2rem;
  font-size: 1.1rem;
`;

const AccountantDashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'invoices' | 'reports' | 'transactions'>('overview');
  
  // Estados con valores por defecto seguros
  const [stats, setStats] = useState<Stats>({
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    totalProducts: 0,
    totalOrders: 0
  });
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  
  // Estados de carga individual
  const [statsLoading, setStatsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [invoicesLoading, setInvoicesLoading] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Función para cargar estadísticas con manejo robusto de errores
  const loadStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      console.log('Loading stats for accountant...');
      
      // Usar solo el endpoint de admin por ahora
      const response = await apiClient.get('/admin/stats/');
      
      const statsData = response.data;
      
      setStats({
        totalRevenue: statsData.total_revenue || 0,
        pendingOrders: statsData.pending_orders || 0,
        completedOrders: statsData.completed_orders || 0,
        totalProducts: statsData.total_products || 0,
        totalOrders: statsData.total_orders || 0
      });
      
      console.log('Stats loaded successfully:', statsData);
    } catch (err) {
      console.error('Error loading stats:', err);
      // No establecer error global, solo mantener valores por defecto
      setStats({
        totalRevenue: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalProducts: 0,
        totalOrders: 0
      });
    } finally {
      setStatsLoading(false);
    }
  }, []);

  const loadOrders = useCallback(async () => {
    try {
      setOrdersLoading(true);
      console.log('Loading orders...');
      const response = await orderService.getOrders();
      setOrders(response.data || []);
      console.log('Orders loaded:', response.data?.length || 0);
    } catch (err) {
      console.error('Error loading orders:', err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const loadInvoices = useCallback(async () => {
    try {
      setInvoicesLoading(true);
      console.log('Loading invoices...');
      const response = await apiClient.get('/billing/invoices/');
      setInvoices(response.data || []);
      console.log('Invoices loaded:', response.data?.length || 0);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setInvoices([]);
    } finally {
      setInvoicesLoading(false);
    }
  }, []);

  const loadReports = useCallback(async () => {
    try {
      setReportsLoading(true);
      console.log('Loading reports...');
      const response = await apiClient.get('/reports/');
      setReports(response.data || []);
      console.log('Reports loaded:', response.data?.length || 0);
    } catch (err) {
      console.error('Error loading reports:', err);
      setReports([]);
    } finally {
      setReportsLoading(false);
    }
  }, []);

  // Efecto principal con manejo robusto
  useEffect(() => {
    const loadData = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Cargar datos en paralelo pero sin fallar si uno falla
        await Promise.allSettled([
          loadStats(),
          loadOrders(),
          loadInvoices(),
          loadReports()
        ]);
        
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Algunos datos no se pudieron cargar, pero el dashboard sigue funcionando.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate, loadStats, loadOrders, loadInvoices, loadReports]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <>
            <StatsGrid>
              <StatCard>
                <StatIcon>
                  <FaDollarSign />
                </StatIcon>
                <StatContent>
                  <StatTitle>Ingresos Totales</StatTitle>
                  <StatValue>
                    {statsLoading ? 'Cargando...' : `$${stats.totalRevenue.toLocaleString()}`}
                  </StatValue>
                </StatContent>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <FaClipboardList />
                </StatIcon>
                <StatContent>
                  <StatTitle>Órdenes Pendientes</StatTitle>
                  <StatValue>
                    {statsLoading ? 'Cargando...' : stats.pendingOrders}
                  </StatValue>
                </StatContent>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <FaShoppingCart />
                </StatIcon>
                <StatContent>
                  <StatTitle>Órdenes Completadas</StatTitle>
                  <StatValue>
                    {statsLoading ? 'Cargando...' : stats.completedOrders}
                  </StatValue>
                </StatContent>
              </StatCard>
              
              <StatCard>
                <StatIcon>
                  <FaChartLine />
                </StatIcon>
                <StatContent>
                  <StatTitle>Total Productos</StatTitle>
                  <StatValue>
                    {statsLoading ? 'Cargando...' : stats.totalProducts}
                  </StatValue>
                </StatContent>
              </StatCard>
            </StatsGrid>

            <ContentContainer>
              <h3 style={{ color: 'white', marginBottom: '1rem' }}>Resumen Financiero</h3>
              <Table>
                <thead>
                  <tr>
                    <th>Métrica</th>
                    <th>Valor</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>Ingresos Totales</td>
                    <td>${stats.totalRevenue.toLocaleString()}</td>
                    <td>{statsLoading ? 'Cargando...' : 'Actualizado'}</td>
                  </tr>
                  <tr>
                    <td>Total de Órdenes</td>
                    <td>{stats.totalOrders}</td>
                    <td>{statsLoading ? 'Cargando...' : 'Actualizado'}</td>
                  </tr>
                  <tr>
                    <td>Productos en Stock</td>
                    <td>{stats.totalProducts}</td>
                    <td>{statsLoading ? 'Cargando...' : 'Actualizado'}</td>
                  </tr>
                </tbody>
              </Table>
            </ContentContainer>
          </>
        );
        
      case 'invoices':
        return (
          <ContentContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'white', margin: 0 }}>Gestión de Facturas</h3>
              <Button onClick={() => console.log('Crear nueva factura')}>
                <FaPlus /> Nueva Factura
              </Button>
            </div>
            
            {invoicesLoading ? (
              <EmptyState>Cargando facturas...</EmptyState>
            ) : invoices.length === 0 ? (
              <EmptyState>No hay facturas disponibles</EmptyState>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map(invoice => (
                    <tr key={invoice.id}>
                      <td>{invoice.invoice_number}</td>
                      <td>{invoice.customer.first_name} {invoice.customer.last_name}</td>
                      <td>${invoice.total_amount.toLocaleString()}</td>
                      <td>{invoice.status}</td>
                      <td>{new Date(invoice.issue_date).toLocaleDateString()}</td>
                      <td>
                        <Button onClick={() => console.log('Ver factura', invoice.id)}>
                          <FaEye />
                        </Button>
                        <Button onClick={() => console.log('Descargar', invoice.id)}>
                          <FaDownload />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </ContentContainer>
        );
        
      case 'reports':
        return (
          <ContentContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ color: 'white', margin: 0 }}>Reportes Financieros</h3>
              <div>
                <Button onClick={() => console.log('Generar reporte de ventas')}>
                  <FaPlus /> Reporte de Ventas
                </Button>
                <Button onClick={() => console.log('Generar reporte financiero')}>
                  <FaPlus /> Reporte Financiero
                </Button>
              </div>
            </div>
            
            {reportsLoading ? (
              <EmptyState>Cargando reportes...</EmptyState>
            ) : reports.length === 0 ? (
              <EmptyState>No hay reportes disponibles</EmptyState>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Fecha Generación</th>
                    <th>Período</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map(report => (
                    <tr key={report.id}>
                      <td>{report.title}</td>
                      <td>{report.report_type.name}</td>
                      <td>{report.status}</td>
                      <td>{new Date(report.generated_at).toLocaleDateString()}</td>
                      <td>{report.date_from} - {report.date_to}</td>
                      <td>
                        <Button onClick={() => console.log('Ver reporte', report.id)}>
                          <FaEye />
                        </Button>
                        <Button onClick={() => console.log('Descargar reporte', report.id)}>
                          <FaDownload />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </ContentContainer>
        );
        
      case 'transactions':
        return (
          <ContentContainer>
            <h3 style={{ color: 'white', marginBottom: '1rem' }}>Historial de Transacciones</h3>
            
            {ordersLoading ? (
              <EmptyState>Cargando transacciones...</EmptyState>
            ) : orders.length === 0 ? (
              <EmptyState>No hay transacciones disponibles</EmptyState>
            ) : (
              <Table>
                <thead>
                  <tr>
                    <th>ID Orden</th>
                    <th>Monto</th>
                    <th>Estado</th>
                    <th>Estado de Pago</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map(order => (
                    <tr key={order.id}>
                      <td>#{order.id}</td>
                      <td>${order.total.toLocaleString()}</td>
                      <td>{order.status}</td>
                      <td>{order.payment_status}</td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>
                        <Button onClick={() => console.log('Ver orden', order.id)}>
                          <FaEye />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </ContentContainer>
        );
        
      default:
        return (
          <ContentContainer>
            <EmptyState>Sección no encontrada</EmptyState>
          </ContentContainer>
        );
    }
  };

  // Mostrar loading solo al inicio
  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <LoadingContainer>
          <div>Cargando Dashboard de Contabilidad...</div>
        </LoadingContainer>
        <Footer />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Navbar />
      <DashboardContainer>
        <Title>Dashboard de Contabilidad</Title>
        
        {error && (
          <ErrorContainer>
            <FaExclamationTriangle />
            {error}
          </ErrorContainer>
        )}
        
        <TabContainer>
          <Tab 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')}
          >
            <FaChartLine /> Resumen
          </Tab>
          <Tab 
            active={activeTab === 'invoices'} 
            onClick={() => setActiveTab('invoices')}
          >
            <FaFileInvoiceDollar /> Facturas
          </Tab>
          <Tab 
            active={activeTab === 'reports'} 
            onClick={() => setActiveTab('reports')}
          >
            <FaClipboardList /> Reportes
          </Tab>
          <Tab 
            active={activeTab === 'transactions'} 
            onClick={() => setActiveTab('transactions')}
          >
            <FaHistory /> Transacciones
          </Tab>
        </TabContainer>
        
        {renderContent()}
      </DashboardContainer>
      <Footer />
    </PageContainer>
  );
};

export default AccountantDashboardPage;