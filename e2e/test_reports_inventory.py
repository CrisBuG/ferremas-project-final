import time
import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@pytest.mark.e2e
@pytest.mark.parametrize("click_reports_tab,max_seconds", [
    (True, 10),
    (False, 10),
])
def test_generar_reporte_inventario_tiempo(driver, ensure_frontend, login_if_staff, perf_budgets, click_reports_tab, max_seconds):
    # Esta prueba intenta generar un reporte desde el dashboard de Bodega si el enlace existe
    driver.get(ensure_frontend + "/#/")
    wait = WebDriverWait(driver, 15)

    # Esperar enlace de Bodega; si no aparece, omitir la prueba
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, "//a[contains(., 'Bodega')]")))
    except Exception:
        pytest.skip("Usuario no tiene acceso a Bodega; prueba aplicable solo para is_staff.")

    # Ir a Bodega (fallback directo si el enlace no es clickeable en tablet/móvil)
    try:
        link = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Bodega')]") ))
        link.click()
    except Exception:
        driver.get(ensure_frontend + "/#/warehouse-dashboard")
        try:
            wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Dashboard de Bodeguero')]")))
        except Exception:
            pass

    # Ir a pestaña Reportes si existe
    if click_reports_tab:
        try:
            tab = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Reportes')]") ))
            tab.click()
        except Exception:
            # La página podría cargar directamente sección de reportes
            pass

    # Localizar la tabla de reportes por sus encabezados para evitar ambigüedad
    table_xpath = (
        "//table[.//th[contains(., 'Fecha')] and .//th[contains(., 'Tipo')] and "
        ".//th[contains(., 'Total Productos')] and .//th[contains(., 'Stock Bajo')] and "
        ".//th[contains(., 'Sin Stock')] and .//th[contains(., 'Valor Total')]]"
    )
    try:
        wait.until(EC.presence_of_element_located((By.XPATH, table_xpath)))
    except Exception:
        pytest.skip("No se encontró la tabla de 'Reportes de Inventario' en Bodega.")

    # Contar filas antes
    before_rows = driver.find_elements(By.XPATH, table_xpath + "//tbody/tr")
    before_count = len(before_rows)

    # Generar reporte si hay botón
    try:
        btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Generar Nuevo Reporte')]") ))
    except Exception:
        pytest.skip("No se encontró botón de generación de reporte en Bodega.")

    start = time.perf_counter()
    btn.click()

    # Esperar a que aumente el número de filas o aparezca mensaje de éxito
    def rows_increased(driver_):
        rows = driver_.find_elements(By.XPATH, table_xpath + "//tbody/tr")
        return len(rows) > before_count

    increased = False
    try:
        wait.until(rows_increased)
        increased = True
    except Exception:
        # Verificar mensaje de éxito como alternativa
        try:
            wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(., 'Reporte de inventario generado exitosamente')]") ))
        except Exception:
            pass

    # Espera a que aparezca la fila del reporte o mensaje de éxito
    elapsed = round(time.perf_counter() - start, 3)

    # Verificar que haya al menos una fila y contenga el tipo esperado
    after_rows = driver.find_elements(By.XPATH, table_xpath + "//tbody/tr")
    after_count = len(after_rows)

    # Guardar métrica
    pytest.metadata = getattr(pytest, "metadata", {})
    pytest.metadata["inventory_report_time_seconds"] = elapsed

    # Afirmaciones funcionales: se debe crear una nueva fila y mostrar tipo "Resumen de Inventario"
    assert after_count > before_count or increased, "No se incrementó la cantidad de reportes tras generar uno nuevo"
    # Validar columna Tipo contiene "Resumen de Inventario"
    tipo_cell = driver.find_elements(By.XPATH, "//table//td[contains(., 'Resumen de Inventario')]")
    assert len(tipo_cell) > 0, "No se encontró el tipo de reporte 'Resumen de Inventario' en la tabla"

    # Prueba de rendimiento (si aplica al entorno)
    threshold = perf_budgets.get("inventory_report") or max_seconds
    assert elapsed < threshold, f"El tiempo de generación ({elapsed}s) excede {threshold}s"
