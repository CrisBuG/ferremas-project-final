import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service as EdgeService
from webdriver_manager.microsoft import EdgeChromiumDriverManager
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.firefox.service import Service as FirefoxService
try:
    from webdriver_manager.firefox import GeckoDriverManager
except Exception:
    GeckoDriverManager = None


def _find_local_msedgedriver() -> str | None:
    """Try to locate a local msedgedriver executable to avoid network downloads.

    Checks common locations and a project-local path `e2e/bin/msedgedriver.exe`.
    Returns the path if found, otherwise None.
    """
    candidates = [
        os.path.join(os.getcwd(), "e2e", "bin", "msedgedriver.exe"),
        r"C:\\Program Files (x86)\\Microsoft\\Edge WebDriver\\msedgedriver.exe",
        r"C:\\Program Files\\Microsoft\\Edge WebDriver\\msedgedriver.exe",
        r"C:\\Program Files\\msedgedriver.exe",
        r"C:\\Windows\\System32\\msedgedriver.exe",
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


# Nuevo: búsqueda de geckodriver local para Firefox

def _find_local_geckodriver() -> str | None:
    candidates = [
        os.path.join(os.getcwd(), "e2e", "bin", "geckodriver.exe"),
        r"C:\\Program Files\\Mozilla Firefox\\geckodriver.exe",
        r"C:\\Program Files\\geckodriver.exe",
        r"C:\\Windows\\System32\\geckodriver.exe",
    ]
    for path in candidates:
        if os.path.exists(path):
            return path
    return None


def is_frontend_available(url: str) -> bool:
    try:
        import urllib.request
        with urllib.request.urlopen(url, timeout=2) as resp:
            return resp.status == 200
    except Exception:
        return False


# Nuevo: opciones CLI para navegador y viewport

def pytest_addoption(parser):
    parser.addoption("--browser", action="store", default=os.environ.get("BROWSER", "edge"), help="Browser: edge or firefox")
    parser.addoption(
        "--viewport",
        action="store",
        default=os.environ.get("VIEWPORT", "desktop"),
        help="Viewport preset: desktop, tablet, mobile",
    )


@pytest.fixture(scope="session")
def base_urls():
    return {
        "frontend": os.environ.get("FRONTEND_URL", "http://localhost:3000"),
        "backend": os.environ.get("BACKEND_URL", "http://localhost:8000"),
    }


# Nuevo: fixtures para navegador y viewport

@pytest.fixture(scope="session")
def browser_name(request):
    return (request.config.getoption("--browser") or "edge").lower()


@pytest.fixture(scope="session")
def viewport(request):
    return (request.config.getoption("--viewport") or "desktop").lower()


# Helper para tamaños por viewport

def _viewport_size(name: str) -> tuple[int, int]:
    presets = {
        "desktop": (1280, 800),
        "tablet": (768, 1024),
        "mobile": (375, 667),
    }
    return presets.get(name, presets["desktop"])


@pytest.fixture(scope="session")
def driver(browser_name, viewport):
    width, height = _viewport_size(viewport)
    if browser_name == "firefox":
        options = FirefoxOptions()
        options.add_argument("-headless")
        local_driver = _find_local_geckodriver()
        try:
            if local_driver:
                service = FirefoxService(local_driver)
            elif GeckoDriverManager:
                service = FirefoxService(GeckoDriverManager().install())
            else:
                service = None
            drv = webdriver.Firefox(service=service, options=options) if service else webdriver.Firefox(options=options)
        except Exception:
            drv = webdriver.Firefox(options=options)
        try:
            drv.set_window_rect(width=width, height=height)
        except Exception:
            pass
        yield drv
        try:
            drv.quit()
        except Exception:
            pass
        return

    # Edge por defecto
    options = EdgeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument(f"--window-size={width},{height}")

    # Prefer a local driver if available to work in offline environments
    local_driver = _find_local_msedgedriver()
    try:
        if local_driver:
            service = EdgeService(local_driver)
        else:
            service = EdgeService(EdgeChromiumDriverManager().install())
        drv = webdriver.Edge(service=service, options=options)
    except Exception:
        # As a last resort, try initializing Edge without explicit service
        # (requires msedgedriver in PATH). This helps when a system-wide driver exists.
        drv = webdriver.Edge(options=options)
    yield drv
    try:
        drv.quit()
    except Exception:
        pass


@pytest.fixture(scope="session")
def ensure_frontend(base_urls):
    url = base_urls["frontend"]
    # Normalizar para HashRouter: asegurar que las rutas sean como http://localhost:3000/#/login
    if "#" not in url:
        url = url.rstrip("/") + "/#"
    # Comprobar disponibilidad contra la raíz sin hash
    root_url = url.split("#")[0].rstrip("/")
    available = is_frontend_available(root_url)
    if not available:
        pytest.skip(f"Frontend no disponible en {root_url}. Instala Node y levanta el servidor.")
    return url


@pytest.fixture(scope="session")
def ensure_backend(base_urls):
    import requests
    url = base_urls["backend"]
    try:
        r = requests.get(url + "/api/auth/csrf/", timeout=3)
        if r.status_code != 200:
            pytest.skip("Backend API no responde como se espera.")
    except Exception:
        pytest.skip(f"Backend no disponible en {url}.")
    return url


def pytest_configure(config):
    # Registrar el marcador personalizado 'e2e' para evitar PytestUnknownMarkWarning
    config.addinivalue_line("markers", "e2e: pruebas end-to-end")