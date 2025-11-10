import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaShoppingCart, FaSpinner, FaCreditCard } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { cartService, orderService, transbankService, exchangeRateService } from '../services/api';
import { AxiosResponse, AxiosError } from 'axios';

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
  product: Product;
}

interface Cart {
  id: number;
  items: CartItem[];
  total: number;
}

interface ShippingData {
  shipping_address: string;
  shipping_city: string;
  shipping_state: string;
  shipping_zip: string;
  shipping_phone: string;
  shipping_first_name: string;
  shipping_last_name: string;
}

interface OrderResponse {
  id: number;
  order?: { id: number };
}

interface PaymentResponse {
  url: string;
}

interface ErrorResponse {
  detail?: string;
  message?: string;
  error?: string;
}

const CheckoutPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [cart, setCart] = useState<Cart | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [dollarRate, setDollarRate] = useState(850);
  const [deliveryMethod, setDeliveryMethod] = useState<'domicilio' | 'retiro'>('domicilio');
  const [simulationMode, setSimulationMode] = useState(false);
  
  const [shippingData, setShippingData] = useState<ShippingData>({
    shipping_address: '',
    shipping_city: '',
    shipping_state: '',
    shipping_zip: '',
    shipping_phone: '',
    shipping_first_name: '',
    shipping_last_name: ''
  });

  // Cargar datos iniciales
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Cargar carrito
        const cartResponse = await cartService.getCart();
        setCart(cartResponse.data);
        
        // Cargar tipo de cambio
        try {
          const rateResponse = await exchangeRateService.getExchangeRate();
          setDollarRate(rateResponse.data.rate || rateResponse.data);
        } catch (rateError) {
          console.log('Using default exchange rate');
        }
        
        // Cargar datos del usuario si existen
        if (user.shipping_address) {
          setShippingData({
            shipping_address: user.shipping_address || '',
            shipping_city: user.shipping_city || '',
            shipping_state: user.shipping_state || '',
            shipping_zip: user.shipping_postal_code || '',
            shipping_phone: user.shipping_phone || '',
            shipping_first_name: user.first_name || '',
            shipping_last_name: user.last_name || ''
          });
        }
        
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Error al cargar los datos');
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setShippingData(prev => ({ ...prev, [name]: value }));
  };

  const calculateTotalCLP = () => {
    if (!cart?.items) return 0;
    return cart.items.reduce((total, item) => {
      const priceCLP = item.product.price_clp || (item.product.price * dollarRate);
      return total + (priceCLP * item.quantity);
    }, 0);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cart?.items?.length) {
      setError('Tu carrito está vacío');
      return;
    }
    
    setProcessing(true);
    setError('');
    setSuccess('');
    
    try {
      // Crear orden
      const orderData = {
        ...shippingData,
        total_amount: calculateTotalCLP(),
        delivery_method: deliveryMethod
      };
      
      const orderResponse: AxiosResponse<OrderResponse> = await orderService.createOrder(orderData);
      const orderId = orderResponse.data.id || orderResponse.data.order?.id;
      
      if (!orderId) {
        throw new Error('No se pudo crear la orden');
      }
      
      // Procesar pago
      if (simulationMode) {
        const integrationResponse = await transbankService.createIntegrationTransaction({
          order_id: orderId,
          amount: Math.round(calculateTotalCLP())
        });
        
        if (integrationResponse.data.success && integrationResponse.data.url) {
          window.location.href = integrationResponse.data.url;
        } else {
          throw new Error('Error en pago de simulación');
        }
      } else {
        const paymentResponse: AxiosResponse<PaymentResponse> = await transbankService.createTransaction({
          order_id: orderId,
          amount: Math.round(calculateTotalCLP())
        });
        
        if (paymentResponse.data.url) {
          window.location.href = paymentResponse.data.url;
        } else {
          throw new Error('No se recibió URL de pago');
        }
      }
    } catch (err) {
      console.error('Error processing payment:', err);
      const axiosError = err as AxiosError<ErrorResponse>;
      
      if (axiosError.response?.status === 401) {
        setError('Sesión expirada. Redirigiendo...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        const errorData = axiosError.response?.data;
        setError(
          errorData?.detail || 
          errorData?.message || 
          errorData?.error || 
          'Error al procesar el pago'
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
        <Navbar />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '400px',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <FaSpinner size={24} style={{ animation: 'spin 1s linear infinite' }} />
          <span>Cargando...</span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <Navbar />
      
      <div style={{
        maxWidth: '1000px',
        margin: '20px auto',
        padding: '0 20px',
        display: 'grid',
        gridTemplateColumns: '1fr 350px',
        gap: '20px'
      }}>
        
        {/* Formulario de envío */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <FaUser /> Información de Envío
          </h2>
          
          {/* Método de entrega */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500' }}>Método de Entrega:</label>
            <select 
              value={deliveryMethod} 
              onChange={(e) => setDeliveryMethod(e.target.value as 'domicilio' | 'retiro')}
              style={{
                width: '100%',
                padding: '8px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '14px'
              }}
            >
              <option value="domicilio">🚚 Envío a Domicilio</option>
              <option value="retiro">🏪 Retiro en Tienda</option>
            </select>
          </div>
          
          {/* Toggle simulación */}
          <div style={{
            background: '#f8f9fa',
            padding: '12px',
            borderRadius: '4px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            cursor: 'pointer'
          }} onClick={() => setSimulationMode(!simulationMode)}>
            <div>
              <div style={{ fontWeight: '500', fontSize: '14px' }}>
                {simulationMode ? '🎭 Modo Simulación' : '💳 Pago Real'}
              </div>
              <div style={{ fontSize: '12px', color: '#666' }}>
                {simulationMode ? 'Pago ficticio para pruebas' : 'Pago real con Transbank'}
              </div>
            </div>
            <span style={{ fontSize: '18px' }}>{simulationMode ? '✅' : '❌'}</span>
          </div>
          
          {/* Mensajes */}
          {error && (
            <div style={{
              background: '#f8d7da',
              color: '#721c24',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
          
          {success && (
            <div style={{
              background: '#d4edda',
              color: '#155724',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              {success}
            </div>
          )}
          
          {simulationMode && (
            <div style={{
              background: '#d1ecf1',
              color: '#0c5460',
              padding: '10px',
              borderRadius: '4px',
              marginBottom: '15px',
              fontSize: '14px'
            }}>
              🎭 Modo Simulación: Pago ficticio para pruebas
            </div>
          )}
          
          {/* Formulario */}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Nombre *</label>
                <input
                  type="text"
                  name="shipping_first_name"
                  value={shippingData.shipping_first_name}
                  onChange={handleInputChange}
                  required
                  disabled={processing}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Apellido *</label>
                <input
                  type="text"
                  name="shipping_last_name"
                  value={shippingData.shipping_last_name}
                  onChange={handleInputChange}
                  required
                  disabled={processing}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Dirección *</label>
              <input
                type="text"
                name="shipping_address"
                value={shippingData.shipping_address}
                onChange={handleInputChange}
                required
                disabled={processing}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '14px'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Ciudad *</label>
                <input
                  type="text"
                  name="shipping_city"
                  value={shippingData.shipping_city}
                  onChange={handleInputChange}
                  required
                  disabled={processing}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Región *</label>
                <input
                  type="text"
                  name="shipping_state"
                  value={shippingData.shipping_state}
                  onChange={handleInputChange}
                  required
                  disabled={processing}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Código Postal *</label>
                <input
                  type="text"
                  name="shipping_zip"
                  value={shippingData.shipping_zip}
                  onChange={handleInputChange}
                  required
                  disabled={processing}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '5px', fontSize: '14px', fontWeight: '500' }}>Teléfono *</label>
                <input
                  type="tel"
                  name="shipping_phone"
                  value={shippingData.shipping_phone}
                  onChange={handleInputChange}
                  required
                  disabled={processing}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
            
            <button
              type="submit"
              disabled={processing || !cart?.items?.length}
              style={{
                width: '100%',
                padding: '12px',
                background: processing ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: processing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px'
              }}
            >
              {processing ? (
                <>
                  <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />
                  Procesando...
                </>
              ) : (
                <>
                  <FaCreditCard />
                  {simulationMode ? 'Simular Pago' : 'Proceder al Pago'}
                </>
              )}
            </button>
          </form>
        </div>
        
        {/* Resumen del carrito */}
        <div style={{
          background: 'white',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          height: 'fit-content'
        }}>
          <h2 style={{ 
            margin: '0 0 20px 0', 
            fontSize: '18px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px' 
          }}>
            <FaShoppingCart /> Resumen de Compra
          </h2>
          
          {cart?.items?.length ? (
            <>
              {cart.items.map((item) => {
                const priceCLP = item.product.price_clp || (item.product.price * dollarRate);
                return (
                  <div key={item.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 0',
                    borderBottom: '1px solid #eee'
                  }}>
                    <img
                      src={item.product.primary_image || 'https://via.placeholder.com/50x50'}
                      alt={item.product.name}
                      style={{
                        width: '50px',
                        height: '50px',
                        objectFit: 'cover',
                        borderRadius: '4px'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://via.placeholder.com/50x50';
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        {item.product.name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        ${item.product.price.toFixed(2)} USD - {formatPrice(priceCLP)}
                      </div>
                    </div>
                    <div style={{
                      background: '#007bff',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      x{item.quantity}
                    </div>
                  </div>
                );
              })}
              
              <div style={{ paddingTop: '15px', marginTop: '15px', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Método de entrega:</span>
                  <span>{deliveryMethod === 'retiro' ? 'Retiro en tienda' : 'Envío a domicilio'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' }}>
                  <span>Costo de envío:</span>
                  <span>Gratis</span>
                </div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontWeight: '600',
                  fontSize: '16px',
                  borderTop: '1px solid #eee',
                  paddingTop: '8px',
                  marginTop: '8px'
                }}>
                  <span>Total:</span>
                  <span>{formatPrice(calculateTotalCLP())}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#666' }}>
              <FaShoppingCart size={32} style={{ marginBottom: '10px' }} />
              <p>Tu carrito está vacío</p>
              <button
                onClick={() => navigate('/products')}
                style={{
                  background: '#007bff',
                  color: 'white',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Ir a Productos
              </button>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        @media (max-width: 768px) {
          div[style*="gridTemplateColumns: '1fr 350px'"] {
            grid-template-columns: 1fr !important;
          }
          
          div[style*="gridTemplateColumns: '1fr 1fr'"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
};

export default CheckoutPage;

