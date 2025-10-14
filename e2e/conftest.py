import os
import time
import pytest
from selenium import webdriver
from selenium.webdriver.edge.options import Options as EdgeOptions
from selenium.webdriver.edge.service import Service as EdgeService
from webdriver_manager.microsoft import EdgeChromiumDriverManager


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


def is_frontend_available(url: str) -> bool:
    try:
        import urllib.request
        with urllib.request.urlopen(url, timeout=2) as resp:
            return resp.status == 200
    except Exception:
        return False


@pytest.fixture(scope="session")
def base_urls():
    return {
        "frontend": os.environ.get("FRONTEND_URL", "http://localhost:3000"),
        "backend": os.environ.get("BACKEND_URL", "http://localhost:8000"),
    }


@pytest.fixture(scope="session")
def driver():
    options = EdgeOptions()
    options.add_argument("--headless=new")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1280,800")

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
    available = is_frontend_available(url)
    if not available:
        pytest.skip(f"Frontend no disponible en {url}. Instala Node y levanta el servidor.")
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