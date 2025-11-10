import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@pytest.mark.e2e
def test_cliente_no_ve_dashboards(driver, ensure_frontend):
    # Asume sesión activa tras test de login; si no, redirige
    driver.get(ensure_frontend + "/#/")
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "nav")))

    page = driver.page_source
    assert "Panel Admin" not in page
    assert "Bodega" not in page
    assert "Contabilidad" not in page


@pytest.mark.e2e
def test_protegido_redirige_sin_permiso(driver, ensure_frontend):
    # Intentar ir a dashboard admin sin permisos
    driver.get(ensure_frontend + "/#/admin-dashboard")
    WebDriverWait(driver, 10).until(
        EC.any_of(EC.url_contains("/login"), EC.url_matches(r".*/$"))
    )
    # Debe estar en inicio o login
    assert driver.current_url.endswith("/") or "/login" in driver.current_url
