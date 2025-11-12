# Guía para ejecutar Pruebas E2E (Selenium) en Windows

Este directorio contiene la suite E2E del proyecto FERREMAS. Aquí aprenderás a preparar el entorno, instalar las dependencias de pruebas, crear un usuario staff y ejecutar los 22 casos con reportes HTML y presupuestos de performance (EP2).

## 1) Prerrequisitos

- Windows 10/11 con Visual Studio Code instalado.
- Python 3.10+ y pip (usa el mismo venv para backend y pruebas E2E).
- Node.js 18+ y npm.
- Navegador: Microsoft Edge (recomendado) y opcionalmente Firefox.
- Repositorio clonado y abierto en VS Code.

## 2) Preparar entorno (backend y frontend)

Abre dos terminales en VS Code (PowerShell recomendado).

- Terminal A (backend Django):
  1. `cd backend`
  2. Crear/activar entorno virtual si no existe:
     - `python -m venv .trae-venv`
     - `\.\ .trae-venv\Scripts\activate`
  3. Instalar dependencias backend: `pip install -r requirements.txt`
  4. Migraciones: `python manage.py migrate`
  5. Levantar servidor: `python manage.py runserver 0.0.0.0:8000`

- Terminal B (frontend React):
  1. `cd frontend`
  2. Instalar dependencias: `npm ci` (o `npm install`)
  3. Levantar dev server: `npm start`

Verifica:
- Backend: `http://localhost:8000` responde (status 200 en `/api/auth/csrf/`).
- Frontend: `http://localhost:3000` carga la aplicación.

## 3) Instalar dependencias de pruebas E2E (pytest/selenium)

En la misma Terminal A con el venv activo (`\.\ .trae-venv\Scripts\activate`), instala los paquetes de pruebas:

- `pip install pytest`
- `pip install selenium`
- `pip install pytest-html`
- `pip install pytest-metadata`
- `pip install webdriver-manager`

Notas:
- La suite usa `webdriver-manager` para descargar drivers automáticamente. Si trabajas sin internet, coloca el driver manual en `e2e/bin/msedgedriver.exe` (Edge) o `e2e/bin/geckodriver.exe` (Firefox).

## 4) Usuario administrador/staff (requerido para Bodega/Reportes)

Algunas pruebas requieren un usuario con `is_staff=True`.

Opción A — Crear superusuario (admin):
- `python manage.py createsuperuser --email admin@example.com` (define contraseña y datos).

Opción B — Script de registro y promover a staff:
- En una terminal en la raíz del repo: `python scripts/register_user.py`
- Luego entra a `http://localhost:8000/admin` con el superusuario y marca `is_staff=True` al correo creado (por ejemplo `bodeguero_e2e@example.com`).

Para que las pruebas usen el usuario staff automáticamente, exporta estas variables antes de ejecutar `pytest`:

PowerShell (Windows):
```
$env:STAFF_EMAIL="admin@example.com"
$env:STAFF_PASSWORD="LaContraseñaElegida"
```

CMD:
```
set STAFF_EMAIL=admin@example.com
set STAFF_PASSWORD=LaContraseñaElegida
```

## 5) Flags de ejecución (navegador, viewport y presupuestos EP2)

La suite soporta:

- `--browser` (edge|firefox). Por defecto: edge.
- `--viewport` (desktop|tablet|mobile). Por defecto: desktop.
- Presupuestos EP2 (umbrales en segundos):
  - `--budget-home-products` (ej. 1.5)
  - `--budget-out-feedback` (ej. 3)
  - `--budget-stock-efficiency` (ej. 5)
  - `--budget-inventory-report` (ej. 10)

Ejemplo (Edge desktop con budgets):
```
pytest e2e --browser edge --viewport desktop --budget-home-products 1.5 --budget-out-feedback 3 --budget-stock-efficiency 5 --budget-inventory-report 10 --html=e2e/selenium_report_ep2.html --self-contained-html
```

## 6) Ejecutar la suite E2E

Ejecutar toda la suite con reporte HTML:
```
pytest e2e --html=e2e/selenium_report.html --self-contained-html
```

Filtrar por marcador E2E y generar reporte:
```
pytest -m e2e e2e --html=e2e/report_full.html --self-contained-html
```

Navegador/viewport específicos:
```
pytest e2e --browser edge --viewport tablet
pytest e2e --browser firefox --viewport tablet
```

Sólo pruebas del carrito:
```
pytest e2e/test_cart_flow.py --html=e2e/report_cart_only.html --self-contained-html
```

## 7) Requisitos técnicos de la suite

- Drivers de navegador: `webdriver-manager` descarga msedgedriver/geckodriver automáticamente. Si no hay internet, la suite intentará usar `e2e/bin/msedgedriver.exe` y `e2e/bin/geckodriver.exe` si existen.
- Variables de entorno opcionales para apuntar a servicios:
  - `FRONTEND_URL` (default `http://localhost:3000`)
  - `BACKEND_URL` (default `http://localhost:8000`)
- Marcador Pytest: la suite registra el marker `e2e`, por lo que no verás warnings de marca desconocida.

## 8) Solución de problemas comunes

- “skipped” en Bodega/Reportes: configura `STAFF_EMAIL` y `STAFF_PASSWORD` y confirma acceso.
- Timeout/elementos no encontrados: revisa que frontend y backend sigan activos y accesibles.
- Driver no disponible: instala Edge/Firefox; como alternativa, coloca el binario en `e2e/bin/`.

## 9) Abrir reportes HTML

Reportes típicos:
- `e2e/selenium_report.html` (suite general)
- `e2e/selenium_report_ep2.html` (suite con presupuestos EP2)
- `e2e/report_full.html`
- `e2e/report_cart_only.html`
- `e2e/report_staff_suite.html`

Puedes abrirlos desde el explorador o con un servidor estático (opcional).

## 10) Estructura y ubicación de casos

- Casos nuevos y funcionales múltiples: `e2e/test_new_cases.py`
- Carrito: `e2e/test_cart_flow.py`
- Autenticación: `e2e/test_auth_flow.py`
- Permisos reportes: `e2e/test_reports_permissions.py`
- Reporte inventario: `e2e/test_reports_inventory.py`
- Responsive tablet: `e2e/test_responsive_tablet.py`
- Flujo tablet inventario: `e2e/test_stock_movement_tablet.py`

## 11) Checklist para ejecutar los 22 casos

1. Backend activo en `http://localhost:8000` y frontend en `http://localhost:3000`.
2. Usuario staff disponible y variables `STAFF_EMAIL`/`STAFF_PASSWORD` exportadas.
3. Venv activo (`\.\ .trae-venv\Scripts\activate`) con paquetes de pruebas instalados (sección 3).
4. Ejecuta la suite con presupuestos EP2 si deseas validar performance.
5. Revisa los reportes HTML generados y las métricas `[METRIC]` en los logs.

## 12) Script opcional (Windows)

Hay un script auxiliar en `e2e/run_e2e.ps1` que puedes adaptar para correr la suite con tus parámetros. Abre el script en VS Code, ajusta los flags y ejecútalo desde PowerShell.

---

Si algo falla, valida primero que los servidores estén activos y que el usuario staff esté configurado; luego reintenta con los comandos de esta guía.
