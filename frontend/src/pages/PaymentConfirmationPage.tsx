import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaReceipt, FaShoppingCart, FaHome } from 'react-icons/fa';
import Navbar from '../components/Navbar';

// Animaciones
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

const bounceIn = keyframes`
  0% {
    opacity: 0;
    transform: scale(0.3);
  }
  50% {
    opacity: 1;
    transform: scale(1.05);
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    opacity: 1;
    transform: scale(1);
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

const shimmer = keyframes`
  0% {
    background-position: -468px 0;
  }
  100% {
    background-position: 468px 0;
  }
`;

const float = keyframes`
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const PageContainer = styled.div`
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: 
      radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
      radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
      radial-gradient(circle at 40% 40%, rgba(120, 119, 198, 0.2) 0%, transparent 50%);
    animation: ${float} 6s ease-in-out infinite;
  }
`;

const ContentContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 80px);
  padding: 2rem;
  position: relative;
  z-index: 1;
`;

const ResultCard = styled.div<{ success?: boolean }>`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem;
  max-width: 600px;
  width: 100%;
  text-align: center;
  box-shadow: 
    0 25px 50px -12px rgba(0, 0, 0, 0.25),
    0 0 0 1px rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
  animation: ${fadeInUp} 0.8s ease-out;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.2),
      transparent
    );
    animation: ${shimmer} 2s infinite;
  }
  
  @media (max-width: 768px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const IconContainer = styled.div<{ success?: boolean }>`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: ${props => props.success ? '#10b981' : '#ef4444'};
  animation: ${bounceIn} 1s ease-out 0.3s both;
  
  svg {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    animation: ${props => props.success ? pulse : 'none'} 2s infinite;
  }
`;

const Title = styled.h1<{ success?: boolean }>`
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: ${props => props.success 
    ? 'linear-gradient(135deg, #10b981, #059669)'
    : 'linear-gradient(135deg, #ef4444, #dc2626)'};
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeInUp} 0.8s ease-out 0.5s both;
  
  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Message = styled.p`
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
  animation: ${fadeInUp} 0.8s ease-out 0.7s both;
`;

const DetailsList = styled.div`
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 16px;
  padding: 2rem;
  margin: 2rem 0;
  border: 1px solid rgba(148, 163, 184, 0.2);
  animation: ${fadeInUp} 0.8s ease-out 0.9s both;
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #10b981, #059669, #10b981);
    background-size: 200% 100%;
    animation: ${shimmer} 3s infinite;
  }
`;

const DetailItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid rgba(148, 163, 184, 0.1);
  transition: all 0.3s ease;
  
  &:last-child {
    border-bottom: none;
  }
  
  &:hover {
    background: rgba(16, 185, 129, 0.05);
    transform: translateX(5px);
    border-radius: 8px;
    padding-left: 1rem;
    padding-right: 1rem;
  }
`;

const DetailLabel = styled.span`
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
`;

const DetailValue = styled.span`
  color: #10b981;
  font-weight: 700;
  font-size: 1rem;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
  animation: ${fadeInUp} 0.8s ease-out 1.1s both;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button<{ variant?: 'primary' | 'secondary' }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  min-width: 180px;
  justify-content: center;
  
  ${props => props.variant === 'primary' ? `
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6);
      background: linear-gradient(135deg, #059669, #047857);
    }
  ` : `
    background: linear-gradient(135deg, #f8fafc, #e2e8f0);
    color: #374151;
    border: 2px solid #d1d5db;
    
    &:hover {
      transform: translateY(-2px);
      background: linear-gradient(135deg, #e2e8f0, #cbd5e1);
      border-color: #9ca3af;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
  `}
  
  &:active {
    transform: translateY(0);
  }
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    background: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
    transform: translate(-50%, -50%);
    transition: width 0.6s, height 0.6s;
  }
  
  &:hover::before {
    width: 300px;
    height: 300px;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
  
  svg {
    font-size: 2rem;
    color: #667eea;
    animation: ${spin} 1s linear infinite;
  }
`;

const ErrorDetails = styled.div`
  background: linear-gradient(135deg, #fef2f2, #fee2e2);
  border: 1px solid #fecaca;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  color: #dc2626;
  font-size: 0.95rem;
  text-align: left;
  animation: ${fadeInUp} 0.8s ease-out 0.9s both;
  position: relative;
  
  &::before {
    content: '⚠️';
    position: absolute;
    top: -10px;
    left: 20px;
    background: #fef2f2;
    padding: 0 10px;
    font-size: 1.2rem;
  }
`;

// Interfaces
interface PaymentResult {
  status: string;
  message: string;
  order_id: number;
  amount: number;
  authorization_code?: string;
  payment_type_code?: string;
  buy_order?: string;
  transaction_date?: string;
  detail?: string;
}

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

  // CORRECCIÓN: Navegar al perfil con la pestaña de órdenes
  const handleGoToOrders = () => {
    navigate('/profile', { state: { activeTab: 'orders' } });
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
            <LoadingSpinner>
              <FaSpinner />
            </LoadingSpinner>
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