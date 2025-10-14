from django.db import models
from django.contrib.auth import get_user_model
from orders.models import Order
from django.utils import timezone
from decimal import Decimal

User = get_user_model()

class Invoice(models.Model):
    STATUS_CHOICES = (
        ('draft', 'Borrador'),
        ('sent', 'Enviada'),
        ('paid', 'Pagada'),
        ('overdue', 'Vencida'),
        ('cancelled', 'Cancelada'),
    )
    
    TYPE_CHOICES = (
        ('factura', 'Factura'),
        ('boleta', 'Boleta'),
        ('nota_credito', 'Nota de Crédito'),
        ('nota_debito', 'Nota de Débito'),
    )
    
    # Información básica
    invoice_number = models.CharField(max_length=20, unique=True)
    invoice_type = models.CharField(max_length=20, choices=TYPE_CHOICES, default='boleta')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    
    # Relaciones
    order = models.OneToOneField(Order, on_delete=models.CASCADE, related_name='invoice')
    customer = models.ForeignKey(User, on_delete=models.CASCADE)
    
    # Fechas
    issue_date = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()
    paid_date = models.DateTimeField(null=True, blank=True)
    
    # Información fiscal del cliente
    customer_name = models.CharField(max_length=200)
    customer_email = models.EmailField()
    customer_rut = models.CharField(max_length=12, blank=True)
    customer_address = models.TextField()
    customer_phone = models.CharField(max_length=20, blank=True)
    
    # Información de la empresa
    company_name = models.CharField(max_length=200, default='Ferremas')
    company_rut = models.CharField(max_length=12, default='12.345.678-9')
    company_address = models.TextField(default='Dirección de la empresa')
    company_phone = models.CharField(max_length=20, default='+56 9 1234 5678')
    
    # Montos
    subtotal = models.DecimalField(max_digits=12, decimal_places=2)
    tax_rate = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('19.00'))  # IVA 19%
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2)
    discount_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Información adicional
    notes = models.TextField(blank=True)
    terms_conditions = models.TextField(blank=True)
    
    # Metadatos
    created_by = models.ForeignKey(
        User, on_delete=models.CASCADE, 
        related_name='created_invoices'
    )
    updated_at = models.DateTimeField(auto_now=True)
    
    def save(self, *args, **kwargs):
        if not self.invoice_number:
            # Generar número de factura
            prefix = 'F' if self.invoice_type == 'factura' else 'B'
            count = Invoice.objects.filter(invoice_type=self.invoice_type).count() + 1
            self.invoice_number = f"{prefix}-{timezone.now().year}-{count:06d}"
        
        # Calcular montos
        if not self.subtotal:
            self.subtotal = self.order.total
        
        self.tax_amount = (self.subtotal - self.discount_amount) * (self.tax_rate / 100)
        self.total_amount = self.subtotal - self.discount_amount + self.tax_amount
        
        # Establecer fecha de vencimiento si no está definida
        if not self.due_date:
            self.due_date = timezone.now() + timezone.timedelta(days=30)
        
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.invoice_number} - {self.customer_name}"
    
    def mark_as_paid(self):
        self.status = 'paid'
        self.paid_date = timezone.now()
        self.save()
    
    def is_overdue(self):
        return self.status in ['sent'] and timezone.now() > self.due_date
    
    class Meta:
        verbose_name = 'Factura'
        verbose_name_plural = 'Facturas'
        ordering = ['-issue_date']

class InvoiceItem(models.Model):
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='items')
    product_name = models.CharField(max_length=200)
    product_sku = models.CharField(max_length=50, blank=True)
    description = models.TextField(blank=True)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    total_price = models.DecimalField(max_digits=12, decimal_places=2)
    
    def save(self, *args, **kwargs):
        self.total_price = self.quantity * self.unit_price
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.quantity}x {self.product_name}"
    
    class Meta:
        verbose_name = 'Item de Factura'
        verbose_name_plural = 'Items de Factura'

class Payment(models.Model):
    METHOD_CHOICES = (
        ('efectivo', 'Efectivo'),
        ('tarjeta_credito', 'Tarjeta de Crédito'),
        ('tarjeta_debito', 'Tarjeta de Débito'),
        ('transferencia', 'Transferencia Bancaria'),
        ('cheque', 'Cheque'),
        ('webpay', 'WebPay'),
    )
    
    STATUS_CHOICES = (
        ('pending', 'Pendiente'),
        ('completed', 'Completado'),
        ('failed', 'Fallido'),
        ('refunded', 'Reembolsado'),
    )
    
    invoice = models.ForeignKey(Invoice, on_delete=models.CASCADE, related_name='payments')
    payment_method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    
    # Información de transacción
    transaction_id = models.CharField(max_length=100, blank=True)
    reference_number = models.CharField(max_length=100, blank=True)
    
    # Fechas
    payment_date = models.DateTimeField(auto_now_add=True)
    processed_date = models.DateTimeField(null=True, blank=True)
    
    # Información adicional
    notes = models.TextField(blank=True)
    processed_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )
    
    def __str__(self):
        return f"Pago {self.invoice.invoice_number} - ${self.amount}"
    
    def mark_completed(self):
        self.status = 'completed'
        self.processed_date = timezone.now()
        self.save()
        
        # Verificar si la factura está completamente pagada
        total_paid = self.invoice.payments.filter(
            status='completed'
        ).aggregate(total=models.Sum('amount'))['total'] or 0
        
        if total_paid >= self.invoice.total_amount:
            self.invoice.mark_as_paid()
    
    class Meta:
        verbose_name = 'Pago'
        verbose_name_plural = 'Pagos'
        ordering = ['-payment_date']

class TaxConfiguration(models.Model):
    name = models.CharField(max_length=100)
    rate = models.DecimalField(max_digits=5, decimal_places=2)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.rate}%"
    
    class Meta:
        verbose_name = 'Configuración de Impuesto'
        verbose_name_plural = 'Configuraciones de Impuestos'