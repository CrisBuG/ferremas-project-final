import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaCreditCard, FaUser, FaMapMarkerAlt, FaPhone, FaShoppingCart, FaSpinner, FaCopy, FaEdit, FaToggleOn, FaToggleOff } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { cartService, orderService, transbankService, exchangeRateService } from '../services/api';
import { AxiosResponse, AxiosError } from 'axios';
import axios from 'axios';

// Interfaces
interface Product {
  id: number;
  name: string;
  price: number;
  price_clp?: number;
  primary_image?: string;
}

interface CartItem {
  id: number;
  quantity: number;
  subtotal?: number;
  product: Product;
}

interface Cart {
  id: number;
  items: CartItem[];
  total: number;
  total_price?: number;
}

interface ShippingFormData {
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_phone: string;
  shipping_first_name?: string;
  shipping_last_name?: string;
  shipping_company?: string;
}

interface OrderResponse {
  id: number;
  order?: {
    id: number;
  };
}

interface PaymentResponse {
  url: string;
  token?: string;
}

interface ErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
}

// Styled Components
const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const CheckoutContainer = styled.div`
  max-width: 1400px;
  margin: 2rem auto;
  padding: 0 2rem;
  display: grid;
  grid-template-columns: 1fr 450px;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
    max-width: 800px;
  }
  
  @media (max-width: 768px) {
    padding: 0 1rem;
    gap: 1rem;
  }
`;

const Section = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2.5rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  
  @media (max-width: 768px) {
    padding: 1.5rem;
    border-radius: 15px;
  }
`;

const SectionTitle = styled.h2`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 2rem;
  color: #2c3e50;
  font-size: 1.5rem;
  font-weight: 600;
  
  svg {
    color: #667eea;
  }
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  .full-width {
    grid-column: 1 / -1;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
    
    .full-width {
      grid-column: 1;
    }
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: #2c3e50;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.875rem 1rem;
  border: 2px solid #e1e8ed;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: white;
  
  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
  
  &:disabled {
    background: #f8f9fa;
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: #95a5a6;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 2rem;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ActionButton = styled.button<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 0.9rem;
  
  ${props => {
    switch (props.variant) {
      case 'primary':
        return `
          background: #667eea;
          color: white;
          &:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
          }
        `;
      case 'danger':
        return `
          background: #e74c3c;
          color: white;
          &:hover {
            background: #c0392b;
            transform: translateY(-2px);
          }
        `;
      default:
        return `
          background: #ecf0f1;
          color: #2c3e50;
          &:hover {
            background: #d5dbdb;
            transform: translateY(-2px);
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

const PayButton = styled.button`
  width: 100%;
  padding: 1.25rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 15px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  
  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 15px 30px rgba(102, 126, 234, 0.4);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
  
  .spinning {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const CartItemContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: #f8f9fa;
  border-radius: 12px;
  margin-bottom: 1rem;
  transition: all 0.3s ease;
  
  &:hover {
    background: #e9ecef;
    transform: translateY(-1px);
  }
`;

const ProductImage = styled.img`
  width: 80px;
  height: 80px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid #e1e8ed;
`;

const ProductInfo = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ProductName = styled.h4`
  margin: 0;
  color: #2c3e50;
  font-size: 1rem;
  font-weight: 600;
`;

const PriceContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ProductPriceUSD = styled.span`
  color: #7f8c8d;
  font-size: 0.85rem;
`;

const ProductPriceCLP = styled.span`
  color: #2c3e50;
  font-weight: 600;
  font-size: 0.95rem;
`;

const Quantity = styled.span`
  background: #667eea;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
`;

const TotalSection = styled.div`
  border-top: 2px solid #e1e8ed;
  padding-top: 1.5rem;
  margin-top: 1.5rem;
`;

const TotalRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  font-size: 1rem;
  
  &.final {
    border-top: 2px solid #667eea;
    margin-top: 1rem;
    padding-top: 1rem;
    font-weight: 700;
    font-size: 1.2rem;
    color: #2c3e50;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  gap: 1rem;
  color: white;
  font-size: 1.1rem;
  
  svg {
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #c0392b;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #e74c3c;
  font-weight: 500;
`;

const SuccessMessage = styled.div`
  background: #eef;
  color: #27ae60;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #2ecc71;
  font-weight: 500;
`;

const InfoMessage = styled.div`
  background: #e8f4fd;
  color: #2980b9;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  border-left: 4px solid #3498db;
  font-weight: 500;
`;

const DataSourceIndicator = styled.div`
  background: #f8f9fa;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.9rem;
  color: #6c757d;
  border-left: 4px solid #17a2b8;
`;

const SimulationToggle = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #f8f9fa;
  padding: 1.25rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  
  &:hover {
    background: #e9ecef;
    border-color: #667eea;
  }
`;

const ToggleText = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const ToggleTitle = styled.div`
  font-weight: 600;
  color: #2c3e50;
  font-size: 1rem;
`;

const ToggleDescription = styled.div`
  font-size: 0.85rem;
  color: #6c757d;
`;

// Constantes para localStorage
const SHIPPING_DATA_KEY = 'checkout_shipping_data';
const SHIPPING_DATA_TIMESTAMP_KEY = 'checkout_shipping_timestamp';
const DATA_EXPIRY_TIME = 24 * 60 * 60 * 1000; // 24 horas

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const deliveryMethod = searchParams.get('delivery') || 'envio';
  const couponCode = searchParams.get('coupon');
  
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [dollarRate, setDollarRate] = useState<number>(850);
  const [dataSource, setDataSource] = useState<'profile' | 'localStorage' | 'empty'>('empty');
  const [simulationMode, setSimulationMode] = useState<boolean>(false);
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  
  const [shippingData, setShippingData] = useState<ShippingFormData>({
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_phone: '',
    shipping_first_name: '',
    shipping_last_name: '',
    shipping_company: ''
  });

  // Función para cargar datos del perfil del usuario
  const loadUserShippingData = () => {
    if (user && (
      user.shipping_address || 
      user.shipping_city || 
      user.shipping_state || 
      user.shipping_postal_code || 
      user.shipping_phone
    )) {
      setShippingData({
        shipping_address: user.shipping_address || '',
        shipping_city: user.shipping_city || '',
        shipping_state: user.shipping_state || '',
        shipping_zip: user.shipping_postal_code || '',
        shipping_phone: user.shipping_phone || '',
        shipping_first_name: user.shipping_first_name || user.first_name || '',
        shipping_last_name: user.shipping_last_name || user.last_name || '',
        shipping_company: user.shipping_company || ''
      });
      setDataSource('profile');
      return true;
    }
    return false;
  };

  // Función para cargar datos guardados del localStorage
  const loadSavedShippingData = () => {
    try {
      const savedData = localStorage.getItem(SHIPPING_DATA_KEY);
      const savedTimestamp = localStorage.getItem(SHIPPING_DATA_TIMESTAMP_KEY);
      
      if (savedData && savedTimestamp) {
        const timestamp = parseInt(savedTimestamp);
        const now = Date.now();
        
        if (now - timestamp < DATA_EXPIRY_TIME) {
          const parsedData = JSON.parse(savedData);
          setShippingData(prev => ({ ...prev, ...parsedData }));
          setDataSource('localStorage');
          return true;
        } else {
          localStorage.removeItem(SHIPPING_DATA_KEY);
          localStorage.removeItem(SHIPPING_DATA_TIMESTAMP_KEY);
        }
      }
    } catch (error) {
      console.error('Error loading saved shipping data:', error);
    }
    return false;
  };

  // Función para guardar datos en localStorage
  const saveShippingData = () => {
    try {
      localStorage.setItem(SHIPPING_DATA_KEY, JSON.stringify(shippingData));
      localStorage.setItem(SHIPPING_DATA_TIMESTAMP_KEY, Date.now().toString());
      setDataSource('localStorage');
      setSuccess('Datos guardados correctamente.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error saving shipping data:', error);
      setError('Error al guardar los datos.');
    }
  };

  const copyFromProfile = () => {
    if (loadUserShippingData()) {
      setSuccess('Datos copiados desde tu perfil.');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError('No hay datos de envío en tu perfil. Actualiza tu perfil primero.');
    }
  };

  const clearSavedData = () => {
    try {
      localStorage.removeItem(SHIPPING_DATA_KEY);
      localStorage.removeItem(SHIPPING_DATA_TIMESTAMP_KEY);
      
      // Recargar datos del perfil si están disponibles
      if (!loadUserShippingData()) {
        setShippingData({
          shipping_address: '',
          shipping_city: '',
          shipping_state: '',
          shipping_zip: '',
          shipping_phone: '',
          shipping_first_name: '',
          shipping_last_name: '',
          shipping_company: ''
        });
        setDataSource('empty');
      }
      
      setSuccess('Datos eliminados correctamente.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error clearing saved data:', error);
    }
  };

  const getDataSourceMessage = () => {
    switch (dataSource) {
      case 'profile':
        return '📋 Datos cargados desde tu perfil';
      case 'localStorage':
        return '💾 Datos cargados desde sesión anterior';
      default:
        return '✏️ Completa la información de envío';
    }
  };

  // Función para cargar el carrito
  const loadCart = async () => {
    try {
      setLoading(true);
      const response = await cartService.getCart();
      setCart(response.data);
      
      if (!response.data || !response.data.items || response.data.items.length === 0) {
        setError('Tu carrito está vacío. Agrega algunos productos antes de proceder al checkout.');
      }
    } catch (err) {
      console.error('Error loading cart:', err);
      const axiosError = err as AxiosError<ErrorResponse>;
      if (axiosError.response?.status === 401) {
        navigate('/login');
      } else {
        setError('Error al cargar el carrito. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Función para cargar el tipo de cambio
  const loadExchangeRate = async () => {
    try {
      const response = await exchangeRateService.getExchangeRate();
      setDollarRate(response.data.rate || response.data);
    } catch (error) {
      console.error('Error loading exchange rate:', error);
      // Mantener el valor por defecto si falla
    }
  };

  // Función para manejar cambios en el formulario
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setShippingData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Función para calcular el total en USD
  const calculateTotal = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  // Función para calcular el total en CLP
  const calculateTotalCLP = () => {
    if (!cart || !cart.items) return 0;
    return cart.items.reduce((total, item) => {
      const priceCLP = item.product.price_clp || (item.product.price * dollarRate);
      return total + (priceCLP * item.quantity);
    }, 0);
  };

  // Función para calcular el total final con descuentos
  const calculateFinalTotal = () => {
    const subtotal = calculateTotalCLP();
    const discount = appliedCoupon ? subtotal * (appliedCoupon.discount_percentage / 100) : 0;
    setCouponDiscount(discount);
    return subtotal - discount;
  };

  const handleIntegrationPayment = async (orderId: number) => {
    try {
      const response = await transbankService.createIntegrationTransaction({
        order_id: orderId,
        amount: Math.round(calculateFinalTotal())
      });
      
      if (response.data.success && response.data.url) {
        // Redirigir a Transbank con dinero ficticio
        window.location.href = response.data.url;
      } else {
        setError('Error al iniciar pago de integración');
      }
    } catch (error) {
      console.error('Error en pago de integración:', error);
      setError('Error al procesar el pago de integración');
    }
  };

  // Función para manejar el envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cart || !cart.items || cart.items.length === 0) {
      setError('Tu carrito está vacío.');
      return;
    }
    
    setProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      // Crear la orden
      const orderData = {
        ...shippingData,
        total_amount: calculateFinalTotal(),
        delivery_method: deliveryMethod,
        coupon_code: appliedCoupon?.code
      };
      
      const orderResponse: AxiosResponse<OrderResponse> = await orderService.createOrder(orderData);
      const orderId = orderResponse.data.id || orderResponse.data.order?.id;
      
      if (!orderId) {
        throw new Error('No se pudo obtener el ID de la orden');
      }
      
      if (simulationMode) {
        // Usar integración con dinero ficticio
        await handleIntegrationPayment(orderId);
      } else {
        // Modo real con Transbank
        const paymentResponse: AxiosResponse<PaymentResponse> = await transbankService.createTransaction({
          order_id: orderId,
          amount: Math.round(calculateFinalTotal())
        });
        
        if (paymentResponse.data.url) {
          window.location.href = paymentResponse.data.url;
        } else {
          throw new Error('No se recibió URL de pago de Transbank');
        }
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      const axiosError = err as AxiosError<ErrorResponse>;
      
      if (axiosError.response?.status === 401) {
        setError('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
        setTimeout(() => navigate('/login'), 2000);
      } else if (axiosError.response?.data) {
        const errorData = axiosError.response.data;
        setError(
          errorData.detail || 
          errorData.message || 
          errorData.error || 
          'Error al procesar el pago. Por favor, inténtalo de nuevo.'
        );
      } else {
        setError('Error al procesar el pago. Por favor, inténtalo de nuevo.');
      }
    } finally {
      setProcessing(false);
    }
  };

  // Función para formatear precios
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Función para obtener URL de imagen
  const getImageUrl = (imageUrl?: string) => {
    if (!imageUrl) {
      return 'https://via.placeholder.com/80x80/667eea/ffffff?text=Producto';
    }
    
    // Si la URL ya es completa, devolverla tal como está
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    
    // Si es una ruta relativa, construir la URL completa
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    return `${baseUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
  };

  // Efectos
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    loadCart();
    loadExchangeRate();
    
    // Cargar datos en orden de prioridad
    if (!loadUserShippingData()) {
      loadSavedShippingData();
    }
  }, [user, navigate]);

  useEffect(() => {
    // Aplicar cupón si viene en la URL
    if (couponCode === 'FERR20') {
      setAppliedCoupon({
        code: couponCode,
        discount_percentage: 20
      });
    }
  }, [couponCode]);

  if (loading) {
    return (
      <PageContainer>
        <Navbar />
        <LoadingSpinner>
          <FaSpinner size={32} />
          Cargando checkout...
        </LoadingSpinner>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Navbar />
      <CheckoutContainer>
        <div>
          <Section>
            <SectionTitle>
              <FaUser />
              Información de Envío
            </SectionTitle>
            
            <DataSourceIndicator>
              {getDataSourceMessage()}
            </DataSourceIndicator>
            
            {/* Toggle para modo simulación */}
            <SimulationToggle onClick={() => setSimulationMode(!simulationMode)}>
              <ToggleText>
                <ToggleTitle>
                  {simulationMode ? '🎭 Modo Simulación Activado' : '💳 Pago Real con Transbank'}
                </ToggleTitle>
                <ToggleDescription>
                  {simulationMode 
                    ? 'Pago ficticio para pruebas - No se realizará cargo real'
                    : 'Pago real a través de Transbank - Se realizará cargo real'
                  }
                </ToggleDescription>
              </ToggleText>
              {simulationMode ? <FaToggleOn size={24} /> : <FaToggleOff size={24} />}
            </SimulationToggle>
            
            {simulationMode && (
              <InfoMessage>
                🎭 <strong>Modo Simulación:</strong> Este es un pago ficticio para pruebas. 
                La orden se guardará en la base de datos y el stock se actualizará, 
                pero no se realizará ningún cargo real.
              </InfoMessage>
            )}
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
            {success && <SuccessMessage>{success}</SuccessMessage>}
            
            <form onSubmit={handleSubmit}>
              <FormGrid>
                <FormGroup>
                  <Label htmlFor="shipping_first_name">Nombre</Label>
                  <Input
                    type="text"
                    id="shipping_first_name"
                    name="shipping_first_name"
                    value={shippingData.shipping_first_name || ''}
                    onChange={handleInputChange}
                    placeholder="Tu nombre"
                    disabled={processing}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="shipping_last_name">Apellido</Label>
                  <Input
                    type="text"
                    id="shipping_last_name"
                    name="shipping_last_name"
                    value={shippingData.shipping_last_name || ''}
                    onChange={handleInputChange}
                    placeholder="Tu apellido"
                    disabled={processing}
                  />
                </FormGroup>
                
                <FormGroup className="full-width">
                  <Label htmlFor="shipping_company">Empresa (Opcional)</Label>
                  <Input
                    type="text"
                    id="shipping_company"
                    name="shipping_company"
                    value={shippingData.shipping_company || ''}
                    onChange={handleInputChange}
                    placeholder="Nombre de la empresa"
                    disabled={processing}
                  />
                </FormGroup>
                
                <FormGroup className="full-width">
                  <Label htmlFor="shipping_address">Dirección *</Label>
                  <Input
                    type="text"
                    id="shipping_address"
                    name="shipping_address"
                    value={shippingData.shipping_address}
                    onChange={handleInputChange}
                    placeholder="Ingresa tu dirección completa"
                    required
                    disabled={processing}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="shipping_city">Ciudad *</Label>
                  <Input
                    type="text"
                    id="shipping_city"
                    name="shipping_city"
                    value={shippingData.shipping_city}
                    onChange={handleInputChange}
                    placeholder="Tu ciudad"
                    required
                    disabled={processing}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="shipping_state">Región/Estado *</Label>
                  <Input
                    type="text"
                    id="shipping_state"
                    name="shipping_state"
                    value={shippingData.shipping_state}
                    onChange={handleInputChange}
                    placeholder="Tu región o estado"
                    required
                    disabled={processing}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="shipping_zip">Código Postal *</Label>
                  <Input
                    type="text"
                    id="shipping_zip"
                    name="shipping_zip"
                    value={shippingData.shipping_zip}
                    onChange={handleInputChange}
                    placeholder="Código postal"
                    required
                    disabled={processing}
                  />
                </FormGroup>
                
                <FormGroup>
                  <Label htmlFor="shipping_phone">Teléfono *</Label>
                  <Input
                    type="tel"
                    id="shipping_phone"
                    name="shipping_phone"
                    value={shippingData.shipping_phone}
                    onChange={handleInputChange}
                    placeholder="Tu número de teléfono"
                    required
                    disabled={processing}
                  />
                </FormGroup>
              </FormGrid>
              
              <ButtonGroup>
                <ActionButton 
                  type="button" 
                  onClick={copyFromProfile}
                  variant="secondary"
                  disabled={processing}
                >
                  <FaCopy />
                  Copiar del Perfil
                </ActionButton>
                
                <ActionButton 
                  type="button" 
                  onClick={saveShippingData}
                  variant="primary"
                  disabled={processing}
                >
                  <FaEdit />
                  Guardar Datos
                </ActionButton>
                
                {dataSource !== 'empty' && (
                  <ActionButton 
                    type="button" 
                    onClick={clearSavedData}
                    variant="danger"
                    disabled={processing}
                  >
                    🗑️ Limpiar Datos
                  </ActionButton>
                )}
              </ButtonGroup>
              
              <PayButton type="submit" disabled={processing || !cart?.items?.length}>
                {processing ? (
                  <>
                    <FaSpinner className="spinning" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <FaCreditCard />
                    {simulationMode ? 'Simular Pago' : 'Proceder al Pago'}
                  </>
                )}
              </PayButton>
            </form>
          </Section>
        </div>
        
        <div>
          <Section>
            <SectionTitle>
              <FaShoppingCart />
              Resumen de Compra
            </SectionTitle>
            
            {cart && cart.items && cart.items.length > 0 ? (
              <>
                {cart.items.map((item) => {
                  const priceCLP = item.product.price_clp || (item.product.price * dollarRate);
                  return (
                    <CartItemContainer key={item.id}>
                      <ProductImage 
                        src={getImageUrl(item.product.primary_image)} 
                        alt={item.product.name}
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = 'https://via.placeholder.com/80x80/667eea/ffffff?text=Producto';
                        }}
                      />
                      <ProductInfo>
                        <ProductName>{item.product.name}</ProductName>
                        <PriceContainer>
                          <ProductPriceUSD>${item.product.price.toFixed(2)} USD</ProductPriceUSD>
                          <ProductPriceCLP>{formatPrice(priceCLP)}</ProductPriceCLP>
                        </PriceContainer>
                      </ProductInfo>
                      <Quantity>x{item.quantity}</Quantity>
                    </CartItemContainer>
                  );
                })}
                
                <TotalSection>
                  <TotalRow>
                    <span>Subtotal (USD):</span>
                    <span>${calculateTotal().toFixed(2)}</span>
                  </TotalRow>
                  <TotalRow>
                    <span>Subtotal (CLP):</span>
                    <span>{formatPrice(calculateTotalCLP())}</span>
                  </TotalRow>
                  {appliedCoupon && (
                    <TotalRow>
                      <span>Descuento ({appliedCoupon.code} - {appliedCoupon.discount_percentage}%):</span>
                      <span style={{ color: '#27ae60' }}>-{formatPrice(couponDiscount)}</span>
                    </TotalRow>
                  )}
                  <TotalRow>
                    <span>Método de entrega:</span>
                    <span>{deliveryMethod === 'retiro' ? 'Retiro en tienda' : 'Envío a domicilio'}</span>
                  </TotalRow>
                  <TotalRow>
                    <span>Costo de envío:</span>
                    <span>{deliveryMethod === 'retiro' ? 'Gratis' : 'Gratis'}</span>
                  </TotalRow>
                  <TotalRow className="final">
                    <span>Total:</span>
                    <span>{formatPrice(calculateFinalTotal())}</span>
                  </TotalRow>
                </TotalSection>
              </>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#7f8c8d' }}>
                <FaShoppingCart size={48} style={{ marginBottom: '1rem' }} />
                <p>Tu carrito está vacío</p>
                <ActionButton 
                  onClick={() => navigate('/products')}
                  variant="primary"
                >
                  Ir a Productos
                </ActionButton>
              </div>
            )}
          </Section>
        </div>
      </CheckoutContainer>
    </PageContainer>
  );
};

export default CheckoutPage;