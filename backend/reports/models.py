from django.db import models
from django.contrib.auth import get_user_model
from products.models import Product
from orders.models import Order
from django.utils import timezone
from datetime import datetime, timedelta

User = get_user_model()

class ReportType(models.Model):
    REPORT_TYPES = (
        ('ventas', 'Reporte de Ventas'),
        ('inventario', 'Reporte de Inventario'),
        ('financiero', 'Reporte Financiero'),
        ('stock_bajo', 'Reporte de Stock Bajo'),
        ('productos_populares', 'Productos Más Vendidos'),
        ('clientes_frecuentes', 'Clientes Frecuentes'),
    )
    
    name = models.CharField(max_length=50, choices=REPORT_TYPES, unique=True)
    description = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.get_name_display()
    
    class Meta:
        verbose_name = 'Tipo de Reporte'
        verbose_name_plural = 'Tipos de Reportes'

class Report(models.Model):
    STATUS_CHOICES = (
        ('generando', 'Generando'),
        ('completado', 'Completado'),
        ('error', 'Error'),
    )
    
    report_type = models.ForeignKey(ReportType, on_delete=models.CASCADE)
    generated_by = models.ForeignKey(User, on_delete=models.CASCADE)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='generando')
    
    # Filtros de fecha
    date_from = models.DateField()
    date_to = models.DateField()
    
    # Datos del reporte en JSON
    data = models.JSONField(default=dict)
    
    # Metadatos
    total_records = models.PositiveIntegerField(default=0)
    file_path = models.CharField(max_length=500, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.title} - {self.created_at.strftime('%Y-%m-%d')}"
    
    def mark_completed(self):
        self.status = 'completado'
        self.completed_at = timezone.now()
        self.save()
    
    class Meta:
        verbose_name = 'Reporte'
        verbose_name_plural = 'Reportes'
        ordering = ['-created_at']



class ReportSchedule(models.Model):
    FREQUENCY_CHOICES = (
        ('daily', 'Diario'),
        ('weekly', 'Semanal'),
        ('monthly', 'Mensual'),
    )
    
    report_type = models.ForeignKey(ReportType, on_delete=models.CASCADE)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    frequency = models.CharField(max_length=20, choices=FREQUENCY_CHOICES)
    is_active = models.BooleanField(default=True)
    next_run = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.name} - {self.get_frequency_display()}"
    
    class Meta:
        verbose_name = 'Programación de Reporte'
        verbose_name_plural = 'Programaciones de Reportes'