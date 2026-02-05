# 🏡 Mi Casa Eficiente (MCE)

**Mi Casa Eficiente** es una herramienta web interactiva diseñada para realizar auditorías energéticas residenciales simplificadas. Su objetivo es permitir a los usuarios identificar oportunidades de ahorro energético y económico en sus hogares mediante un flujo guiado de diagnóstico y simulación de mejoras.

## 📋 Descripción del Proyecto

El sistema funciona como una *Single Page Application* (SPA) que guía al usuario a través de 7 pasos lógicos para determinar el perfil energético de su vivienda. Utiliza datos climáticos geolocalizados, perfiles de consumo tipo y un inventario de equipos para calcular una "Demanda Base" y compararla con el consumo real.

### Flujo de Funcionamiento
1.  **Ubicación:** Selección de Región, Comuna y Clima (Costa, Valle, Cordillera). Determina la zona térmica.
2.  **Vivienda:** Definición de tipología (Casa/Depto), superficie, antigüedad y características constructivas.
3.  **Energéticos:** Selección de fuentes de energía utilizadas (Electricidad, Gas, Leña, Pellet, etc.).
4.  **Consumo (La Boleta):** Cálculo automático del consumo teórico vs. ingreso manual de boletas reales para calibrar el modelo.
5.  **Inventario de Equipos:** Desglose detallado de equipos por habitación (iluminación, calefacción, agua caliente) para distribuir el consumo total.
6.  **Recomendaciones:** Simulación interactiva donde el usuario selecciona mejoras (ej: Ventanas Termopanel, Aislación) y ve el impacto en tiempo real.
7.  **Resultados:** Reporte final con ahorro monetario estimado, reducción de huella de carbono (CO2) y equivalencias ambientales.

---

## 🛠️ Stack Tecnológico

La arquitectura está basada en microservicios contenerizados con Docker.

* **Frontend:**
    * HTML5, Vanilla JavaScript (ES6+).
    * **Tailwind CSS** (Estilos y diseño responsivo).
    * **Highcharts** (Visualización de datos y gráficos).
    * Servidor Web: **Nginx**.
* **Backend:**
    * **Python 3.11** + **Django 5.x**.
    * **Django REST Framework** (API RESTful).
    * Servidor de Aplicación: **Gunicorn**.
* **Base de Datos:**
    * **MariaDB 10.11**.
* **Infraestructura:**
    * **Docker** & **Docker Compose**.

---

## 🚀 Guía de Instalación y Despliegue

Sigue estos pasos para montar el proyecto en tu entorno local.

### Prerrequisitos
* Tener instalado [Docker](https://www.docker.com/get-started) y [Docker Compose](https://docs.docker.com/compose/install/).

### 1. Clonar el Repositorio
Descarga el código fuente en tu máquina y navega a la carpeta raíz.

### 2. Verificar Certificados SSL (Entorno Local)
El servicio de Frontend (Nginx) está configurado para servir tanto HTTP como HTTPS. Asegúrate de que existan los archivos de certificado en la ruta `./Front-end/`. Si no tienes certificados reales, el contenedor podría fallar o necesitas generarlos/u omitir el montaje SSL en el `docker-compose.yml`.
* Ruta esperada: `./Front-end/cert.pem` y `./Front-end/key.pem`

### 3. Levantar los Contenedores
Ejecuta el siguiente comando en la terminal (en la raíz donde está el `docker-compose.yml`):

```bash
docker-compose up --build -d
```

Este comando realizará automáticamente:
1.  Levantará la base de datos **MariaDB**.
2.  Construirá la imagen del **Backend**, ejecutará las migraciones (`migrate`) y **cargará los datos iniciales** necesarios (comunas, equipos, recomendaciones) mediante el script `load_initial_data`.
3.  Levantará el servidor **Nginx** para el frontend.

### 4. Acceder a la Aplicación

Una vez que los contenedores estén corriendo (puedes verificar con `docker ps`), accede a:

* **Aplicación Web (Frontend):** [http://localhost:8082](http://localhost:8082)
* **Panel de Administración (Backend):** [http://localhost:8000/admin](http://localhost:8000/admin) (Nota: El puerto 8000 debe estar expuesto en el compose si deseas acceder directamente, o via Nginx si está configurado el proxy). EN LA VERSIÓN MASTER ESTE SITIO SE DEBE CERRAR

---

## 🔐 Credenciales por Defecto

Configuraciones definidas en el `docker-compose.yml`:

* **Base de Datos (MariaDB):**
    * Usuario: `micasa_user`
    * Password: `FB.Energia2022`
    * Database: `MCE`
    * Puerto externo: `3307`

---

## 📡 Documentación de API (Endpoints)

El Frontend se comunica con el Backend mediante los siguientes endpoints principales:

| Método | Endpoint | Descripción |
| :--- | :--- | :--- |
| `GET` | `/mi_casa_eficiente/comunas/` | Obtiene lista de regiones y comunas. |
| `POST` | `/mi_casa_eficiente/comunas/` | **Paso 1-3:** Crea la sesión, guarda ubicación y calcula demanda inicial. |
| `PUT` | `/mi_casa_eficiente/demanda/<id>` | **Paso 4:** Actualiza flag si el usuario conoce su consumo. |
| `PUT` | `/mi_casa_eficiente/edita_consumo/<id>` | **Paso 4:** Guarda los consumos reales (boleta) ingresados por usuario. |
| `PUT` | `/mi_casa_eficiente/equipos/<id>` | **Paso 5:** Actualiza flag de edición de equipos. |
| `PUT` | `/mi_casa_eficiente/edita_equipos/<id>` | **Paso 5:** Guarda el inventario detallado de equipos y recalcula balance. |
| `PUT` | `/mi_casa_eficiente/recomendaciones/<id>`| **Paso 6:** Guarda las IDs de las recomendaciones seleccionadas. |
| `GET` | `/mi_casa_eficiente/recomendaciones_select/<id>` | **Paso 6-7:** Obtiene los resultados finales calculados (Ahorro, ROI, CO2). |

---

## 📂 Estructura del Proyecto

```text
/
├── docker-compose.yml          # Orquestación de contenedores
├── Dockerfile.backend          # Imagen de Django
├── Dockerfile.frontend         # Imagen de Nginx
├── Back-end/
│   └── GEV/
│       ├── manage.py           # CLI de Django
│       └── apps/
│           └── mi_casa_eficiente/
│               ├── api/        # Endpoints y Serializers
│               ├── models.py   # Modelos de BBDD
│               └── views.py    # Lógica de negocio
└── Front-end/
    ├── web_front/
    │   ├── html/index.html     # Punto de entrada HTML
    │   ├── js/main.js          # Lógica principal del Frontend
    │   └── css/                # Estilos Tailwind
    └── nginx.conf              # Configuración del servidor web
```

---

## 🐛 Solución de Problemas Comunes

1.  **Error de Base de Datos al iniciar:**
    * Si es la primera vez que ejecutas, asegúrate de que el volumen `mariadb_data` no tenga datos corruptos de instalaciones previas. Puedes limpiarlo con:
    ```bash
    docker-compose down -v
    ```

2.  **No cargan los datos (Comunas vacías):**
    * Verifica que el script `load_initial_data` se haya ejecutado correctamente en el contenedor `backend`. Puedes forzarlo manualmente:
        ```bash
        docker exec -it micasa_backend python manage.py load_initial_data
        ```

3.  **Problemas de CORS:**
    * Asegúrate de estar accediendo a través del puerto configurado en Nginx (8082) y no directamente al backend, para evitar problemas de dominios cruzados si no están configurados.

---
*Desarrollado para el Ministerio de Energía - Iniciativa Mi Casa Eficiente.*
