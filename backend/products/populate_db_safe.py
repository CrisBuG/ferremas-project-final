import os
import django
import sys

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferremas_project.settings')
django.setup()

from products.models import Category, Product, ProductImage
from django.contrib.auth import get_user_model
from decimal import Decimal

User = get_user_model()

def create_sample_data():
    try:
        # Crear categorías
        categories_data = [
            {'name': 'Herramientas', 'slug': 'herramientas'},
            {'name': 'Eléctricos', 'slug': 'electricos'},
            {'name': 'Pinturas', 'slug': 'pinturas'},
            {'name': 'Fijaciones', 'slug': 'fijaciones'},
            {'name': 'Plomería', 'slug': 'plomeria'},
        ]
        
        categories = {}
        for cat_data in categories_data:
            try:
                category, created = Category.objects.get_or_create(
                    name=cat_data['name'],
                    defaults={'slug': cat_data['slug']}
                )
                categories[cat_data['name']] = category
                if created:
                    print(f"Categoría creada: {category.name}")
                else:
                    print(f"Categoría existente: {category.name}")
            except Exception as e:
                print(f"Error creando categoría {cat_data['name']}: {e}")
        
        # Crear productos
        products_data = [
            {
                'name': 'Martillo de Carpintero',
                'description': 'Martillo profesional para trabajos de carpintería.',
                'price': Decimal('12.99'),
                'price_clp': Decimal('12000.00'),  # Precio fijo en CLP
                'stock': 45,
                'category': 'Herramientas'
            },
            {
                'name': 'Destornillador Phillips',
                'description': 'Destornillador de precisión con punta Phillips.',
                'price': Decimal('8.50'),
                'price_clp': Decimal('8000.00'),
                'stock': 32,
                'category': 'Herramientas'
            },
            {
                'name': 'Taladro Eléctrico',
                'description': 'Taladro eléctrico de alta potencia para uso profesional.',
                'price': Decimal('89.99'),
                'price_clp': Decimal('85000.00'),
                'stock': 15,
                'category': 'Eléctricos'
            },
            {
                'name': 'Pintura Látex Blanca',
                'description': 'Pintura látex de alta calidad para interiores.',
                'price': Decimal('25.50'),
                'price_clp': Decimal('24000.00'),
                'stock': 28,
                'category': 'Pinturas'
            },
            {
                'name': 'Tornillos Autorroscantes',
                'description': 'Pack de 100 tornillos autorroscantes para madera.',
                'price': Decimal('15.75'),
                'price_clp': Decimal('15000.00'),
                'stock': 50,
                'category': 'Fijaciones'
            }
        ]
        
        for product_data in products_data:
            try:
                if product_data['category'] in categories:
                    product, created = Product.objects.get_or_create(
                        name=product_data['name'],
                        defaults={
                            'description': product_data['description'],
                            'price': product_data['price'],
                            'price_clp': product_data['price_clp'],
                            'stock': product_data['stock'],
                            'category': categories[product_data['category']]
                        }
                    )
                    
                    if created:
                        print(f"Producto creado: {product.name}")
                        
                        # Crear imagen placeholder
                        ProductImage.objects.get_or_create(
                            product=product,
                            defaults={
                                'image_url': f'https://via.placeholder.com/300x300?text={product.name.replace(" ", "+")}',
                                'alt_text': product.name,
                                'is_primary': True
                            }
                        )
                    else:
                        print(f"Producto existente: {product.name}")
                else:
                    print(f"Categoría no encontrada: {product_data['category']}")
            except Exception as e:
                print(f"Error creando producto {product_data['name']}: {e}")
        
        print(f"\n✅ Proceso completado!")
        print(f"📦 Categorías: {Category.objects.count()}")
        print(f"🛠️ Productos: {Product.objects.count()}")
        print(f"🖼️ Imágenes: {ProductImage.objects.count()}")
        
    except Exception as e:
        print(f"Error general: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    create_sample_data()