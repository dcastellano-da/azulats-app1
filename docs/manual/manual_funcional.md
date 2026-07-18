# Manual Funcional: Plataforma de Reclutamiento Azul ATS

Este documento proporciona una explicación funcional y visual a nivel de negocio y técnico de cada una de las pantallas de **Azul ATS**, diseñadas con el sistema premium de diseño glassmorphism de Stitch.

Las imágenes correspondientes de cada pantalla han sido guardadas en esta misma carpeta (`docs/`) para su referencia.

---

## 🧭 Índice de Módulos
1. [Módulo A: Portal de Inicios de Sesión (Login)](#1-módulo-a-portal-de-inicios-de-sesión)
2. [Módulo B: Dashboard Gerencial](#2-módulo-b-dashboard-gerencial)
3. [Módulo C: Maestro de Búsquedas (Gestión de Posiciones)](#3-módulo-c-maestro-de-búsquedas)
4. [Módulo C.1: Slide-over de Alta y Edición de Búsquedas](#31-slide-over-de-alta-y-edición-de-búsquedas)
5. [Módulo D: Recruitment Management (Tablero Kanban)](#4-módulo-d-recruitment-management-tablero-kanban)
6. [Módulo E: Ajustes y Configuración del Sistema (Incluye Zona de Peligro RGPD)](#5-módulo-e-ajustes-y-configuración-del-sistema)
7. [Módulo F: Postulantes (Maestro y Registro de Candidatos)](#6-módulo-f-postulantes-maestro-y-registro-de-candidatos)
8. [Módulo F.1: Ficha de Postulante y Consola DAW (Faders de IA)](#61-ficha-de-postulante-y-consola-daw-faders-de-ia)

---

## 1. Módulo A: Portal de Inicios de Sesión

### 📸 Imagen de Referencia: `login_page.png`

![login_page.png](login_page.png)

```
Ficha Técnica:
- Ruta: /login
- Tecnología de Seguridad: Firebase Client Authentication
- Acceso: Email/Contraseña + Google OAuth
```

### 💡 Descripción Funcional
El **Portal de Inicios de Sesión** es la puerta de entrada segura al sistema. Ofrece un diseño glassmórfico de alto nivel visual que impresiona al usuario inicial con contrastes sutiles y efectos de iluminación radiales que responden dinámicamente al fondo del espacio de trabajo.

### ✨ Características Clave
*   **Inicio de Sesión por Credentials:** Campos para correo electrónico (`email`) y contraseña (`password`) con toggle interactivo para ver/ocultar los caracteres del password.
*   **Autenticación Social (Google OAuth):** Botón estilizado diseñado bajo los lineamientos corporativos para registrarse de manera directa utilizando cuentas de Google Workspace.
*   **Diseño Premium Estetizado:** Utiliza un contenedor principal traslúcido (glassmorphism panel) con bordes suaves que resalta frente al fondo `#101415`.

---

## 2. Módulo B: Dashboard Gerencial

### 📸 Imagen de Referencia: `dashboard_page.png`

![dashboard_page.png](dashboard_page.png)

```
Ficha Técnica:
- Ruta: /dashboard
- Acceso: Protegido (Filtra usuarios no autenticados en Edge + Cliente)
- Librería de Gráficos: Recharts
```

### 💡 Descripción Funcional
El **Dashboard Gerencial** sirve como un centro de mando analítico enfocado en la toma de decisiones. Ofrece información global sobre el estado de las búsquedas en curso y la distribución regional dentro del mercado laboral en España.

### ✨ Características Clave
*   **Barra de Filtros Generales:** Ubicada en la parte superior para segmentar las estadísticas según el cliente (ej. Telefónica, Santander, SEAT, Inditex) y rangos de fecha predefinidos (últimos 7 días, 30 días, año en curso).
*   **KPI Cards:** Cuatro tarjetas translúcidas con indicadores numéricos de gran escala que resumen el volumen total de búsquedas activas, postulantes en el embudo, y el lead-time promedio de contratación.
*   **Analíticas Históricas con Recharts:** Un gráfico de área suave que visualiza la carga laboral e histórica de los procesos de selección y los meses de mayor actividad.
*   **Panel de Procesos Activos:* Sección lateral con una lista rápida de posiciones, su estado interno y el tiempo transcurrido desde su última actualización.
*   **Metadatos de Seguimiento:** Tarjeta técnica que muestra el token ID actual en formato de cookies para validar sesiones seguras desde el Edge Proxy.

---

## 3. Módulo C: Maestro de Búsquedas

### 📸 Imagen de Referencia: `busquedas_page.png`

![busquedas_page.png](busquedas_page.png)

```
Ficha Técnica:
- Ruta: /busquedas
- Base de datos conectada: Google Cloud Run Server Action API (Firestore + BigQuery)
- Patrón UI: Tabla Dinámica Resiliente
```

### 💡 Descripción Funcional
El **Maestro de Búsquedas** es el inventario centralizado de las vacantes registradas en el sistema. Los reclutadores consultan, filtran y realizan la gestión integral de cada vacante técnica y administrativa.

### ✨ Características Clave
*   **Buscador Inteligente:** Barra interactiva que evalúa por texto libre el cargo, el cliente o el responsable asignado.
*   **Filtros de fase rápido:** Selector desplegable para filtrar registros basados en la fase actual de la vacante (`Preparación Previa`, `Evaluación Técnica`, `Revisión de Cliente`, `Oferta & Cierre`).
*   **Tabla de Datos Premium:** Filas hoverables que destacan el nombre de la posición, la empresa, y muestran el total de candidatos evaluados.
*   **Botón de Creación:** Acceso rápido para desplegar el formulario lateral de creación.

---

## 3.1 Slide-over de Alta y Edición de Búsquedas

### 📸 Imagen de Referencia: `busquedas_slideover.png`

![busquedas_slideover.png](busquedas_slideover.png)

```
Ficha Técnica:
- Integración: SlideOver.tsx + SearchForm.tsx
- Conectividad API: POST y PATCH Server Actions en busquedas.ts
```

### 💡 Descripción Funcional
Al hacer clic en **"Nueva Búsqueda"** (o en **"Editar"** en cualquier fila de la tabla), se desliza lateralmente un panel sobre la tabla principal sin obligar al usuario a cambiar de página, lo que proporciona una experiencia de edición fluida e ininterrumpida.

### ✨ Características Clave
*   **Formulario de Alta (Cédula de Identidad):** Configuración de campos mandatorios: Cliente corporativo, Perfil Técnico, Estado de la Fase, Responsable Operativo, Responsable de Validación y Fecha Límite.
*   **Soporte de Estados de API (Doble Canal):** Captura estados de éxito 201 (Guardado completo) y 207 (Sincronización analítica parcial en BigQuery errónea pero guardado físico real en Firestore).

---

## 4. Módulo D: Recruitment Management (Tablero Kanban)

### 📸 Imagen de Referencia: `reclutamiento_page.png`

![reclutamiento_page.png](reclutamiento_page.png)

```
Ficha Técnica:
- Ruta: /reclutamiento
- Disposición visual: Tablero Kanban (Pipeline columnas)
```

### 💡 Descripción Funcional
El panel de **Recruitment Management** permite organizar de forma ágil la fase de cada candidato postulado a los procesos de selección activos, facilitando y agilizando las interacciones del reclutador en su rutina diaria.

### ✨ Características Clave
*   **Visualización en Columnas (Pipeline):** Cuatro columnas representando los estados secuenciales estándar:
    1.  *Bandeja de Entrada* (Screening inicial)
    2.  *Evaluación Técnica* (Codificación y entrevistas técnicas)
    3.  *Revisión de Cliente* (Evaluación de perfiles por parte del cliente contratante)
    4.  *Oferta & Cierre* (Negociación final de salarios y firma)
*   **Cédulas de Candidatos:** Cada ficha muestra información detallada, incluyendo el Fit Score (porcentaje de compatibilidad técnica), el puesto solicitado, cliente y ubicación geográfica.
*   **Acciones rápidas en Hover:** Botones integrados que permiten promover ("Avanzar") o descartar ("Rechazar") un perfil de inmediato.

---

## 5. Módulo E: Ajustes y Configuración del Sistema

### 📸 Imagen de Referencia: `configuracion_page.png`

![configuracion_page.png](configuracion_page.png)

```
Ficha Técnica:
- Ruta: /configuracion
- Identidad: Super Administrador (Daniel Castellano)
```

### 💡 Descripción Funcional
Módulo centralizado para la administración de las credenciales del reclutador, zona horaria predeterminada de trabajo peninsular e insular en España, y la parametrización de alertas operacionales de los microservicios externos.

### ✨ Características Clave
*   **Tarjeta de Perfil Integrada:** Muestra los nombres, correo institucional (con soporte de enlace activo `mailto:`), rol del sistema y credenciales de acceso activas.
*   **Preferencias Regionales:** Selectores preconfigurados y focalizados al territorio español para la zona horaria (Península/Baleares y Canarias).
*   **Gestor de Notificaciones en Tiempo Real:** Interruptores dinámicos para habilitar o deshabilitar alertas sobre nuevos candidatos, notificaciones del sistema de APIs Firebase/Google Cloud Run, y procesos de asignación de vacantes.
*   **Zona de Peligro (Derecho al Olvido - RGPD):** Control especial restringido al rol de **Super Administrador**. Despliega un listado interactivo con el padrón local de candidatos registrados.
*   **Eliminación Física Definitiva (Hard Delete):** Permite invocar la purga definitiva de la base de datos de Firestore y los documentos asociados en Firebase Cloud Storage. El proceso cuenta con un modal interactivo de doble paso que describe el impacto legal del borrado físico según el reglamento de protección de datos RGPD y exige validar escribiendo en mayúsculas la palabra clave `CONFIRMAR`.
*   **Simulación de Guardado:** Botón interactivo que ejecuta animaciones de éxito y notifica la confirmación de la persistencia de datos.

---

## 6. Módulo F: Postulantes (Maestro y Registro de Candidatos)

### 📸 Imagen de Referencia: `postulantes_page.png`

![postulantes_page.png](postulantes_page.png)

```
Ficha Técnica:
- Ruta: /talento
- Estilo Visual: Glassmorphism Grid de 4 columnas
- Conectividad: API REST Cloud Run Actions (candidatos.ts)
```

### 💡 Descripción Funcional
El módulo de **Postulantes** centraliza el ingreso y visualización de candidatos espontáneos del sistema. Permite a los reclutadores examinar de forma rápida los perfiles adjuntados por vías de entrada B2C, realizar búsquedas de texto en tiempo real y filtrar los currículums recibidos según la fase de evaluación.

### ✨ Características Clave
*   **Buscador Reactivo Integrado:** Barra de entrada en caliente que busca en tiempo real por el nombre del candidato, el cargo deseado o la dirección de email.
*   **Clasificador de Fases:** Botonera superior de filtrado rápido por estados (`Todos`, `Pendiente`, `Revisado`, `Seleccionado`, `Descartado`).
*   **Tarjetas de Candidatos (Glass Grid):** Cada ficha individual presenta información relevante en diseño premium:
    *   **Identificador único:** ID correlativo (ej. `CAND-001`).
    *   **Puesto e Información de contacto:** Cargo solicitado y dirección de email configurada como enlace directo `mailto:`.
    *   **Enlaces externos:** Acceso directo al perfil de LinkedIn adjunto en nueva pestaña de navegación.
    *   **Indicador Luminoso de Estado:** Burbuja con brillo radial animado según su fase.
    *   **Control Fader de Selección:** Permite mutar / cambiar la fase del postulante en vivo con sliders responsivos rápidos (`Pen`, `Rev`, `Sel`, `Des`).
    *   **Visualizador CV directo:** Botón con icono de documento para abrir el archivo PDF cargado del candidato en una pestaña nueva.
    *   **Botón de Ficha ("Detalles"):** Redirección al panel del mezclador analítico IA de la ficha del postulante.
*   **Slide-over de Alta de Candidatos (Formulario):** Slide interactivo deslizable lateralmente para agregar un perfil manual:
    *   **Validación de Archivo CV:** Soporta Drag-and-Drop limitado exclusivamente a archivos `.pdf` con un tamaño máximo de `5MB`.
    *   **Consentimiento Legal Traceable:** Checkbox mandatorio (`acepta_privacidad`) para registrar la aceptación de términos de confidencialidad y RGPD.
    *   **Gestor de Fallos de Backend:** Cuadro de alerta roja animada para capturar e informar errores del tipo `400 Bad Request` devueltos por el servidor.

---

## 6.1 Ficha de Postulante y Consola DAW (Faders de IA)

### 📸 Imagen de Referencia: `candidato_detalle_page.png`

![candidato_detalle_page.png](candidato_detalle_page.png)

```
Ficha Técnica:
- Ruta: /talento/[id]
- Estilo Visual: Consola Mezcladora DAW (Digital Audio Workstation)
- Acceso: Clicando en "Detalles" desde la tarjeta del postulante
```

### 💡 Descripción Funcional
Muestra las calificaciones detalladas y perfil completo de un candidato específico mediante la metáfora visual premium de una consola de mezcla de audio DAW. Los aspectos del perfil son calificados en faders MIDI verticales analíticos.

### ✨ Características Clave
*   **Botón Retorno ("Volver a Postulantes"):** Navegación fluida e integrada con animación hacia el listado principal `/talento`.
*   **Ecualizador de Calificaciones (Faders de IA):** Cuatro faders MIDI interactivos de volumen mezclador para visualizar de manera gráfica las métricas calculadas por inteligencia artificial:
    1.  *Hard Skills* (Capacidad técnica y herramientas del perfil)
    2.  *Soft Skills* (Competencias interpersonales y comunicación)
    3.  *Fit Cultural* (Alineación con los valores de la empresa y cliente)
    4.  *Seniority Index* (Nivel de experiencia y madurez profesional)
*   **Acciones Directas:**
    *   *Ver CV Adjunto:* Botón interactivo para consultar el documento de currículum PDF persistido.
    *   *Descartar Postulante:* Botón de Soft Delete para cambiar de inmediato el estado del postulante a "Descartado" previniendo visualizaciones operativas ulteriores.
