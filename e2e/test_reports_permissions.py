import uuid
import pytest
import requests
import time
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@pytest.mark.e2e
def test_nonstaff_cannot_generate_reports(driver, ensure_frontend, ensure_backend):
    # Preparar usuario no staff mediante API
    unique = uuid.uuid4().hex[:8]
    email = f"operator_{unique}@example.com"
    username = f"operator_{unique}"
    password = "S3lenium!"

    # Registro vía API
    reg_resp = requests.post(
        ensure_backend + "/api/auth/register/",
        json={
            "username": username,
            "email": email,
            "password": password,
            "first_name": "Operador",
            "last_name": "Campo",
        },
        timeout=10,
    )
    # Si ya existe por colisiones (poco probable), continuar
    assert reg_resp.status_code in (200, 201, 400), f"Registro inesperado: {reg_resp.status_code} {reg_resp.text}"

    # Login vía UI
    wait = WebDriverWait(driver, 12)
    driver.get(ensure_frontend + "/login")
    email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
    password_input = wait.until(EC.presence_of_element_located((By.NAME, "password")))
    email_input.clear(); email_input.send_keys(email)
    password_input.clear(); password_input.send_keys(password)

    login_btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    start_time = time.perf_counter()
    login_btn.click()

    # Redirección a inicio o mensaje de éxito
    try:
        wait.until(EC.url_matches(r".*/#/$"))
    except Exception:
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(., 'Inicio de sesión exitoso') or contains(., '¡Inicio de sesión exitoso!')]")))
    elapsed = time.perf_counter() - start_time

    # Validar que NO se muestren enlaces de staff en Navbar
    driver.get(ensure_frontend + "/")
    # Esperar que navbar esté renderizado
    wait.until(EC.presence_of_element_located((By.LINK_TEXT, "Inicio")))

    assert len(driver.find_elements(By.LINK_TEXT, "Panel Admin")) == 0, "Usuario no staff no debe ver 'Panel Admin'"
    assert len(driver.find_elements(By.LINK_TEXT, "Bodega")) == 0, "Usuario no staff no debe ver 'Bodega'"
    assert len(driver.find_elements(By.LINK_TEXT, "Contabilidad")) == 0, "Usuario no staff no debe ver 'Contabilidad'"

    # Validar que NO exista botón 'Generar Nuevo Reporte' en ninguna vista actual
    assert "Generar Nuevo Reporte" not in driver.page_source, "No debe aparecer 'Generar Nuevo Reporte' para no staff"

    # Intento de acceso directo a páginas protegidas (debería redirigir al inicio)
    driver.get(ensure_frontend + "/warehouse-dashboard")
    wait.until(EC.url_matches(r".*/#/$"))

    driver.get(ensure_frontend + "/admin-dashboard")
    wait.until(EC.url_matches(r".*/#/$"))

    driver.get(ensure_frontend + "/accountant-dashboard")
    wait.until(EC.url_matches(r".*/#/$"))

    # Adjuntar métrica simple de login
    pytest.metadata = getattr(pytest, "metadata", {})
    pytest.metadata["nonstaff_login_time_seconds"] = round(elapsed, 3)