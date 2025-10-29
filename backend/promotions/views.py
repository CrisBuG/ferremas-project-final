from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from django.db.models import Q  # Importación añadida
from .models import Promotion, Coupon, PromotionUsage
from .serializers import PromotionSerializer, CouponSerializer, PromotionUsageSerializer


class PromotionViewSet(viewsets.ModelViewSet):
    serializer_class = PromotionSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'contador']:
            return Promotion.objects.all()
        # Los clientes solo ven promociones activas
        return Promotion.objects.filter(
            status='active',
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        )
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=False, methods=['get'])
    def active_promotions(self, request):
        """Obtener promociones activas"""
        now = timezone.now()
        promotions = Promotion.objects.filter(
            status='active',
            start_date__lte=now,
            end_date__gte=now
        )
        
        # Filtrar por productos si se especifica
        product_id = request.query_params.get('product_id')
        if product_id:
            promotions = promotions.filter(
                Q(applicable_products__id=product_id) |  # Usando Q en lugar de models.Q
                Q(applicable_categories__products__id=product_id)  # Usando Q en lugar de models.Q
            ).distinct()
        
        serializer = self.get_serializer(promotions, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activar promoción"""
        if request.user.role not in ['admin', 'contador']:
            return Response(
                {'error': 'Sin permisos'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        promotion = self.get_object()
        promotion.status = 'active'
        promotion.save()
        
        return Response({'message': 'Promoción activada'})
    
    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """Pausar promoción"""
        if request.user.role not in ['admin', 'contador']:
            return Response(
                {'error': 'Sin permisos'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        promotion = self.get_object()
        promotion.status = 'paused'
        promotion.save()
        
        return Response({'message': 'Promoción pausada'})

class CouponViewSet(viewsets.ModelViewSet):
    serializer_class = CouponSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'contador']:
            return Coupon.objects.all()
        # Los clientes solo ven sus cupones asignados
        return Coupon.objects.filter(assigned_to=user)
    
    @action(detail=False, methods=['post'])
    def validate_coupon(self, request):
        """Validar cupón"""
        code = request.data.get('code')
        if not code:
            return Response(
                {'error': 'Código requerido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            coupon = Coupon.objects.get(code=code.upper())
        except Coupon.DoesNotExist:
            return Response(
                {'error': 'Cupón no válido'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not coupon.is_valid(request.user):
            return Response(
                {'error': 'Cupón expirado o no válido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'valid': True,
            'coupon': CouponSerializer(coupon).data,
            'promotion': PromotionSerializer(coupon.promotion).data
        })
    
    @action(detail=False, methods=['post'])
    def apply_coupon(self, request):
        """Aplicar cupón a orden"""
        code = request.data.get('code')
        order_total = request.data.get('order_total', 0)
        
        try:
            coupon = Coupon.objects.get(code=code.upper())
        except Coupon.DoesNotExist:
            return Response(
                {'error': 'Cupón no válido'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        if not coupon.is_valid(request.user):
            return Response(
                {'error': 'Cupón expirado o no válido'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        discount = coupon.promotion.calculate_discount(order_total)
        
        return Response({
            'discount_amount': discount,
            'final_total': order_total - discount,
            'coupon': CouponSerializer(coupon).data
        })

class PromotionUsageViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = PromotionUsageSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'contador']:
            return PromotionUsage.objects.all()
        return PromotionUsage.objects.filter(user=user)