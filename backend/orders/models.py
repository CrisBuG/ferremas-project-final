from django.db import models
from users.models import CustomUser
from products.models import Product

class Cart(models.Model):
    """
    Modelo para el carrito de compras
    """
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, related_name='orders_cart')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Carrito de {self.user.email}"
    
    @property
    def total(self):
        return sum(item.subtotal for item in self.items.all())
    
    class Meta:
        verbose_name = 'Carrito'
        verbose_name_plural = 'Carritos'

class CartItem(models.Model):
    """
    Modelo para los items del carrito de compras
    """
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='orders_cart_items')
    quantity = models.PositiveIntegerField(default=1)
    added_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
    
    @property
    def subtotal(self):
        return self.product.price * self.quantity
    
    class Meta:
        verbose_name = 'Item de Carrito'
        verbose_name_plural = 'Items de Carrito'
        unique_together = ('cart', 'product')

class Order(models.Model):
    """
    Modelo para órdenes de compra
    """
    STATUS_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('pagada', 'Pagada'),
        ('enviada', 'Enviada'),
        ('entregada', 'Entregada'),
        ('cancelada', 'Cancelada'),
    )
    
    PAYMENT_METHOD_CHOICES = (
        ('transbank', 'Transbank'),
        ('efectivo', 'Efectivo'),
        ('transferencia', 'Transferencia'),
    )
    
    PAYMENT_STATUS_CHOICES = (
        ('pendiente', 'Pendiente'),
        ('pagada', 'Pagada'),
        ('rechazada', 'Rechazada'),
        ('cancelada', 'Cancelada'),
    )
    
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='orders')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pendiente')
    created_at = models.DateTimeField(auto_now_add=True)
    paid_at = models.DateTimeField(null=True, blank=True)
    total = models.DecimalField(max_digits=10, decimal_places=2)
    
    # Información de envío
    shipping_address = models.TextField(blank=True, default='')
    shipping_city = models.CharField(max_length=100, blank=True, default='')
    shipping_state = models.CharField(max_length=100, blank=True, default='')
    shipping_zip = models.CharField(max_length=20, blank=True, default='')
    shipping_phone = models.CharField(max_length=20, blank=True, default='')
    
    # Información de pago
    payment_id = models.CharField(max_length=255, null=True, blank=True)
    transaction_id = models.CharField(max_length=255, null=True, blank=True)
    payment_token = models.CharField(max_length=255, null=True, blank=True)  # Agregar esta línea
    payment_method = models.CharField(max_length=20, choices=PAYMENT_METHOD_CHOICES, default='transbank')
    payment_status = models.CharField(max_length=20, choices=PAYMENT_STATUS_CHOICES, default='pendiente')
    
    DELIVERY_METHOD_CHOICES = (
        ('domicilio', 'Entrega a Domicilio'),
        ('retiro', 'Retiro en Tienda'),
    )
    
    # Agregar este campo después de payment_status
    delivery_method = models.CharField(
        max_length=20, 
        choices=DELIVERY_METHOD_CHOICES, 
        default='domicilio'
    )
    def __str__(self):
        return f"Orden #{self.id} - {self.user.email}"
    
    class Meta:
        verbose_name = 'Orden'
        verbose_name_plural = 'Órdenes'
        ordering = ['-created_at']

class OrderItem(models.Model):
    """
    Modelo para los items de una orden
    """
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField(default=1)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Precio al momento de la compra
    
    def __str__(self):
        return f"{self.quantity} x {self.product.name}"
    
    @property
    def subtotal(self):
        return self.price * self.quantity
    
    class Meta:
        verbose_name = 'Item de Orden'
        verbose_name_plural = 'Items de Orden'