# Pruebas E2E con Selenium

Este paquete contiene pruebas E2E para el proyecto FERREMAS. Las pruebas cubren:

- Registro y login de usuario (flujo completo)
- Redirección de rutas protegidas sin autenticación
- Visibilidad y acceso por rol (cliente vs staff)
- Tiempos de generación de reportes en Bodega

## Requisitos

- Backend corriendo en `http://localhost:8000` (Django)
- Frontend corriendo en `http://localhost:3000` (React)
- Edge instalado (Windows). Se usa `webdriver-manager` para descargar el driver.

## Ejecución

```bash
# En Windows PowerShell, dentro de backend/.venv
pytest -q e2e
```

Si el frontend o backend no está disponible, las pruebas se marcarán como `skipped` con una razón clara.

## Reporte HTML

Para generar reporte HTML:

```bash
pytest e2e --html=e2e/selenium_report.html --self-contained-html
```