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

from django.core.asgi import get_asgi_application

app = get_asgi_application()

