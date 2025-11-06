from rest_framework import serializers
from .models import Return, ReturnItem
from orders.models import Order
from django.contrib.auth import get_user_model

User = get_user_model()

class ReturnItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReturnItem
        fields = '__all__'

class ReturnSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True, read_only=True)
    customer_name = serializers.SerializerMethodField()
    order_number = serializers.SerializerMethodField()
    processed_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Return
        fields = [
            'id', 'return_number', 'order', 'order_number', 'customer',
            'customer_name', 'reason', 'description', 'status',
            'requested_at', 'approved_at', 'completed_at',
            'processed_by', 'processed_by_name', 'admin_notes',
            'refund_amount', 'refund_processed', 'items'
        ]
        read_only_fields = [
            'return_number', 'approved_at', 'completed_at',
            'processed_by', 'refund_processed'
        ]
    
    def get_customer_name(self, obj):
        if obj.customer:
            return obj.customer.get_full_name() if hasattr(obj.customer, 'get_full_name') else str(obj.customer)
        return ''
    
    def get_order_number(self, obj):
        if obj.order:
            return getattr(obj.order, 'order_number', str(obj.order.id))
        return ''
    
    def get_processed_by_name(self, obj):
        if obj.processed_by:
            return obj.processed_by.get_full_name() if hasattr(obj.processed_by, 'get_full_name') else str(obj.processed_by)
        return ''
    
    def validate(self, data):
        """Validaciones básicas"""
        order = data.get('order')
        customer = data.get('customer')
        
        # Validar que la orden existe
        if order and not Order.objects.filter(id=order.id).exists():
            raise serializers.ValidationError("La orden especificada no existe.")
        
        # Validar que el cliente existe
        if customer and not User.objects.filter(id=customer.id).exists():
            raise serializers.ValidationError("El cliente especificado no existe.")
        
        # Validar que la orden pertenece al cliente
        if order and customer:
            if hasattr(order, 'user') and order.user != customer:
                raise serializers.ValidationError("La orden no pertenece al cliente especificado.")
        
        return data