from django.urls import path
from . import payment

urlpatterns = [
    # Original routes (keep for backward compatibility if needed)
    path('payment/create_transaction/', payment.init_transaction, name='create_transaction'),
    path('payment/confirm_transaction/', payment.confirm_transaction, name='confirm_transaction'),
    path('payment/cancel/', payment.cancel_transaction, name='cancel_transaction'),
    
    # New routes that match frontend expectations
    path('payments/transbank/create/', payment.init_transaction, name='transbank_create'),
    path('payments/transbank/confirm/', payment.confirm_transaction, name='transbank_confirm'),
    path('payments/transbank/cancel/', payment.cancel_transaction, name='transbank_cancel'),
]