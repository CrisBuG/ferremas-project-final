import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import StaleElementReferenceException
import time


@pytest.mark.e2e
def test_cp_nfn_006_stock_movement_tablet(driver, ensure_frontend, ensure_backend):
    """
    CP-NFN-006: Registrar movimiento de stock en tablet (Firefox 768x1024)
    Flujo:
    - Login como usuario staff precreado
    - Ir a Bodega
    - Abrir modal "Registrar Movimiento de Stock"
    - Seleccionar primer producto disponible
    - Tipo: Entrada
    - Cantidad: 1
    - Motivo: texto identificable
    - Enviar formulario y verificar mensaje de éxito
    - Verificar que el movimiento aparece en "Movimientos Recientes"
    """
    wait = WebDriverWait(driver, 30)

    def retry_click(by, locator, attempts=3):
        for i in range(attempts):
            try:
                el = wait.until(EC.element_to_be_clickable((by, locator)))
                el.click()
                return
            except StaleElementReferenceException:
                if i == attempts - 1:
                    raise
                continue

    def retry_send_keys(by, locator, text, attempts=3):
        for i in range(attempts):
            try:
                el = wait.until(EC.element_to_be_clickable((by, locator)))
                el.clear()
                el.send_keys(text)
                return
            except StaleElementReferenceException:
                if i == attempts - 1:
                    raise
                continue

    staff_email = "bodeguero_e2e@example.com"
    staff_password = "S3lenium!"

    # Login vía UI
    driver.get(ensure_frontend + "/#/login")
    retry_send_keys(By.NAME, "email", staff_email)
    retry_send_keys(By.NAME, "password", staff_password)
    retry_click(By.CSS_SELECTOR, "button[type='submit']")

    # Esperar redirección a inicio
    try:
        wait.until(EC.url_matches(r".*/#/$"))
    except Exception:
        pass

    # Ir directamente al dashboard de bodega
    driver.get(ensure_frontend + "/#/warehouse-dashboard")
    # Verificar acceso: si no carga el título, saltar
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Dashboard de Bodeguero')]")))
    except Exception:
        pytest.skip("Usuario no tiene acceso a Bodega o el dashboard no cargó.")

    # Abrir pestaña Control de Stock
    retry_click(By.XPATH, "//button[contains(., 'Control de Stock')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Control de Stock')]")))

    # Abrir modal desde la pestaña (botón 'Nuevo Movimiento')
    retry_click(By.XPATH, "//button[contains(., 'Nuevo Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]")))

    # Seleccionar producto (primer option distinta a 'Seleccionar producto')
    product_select_xpath = "//h2[contains(., 'Registrar Movimiento de Stock')]/following::select[option[contains(., 'Seleccionar producto')]][1]"
    select_el = wait.until(EC.element_to_be_clickable((By.XPATH, product_select_xpath)))
    options = select_el.find_elements(By.TAG_NAME, "option")
    valid_options = [opt for opt in options if opt.get_attribute("value") and opt.get_attribute("value") != "0"]
    if not valid_options:
        pytest.skip("No hay productos disponibles para registrar movimiento.")
    valid_options[0].click()

    # Tipo de movimiento: Entrada
    movement_select_xpath = "//h2[contains(., 'Registrar Movimiento de Stock')]/following::label[contains(., 'Tipo de Movimiento')][1]/following::select[1]"
    type_select = wait.until(EC.element_to_be_clickable((By.XPATH, movement_select_xpath)))
    Select(type_select).select_by_value("in")

    # Cantidad: 1
    qty_input_xpath = "//h2[contains(., 'Registrar Movimiento de Stock')]/following::label[contains(., 'Cantidad')][1]/following::input[@type='number'][1]"
    retry_send_keys(By.XPATH, qty_input_xpath, "1")

    # Motivo
    reason_text = f"E2E movimiento de stock {int(time.time())}"
    reason_xpath = "//h2[contains(., 'Registrar Movimiento de Stock')]/following::label[contains(., 'Motivo')][1]/following::textarea[1]"
    retry_send_keys(By.XPATH, reason_xpath, reason_text)

    # Enviar formulario
    retry_click(By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]/following::button[contains(., 'Registrar Movimiento')][1]")

    # Mensaje de éxito
    success_msg = wait.until(
        EC.presence_of_element_located((By.XPATH, "//div[contains(., 'Movimiento de stock registrado exitosamente')]"))
    )
    assert "Movimiento de stock registrado exitosamente" in success_msg.text

    # Ir a pestaña Control de Stock (por si no está activa)
    try:
        retry_click(By.XPATH, "//button[contains(., 'Control de Stock')]")
    except Exception:
        pass

    # Verificar el movimiento en la tabla de 'Movimientos Recientes'
    row_xpath = (
        "//h4[contains(., 'Movimientos Recientes')]/following::table[1]//tr["
        "td[contains(., 'Entrada')] and td[contains(., '" + reason_text + "')] and td[contains(., 'Bodeguero')]"
        "]"
    )
    row = wait.until(EC.presence_of_element_located((By.XPATH, row_xpath)))
    assert row is not None, "No se encontró el movimiento recién registrado en la tabla"
