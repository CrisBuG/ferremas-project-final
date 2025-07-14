import React, { FC, useState, useEffect } from 'react';
import styled from 'styled-components';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { FaChartLine, FaHome, FaSignOutAlt, FaEdit, FaLock, FaEye, FaEyeSlash, FaGift, FaPlay, FaPause, FaPlus, FaFileAlt, FaReceipt, FaUndo, FaBoxes, FaCheck, FaTimes, FaDownload } from 'react-icons/fa';
import { apiClient } from '../services/api';
import { AxiosResponse } from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

// Interfaces
interface Product {
  id: number;
  name: string;
  category: {
    id: number;
    name: string;
  };
  stock: number;
  price: number;
}

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
}

interface Order {
  id: number;
  user: {
    email: string;
  };
  total: number;
  status: string;
  created_at: string;
}

interface Report {
  id: number;
  report_type: {
    id: number;
    name: string;
    description: string;
  };
  status: 'pending' | 'generating' | 'completed' | 'failed';
  generated_at: string;
  start_date: string;
  end_date: string;
  data: any;
  created_by: number;
}

interface ReportType {
  id: number;
  name: string;
  description: string;
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
  invoice_type: 'invoice' | 'receipt' | 'credit_note' | 'debit_note';
  subtotal: number;
  tax_amount: number;
  total_amount: number;
  issue_date: string;
  due_date: string;
}

interface Return {
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
  status: 'requested' | 'approved' | 'rejected' | 'processing' | 'completed';
  reason: 'defective' | 'incorrect' | 'damaged' | 'unsatisfied' | 'other';
  description: string;
  requested_at: string;
  processed_at?: string;
  refund_amount?: number;
}

interface ExchangeRateResponse {
  rate: number;
}

interface AdminStats {
  total_products: number;
  total_users: number;
  total_orders: number;
  total_revenue?: number;
  orders_by_status?: {
    pendiente: number;
    completado: number;
    cancelado: number;
  };
}

interface Promotion {
  id: number;
  name: string;
  description: string;
  promotion_type: 'percentage' | 'fixed_amount' | 'buy_x_get_y' | 'free_shipping';
  status: 'draft' | 'active' | 'paused' | 'expired';
  discount_percentage?: number;
  discount_amount?: number;
  start_date: string;
  end_date: string;
  usage_limit?: number;
  current_usage: number;
  minimum_order_amount?: number;
  created_at: string;
}

interface ErrorState {
  auth?: string;
  general?: string;
  stats?: string;
  products?: string;
  users?: string;
  orders?: string;
  promotions?: string;
  exchangeRate?: string;
  reports?: string;
  invoices?: string;
  returns?: string;
}

interface TabProps {
  active: boolean;
}

// Styled Components
const PageContainer = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const MainContent = styled.main`
  flex: 1;
  padding: 2rem;
`;

const DashboardContainer = styled.div`
  max-width: 1400px;
  margin: 0 auto;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 2rem;
  box-shadow: 0 25px 50px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #333;
  margin: 0;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
`;

const NavButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  }
  
  &.secondary {
    background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%);
    
    &:hover {
      box-shadow: 0 8px 20px rgba(255, 107, 107, 0.3);
    }
  }
`;

const UserInfo = styled.span`
  font-size: 1.1rem;
  color: #333;
  font-weight: 600;
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  border-bottom: 2px solid rgba(102, 126, 234, 0.1);
  padding-bottom: 1rem;
  flex-wrap: wrap;
`;

const Tab = styled.button<TabProps>`
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px 12px 0 0;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  
  ${({ active }) => active ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
  ` : `
    background: #f8f9fa;
    color: #666;
    
    &:hover {
      background: #e9ecef;
      transform: translateY(-1px);
    }
  `}
`;

const ContentContainer = styled.div`
  animation: fadeIn 0.5s ease-in;
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const SectionTitle = styled.h2`
  font-size: 1.8rem;
  color: #333;
  margin-bottom: 2rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const StatCard = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  padding: 2rem;
  border-radius: 16px;
  text-align: center;
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
  font-weight: 800;
  color: #667eea;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 1rem;
  color: #666;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 1.5rem;
`;

const Card = styled.div`
  background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
  padding: 2rem;
  border-radius: 16px;
  border: 2px solid rgba(102, 126, 234, 0.1);
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 30px rgba(102, 126, 234, 0.12);
    border-color: rgba(102, 126, 234, 0.3);
  }
`;

const CardTitle = styled.h4`
  font-size: 1.3rem;
  color: #333;
  margin: 0 0 0.5rem 0;
  font-weight: 700;
`;

const CardText = styled.p`
  color: #666;
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
`;

const StatusBadge = styled.span<{ status: string }>`
  display: inline-block;
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-size: 0.9rem;
  font-weight: 600;
  background: ${({ status }) => {
    switch (status) {
      case 'completed':
      case 'paid':
      case 'approved': return 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
      case 'pending':
      case 'generating':
      case 'requested': return 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
      case 'failed':
      case 'cancelled':
      case 'rejected': return 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
      case 'processing': return 'linear-gradient(135deg, #3498db 0%, #2980b9 100%)';
      case 'active': return 'linear-gradient(135deg, #2ecc71 0%, #27ae60 100%)';
      case 'paused': return 'linear-gradient(135deg, #f39c12 0%, #e67e22 100%)';
      case 'expired': return 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)';
      default: return 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)';
    }
  }};
  color: white;
  text-transform: capitalize;
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
  margin: 0.5rem 0.5rem 0 0;
  
  &.primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.3);
    }
  }
  
  &.success {
    background: linear-gradient(135deg, #2ecc71 0%, #27ae60 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(46, 204, 113, 0.3);
    }
  }
  
  &.danger {
    background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(231, 76, 60, 0.3);
    }
  }
  
  &.warning {
    background: linear-gradient(135deg, #f39c12 0%, #e67e22 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(243, 156, 18, 0.3);
    }
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
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
  max-height: 80vh;
  overflow-y: auto;
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

const Input = styled.input`
  width: 100%;
  padding: 1rem;
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

const TextArea = styled.textarea`
  width: 100%;
  padding: 1rem;
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  min-height: 100px;
  resize: vertical;
  
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

// Componente principal
const AdminDashboardPage: FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'stats' | 'products' | 'users' | 'orders' | 'promotions' | 'reports' | 'billing' | 'returns' | 'inventory'>('stats');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [reportTypes, setReportTypes] = useState<ReportType[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [returns, setReturns] = useState<Return[]>([]);
  const [exchangeRate, setExchangeRate] = useState<number | null>(null);
  
  // Estados para modales
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newRole, setNewRole] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [roleChangeLoading, setRoleChangeLoading] = useState(false);
  
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [promotionLoading, setPromotionLoading] = useState(false);
  const [newPromotion, setNewPromotion] = useState({
    name: '',
    description: '',
    promotion_type: 'percentage' as 'percentage' | 'fixed_amount',
    discount_percentage: 0,
    discount_amount: 0,
    start_date: '',
    end_date: '',
    usage_limit: 0,
    minimum_order_amount: 0
  });
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [newReport, setNewReport] = useState({
    report_type_id: 0,
    start_date: '',
    end_date: ''
  });
  
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newStock, setNewStock] = useState(0);
  const [stockLoading, setStockLoading] = useState(false);

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
          loadPromotions(),
          loadReports(),
          loadReportTypes(),
          loadInvoices(),
          loadReturns(),
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
      console.log('Cargando estadísticas...'); // Log temporal
      const response: AxiosResponse<AdminStats> = await apiClient.get('/admin/stats/');
      console.log('Estadísticas recibidas:', response.data); // Log temporal
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

  const loadPromotions = async () => {
    try {
      const response: AxiosResponse<Promotion[]> = await apiClient.get('/promotions/promotions/');
      setPromotions(response.data);
    } catch (err) {
      console.error('Error loading promotions:', err);
      setError(prev => ({ ...prev, promotions: 'Error al cargar promociones' }));
    }
  };

  const loadReports = async () => {
    try {
      const response: AxiosResponse<Report[]> = await apiClient.get('/reports/');
      setReports(response.data);
    } catch (err) {
      console.error('Error loading reports:', err);
      setError(prev => ({ ...prev, reports: 'Error al cargar reportes' }));
    }
  };

  const loadReportTypes = async () => {
    try {
      const response: AxiosResponse<ReportType[]> = await apiClient.get('/report-types/');
      setReportTypes(response.data);
    } catch (err) {
      console.error('Error loading report types:', err);
    }
  };

  const loadInvoices = async () => {
    try {
      const response: AxiosResponse<Invoice[]> = await apiClient.get('/billing/invoices/');
      setInvoices(response.data);
    } catch (err) {
      console.error('Error loading invoices:', err);
      setError(prev => ({ ...prev, invoices: 'Error al cargar facturas' }));
    }
  };

  const loadReturns = async () => {
    try {
      const response: AxiosResponse<Return[]> = await apiClient.get('/returns/returns/');
      setReturns(response.data);
    } catch (err) {
      console.error('Error loading returns:', err);
      setError(prev => ({ ...prev, returns: 'Error al cargar devoluciones' }));
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
      const authResponse = await apiClient.post('/auth/verify-password/', {
        password: adminPassword
      });
  
      if (authResponse.data.success) {
        await apiClient.patch(`/users/${selectedUser.id}/`, {
          role: newRole
        });
  
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

  const handleCreateFathersDayPromotion = async () => {
    setPromotionLoading(true);
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 30);

      const promotionData = {
        name: 'Promoción Día del Padre',
        description: 'Descuento especial del 20% en toda la tienda por el Día del Padre',
        promotion_type: 'percentage',
        status: 'active',
        discount_percentage: 20,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        usage_limit: 1000,
        minimum_order_amount: 50000,
        created_by: user?.id
      };

      await apiClient.post('/promotions/promotions/', promotionData);
      await loadPromotions();
      alert('Promoción del Día del Padre creada y activada exitosamente!');
    } catch (err) {
      console.error('Error creating Father\'s Day promotion:', err);
      alert('Error al crear la promoción. Inténtalo de nuevo.');
    } finally {
      setPromotionLoading(false);
    }
  };

  const handleCreatePromotion = async () => {
    if (!newPromotion.name || !newPromotion.description || !newPromotion.start_date || !newPromotion.end_date) {
      alert('Por favor, complete todos los campos obligatorios');
      return;
    }

    setPromotionLoading(true);
    try {
      const promotionData = {
        ...newPromotion,
        status: 'draft',
        created_by: user?.id
      };

      await apiClient.post('/promotions/promotions/', promotionData);
      await loadPromotions();
      setShowPromotionModal(false);
      setNewPromotion({
        name: '',
        description: '',
        promotion_type: 'percentage',
        discount_percentage: 0,
        discount_amount: 0,
        start_date: '',
        end_date: '',
        usage_limit: 0,
        minimum_order_amount: 0
      });
      alert('Promoción creada exitosamente!');
    } catch (err) {
      console.error('Error creating promotion:', err);
      alert('Error al crear la promoción. Inténtalo de nuevo.');
    } finally {
      setPromotionLoading(false);
    }
  };

  const handleTogglePromotion = async (promotionId: number, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'active' ? 'paused' : 'active';
      
      if (newStatus === 'active') {
        await apiClient.post(`/promotions/promotions/${promotionId}/activate/`);
      } else {
        await apiClient.patch(`/promotions/promotions/${promotionId}/`, { status: 'paused' });
      }
      
      await loadPromotions();
      alert(`Promoción ${newStatus === 'active' ? 'activada' : 'pausada'} exitosamente!`);
    } catch (err) {
      console.error('Error toggling promotion:', err);
      alert('Error al cambiar el estado de la promoción.');
    }
  };

  const handleGenerateReport = async () => {
    if (!newReport.report_type_id || !newReport.start_date || !newReport.end_date) {
      alert('Por favor, complete todos los campos');
      return;
    }

    setReportLoading(true);
    try {
      await apiClient.post('/reports/', newReport);
      await loadReports();
      setShowReportModal(false);
      setNewReport({
        report_type_id: 0,
        start_date: '',
        end_date: ''
      });
      alert('Reporte generado exitosamente!');
    } catch (err) {
      console.error('Error generating report:', err);
      alert('Error al generar el reporte.');
    } finally {
      setReportLoading(false);
    }
  };

  const handleDownloadReport = async (reportId: number) => {
    try {
      const response = await apiClient.get(`/reports/${reportId}/download/`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reporte_${reportId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Error downloading report:', err);
      alert('Error al descargar el reporte.');
    }
  };

  const handleApproveReturn = async (returnId: number) => {
    try {
      await apiClient.post(`/returns/returns/${returnId}/approve/`);
      await loadReturns();
      alert('Devolución aprobada exitosamente!');
    } catch (err) {
      console.error('Error approving return:', err);
      alert('Error al aprobar la devolución.');
    }
  };

  const handleRejectReturn = async (returnId: number) => {
    try {
      await apiClient.post(`/returns/returns/${returnId}/reject/`);
      await loadReturns();
      alert('Devolución rechazada exitosamente!');
    } catch (err) {
      console.error('Error rejecting return:', err);
      alert('Error al rechazar la devolución.');
    }
  };

  const handleUpdateStock = (product: Product) => {
    setSelectedProduct(product);
    setNewStock(product.stock);
    setShowStockModal(true);
  };

  const handleStockUpdate = async () => {
    if (!selectedProduct) return;

    setStockLoading(true);
    try {
      await apiClient.patch(`/products/${selectedProduct.id}/`, {
        stock: newStock
      });
      await loadProducts();
      setShowStockModal(false);
      setSelectedProduct(null);
      alert('Stock actualizado exitosamente!');
    } catch (err) {
      console.error('Error updating stock:', err);
      alert('Error al actualizar el stock.');
    } finally {
      setStockLoading(false);
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

  const getPromotionTypeDisplayName = (type: string) => {
    switch (type) {
      case 'percentage': return 'Porcentaje';
      case 'fixed_amount': return 'Monto Fijo';
      case 'buy_x_get_y': return 'Compra X Lleva Y';
      case 'free_shipping': return 'Envío Gratis';
      default: return type;
    }
  };

  const getStatusDisplayName = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'paused': return 'Pausada';
      case 'expired': return 'Expirada';
      case 'draft': return 'Borrador';
      case 'pending': return 'Pendiente';
      case 'generating': return 'Generando';
      case 'completed': return 'Completado';
      case 'failed': return 'Fallido';
      case 'paid': return 'Pagado';
      case 'sent': return 'Enviado';
      case 'overdue': return 'Vencido';
      case 'cancelled': return 'Cancelado';
      case 'requested': return 'Solicitado';
      case 'approved': return 'Aprobado';
      case 'rejected': return 'Rechazado';
      case 'processing': return 'Procesando';
      default: return status;
    }
  };

  const getReasonDisplayName = (reason: string) => {
    switch (reason) {
      case 'defective': return 'Defectuoso';
      case 'incorrect': return 'Incorrecto';
      case 'damaged': return 'Dañado';
      case 'unsatisfied': return 'Insatisfecho';
      case 'other': return 'Otro';
      default: return reason;
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
            <Grid>
              {products.map(product => (
                <Card key={product.id}>
                  <CardTitle>{product.name}</CardTitle>
                  <CardText>Categoría: {product.category.name}</CardText>
                  <CardText>Stock: {product.stock}</CardText>
                  <CardText>Precio: ${product.price}</CardText>
                </Card>
              ))}
            </Grid>
          </ContentContainer>
        );
        
      case 'users':
        return (
          <ContentContainer>
            <SectionTitle>👥 Gestión de Usuarios ({users.length})</SectionTitle>
            <Grid>
              {users.map(userItem => (
                <Card key={userItem.id}>
                  <CardTitle>{userItem.first_name} {userItem.last_name}</CardTitle>
                  <CardText>{userItem.email}</CardText>
                  <UserRole role={userItem.role}>
                    {getRoleDisplayName(userItem.role)}
                  </UserRole>
                  <div style={{ marginTop: '1rem' }}>
                    <ActionButton 
                      className="primary" 
                      onClick={() => handleEditRole(userItem)}
                    >
                      <FaEdit /> Cambiar Rol
                    </ActionButton>
                  </div>
                </Card>
              ))}
            </Grid>
          </ContentContainer>
        );
        
      case 'orders':
        return (
          <ContentContainer>
            <SectionTitle>📋 Gestión de Órdenes ({orders.length})</SectionTitle>
            <Grid>
              {orders.map(order => (
                <Card key={order.id}>
                  <CardTitle>Orden #{order.id}</CardTitle>
                  <CardText>Usuario: {order.user.email}</CardText>
                  <CardText>Total: ${order.total}</CardText>
                  <StatusBadge status={order.status}>{getStatusDisplayName(order.status)}</StatusBadge>
                  <CardText>Fecha: {new Date(order.created_at).toLocaleDateString()}</CardText>
                </Card>
              ))}
            </Grid>
          </ContentContainer>
        );
        
      case 'promotions':
        return (
          <ContentContainer>
            <SectionTitle>🎁 Gestión de Promociones ({promotions.length})</SectionTitle>
            
            <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <ActionButton 
                className="success" 
                onClick={handleCreateFathersDayPromotion}
                disabled={promotionLoading}
              >
                <FaGift /> {promotionLoading ? 'Creando...' : 'Crear Promoción Día del Padre'}
              </ActionButton>
              
              <ActionButton 
                className="primary" 
                onClick={() => setShowPromotionModal(true)}
              >
                <FaPlus /> Nueva Promoción Personalizada
              </ActionButton>
            </div>
            
            <Grid>
              {promotions.map(promotion => (
                <Card key={promotion.id}>
                  <CardTitle>{promotion.name}</CardTitle>
                  <CardText>{promotion.description}</CardText>
                  <CardText>Tipo: {getPromotionTypeDisplayName(promotion.promotion_type)}</CardText>
                  {promotion.discount_percentage && (
                    <CardText>Descuento: {promotion.discount_percentage}%</CardText>
                  )}
                  {promotion.discount_amount && (
                    <CardText>Descuento: ${promotion.discount_amount}</CardText>
                  )}
                  {promotion.minimum_order_amount && (
                    <CardText>Mínimo: ${promotion.minimum_order_amount}</CardText>
                  )}
                  <CardText>Uso: {promotion.current_usage}/{promotion.usage_limit || '∞'}</CardText>
                  <StatusBadge status={promotion.status}>
                    {getStatusDisplayName(promotion.status)}
                  </StatusBadge>
                  
                  {(promotion.status === 'active' || promotion.status === 'paused') && (
                    <div style={{ marginTop: '1rem' }}>
                      <ActionButton 
                        className={promotion.status === 'active' ? 'warning' : 'success'}
                        onClick={() => handleTogglePromotion(promotion.id, promotion.status)}
                      >
                        {promotion.status === 'active' ? (
                          <><FaPause /> Pausar</>
                        ) : (
                          <><FaPlay /> Activar</>
                        )}
                      </ActionButton>
                    </div>
                  )}
                </Card>
              ))}
            </Grid>
          </ContentContainer>
        );

      case 'reports':
        return (
          <ContentContainer>
            <SectionTitle><FaFileAlt /> Gestión de Reportes ({reports.length})</SectionTitle>
            
            <div style={{ marginBottom: '2rem' }}>
              <ActionButton 
                className="primary" 
                onClick={() => setShowReportModal(true)}
              >
                <FaPlus /> Generar Nuevo Reporte
              </ActionButton>
            </div>
            
            <Grid>
              {reports.map(report => (
                <Card key={report.id}>
                  <CardTitle>{report.report_type.name}</CardTitle>
                  <CardText>{report.report_type.description}</CardText>
                  <CardText>Período: {new Date(report.start_date).toLocaleDateString()} - {new Date(report.end_date).toLocaleDateString()}</CardText>
                  <StatusBadge status={report.status}>
                    {getStatusDisplayName(report.status)}
                  </StatusBadge>
                  {report.generated_at && (
                    <CardText>Generado: {new Date(report.generated_at).toLocaleDateString()}</CardText>
                  )}
                  
                  {report.status === 'completed' && (
                    <div style={{ marginTop: '1rem' }}>
                      <ActionButton 
                        className="success"
                        onClick={() => handleDownloadReport(report.id)}
                      >
                        <FaDownload /> Descargar
                      </ActionButton>
                    </div>
                  )}
                </Card>
              ))}
            </Grid>
          </ContentContainer>
        );

      case 'billing':
        return (
          <ContentContainer>
            <SectionTitle><FaReceipt /> Gestión de Facturación ({invoices.length})</SectionTitle>
            
            <Grid>
              {invoices.map(invoice => (
                <Card key={invoice.id}>
                  <CardTitle>Factura #{invoice.invoice_number}</CardTitle>
                  <CardText>Cliente: {invoice.customer.first_name} {invoice.customer.last_name}</CardText>
                  <CardText>Email: {invoice.customer.email}</CardText>
                  <CardText>Orden: #{invoice.order.id}</CardText>
                  <CardText>Tipo: {invoice.invoice_type}</CardText>
                  <CardText>Subtotal: ${invoice.subtotal}</CardText>
                  <CardText>Impuestos: ${invoice.tax_amount}</CardText>
                  <CardText>Total: ${invoice.total_amount}</CardText>
                  <StatusBadge status={invoice.status}>
                    {getStatusDisplayName(invoice.status)}
                  </StatusBadge>
                  <CardText>Emisión: {new Date(invoice.issue_date).toLocaleDateString()}</CardText>
                  <CardText>Vencimiento: {new Date(invoice.due_date).toLocaleDateString()}</CardText>
                </Card>
              ))}
            </Grid>
          </ContentContainer>
        );

      case 'returns':
        return (
          <ContentContainer>
            <SectionTitle><FaUndo /> Gestión de Devoluciones ({returns.length})</SectionTitle>
            
            <Grid>
              {returns.map(returnItem => (
                <Card key={returnItem.id}>
                  <CardTitle>Devolución #{returnItem.id}</CardTitle>
                  <CardText>Cliente: {returnItem.customer.first_name} {returnItem.customer.last_name}</CardText>
                  <CardText>Email: {returnItem.customer.email}</CardText>
                  <CardText>Orden: #{returnItem.order.id}</CardText>
                  <CardText>Motivo: {getReasonDisplayName(returnItem.reason)}</CardText>
                  <CardText>Descripción: {returnItem.description}</CardText>
                  <StatusBadge status={returnItem.status}>
                    {getStatusDisplayName(returnItem.status)}
                  </StatusBadge>
                  <CardText>Solicitado: {new Date(returnItem.requested_at).toLocaleDateString()}</CardText>
                  {returnItem.processed_at && (
                    <CardText>Procesado: {new Date(returnItem.processed_at).toLocaleDateString()}</CardText>
                  )}
                  {returnItem.refund_amount && (
                    <CardText>Reembolso: ${returnItem.refund_amount}</CardText>
                  )}
                  
                  {returnItem.status === 'requested' && (
                    <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                      <ActionButton 
                        className="success"
                        onClick={() => handleApproveReturn(returnItem.id)}
                      >
                        <FaCheck /> Aprobar
                      </ActionButton>
                      <ActionButton 
                        className="danger"
                        onClick={() => handleRejectReturn(returnItem.id)}
                      >
                        <FaTimes /> Rechazar
                      </ActionButton>
                    </div>
                  )}
                </Card>
              ))}
            </Grid>
          </ContentContainer>
        );

      case 'inventory':
        return (
          <ContentContainer>
            <SectionTitle><FaBoxes /> Gestión de Inventario ({products.length})</SectionTitle>
            
            <Grid>
              {products.map(product => (
                <Card key={product.id}>
                  <CardTitle>{product.name}</CardTitle>
                  <CardText>Categoría: {product.category.name}</CardText>
                  <CardText>Stock Actual: {product.stock}</CardText>
                  <CardText>Precio: ${product.price}</CardText>
                  
                  {product.stock < 10 && (
                    <StatusBadge status="warning">Stock Bajo</StatusBadge>
                  )}
                  
                  <div style={{ marginTop: '1rem' }}>
                    <ActionButton 
                      className="primary"
                      onClick={() => handleUpdateStock(product)}
                    >
                      <FaEdit /> Actualizar Stock
                    </ActionButton>
                  </div>
                </Card>
              ))}
            </Grid>
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
            <Tab active={activeTab === 'promotions'} onClick={() => setActiveTab('promotions')}>
              🎁 Promociones
            </Tab>
            <Tab active={activeTab === 'reports'} onClick={() => setActiveTab('reports')}>
              📄 Reportes
            </Tab>
            <Tab active={activeTab === 'billing'} onClick={() => setActiveTab('billing')}>
              💰 Facturación
            </Tab>
            <Tab active={activeTab === 'returns'} onClick={() => setActiveTab('returns')}>
              🔄 Devoluciones
            </Tab>
            <Tab active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')}>
              📦 Inventario
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
                  <option value="admin">Administrador</option>
                  <option value="bodeguero">Bodeguero</option>
                  <option value="contador">Contador</option>
                </Select>
              </FormGroup>
              
              <FormGroup>
                <Label>Contraseña de Administrador:</Label>
                <PasswordInputContainer>
                  <PasswordInput
                    type={showPassword ? 'text' : 'password'}
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="Ingresa tu contraseña de administrador"
                  />
                  <PasswordToggle onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </PasswordToggle>
                </PasswordInputContainer>
              </FormGroup>
            </>
          )}
          
          <ModalActions>
            <ModalButton 
              className="secondary" 
              onClick={() => {
                setShowRoleModal(false);
                setSelectedUser(null);
                setNewRole('');
                setAdminPassword('');
              }}
            >
              Cancelar
            </ModalButton>
            <ModalButton 
              className="primary" 
              onClick={handleRoleChange}
              disabled={!newRole || !adminPassword || roleChangeLoading}
            >
              {roleChangeLoading ? 'Cambiando...' : 'Cambiar Rol'}
            </ModalButton>
          </ModalActions>
        </ModalContent>
      </Modal>
      
      {/* Modal para crear promoción personalizada */}
      <Modal show={showPromotionModal}>
        <ModalContent>
          <ModalTitle>Crear Promoción Personalizada</ModalTitle>
          
          <FormGroup>
            <Label>Nombre de la Promoción:</Label>
            <Input
              type="text"
              value={newPromotion.name}
              onChange={(e) => setNewPromotion({...newPromotion, name: e.target.value})}
              placeholder="Ej: Descuento de Verano"
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Descripción:</Label>
            <TextArea
              value={newPromotion.description}
              onChange={(e) => setNewPromotion({...newPromotion, description: e.target.value})}
              placeholder="Describe los detalles de la promoción..."
              rows={3}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Tipo de Descuento:</Label>
            <Select
              value={newPromotion.promotion_type}
              onChange={(e) => setNewPromotion({...newPromotion, promotion_type: e.target.value as 'percentage' | 'fixed_amount'})}
            >
              <option value="percentage">Porcentaje</option>
              <option value="fixed_amount">Monto Fijo</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>
              {newPromotion.promotion_type === 'percentage' ? 'Porcentaje de Descuento (%)' : 'Monto de Descuento ($)'}:
            </Label>
            <Input
              type="number"
              min="0"
              max={newPromotion.promotion_type === 'percentage' ? "100" : undefined}
              value={newPromotion.promotion_type === 'percentage' ? newPromotion.discount_percentage : newPromotion.discount_amount}
              onChange={(e) => {
                const value = Number(e.target.value);
                if (newPromotion.promotion_type === 'percentage') {
                  setNewPromotion({...newPromotion, discount_percentage: value});
                } else {
                  setNewPromotion({...newPromotion, discount_amount: value});
                }
              }}
            />
          </FormGroup>

          <FormGroup>
            <Label>Fecha de Inicio:</Label>
            <Input
              type="date"
              value={newPromotion.start_date}
              onChange={(e) => setNewPromotion({...newPromotion, start_date: e.target.value})}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Fecha de Fin:</Label>
            <Input
              type="date"
              value={newPromotion.end_date}
              onChange={(e) => setNewPromotion({...newPromotion, end_date: e.target.value})}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Límite de Uso (0 = ilimitado):</Label>
            <Input
              type="number"
              min="0"
              value={newPromotion.usage_limit}
              onChange={(e) => setNewPromotion({...newPromotion, usage_limit: Number(e.target.value)})}
            />
          </FormGroup>
          
          <FormGroup>
            <Label>Monto Mínimo de Orden ($):</Label>
            <Input
              type="number"
              min="0"
              value={newPromotion.minimum_order_amount}
              onChange={(e) => setNewPromotion({...newPromotion, minimum_order_amount: Number(e.target.value)})}
            />
          </FormGroup>
          
          <ModalActions>
            <ModalButton 
              className="secondary" 
              onClick={() => setShowPromotionModal(false)}
            >
              Cancelar
            </ModalButton>
            <ModalButton 
              className="primary" 
              onClick={handleCreatePromotion}
              disabled={promotionLoading}
            >
              {promotionLoading ? 'Creando...' : 'Crear Promoción'}
            </ModalButton>
          </ModalActions>
        </ModalContent>
      </Modal>
    </PageContainer>
  );
};

export default AdminDashboardPage;