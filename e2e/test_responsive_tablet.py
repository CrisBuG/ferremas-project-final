import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@pytest.mark.e2e
def test_cp_nfn_002_tablet_legibilidad(driver, ensure_frontend):
    """
    CP-NFN-002: Verificar legibilidad y tamaño de elementos en tablet (768x1024)
    - Font-size de tabs >= 14px
    - Botones/tap-targets (Movimiento de Stock, Registrar Movimiento) >= 48x48 px
    - Sin overflow horizontal en layout
    """
    driver.get(ensure_frontend + "/")
    wait = WebDriverWait(driver, 15)

    # Si no hay enlace de Bodega (usuario no staff), omitir la prueba
    if "Bodega" not in driver.page_source:
        pytest.skip("Usuario no tiene acceso a Bodega; prueba aplicable solo para is_staff.")

    # Ir a Bodega
    bodega_link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Bodega')]")))
    bodega_link.click()

    # Tabs: "📈 Control de Stock" y "📋 Reportes"
    tab_control = wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Control de Stock')]")))
    tab_reportes = wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Reportes')]")))

    # Obtener font-size computado vía JS para mayor fiabilidad
    js_get_font = """
    const cs = window.getComputedStyle(arguments[0]);
    return cs.fontSize;
    """
    font_control = driver.execute_script(js_get_font, tab_control)
    font_reportes = driver.execute_script(js_get_font, tab_reportes)

    def _px_to_int(px: str) -> int:
        try:
            return int(float(px.replace('px', '').strip()))
        except Exception:
            return 0

    fc = _px_to_int(font_control)
    fr = _px_to_int(font_reportes)

    # Botón "Movimiento de Stock" visible en la sección de control
    try:
        # A veces la pestaña de Reportes queda activa; aseguramos hacer click en Control de Stock
        tab_control.click()
    except Exception:
        pass

    mov_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Movimiento de Stock')]")))

    # Abrir modal para medir "Registrar Movimiento"
    mov_btn.click()
    modal_title = wait.until(EC.presence_of_element_located((By.XPATH, "//h2[contains(., 'Registrar Movimiento')]")))
    reg_btn = wait.until(EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Registrar Movimiento')]")))

    # Medir dimensiones con boundingClientRect
    js_rect = """
    const r = arguments[0].getBoundingClientRect();
    return {width: Math.round(r.width), height: Math.round(r.height)};
    """
    rect_mov = driver.execute_script(js_rect, mov_btn)
    rect_reg = driver.execute_script(js_rect, reg_btn)

    # Verificar ausencia de overflow horizontal notable
    js_overflow = """
    const doc = document.documentElement;
    const body = document.body;
    const winW = window.innerWidth;
    const scrollW = Math.max(doc.scrollWidth, body.scrollWidth);
    return scrollW > (winW + 10); // tolerancia de 10px por scrollbar
    """
    has_h_overflow = bool(driver.execute_script(js_overflow))

    # Adjuntar métricas
    pytest.metadata = getattr(pytest, "metadata", {})
    pytest.metadata["tablet_font_control_px"] = fc
    pytest.metadata["tablet_font_reportes_px"] = fr
    pytest.metadata["tablet_btn_movimiento_size"] = rect_mov
    pytest.metadata["tablet_btn_registrar_size"] = rect_reg

    # Afirmaciones
    assert fc >= 14, f"Font-size de 'Control de Stock' demasiado pequeño: {fc}px"
    assert fr >= 14, f"Font-size de 'Reportes' demasiado pequeño: {fr}px"

    assert rect_mov["width"] >= 48 and rect_mov["height"] >= 48, (
        f"Botón 'Movimiento de Stock' muy pequeño: {rect_mov['width']}x{rect_mov['height']}"
    )
    assert rect_reg["width"] >= 48 and rect_reg["height"] >= 48, (
        f"Botón 'Registrar Movimiento' muy pequeño: {rect_reg['width']}x{rect_reg['height']}"
    )

    assert not has_h_overflow, "Se detecta overflow horizontal en el layout de tablet"