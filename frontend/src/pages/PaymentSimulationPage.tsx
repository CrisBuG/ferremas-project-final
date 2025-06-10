import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { apiClient } from '../services/api';

const PaymentSimulationPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    const token = searchParams.get('token');
    const orderId = searchParams.get('order_id');
    
    const handlePaymentResult = async (result: 'approved' | 'rejected') => {
        setLoading(true);
        try {
            // Verificar autenticación
            const authToken = localStorage.getItem('access_token');
            
            if (!authToken) {
                alert('No estás autenticado. Por favor, inicia sesión.');
                navigate('/login');
                return;
            }
            
            // Verificar que tenemos token u order_id
            if (!token && !orderId) {
                alert('No se encontró información de la orden.');
                navigate('/orders');
                return;
            }
            
            // Preparar los datos según lo que tengamos disponible
            const requestData: any = {
                result: result
            };
            
            if (token) {
                requestData.token = token;
            } else if (orderId) {
                requestData.order_id = orderId;
            }
            
            console.log('Enviando datos:', requestData);
            
            // Hacer la llamada con manejo específico de errores
            const response = await apiClient.post('/api/simulate-confirmation/', requestData);
            
            console.log('Respuesta del servidor:', response.data);
            
            if (response.data.success) {
                alert(`Pago ${result === 'approved' ? 'aprobado' : 'rechazado'} exitosamente`);
                // Redirigir a órdenes
                navigate('/orders');
            } else {
                alert('Error en la simulación de pago: ' + (response.data.message || 'Error desconocido'));
            }
        } catch (error: any) {
            console.error('Error al procesar pago simulado:', error);
            
            // Manejo específico de errores sin redirección automática
            if (error.response?.status === 401) {
                alert('Sesión expirada. Por favor, inicia sesión nuevamente.');
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                navigate('/login');
            } else if (error.response?.status === 404) {
                alert('Orden no encontrada o token inválido.');
                navigate('/orders');
            } else if (error.response?.status === 400) {
                const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Error en la solicitud';
                alert('Error: ' + errorMessage);
            } else {
                alert('Error al procesar el pago: ' + (error.response?.data?.detail || error.message));
            }
        } finally {
            setLoading(false);
        }
    };

    // ... existing code ...
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
                <div className="text-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-800 mb-2">Simulación de Pago</h1>
                    <p className="text-gray-600">Selecciona el resultado del pago para continuar</p>
                    {token && (
                        <p className="text-sm text-gray-500 mt-2">Token: {token.substring(0, 20)}...</p>
                    )}
                    {orderId && (
                        <p className="text-sm text-gray-500 mt-2">Orden ID: {orderId}</p>
                    )}
                </div>
                
                <div className="space-y-4">
                    <button
                        onClick={() => handlePaymentResult('approved')}
                        disabled={loading}
                        className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                        {loading ? 'Procesando...' : '✓ Aprobar Pago'}
                    </button>
                    
                    <button
                        onClick={() => handlePaymentResult('rejected')}
                        disabled={loading}
                        className="w-full bg-red-500 hover:bg-red-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                        {loading ? 'Procesando...' : '✗ Rechazar Pago'}
                    </button>
                    
                    <button
                        onClick={() => navigate('/orders')}
                        disabled={loading}
                        className="w-full bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PaymentSimulationPage;