from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.template.loader import get_template
from datetime import datetime, timedelta
from decimal import Decimal
from .models import Invoice, InvoiceItem
from .serializers import InvoiceSerializer, InvoiceItemSerializer
from orders.models import Order
from io import BytesIO

class InvoiceViewSet(viewsets.ModelViewSet):
    serializer_class = InvoiceSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        if self.request.user.role in ['admin', 'contador']:
            return Invoice.objects.all()
        return Invoice.objects.filter(customer=self.request.user)
    
    @action(detail=False, methods=['post'])
    def create_from_order(self, request):
        """Crear factura desde una orden"""
        order_id = request.data.get('order_id')
        invoice_type = request.data.get('invoice_type', 'boleta')
        
        try:
            order = get_object_or_404(Order, id=order_id)
            
            # Verificar si ya existe una factura para esta orden
            if hasattr(order, 'invoice'):
                return Response(
                    {'error': 'Esta orden ya tiene una factura asociada'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Calcular totales
            subtotal = order.total
            tax_rate = Decimal('0.19')  # IVA 19%
            tax_amount = subtotal * tax_rate if invoice_type == 'factura' else Decimal('0')
            total_amount = subtotal + tax_amount
            
            # Crear factura
            invoice = Invoice.objects.create(
                invoice_type=invoice_type,
                order=order,
                customer=order.user,
                due_date=datetime.now() + timedelta(days=30),
                subtotal=subtotal,
                tax_amount=tax_amount,
                total_amount=total_amount
            )
            
            # Crear items de factura
            for order_item in order.items.all():
                InvoiceItem.objects.create(
                    invoice=invoice,
                    product_name=order_item.product.name,
                    quantity=order_item.quantity,
                    unit_price=order_item.product.price,
                    total_price=order_item.subtotal
                )
            
            serializer = self.get_serializer(invoice)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Order.DoesNotExist:
            return Response(
                {'error': 'Orden no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['get'])
    def download_pdf(self, request, pk=None):
        """Descargar factura en PDF"""
        invoice = self.get_object()
        try:
            from reportlab.pdfgen import canvas
            from reportlab.lib.pagesizes import letter
        except ImportError as e:
            return Response({
                'error': 'Generación de PDF no disponible: dependencia reportlab/Pillow no está instalada correctamente',
                'detail': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        # Crear PDF
        buffer = BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        
        # Encabezado
        p.setFont("Helvetica-Bold", 16)
        p.drawString(100, 750, f"FERREMAS - {invoice.get_invoice_type_display().upper()}")
        p.setFont("Helvetica", 12)
        p.drawString(100, 730, f"Número: {invoice.invoice_number}")
        p.drawString(100, 710, f"Fecha: {invoice.issue_date.strftime('%d/%m/%Y')}")
        
        # Datos del cliente
        p.drawString(100, 680, "DATOS DEL CLIENTE:")
        p.drawString(100, 660, f"Nombre: {invoice.customer.first_name} {invoice.customer.last_name}")
        p.drawString(100, 640, f"Email: {invoice.customer.email}")
        
        # Items
        y_position = 600
        p.drawString(100, y_position, "DETALLE:")
        y_position -= 20
        
        p.drawString(100, y_position, "Producto")
        p.drawString(300, y_position, "Cantidad")
        p.drawString(400, y_position, "Precio Unit.")
        p.drawString(500, y_position, "Total")
        y_position -= 20
        
        for item in invoice.items.all():
            p.drawString(100, y_position, item.product_name[:30])
            p.drawString(300, y_position, str(item.quantity))
            p.drawString(400, y_position, f"${item.unit_price}")
            p.drawString(500, y_position, f"${item.total_price}")
            y_position -= 20
        
        # Totales
        y_position -= 20
        p.drawString(400, y_position, f"Subtotal: ${invoice.subtotal}")
        if invoice.tax_amount > 0:
            y_position -= 20
            p.drawString(400, y_position, f"IVA (19%): ${invoice.tax_amount}")
        y_position -= 20
        p.setFont("Helvetica-Bold", 12)
        p.drawString(400, y_position, f"TOTAL: ${invoice.total_amount}")
        
        p.showPage()
        p.save()
        
        buffer.seek(0)
        response = HttpResponse(buffer, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{invoice.invoice_number}.pdf"'
        return response
    
    @action(detail=True, methods=['patch'])
    def mark_as_paid(self, request, pk=None):
        """Marcar factura como pagada"""
        invoice = self.get_object()
        invoice.status = 'pagada'
        invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)
    
    @action(detail=True, methods=['patch'])
    def cancel_invoice(self, request, pk=None):
        """Anular factura"""
        invoice = self.get_object()
        invoice.status = 'anulada'
        invoice.save()
        
        serializer = self.get_serializer(invoice)
        return Response(serializer.data)