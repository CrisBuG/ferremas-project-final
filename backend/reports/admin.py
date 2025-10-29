from django.contrib import admin
from .models import Report, ReportType

@admin.register(ReportType)
class ReportTypeAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'is_active', 'created_at']
    list_filter = ['is_active', 'created_at']
    search_fields = ['name', 'description']

@admin.register(Report)
class ReportAdmin(admin.ModelAdmin):
    list_display = ['title', 'report_type', 'generated_by', 'status', 'created_at']
    list_filter = ['status', 'report_type', 'created_at']
    search_fields = ['title', 'description']
    readonly_fields = ['data', 'completed_at']