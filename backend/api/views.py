from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth import authenticate, login
from django.views import View
from users.models import CustomUser  
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from django.http import JsonResponse
from django.middleware.csrf import get_token
from django.db import transaction
from django.db.models import Q, Avg, Count, Sum
from django.core.exceptions import ValidationError
from django.contrib.auth.hashers import check_password
from django.utils import timezone  
from google.oauth2 import id_token
from google.auth.transport import requests
import requests as http_requests
import json
import uuid
import random
from decimal import Decimal
from datetime import datetime, timedelta
from products.models import Product, Category, Review
from orders.models import Cart, CartItem, Order, OrderItem
from .serializers import (
    ProductSerializer, CategorySerializer, CartSerializer, 
    CartItemSerializer, OrderSerializer, OrderItemSerializer,
    UserSerializer, ReviewSerializer
)

class CSRFTokenView(View):
    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return JsonResponse({'csrfToken': get_token(request)})


class UserViewSet(viewsets.ModelViewSet):
    queryset = CustomUser.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    
    def get_permissions(self):
        if self.action in ['list', 'destroy']:
            permission_classes = [IsAuthenticated]
            # Solo admin puede listar y eliminar usuarios
            if not self.request.user.is_staff:
                return [permissions.IsAdminUser()]
        else:
            permission_classes = [IsAuthenticated]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['put'])
    def update_item(self, request):
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        user = request.user
        current_password = request.data.get('current_password')
        new_password = request.data.get('new_password')
        
        if not current_password or not new_password:
            return Response({
                'success': False,
                'error': 'Contraseña actual y nueva contraseña son requeridas'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar la contraseña actual
        if not check_password(current_password, user.password):
            return Response({
                'success': False,
                'error': 'La contraseña actual es incorrecta'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Cambiar la contraseña
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Contraseña cambiada exitosamente'
        })


@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    
    if email and password:
        user = authenticate(username=email, password=password)
        if user:
            login(request, user)
            # Generar o obtener token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'success': True,
                'token': token.key,  # ✅ Agregar token
                'user': {
                    'id': user.id,
                    'username': user.username,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                    'is_staff': user.is_staff
                }
            })
        else:
            return Response({
                'success': False,
                'error': 'Credenciales inválidas'
            }, status=status.HTTP_401_UNAUTHORIZED)
    
    return Response({
        'success': False,
        'error': 'Email y password son requeridos'  # Cambiado mensaje también
    }, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    email = request.data.get('email')
    password = request.data.get('password')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    
    # Validación acorde al modelo CustomUser (USERNAME_FIELD = 'email')
    if not all([email, password]):
        return Response({
            'success': False,
            'error': 'Email y password son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if CustomUser.objects.filter(email=email).exists():
        return Response({
            'success': False,
            'error': 'El email ya está registrado'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = CustomUser.objects.create_user(
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            is_staff=False,  # asegurar que sea no staff
            role='cliente'
        )
        login(request, user)
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': getattr(user, 'username', None),
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff
            }
        }, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
def google_auth(request):
    token = request.data.get('token')
    
    if not token:
        return Response({
            'success': False,
            'error': 'Token de Google es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
    # Verificar el token de Google usando la configuración de settings
        from django.conf import settings
        idinfo = id_token.verify_oauth2_token(
                token, 
                requests.Request(), 
                settings.GOOGLE_OAUTH2_CLIENT_ID
        )
    
        
       
        
        email = idinfo['email']
        first_name = idinfo.get('given_name', '')
        last_name = idinfo.get('family_name', '')
        
        # Buscar o crear usuario
        user, created = CustomUser.objects.get_or_create(
            email=email,
            defaults={
            'first_name': first_name,
            'last_name': last_name,
            }
        )
        
        login(request, user)
        
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'is_staff': user.is_staff
            }
        })
        
    except ValueError as e:
        print(f"Error de validación de token Google: {e}")
        return Response({
            'success': False,
            'error': 'Token de Google inválido'
        }, status=status.HTTP_401_UNAUTHORIZED)
    except Exception as e:
        print(f"Error en Google auth: {e}")
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def current_user_view(request):
    user = request.user
    return Response({
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'role': user.role,
        'is_staff': user.is_staff,
        'date_joined': user.date_joined.isoformat() if user.date_joined else None,
        'address': user.address,
        'phone': user.phone,
        'profile_picture': user.profile_picture.url if user.profile_picture else None,
        'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
        'gender': user.gender,
        'shipping_first_name': user.shipping_first_name,
        'shipping_last_name': user.shipping_last_name,
        'shipping_company': user.shipping_company,
        'shipping_address': user.shipping_address,
        'shipping_city': user.shipping_city,
        'shipping_state': user.shipping_state,
        'shipping_postal_code': user.shipping_postal_code,
        'shipping_country': user.shipping_country,
        'shipping_phone': user.shipping_phone
    })


@api_view(['PATCH', 'PUT'])  # Permitir ambos métodos
@permission_classes([IsAuthenticated])
def update_profile_view(request):
    user = request.user
    
    # Campos que se pueden actualizar - AMPLIADOS
    allowed_fields = [
        'first_name', 'last_name', 'email', 'phone', 'address',
        'date_of_birth', 'gender', 'shipping_first_name', 'shipping_last_name',
        'shipping_company', 'shipping_address', 'shipping_city', 'shipping_state',
        'shipping_postal_code', 'shipping_country', 'shipping_phone'
    ]
    
    # Manejar imagen de perfil si se envía
    if 'profile_picture' in request.FILES:
        user.profile_picture = request.FILES['profile_picture']
    
    # Actualizar campos de texto
    for field in allowed_fields:
        if field in request.data:
            setattr(user, field, request.data[field])
    
    try:
        user.save()
        return Response({
            'success': True,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'is_staff': user.is_staff,
                'date_joined': user.date_joined.isoformat() if user.date_joined else None,
                'address': user.address,
                'phone': user.phone,
                'profile_picture': user.profile_picture.url if user.profile_picture else None,
                'date_of_birth': user.date_of_birth.isoformat() if user.date_of_birth else None,
                'gender': user.gender,
                'shipping_first_name': user.shipping_first_name,
                'shipping_last_name': user.shipping_last_name,
                'shipping_company': user.shipping_company,
                'shipping_address': user.shipping_address,
                'shipping_city': user.shipping_city,
                'shipping_state': user.shipping_state,
                'shipping_postal_code': user.shipping_postal_code,
                'shipping_country': user.shipping_country,
                'shipping_phone': user.shipping_phone
            }
        })
    except Exception as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_admin_password(request):
    if not request.user.is_staff:
        return Response({
            'success': False,
            'error': 'No tienes permisos de administrador'
        }, status=status.HTTP_403_FORBIDDEN)
    
    password = request.data.get('password')
    if not password:
        return Response({
            'success': False,
            'error': 'Password es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if check_password(password, request.user.password):
        return Response({'success': True})
    else:
        return Response({
            'success': False,
            'error': 'Password incorrecto'
        }, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def admin_stats_view(request):
    if not request.user.is_staff:
        return Response({
            'error': 'No tienes permisos para acceder a estas estadísticas'
        }, status=status.HTTP_403_FORBIDDEN)
    
    # Calcular ingresos totales de órdenes pagadas
    total_revenue = Order.objects.filter(
        payment_status='pagada'
    ).aggregate(total=Sum('total'))['total'] or 0

    # Estadísticas por estado de órdenes
    orders_by_status = {
        'pendiente': Order.objects.filter(status='pendiente').count(),
        'completado': Order.objects.filter(status='entregada').count(),
        'cancelado': Order.objects.filter(status='cancelada').count(),
    }
    
    stats = {
        'total_users': CustomUser.objects.count(),
        'total_products': Product.objects.count(),
        'total_orders': Order.objects.count(),
        'total_revenue': float(total_revenue),
        'orders_by_status': orders_by_status,
        'pending_orders': Order.objects.filter(status='pendiente').count(),
        'completed_orders': Order.objects.filter(status='entregada').count(),
    }
    
    return Response(stats)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def accountant_stats_view(request):
    # Aquí podrías añadir una verificación de rol si tienes un grupo 'Contador'
    # if not request.user.groups.filter(name='Contador').exists():
    #     return Response({'error': 'Acceso denegado'}, status=status.HTTP_403_FORBIDDEN)

    total_revenue = Order.objects.filter(payment_status='pagada').aggregate(total=Sum('total'))['total'] or 0
    pending_orders = Order.objects.filter(status='pendiente').count()
    completed_orders = Order.objects.filter(status='entregada').count()
    total_products = Product.objects.count()
    total_orders = Order.objects.count()

    stats = {
        'total_revenue': float(total_revenue),
        'pending_orders': pending_orders,
        'completed_orders': completed_orders,
        'total_products': total_products,
        'total_orders': total_orders,
    }
    
    return Response(stats)


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]


class ProductViewSet(viewsets.ModelViewSet):
    queryset = Product.objects.select_related('category').prefetch_related('reviews')
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        queryset = Product.objects.select_related('category').prefetch_related('reviews')
        
        # Filtros
        category = self.request.query_params.get('category', None)
        search = self.request.query_params.get('search', None)
        min_price = self.request.query_params.get('min_price', None)
        max_price = self.request.query_params.get('max_price', None)
        
        if category:
            queryset = queryset.filter(category__name__icontains=category)
        
        if search:
            queryset = queryset.filter(
                Q(name__icontains=search) | 
                Q(description__icontains=search) |
                Q(category__name__icontains=search)
            )
        
        if min_price:
            try:
                queryset = queryset.filter(price__gte=float(min_price))
            except ValueError:
                pass
        
        if max_price:
            try:
                queryset = queryset.filter(price__lte=float(max_price))
            except ValueError:
                pass
        
        return queryset
    
    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            permission_classes = [IsAuthenticated]
        else:
            permission_classes = [AllowAny]
        return [permission() for permission in permission_classes]
    
    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('q', '')
        if query:
            products = self.get_queryset().filter(
                Q(name__icontains=query) | 
                Q(description__icontains=query)
            )[:10]
            serializer = self.get_serializer(products, many=True)
            return Response(serializer.data)
        return Response([])
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def add_review(self, request, pk=None):
        product = self.get_object()
        user = request.user
        
        # Verificar si el usuario ya ha hecho una reseña
        if Review.objects.filter(product=product, user=user).exists():
            return Response({
                'error': 'Ya has hecho una reseña para este producto'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        rating = request.data.get('rating')
        comment = request.data.get('comment', '')
        
        if not rating or not (1 <= int(rating) <= 5):
            return Response({
                'error': 'Rating debe ser entre 1 y 5'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        review = Review.objects.create(
            product=product,
            user=user,
            rating=rating,
            comment=comment
        )
        
        serializer = ReviewSerializer(review)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=True, methods=['patch'], permission_classes=[IsAuthenticated])
    def update_review(self, request, pk=None):
        product = self.get_object()
        user = request.user
        
        try:
            review = Review.objects.get(product=product, user=user)
        except Review.DoesNotExist:
            return Response({
                'error': 'No tienes una reseña para este producto'
            }, status=status.HTTP_404_NOT_FOUND)
        
        rating = request.data.get('rating')
        comment = request.data.get('comment')
        
        if rating and (1 <= int(rating) <= 5):
            review.rating = rating
        
        if comment is not None:
            review.comment = comment
        
        review.save()
        
        serializer = ReviewSerializer(review)
        return Response(serializer.data)
    
    @action(detail=True, methods=['delete'], permission_classes=[IsAuthenticated])
    def delete_review(self, request, pk=None):
        product = self.get_object()
        user = request.user
        
        try:
            review = Review.objects.get(product=product, user=user)
            review.delete()
            return Response({'message': 'Reseña eliminada'}, status=status.HTTP_204_NO_CONTENT)
        except Review.DoesNotExist:
            return Response({
                'error': 'No tienes una reseña para este producto'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def mark_review_helpful(self, request, pk=None):
        product = self.get_object()
        review_id = request.data.get('review_id')
        
        if not review_id:
            return Response({
                'error': 'review_id es requerido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            review = Review.objects.get(id=review_id, product=product)
            review.helpful_count += 1
            review.save()
            
            return Response({
                'message': 'Reseña marcada como útil',
                'helpful_count': review.helpful_count
            })
        except Review.DoesNotExist:
            return Response({
                'error': 'Reseña no encontrada'
            }, status=status.HTTP_404_NOT_FOUND)


class CartViewSet(viewsets.ModelViewSet):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def get_cart(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        serializer = self.get_serializer(cart)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def add_item(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({
                'error': 'Producto no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar stock disponible
        if product.stock < quantity:
            return Response({
                'error': f'Stock insuficiente. Solo quedan {product.stock} unidades'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            new_quantity = cart_item.quantity + quantity
            if product.stock < new_quantity:
                return Response({
                    'error': f'Stock insuficiente. Solo quedan {product.stock} unidades'
                }, status=status.HTTP_400_BAD_REQUEST)
            cart_item.quantity = new_quantity
            cart_item.save()
        
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    
    @action(detail=False, methods=['patch'])
    def update_item(self, request):
        cart_item_id = request.data.get('cart_item_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            cart_item = CartItem.objects.get(
                id=cart_item_id,
                cart__user=request.user
            )
        except CartItem.DoesNotExist:
            return Response({
                'error': 'Item del carrito no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Verificar stock disponible
        if cart_item.product.stock < quantity:
            return Response({
                'error': f'Stock insuficiente. Solo quedan {cart_item.product.stock} unidades'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        cart_item.quantity = quantity
        cart_item.save()
        
        serializer = CartItemSerializer(cart_item)
        return Response(serializer.data)
    
    @action(detail=False, methods=['delete'])
    def remove_item(self, request):
        cart_item_id = request.data.get('cart_item_id')
        
        try:
            cart_item = CartItem.objects.get(
                id=cart_item_id,
                cart__user=request.user
            )
            cart_item.delete()
            return Response({'message': 'Item eliminado del carrito'})
        except CartItem.DoesNotExist:
            return Response({
                'error': 'Item del carrito no encontrado'
            }, status=status.HTTP_404_NOT_FOUND)
    
    @action(detail=False, methods=['delete'])
    def clear_cart(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        cart.items.all().delete()
        return Response({'message': 'Carrito vaciado'})


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).order_by('-created_at')
    
    @action(detail=False, methods=['get'])
    def get_orders(self, request):
        orders = self.get_queryset()
        serializer = self.get_serializer(orders, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def create_order(self, request):
        user = request.user
        
        try:
            # Obtener el carrito existente, no crear uno nuevo
            cart = Cart.objects.get(user=user)
        except Cart.DoesNotExist:
            return Response({
                'error': 'El carrito está vacío'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not cart.items.exists():
            return Response({
                'error': 'El carrito está vacío'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verificar stock antes de crear la orden
        for item in cart.items.all():
            if item.product.stock < item.quantity:
                return Response({
                    'error': f'Stock insuficiente para {item.product.name}. Solo quedan {item.product.stock} unidades'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        # Obtener delivery_method del request, con valor por defecto seguro
        delivery_method = request.data.get('delivery_method', 'domicilio')
        
        # Mapear valores del frontend al backend
        if delivery_method == 'envio':
            delivery_method = 'domicilio'
        elif delivery_method == 'retiro':
            delivery_method = 'retiro'
        else:
            delivery_method = 'domicilio'  # Valor por defecto
        
        # Crear la orden con manejo de errores robusto
        try:
            with transaction.atomic():
                order = Order.objects.create(
                    user=user,
                    total=cart.total,
                    shipping_address=request.data.get('shipping_address', ''),
                    shipping_city=request.data.get('shipping_city', ''),
                    shipping_state=request.data.get('shipping_state', ''),
                    shipping_zip=request.data.get('shipping_zip', ''),
                    shipping_phone=request.data.get('shipping_phone', ''),
                    delivery_method=delivery_method,
                    status='pendiente'
                )
                
                # Crear items de la orden
                for item in cart.items.all():
                    OrderItem.objects.create(
                        order=order,
                        product=item.product,
                        quantity=item.quantity,
                        price=item.product.price
                    )
        except Exception as e:
            return Response({
                'error': f'Error al crear la orden: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        serializer = self.get_serializer(order)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([AllowAny])
def get_exchange_rate(request):
    """Obtiene la tasa de cambio USD a CLP"""
    try:
        response = http_requests.get('https://api.exchangerate-api.com/v4/latest/USD')
        data = response.json()
        clp_rate = data['rates']['CLP']
        return Response({'rate': clp_rate})
    except:
        # Valor por defecto en caso de error
        return Response({'rate': 800})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_transbank_payment(request):
    """Simula el proceso de pago de Transbank"""
    order_id = request.data.get('order_id')
    amount = request.data.get('amount')
    
    if not order_id or not amount:
        return Response({
            'error': 'order_id y amount son requeridos'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({
            'error': 'Orden no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Generar un token falso para la simulación
    fake_token = str(uuid.uuid4())
    
    # Guardar el token en la orden para la confirmación
    order.payment_token = fake_token
    order.save()
    
    # Simular respuesta de Transbank
    return Response({
        'token': fake_token,
        'url': f'/api/simulate-payment-confirmation/?token={fake_token}'
    })


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def simulate_payment_confirmation(request):
    """Simula la confirmación de pago de Transbank"""
    token = request.GET.get('token') or request.data.get('token')
    order_id = request.GET.get('order_id') or request.data.get('order_id')
    result = request.data.get('result')  # Obtener el resultado enviado desde el frontend
    
    if not token and not order_id:
        return Response({
            'error': 'Token o order_id es requerido'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    if not result or result not in ['approved', 'rejected']:
        return Response({
            'error': 'Resultado de pago inválido. Debe ser "approved" o "rejected"'
        }, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        if token:
            order = Order.objects.get(payment_token=token, user=request.user)
        else:
            order = Order.objects.get(id=order_id, user=request.user)
    except Order.DoesNotExist:
        return Response({
            'error': 'Token/orden inválido o orden no encontrada'
        }, status=status.HTTP_404_NOT_FOUND)
    
    # Usar el resultado enviado desde el frontend en lugar de uno aleatorio
    payment_success = result == 'approved'
    
    if payment_success:
        # Actualizar stock solo si el pago es exitoso
        with transaction.atomic():
            # Verificar stock nuevamente antes de actualizar
            for order_item in order.items.all():
                if order_item.product.stock < order_item.quantity:
                    return Response({
                        'error': f'Stock insuficiente para {order_item.product.name}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Actualizar stock
            for order_item in order.items.all():
                product = order_item.product
                product.stock -= order_item.quantity
                product.save()
            
            # Actualizar estado de la orden
            order.status = 'completed'
            order.payment_status = 'paid'
            order.paid_at = timezone.now()
            order.save()
        
        return Response({
            'status': 'success',
            'message': 'Pago procesado exitosamente',
            'order_id': order.id,
            'payment_status': 'completed',
            'result': 'approved'
        })
    else:
        # Pago fallido - CAMBIO IMPORTANTE: devolver status 200 en lugar de 400
        order.status = 'failed'
        order.payment_status = 'failed'
        order.save()
        
        return Response({
            'status': 'success',  # Cambiar a success para indicar que la operación fue exitosa
            'message': 'El pago fue rechazado',
            'order_id': order.id,
            'payment_status': 'failed',
            'result': 'rejected'
        })  # Remover status=status.HTTP_400_BAD_REQUEST


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_payment_process(request):
    """Simula todo el proceso de pago: crear orden y procesar pago"""
    try:
        user = request.user
        
        # Obtener datos del request
        items = request.data.get('items', [])
        shipping_data = request.data.get('shipping_data', {})
        total_clp = request.data.get('total_clp', 0)
        exchange_rate = request.data.get('exchange_rate', 800)
        
        # Validar datos requeridos
        if not items:
            return Response({
                'error': 'No hay items en el pedido'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not shipping_data:
            return Response({
                'error': 'Datos de envío requeridos'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Crear la orden
        with transaction.atomic():
            order = Order.objects.create(
                user=user,
                total=total_clp,
                shipping_address=shipping_data.get('address', ''),
                shipping_city=shipping_data.get('city', ''),
                shipping_state=shipping_data.get('firstName', '') + ' ' + shipping_data.get('lastName', ''),
                shipping_zip=shipping_data.get('postalCode', ''),
                shipping_phone=shipping_data.get('phone', ''),
                delivery_method='domicilio',
                status='pendiente',
                payment_status='pending'
            )
            
            # Crear items de la orden
            for item_data in items:
                try:
                    product = Product.objects.get(id=item_data['product_id'])
                    
                    # Verificar stock
                    if product.stock < item_data['quantity']:
                        return Response({
                            'error': f'Stock insuficiente para {product.name}'
                        }, status=status.HTTP_400_BAD_REQUEST)
                    
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        quantity=item_data['quantity'],
                        price=item_data['price_usd']
                    )
                except Product.DoesNotExist:
                    return Response({
                        'error': f'Producto con ID {item_data["product_id"]} no encontrado'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Simular pago exitoso automáticamente
            # Actualizar stock
            for order_item in order.items.all():
                product = order_item.product
                product.stock -= order_item.quantity
                product.save()
            
            # Actualizar estado de la orden
            order.status = 'completed'
            order.payment_status = 'paid'
            order.paid_at = timezone.now()
            order.save()
        
        return Response({
            'success': True,
            'message': 'Pago simulado procesado exitosamente',
            'order_id': order.id,
            'status': 'completed',
            'payment_status': 'paid'
        }, status=status.HTTP_201_CREATED)
        
    except Exception as e:
        return Response({
            'error': f'Error al procesar el pago simulado: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        # Eliminar token del usuario
        request.user.auth_token.delete()
    except:
        pass
    logout(request)
    return Response({'success': True, 'message': 'Logout exitoso'})