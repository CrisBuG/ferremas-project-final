import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { FaCheckCircle, FaTimesCircle, FaSpinner, FaArrowLeft, FaCreditCard } from 'react-icons/fa';
import { apiClient } from '../services/api';

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
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02);
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
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  
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

const SimulationCard = styled.div`
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 3rem;
  max-width: 500px;
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
    animation: ${shimmer} 3s infinite;
  }
  
  @media (max-width: 768px) {
    padding: 2rem;
    margin: 1rem;
  }
`;

const IconContainer = styled.div`
  font-size: 4rem;
  margin-bottom: 1.5rem;
  color: #667eea;
  animation: ${bounceIn} 1s ease-out 0.3s both;
  
  svg {
    filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
    animation: ${pulse} 2s infinite;
    width: 2.5rem;
    height: 2.5rem;
  }
`;

const Title = styled.h1`
  font-size: 2.2rem;
  font-weight: 700;
  margin-bottom: 1rem;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: ${fadeInUp} 0.8s ease-out 0.5s both;
  
  @media (max-width: 768px) {
    font-size: 1.8rem;
  }
`;

const Description = styled.p`
  font-size: 1.1rem;
  color: #6b7280;
  margin-bottom: 2rem;
  line-height: 1.6;
  animation: ${fadeInUp} 0.8s ease-out 0.7s both;
`;

const InfoContainer = styled.div`
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 16px;
  padding: 1.5rem;
  margin: 1.5rem 0;
  border: 1px solid rgba(148, 163, 184, 0.2);
  animation: ${fadeInUp} 0.8s ease-out 0.9s both;
`;

const InfoItem = styled.p`
  font-size: 0.9rem;
  color: #374151;
  margin: 0.5rem 0;
  
  strong {
    color: #667eea;
    font-weight: 600;
  }
`;

const ButtonContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  animation: ${fadeInUp} 0.8s ease-out 1.1s both;
`;

const Button = styled.button<{ variant: 'approve' | 'reject' | 'cancel' }>`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem 2rem;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  width: 100%;
  
  ${props => {
    switch (props.variant) {
      case 'approve':
        return `
          background: linear-gradient(135deg, #10b981, #059669);
          color: white;
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
          
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(16, 185, 129, 0.6);
            background: linear-gradient(135deg, #059669, #047857);
          }
        `;
      case 'reject':
        return `
          background: linear-gradient(135deg, #ef4444, #dc2626);
          color: white;
          box-shadow: 0 4px 15px rgba(239, 68, 68, 0.4);
          
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(239, 68, 68, 0.6);
            background: linear-gradient(135deg, #dc2626, #b91c1c);
          }
        `;
      case 'cancel':
        return `
          background: linear-gradient(135deg, #6b7280, #4b5563);
          color: white;
          box-shadow: 0 4px 15px rgba(107, 114, 128, 0.4);
          
          &:hover:not(:disabled) {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(107, 114, 128, 0.6);
            background: linear-gradient(135deg, #4b5563, #374151);
          }
        `;
    }
  }}
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none !important;
  }
  
  &:active:not(:disabled) {
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
  
  &:hover:not(:disabled)::before {
    width: 300px;
    height: 300px;
  }
`;

const LoadingSpinner = styled.div`
  svg {
    animation: ${spin} 1s linear infinite;
  }
`;

const PaymentSimulationPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const token = searchParams.get('token');
    const orderId = searchParams.get('order_id');
    
    const handlePaymentResult = async (result: 'approved' | 'rejected') => {
        setLoading(true);
        try {
          if (!token) {
            alert('Token de transacción no encontrado');
            navigate('/profile', { state: { activeTab: 'orders' } });
            return;
          }
          
          console.log('Confirmando transacción simulada con token:', token);
          
          // Usar la URL correcta del backend
          const response = await apiClient.post('/simulate-confirmation/', {
            token: token,
            result: result
          });
          
          console.log('Respuesta de confirmación:', response.data);
          
          if (response.data.status === 'success') {
            alert(`Pago simulado ${result === 'approved' ? 'aprobado' : 'rechazado'} exitosamente`);
            navigate('/profile', { state: { activeTab: 'orders' } });
          } else {
            alert('Error en la confirmación: ' + (response.data.message || 'Error desconocido'));
          }
        } catch (error: any) {
          console.error('Error al confirmar pago simulado:', error);
          
          if (error.response?.status === 401) {
            alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            navigate('/login');
          } else if (error.response?.status === 404) {
            alert('Transacción no encontrada.');
            navigate('/profile', { state: { activeTab: 'orders' } });
          } else {
            alert('Error al procesar el pago: ' + (error.response?.data?.detail || error.message));
          }
        } finally {
          setLoading(false);
        }
      };

    const handleCancel = () => {
        navigate('/profile', { state: { activeTab: 'orders' } });
    };
  
    return (
        <PageContainer>
            <SimulationCard>
                <IconContainer>
                    <FaCreditCard />
                </IconContainer>
                
                <Title>Simulación de Pago Transbank</Title>
                
                <Description>
                    Selecciona el resultado del pago para continuar con la simulación
                </Description>
                
                {(token || orderId) && (
                    <InfoContainer>
                        {token && (
                            <InfoItem>
                                <strong>Token:</strong> {token.substring(0, 20)}...
                            </InfoItem>
                        )}
                        {orderId && (
                            <InfoItem>
                                <strong>Orden ID:</strong> {orderId}
                            </InfoItem>
                        )}
                    </InfoContainer>
                )}
                
                <ButtonContainer>
                    <Button
                        variant="approve"
                        onClick={() => handlePaymentResult('approved')}
                        disabled={loading}
                    >
                        {loading ? (
                            <LoadingSpinner>
                                <FaSpinner />
                            </LoadingSpinner>
                        ) : (
                            <FaCheckCircle />
                        )}
                        {loading ? 'Procesando...' : 'Aprobar Pago'}
                    </Button>
                    
                    <Button
                        variant="reject"
                        onClick={() => handlePaymentResult('rejected')}
                        disabled={loading}
                    >
                        {loading ? (
                            <LoadingSpinner>
                                <FaSpinner />
                            </LoadingSpinner>
                        ) : (
                            <FaTimesCircle />
                        )}
                        {loading ? 'Procesando...' : 'Rechazar Pago'}
                    </Button>
                    
                    <Button
                        variant="cancel"
                        onClick={handleCancel}
                        disabled={loading}
                    >
                        <FaArrowLeft />
                        Cancelar
                    </Button>
                </ButtonContainer>
            </SimulationCard>
        </PageContainer>
    );
};

export default PaymentSimulationPage;