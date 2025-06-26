from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ProductViewSet, CategoryViewSet, CartViewSet, OrderViewSet, UserViewSet,
    CSRFTokenView, register_view, login_view, 
    update_profile_view, get_exchange_rate, current_user_view, admin_stats_view,
    verify_admin_password, google_auth, simulate_transbank_payment, simulate_payment_confirmation,
    accountant_stats_view # <--- AÑADIR ESTA IMPORTACIÓN
)

# Importar ViewSets de las nuevas apps
from billing.views import InvoiceViewSet as BillingInvoiceViewSet
from reports.views import ReportViewSet, ReportTypeViewSet
from returns.views import ReturnViewSet
from promotions.views import CouponViewSet, PromotionViewSet

router = DefaultRouter()
router.register(r'products', ProductViewSet)
router.register(r'categories', CategoryViewSet)
router.register(r'cart', CartViewSet, basename='cart')
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'users', UserViewSet, basename='user')

# Registrar ViewSets de las nuevas apps
router.register(r'billing/invoices', BillingInvoiceViewSet, basename='billing-invoice')
router.register(r'returns/returns', ReturnViewSet, basename='return')
router.register(r'promotions/promotions', PromotionViewSet, basename='promotion')
# router.register(r'promotions/coupons', CouponViewSet, basename='coupon')  # COMENTAR ESTA LÍNEA
router.register(r'reports', ReportViewSet, basename='report')
router.register(r'report-types', ReportTypeViewSet, basename='report-type')

urlpatterns = [
    path('', include(router.urls)),
    path('auth/csrf/', CSRFTokenView.as_view(), name='csrf-token'),
    path('auth/register/', register_view, name='register'),
    path('auth/login/', login_view, name='login'),
    path('auth/profile/', current_user_view, name='profile'),
    path('auth/user/', current_user_view, name='current-user'),
    path('auth/update_profile/', update_profile_view, name='update-profile'),
    path('auth/verify-password/', verify_admin_password, name='verify_admin_password'),
    path('auth/google/', google_auth, name='google_auth'),
    
    # URLs explícitas del carrito
    path('cart/add_item/', CartViewSet.as_view({'post': 'add_item'}), name='cart-add-item'),
    path('cart/get_cart/', CartViewSet.as_view({'get': 'get_cart'}), name='cart-get-cart'),
    path('cart/update_item/', CartViewSet.as_view({'patch': 'update_item'}), name='cart-update-item'), 
    path('cart/remove_item/', CartViewSet.as_view({'delete': 'remove_item'}), name='cart-remove-item'),
    path('cart/clear_cart/', CartViewSet.as_view({'delete': 'clear_cart'}), name='cart-clear'),

    # URLs explícitas de órdenes
    path('orders/get_orders/', OrderViewSet.as_view({'get': 'get_orders'}), name='orders-get-orders'),
    path('orders/create_order/', OrderViewSet.as_view({'post': 'create_order'}), name='orders-create-order'),

    # URLs explícitas de cupones - TEMPORAL
    path('promotions/coupons/apply_coupon/', CouponViewSet.as_view({'post': 'apply_coupon'}), name='coupon-apply'),
    path('promotions/coupons/validate_coupon/', CouponViewSet.as_view({'post': 'validate_coupon'}), name='coupon-validate'),

    # Simulación de pagos
    path('simulate-create/', simulate_transbank_payment, name='simulate_transbank_payment'),
    path('simulate-confirmation/', simulate_payment_confirmation, name='simulate_payment_confirmation'),

    # Admin stats endpoint
    path('admin/stats/', admin_stats_view, name='admin-stats'),

    # Accountant stats endpoint
    path('accountant/stats/', accountant_stats_view, name='accountant-stats'), # <--- AÑADIR ESTA LÍNEA
    
    # Exchange rate endpoint
    path('exchange-rate/', get_exchange_rate, name='exchange-rate'),

    # Incluir URLs de payment
    path('', include('api.payment_urls')),
    
    # URLs de las nuevas apps
    path('billing/', include('billing.urls')),
    path('reports/', include('reports.urls')),
    path('returns/', include('returns.urls')),
    path('promotions/', include('promotions.urls')),  # DEBE ESTAR DESCOMENTADA
]