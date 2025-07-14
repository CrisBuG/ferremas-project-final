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
from datetime import datetime
import logging
import json

# Configurar logger
logger = logging.getLogger(__name__)

# Configuración de Transbank
COMMERCE_CODE = settings.TRANSBANK_COMMERCE_CODE
API_KEY = settings.TRANSBANK_API_KEY
ENVIRONMENT = settings.TRANSBANK_ENVIRONMENT

# Configurar opciones de Transbank
if ENVIRONMENT == 'production':
    integration_type = IntegrationType.LIVE
else:
    integration_type = IntegrationType.TEST

tx_options = WebpayOptions(COMMERCE_CODE, API_KEY, integration_type)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def init_transaction(request):
    """
    Inicia una transacción con Transbank
    """
    order_id = None
    try:
        # Obtener datos de la solicitud
        order_id = request.data.get('order_id')
        logger.info(f"Iniciando transacción para orden {order_id}")
        
        # Validar que la orden exista y pertenezca al usuario
        order = get_object_or_404(Order, id=order_id, user=request.user)
        logger.info(f"Orden encontrada: {order.id}, Total: {order.total}")
        
        # Validar que la orden esté en estado pendiente
        if order.status != 'pendiente':
            logger.warning(f"Orden {order_id} no está en estado pendiente: {order.status}")
            return JsonResponse({
                'error': 'La orden no está en estado pendiente'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear URL de retorno absoluta y verificada
        return_url = "http://localhost:3000/payment-confirmation"
        
        # Verificar que la URL sea válida
        if not return_url.startswith(('http://', 'https://')):
            return_url = f"http://localhost:3000{return_url}"
        
        logger.info(f"URL de retorno configurada: {return_url}")
        
        # Crear instancia de Transaction con opciones
        transaction = Transaction(tx_options)
        logger.info("Instancia de Transaction creada")
        
        # Preparar parámetros para la transacción
        buy_order = str(order.id)
        session_id = str(request.user.id)
        amount = int(order.total)
        
        # Validar que el monto sea válido
        if amount <= 0:
            logger.error(f"Monto inválido: {amount}")
            return JsonResponse({
                'error': 'El monto de la transacción debe ser mayor a 0'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        logger.info(f"Parámetros de transacción - Buy Order: {buy_order}, Session ID: {session_id}, Amount: {amount}")
        
        # Iniciar transacción
        response = transaction.create(
            buy_order=buy_order,
            session_id=session_id,
            amount=amount,
            return_url=return_url
        )
        
        logger.info(f"Respuesta de Transbank recibida: {type(response)}")
        logger.info(f"Contenido de respuesta: {response}")
        
        # Manejar respuesta como objeto o diccionario
        token = None
        url = None
        
        if hasattr(response, 'token'):
            # Respuesta como objeto
            token = response.token
            url = response.url
            logger.info("Respuesta procesada como objeto")
        elif isinstance(response, dict):
            # Respuesta como diccionario
            token = response.get('token')
            url = response.get('url')
            logger.info("Respuesta procesada como diccionario")
        else:
            logger.error(f"Tipo de respuesta no reconocido: {type(response)}")
            return JsonResponse({
                'error': 'Formato de respuesta de Transbank no reconocido',
                'debug_info': str(response)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Después de obtener token y url de la respuesta de Transbank
        if not token or not url:
            logger.error(f"Token o URL faltantes - Token: {token}, URL: {url}")
            logger.error(f"Respuesta completa de Transbank: {response}")
            return JsonResponse({
                'error': 'Token o URL no recibidos de Transbank',
                'debug_info': str(response) if response else 'No response'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # NUEVO: Construir la URL completa con el token
        if '?' in url:
            complete_url = f"{url}&token_ws={token}"
        else:
            complete_url = f"{url}?token_ws={token}"
        
        # Validar que la URL sea de Transbank (CORREGIDO)
        valid_domains = ['webpay3g.transbank.cl', 'webpay3gint.transbank.cl']
        is_valid_url = any(domain in url for domain in valid_domains) and url.startswith('https://')
        
        if not is_valid_url:
            logger.error(f"URL de Transbank inválida: {url}")
            return JsonResponse({
                'error': 'URL de redirección inválida de Transbank',
                'received_url': url
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Guardar token en la orden
        order.payment_id = token
        order.save()
        
        logger.info(f"Transacción Transbank creada exitosamente - Token: {token}, URL completa: {complete_url}")
        
        # Devolver respuesta con URL completa
        return JsonResponse({
            'success': True,
            'token': token,
            'url': complete_url,  # CAMBIADO: ahora devuelve la URL completa con token
            'order_id': order.id
        }, status=status.HTTP_200_OK)
    
    except TransbankError as e:
        logger.error(f"Error de Transbank al iniciar transacción para la orden {order_id}: {str(e)}")
        return JsonResponse({
            'error': 'Error de Transbank al iniciar la transacción',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error general al iniciar transacción para la orden {order_id}: {str(e)}")
        logger.error(f"Tipo de error: {type(e)}")
        return JsonResponse({
            'error': 'Error general al iniciar la transacción',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def confirm_transaction(request):
    """
    Confirma una transacción con Transbank
    """
    token = None
    try:
        # Obtener token de la solicitud
        token = request.data.get('token_ws')
        logger.info(f"Confirmando transacción con token: {token}")
        
        if not token:
            logger.error("Token no proporcionado en la solicitud")
            return JsonResponse({
                'error': 'Token no proporcionado'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear instancia de Transaction con opciones
        transaction = Transaction(tx_options)
        
        # Confirmar transacción
        response = transaction.commit(token=token)
        logger.info(f"Respuesta de confirmación: {response}")
        
        # Buscar orden por token
        try:
            order = get_object_or_404(Order, payment_id=token)
        except:
            logger.error(f"Orden no encontrada para token: {token}")
            return JsonResponse({
                'error': 'Orden no encontrada para el token proporcionado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Manejar respuesta como objeto o diccionario
        if hasattr(response, 'status'):
            # Respuesta como objeto
            response_status = response.status
            authorization_code = getattr(response, 'authorization_code', '')
            payment_type_code = getattr(response, 'payment_type_code', '')
            buy_order = getattr(response, 'buy_order', '')
            amount = getattr(response, 'amount', 0)
        else:
            # Respuesta como diccionario
            response_status = response.get('status', '')
            authorization_code = response.get('authorization_code', '')
            payment_type_code = response.get('payment_type_code', '')
            buy_order = response.get('buy_order', '')
            amount = response.get('amount', 0)
        
        # Validar respuesta
        if response_status == 'AUTHORIZED':
            # Actualizar orden
            order.status = 'pagada'
            order.payment_status = 'pagada'
            order.paid_at = datetime.now()
            order.transaction_id = buy_order
            order.save()
            
            logger.info(f"Transacción autorizada para orden {order.id}")
            
            return JsonResponse({
                'status': 'success',
                'order_id': order.id,
                'amount': float(order.total),
                'transaction_date': order.paid_at.isoformat() if order.paid_at else None,
                'authorization_code': authorization_code,
                'payment_type_code': payment_type_code,
                'buy_order': buy_order
            }, status=status.HTTP_200_OK)
        else:
            # Marcar orden como fallida
            order.status = 'cancelada'
            order.payment_status = 'rechazada'
            order.save()
            
            logger.warning(f"Transacción rechazada para orden {order.id}: {response_status}")
            
            return JsonResponse({
                'status': 'rejected',
                'order_id': order.id,
                'detail': response_status,
                'message': 'La transacción fue rechazada por Transbank'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    except TransbankError as e:
        logger.error(f"Error de Transbank al confirmar transacción con token {token}: {str(e)}")
        return JsonResponse({
            'error': 'Error de Transbank al confirmar la transacción',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error general al confirmar transacción con token {token}: {str(e)}")
        return JsonResponse({
            'error': 'Error general al confirmar la transacción',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def get_transaction_status(request, token):
    """
    Obtiene el estado de una transacción
    """
    try:
        # Buscar orden por token
        order = get_object_or_404(Order, payment_id=token)
        
        return JsonResponse({
            'status': 'success',
            'order_id': order.id,
            'payment_status': order.payment_status,
            'order_status': order.status,
            'amount': float(order.total),
            'created_at': order.created_at.isoformat(),
            'paid_at': order.paid_at.isoformat() if order.paid_at else None
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error al obtener estado de transacción con token {token}: {str(e)}")
        return JsonResponse({
            'error': 'Error al obtener el estado de la transacción',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def cancel_transaction(request):
    """
    Anula una transacción con Transbank
    """
    order_id = None
    try:
        # Obtener datos de la solicitud
        order_id = request.data.get('order_id')
        
        # Validar que la orden exista y pertenezca al usuario
        order = get_object_or_404(Order, id=order_id, user=request.user)
        
        # Validar que la orden esté en estado pagada
        if order.status != 'pagada':
            return JsonResponse({
                'error': 'La orden no está en estado pagada'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear instancia de Transaction con opciones
        transaction = Transaction(tx_options)
        
        # Anular transacción
        response = transaction.refund(
            token=order.payment_id,
            amount=int(order.total)
        )
        
        # Manejar respuesta como objeto o diccionario
        if hasattr(response, 'type'):
            # Respuesta como objeto
            response_type = response.type
        else:
            # Respuesta como diccionario
            response_type = response.get('type', '')
        
        # Actualizar orden
        if response_type == 'REVERSED' or response_type == 'NULLIFIED':
            order.status = 'cancelada'
            order.payment_status = 'cancelada'
            order.save()
            
            return JsonResponse({
                'status': 'success',
                'order_id': order.id,
                'detail': 'Transacción anulada correctamente'
            }, status=status.HTTP_200_OK)
        else:
            return JsonResponse({
                'status': 'error',
                'order_id': order.id,
                'detail': f'Error al anular: {response_type}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    except TransbankError as e:
        logger.error(f"Error de Transbank al anular transacción para la orden {order_id}: {str(e)}")
        return JsonResponse({
            'error': 'Error de Transbank al anular la transacción',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    except Exception as e:
        logger.error(f"Error general al anular transacción para la orden {order_id}: {str(e)}")
        return JsonResponse({
            'error': 'Error general al anular la transacción',
            'detail': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)