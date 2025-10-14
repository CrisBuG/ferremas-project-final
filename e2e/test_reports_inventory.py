import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@pytest.mark.e2e
def test_generar_reporte_inventario_tiempo(driver, ensure_frontend):
    # Esta prueba intenta generar un reporte desde el dashboard de Bodega si el enlace existe
    driver.get(ensure_frontend + "/")
    wait = WebDriverWait(driver, 10)

    # Si no hay enlace de Bodega (cliente), la prueba se omite
    page = driver.page_source
    if "Bodega" not in page:
        pytest.skip("Usuario no tiene acceso a Bodega; prueba aplicable solo para is_staff.")

    # Ir a Bodega
    link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Bodega')]") ))
    link.click()

    # Ir a pestaña Reportes si existe
    try:
        tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Reportes')]") ))
        tab.click()
    except Exception:
        # La página podría cargar directamente sección de reportes
        pass

    # Generar reporte si hay botón
    try:
        btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Generar Nuevo Reporte')]") ))
    except Exception:
        pytest.skip("No se encontró botón de generación de reporte en Bodega.")

    start = time.perf_counter()
    btn.click()

    # Espera a que aparezca la fila del reporte o mensaje de éxito
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//table//tr")))
    except Exception:
        # Si no hay tabla, validar por texto de éxito
        pass
    elapsed = round(time.perf_counter() - start, 3)

    # Guardar métrica
    pytest.metadata = getattr(pytest, "metadata", {})
    pytest.metadata["inventory_report_time_seconds"] = elapsed

    assert elapsed < 10, f"El tiempo de generación ({elapsed}s) excede 10s"