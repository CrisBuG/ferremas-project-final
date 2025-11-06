from django.contrib import admin
from .models import Return, ReturnItem

class ReturnItemInline(admin.TabularInline):
    model = ReturnItem
    extra = 0
    readonly_fields = ['refund_amount']

@admin.register(Return)
class ReturnAdmin(admin.ModelAdmin):
    list_display = [
        'return_number', 'order', 'customer', 'status', 
        'refund_amount', 'requested_at'
    ]
    list_filter = ['status', 'reason', 'requested_at']
    search_fields = ['return_number', 'order__order_number', 'customer__email']
    readonly_fields = ['return_number', 'requested_at']
    inlines = [ReturnItemInline]

@admin.register(ReturnItem)
class ReturnItemAdmin(admin.ModelAdmin):
    list_display = [
        'return_request', 'product', 'quantity', 
        'unit_price', 'refund_amount'
    ]
    list_filter = ['reason']
    search_fields = ['product__name', 'return_request__return_number']