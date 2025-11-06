import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { transbankService } from '../services/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const PaymentIntegrationConfirmationPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handlePaymentResult = async () => {
      try {
        const token = searchParams.get('token_ws');
        
        if (!token) {
          setError('Token de pago no encontrado');
          setLoading(false);
          return;
        }

        console.log('Confirmando pago de integración con token:', token);
        
        const response = await transbankService.confirmIntegrationTransaction(token);
        
        if (response.data.status === 'success') {
          setResult({
            success: true,
            orderId: response.data.order_id,
            amount: response.data.amount,
            authorizationCode: response.data.authorization_code,
            transactionDate: response.data.transaction_date
          });
        } else {
          setError('El pago fue rechazado');
        }
      } catch (error: any) {
        console.error('Error al confirmar pago de integración:', error);
        setError('Error al procesar el pago');
      } finally {
        setLoading(false);
      }
    };

    handlePaymentResult();
  }, [searchParams]);

  const handleContinue = () => {
    navigate('/orders');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold mb-2">Procesando pago...</h2>
              <p className="text-gray-600">Por favor espera mientras confirmamos tu pago.</p>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
          {result?.success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-green-600 mb-2">¡Pago Exitoso!</h2>
              <p className="text-gray-600 mb-4">Tu compra ha sido procesada correctamente.</p>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-semibold mb-2">Detalles de la transacción:</h3>
                <p><strong>Orden:</strong> #{result.orderId}</p>
                <p><strong>Monto:</strong> ${result.amount?.toLocaleString('es-CL')}</p>
                <p><strong>Código de autorización:</strong> {result.authorizationCode}</p>
                <p><strong>Fecha:</strong> {new Date(result.transactionDate).toLocaleString('es-CL')}</p>
              </div>
              
              <button
                onClick={handleContinue}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Ver mis pedidos
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-red-600 mb-2">Pago Rechazado</h2>
              <p className="text-gray-600 mb-4">{error || 'Hubo un problema con tu pago.'}</p>
              
              <button
                onClick={() => navigate('/cart')}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Volver al carrito
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default PaymentIntegrationConfirmationPage;