from django.contrib import admin
from .models import Invoice, InvoiceItem

class InvoiceItemInline(admin.TabularInline):
    model = InvoiceItem
    extra = 0
    readonly_fields = ('total_price',)

@admin.register(Invoice)
class InvoiceAdmin(admin.ModelAdmin):
    list_display = ('invoice_number', 'invoice_type', 'customer', 'total_amount', 'status', 'issue_date')
    list_filter = ('invoice_type', 'status', 'issue_date')
    search_fields = ('invoice_number', 'customer__email', 'customer__first_name', 'customer__last_name')
    readonly_fields = ('invoice_number', 'issue_date', 'updated_at')
    inlines = [InvoiceItemInline]
    
    fieldsets = (
        ('Información General', {
            'fields': ('invoice_number', 'invoice_type', 'order', 'customer', 'status')
        }),
        ('Fechas', {
            'fields': ('issue_date', 'due_date', 'updated_at')
        }),
        ('Montos', {
            'fields': ('subtotal', 'tax_amount', 'total_amount')
        }),
        ('Notas', {
            'fields': ('notes',)
        }),
    )


@admin.register(InvoiceItem)
class InvoiceItemAdmin(admin.ModelAdmin):
    list_display = ('invoice', 'product_name', 'quantity', 'unit_price', 'total_price')
    list_filter = ('invoice__invoice_type',)
    search_fields = ('product_name', 'invoice__invoice_number')