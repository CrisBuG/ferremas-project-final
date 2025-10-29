import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import Select
from selenium.common.exceptions import StaleElementReferenceException


def _wait(driver, seconds=20):
    return WebDriverWait(driver, seconds)


def _retry_click(driver, by, locator, attempts=3):
    wait = _wait(driver)
    for i in range(attempts):
        try:
            el = wait.until(EC.element_to_be_clickable((by, locator)))
            el.click()
            return el
        except StaleElementReferenceException:
            if i == attempts - 1:
                raise
            continue


def _retry_send_keys(driver, by, locator, text, attempts=3):
    wait = _wait(driver)
    for i in range(attempts):
        try:
            el = wait.until(EC.element_to_be_clickable((by, locator)))
            el.clear()
            el.send_keys(text)
            return el
        except StaleElementReferenceException:
            if i == attempts - 1:
                raise
            continue


@pytest.mark.e2e
def test_cp_nfn_001_efficiency_tablet(driver, ensure_frontend, ensure_backend):
    """
    Reemplazo CP-NFN-001: Medir eficiencia del flujo de registro de movimiento de stock (Entrada)
    - Medición: desde submit en modal hasta mensaje de éxito
    - Criterio: < 5s
    """
    staff_email = "bodeguero_e2e@example.com"
    staff_password = "S3lenium!"
    wait = _wait(driver, 30)

    driver.get(ensure_frontend + "/login")
    _retry_send_keys(driver, By.NAME, "email", staff_email)
    _retry_send_keys(driver, By.NAME, "password", staff_password)
    _retry_click(driver, By.CSS_SELECTOR, "button[type='submit']")

    # Ir a dashboard de bodega
    driver.get(ensure_frontend + "/warehouse-dashboard")
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Dashboard de Bodeguero')]")))
    except Exception:
        pytest.skip("Usuario no tiene acceso a Bodega o el dashboard no cargó.")

    # Tab Control de Stock
    _retry_click(driver, By.XPATH, "//button[contains(., 'Control de Stock')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Control de Stock')]")))

    # Abrir modal y seleccionar primer producto
    _retry_click(driver, By.XPATH, "//button[contains(., 'Nuevo Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]")))

    select_el = wait.until(EC.element_to_be_clickable((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]/following::select[1]")))
    options = select_el.find_elements(By.TAG_NAME, "option")
    valid_options = [opt for opt in options if opt.get_attribute("value") and opt.get_attribute("value") != "0"]
    if not valid_options:
        pytest.skip("No hay productos disponibles para registrar movimiento.")
    valid_options[0].click()

    # Tipo: Entrada
    type_select = wait.until(EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'Tipo de Movimiento')]/following::select[1]")))
    Select(type_select).select_by_value("in")

    # Cantidad y Motivo
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Cantidad')]/following::input[@type='number'][1]", "1")
    reason_text = f"E2E eficiencia {int(time.time())}"
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Motivo')]/following::textarea[1]", reason_text)

    # Submit y medir tiempo hasta éxito
    start = time.perf_counter()
    _retry_click(driver, By.XPATH, "//button[contains(., 'Registrar Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(., 'Movimiento de stock registrado exitosamente')]")))
    elapsed = round(time.perf_counter() - start, 3)
    print(f"[METRIC] CP-NFN-001 tiempo={elapsed}s")

    pytest.metadata = getattr(pytest, "metadata", {})
    pytest.metadata["cp_nfn_001_time_seconds"] = elapsed

    assert elapsed < 5, f"Tiempo de registro excede 5s: {elapsed}s"


@pytest.mark.e2e
def test_cp_nfn_003_home_navigation_time(driver, ensure_frontend):
    """
    Reemplazo CP-NFN-003: Métrica de navegación Home -> Products
    - Criterio: < 1.5s
    """
    wait = _wait(driver, 15)
    driver.get(ensure_frontend + "/")
    btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Ver Productos')]")))
    start = time.perf_counter()
    btn.click()
    wait.until(EC.url_contains("/products"))
    elapsed = round(time.perf_counter() - start, 3)
    print(f"[METRIC] CP-NFN-003 tiempo={elapsed}s")

    pytest.metadata = getattr(pytest, "metadata", {})
    pytest.metadata["home_to_products_time_seconds"] = elapsed

    assert elapsed < 1.5, f"Navegación Home->Products lenta: {elapsed}s"


@pytest.mark.e2e
def test_cp_nfn_004_out_flow_feedback(driver, ensure_frontend, ensure_backend):
    """
    Reemplazo CP-NFN-004: Fluidez de UI al registrar 'Salida'
    - Criterio: mensaje de éxito aparece < 3s
    """
    staff_email = "bodeguero_e2e@example.com"
    staff_password = "S3lenium!"
    wait = _wait(driver, 30)

    driver.get(ensure_frontend + "/login")
    _retry_send_keys(driver, By.NAME, "email", staff_email)
    _retry_send_keys(driver, By.NAME, "password", staff_password)
    _retry_click(driver, By.CSS_SELECTOR, "button[type='submit']")

    driver.get(ensure_frontend + "/warehouse-dashboard")
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Dashboard de Bodeguero')]")))
    except Exception:
        pytest.skip("Usuario no tiene acceso a Bodega o el dashboard no cargó.")

    _retry_click(driver, By.XPATH, "//button[contains(., 'Control de Stock')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Control de Stock')]")))

    _retry_click(driver, By.XPATH, "//button[contains(., 'Nuevo Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]")))

    select_el = wait.until(EC.element_to_be_clickable((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]/following::select[1]")))
    options = select_el.find_elements(By.TAG_NAME, "option")
    valid_options = [opt for opt in options if opt.get_attribute("value") and opt.get_attribute("value") != "0"]
    if not valid_options:
        pytest.skip("No hay productos disponibles para registrar movimiento.")
    valid_options[0].click()

    type_select = wait.until(EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'Tipo de Movimiento')]/following::select[1]")))
    Select(type_select).select_by_value("out")

    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Cantidad')]/following::input[@type='number'][1]", "1")
    reason_text = f"E2E salida {int(time.time())}"
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Motivo')]/following::textarea[1]", reason_text)

    start = time.perf_counter()
    _retry_click(driver, By.XPATH, "//button[contains(., 'Registrar Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(., 'Movimiento de stock registrado exitosamente')]")))
    elapsed = round(time.perf_counter() - start, 3)
    print(f"[METRIC] CP-NFN-004 tiempo={elapsed}s")

    pytest.metadata = getattr(pytest, "metadata", {})
    pytest.metadata["cp_nfn_004_out_time_seconds"] = elapsed

    assert elapsed < 3, f"Tiempo de confirmación de salida excede 3s: {elapsed}s"


@pytest.mark.e2e
def test_cp_nfn_007_home_cross_browser_elements(driver, ensure_frontend):
    """
    Reemplazo CP-NFN-007: Validar elementos clave en Home (Edge/Firefox)
    """
    wait = _wait(driver, 15)
    driver.get(ensure_frontend + "/")
    wait.until(EC.presence_of_element_located((By.TAG_NAME, "nav")))
    page = driver.page_source
    assert "Bienvenido a FERREMAS" in page
    assert "¿Por qué elegirnos?" in page


@pytest.mark.e2e
def test_cp_nfn_010_consistency_in_out_sequence(driver, ensure_frontend, ensure_backend):
    """
    Reemplazo CP-NFN-010: Secuencia Entrada->Salida mantiene consistencia de stock en UI
    """
    staff_email = "bodeguero_e2e@example.com"
    staff_password = "S3lenium!"
    wait = _wait(driver, 30)

    # Login y navegar a inventario para leer stock inicial
    driver.get(ensure_frontend + "/login")
    _retry_send_keys(driver, By.NAME, "email", staff_email)
    _retry_send_keys(driver, By.NAME, "password", staff_password)
    _retry_click(driver, By.CSS_SELECTOR, "button[type='submit']")

    driver.get(ensure_frontend + "/warehouse-dashboard")
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Dashboard de Bodeguero')]")))
    except Exception:
        pytest.skip("Usuario no tiene acceso a Bodega o el dashboard no cargó.")

    # Ir a pestaña de productos para leer primer producto y stock
    _retry_click(driver, By.XPATH, "//button[contains(., 'Gestión de Productos')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Gestión de Productos')]")))

    # Capturar nombre y stock inicial del primer producto
    rows = driver.find_elements(By.XPATH, "//table//tbody/tr")
    if not rows:
        pytest.skip("No hay productos disponibles.")
    first_row = rows[0]
    name_el = first_row.find_element(By.XPATH, ".//td[1]//strong")
    product_name = name_el.text

    # El stock está en la 4ta columna según la tabla
    stock_cell = first_row.find_element(By.XPATH, ".//td[4]")
    try:
        initial_stock = int(stock_cell.text.strip())
    except Exception:
        initial_stock = 0

    # Ir a Control de Stock para hacer operaciones
    _retry_click(driver, By.XPATH, "//button[contains(., 'Control de Stock')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Control de Stock')]")))

    # Abrir modal y seleccionar el producto por nombre
    _retry_click(driver, By.XPATH, "//button[contains(., 'Nuevo Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]")))

    select_el = wait.until(EC.element_to_be_clickable((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]/following::select[1]")))
    options = select_el.find_elements(By.TAG_NAME, "option")
    target_opt = None
    for opt in options:
        if product_name in opt.text:
            target_opt = opt
            break
    if target_opt is None:
        pytest.skip("No se encontró el producto esperado en el selector.")
    target_opt.click()

    # Entrada de 2
    type_select = wait.until(EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'Tipo de Movimiento')]/following::select[1]")))
    Select(type_select).select_by_value("in")
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Cantidad')]/following::input[@type='number'][1]", "2")
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Motivo')]/following::textarea[1]", "E2E consistencia entrada")
    _retry_click(driver, By.XPATH, "//button[contains(., 'Registrar Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(., 'Movimiento de stock registrado exitosamente')]")))

    # Verificar stock actualizado (inventario)
    _retry_click(driver, By.XPATH, "//button[contains(., 'Gestión de Productos')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Gestión de Productos')]")))
    rows = driver.find_elements(By.XPATH, "//table//tbody/tr")
    first_row = rows[0]
    stock_cell = first_row.find_element(By.XPATH, ".//td[4]")
    after_in = int(stock_cell.text.strip())
    assert after_in == initial_stock + 2

    # Salida de 1
    _retry_click(driver, By.XPATH, "//button[contains(., 'Control de Stock')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Control de Stock')]")))
    _retry_click(driver, By.XPATH, "//button[contains(., 'Nuevo Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]")))

    select_el = wait.until(EC.element_to_be_clickable((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]/following::select[1]")))
    options = select_el.find_elements(By.TAG_NAME, "option")
    for opt in options:
        if product_name in opt.text:
            opt.click()
            break

    type_select = wait.until(EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'Tipo de Movimiento')]/following::select[1]")))
    Select(type_select).select_by_value("out")
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Cantidad')]/following::input[@type='number'][1]", "1")
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Motivo')]/following::textarea[1]", "E2E consistencia salida")
    _retry_click(driver, By.XPATH, "//button[contains(., 'Registrar Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(., 'Movimiento de stock registrado exitosamente')]")))

    # Verificar stock después de salida
    _retry_click(driver, By.XPATH, "//button[contains(., 'Gestión de Productos')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Gestión de Productos')]")))
    rows = driver.find_elements(By.XPATH, "//table//tbody/tr")
    first_row = rows[0]
    stock_cell = first_row.find_element(By.XPATH, ".//td[4]")
    after_out = int(stock_cell.text.strip())
    assert after_out == after_in - 1


@pytest.mark.e2e
def test_cp_func_003_adjustment_stock(driver, ensure_frontend, ensure_backend):
    """
    Reemplazo CP-FUNC-003: Ajuste de stock (establecer nuevo valor)
    """
    staff_email = "bodeguero_e2e@example.com"
    staff_password = "S3lenium!"
    wait = _wait(driver, 30)

    driver.get(ensure_frontend + "/login")
    _retry_send_keys(driver, By.NAME, "email", staff_email)
    _retry_send_keys(driver, By.NAME, "password", staff_password)
    _retry_click(driver, By.CSS_SELECTOR, "button[type='submit']")

    driver.get(ensure_frontend + "/warehouse-dashboard")
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Dashboard de Bodeguero')]")))
    except Exception:
        pytest.skip("Usuario no tiene acceso a Bodega o el dashboard no cargó.")

    _retry_click(driver, By.XPATH, "//button[contains(., 'Control de Stock')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Control de Stock')]")))

    _retry_click(driver, By.XPATH, "//button[contains(., 'Nuevo Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]")))

    select_el = wait.until(EC.element_to_be_clickable((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]/following::select[1]")))
    options = select_el.find_elements(By.TAG_NAME, "option")
    valid_options = [opt for opt in options if opt.get_attribute("value") and opt.get_attribute("value") != "0"]
    if not valid_options:
        pytest.skip("No hay productos disponibles para registrar movimiento.")
    valid_options[0].click()

    type_select = wait.until(EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'Tipo de Movimiento')]/following::select[1]")))
    Select(type_select).select_by_value("adjustment")

    # Establecer nuevo stock a 5
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Nuevo Stock')]/following::input[@type='number'][1]", "5")
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Motivo')]/following::textarea[1]", "E2E ajuste a 5")
    _retry_click(driver, By.XPATH, "//button[contains(., 'Registrar Movimiento')]")

    success_msg = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(., 'Movimiento de stock registrado exitosamente')]")))
    assert success_msg is not None


@pytest.mark.e2e
def test_cp_func_004_salida_stock(driver, ensure_frontend, ensure_backend):
    """
    Reemplazo CP-FUNC-004: Registrar salida y verificar movimiento visible
    """
    staff_email = "bodeguero_e2e@example.com"
    staff_password = "S3lenium!"
    wait = _wait(driver, 30)

    driver.get(ensure_frontend + "/login")
    _retry_send_keys(driver, By.NAME, "email", staff_email)
    _retry_send_keys(driver, By.NAME, "password", staff_password)
    _retry_click(driver, By.CSS_SELECTOR, "button[type='submit']")

    driver.get(ensure_frontend + "/warehouse-dashboard")
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Dashboard de Bodeguero')]")))
    except Exception:
        pytest.skip("Usuario no tiene acceso a Bodega o el dashboard no cargó.")

    _retry_click(driver, By.XPATH, "//button[contains(., 'Control de Stock')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Control de Stock')]")))

    _retry_click(driver, By.XPATH, "//button[contains(., 'Nuevo Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]")))

    select_el = wait.until(EC.element_to_be_clickable((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]/following::select[1]")))
    options = select_el.find_elements(By.TAG_NAME, "option")
    valid_options = [opt for opt in options if opt.get_attribute("value") and opt.get_attribute("value") != "0"]
    if not valid_options:
        pytest.skip("No hay productos disponibles para registrar movimiento.")
    valid_options[0].click()

    type_select = wait.until(EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'Tipo de Movimiento')]/following::select[1]")))
    Select(type_select).select_by_value("out")

    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Cantidad')]/following::input[@type='number'][1]", "1")
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Motivo')]/following::textarea[1]", "E2E salida verificación")
    _retry_click(driver, By.XPATH, "//button[contains(., 'Registrar Movimiento')]")

    success_msg = wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(., 'Movimiento de stock registrado exitosamente')]")))
    assert success_msg is not None


@pytest.mark.e2e
def test_cp_func_005_out_greater_than_stock_clamps_to_zero(driver, ensure_frontend, ensure_backend):
    """
    Reemplazo CP-FUNC-005: 'Salida' mayor al stock clampa a 0 (comportamiento actual)
    """
    staff_email = "bodeguero_e2e@example.com"
    staff_password = "S3lenium!"
    wait = _wait(driver, 30)

    driver.get(ensure_frontend + "/login")
    _retry_send_keys(driver, By.NAME, "email", staff_email)
    _retry_send_keys(driver, By.NAME, "password", staff_password)
    _retry_click(driver, By.CSS_SELECTOR, "button[type='submit']")

    driver.get(ensure_frontend + "/warehouse-dashboard")
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Dashboard de Bodeguero')]")))
    except Exception:
        pytest.skip("Usuario no tiene acceso a Bodega o el dashboard no cargó.")

    _retry_click(driver, By.XPATH, "//button[contains(., 'Gestión de Productos')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Gestión de Productos')]")))
    rows = driver.find_elements(By.XPATH, "//table//tbody/tr")
    if not rows:
        pytest.skip("No hay productos disponibles.")
    first_row = rows[0]
    name_el = first_row.find_element(By.XPATH, ".//td[1]//strong")
    product_name = name_el.text

    # Ir a Control de Stock
    _retry_click(driver, By.XPATH, "//button[contains(., 'Control de Stock')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Control de Stock')]")))

    # Registrar salida con cantidad grande
    _retry_click(driver, By.XPATH, "//button[contains(., 'Nuevo Movimiento')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]")))
    select_el = wait.until(EC.element_to_be_clickable((By.XPATH, "//h2[contains(., 'Registrar Movimiento de Stock')]/following::select[1]")))
    options = select_el.find_elements(By.TAG_NAME, "option")
    for opt in options:
        if product_name in opt.text:
            opt.click()
            break

    type_select = wait.until(EC.element_to_be_clickable((By.XPATH, "//label[contains(., 'Tipo de Movimiento')]/following::select[1]")))
    Select(type_select).select_by_value("out")
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Cantidad')]/following::input[@type='number'][1]", "999999")
    _retry_send_keys(driver, By.XPATH, "//label[contains(., 'Motivo')]/following::textarea[1]", "E2E salida > stock")
    _retry_click(driver, By.XPATH, "//button[contains(., 'Registrar Movimiento')]")

    # Éxito y comprobar que stock queda en 0
    wait.until(EC.presence_of_element_located((By.XPATH, "//div[contains(., 'Movimiento de stock registrado exitosamente')]")))
    _retry_click(driver, By.XPATH, "//button[contains(., 'Gestión de Productos')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Gestión de Productos')]")))
    rows = driver.find_elements(By.XPATH, "//table//tbody/tr")
    first_row = rows[0]
    stock_cell = first_row.find_element(By.XPATH, ".//td[4]")
    assert stock_cell.text.strip() == "0"


@pytest.mark.e2e
def test_cp_func_007_no_export_csv_button(driver, ensure_frontend):
    """
    Reemplazo CP-FUNC-007: Confirmar ausencia de botón 'Exportar CSV' en Reportes
    """
    wait = _wait(driver, 15)
    driver.get(ensure_frontend + "/warehouse-dashboard")
    # Si el usuario no tiene acceso, omitir
    page = driver.page_source
    if "Dashboard de Bodeguero" not in page:
        pytest.skip("Usuario no tiene acceso a Bodega; aplicable solo a staff.")

    _retry_click(driver, By.XPATH, "//button[contains(., 'Reportes')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Reportes de Inventario')]")))
    assert "Exportar CSV" not in driver.page_source


@pytest.mark.e2e
def test_cp_func_001_home_about_navigation(driver, ensure_frontend):
    """
    Reemplazo CP-FUNC-001: Navegación Home -> About
    """
    wait = _wait(driver, 15)
    driver.get(ensure_frontend + "/")
    btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Conoce Más')]")))
    btn.click()
    wait.until(EC.url_contains("/about"))
    assert "/about" in driver.current_url


@pytest.mark.e2e
def test_cp_func_002_login_button_disabled_during_loading(driver, ensure_frontend):
    """
    Reemplazo CP-FUNC-002: El botón de Login se deshabilita durante la carga
    """
    wait = _wait(driver, 10)
    driver.get(ensure_frontend + "/login")
    email_input = wait.until(EC.presence_of_element_located((By.NAME, "email")))
    password_input = wait.until(EC.presence_of_element_located((By.NAME, "password")))
    email_input.clear(); email_input.send_keys("usuario@example.com")
    password_input.clear(); password_input.send_keys("S3lenium!")
    btn = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    btn.click()
    # Debería deshabilitarse brevemente mientras se procesa
    disabled = driver.execute_script("return arguments[0].disabled;", btn)
    print(f"[METRIC] CP-FUNC-002 login_button_disabled_initial={disabled}")
    pytest.metadata = getattr(pytest, "metadata", {})
    pytest.metadata["login_button_disabled_initial"] = bool(disabled)
    assert disabled is True


@pytest.mark.e2e
def test_cp_func_008_open_and_cancel_return_modal(driver, ensure_frontend):
    """
    Reemplazo CP-FUNC-008: Abrir y cancelar modal de 'Registrar Devolución'
    """
    wait = _wait(driver, 15)
    driver.get(ensure_frontend + "/warehouse-dashboard")
    # Omitir si no staff
    page = driver.page_source
    if "Dashboard de Bodeguero" not in page:
        pytest.skip("Usuario no tiene acceso a Bodega; aplicable solo a staff.")

    _retry_click(driver, By.XPATH, "//button[contains(., 'Devoluciones')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Gestión de Devoluciones')]")))
    _retry_click(driver, By.XPATH, "//button[contains(., 'Registrar Devolución')]")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Registrar Devolución')]")))
    # Cancelar
    _retry_click(driver, By.XPATH, "//button[contains(., 'Cancelar')]")
    # Verificar que el título ya no esté visible
    time.sleep(0.5)
    assert "Registrar Devolución" not in driver.page_source