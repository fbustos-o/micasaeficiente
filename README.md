# Mi Casa Eficiente (MCE) - V16

**Mi Casa Eficiente** es una aplicación web integral diseñada para realizar calificaciones energéticas de viviendas. Permite a los usuarios estimar la demanda energética de su hogar, detallar sus equipos y recibir recomendaciones personalizadas para mejorar la eficiencia energética, todo a través de una interfaz interactiva y fácil de usar.

---

## 🚀 Arquitectura del Proyecto

El sistema utiliza una arquitectura de microservicios contenerizada con Docker, garantizando un despliegue sencillo y consistente.

*   **Frontend**: Servido por **Nginx**. Contiene la aplicación web (HTML, CSS, JS plano) que interactúa con el usuario. Maneja certificados SSL para navegación segura (HTTPS).
*   **Backend**: Construido con **Django** y **Django REST Framework**. Procesa la lógica de negocio, realiza los cálculos energéticos y gestiona la API.
*   **Base de Datos**: **MariaDB**. Almacena la información de comunas, datos climáticos, inventario de equipos y las sesiones de los usuarios.

---

## 🛠️ Requisitos e Instalación

### Pre-requisitos
*   [Docker Desktop](https://www.docker.com/products/docker-desktop) instalado y ejecutándose.

### Pasos para Ejecutar

1.  **Ubicarse en la carpeta raíz** del proyecto (`MCE`).
2.  **Iniciar los servicios**:
    Abre una terminal (PowerShell o CMD) y ejecuta:
    ```bash
    docker-compose up --build
    ```
    *Este comando descargará las imágenes necesarias, construirá el backend y frontend, iniciará la base de datos y cargará automáticamente los datos base (comunas, equipos, etc.).*

3.  **Acceder a la aplicación**:
    Abre tu navegador y visita:
    👉 **https://localhost:4453**
    
    *(Nota: Es normal ver una advertencia de seguridad debido al certificado SSL autofirmado de desarrollo. Debes aceptarla para continuar).*

---

## 📖 Flujo de Uso y Funcionalidad

La aplicación guía al usuario a través de un proceso lineal de 5 pasos:

### 1. Identificación y Ubicación (`/comunas/`)
*   **Usuario**: Selecciona su Región, Comuna y Clima específico. Ingresa datos de la vivienda (Tipo, Superficie, Año de construcción).
*   **Sistema**: Determina la Zona Térmica y la normativa aplicable (NCh 1079). Crea una nueva sesión de evaluación.

### 2. Demanda Energética (`/demanda/` y `/edita_consumo/`)
*   **Usuario**: Indica qué combustibles usa (Electricidad, Gas Natural, Leña, etc.).
*   **Opciones**:
    *   *Si conoce su consumo*: Ingresa los montos mensuales de sus boletas.
    *   *Si NO conoce su consumo*: El sistema realiza una estimación basada en la superficie y características ingresadas.

### 3. Equipamiento (`/equipos/`)
*   **Sistema**: Propone un inventario de equipos "base" (Cocina, Refrigerador, Calefacción) típico para el tipo de hogar.
*   **Usuario**: Revisa y edita este inventario, ajustando cantidades y tipos de artefactos para reflejar la realidad de su hogar.

### 4. Recomendaciones (`/recomendaciones/`)
*   **Sistema**: Calcula medidas de eficiencia energética viables (ej. "Mejorar aislación de techo", "Cambiar a iluminación LED", "Renovar refrigerador").
*   **Usuario**: Selecciona cuáles de estas recomendaciones le interesa implementar.

### 5. Resultados (`/equipos_select/` o Resultados Finales)
*   **Sistema**: Genera un reporte final comparativo.
    *   Muestra el ahorro potencial en dinero ($CLP).
    *   Estima la reducción de emisiones de CO2.
    *   Presenta gráficos comparativos entre la situación "Base" y la situación "Eficiente".

---

## 📡 Documentación de API (Backend)

Todos los endpoints se encuentran bajo el prefijo `/mi_casa_eficiente/`.

### Gestión de Sesión y Ubicación
| Endpoint | Método | Descripción | Payload / Parametros |
| :--- | :---: | :--- | :--- |
| `comunas/` | `GET` | Obtiene lista de Regiones y Comunas. | - |
| `comunas/` | `POST` | Inicia una evaluación. | `{id_comuna, clima, vivienda, superficie, ...}` |

### Demanda y Consumo
| Endpoint | Método | Descripción | Payload / Parametros |
| :--- | :---: | :--- | :--- |
| `demanda/<pk>` | `GET` | Obtiene estado de demanda. | - |
| `demanda/<pk>` | `PUT` | Actualiza flag "¿Conoce su consumo?". | `{conoce_consumo: true/false}` |
| `edita_consumo/<pk>` | `GET` | Obtiene perfiles de consumo. | - |
| `edita_consumo/<pk>` | `PUT` | Guarda datos mensuales reales. | `{con_elec: [...], con_gn: [...]}` |

### Equipamiento
| Endpoint | Método | Descripción | Payload / Parametros |
| :--- | :---: | :--- | :--- |
| `equipos/<pk>` | `GET` | Obtiene inventario de equipos propuesto. | - |
| `equipos/<pk>` | `PUT` | Actualiza flag "¿Edita equipos?". | `{ha_editado_equipos: true/false}` |
| `edita_equipos/<pk>` | `PUT` | Guarda cambios en el inventario. | `{equipos: [...]}` |

### Resultados
| Endpoint | Método | Descripción | Payload / Parametros |
| :--- | :---: | :--- | :--- |
| `recomendaciones/<pk>` | `GET` | Obtiene lista de recomendaciones calculadas. | - |
| `recomendaciones/<pk>` | `PUT` | Guarda las recomendaciones seleccionadas. | `{seleccion: [...]}` |
| `recomendaciones_select/<pk>` | `GET` | Obtiene el reporte final priorizado. | - |

---

## 📁 Estructura de Archivos Clave

*   **`docker-compose.yml`**: Orquestación de servicios y redes.
*   **`Back-end/GEV/apps/mi_casa_eficiente/`**:
    *   `api/urls.py`: Mapeo de rutas API.
    *   `api/api.py`: Lógica de los endpoints (Views).
    *   `api/serializers.py`: Lógica del negocio y validación de datos.
    *   `management/commands/load_initial_data.py`: Script de carga automática de datos.
*   **`Front-end/web_front/`**:
    *   `js/main.js`: Lógica principal del Frontend, manejo de estado y llamadas a API.
    *   `html/index.html`: Estructura principal de la web.

