import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))  # Añadir directorio padre al path

import django
from django.core.wsgi import get_wsgi_application

# Configurar variables de entorno para Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ferremas_project.settings')
django.setup()

# Obtener la aplicación WSGI
application = get_wsgi_application()

# Punto de entrada para el servidor WSGI
app = application
