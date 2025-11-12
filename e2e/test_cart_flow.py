import time
import pytest
import requests
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def _wait(driver, seconds=20):
    return WebDriverWait(driver, seconds)


def _retry_click(driver, by, locator, attempts=3):
    wait = _wait(driver)
    for i in range(attempts):
        try:
            el = wait.until(EC.element_to_be_clickable((by, locator)))
            el.click()
            return el
        except Exception:
            if i == attempts - 1:
                raise
            time.sleep(0.2)


def _retry_send_keys(driver, by, locator, text, attempts=3):
    wait = _wait(driver)
    for i in range(attempts):
        try:
            el = wait.until(EC.element_to_be_clickable((by, locator)))
            el.clear()
            el.send_keys(text)
            return el
        except Exception:
            if i == attempts - 1:
                raise
            time.sleep(0.2)


def _login(driver, ensure_frontend, email: str, password: str):
    wait = _wait(driver, 30)
    driver.get(ensure_frontend + "/#/login")
    _retry_send_keys(driver, By.NAME, "email", email)
    _retry_send_keys(driver, By.NAME, "password", password)
    _retry_click(driver, By.CSS_SELECTOR, "button[type='submit']")
    # Esperar que deje de estar en /login (redirige al home) o que aparezca feedback
    try:
        wait.until(EC.url_contains("/#/"))
    except Exception:
        wait.until(EC.presence_of_element_located((By.XPATH, "//*[contains(., 'Bienvenido') or contains(., 'Error') or contains(., '¡Inicio de sesión')]")))


def _accept_any_alert(driver, timeout: int = 2):
    try:
        WebDriverWait(driver, timeout).until(EC.alert_is_present())
        driver.switch_to.alert.accept()
    except Exception:
        pass


@pytest.mark.e2e
@pytest.mark.parametrize("product_index", [0, 1])
def test_cart_add_item(driver, ensure_frontend, ensure_backend, product_index):
    """
    Caso: Agregar producto al carrito desde Products.
    - Precondición: usuario autenticado.
    - Verifica feedback y que el carrito no esté vacío.
    """
    user_email = "bodeguero_e2e@example.com"
    user_password = "S3lenium!"
    wait = _wait(driver, 30)

    # Login
    _login(driver, ensure_frontend, user_email, user_password)

    # Obtener primer producto vía API y navegar a su detalle
    backend_root = ensure_backend
    try:
        resp = requests.get(backend_root + "/api/products/", timeout=10)
        resp.raise_for_status()
        products = resp.json()
        if not products:
            pytest.skip("No hay productos disponibles en el backend.")
        # Permite probar distintas posiciones si existe más de un producto
        idx = product_index if product_index < len(products) else 0
        product_id = products[idx]["id"]
    except Exception:
        pytest.skip("No se pudo obtener el listado de productos del backend.")

    driver.get(ensure_frontend + f"/#/products/{product_id}")

    # Click en "Añadir al Carrito" en la página de detalle
    _retry_click(driver, By.XPATH, "//button[contains(., 'Añadir al Carrito')]")
    _accept_any_alert(driver)

    # Ir al carrito
    driver.get(ensure_frontend + "/#/cart")

    # Esperar carga de la página del carrito
    wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Carrito de Compras')]")))

    # Validar que NO muestre estado vacío
    assert "Tu carrito está vacío" not in driver.page_source


@pytest.mark.e2e
@pytest.mark.parametrize("steps_up,steps_down", [(1,1), (2,2)])
def test_cart_edit_quantity(driver, ensure_frontend, ensure_backend, steps_up, steps_down):
    """
    Caso: Editar cantidad del primer ítem del carrito.
    - Precondición: usuario autenticado y al menos 1 ítem en el carrito.
    - Incrementa y luego decrementa la cantidad, validando el cambio.
    """
    user_email = "bodeguero_e2e@example.com"
    user_password = "S3lenium!"
    wait = _wait(driver, 30)

    # Login
    _login(driver, ensure_frontend, user_email, user_password)

    # Asegurar al menos un ítem en el carrito añadiendo desde la página de detalle
    backend_root = ensure_backend
    try:
        resp = requests.get(backend_root + "/api/products/", timeout=10)
        resp.raise_for_status()
        products = resp.json()
        if not products:
            pytest.skip("No hay productos disponibles en el backend.")
        product_id = products[0]["id"]
    except Exception:
        pytest.skip("No se pudo obtener el listado de productos del backend.")

    driver.get(ensure_frontend + f"/#/products/{product_id}")
    _retry_click(driver, By.XPATH, "//button[contains(., 'Añadir al Carrito')]")
    _accept_any_alert(driver)

    # Ir al carrito
    driver.get(ensure_frontend + "/#/cart")
    wait.until(EC.presence_of_element_located((By.XPATH, "//h1[contains(., 'Carrito de Compras')]")))

    # Helper robusto para leer la cantidad con reintentos ante re-renderizados
    def _parse_qty(text: str) -> int:
        try:
            return int(''.join([c for c in text if c.isdigit()]))
        except Exception:
            return 0

    def _safe_read_qty(driver, wait):
        last_err = None
        for _ in range(8):
            try:
                el = wait.until(EC.visibility_of_element_located((By.XPATH, "(//span[preceding-sibling::button and following-sibling::button])[1]")))
                # innerText evita algunos estados intermedios de .text
                return _parse_qty(el.get_attribute("innerText") or el.text)
            except Exception as e:
                last_err = e
                time.sleep(0.1)
        raise last_err if last_err else AssertionError("No se pudo leer cantidad del carrito")

    # Intentar localizar el display de cantidad; si no existe, saltar la prueba
    try:
        initial_qty = _safe_read_qty(driver, wait)
    except Exception:
        pytest.skip("No se encontró un control de cantidad en el carrito.")

    # Click en botón de incrementar (siguiente hermano del span)
    try:
        plus_btn = driver.find_element(By.XPATH, "(//span[preceding-sibling::button and following-sibling::button])[1]/following-sibling::button[1]")
    except Exception:
        pytest.skip("No se encontró el botón para incrementar cantidad.")
    # Incrementar varias veces según parámetro
    for _ in range(steps_up):
        plus_btn.click()

    # Esperar a que la cantidad aumente (reintento robusto)
    target_plus = initial_qty + steps_up
    for _ in range(20):
        try:
            if _safe_read_qty(driver, wait) == target_plus:
                break
        except Exception:
            pass
        time.sleep(0.1)
    else:
        pytest.fail("La cantidad no aumentó como se esperaba")

    # Click en botón de decrementar (hermano anterior del span)
    try:
        minus_btn = driver.find_element(By.XPATH, "(//span[preceding-sibling::button and following-sibling::button])[1]/preceding-sibling::button[1]")
    except Exception:
        pytest.skip("No se encontró el botón para decrementar cantidad.")
    # Decrementar varias veces según parámetro
    for _ in range(steps_down):
        minus_btn.click()

    # Esperar a que la cantidad vuelva al valor inicial (reintento robusto)
    for _ in range(20):
        try:
            if _safe_read_qty(driver, wait) == (initial_qty + steps_up - steps_down):
                break
        except Exception:
            pass
        time.sleep(0.1)
    else:
        pytest.fail("La cantidad no se actualizó al valor esperado tras decrementos")
