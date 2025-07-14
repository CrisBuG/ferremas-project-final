## Requisitos Previos
- Node.js (v16 o superior)
- npm (v8 o superior)                              
- Python (v3.8 o superior)
- pip (gestor de paquetes de Python)
- Git (opcional, para clonar el repositorio)

- ferremas-project-final/
├── backend/         # Aplicación Django
└── frontend/        # Aplicación React

## nstalación Manual
### Backend (Django)
1. Navega al directorio del backend:
```
cd backend
```
2. Crea un entorno virtual (recomendado):
```
python -m venv venv
```
3. Activa el entorno virtual:
- En Windows:
```
venv\Scripts\activate
```
- En macOS/Linux:
```
source venv/bin/activate
```
4. Instala las dependencias:
```
pip install -r requirements.txt
```
5. Configura las variables de entorno (crea un archivo .env en el directorio backend)


   6. Ejecuta las migraciones:
```
python manage.py migrate
```
7. Inicia el servidor:
```
python manage.py runserver


### Frontend (React)
1. Navega al directorio del frontend:
```
cd frontend
```
2. Instala las dependencias:
```
npm install
```
3. Configura las variables de entorno (crea un archivo .env en el directorio frontend)
4. Inicia la aplicación:
```
npm start
```
```
