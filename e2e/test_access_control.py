import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@pytest.mark.e2e
@pytest.mark.parametrize("label", ["Panel Admin", "Bodega", "Contabilidad"])
def test_cliente_no_ve_dashboards(driver, ensure_frontend, label):
    # Asume sesión activa tras test de login; si no, redirige
    driver.get(ensure_frontend + "/#/")
    wait = WebDriverWait(driver, 10)
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "nav")))

    page = driver.page_source
    assert label not in page


@pytest.mark.e2e
@pytest.mark.parametrize("protected_path", [
    "/#/admin-dashboard",
    "/#/warehouse-dashboard",
    "/#/accountant-dashboard",
])
def test_protegido_redirige_sin_permiso(driver, ensure_frontend, protected_path):
    # Intentar ir a rutas protegidas sin permisos
    driver.get(ensure_frontend + protected_path)
    WebDriverWait(driver, 10).until(
        EC.any_of(EC.url_contains("/login"), EC.url_matches(r".*/$"))
    )
    # Debe estar en inicio o login
    assert driver.current_url.endswith("/") or "/login" in driver.current_url
