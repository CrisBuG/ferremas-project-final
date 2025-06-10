import React, { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { FaChartLine, FaHome, FaSignOutAlt, FaUsers, FaEdit, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { apiClient } from '../services/api';
import { AxiosResponse } from 'axios';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Interfaces
interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category: {
    id: number;
    name: string;
  };
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  date_joined: string;
  phone?: string;
  address?: string;
}

interface Order {
  id: number;
  user: {
    id: number;
    email: string;
  };
  total: number;
  status: string;
  created_at: string;
  payment_status: string;
  items: any[];
}

interface ExchangeRateResponse {
  rate: number;
}

interface AdminStats {
  total_products: number;
  total_users: number;
  total_orders: number;
  orders_by_status: {
    pendiente: number;
    completado: number;
    cancelado: number;
  };
  total_revenue: number;
}

interface ErrorState {
  stats?: string;
  products?: string;
  users?: string;
  orders?: string;
  exchangeRate?: string;
  auth?: string;
  general?: string;
}

interface TabProps {
  active: boolean;
}

// Styled Components con diseño mejorado
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem 0;
`;

const DashboardContainer = styled.div`
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 3rem;
  padding-bottom: 2rem;
  border-bottom: 3px solid rgba(102, 126, 234, 0.1);
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    width: 100px;
    height: 3px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 2px;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1.5rem;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 3rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 900;
  margin: 0;
  letter-spacing: -1px;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 30px;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.4);
  }
  
  &.secondary {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    
    &:hover {
      box-shadow: 0 12px 30px rgba(255, 107, 107, 0.4);
    }
  }
`;

const UserInfo = styled.span`
  color: #667eea;
  font-weight: 700;
  font-size: 1.1rem;
`;

const TabsContainer = styled.div`
  display: flex;
  margin-bottom: 3rem;
  background: rgba(102, 126, 234, 0.08);
  border-radius: 16px;
  padding: 0.5rem;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const Tab = styled.button<TabProps>`
  flex: 1;
  padding: 1.25rem 2rem;
  background: ${({ active }) => active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'};
  color: ${({ active }) => active ? 'white' : '#667eea'};
  border: none;
  cursor: pointer;
  font-size: 1.1rem;
  font-weight: 700;
  transition: all 0.3s ease;
  border-radius: 12px;
  box-shadow: ${({ active }) => active ? '0 8px 25px rgba(102, 126, 234, 0.3)' : 'none'};
  
  &:hover {
    background: ${({ active }) => active ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'rgba(102, 126, 234, 0.15)'};
    transform: ${({ active }) => active ? 'translateY(-2px)' : 'none'};
  }
`;

const ContentContainer = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 2rem;
  color: #333;
  margin-bottom: 2rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  gap: 1rem;
  
  &::after {
    content: '';
    flex: 1;
    height: 2px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 1px;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 2rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #f8f9ff 0%, #e8ecff 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 35px rgba(102, 126, 234, 0.15);
    border-color: rgba(102, 126, 234, 0.3);
  }
`;

const StatValue = styled.div`
  font-size: 2.5rem;
  font-weight: 900;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1.1rem;
  color: #666;
  font-weight: 600;
`;

const UsersGrid = styled.div`
  display: grid;
  gap: 1.5rem;
`;

const UserCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.12);
    border-color: rgba(102, 126, 234, 0.3);
  }
`;

const UserInfo2 = styled.div`
  flex: 1;
`;

const UserName = styled.h3`
  font-size: 1.3rem;
  color: #333;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
`;

const UserEmail = styled.p`
  color: #666;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
`;

const UserRole = styled.span<{ role: string }>`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${({ role }) => {
    switch (role) {
      case 'admin': return 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)';
      case 'bodeguero': return 'linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%)';
      case 'contador': return 'linear-gradient(135deg, #feca57 0%, #ff9ff3 100%)';
      default: return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }
  }};
  color: white;
  text-transform: capitalize;
`;

const UserActions = styled.div`
  display: flex;
  gap: 1rem;
`;

const ActionButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  &.edit {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }
  }
`;

const Modal = styled.div<{ show: boolean }>`
  display: ${({ show }) => show ? 'flex' : 'none'};
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(10px);
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  padding: 3rem;
  border-radius: 24px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const ModalTitle = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 2rem;
  font-weight: 800;
  text-align: center;
`;

const FormGroup = styled.div`
  margin-bottom: 2rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 1.1rem;
`;

const Select = styled.select`
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const PasswordInputContainer = styled.div`
  position: relative;
`;

const PasswordInput = styled.input`
  width: 100%;
  padding: 1rem 3rem 1rem 1rem;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: #667eea;
  font-size: 1.2rem;
`;

const ModalActions = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
`;

const ModalButton = styled.button`
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }
    
    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }
  }
  
  &.secondary {
    background: #f1f3f4;
    color: #666;
    
    &:hover {
      background: #e8eaed;
    }
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 4rem;
  font-size: 1.3rem;
  color: #667eea;
  font-weight: 600;
`;

const ErrorContainer = styled.div`
  background: linear-gradient(135deg, #fee 0%, #fdd 100%);
  border: 2px solid #fcc;
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  color: #c33;
  font-weight: 600;
`;

const ProductsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ProductCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  padding: 1.5rem;
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.12);
    border-color: rgba(102, 126, 234, 0.3);
  }
`;

const OrdersGrid = styled.div`
  display: grid;
  gap: 1rem;
`;

const OrderCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  padding: 1.5rem;
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.12);
    border-color: rgba(102, 126, 234, 0.3);
  }
`;

// Componente principal
const AdminDashboardPage: FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'users' | 'orders'>('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  
  // Estados para el modal de cambio de rol
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!user) {
          navigate('/login');
          return;
        }
        
        if (user.role !== 'admin') {
          setError({ auth: 'Acceso denegado. Debes ser administrador.' });
          setLoading(false);
          return;
        }

        await Promise.all([
          loadStats(),
          loadProducts(),
          loadUsers(),
          loadOrders(),
          loadExchangeRate()
        ]);

      } catch (err) {
        console.error('Error initializing admin dashboard:', err);
        setError({ general: 'Error al cargar el dashboard. Por favor, recarga la página.' });
      } finally {
        setLoading(false);
      }
    };

    initializeDashboard();
  }, [user, navigate]);

  const loadStats = async () => {
    try {
      const response: AxiosResponse<AdminStats> = await apiClient.get('/admin/stats/');
      setStats(response.data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError(prev => ({ ...prev, stats: 'Error al cargar estadísticas' }));
    }
  };

  const loadProducts = async () => {
    try {
      const response: AxiosResponse<Product[]> = await apiClient.get('/products/');
      setProducts(response.data);
    } catch (err) {
      console.error('Error loading products:', err);
      setError(prev => ({ ...prev, products: 'Error al cargar productos' }));
    }
  };

  const loadUsers = async () => {
    try {
      const response: AxiosResponse<User[]> = await apiClient.get('/users/');
      // Filtrar el usuario actual (administrador)
      const filteredUsers = response.data.filter(u => u.id !== user?.id);
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(prev => ({ ...prev, users: 'Error al cargar usuarios' }));
    }
  };

  const loadOrders = async () => {
    try {
      const response: AxiosResponse<Order[]> = await apiClient.get('/orders/get_orders/');
      setOrders(response.data);
    } catch (err) {
      console.error('Error loading orders:', err);
      setError(prev => ({ ...prev, orders: 'Error al cargar órdenes' }));
    }
  };

  const loadExchangeRate = async () => {
    try {
      const response: AxiosResponse<ExchangeRateResponse> = await apiClient.get('/exchange-rate/');
      setExchangeRate(response.data.rate);
    } catch (err) {
      console.error('Error loading exchange rate:', err);
      setError(prev => ({ ...prev, exchangeRate: 'Error al cargar la tasa de cambio' }));
    }
  };

  const handleEditRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setAdminPassword('');
    setShowRoleModal(true);
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !adminPassword) {
      alert('Por favor, complete todos los campos');
      return;
    }
  
    setRoleChangeLoading(true);
    try {
      // Verificar la contraseña del administrador
      const authResponse = await apiClient.post('/auth/verify-password/', {
        password: adminPassword  // Solo enviar password, no email
      });
  
      if (authResponse.data.success) {  // Cambiar de 'valid' a 'success'
        // Actualizar el rol del usuario
        await apiClient.patch(`/users/${selectedUser.id}/`, {
          role: newRole
        });
  
        // Actualizar la lista de usuarios
        await loadUsers();
        
        setShowRoleModal(false);
        setSelectedUser(null);
        setAdminPassword('');
        alert('Rol actualizado exitosamente');
      } else {
        alert('Contraseña incorrecta');
      }
    } catch (err) {
      console.error('Error changing role:', err);
      alert('Error al cambiar el rol. Verifique su contraseña.');
    } finally {
      setRoleChangeLoading(false);
    }
  };
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'bodeguero': return 'Bodeguero';
      case 'contador': return 'Contador';
      case 'cliente': return 'Cliente';
      default: return role;
    }
  };

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <MainContent>
          <DashboardContainer>
            <LoadingContainer>Cargando dashboard de administrador...</LoadingContainer>
          </DashboardContainer>
        </MainContent>
        <Footer />
      </PageContainer>
    );
  }

  if (error && (error.auth || error.general)) {
    return (
      <PageContainer>
        <Navbar />
        <MainContent>
          <DashboardContainer>
            <ErrorContainer>
              <h3>Error</h3>
              {error.auth && <p>{error.auth}</p>}
              {error.general && <p>{error.general}</p>}
              {!error.auth && <button onClick={() => window.location.reload()}>Recargar página</button>}
            </ErrorContainer>
          </DashboardContainer>
        </MainContent>
        <Footer />
      </PageContainer>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'stats':
        return (
          <ContentContainer>
            <SectionTitle>📊 Estadísticas Generales</SectionTitle>
            {stats && (
              <StatsGrid>
                <StatCard>
                  <StatValue>{stats.total_products}</StatValue>
                  <StatLabel>Total Productos</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{stats.total_users}</StatValue>
                  <StatLabel>Total Usuarios</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>{stats.total_orders}</StatValue>
                  <StatLabel>Total Órdenes</StatLabel>
                </StatCard>
                <StatCard>
                  <StatValue>${stats.total_revenue?.toFixed(2) || '0.00'}</StatValue>
                  <StatLabel>Ingresos Totales</StatLabel>
                </StatCard>
                {exchangeRate && (
                  <StatCard>
                    <StatValue>${exchangeRate}</StatValue>
                    <StatLabel>Tasa USD a CLP</StatLabel>
                  </StatCard>
                )}
                {stats.orders_by_status && (
                  <>
                    <StatCard>
                      <StatValue>{stats.orders_by_status.pendiente}</StatValue>
                      <StatLabel>Órdenes Pendientes</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>{stats.orders_by_status.completado}</StatValue>
                      <StatLabel>Órdenes Completadas</StatLabel>
                    </StatCard>
                    <StatCard>
                      <StatValue>{stats.orders_by_status.cancelado}</StatValue>
                      <StatLabel>Órdenes Canceladas</StatLabel>
                    </StatCard>
                  </>
                )}
              </StatsGrid>
            )}
          </ContentContainer>
        );
        
      case 'products':
        return (
          <ContentContainer>
            <SectionTitle>📦 Gestión de Productos ({products.length})</SectionTitle>
            <ProductsGrid>
              {products.map(product => (
                <ProductCard key={product.id}>
                  <h4>{product.name}</h4>
                  <p>Categoría: {product.category.name}</p>
                  <p>Stock: {product.stock}</p>
                  <p>Precio: ${product.price}</p>
                </ProductCard>
              ))}
            </ProductsGrid>
          </ContentContainer>
        );
        
      case 'users':
        return (
          <ContentContainer>
            <SectionTitle>👥 Gestión de Usuarios ({users.length})</SectionTitle>
            <UsersGrid>
              {users.map(userItem => (
                <UserCard key={userItem.id}>
                  <UserInfo2>
                    <UserName>{userItem.first_name} {userItem.last_name}</UserName>
                    <UserEmail>{userItem.email}</UserEmail>
                    <UserRole role={userItem.role}>
                      {getRoleDisplayName(userItem.role)}
                    </UserRole>
                  </UserInfo2>
                  <UserActions>
                    <ActionButton 
                      className="edit" 
                      onClick={() => handleEditRole(userItem)}
                    >
                      <FaEdit /> Cambiar Rol
                    </ActionButton>
                  </UserActions>
                </UserCard>
              ))}
            </UsersGrid>
          </ContentContainer>
        );
        
      case 'orders':
        return (
          <ContentContainer>
            <SectionTitle>📋 Gestión de Órdenes ({orders.length})</SectionTitle>
            <OrdersGrid>
              {orders.map(order => (
                <OrderCard key={order.id}>
                  <h4>Orden #{order.id}</h4>
                  <p>Usuario: {order.user.email}</p>
                  <p>Total: ${order.total}</p>
                  <p>Estado: {order.status}</p>
                  <p>Fecha: {new Date(order.created_at).toLocaleDateString()}</p>
                </OrderCard>
              ))}
            </OrdersGrid>
          </ContentContainer>
        );
        
      default:
        return null;
    }
  };

  return (
    <PageContainer>
      <Navbar />
      <MainContent>
        <DashboardContainer>
          <Header>
            <HeaderLeft>
              <FaChartLine size={50} color="#667eea" />
              <Title>Panel de Administrador</Title>
            </HeaderLeft>
            <HeaderRight>
              {user && <UserInfo>Hola, {user.first_name}!</UserInfo>}
              <NavButton onClick={() => navigate('/')}>
                <FaHome /> Ir a Inicio
              </NavButton>
              <NavButton onClick={handleLogout} className="secondary">
                <FaSignOutAlt /> Cerrar Sesión
              </NavButton>
            </HeaderRight>
          </Header>

          <TabsContainer>
            <Tab active={activeTab === 'stats'} onClick={() => setActiveTab('stats')}>
              📊 Estadísticas
            </Tab>
            <Tab active={activeTab === 'products'} onClick={() => setActiveTab('products')}>
              📦 Productos
            </Tab>
            <Tab active={activeTab === 'users'} onClick={() => setActiveTab('users')}>
              👥 Usuarios
            </Tab>
            <Tab active={activeTab === 'orders'} onClick={() => setActiveTab('orders')}>
              📋 Órdenes
            </Tab>
          </TabsContainer>

          {renderContent()}
        </DashboardContainer>
      </MainContent>
      <Footer />
      
      {/* Modal para cambio de rol */}
      <Modal show={showRoleModal}>
        <ModalContent>
          <ModalTitle>
            <FaLock /> Cambiar Rol de Usuario
          </ModalTitle>
          
          {selectedUser && (
            <>
              <FormGroup>
                <Label>Usuario:</Label>
                <p><strong>{selectedUser.first_name} {selectedUser.last_name}</strong></p>
                <p>{selectedUser.email}</p>
              </FormGroup>
              
              <FormGroup>
                <Label>Nuevo Rol:</Label>
                <Select 
                  value={newRole} 
                  onChange={(e) => setNewRole(e.target.value)}
                >
                  <option value="cliente">Cliente</option>
                  <option value="bodeguero">Bodeguero</option>
                  <option value="contador">Contador</option>
                  <option value="admin">Administrador</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Confirme su contraseña de administrador:</Label>
                <PasswordInputContainer>
                  <PasswordInput
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Ingrese su contraseña"
                  />
                  <PasswordToggle 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </PasswordToggle>
                </PasswordInputContainer>
              </FormGroup>
              
              <ModalActions>
                <ModalButton 
                  className="secondary" 
                  onClick={() => setShowRoleModal(false)}
                >
                  Cancelar
                </ModalButton>
                <ModalButton 
                  className="primary" 
                  onClick={handleRoleChange}
                  disabled={roleChangeLoading || !adminPassword}
                >
                  {roleChangeLoading ? 'Procesando...' : 'Confirmar Cambio'}
                </ModalButton>
              </ModalActions>
            </>
          )}
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default AdminDashboardPage;