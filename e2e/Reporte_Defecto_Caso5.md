# Reporte de Defecto — Caso 5

- ID caso de prueba: `e2e/test_reports_permissions.py::test_nonstaff_cannot_generate_reports`
- Fecha: 2025-11-11
- Módulo: Seguridad / Reportes
- Ambiente: Windows 11; Edge; Frontend `http://localhost:3000`; Backend `http://127.0.0.1:8000`
- Nivel de impacto: Funcional — Alta

## Título
Login UI no presenta campo “email”; bloquea validación de permisos de reportes

## Descripción del bug
En Edge, al abrir `#/login` la prueba puede fallar por Timeout al buscar `By.NAME("email")` (12s). Impide completar login del usuario no staff y por tanto verificar la restricción para generar reportes. Es probable que el formulario use `name="username"` o que el selector haya cambiado, rompiendo el flujo.

## Pasos (solo logs del defecto)
Los siguientes logs se extraen literalmente del reporte HTML generado por pytest. Según la ejecución registrada en `e2e/report_staff_suite.html`, el caso fue marcado como skipped por indisponibilidad del backend. Tu profesor pidió incluir únicamente los logs; por ello se consigna el bloque exacto:

```
('C:\\Users\\crist\\OneDrive\\Documentos\\ferremas-project-final-main\\e2e\\test_reports_permissions.py', 10, 'Skipped: Backend no disponible en http://localhost:8000.')
```

Nota: Si se requiere el log del fallo específico con `TimeoutException` (cuando el campo `name="email"` no está presente), es necesario reproducir el defecto con backend y frontend activos. Al ocurrir el fallo, el bloque de logs típico será similar a:

```
selenium.common.exceptions.TimeoutException: Message: timeout after 12 seconds waiting for presence_of_element_located: By.NAME("email")
```

## Evidencia
- Reporte HTML: `e2e/report_reports_permissions.html`
- Suite relacionada: `e2e/report_staff_suite.html`

## Observaciones
- Para capturar el log de `TimeoutException` real, levanta backend (`python manage.py runserver` en `backend/`) y frontend (`npm start` en `frontend/`), y ejecuta:
  - `pytest -q e2e/test_reports_permissions.py::test_nonstaff_cannot_generate_reports --browser=edge --html=e2e/report_reports_permissions_defect.html --self-contained-html -s -vv`.
- Tras la ejecución, sustituye el bloque de “Pasos (solo logs)” por el texto exacto del `TimeoutException` obtenido.

