from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product, Category
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

User = get_user_model()

class Promotion(models.Model):
    TYPE_CHOICES = (
        ('percentage', 'Porcentaje'),
        ('fixed_amount', 'Monto Fijo'),
        ('buy_x_get_y', 'Compra X Lleva Y'),
        ('free_shipping', 'Envío Gratis'),
    )
    
    STATUS_CHOICES = (
        ('draft', 'Borrador'),
        ('active', 'Activa'),
        ('paused', 'Pausada'),
        ('expired', 'Expirada'),
    )
    
    name = models.CharField(max_length=200)
    description = models.TextField()
    promotion_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Configuración de descuento
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    discount_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True,
        validators=[MinValueValidator(0)]
    )
    
    # Para promociones "Compra X Lleva Y"
    buy_quantity = models.PositiveIntegerField(null=True, blank=True)
    get_quantity = models.PositiveIntegerField(null=True, blank=True)
    
    # Fechas de validez
    start_date = models.DateTimeField()
    end_date = models.DateTimeField()
    
    # Límites de uso
    usage_limit = models.PositiveIntegerField(null=True, blank=True)
    usage_limit_per_customer = models.PositiveIntegerField(null=True, blank=True)
    current_usage = models.PositiveIntegerField(default=0)
    
    # Condiciones mínimas
    minimum_order_amount = models.DecimalField(
        max_digits=10, decimal_places=2, null=True, blank=True
    )
    minimum_quantity = models.PositiveIntegerField(null=True, blank=True)
    
    # Productos y categorías aplicables
    applicable_products = models.ManyToManyField(Product, blank=True)
    applicable_categories = models.ManyToManyField(Category, blank=True)
    
    # Metadatos
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name
    
    def is_active(self):
        now = timezone.now()
        return (
            self.status == 'active' and
            self.start_date <= now <= self.end_date and
            (self.usage_limit is None or self.current_usage < self.usage_limit)
        )
    
    def can_be_used_by_customer(self, customer):
        if not self.is_active():
            return False
        
        if self.usage_limit_per_customer:
            customer_usage = PromotionUsage.objects.filter(
                promotion=self,
                customer=customer
            ).count()
            return customer_usage < self.usage_limit_per_customer
        
        return True
    
    def calculate_discount(self, order_total, quantity=1):
        if not self.is_active():
            return 0
        
        if self.minimum_order_amount and order_total < self.minimum_order_amount:
            return 0
        
        if self.minimum_quantity and quantity < self.minimum_quantity:
            return 0
        
        if self.promotion_type == 'percentage':
            return order_total * (self.discount_percentage / 100)
        elif self.promotion_type == 'fixed_amount':
            return min(self.discount_amount, order_total)
        
        return 0
    
    class Meta:
        verbose_name = 'Promoción'
        verbose_name_plural = 'Promociones'
        ordering = ['-created_at']

class Coupon(models.Model):
    STATUS_CHOICES = (
        ('active', 'Activo'),
        ('used', 'Usado'),
        ('expired', 'Expirado'),
        ('disabled', 'Deshabilitado'),
    )
    
    code = models.CharField(max_length=50, unique=True)
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE, related_name='coupons')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    
    # Límites específicos del cupón
    usage_limit = models.PositiveIntegerField(default=1)
    current_usage = models.PositiveIntegerField(default=0)
    
    # Fechas específicas (opcional, hereda de la promoción si no se especifica)
    start_date = models.DateTimeField(null=True, blank=True)
    end_date = models.DateTimeField(null=True, blank=True)
    
    # Cliente específico (opcional)
    assigned_to = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.code} - {self.promotion.name}"
    
    def is_valid(self, customer=None):
        now = timezone.now()
        
        # Verificar estado
        if self.status != 'active':
            return False
        
        # Verificar límite de uso
        if self.current_usage >= self.usage_limit:
            return False
        
        # Verificar fechas específicas del cupón
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        
        # Verificar asignación específica
        if self.assigned_to and customer != self.assigned_to:
            return False
        
        # Verificar promoción asociada
        return self.promotion.is_active()
    
    def use(self):
        self.current_usage += 1
        if self.current_usage >= self.usage_limit:
            self.status = 'used'
        self.save()
    
    class Meta:
        verbose_name = 'Cupón'
        verbose_name_plural = 'Cupones'

class PromotionUsage(models.Model):
    promotion = models.ForeignKey(Promotion, on_delete=models.CASCADE)
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    order = models.ForeignKey('orders.Order', on_delete=models.CASCADE, null=True, blank=True)
    coupon = models.ForeignKey(Coupon, on_delete=models.CASCADE, null=True, blank=True)
    
    discount_amount = models.DecimalField(max_digits=10, decimal_places=2)
    used_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.customer.email} - {self.promotion.name}"
    
    class Meta:
        verbose_name = 'Uso de Promoción'
        verbose_name_plural = 'Usos de Promociones'