import os
import django
import sys

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferremas_project.settings')
django.setup()

from products.models import Category, Product, ProductImage
from django.contrib.auth import get_user_model

User = get_user_model()

def create_sample_data():
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
        category, created = Category.objects.get_or_create(
            name=cat_data['name'],
            defaults={'slug': cat_data['slug']}
        )
        categories[cat_data['name']] = category
        if created:
            print(f"Categoría creada: {category.name}")
    
    # Crear productos
    products_data = [
        {
            'name': 'Martillo de Carpintero',
            'description': 'Martillo profesional para trabajos de carpintería con mango ergonómico y cabeza de acero.',
            'price': 12.99,
            'stock': 45,
            'category': 'Herramientas'
        },
        {
            'name': 'Destornillador Phillips',
            'description': 'Destornillador de precisión con punta Phillips y mango antideslizante para mayor comodidad.',
            'price': 8.50,
            'stock': 32,
            'category': 'Herramientas'
        },
        {
            'name': 'Sierra Circular',
            'description': 'Sierra circular eléctrica de alta potencia para cortes precisos en madera y materiales similares.',
            'price': 89.99,
            'stock': 15,
            'category': 'Eléctricos'
        },
        {
            'name': 'Taladro Inalámbrico',
            'description': 'Taladro inalámbrico con batería de litio, incluye set de brocas y maletín de transporte.',
            'price': 65.00,
            'stock': 28,
            'category': 'Eléctricos'
        },
        {
            'name': 'Pintura Látex Blanca',
            'description': 'Pintura látex de alta calidad, color blanco, rendimiento 12 m²/litro, secado rápido.',
            'price': 25.50,
            'stock': 60,
            'category': 'Pinturas'
        },
        {
            'name': 'Brocha 4 Pulgadas',
            'description': 'Brocha profesional de 4 pulgadas con cerdas sintéticas para aplicación uniforme de pintura.',
            'price': 15.75,
            'stock': 40,
            'category': 'Pinturas'
        },
        {
            'name': 'Tornillos Autorroscantes',
            'description': 'Set de 100 tornillos autorroscantes de acero inoxidable, ideales para madera y metal.',
            'price': 18.25,
            'stock': 75,
            'category': 'Fijaciones'
        },
        {
            'name': 'Clavos de Acero',
            'description': 'Clavos de acero galvanizado de 2.5 pulgadas, caja de 1 kg, resistentes a la corrosión.',
            'price': 12.00,
            'stock': 90,
            'category': 'Fijaciones'
        },
        {
            'name': 'Llave Inglesa Ajustable',
            'description': 'Llave inglesa ajustable de 10 pulgadas, acabado cromado, mandíbulas antideslizantes.',
            'price': 22.99,
            'stock': 35,
            'category': 'Herramientas'
        },
        {
            'name': 'Tubería PVC 1/2 Pulgada',
            'description': 'Tubería de PVC de 1/2 pulgada, longitud 3 metros, ideal para instalaciones de agua fría.',
            'price': 8.75,
            'stock': 120,
            'category': 'Plomería'
        }
    ]
    
    for product_data in products_data:
        category = categories[product_data['category']]
        product, created = Product.objects.get_or_create(
            name=product_data['name'],
            defaults={
                'description': product_data['description'],
                'price': product_data['price'],
                'stock': product_data['stock'],
                'category': category
            }
        )
        if created:
            print(f"Producto creado: {product.name} - ${product.price} USD")
            
            # Crear imagen placeholder para cada producto
            ProductImage.objects.get_or_create(
                product=product,
                defaults={
                    'image_url': f'https://via.placeholder.com/300x300?text={product.name.replace(" ", "+")}',
                    'alt_text': product.name,
                    'is_primary': True
                }
            )
    
    print(f"\n✅ Base de datos poblada exitosamente!")
    print(f"📦 Categorías: {Category.objects.count()}")
    print(f"🛠️ Productos: {Product.objects.count()}")

if __name__ == '__main__':
    create_sample_data()