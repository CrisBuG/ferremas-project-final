from django.db import models
from django.utils.text import slugify
from django.core.validators import MinValueValidator, MaxValueValidator
import base64
import uuid
import os

class Category(models.Model):
    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "Categoría"
        verbose_name_plural = "Categorías"

class Product(models.Model):
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    price_clp = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    stock = models.PositiveIntegerField(default=0)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # Nuevos campos para mejor funcionalidad
    featured = models.BooleanField(default=False)
    brand = models.CharField(max_length=100, blank=True)
    model = models.CharField(max_length=100, blank=True)
    warranty_months = models.PositiveIntegerField(default=12)
    
    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        
        # Actualizar precio en CLP si no está establecido
        if not self.price_clp:
            try:
                import json
                import os
                file_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'dollar_rate.json')
                with open(file_path, 'r') as f:
                    dollar_data = json.load(f)
                    if dollar_data.get('success', False):
                        self.price_clp = float(self.price) * float(dollar_data['rate'])
                    else:
                        self.price_clp = float(self.price) * 850.0
            except Exception as e:
                self.price_clp = float(self.price) * 850.0
                
        super().save(*args, **kwargs)
    
    def __str__(self):
        return self.name
    
    @property
    def average_rating(self):
        reviews = self.reviews.all()
        if reviews:
            return round(sum(review.rating for review in reviews) / len(reviews), 1)
        return 0
    
    @property
    def review_count(self):
        return self.reviews.count()
    
    @property
    def primary_image(self):
        primary = self.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url
        first_image = self.images.first()
        return first_image.image_url if first_image else 'https://via.placeholder.com/400x400?text=Sin+Imagen'
    
    @property
    def get_price_clp(self):
        if self.price_clp:
            return self.price_clp
        
        try:
            import json
            with open('dollar_rate.json', 'r') as f:
                dollar_data = json.load(f)
                if dollar_data['success']:
                    return float(self.price) * float(dollar_data['rate'])
        except Exception as e:
            pass
            
        # Valor por defecto si no hay datos
        return float(self.price) * 850.0
    
    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"

class ProductImage(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='images')
    image_url = models.URLField(max_length=500)
    alt_text = models.CharField(max_length=100, blank=True)
    is_primary = models.BooleanField(default=False)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'id']
    
    def save(self, *args, **kwargs):
        if self.is_primary:
            # Asegurar que solo una imagen sea primaria por producto
            ProductImage.objects.filter(product=self.product, is_primary=True).update(is_primary=False)
        super().save(*args, **kwargs)
    
    def __str__(self):
        return f"Image for {self.product.name}"

class ProductSpecification(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='specifications')
    name = models.CharField(max_length=100)
    value = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)
    
    class Meta:
        ordering = ['order', 'name']
    
    def __str__(self):
        return f"{self.name}: {self.value}"

class Review(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    rating = models.DecimalField(
        max_digits=2, 
        decimal_places=1,
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    verified_purchase = models.BooleanField(default=False)
    helpful_count = models.PositiveIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ['product', 'user']  # Un usuario solo puede reseñar un producto una vez
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Review by {self.user.first_name} for {self.product.name}"

class ReviewHelpful(models.Model):
    review = models.ForeignKey(Review, on_delete=models.CASCADE, related_name='helpful_votes')
    user = models.ForeignKey('users.CustomUser', on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['review', 'user']