from django.urls import path
from . import payment
from . import payment_simulation
from .views import simulate_payment_process  # Importar la nueva función

urlpatterns = [
    
    path('payment/create_transaction/', payment.init_transaction, name='create_transaction'),
    path('payment/confirm_transaction/', payment.confirm_transaction, name='confirm_transaction'),
    path('payment/cancel/', payment.cancel_transaction, name='cancel_transaction'),
    
    # Agregar la nueva ruta para simulación
    path('payment/simulate/', simulate_payment_process, name='simulate_payment_process'),
    
    path('payments/transbank/create/', payment.init_transaction, name='transbank_create'),
    path('payments/transbank/confirm/', payment.confirm_transaction, name='transbank_confirm'),
    path('payments/transbank/cancel/', payment.cancel_transaction, name='transbank_cancel'),

    # URLs para integración con dinero ficticio
    path('payments/transbank/integration/create/', payment_simulation.init_integration_transaction, name='transbank_integration_create'),
    path('payments/transbank/integration/confirm/', payment_simulation.confirm_integration_transaction, name='transbank_integration_confirm'),

]