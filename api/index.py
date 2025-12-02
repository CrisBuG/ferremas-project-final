import os
import sys
from pathlib import Path

# Paths
ROOT = Path(__file__).resolve().parent.parent
BACKEND_PATH = ROOT / "backend"
sys.path.append(str(BACKEND_PATH))

# Cargar variables de entorno desde .env (para desarrollo/local y Import .env en Vercel)
try:
    from dotenv import load_dotenv
    # Intentar cargar .env en raíz del repo si existe
    env_paths = [
        ROOT / ".env",
        ROOT / ".env.vercel",
        ROOT / ".env.vercel.local",
        ROOT / ".env.local",
    ]
    for p in env_paths:
        if p.exists():
            load_dotenv(dotenv_path=p, override=False)
except Exception:
    pass

# Configurar Django
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ferremas_project.settings")

import django
django.setup()

# Migraciones automáticas opcionales
if os.getenv("DJANGO_AUTO_MIGRATE", "false").lower() == "true":
    try:
        from django.core.management import call_command
        call_command("migrate", interactive=False, run_syncdb=True)
    except Exception:
        pass

# Bootstrap opcional de superusuario
try:
    email = os.getenv("DJANGO_BOOTSTRAP_SUPERUSER_EMAIL")
    password = os.getenv("DJANGO_BOOTSTRAP_SUPERUSER_PASSWORD")
    first_name = os.getenv("DJANGO_BOOTSTRAP_SUPERUSER_FIRST_NAME", "")
    last_name = os.getenv("DJANGO_BOOTSTRAP_SUPERUSER_LAST_NAME", "")
    if email and password:
        from django.contrib.auth import get_user_model
        User = get_user_model()
        if not User.objects.filter(email=email).exists():
            User.objects.create_superuser(email=email, password=password, first_name=first_name, last_name=last_name)
except Exception:
    pass

from django.core.asgi import get_asgi_application

app = get_asgi_application()

