import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaReceipt, FaHome, FaShoppingCart } from 'react-icons/fa';
import Navbar from '../components/Navbar';

// Interfaces
interface PaymentResult {
  status: string;
  order_id: number;
  amount: number;
  transaction_date?: string;
  authorization_code?: string;
  payment_type_code?: string;
  buy_order?: string;
  detail?: string;
  message?: string;
}

// Styled Components
const PageContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const ContentContainer = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
`;

const ResultCard = styled.div<{ success?: boolean }>`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  text-align: center;
  max-width: 600px;
  width: 100%;
  
  ${props => props.success && `
    border-left: 5px solid #10b981;
  `}
  
  ${props => props.success === false && `
    border-left: 5px solid #ef4444;
  `}
  
  @media (max-width: 768px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const IconContainer = styled.div<{ success?: boolean }>`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  
  ${props => props.success && `
    color: #10b981;
  `}
  
  ${props => props.success === false && `
    color: #ef4444;
  `}
  
  ${props => props.success === undefined && `
    color: #3b82f6;
    animation: spin 1s linear infinite;
  `}
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Title = styled.h1<{ success?: boolean }>`
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  
  ${props => props.success && `
    color: #10b981;
  `}
  
  ${props => props.success === false && `
    color: #ef4444;
  `}
  
  ${props => props.success === undefined && `
    color: #1f2937;
  `}
  
  @media (max-width: 768px) {
    font-size: 1.5rem;
  }
`;

const Message = styled.p`
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
`;

const DetailsList = styled.div`
  background: #f9fafb;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  text-align: left;
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #e5e7eb;
  
  &:last-child {
    border-bottom: none;
  }
`;

const DetailLabel = styled.span`
  font-weight: 600;
  color: #374151;
`;

const DetailValue = styled.span`
  color: #6b7280;
  font-family: 'Courier New', monospace;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  margin-top: 2rem;
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 12px;
  font-weight: 600;
  font-size: 1rem;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
    }
  ` : `
    background: #f3f4f6;
    color: #374151;
    
    &:hover {
      background: #e5e7eb;
      transform: translateY(-1px);
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: center;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 2rem;
  height: 2rem;
  border: 3px solid #f3f4f6;
  border-radius: 50%;
  border-top-color: #3b82f6;
  animation: spin 1s ease-in-out infinite;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const ErrorDetails = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 1rem;
  margin: 1rem 0;
  color: #dc2626;
  font-size: 0.9rem;
  text-align: left;
`;

const PaymentConfirmationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<boolean | undefined>(undefined);
  const navigate = useNavigate();

  // Función para obtener el token CSRF
  const getCsrfToken = (): string => {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const [name, value] = cookie.trim().split('=');
      if (name === 'csrftoken') {
        return value;
      }
    }
    return '';
  };

  // Función para formatear el precio
  const formatPrice = (price: number): string => {
    return new Intl.NumberFormat('es-CL', {
      style: 'currency',
      currency: 'CLP',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Función para formatear la fecha
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('es-CL', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  useEffect(() => {
    const confirmPayment = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token_ws');
        
        // Log para debugging
        console.log('URL completa:', window.location.href);
        console.log('Parámetros URL:', Object.fromEntries(urlParams));
        console.log('Token extraído:', token);
        
        if (!token) {
          console.error('No se encontró token en la URL');
          setError('Token de pago no encontrado en la URL. Verifica que hayas sido redirigido correctamente desde Transbank.');
          setSuccess(false);
          setLoading(false);
          return;
        }
        
        // Confirmar el pago con el backend
        console.log('Enviando confirmación al backend...');
        
        const response = await fetch('http://localhost:8000/api/payments/transbank/confirm/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': getCsrfToken(),
          },
          credentials: 'include',
          body: JSON.stringify({ token_ws: token })
        });
        
        console.log('Respuesta del servidor:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('Datos de respuesta:', data);
        
        if (response.ok) {
          if (data.status === 'success') {
            setPaymentResult(data);
            setSuccess(true);
            console.log('Pago confirmado exitosamente');
          } else {
            setPaymentResult(data);
            setSuccess(false);
            setError(data.message || data.detail || 'El pago fue rechazado por Transbank');
            console.log('Pago rechazado:', data);
          }
        } else {
          console.error('Error en la respuesta del servidor:', data);
          setError(data.error || data.detail || 'Error al confirmar el pago con el servidor');
          setSuccess(false);
          
          // Mostrar detalles adicionales del error
          if (data.debug_info) {
            console.error('Información de debug:', data.debug_info);
          }
        }
      } catch (error) {
        console.error('Error al confirmar pago:', error);
        setError('Error de conexión al confirmar el pago. Verifica tu conexión a internet.');
        setSuccess(false);
      } finally {
        setLoading(false);
      }
    };
    
    confirmPayment();
  }, []);

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoToOrders = () => {
    navigate('/orders');
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  const renderIcon = () => {
    if (loading) {
      return <FaSpinner />;
    }
    return success ? <FaCheckCircle /> : <FaTimesCircle />;
  };

  const renderTitle = () => {
    if (loading) {
      return 'Procesando Pago...';
    }
    return success ? '¡Pago Exitoso!' : 'Pago Rechazado';
  };

  const renderMessage = () => {
    if (loading) {
      return 'Estamos confirmando tu pago con Transbank. Por favor espera...';
    }
    
    if (success) {
      return 'Tu pago ha sido procesado exitosamente. Recibirás un email de confirmación con los detalles de tu pedido.';
    }
    
    return error || 'Tu pago no pudo ser procesado. Por favor, inténtalo nuevamente.';
  };

  return (
    <PageContainer>
      <Navbar />
      <ContentContainer>
        <ResultCard success={success}>
          <IconContainer success={success}>
            {renderIcon()}
          </IconContainer>
          
          <Title success={success}>
            {renderTitle()}
          </Title>
          
          <Message>
            {renderMessage()}
          </Message>
          
          {loading && (
            <LoadingSpinner />
          )}
          
          {!loading && error && (
            <ErrorDetails>
              <strong>Detalles del error:</strong><br />
              {error}
              {paymentResult?.detail && (
                <><br /><strong>Información adicional:</strong> {paymentResult.detail}</>
              )}
            </ErrorDetails>
          )}
          
          {!loading && success && paymentResult && (
            <DetailsList>
              <DetailItem>
                <DetailLabel>Número de Orden:</DetailLabel>
                <DetailValue>#{paymentResult.order_id}</DetailValue>
              </DetailItem>
              
              <DetailItem>
                <DetailLabel>Monto Pagado:</DetailLabel>
                <DetailValue>{formatPrice(paymentResult.amount)}</DetailValue>
              </DetailItem>
              
              {paymentResult.authorization_code && (
                <DetailItem>
                  <DetailLabel>Código de Autorización:</DetailLabel>
                  <DetailValue>{paymentResult.authorization_code}</DetailValue>
                </DetailItem>
              )}
              
              {paymentResult.payment_type_code && (
                <DetailItem>
                  <DetailLabel>Tipo de Pago:</DetailLabel>
                  <DetailValue>{paymentResult.payment_type_code}</DetailValue>
                </DetailItem>
              )}
              
              {paymentResult.buy_order && (
                <DetailItem>
                  <DetailLabel>Orden de Compra:</DetailLabel>
                  <DetailValue>{paymentResult.buy_order}</DetailValue>
                </DetailItem>
              )}
              
              {paymentResult.transaction_date && (
                <DetailItem>
                  <DetailLabel>Fecha de Transacción:</DetailLabel>
                  <DetailValue>{formatDate(paymentResult.transaction_date)}</DetailValue>
                </DetailItem>
              )}
            </DetailsList>
          )}
          
          {!loading && (
            <ButtonContainer>
              {success ? (
                <>
                  <Button variant="primary" onClick={handleGoToOrders}>
                    <FaReceipt />
                    Ver Mis Pedidos
                  </Button>
                  <Button variant="secondary" onClick={handleContinueShopping}>
                    <FaShoppingCart />
                    Seguir Comprando
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="primary" onClick={handleContinueShopping}>
                    <FaShoppingCart />
                    Intentar Nuevamente
                  </Button>
                  <Button variant="secondary" onClick={handleGoHome}>
                    <FaHome />
                    Ir al Inicio
                  </Button>
                </>
              )}
            </ButtonContainer>
          )}
        </ResultCard>
      </ContentContainer>
    </PageContainer>
  );
};

export default PaymentConfirmationPage;