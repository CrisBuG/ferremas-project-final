import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { 
  FaUser, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaCamera, 
  FaShoppingBag,
  FaMapMarkerAlt,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaSpinner,
  FaCalendarAlt,
  FaDollarSign,
  FaBox,
  FaUndo,
  FaPlus
} from 'react-icons/fa';
import { userService, orderService, categoryService, returnsService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { toast } from 'react-toastify';

// Interfaces
interface UserProfile {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  profile_picture?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_postal_code?: string;
  shipping_country?: string;
}

interface Order {
  id: number;
  total_amount: number;
  status: string;
  created_at: string;
  items: OrderItem[];
  shipping_address: string;
}

interface OrderItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    images?: Array<{ image_url: string }>;
  };
  quantity: number;
  price: number;
}

interface Return {
  id: number;
  order: number;
  reason: string;
  description: string;
  status: string;
  created_at: string;
  order_details?: {
    id: number;
    total_amount: number;
    created_at: string;
  };
}

interface ReturnFormData {
  order_id: string;
  reason: string;
  description: string;
}

// Keyframes
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
`;

const pulse = keyframes`
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
`;

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

// Styled Components
const ProfileContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem 0;
`;

const ProfileContent = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  animation: ${fadeInUp} 0.8s ease-out;
`;

const ProfileHeader = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 2rem;
  animation: ${slideIn} 0.6s ease-out;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ProfileImageContainer = styled.div`
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid #667eea;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3);
  }
`;

const ProfileImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const ImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${ProfileImageContainer}:hover & {
    opacity: 1;
  }
`;

const UserInfo = styled.div`
  flex: 1;
`;

const UserName = styled.h1`
  margin: 0 0 0.5rem 0;
  color: #333;
  font-size: 2rem;
  font-weight: 600;
`;

const UserEmail = styled.p`
  margin: 0;
  color: #666;
  font-size: 1.1rem;
`;

const TabContainer = styled.div`
  background: white;
  border-radius: 20px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  animation: ${fadeInUp} 0.8s ease-out 0.2s both;
`;

const TabHeader = styled.div`
  display: flex;
  background: #f8f9fa;
  border-bottom: 1px solid #e9ecef;
  
  @media (max-width: 768px) {
    flex-wrap: wrap;
  }
`;

const TabButton = styled.button<{ active: boolean }>`
  flex: 1;
  padding: 1rem 1.5rem;
  border: none;
  background: ${props => props.active ? '#667eea' : 'transparent'};
  color: ${props => props.active ? 'white' : '#666'};
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  
  &:hover {
    background: ${props => props.active ? '#5a6fd8' : '#e9ecef'};
    transform: translateY(-2px);
  }
  
  @media (max-width: 768px) {
    flex: 1 1 50%;
    font-size: 0.9rem;
  }
`;

const TabContent = styled.div`
  padding: 2rem;
  animation: ${fadeInUp} 0.5s ease-out;
`;

const FormGroup = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  color: #333;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
`;

const Select = styled.select`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  padding: 0.75rem 1rem;
  border: 2px solid #e9ecef;
  border-radius: 10px;
  font-size: 1rem;
  min-height: 100px;
  resize: vertical;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  
  ${props => {
    switch (props.variant) {
      case 'danger':
        return `
          background: #dc3545;
          color: white;
          &:hover {
            background: #c82333;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(220, 53, 69, 0.3);
          }
        `;
      case 'secondary':
        return `
          background: #6c757d;
          color: white;
          &:hover {
            background: #5a6268;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(108, 117, 125, 0.3);
          }
        `;
      default:
        return `
          background: #667eea;
          color: white;
          &:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const PasswordInputContainer = styled.div`
  position: relative;
`;

const PasswordToggle = styled.button`
  position: absolute;
  right: 1rem;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: none;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #333;
  }
`;

const OrderCard = styled.div`
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  animation: ${slideIn} 0.5s ease-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const OrderHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const OrderId = styled.h3`
  margin: 0;
  color: #333;
  font-size: 1.2rem;
`;

const OrderStatus = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status.toLowerCase()) {
      case 'completed':
      case 'entregado':
        return 'background: #d4edda; color: #155724;';
      case 'pending':
      case 'pendiente':
        return 'background: #fff3cd; color: #856404;';
      case 'processing':
      case 'procesando':
        return 'background: #cce7ff; color: #004085;';
      case 'cancelled':
      case 'cancelado':
        return 'background: #f8d7da; color: #721c24;';
      default:
        return 'background: #e2e3e5; color: #383d41;';
    }
  }}
`;

const OrderItems = styled.div`
  display: grid;
  gap: 0.75rem;
`;

const OrderItem = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: white;
  border-radius: 10px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    text-align: center;
  }
`;

const ItemImage = styled.img`
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 8px;
`;

const ItemInfo = styled.div`
  flex: 1;
`;

const ItemName = styled.h4`
  margin: 0 0 0.25rem 0;
  color: #333;
  font-size: 1rem;
`;

const ItemDetails = styled.p`
  margin: 0;
  color: #666;
  font-size: 0.875rem;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  
  svg {
    animation: ${spin} 1s linear infinite;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #666;
  
  svg {
    font-size: 3rem;
    margin-bottom: 1rem;
    opacity: 0.5;
  }
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const Modal = styled.div<{ show: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: ${props => props.show ? 'flex' : 'none'};
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 20px;
  padding: 2rem;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  animation: ${fadeInUp} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  
  h2 {
    margin: 0;
    color: #333;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #666;
  cursor: pointer;
  padding: 0.25rem;
  
  &:hover {
    color: #333;
  }
`;

const ReturnCard = styled.div`
  background: #f8f9fa;
  border-radius: 15px;
  padding: 1.5rem;
  margin-bottom: 1rem;
  border: 1px solid #e9ecef;
  transition: all 0.3s ease;
  animation: ${slideIn} 0.5s ease-out;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
`;

const ReturnStatus = styled.span<{ status: string }>`
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.875rem;
  font-weight: 500;
  
  ${props => {
    switch (props.status.toLowerCase()) {
      case 'approved':
      case 'aprobado':
        return 'background: #d4edda; color: #155724;';
      case 'pending':
      case 'pendiente':
        return 'background: #fff3cd; color: #856404;';
      case 'rejected':
      case 'rechazado':
        return 'background: #f8d7da; color: #721c24;';
      default:
        return 'background: #e2e3e5; color: #383d41;';
    }
  }}
`;

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados
  const [activeTab, setActiveTab] = useState(() => {
    // Verificar si se pasó un estado con activeTab
    if (location.state && (location.state as any).activeTab) {
      return (location.state as any).activeTab;
    }
    return 'personal';
  });
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [returns, setReturns] = useState<Return[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  
  // Estados para formularios
  const [personalData, setPersonalData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: ''
  });
  
  const [shippingData, setShippingData] = useState({
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_postal_code: '',
    shipping_country: 'Chile'
  });
  
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  const [returnFormData, setReturnFormData] = useState<ReturnFormData>({
    order_id: '',
    reason: '',
    description: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [editMode, setEditMode] = useState({
    personal: false,
    shipping: false
  });

  // Efectos
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadUserProfile();
    loadOrders();
    loadReturns();
  }, [user, navigate]);

  // Funciones de carga de datos
  const loadUserProfile = async () => {
    try {
      const response = await userService.getProfile();
      const userData = response.data;
      
      setPersonalData({
        first_name: userData.first_name || '',
        last_name: userData.last_name || '',
        email: userData.email || '',
        phone: userData.phone || ''
      });
      
      setShippingData({
        shipping_address: userData.shipping_address || '',
        shipping_city: userData.shipping_city || '',
        shipping_state: userData.shipping_state || '',
        shipping_postal_code: userData.shipping_postal_code || '',
        shipping_country: userData.shipping_country || 'Chile'
      });
    } catch (error) {
      console.error('Error al cargar perfil:', error);
      toast.error('Error al cargar los datos del perfil');
    }
  };

  const loadOrders = async () => {
    setOrdersLoading(true);
    try {
      const response = await userService.getMyOrders();
      setOrders(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error al cargar órdenes:', error);
      toast.error('Error al cargar el historial de órdenes');
    } finally {
      setOrdersLoading(false);
    }
  };

  
const loadReturns = async () => {
  try {
    setReturnsLoading(true);
    const response = await returnsService.getReturns(); // Cambiar de getMyReturns a getReturns
    setReturns(response.data);
  } catch (error) {
    console.error('Error loading returns:', error);
  } finally {
    setReturnsLoading(false);
  }
};

  // Funciones de manejo de formularios
  const handlePersonalDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPersonalData({
      ...personalData,
      [e.target.name]: e.target.value
    });
  };

  const handleShippingDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setShippingData({
      ...shippingData,
      [e.target.name]: e.target.value
    });
  };

  const handlePasswordDataChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });
  };

  const handleReturnFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setReturnFormData({
      ...returnFormData,
      [e.target.name]: e.target.value
    });
  };

  // Funciones de guardado
  const savePersonalData = async () => {
    setLoading(true);
    try {
      await userService.updateProfile(personalData);
      setEditMode({ ...editMode, personal: false });
      toast.success('Datos personales actualizados correctamente');
      
      // Actualizar contexto de usuario
      if (updateUser) {
        updateUser({ ...user, ...personalData });
      }
    } catch (error) {
      console.error('Error al actualizar datos personales:', error);
      toast.error('Error al actualizar los datos personales');
    } finally {
      setLoading(false);
    }
  };

  const saveShippingData = async () => {
    setLoading(true);
    try {
      await userService.updateProfile(shippingData);
      setEditMode({ ...editMode, shipping: false });
      toast.success('Datos de envío actualizados correctamente');
    } catch (error) {
      console.error('Error al actualizar datos de envío:', error);
      toast.error('Error al actualizar los datos de envío');
    } finally {
      setLoading(false);
    }
  };

  const changePassword = async () => {
    if (passwordData.new_password !== passwordData.confirm_password) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordData.new_password.length < 8) {
      toast.error('La nueva contraseña debe tener al menos 8 caracteres');
      return;
    }

    setLoading(true);
    try {
      await userService.changePassword({
        current_password: passwordData.current_password,
        new_password: passwordData.new_password
      });
      
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: ''
      });
      
      toast.success('Contraseña cambiada correctamente');
    } catch (error: any) {
      console.error('Error al cambiar contraseña:', error);
      
      // Manejo específico del error 405
      if (error.response?.status === 405) {
        toast.error('Funcionalidad de cambio de contraseña no disponible temporalmente. Contacta al administrador.');
      } else if (error.response?.data?.current_password) {
        toast.error('La contraseña actual es incorrecta');
      } else if (error.response?.status === 404) {
        toast.error('Endpoint de cambio de contraseña no encontrado. Contacta al administrador.');
      } else {
        toast.error('Error al cambiar la contraseña: ' + (error.response?.data?.detail || error.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const submitReturn = async () => {
    if (!returnFormData.order_id || !returnFormData.reason || !returnFormData.description) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      await returnsService.createReturn({
        order: parseInt(returnFormData.order_id),
        reason: returnFormData.reason,
        description: returnFormData.description
      });
      
      setReturnFormData({
        order_id: '',
        reason: '',
        description: ''
      });
      
      setShowReturnModal(false);
      toast.success('Solicitud de devolución enviada correctamente');
      loadReturns(); // Recargar la lista de devoluciones
    } catch (error: any) {
      console.error('Error al crear devolución:', error);
      if (error.response?.data?.detail) {
        toast.error(error.response.data.detail);
      } else {
        toast.error('Error al enviar la solicitud de devolución');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para manejar la subida de foto de perfil
  const handleProfileImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen debe ser menor a 5MB');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('profile_picture', file);
      
      const response = await userService.updateProfile(formData);
      
      // Actualizar contexto de usuario
      if (updateUser && response.data.user) {
        updateUser({ ...user, profile_picture: response.data.user.profile_picture });
      }
      
      toast.success('Foto de perfil actualizada correctamente');
      // Recargar datos del perfil
      await loadUserProfile();
    } catch (error: any) {
      console.error('Error al actualizar foto de perfil:', error);
      if (error.response?.status === 405) {
        toast.error('Error de configuración del servidor. Contacta al administrador.');
      } else {
        toast.error('Error al actualizar la foto de perfil');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para formatear fecha
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Función para formatear precio
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP'
    }).format(price);
  };

  // Función para obtener imagen de perfil con fallback
  const getProfileImageSrc = () => {
    if (user?.profile_picture) {
      // Si la URL ya es completa, usarla directamente
      if (user.profile_picture.startsWith('http')) {
        return user.profile_picture;
      }
      // Si es una ruta relativa, construir la URL completa usando el origen del backend
      // Tomamos REACT_APP_API_URL (que normalmente termina en /api) y removemos el sufijo /api
      const backendOrigin = (process.env.REACT_APP_API_URL || 'http://localhost:8000/api').replace(/\/api\/?$/, '');
      return `${backendOrigin}${user.profile_picture}`;
    }
    // Imagen por defecto
    return 'https://via.placeholder.com/120x120/667eea/ffffff?text=Usuario';
  };

  if (!user) {
    return (
      <LoadingSpinner>
        <FaSpinner size={24} />
      </LoadingSpinner>
    );
  }

  return (
    <>
      <Navbar />
      <ProfileContainer>
        <ProfileContent>
          {/* Header del perfil */}
          <ProfileHeader>
            <ProfileImageContainer onClick={() => fileInputRef.current?.click()}>
              <ProfileImage 
                src={getProfileImageSrc()}
                alt="Foto de perfil"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://via.placeholder.com/120x120/667eea/ffffff?text=Usuario';
                }}
              />
              <ImageOverlay>
                <FaCamera size={24} color="white" />
              </ImageOverlay>
              <HiddenFileInput
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleProfileImageChange}
              />
            </ProfileImageContainer>
            
            <UserInfo>
              <UserName>
                {user.first_name && user.last_name 
                  ? `${user.first_name} ${user.last_name}` 
                  : user.email
                }
              </UserName>
              <UserEmail>{user.email}</UserEmail>
            </UserInfo>
          </ProfileHeader>

          {/* Contenido con pestañas */}
          <TabContainer>
            <TabHeader>
              <TabButton 
                active={activeTab === 'personal'} 
                onClick={() => setActiveTab('personal')}
              >
                <FaUser /> Datos Personales
              </TabButton>
              <TabButton 
                active={activeTab === 'shipping'} 
                onClick={() => setActiveTab('shipping')}
              >
                <FaMapMarkerAlt /> Datos de Envío
              </TabButton>
              <TabButton 
                active={activeTab === 'password'} 
                onClick={() => setActiveTab('password')}
              >
                <FaLock /> Cambiar Contraseña
              </TabButton>
              <TabButton 
                active={activeTab === 'orders'} 
                onClick={() => setActiveTab('orders')}
              >
                <FaShoppingBag /> Mis Órdenes
              </TabButton>
              <TabButton 
                active={activeTab === 'returns'} 
                onClick={() => setActiveTab('returns')}
              >
                <FaUndo /> Devoluciones
              </TabButton>
            </TabHeader>

            <TabContent>
              {/* Pestaña de Datos Personales */}
              {activeTab === 'personal' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: '#333' }}>Datos Personales</h2>
                    {!editMode.personal ? (
                      <Button onClick={() => setEditMode({ ...editMode, personal: true })}>
                        <FaEdit /> Editar
                      </Button>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button onClick={savePersonalData} disabled={loading}>
                          {loading ? <FaSpinner /> : <FaSave />} Guardar
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => {
                            setEditMode({ ...editMode, personal: false });
                            loadUserProfile();
                          }}
                        >
                          <FaTimes /> Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <FormRow>
                    <FormGroup>
                      <Label>Nombre</Label>
                      <Input
                        type="text"
                        name="first_name"
                        value={personalData.first_name}
                        onChange={handlePersonalDataChange}
                        disabled={!editMode.personal}
                        placeholder="Ingresa tu nombre"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Apellido</Label>
                      <Input
                        type="text"
                        name="last_name"
                        value={personalData.last_name}
                        onChange={handlePersonalDataChange}
                        disabled={!editMode.personal}
                        placeholder="Ingresa tu apellido"
                      />
                    </FormGroup>
                  </FormRow>
                  
                  <FormRow>
                    <FormGroup>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        name="email"
                        value={personalData.email}
                        onChange={handlePersonalDataChange}
                        disabled={!editMode.personal}
                        placeholder="tu@email.com"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Teléfono</Label>
                      <Input
                        type="tel"
                        name="phone"
                        value={personalData.phone}
                        onChange={handlePersonalDataChange}
                        disabled={!editMode.personal}
                        placeholder="+56 9 1234 5678"
                      />
                    </FormGroup>
                  </FormRow>
                </div>
              )}

              {/* Pestaña de Datos de Envío */}
              {activeTab === 'shipping' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: '#333' }}>Datos de Envío</h2>
                    {!editMode.shipping ? (
                      <Button onClick={() => setEditMode({ ...editMode, shipping: true })}>
                        <FaEdit /> Editar
                      </Button>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <Button onClick={saveShippingData} disabled={loading}>
                          {loading ? <FaSpinner /> : <FaSave />} Guardar
                        </Button>
                        <Button 
                          variant="secondary" 
                          onClick={() => {
                            setEditMode({ ...editMode, shipping: false });
                            loadUserProfile();
                          }}
                        >
                          <FaTimes /> Cancelar
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  <FormGroup>
                    <Label>Dirección</Label>
                    <TextArea
                      name="shipping_address"
                      value={shippingData.shipping_address}
                      onChange={handleShippingDataChange}
                      disabled={!editMode.shipping}
                      placeholder="Ingresa tu dirección completa"
                    />
                  </FormGroup>
                  
                  <FormRow>
                    <FormGroup>
                      <Label>Ciudad</Label>
                      <Input
                        type="text"
                        name="shipping_city"
                        value={shippingData.shipping_city}
                        onChange={handleShippingDataChange}
                        disabled={!editMode.shipping}
                        placeholder="Ciudad"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>Región</Label>
                      <Input
                        type="text"
                        name="shipping_state"
                        value={shippingData.shipping_state}
                        onChange={handleShippingDataChange}
                        disabled={!editMode.shipping}
                        placeholder="Región"
                      />
                    </FormGroup>
                  </FormRow>
                  
                  <FormRow>
                    <FormGroup>
                      <Label>Código Postal</Label>
                      <Input
                        type="text"
                        name="shipping_postal_code"
                        value={shippingData.shipping_postal_code}
                        onChange={handleShippingDataChange}
                        disabled={!editMode.shipping}
                        placeholder="Código postal"
                      />
                    </FormGroup>
                    <FormGroup>
                      <Label>País</Label>
                      <Input
                        type="text"
                        name="shipping_country"
                        value={shippingData.shipping_country}
                        onChange={handleShippingDataChange}
                        disabled={!editMode.shipping}
                        placeholder="País"
                      />
                    </FormGroup>
                  </FormRow>
                </div>
              )}

              {/* Pestaña de Cambiar Contraseña */}
              {activeTab === 'password' && (
                <div>
                  <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Cambiar Contraseña</h2>
                  
                  <FormGroup>
                    <Label>Contraseña Actual</Label>
                    <PasswordInputContainer>
                      <Input
                        type={showPasswords.current ? 'text' : 'password'}
                        name="current_password"
                        value={passwordData.current_password}
                        onChange={handlePasswordDataChange}
                        placeholder="Ingresa tu contraseña actual"
                      />
                      <PasswordToggle
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                      >
                        {showPasswords.current ? <FaEyeSlash /> : <FaEye />}
                      </PasswordToggle>
                    </PasswordInputContainer>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Nueva Contraseña</Label>
                    <PasswordInputContainer>
                      <Input
                        type={showPasswords.new ? 'text' : 'password'}
                        name="new_password"
                        value={passwordData.new_password}
                        onChange={handlePasswordDataChange}
                        placeholder="Ingresa tu nueva contraseña"
                      />
                      <PasswordToggle
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                      >
                        {showPasswords.new ? <FaEyeSlash /> : <FaEye />}
                      </PasswordToggle>
                    </PasswordInputContainer>
                  </FormGroup>
                  
                  <FormGroup>
                    <Label>Confirmar Nueva Contraseña</Label>
                    <PasswordInputContainer>
                      <Input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        name="confirm_password"
                        value={passwordData.confirm_password}
                        onChange={handlePasswordDataChange}
                        placeholder="Confirma tu nueva contraseña"
                      />
                      <PasswordToggle
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                      >
                        {showPasswords.confirm ? <FaEyeSlash /> : <FaEye />}
                      </PasswordToggle>
                    </PasswordInputContainer>
                  </FormGroup>
                  
                  <Button onClick={changePassword} disabled={loading}>
                    {loading ? <FaSpinner /> : <FaCheck />} Cambiar Contraseña
                  </Button>
                </div>
              )}

              {/* Pestaña de Órdenes */}
              {activeTab === 'orders' && (
                <div>
                  <h2 style={{ marginBottom: '1.5rem', color: '#333' }}>Historial de Órdenes</h2>
                  
                  {ordersLoading ? (
                    <LoadingSpinner>
                      <FaSpinner size={24} />
                    </LoadingSpinner>
                  ) : orders.length === 0 ? (
                    <EmptyState>
                      <FaBox />
                      <h3>No tienes órdenes aún</h3>
                      <p>Cuando realices tu primera compra, aparecerá aquí.</p>
                      <Button onClick={() => navigate('/products')}>
                        Explorar Productos
                      </Button>
                    </EmptyState>
                  ) : (
                    orders.map((order) => (
                      <OrderCard key={order.id}>
                        <OrderHeader>
                          <div>
                            <OrderId>Orden #{order.id}</OrderId>
                            <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                              <FaCalendarAlt style={{ marginRight: '0.5rem' }} />
                              {formatDate(order.created_at)}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <OrderStatus status={order.status}>
                              {order.status}
                            </OrderStatus>
                            <p style={{ margin: '0.25rem 0', color: '#333', fontWeight: '600', fontSize: '1.1rem' }}>
                              <FaDollarSign style={{ marginRight: '0.25rem' }} />
                              {formatPrice(order.total_amount)}
                            </p>
                          </div>
                        </OrderHeader>
                        
                        <OrderItems>
                          {order.items?.map((item) => (
                            <OrderItem key={item.id}>
                              <ItemImage 
                                src={item.product.images?.[0]?.image_url || '/api/placeholder/60/60'}
                                alt={item.product.name}
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = '/api/placeholder/60/60';
                                }}
                              />
                              <ItemInfo>
                                <ItemName>{item.product.name}</ItemName>
                                <ItemDetails>
                                  Cantidad: {item.quantity} × {formatPrice(item.price)}
                                </ItemDetails>
                              </ItemInfo>
                              <div style={{ fontWeight: '600', color: '#333' }}>
                                {formatPrice(item.quantity * item.price)}
                              </div>
                            </OrderItem>
                          ))}
                        </OrderItems>
                        
                        {order.shipping_address && (
                          <div style={{ marginTop: '1rem', padding: '1rem', background: 'white', borderRadius: '8px' }}>
                            <strong>Dirección de envío:</strong>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>{order.shipping_address}</p>
                          </div>
                        )}
                      </OrderCard>
                    ))
                  )}
                </div>
              )}

              {/* Pestaña de Devoluciones */}
              {activeTab === 'returns' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h2 style={{ margin: 0, color: '#333' }}>Mis Devoluciones</h2>
                    <Button onClick={() => setShowReturnModal(true)}>
                      <FaPlus /> Nueva Devolución
                    </Button>
                  </div>
                  
                  {returnsLoading ? (
                    <LoadingSpinner>
                      <FaSpinner size={24} />
                    </LoadingSpinner>
                  ) : returns.length === 0 ? (
                    <EmptyState>
                      <FaUndo />
                      <h3>No tienes devoluciones registradas</h3>
                      <p>Aquí aparecerán tus solicitudes de devolución cuando las realices.</p>
                    </EmptyState>
                  ) : (
                    returns.map((returnItem) => (
                      <ReturnCard key={returnItem.id}>
                        <OrderHeader>
                          <div>
                            <OrderId>Devolución #{returnItem.id}</OrderId>
                            <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                              <FaCalendarAlt style={{ marginRight: '0.5rem' }} />
                              {formatDate(returnItem.created_at)}
                            </p>
                            <p style={{ margin: '0.25rem 0', color: '#666', fontSize: '0.9rem' }}>
                              Orden: #{returnItem.order}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <ReturnStatus status={returnItem.status}>
                              {returnItem.status}
                            </ReturnStatus>
                          </div>
                        </OrderHeader>
                        
                        <div style={{ marginTop: '1rem' }}>
                          <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Motivo:</strong> {returnItem.reason}
                          </div>
                          <div>
                            <strong>Descripción:</strong>
                            <p style={{ margin: '0.25rem 0 0 0', color: '#666' }}>{returnItem.description}</p>
                          </div>
                        </div>
                      </ReturnCard>
                    ))
                  )}
                </div>
              )}
            </TabContent>
          </TabContainer>
        </ProfileContent>
      </ProfileContainer>

      {/* Modal para nueva devolución */}
      <Modal show={showReturnModal}>
        <ModalContent>
          <ModalHeader>
            <h2>Nueva Solicitud de Devolución</h2>
            <CloseButton onClick={() => setShowReturnModal(false)}>
              <FaTimes />
            </CloseButton>
          </ModalHeader>
          
          <FormGroup>
            <Label>Orden</Label>
            <Select
              name="order_id"
              value={returnFormData.order_id}
              onChange={handleReturnFormChange}
            >
              <option value="">Selecciona una orden</option>
              {orders.filter(order => {
                const status = order.status.toLowerCase();
                return status === 'pagada' || status === 'entregada' || status === 'completed';
              }).map((order) => (
                <option key={order.id} value={order.id}>
                  Orden #{order.id} - {formatPrice(order.total_amount)} ({formatDate(order.created_at)})
                </option>
              ))}
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Motivo de la devolución</Label>
            <Select
              name="reason"
              value={returnFormData.reason}
              onChange={handleReturnFormChange}
            >
              <option value="">Selecciona un motivo</option>
              <option value="defective">Producto defectuoso</option>
              <option value="wrong_item">Producto incorrecto</option>
              <option value="not_as_described">No coincide con la descripción</option>
              <option value="damaged">Producto dañado</option>
              <option value="other">Otro</option>
            </Select>
          </FormGroup>
          
          <FormGroup>
            <Label>Descripción detallada</Label>
            <TextArea
              name="description"
              value={returnFormData.description}
              onChange={handleReturnFormChange}
              placeholder="Describe detalladamente el problema con tu pedido..."
              rows={4}
            />
          </FormGroup>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <Button 
              variant="secondary" 
              onClick={() => setShowReturnModal(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={submitReturn} 
              disabled={loading}
            >
              {loading ? <FaSpinner /> : <FaCheck />} Enviar Solicitud
            </Button>
          </div>
        </ModalContent>
      </Modal>

      <Footer />
    </>
  );
};

export default ProfilePage;
