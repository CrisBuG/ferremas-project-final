from django.db import models
from django.contrib.auth import get_user_model
from orders.models import Order, OrderItem
from products.models import Product
from django.utils import timezone

User = get_user_model()

class Return(models.Model):
    STATUS_CHOICES = (
        ('solicitada', 'Solicitada'),
        ('aprobada', 'Aprobada'),
        ('rechazada', 'Rechazada'),
        ('procesando', 'Procesando'),
        ('completada', 'Completada'),
    )
    
    REASON_CHOICES = (
        ('defectuoso', 'Producto Defectuoso'),
        ('incorrecto', 'Producto Incorrecto'),
        ('dañado', 'Producto Dañado en Envío'),
        ('no_satisfecho', 'No Satisfecho'),
        ('otro', 'Otro'),
    )
    
    return_number = models.CharField(max_length=20, unique=True)
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='returns')
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    reason = models.CharField(max_length=20, choices=REASON_CHOICES)
    description = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='solicitada')
    
    # Fechas
    requested_at = models.DateTimeField(auto_now_add=True)
    approved_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    # Información de procesamiento
    processed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='processed_returns'
    )
    admin_notes = models.TextField(blank=True)
    
    # Información de reembolso
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    refund_processed = models.BooleanField(default=False)
    
    def save(self, *args, **kwargs):
        if not self.return_number:
            self.return_number = f"RET-{timezone.now().strftime('%Y%m%d')}-{self.pk or '000'}"
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Devolución {self.return_number} - {self.order.order_number}"
    
    def approve(self, processed_by):
        self.status = 'aprobada'
        self.approved_at = timezone.now()
        self.processed_by = processed_by
        self.save()
    
    def complete(self):
        self.status = 'completada'
        self.completed_at = timezone.now()
        self.save()
        
        # Restaurar stock de productos devueltos
        for item in self.items.all():
            item.product.stock += item.quantity
            item.product.save()
    
    class Meta:
        verbose_name = 'Devolución'
        verbose_name_plural = 'Devoluciones'
        ordering = ['-requested_at']

class ReturnItem(models.Model):
    return_request = models.ForeignKey(Return, on_delete=models.CASCADE, related_name='items')
    order_item = models.ForeignKey(OrderItem, on_delete=models.CASCADE)
    product = models.ForeignKey(Product, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    reason = models.CharField(max_length=20, choices=Return.REASON_CHOICES)
    condition_notes = models.TextField(blank=True)
    
    # Información de reembolso por item
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    refund_amount = models.DecimalField(max_digits=10, decimal_places=2)
    
    def save(self, *args, **kwargs):
        if not self.unit_price:
            self.unit_price = self.order_item.price
        if not self.refund_amount:
            self.refund_amount = self.unit_price * self.quantity
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.quantity}x {self.product.name}"
    
    class Meta:
        verbose_name = 'Item de Devolución'
        verbose_name_plural = 'Items de Devolución'