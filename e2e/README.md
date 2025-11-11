# Guía para ejecutar Pruebas E2E (Selenium) en VS Code

Este directorio contiene la suite E2E del proyecto FERREMAS. Aquí aprenderás a ejecutar las pruebas manualmente desde la terminal de Visual Studio Code en Windows, incluyendo cómo preparar el entorno, crear un usuario admin/staff y generar reportes HTML.

## 1) Prerrequisitos

- Windows 10/11 con Visual Studio Code instalado.
- Python 3.10+ y pip.
- Node.js 18+ y npm.
- Navegadores: Microsoft Edge (recomendado) y opcionalmente Firefox.
- Clonar este repositorio y abrirlo en VS Code.

## 2) Levantar el proyecto (frontend y backend)

Abre dos terminales en VS Code.

- Terminal A (backend Django):
  1. `cd backend`
  2. Crear y activar entorno virtual si no existe:
     - `python -m venv .trae-venv`
     - `.\.trae-venv\Scripts\activate`
  3. Instalar dependencias: `pip install -r requirements.txt`
  4. Migraciones: `python manage.py migrate`
  5. Levantar servidor: `python manage.py runserver 0.0.0.0:8000`

- Terminal B (frontend React):
  1. `cd frontend`
  2. Instalar dependencias: `npm ci` (o `npm install`)
  3. Levantar dev server: `npm start`

Verifica:
- Backend: `http://localhost:8000` responde (status 200 en `/api/auth/csrf/`).
- Frontend: `http://localhost:3000` carga.

## 3) Usuario administrador/staff para pruebas (opcional pero recomendado)

Algunas pruebas de Bodega/Reportes requieren un usuario con `is_staff=True`.

Opción A — Crear superusuario (admin) vía Django:
1. En la Terminal A con el venv activo: `python manage.py createsuperuser --email admin@example.com`
2. Define contraseña y datos solicitados. Este usuario tendrá `is_staff` y `is_superuser`.

Opción B — Registrar un usuario normal por API (script de ejemplo) y promoverlo en admin:
1. En una terminal nueva en la raíz del repo: `python scripts/register_user.py`
2. Entra a `http://localhost:8000/admin` con tu superusuario y marca `is_staff=True` y rol `bodeguero` o `admin` para el correo creado (`bodeguero_e2e@example.com`).

Para que algunas pruebas usen el usuario staff automáticamente, exporta estas variables de entorno (nueva terminal o antes de ejecutar pytest):

PowerShell (Windows):
```
$env:STAFF_EMAIL="admin@example.com"
$env:STAFF_PASSWORD="LaContraseñaElegida"
```

CMD (alternativa):
```
set STAFF_EMAIL=admin@example.com
set STAFF_PASSWORD=LaContraseñaElegida
```

## 4) Cómo ejecutar las pruebas E2E

Recomendado: ejecutar desde la raíz del repo en una terminal nueva (el backend y frontend deben seguir corriendo en sus terminales).

- Ejecutar toda la suite con reporte HTML auto contenido:
```
pytest e2e --html=e2e/selenium_report.html --self-contained-html
```

- Ejecutar solo las pruebas E2E marcadas y generar reporte específico:
```
pytest -m e2e e2e --html=e2e/report_full.html --self-contained-html
```

- Ejecutar con navegador y viewport específicos (Edge por defecto):
```
pytest e2e --browser edge --viewport desktop
pytest e2e --browser edge --viewport tablet
pytest e2e --browser firefox --viewport tablet
```

- Ejecutar únicamente pruebas del carrito:
```
pytest e2e/test_cart_flow.py --html=e2e/report_cart_only.html --self-contained-html
```

## 5) Requisitos técnicos de la suite

- Drivers de navegador: `webdriver-manager` descarga msedgedriver/geckodriver automáticamente. Si no hay internet, la suite intentará usar `e2e/bin/msedgedriver.exe` y `e2e/bin/geckodriver.exe` si existen.
- Variables de entorno opcionales para apuntar a servicios:
  - `FRONTEND_URL` (default `http://localhost:3000`)
  - `BACKEND_URL` (default `http://localhost:8000`)
- Marcador Pytest: la suite registra el marker `e2e`, por lo que no verás warnings de marca desconocida.

## 6) Solución de problemas comunes

- Mensajes "skipped" en pruebas de Bodega/Reportes: asegúrate de tener un usuario `is_staff` y haber exportado `STAFF_EMAIL` y `STAFF_PASSWORD` antes de ejecutar.
- Timeout/elementos no encontrados: confirma que el frontend y backend siguen levantados y accesibles.
- Driver no disponible: instala Edge/Firefox. Alternativamente, coloca el driver en `e2e/bin/`.

## 7) Abrir reportes HTML generados

Los reportes se guardan en `e2e/*.html`. Puedes abrirlos desde VS Code (click derecho > Open With Live Server) o desde el explorador de archivos. Ejemplos:
- `e2e/selenium_report.html`
- `e2e/report_full.html`
- `e2e/report_cart_only.html`

## 8) Ejemplos de comandos rápidos (copiar/pegar)

PowerShell — correr suite completa con staff:
```
$env:STAFF_EMAIL="admin@example.com"; $env:STAFF_PASSWORD="LaContraseñaElegida"; pytest e2e --html=e2e/selenium_report.html --self-contained-html
```

Edge tablet (pruebas UI responsivas):
```
pytest e2e --browser edge --viewport tablet --html=e2e/report_tablet.html --self-contained-html
```

Firefox tablet (si tienes geckodriver o internet para descargarlo):
```
pytest e2e --browser firefox --viewport tablet --html=e2e/report_firefox_tablet.html --self-contained-html
```

## 9) Estructura y ubicación de casos

- Casos nuevos y funcionales múltiples: `e2e/test_new_cases.py`
- Carrito: `e2e/test_cart_flow.py`
- Autenticación: `e2e/test_auth_flow.py`
- Permisos reportes: `e2e/test_reports_permissions.py`
- Reporte inventario: `e2e/test_reports_inventory.py`
- Responsive tablet: `e2e/test_responsive_tablet.py`
- Flujo tablet inventario: `e2e/test_stock_movement_tablet.py`

---

Si te atoras ejecutando, valida primero que los servidores estén activos y que el usuario staff esté configurado, luego reintenta con los comandos de la sección 8.
