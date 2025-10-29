from rest_framework import serializers
from django.contrib.auth import authenticate
from django.db.models import Q
from users.models import CustomUser
from products.models import Product, Category, Review, ProductImage, ProductSpecification, ReviewHelpful
from orders.models import Cart, CartItem, Order, OrderItem

# Importar desde las nuevas apps
from reports.models import Report, ReportType
from returns.models import Return, ReturnItem
from promotions.models import Promotion, Coupon, PromotionUsage
from billing.models import Invoice, InvoiceItem


class UserSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()
    
    class Meta:
        model = CustomUser
        fields = [
            'id', 'email', 'first_name', 'last_name', 'role', 'password',
            'address', 'phone', 'profile_picture', 'date_of_birth', 'gender',
            'shipping_first_name', 'shipping_last_name', 'shipping_company',
            'shipping_address', 'shipping_city', 'shipping_state', 
            'shipping_postal_code', 'shipping_country', 'shipping_phone'
        ]
        extra_kwargs = {
            'password': {'write_only': True}
        }

    def get_profile_picture(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = CustomUser.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        
        # Verificar permisos para cambiar el rol
        if 'role' in validated_data:
            request = self.context.get('request')
            if request and request.user.role != 'admin':
                validated_data.pop('role')  # Remover el campo role si no es admin
        
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()
        return instance
    
    
class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField()
    
    def validate(self, data):
        email = data.get('email')
        password = data.get('password')
        
        print(f"DEBUG - Email recibido: {email}")
        print(f"DEBUG - Password recibido: {'*' * len(password) if password else 'None'}")
        
        if not email:
            raise serializers.ValidationError({'email': 'Este campo es requerido.'})
        if not password:
            raise serializers.ValidationError({'password': 'Este campo es requerido.'})
        
        # Verificar si el usuario existe
        try:
            user_exists = CustomUser.objects.get(email=email)
            print(f"DEBUG - Usuario encontrado: {user_exists.email}")
        except CustomUser.DoesNotExist:
            print(f"DEBUG - Usuario no encontrado con email: {email}")
            raise serializers.ValidationError({'email': 'No existe un usuario con este email.'})
        
        # Intentar autenticar
        user = authenticate(request=self.context.get('request'), username=email, password=password)
        print(f"DEBUG - Resultado de authenticate: {user}")
        
        if user:
            if not user.is_active:
                raise serializers.ValidationError({'non_field_errors': 'Usuario inactivo.'})
            data['user'] = user
            return data
        else:
            raise serializers.ValidationError({'password': 'Contraseña incorrecta.'})

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'description']

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image_url', 'alt_text', 'is_primary', 'order']

class ProductSpecificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductSpecification
        fields = ['id', 'name', 'value', 'order']

class ReviewSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    user_name = serializers.SerializerMethodField()
    can_edit = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = ['id', 'user', 'user_name', 'rating', 'title', 'comment', 
                 'verified_purchase', 'helpful_count', 'created_at', 'updated_at', 'can_edit']
        read_only_fields = ['user', 'created_at', 'updated_at', 'helpful_count', 'verified_purchase']
    
    def get_user_name(self, obj):
        return f"{obj.user.first_name} {obj.user.last_name}".strip() or obj.user.email
    
    def get_can_edit(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.user == request.user
        return False

class ProductSerializer(serializers.ModelSerializer):
    category = CategorySerializer(read_only=True)
    category_id = serializers.IntegerField(write_only=True)
    images = ProductImageSerializer(many=True, required=False)
    specifications = ProductSpecificationSerializer(many=True, read_only=True)
    reviews = ReviewSerializer(many=True, read_only=True)
    
    # Campos anotados desde la base de datos (más eficientes)
    avg_rating = serializers.FloatField(read_only=True)
    total_reviews = serializers.IntegerField(read_only=True)
    
    # Propiedades del modelo (para compatibilidad)
    average_rating = serializers.ReadOnlyField()
    review_count = serializers.ReadOnlyField()
    
    primary_image = serializers.CharField(read_only=True)
    price = serializers.DecimalField(max_digits=10, decimal_places=2, coerce_to_string=False)
    price_clp = serializers.SerializerMethodField()
    
    # Campos de promociones
    has_promotion = serializers.SerializerMethodField()
    promotion = serializers.SerializerMethodField()
    discounted_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'description', 'price', 'price_clp',
            'stock', 'category', 'category_id', 'images', 'specifications',
            'reviews', 'avg_rating', 'total_reviews', 'average_rating', 'review_count', 
            'primary_image', 'featured', 'brand', 'model', 'warranty_months',
            'created_at', 'updated_at', 'has_promotion', 'promotion', 'discounted_price'
        ]
        read_only_fields = ['created_at', 'updated_at', 'price_clp', 'has_promotion', 'promotion', 'discounted_price']
    
    def get_price_clp(self, obj):
        return obj.get_price_clp
    
    def get_has_promotion(self, obj):
        from promotions.models import Promotion
        from django.utils import timezone
        
        active_promotions = Promotion.objects.filter(
            status='active',
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        ).filter(
            Q(applicable_products=obj) | Q(applicable_categories=obj.category)
        )
        
        return active_promotions.exists()
    
    def get_promotion(self, obj):
        from promotions.models import Promotion
        from django.utils import timezone
        
        active_promotion = Promotion.objects.filter(
            status='active',
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        ).filter(
            Q(applicable_products=obj) | Q(applicable_categories=obj.category)
        ).first()
        
        if active_promotion:
            return {
                'id': active_promotion.id,
                'name': active_promotion.name,
                'promotion_type': active_promotion.promotion_type,
                'discount_percentage': active_promotion.discount_percentage,
                'discount_amount': active_promotion.discount_amount
            }
        return None
    
    def get_discounted_price(self, obj):
        from promotions.models import Promotion
        from django.utils import timezone
        
        active_promotion = Promotion.objects.filter(
            status='active',
            start_date__lte=timezone.now(),
            end_date__gte=timezone.now()
        ).filter(
            Q(applicable_products=obj) | Q(applicable_categories=obj.category)
        ).first()
        
        if active_promotion:
            if active_promotion.promotion_type == 'percentage':
                discount = float(obj.price) * (float(active_promotion.discount_percentage) / 100)
                return float(obj.price) - discount
            elif active_promotion.promotion_type == 'fixed_amount':
                return max(0, float(obj.price) - float(active_promotion.discount_amount))
        
        return None
    
    def create(self, validated_data):
        images_data = validated_data.pop('images', [])
        
        # Obtener la categoría por ID
        category_id = validated_data.pop('category_id')
        category = Category.objects.get(id=category_id)
        validated_data['category'] = category
        
        product = Product.objects.create(**validated_data)
        
        # Crear imágenes
        for image_data in images_data:
            ProductImage.objects.create(product=product, **image_data)
        
        return product
    
    def update(self, instance, validated_data):
        images_data = validated_data.pop('images', [])
        
        # Actualizar categoría si se proporciona
        if 'category_id' in validated_data:
            category_id = validated_data.pop('category_id')
            category = Category.objects.get(id=category_id)
            validated_data['category'] = category
        
        # Actualizar campos del producto
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Actualizar imágenes (eliminar existentes y crear nuevas)
        if images_data is not None:
            instance.images.all().delete()
            for image_data in images_data:
                ProductImage.objects.create(product=instance, **image_data)
        
        return instance

class CartItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    product_id = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(), 
        write_only=True,
        source='product'
    )
    
    class Meta:
        model = CartItem
        fields = ['id', 'product', 'product_id', 'quantity', 'subtotal']
        read_only_fields = ['subtotal']

class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    
    class Meta:
        model = Cart
        fields = ['id', 'items', 'total', 'created_at', 'updated_at']
        read_only_fields = ['total', 'created_at', 'updated_at']

class OrderItemSerializer(serializers.ModelSerializer):
    product = ProductSerializer(read_only=True)
    
    class Meta:
        model = OrderItem
        fields = ['id', 'product', 'quantity', 'price', 'subtotal']
        read_only_fields = ['price', 'subtotal']

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)
    
    class Meta:
        model = Order
        fields = [
            'id', 'user', 'status', 'created_at', 'paid_at', 'total',
            'shipping_address', 'shipping_city', 'shipping_state', 'shipping_zip',
            'shipping_phone', 'payment_id', 'transaction_id', 'payment_method',
            'payment_status', 'delivery_method', 'items'
        ]
        read_only_fields = ['total', 'created_at']
class ReportTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ReportType
        fields = ['id', 'name', 'description', 'is_active']

class ReportSerializer(serializers.ModelSerializer):
    report_type_name = serializers.CharField(source='report_type.name', read_only=True)
    generated_by_name = serializers.CharField(source='generated_by.get_full_name', read_only=True)
    
    class Meta:
        model = Report
        fields = [
            'id', 'report_type', 'report_type_name', 'title', 'description',
            'date_from', 'date_to', 'generated_by', 'generated_by_name',
            'generated_at', 'status', 'file_path', 'data'
        ]
        read_only_fields = ['generated_at', 'file_path']
    
    def validate(self, data):
        """Validaciones básicas para reportes"""
        # Validar fechas si ambas están presentes
        date_from = data.get('date_from')
        date_to = data.get('date_to')
        
        if date_from and date_to and date_from > date_to:
            raise serializers.ValidationError("La fecha de inicio no puede ser posterior a la fecha de fin.")
        
        return data

class ReturnItemSerializer(serializers.ModelSerializer):
    product_name = serializers.CharField(source='product.name', read_only=True)
    
    class Meta:
        model = ReturnItem
        fields = [
            'id', 'product', 'product_name', 'quantity', 'reason',
            'condition_notes', 'unit_price', 'refund_amount'
        ]

class ReturnSerializer(serializers.ModelSerializer):
    items = ReturnItemSerializer(many=True, read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    order_number = serializers.CharField(source='order.order_number', read_only=True)
    processed_by_name = serializers.CharField(source='processed_by.get_full_name', read_only=True)
    
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
    
    def validate(self, data):
        """Validaciones básicas"""
        # Solo validar si ambos campos están presentes
        order = data.get('order')
        customer = data.get('customer')
        
        if order and customer:
            # Verificar que la orden pertenece al cliente
            try:
                if hasattr(order, 'user') and order.user != customer:
                    raise serializers.ValidationError("La orden no pertenece al cliente especificado.")
            except AttributeError:
                # Si no tiene el atributo user, continuar sin validar
                pass
        
        return data
class PromotionSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.get_full_name', read_only=True)
    is_active_now = serializers.SerializerMethodField()
    
    class Meta:
        model = Promotion
        fields = [
            'id', 'name', 'description', 'promotion_type', 'status',
            'discount_percentage', 'discount_amount', 'buy_quantity', 'get_quantity',
            'start_date', 'end_date', 'usage_limit', 'usage_limit_per_customer',
            'current_usage', 'minimum_order_amount', 'minimum_quantity',
            'applicable_products', 'applicable_categories',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'is_active_now'
        ]
        read_only_fields = ['created_by', 'current_usage']
    
    def get_is_active_now(self, obj):
        return obj.is_active()

class CouponSerializer(serializers.ModelSerializer):
    promotion_name = serializers.CharField(source='promotion.name', read_only=True)
    is_valid_now = serializers.SerializerMethodField()
    
    class Meta:
        model = Coupon
        fields = [
            'id', 'code', 'promotion', 'promotion_name', 'status',
            'usage_limit', 'current_usage', 'start_date', 'end_date',
            'assigned_to', 'created_at', 'is_valid_now'
        ]
    
    def get_is_valid_now(self, obj):
        return obj.is_valid()

class PromotionUsageSerializer(serializers.ModelSerializer):
    promotion_name = serializers.CharField(source='promotion.name', read_only=True)
    customer_name = serializers.CharField(source='customer.get_full_name', read_only=True)
    
    class Meta:
        model = PromotionUsage
        fields = [
            'id', 'promotion', 'promotion_name', 'customer', 'customer_name',
            'order', 'coupon', 'discount_amount', 'used_at'
        ]

class InvoiceItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = InvoiceItem
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    items = InvoiceItemSerializer(many=True, read_only=True)
    customer = UserSerializer(read_only=True)
    invoice_type_display = serializers.CharField(source='get_invoice_type_display', read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    
    class Meta:
        model = Invoice
        fields = '__all__'
        read_only_fields = ('invoice_number', 'created_at', 'updated_at')