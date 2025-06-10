from django.contrib import admin
from .models import Promotion, Coupon, PromotionUsage

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'promotion_type', 'status', 'discount_percentage',
        'discount_amount', 'start_date', 'end_date', 'current_usage'
    ]
    list_filter = ['promotion_type', 'status', 'start_date', 'end_date']
    search_fields = ['name', 'description']
    filter_horizontal = ['applicable_products', 'applicable_categories']
    readonly_fields = ['current_usage']

@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = [
        'code', 'promotion', 'status', 'usage_limit', 
        'current_usage', 'assigned_to'
    ]
    list_filter = ['status', 'promotion']
    search_fields = ['code', 'promotion__name']

@admin.register(PromotionUsage)
class PromotionUsageAdmin(admin.ModelAdmin):
    list_display = [
        'promotion', 'customer', 'discount_amount', 'used_at'
    ]
    list_filter = ['promotion', 'used_at']
    search_fields = ['customer__email', 'promotion__name']