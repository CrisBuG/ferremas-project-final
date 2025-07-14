from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Avg, Q
from django.utils import timezone
from datetime import datetime, timedelta
from .models import Report, ReportType
from .serializers import ReportSerializer, ReportTypeSerializer
from orders.models import Order, OrderItem
from products.models import Product
from users.models import CustomUser

class ReportTypeViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ReportType.objects.filter(is_active=True)
    serializer_class = ReportTypeSerializer
    permission_classes = [IsAuthenticated]

class ReportViewSet(viewsets.ModelViewSet):
    serializer_class = ReportSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if hasattr(user, 'role') and user.role in ['admin', 'contador']:
            return Report.objects.all()
        return Report.objects.filter(generated_by=user)
    
    def perform_create(self, serializer):
        # Solo establecer generated_by si no viene en los datos
        if 'generated_by' not in serializer.validated_data:
            serializer.save(generated_by=self.request.user)
        else:
            serializer.save()
    
    @action(detail=False, methods=['post'])
    def generate_sales_report(self, request):
        """Generar reporte de ventas"""
        date_from = request.data.get('date_from')
        date_to = request.data.get('date_to')
        
        if not date_from or not date_to:
            return Response(
                {'error': 'Fechas requeridas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            # Crear reporte
            report_type = ReportType.objects.get(name='ventas')
            report = Report.objects.create(
                report_type=report_type,
                generated_by=request.user,
                title=f'Reporte de Ventas {date_from} - {date_to}',
                date_from=date_from,
                date_to=date_to
            )
            
            # Generar datos
            orders = Order.objects.filter(
                created_at__date__range=[date_from, date_to],
                status='completado'
            )
            
            total_sales = orders.aggregate(total=Sum('total'))['total'] or 0
            total_orders = orders.count()
            
            # Ventas por día
            daily_sales = orders.extra(
                select={'day': 'date(created_at)'}
            ).values('day').annotate(
                total=Sum('total'),
                orders=Count('id')
            ).order_by('day')
            
            # Productos más vendidos
            top_products = OrderItem.objects.filter(
                order__in=orders
            ).values(
                'product__name'
            ).annotate(
                quantity_sold=Sum('quantity'),
                revenue=Sum('subtotal')
            ).order_by('-quantity_sold')[:10]
            
            report.data = {
                'total_sales': float(total_sales),
                'total_orders': total_orders,
                'average_order': float(total_sales / total_orders) if total_orders > 0 else 0,
                'daily_sales': list(daily_sales),
                'top_products': list(top_products)
            }
            report.total_records = total_orders
            report.mark_completed()
            
            return Response(ReportSerializer(report).data)
            
        except ReportType.DoesNotExist:
            return Response(
                {'error': 'Tipo de reporte no encontrado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error generando reporte: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def generate_inventory_report(self, request):
        """Generar reporte de inventario"""
        try:
            report_type = ReportType.objects.get(name='inventario')
            report = Report.objects.create(
                report_type=report_type,
                generated_by=request.user,
                title=f'Reporte de Inventario {timezone.now().date()}',
                date_from=timezone.now().date(),
                date_to=timezone.now().date()
            )
            
            products = Product.objects.all()
            
            # Productos con stock bajo (menos de 10)
            low_stock = products.filter(stock__lt=10)
            
            # Productos sin stock
            out_of_stock = products.filter(stock=0)
            
            # Valor total del inventario
            total_inventory_value = sum(
                product.price * product.stock for product in products
            )
            
            # Productos por categoría
            by_category = products.values(
                'category__name'
            ).annotate(
                total_products=Count('id'),
                total_stock=Sum('stock')
            )
            
            report.data = {
                'total_products': products.count(),
                'low_stock_products': low_stock.count(),
                'out_of_stock_products': out_of_stock.count(),
                'total_inventory_value': float(total_inventory_value),
                'low_stock_list': list(low_stock.values('name', 'stock', 'price')),
                'out_of_stock_list': list(out_of_stock.values('name', 'price')),
                'by_category': list(by_category)
            }
            report.total_records = products.count()
            report.mark_completed()
            
            return Response(ReportSerializer(report).data)
            
        except ReportType.DoesNotExist:
            return Response(
                {'error': 'Tipo de reporte no encontrado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error generando reporte: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['post'])
    def generate_financial_report(self, request):
        """Generar reporte financiero"""
        date_from = request.data.get('date_from')
        date_to = request.data.get('date_to')
        
        if not date_from or not date_to:
            return Response(
                {'error': 'Fechas requeridas'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            report_type = ReportType.objects.get(name='financiero')
            report = Report.objects.create(
                report_type=report_type,
                generated_by=request.user,
                title=f'Reporte Financiero {date_from} - {date_to}',
                date_from=date_from,
                date_to=date_to
            )
            
            orders = Order.objects.filter(
                created_at__date__range=[date_from, date_to],
                status='completado'
            )
            
            total_revenue = orders.aggregate(total=Sum('total'))['total'] or 0
            total_orders = orders.count()
            
            # Ingresos por mes
            monthly_revenue = orders.extra(
                select={'month': 'strftime("%Y-%m", created_at)'}
            ).values('month').annotate(
                revenue=Sum('total'),
                orders=Count('id')
            ).order_by('month')
            
            report.data = {
                'total_revenue': float(total_revenue),
                'total_orders': total_orders,
                'average_order_value': float(total_revenue / total_orders) if total_orders > 0 else 0,
                'monthly_revenue': list(monthly_revenue)
            }
            report.total_records = total_orders
            report.mark_completed()
            
            return Response(ReportSerializer(report).data)
            
        except ReportType.DoesNotExist:
            return Response(
                {'error': 'Tipo de reporte no encontrado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': f'Error generando reporte: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )