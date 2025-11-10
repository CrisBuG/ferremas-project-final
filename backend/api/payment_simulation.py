from datetime import datetime
from transbank.webpay.webpay_plus.transaction import Transaction
from transbank.common.options import WebpayOptions
from transbank.common.integration_type import IntegrationType
from transbank.error.transbank_error import TransbankError
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from orders.models import Order
from django.utils import timezone
import logging
import json
# Configurar logger
logger = logging.getLogger(__name__)

# Configuración específica para simulación (siempre en modo TEST)
# Usar credenciales de integración de Transbank para pruebas
# Configuración específica para integración con dinero ficticio
# Estas son las credenciales oficiales de Transbank para testing
INTEGRATION_COMMERCE_CODE = "597055555532"  # Código oficial de integración
INTEGRATION_API_KEY = "579B532A7440BB0C9079DED94D31EA1615BACEB56610332264630D42D0A36B1C"  # API Key oficial

# Usar modo TEST pero con flujo completo
integration_tx_options = WebpayOptions(
    INTEGRATION_COMMERCE_CODE, 
    INTEGRATION_API_KEY, 
    IntegrationType.TEST
)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def init_integration_transaction(request):
    """
    Inicia una transacción de integración con Transbank (dinero ficticio)
    """
    order_id = None
    try:
        order_id = request.data.get('order_id')
        logger.info(f"Iniciando transacción de INTEGRACIÓN para orden {order_id}")
        
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        if order.status != 'pendiente':
            return JsonResponse({
                'error': 'La orden no está en estado pendiente'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # URL de retorno para integración
        return_url = "http://localhost:3000/payment-integration-confirmation"
        
        # Crear transacción con credenciales de integración
        transaction = Transaction(integration_tx_options)
        
        buy_order = f"INT_{order.id}_{int(datetime.now().timestamp())}"
        session_id = f"int_{request.user.id}_{int(datetime.now().timestamp())}"
        amount = int(order.total)
        
        if amount <= 0:
            return JsonResponse({
                'error': 'El monto debe ser mayor a 0'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Parámetros integración - Buy Order: {buy_order}, Amount: {amount}")
        
        # Crear transacción real con dinero ficticio
        response = transaction.create(
            buy_order=buy_order,
            session_id=session_id,
            amount=amount,
            return_url=return_url
        )
        
        # Procesar respuesta
        token = getattr(response, 'token', None) or response.get('token')
        url = getattr(response, 'url', None) or response.get('url')
        
        if not token or not url:
            return JsonResponse({
                'error': 'Error al crear transacción de integración',
                'debug_info': str(response)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Construir URL completa
        complete_url = f"{url}?token_ws={token}" if '?' not in url else f"{url}&token_ws={token}"
        
        # Guardar token con prefijo de integración
        order.payment_id = f"INT_{token}"
        order.save()
        
        logger.info(f"Transacción de integración creada - Token: {token}")
        
        return JsonResponse({
            'success': True,
            'token': token,
            'url': complete_url,
            'order_id': order.id,
            'integration_mode': True,
            'message': 'Transacción de integración iniciada con dinero ficticio'
        })
    
    except TransbankError as e:
        logger.error(f"Error Transbank integración orden {order_id}: {str(e)}")
        return JsonResponse({
            'error': 'Error de Transbank en integración',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error general integración orden {order_id}: {str(e)}")
        return JsonResponse({
            'error': 'Error general en integración',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def confirm_integration_transaction(request):
    """
    Confirma una transacción de integración con Transbank
    """
    token = None
    try:
        token = request.data.get('token_ws')
        logger.info(f"Confirmando transacción de INTEGRACIÓN con token: {token}")
        
        if not token:
            return JsonResponse({
                'error': 'Token no proporcionado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Confirmar con credenciales de integración
        transaction = Transaction(integration_tx_options)
        response = transaction.commit(token=token)
        
        logger.info(f"Respuesta confirmación integración: {response}")
        
        # Buscar orden
        try:
            order = get_object_or_404(Order, payment_id=f"INT_{token}")
        except:
            return JsonResponse({
                'error': 'Orden no encontrada para token de integración'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Procesar respuesta
        response_status = getattr(response, 'status', None) or response.get('status')
        authorization_code = getattr(response, 'authorization_code', '') or response.get('authorization_code', '')
        payment_type_code = getattr(response, 'payment_type_code', '') or response.get('payment_type_code', '')
        buy_order = getattr(response, 'buy_order', '') or response.get('buy_order', '')
        amount = getattr(response, 'amount', 0) or response.get('amount', 0)
        
        if response_status == 'AUTHORIZED':
            # Actualizar orden como pagada
            order.status = 'pagada'
            order.payment_status = 'pagada'
            order.paid_at = timezone.now()  # Cambiar datetime.now() por timezone.now()
            order.transaction_id = buy_order
            order.save()
            
            # Actualizar stock de productos
            from django.db import transaction as db_transaction
            with db_transaction.atomic():
                for item in order.items.all():  # Cambiar orderitem_set por items
                    product = item.product
                    if product.stock >= item.quantity:
                        product.stock -= item.quantity
                        product.save()
                    else:
                        logger.warning(f"Stock insuficiente para producto {product.id}")
            
            logger.info(f"Transacción de integración AUTORIZADA para orden {order.id}")
            
            return JsonResponse({
                'status': 'success',
                'order_id': order.id,
                'amount': float(order.total),
                'transaction_date': order.paid_at.isoformat(),
                'authorization_code': authorization_code,
                'payment_type_code': payment_type_code,
                'buy_order': buy_order,
                'integration_mode': True,
                'message': 'Pago de integración procesado exitosamente (dinero ficticio)'
            })
        else:
            # Marcar como fallida
            order.status = 'cancelada'
            order.payment_status = 'rechazada'
            order.save()
            
            return JsonResponse({
                'status': 'rejected',
                'order_id': order.id,
                'detail': response_status,
                'integration_mode': True,
                'message': 'Transacción de integración rechazada'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    except TransbankError as e:
        logger.error(f"Error Transbank confirmación integración: {str(e)}")
        return JsonResponse({
            'error': 'Error de Transbank en confirmación de integración',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error general confirmación integración: {str(e)}")
        return JsonResponse({
            'error': 'Error general en confirmación de integración',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_simulation_status(request, token):
    """
    Obtiene el estado de una transacción simulada
    """
    try:
        order = get_object_or_404(Order, payment_id=f"SIM_{token}", user=request.user)
        
        return JsonResponse({
            'order_id': order.id,
            'status': order.status,
            'payment_status': order.payment_status,
            'amount': float(order.total),
            'paid_at': order.paid_at.isoformat() if order.paid_at else None,
            'simulation_mode': True
        })
    except Order.DoesNotExist:
        return JsonResponse({
            'error': 'Transacción simulada no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)