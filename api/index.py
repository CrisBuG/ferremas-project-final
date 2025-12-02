import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BACKEND_PATH = ROOT / "backend"
sys.path.append(str(BACKEND_PATH))

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "ferremas_project.settings")

from django.core.asgi import get_asgi_application

app = get_asgi_application()

