from django.core.management.base import BaseCommand
from promotions.models import Promotion, Coupon
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Crear cupón ferr20 con 20% de descuento'

    def handle(self, *args, **options):
        # Crear o obtener la promoción
        promotion, created = Promotion.objects.get_or_create(
            name='Descuento FERR20',
            defaults={
                'description': 'Descuento fijo del 20% con cupón FERR20',
                'promotion_type': 'percentage',
                'status': 'active',
                'discount_percentage': 20.00,
                'start_date': timezone.now(),
                'end_date': timezone.now() + timedelta(days=365),
                'created_by': User.objects.filter(is_superuser=True).first()
            }
        )
        
        # Crear el cupón
        coupon, created = Coupon.objects.get_or_create(
            code='FERR20',
            defaults={
                'promotion': promotion,
                'status': 'active',
                'usage_limit': 1000  # Límite alto para uso múltiple
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Cupón FERR20 creado exitosamente')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Cupón FERR20 ya existe')
            )