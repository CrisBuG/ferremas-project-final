Objetivo

Levantar backend y frontend en local, crear datos y usuario staff, y ejecutar los 22 casos E2E con Selenium generando evidencias y reportes.
Prerrequisitos

Python 3.10+ con pip disponible.
Node.js 18+ y npm.
Navegador Microsoft Edge o Firefox instalado.
PowerShell con permisos para ejecutar scripts.
Puertos disponibles: 8000 (backend) y 3000 o 3001 (frontend).
1) Preparar Backend (Django)

cd backend
Crear y activar entorno virtual:
python -m venv .venv
.\.venv\Scripts\activate
Instalar dependencias:
pip install -r requirements.txt
Aplicar migraciones:
python manage.py migrate
Crear usuario staff para las pruebas (se solicitará correo/usuario/clave; usar los de abajo):
python manage.py createsuperuser
Usuario: bodeguero_e2e
Email: bodeguero_e2e@example.com
Password: S3lenium!
Poblar datos de ejemplo (categorías/productos/imágenes):
python products\populate_db_safe.py
Nota: Ejecuta este comando desde el directorio backend para evitar errores de importación.
2) Arrancar Backend

Desde backend (con el venv activado):
python manage.py runserver 8000
Verificar en el navegador: http://127.0.0.1:8000/api/auth/csrf/ responde 200.
3) Preparar y Arrancar Frontend (React)

En otra ventana/terminal:
cd frontend
npm install
npm start
El dev server abrirá http://localhost:3000/. Si 3000 está ocupado, usará http://localhost:3001/.
4) Configurar URLs para las pruebas

Si el frontend corre en 3000, no hace falta configurar nada. Si corre en 3001, asigna las variables en PowerShell antes de ejecutar las pruebas:
$env:FRONTEND_URL = 'http://localhost:3001'
$env:BACKEND_URL = 'http://localhost:8000'
Por defecto, las pruebas usan:
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8000
5) Ejecutar la Suite E2E completa (22 casos)

Desde la raíz del repo (ferremas-project-final-main), con backend y frontend ya activos:
pytest -q e2e -m e2e
Opcional: generar reporte HTML auto-contenido:
pytest e2e --html e2e/selenium_report.html --self-contained-html
Opcional: elegir navegador y viewport (por defecto Edge headless y “desktop”):
Edge desktop: pytest -q e2e -m e2e --browser edge --viewport desktop
Firefox tablet: pytest -q e2e -m e2e --browser firefox --viewport tablet
Mobile: pytest -q e2e -m e2e --browser edge --viewport mobile
6) Qué pruebas se ejecutan (22 casos)

Autenticación y registro: test_auth_flow.py (redirect sin sesión; register+login).
Acceso por rol: test_access_control.py (cliente sin dashboards; acceso protegido).
Permisos en reportes: test_reports_permissions.py (usuario no-staff no ve Bodega/Admin/Contabilidad ni botón “Generar Nuevo Reporte”).
Reporte inventario: test_reports_inventory.py (genera reporte, valida tipo “Resumen de Inventario” y mide tiempo).
Carrito: test_cart_flow.py (agregar producto; editar cantidad).
Casos nuevos funcionales (navegación, ajustes, salidas, devoluciones, CSV): test_new_cases.py (test_cp_func_001 a test_cp_func_008).
No funcionales / UX / Performance: test_new_cases.py, test_responsive_tablet.py, test_stock_movement_tablet.py (cp_nfn_001, 003, 004, 006, 007, 010).
Todos los tests están marcados con @pytest.mark.e2e y se filtran con -m e2e.
7) Evidencias y Reportes

Reporte HTML consolidado: e2e/selenium_report.html (si ejecutas con --html).
Logs rápidos:
e2e/pytest_suite_last.txt
e2e/pytest_last.txt
Reportes puntuales de corridas anteriores:
e2e/report_full.html, e2e/report_cart.html, e2e/report_reports_permissions.html.
8) Métricas que capturan los tests

Login: login_time_seconds y login_button_disabled_initial.
Reporte de inventario: inventory_report_time_seconds (< 10s).
No-staff login: nonstaff_login_time_seconds.
Navegación Home->Products: home_to_products_time_seconds (< 1.5s).
Registro de movimiento (Entrada): cp_nfn_001_time_seconds (< 5s).
Feedback en Salida: cp_nfn_004_out_time_seconds (< 3s).
Tablet legibilidad y tamaños: tablet_font_control_px, tablet_font_reportes_px, tablet_btn_movimiento_size, tablet_btn_registrar_size.
9) Solución de Problemas

Frontend “no disponible”:
Verifica que el dev server esté activo y que la URL coincida con FRONTEND_URL.
Si corre en 3001, exporta $env:FRONTEND_URL = 'http://localhost:3001'.
Backend “no disponible”:
Asegura python manage.py runserver 8000 activo y migraciones aplicadas.
Comprueba http://127.0.0.1:8000/api/auth/csrf/ (debe responder 200).
Usuario staff:
Si alguna prueba se omite por falta de acceso a “Bodega”, confirma que el usuario bodeguero_e2e@example.com es staff (creado con createsuperuser).
Driver del navegador:
Edge: se usa e2e\bin\msedgedriver.exe si está presente; de lo contrario se descarga automáticamente.
Firefox: se intentará geckodriver.exe local o descarga automática si webdriver_manager está disponible.
Warnings de marca e2e:
Ya está registrado en pytest.ini y en conftest.py. Si aparecen warnings, asegúrate de ejecutar las pruebas desde la raíz del repo.
10) Comandos útiles por grupos (opcional)

Solo funcionales:
pytest -q e2e -m e2e -k "func"
Solo no funcionales/UX/performance:
pytest -q e2e -m e2e -k "nfn"
Un archivo específico (por ejemplo, carrito):
pytest -q e2e\test_cart_flow.py -m e2e
