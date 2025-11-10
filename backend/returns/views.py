from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from orders.models import Order, OrderItem
from .models import Return, ReturnItem
from .serializers import ReturnSerializer, ReturnItemSerializer



class ReturnViewSet(viewsets.ModelViewSet):
    serializer_class = ReturnSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role') and user.role in ['admin', 'bodeguero']:
            return Return.objects.all()
        return Return.objects.filter(customer=user)
    
    def perform_create(self, serializer):
        # El customer ya viene en los datos del serializer, no lo sobrescribir
        serializer.save()
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Aprobar devolución"""
        if not hasattr(request.user, 'role') or request.user.role not in ['admin', 'bodeguero']:
            return Response(
                {'error': 'Sin permisos'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return_request = self.get_object()
        if return_request.status != 'solicitada':
            return Response(
                {'error': 'Solo se pueden aprobar devoluciones solicitadas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return_request.approve(request.user)
        return Response({'message': 'Devolución aprobada'})
    
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        """Rechazar devolución"""
        if not hasattr(request.user, 'role') or request.user.role not in ['admin', 'bodeguero']:
            return Response(
                {'error': 'Sin permisos'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return_request = self.get_object()
        if return_request.status != 'solicitada':
            return Response(
                {'error': 'Solo se pueden rechazar devoluciones solicitadas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        admin_notes = request.data.get('admin_notes', '')
        return_request.status = 'rechazada'
        return_request.processed_by = request.user
        return_request.admin_notes = admin_notes
        return_request.save()
        
        return Response({'message': 'Devolución rechazada'})
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Completar devolución"""
        if request.user.role not in ['admin', 'bodeguero']:
            return Response(
                {'error': 'Sin permisos'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        return_request = self.get_object()
        if return_request.status != 'aprobada':
            return Response(
                {'error': 'Solo se pueden completar devoluciones aprobadas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return_request.complete()
        return Response({'message': 'Devolución completada'})
    
    @action(detail=False, methods=['post'])
    def create_return(self, request):
        """Crear nueva devolución"""
        order_id = request.data.get('order_id')
        items_data = request.data.get('items', [])
        reason = request.data.get('reason')
        description = request.data.get('description')
        
        try:
            order = Order.objects.get(id=order_id, user=request.user)
        except Order.DoesNotExist:
            return Response(
                {'error': 'Orden no encontrada'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Crear devolución
        return_request = Return.objects.create(
            order=order,
            customer=request.user,
            reason=reason,
            description=description
        )
        
        # Crear items de devolución
        total_refund = 0
        for item_data in items_data:
            order_item = OrderItem.objects.get(
                id=item_data['order_item_id'],
                order=order
            )
            
            return_item = ReturnItem.objects.create(
                return_request=return_request,
                order_item=order_item,
                product=order_item.product,
                quantity=item_data['quantity'],
                reason=item_data.get('reason', reason),
                condition_notes=item_data.get('condition_notes', ''),
                unit_price=order_item.price
            )
            total_refund += return_item.refund_amount
        
        return_request.refund_amount = total_refund
        return_request.save()
        
        return Response(ReturnSerializer(return_request).data)

class ReturnItemViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ReturnItemSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['admin', 'bodeguero']:
            return ReturnItem.objects.all()
        return ReturnItem.objects.filter(return_request__customer=user)