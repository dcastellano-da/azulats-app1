# Azul ATS - Plataforma de Reclutamiento (Frontend)

Este repositorio contiene la SPA y la interfaz de usuario de **Azul ATS**, construida con tecnologías modernas y alineada con las visuales premium y glassmorphism del sistema de diseño Stitch.

## Tecnologías Utilizadas
*   **Core:** [Next.js 16 (App Router)](https://nextjs.org/) & [React 19](https://react.dev/)
*   **CSS / Estilos:** [Tailwind CSS v4](https://tailwindcss.com/)
*   **Autenticación:** [Firebase Client SDK](https://firebase.google.com/) (con inicio de sesión mediante Google) e integración para ambiente local (Demo Mock)
*   **Visualización:** [Recharts](https://recharts.org/) (Gráficos interactivos de analíticas)
*   **Iconos:** Lucide React

---

## Estructura del Proyecto
```text
azulats-app1/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── KpiCards.tsx       # Tarjetas rápidas de indicadores (Volumen, Tiempos, Candidatos)
│   │   │   ├── MetricsChart.tsx   # Gráfico de rendimiento de búsquedas históricas (Recharts)
│   │   │   ├── SlideOver.tsx      # Slide-over contenedor lateral dinámico
│   │   │   └── CandidatoForm.tsx  # Formulario del Postulante (CV PDF <5MB opcional, floating labels, RGPD)
│   │   ├── globals.css            # Estilos globales y tokens del Stitch Design System
│   │   ├── layout.tsx             # Layout base, tipografía Google Font Manrope
│   │   ├── dashboard/page.tsx     # Dashboard Gerencial con filtros temporales y de clientes
│   │   ├── login/page.tsx         # Interfaz Premium Glassmorphic de inicio de sesión
│   │   ├── talento/
│   │   │   ├── page.tsx           # Talent Mixer (Grid responsive de candidatos con filtros)
│   │   │   └── [id]/page.tsx      # Ficha del Candidato (DAW Console faders de métricas IA)
│   │   └── configuracion/page.tsx # Panel de Ajustes y "Zona de Peligro" (Derecho al Olvido)
│   ├── types/
│   │   └── screening.ts          # Interfaces TypeScript para Criterios de Screening y Resultados IA
│   ├── actions/
│   │   ├── busquedas.ts           # Server Actions para llamadas REST a búsquedas (incluye criterios_screening)
│   │   ├── candidatos.ts          # Server Actions para crear, actualizar y borrar postulantes
│   │   └── pipeline.ts            # Server Actions para Kanban, inferencia de IA y screening (Human-in-the-loop)
│   ├── lib/
│   │   └── firebase/
│   │       ├── config.ts          # Singleton de inicialización Firebase
│   │       └── auth.ts            # Métodos de autenticación y manejo de cookies
│   └── proxy.ts                   # Seguridad Edge de rutas en Next.js 16 (Cookie check guard)
```

---

## Configuración y Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto para definir la conexión con la API de backend en Cloud Run y las claves de Firebase:

```env
# URL Base del Microservicio REST de Azul ATS en Google Cloud Run
NEXT_PUBLIC_ATS_API_URL=https://api-azulats-yur42lfa-ew.a.run.app
# Alternativa compatible: NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1

# Flag de Modo Mock para Desarrollo Local y QA (true = usar mocks locales, false/no definido = backend real)
NEXT_PUBLIC_USE_MOCKS=false

# Claves Cliente de Firebase Auth
NEXT_PUBLIC_FIREBASE_API_KEY=tu_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_firebase_app_id
```

### Control de Mocks y Conexión Backend (`NEXT_PUBLIC_USE_MOCKS`)

* **Uso en Desarrollo Local / QA (`NEXT_PUBLIC_USE_MOCKS=true`):** Al activar esta variable en `true`, la aplicación intercepta las acciones de búsquedas (`crearBusquedaAPI`, `getBusquedasAPI`) y retorna datasets estáticos sin realizar llamadas HTTP de red. Además, renderizará un indicador visual destacado (**`⚠️ MOCKS ACTIVOS`**) en la interfaz de usuario.
* **Comportamiento en Producción (`NEXT_PUBLIC_USE_MOCKS=false` o sin definir):** La aplicación ejecutará la comunicación HTTP real (`POST`, `GET`, `PATCH`) hacia el servicio en Cloud Run definido en `NEXT_PUBLIC_ATS_API_URL`. Si se produce una falla de red o error de servidor, no se realizará ningún fallback silencioso a mocks; la UI capturará el error e informará claramente al usuario mediante un banner de alerta (`AlertCircle`).

> [!NOTE]
> Para facilitar las pruebas visuales y el desarrollo local rápido, la pantalla de inicio de sesión incluye una pestaña **"Panel Demo"** (Mock Mode). Este modo permite el ingreso con cualquier credencial de correo y password simulada sin llamadas API de red a Firebase, permitiendo una maqueta preliminar 100% funcional.

---

## Reglas de Redirección y Seguridad (Doble Capa de Protección)
Hemos establecido un esquema de protección híbrida de doble capa (Edge + Cliente):
1.  **Capa Edge (Servidor - `src/proxy.ts`):** Un interceptor a nivel de Edge (que reemplaza a la convención obsoleta `middleware.ts` en Next.js 16) evalúa el tráfico entrante. Si un usuario sin la cookie `azul_ats_token` intenta acceder a rutas privadas (`/dashboard`, `/busquedas`, `/reclutamiento`, `/configuracion`, `/talento`), es redirigido automáticamente a `/login`. Del mismo modo, un usuario autenticado que visite `/login` es reenviado a `/dashboard`.
2.  **Capa Cliente (React - React Hook `useAuth`):** Para mitigar bypasses y cookies falsas inyectadas localmente, las vistas protegidas (`/dashboard`, `/busquedas`, `/reclutamiento`, `/configuracion`, `/talento`) usan el hook `useAuth()` de React. Si el token expira o Firebase confirma que el usuario es nulo (`!user`), un efecto reactivo fuerza la redirección en el navegador hacia `/login` de inmediato, bloqueando la renderización de la maqueta y mostrando un spinner de seguridad.

---

## Datos Técnicos
*   **API Client Integrado (Cloud Run):** Comunicación REST directa desde el cliente hacia la API en Google Cloud Run (`src/actions/busquedas.ts`) para la creación de búsquedas, inyectando dinámicamente el JWT del usuario de Firebase en el header `Authorization: Bearer <token>`.
*   **Mesa de Control de Candidatos (`src/actions/candidatos.ts`):** Controlador Server Action unificado para crear, actualizar y borrar postulantes. Incluye validación local estructurada (consentimiento legal `acepta_privacidad: true` obligatorio, limitación y rechazo en caliente de archivos que no sean PDF o superen 5MB) y base de datos simulada en memoria (Mock fallback) en fallos de red.
*   **Borrado Físico (Derecho al Olvido - RGPD):** Lógica integrada en `eliminarCandidatoAPI` para purgar definitivamente el expediente de la base de datos (Firestore/SQL) y eliminar el archivo adjunto físico de Cloud Storage en caso de invocar el borrado Hard Delete, diferenciado del Soft Delete (cambio a estado "Descartado").
*   **Manejo Asíncrono de Respuestas y Multi-Status (207):** El componente de formulario de alta `SearchForm.tsx` valida y captura de forma explícita las respuestas 201 (guardado total), 207 (Multi-Status: guardado local con falla de réplica analítica) y alertas de error tipo 400/500.
*   **Firebase Authentication:** Integración de Firebase Auth (Email/Password y Google Provider) conectada al Client Component de Login.
*   **Auth State Management:** Implementación de AuthContext con persistencia global mediante onAuthStateChanged y reactividad local con extensión de dominios `.es` para roles de Super Administrador.

---

# Datos Funcionales - Módulos de la Aplicación

### Módulo A: Portal de Inicios de Sesión
*   Brinda acceso seguro con tokens de sesión persistentes de 7 días.
*   Presenta interfaces adaptativas glassmorphism y selección de flujo Firebase vs Demo.

### Módulo B: Dashboard Gerencial
El **Dashboard Gerencial** sirve como un centro de control analítico de reclutamiento enfocado en los mercados de España (ej. sedes en Madrid, Barcelona, Valencia, Bilbao).
*   **Filtros Globales:** Permite acotar las visualizaciones estadísticas por intervalos temporales y clientes corporativos clave (ej. Telefónica S.A., Banco Santander, SEAT S.A.).
*   **KPIs de Rendimiento:** Centraliza la cuantificación rápida del volumen de búsquedas activas, postulantes en bandeja, y el tiempo promedio que toma asignar a un recurso (lead-time).
*   **Analíticas Históricas:** Cuenta con gráficos interactivos que trazan el comportamiento histórico y la carga laboral mensual de los evaluadores de talento, conectable en fases subsecuentes al pipeline de BigQuery.

### Módulo C (UI): Maestro de Búsquedas con tabla de datos (`ID: P-BUS-01`) y vista dedicada (`ID: P-BUS-02`)
El **Maestro de Búsquedas** centraliza todas las solicitudes de personal y vacantes en curso de forma dinámica.
*   **Búsqueda y Filtros en Tiempo Real (`ID: P-BUS-01`):** Barra de búsqueda fluida (búsqueda por cargo, cliente y responsable operativo) y filtrado selectivo según el estado de la búsqueda (`preparacion_previa`, `evaluacion_tecnica`, `revision_cliente`, `oferta_cierre`).
*   **Conexión API REST:** Carga de registros en tiempo real consumiendo el endpoint `GET /api/v1/busquedas` con cabeceras `Authorization: Bearer <token>` inyectadas automáticamente.
*   **Estados de Carga y Error:** Inserción de un spinner de carga en el centro de la tabla durante solicitudes de red y manejo de reintentos manuales ante caídas de enlace.
*   **Slide-over Contenedor de Alta ("Nueva Búsqueda"):** Panel lateral interactivo y deslizable (Slide-over) para la creación de nuevas búsquedas.
*   **Pantalla Completa de Edición (`ID: P-BUS-02` - `/busquedas/[id]`):** Vista dedicada a pantalla completa con navegación Breadcrumb (`Búsquedas / Editar Búsqueda`), insignia `ID: P-BUS-02` y botón de regreso a la lista. Reemplaza el modal lateral al pulsar el botón "Editar" o hacer clic en una fila de la tabla en `ID: P-BUS-01`.
*   **Formulario de Búsquedas (Cédula de Identidad & Criterios de Screening):** Formulario de alta y edición a pantalla completa con validación previa en cliente. Incluye el constructor dinámico **Criterios de Screening (Máximo 5)** para configurar reglas de descarte excluyentes (`Knockout` con peso 0) o evaluativas ponderadas (`Deseable`).
*   **Inmutabilidad y Preservación de UUIDs:** Al editar búsquedas activas en `SearchForm.tsx`, las preguntas existentes preservan su UUID v4 (`id`) original para evitar desalineaciones con los resultados previamente evaluados en los pipelines de candidatos.
*   **Restricción de Payload en PATCH:** La Server Action `actualizarBusquedaAPI` limita strictly el cuerpo de la solicitud a `estado_busqueda`, `prioridad` y `criterios_screening` para cumplir con las políticas de backend y prevenir errores `HTTP 400`.
*   **Alerta de Re-evaluación:** Despliegue automático de advertencia visual al modificar criterios en búsquedas activas alertando sobre el requerimiento de re-evaluar candidatos en el pipeline.

### Módulo D: Módulo de Reclutamiento (UI)
El **Módulo de Reclutamiento** gestiona el flujo de postulantes asignados a cada búsqueda corporativa.
*   **Recruitment Management (Pipeline):** Vista de pipeline en tablero de columnas Kanban (Bandeja de Entrada, Evaluación Técnica, Revisión de Cliente, Oferta & Cierre) para la clasificación de candidatos según su fase.
*   **Localización:** Listado estructurado con perfiles tecnológicos simulados para el mercado laboral de España (ej. sedes en Madrid, Barcelona, Valencia, Sevilla, Bilbao).
*   **Controles de Acción:** Botones táctiles inmediatos para cambiar de estatus ("Avanzar" y "Rechazar") con alta fidelidad visual e interactividad hover.

### Módulo E: Módulo de Configuración (UI)
El **Módulo de Configuración** provee el control de personalización y operabilidad regional.
*   **Perfil de Usuario:** Tarjeta de perfil integrada con privilegios del sistema (Daniel Castellano, Super Administrador).
*   **Preferencias Regionales:** Selectores orientados y limitados al territorio español (zona horaria peninsular/Baleares y Canarias).
*   **Alertas y Notificaciones:** Conmutadores lógicos interactivos para activar/desactivar notificaciones de plataforma y estados críticos de APIs.
*   **Zona de Peligro / Derecho al Olvido (Super Administrador):** Panel especial de remoción física permanente de datos para candidatos. Emplea un modal de confirmación táctil de doble paso (advertencia RGPD + palabra clave obligatoria `CONFIRMAR`) para purgar definitivamente los registros y currículums del sistema local y la nube.

### Módulo F: Talent Mixer (Postulantes)
El **Talent Mixer** proporciona la bandeja de entrada inteligente para centralizar todo el padrón de postulantes ingresantes.
*   **Bandeja Principal (/talento) en Formato Kanban:** Tablero Kanban responsive organizado en 4 columnas de progresión: `PENDIENTE`, `REVISADO`, `SELECCIONADO` y `DESCARTADO (NO SELECCIONAR)`, con soporte para interacciones Drag & Drop e indicadores de estado reactivos.
*   **Asignación de Búsquedas Activas al SELECCIONAR:** Al mover a un candidato a la columna `SELECCIONADO`, el subtítulo cambia a "Candidatos en búsquedas" y se despliega un modal glassmorphic de asignación de vacantes. El modal permite asociar el candidato a un proceso de búsqueda activo, actualizando su estatus y creando de forma física la postulación dentro del pipeline de Descubrimiento en el estado inicial `01 - NUEVO EN REVISION`.
*   **Consola DAW (Faders de Calificación IA):** Faders de ecualización analógicos simulados e interactivos dentro de la ficha de detalle (`/talento/[id]`) para calificar en caliente los scores de *Hard Skills*, *Soft Skills*, *Fit Cultural* y *Seniority Index*.
*   **Slide-over de Alta de Candidato:** Formulario con etiquetas flotantes dinámicas, Drag-and-drop de archivos PDF, control estricto de consentimiento legal y captura inteligente para alertas de error `400 Bad Request` del servidor.
*   **Importación Asistida por IA:** Popup glassmórfico de importación con zona Drag & Drop compatible con formatos `.pdf`, `.doc` y `.docx` (máx 5MB). Realiza la llamada asíncrona a `POST /api/v1/candidatos/importar-ia` del backend, bloquea la interfaz durante la inferencia y muestra una notificación de éxito reactiva con autorefresco de la base de candidatos tras su creación (201).

### Módulo H: Screening Inteligente con IA (Criterios de Aceptación/Descarte)
El **Screening Inteligente** dota a Azul ATS de la capacidad de evaluar automáticamente a los candidatos en cualquier fase del pipeline frente a los criterios de aceptación y descarte definidos en las búsquedas mediante **Gemini 2.5 Flash** (Genkit + Vertex AI).
*   **Inferencia Asistida por IA (`POST /api/v1/pipeline/:id/evaluar-screening`):** Modal interactivo `EvaluarScreeningModal.tsx` con chequeos pre-flight (aviso inmediato si la búsqueda carece de criterios o si el candidato no tiene CV adjunto), animación de progreso en 4 pasos y opción de reintento ante caídas de red.
*   **Semáforo Tricolor:** Evaluación visual por criterio (`SÍ` 100% de puntos, `INFERIDO` 50% de puntos, `NO` 0 puntos).
*   **Caja de Evidencia ("Prueba de Vida"):** Cita textual extraída directamente del CV (`evidencia_cv`) presentada en cuadro `blockquote` para auditoría inmediata del reclutador.
*   **Alerta de Knockout (Excluyentes):** Resaltado en tono rojizo suave y bandera de alerta roja si un candidato falla un criterio excluyente (`tiene_knockout: true`).
*   **Human-in-the-Loop & UI Optimista:** Posibilidad de modificar manualmente cualquier respuesta del semáforo en `ScreeningPanel.tsx`. Utiliza estados optimistas locales para feedback instantáneo y dispara `actualizarResultadoScreeningAction` (`PATCH /api/v1/pipeline/:id`) recalculando el Fit Score y revalidando rutas (`revalidatePath`) para sincronización en tiempo real con los tableros Kanban.

### Módulo G: F1 Descubrimiento (Atracción & Sourcing inicial)
El **F1 Descubrimiento** brinda a los reclutadores el tablero maestro de sourcing potenciado por inteligencia artificial para detectar y evaluar candidatos.
*   **Estructuración Kanban Estricta:** Pipeline clasificado en 4 columnas de progresión (`01 - Nuevo en Revisión`, `02 - Bloqueado / Pendiente`, `03 - En Duda a Confirmar` y `04 - Rechazado en Fase Inicial`).
*   **Métricas de Funnel Temprano:** KPI cards en cabecera para *TTFME* (Time to First Meaningful Engagement con fórmulas interactivas de cálculo en overlay manual `?`), índice de personalización A/B, tasa de rechazo temprano, y volumen total.
*   **Destacado de Notas Descubrimiento (`notas_reclutador`):** Integración del campo del backend para la fase de Pipeline (`f1_descubrimiento.notas_reclutador`) bajo el título **"Notas Descubrimiento"**.
    - *Vista Kanban*: Visualización en contenedor destacado con resplandor cyan y distintivo `NOTAS DESCUBRIMIENTO`, posicionado prioritariamente **por encima** del campo "Notas iniciales", con tarjetas limpias sin campo ID redundante y botones adaptativos `flex-wrap`.
    - *Vista Lista Detallada*: Columna dedicada a `NOTAS DESCUBRIMIENTO` en formato equilibrado (`260px-320px`) que despliega exclusivamente este campo en un distintivo glassmorphic destacado, junto a la columna `ESTADO` ajustada (`190px-210px`) y la columna de `ACCIONES` con botones unificados (`Avanzar estado`, `Avanzar Fase` disponible en todas las filas, y `Rechazar`).
    - *Ficha Detalle (/descubrimiento/[id])*: Panel de resalte exclusivo para `Notas Descubrimiento`, con soporte para edición interactiva y guardado asíncrono vía `actualizarPipelineAPI`.
*   **Estandarización de Botones de Transición y Acciones:** 
    - Botones de cambio de estado actualizados a la etiqueta visible **`Avanzar estado`** con ícono `>>` (`ChevronsRight`) y tooltip emergente (`title`) indicando la meta (`A 02 - Bloqueado / Pendiente`, `A 03 - En Duda a Confirmar`, etc.).
    - Botón **`Avanzar Fase`** (Fase 2 Evaluación) disponible de forma incondicional desde cualquier estado en todas las filas y vistas.
    - Texto **`Rechazar`** visibilizado junto al ícono `Ban` en las vistas Kanban y Lista Detallada.
*   **Vista de Lista Detallada con Ordenamiento:** Tabla responsiva de tipo glassmorphism con ordenamiento interactivo ascendente/descendente en todas sus cabeceras clave (excepto acciones) y un panel lateral con indicador de filtro de estado adicional.
*   **Maximizado (Pantalla Completa):** Botón interactivo para maximizar la región operativa del headlining y tablero de búsqueda, ocultando las barras y KPIs globales para potenciar la visibilidad del reclutador, y conmutando automáticamente al modo "Salir".
*   **Detalle Dinámico por ID de Pipeline (/descubrimiento/[id]):** Redirección selectiva al detalle de candidatura priorizando el ID del Pipeline (con fallback seguro al ID de Candidato para retrocompatibilidad).
*   **Panel de Datos del Pipeline y SLA Timeline:** Incorporación en la ficha de detalle de un contenedor glassmorphic con los metadatos de vinculación (ID de búsqueda asignada, ID de pipeline) y una línea de tiempo (SLA Track) visual para auditar el historial e intervalos de fechas de los cambios de estado.
*   **Integración Gemini AI Sourcing (Live vs Mock):**
  - *Motor de Matching Semántico*: Analiza con la API de Google Gemini (1.5 Flash) el CV y puesto mostrando un Fit score (%), fortalezas, debilidades e instrucciones detalladas con indicador específico de fuente (`✨ GEMINI LIVE` vs `📋 MOCK`).
  - *Redacción de Outreach con Inteligencia Artificial*: Genera mensajes adaptados al perfil del candidato y permite A/B testing reescribiendo variantes A y B dináminamente con IA.
  - *Sourcing Avanzado Booleano & X-Ray*: Generador de cadenas booleanas y strings premium de X-Ray (LinkedIn / Google) con auto-fill de plantillas (e.g. Rust Architect, UX Designer) e importación simulada directa al backlog del kanban, indicando si proviene de Gemini o Mock.

### Módulo H: F2 Evaluación (Pruebas Técnicas & Simulaciones IA)
El **F2 Evaluación** gestiona la fase interna de validación técnica, entrevistas en profundidad y assessments interactivos libres de sesgo tecnológico.
*   **Pipeline de Evaluación Kanban:** Tablero de control clasificado en **4 columnas** de progresión técnica: `05 - Entrevista Inicial / Screening`, `06 - Prueba / Assessment Técnico`, `07 - En Duda Evaluación` y `08 - Descartado (Interno)`, provisto de interacciones *Drag & Drop* completas, grid `xl:grid-cols-4` y actualización instantánea de fase.
*   **Estado Intermedio "En Duda":** Nuevo estado `07_en_duda_evaluacion` (color ámbar) para candidatos que requieren revisión adicional antes de ser descartados. Botón de acción "En Duda" disponible en tarjetas Kanban y vista Lista Detallada.
*   **Renumeración de Estado Descartado:** El estado anterior `07_descartado_interno` pasó a `08_descartado_interno` para acomodar el nuevo estado intermedio. Las transiciones de avance a F3 apuntan a `09_presentado_cliente`.
*   **Métricas e Indicadores de Rendimiento de Evaluación:** Tarjetas analíticas de control para *WIP Cycle Time* promedio (horas activas acumuladas en evaluación), *cNPS* general de candidatos, e índice de aprobación *Pass-through Rate*. Adicionalmente, incluye alerta de sobrecarga operativa en color amarillo ámbar cuando el WIP supera los 10 candidatos activos.
*   **Filtros de Búsqueda y Multi-Cliente:** Barra de filtrado dinámico para acotar y aislar candidatos por rol y cliente corporativo clave (ej. Telefónica, Santander, SEAT).
*   **Slide-over Contenedor de Diagnóstico IA:** Cajón lateral deslizable e interactivo enfocado en herramientas cognitivas avanzadas libres de sesgos:
  - *Sintetizador de Entrevistas*: Cruce inteligente de notas de llamadas y descripciones de puestos clasificando en Puntos Fuertes (Pros), Brechas Técnicas (Cons) y Señales de Alerta (Riesgos).
  - *Detector de Inconsistencias Cronológicas*: Escaneo automático de la trayectoria laboral del candidato para alertar sobre solapamientos sospechosos u holguras (gaps) de tiempo.
  - *Generador de Preguntas Técnicas STAR*: Formulación automatizada de cuestionarios de comportamiento y código contextualizados bajo el formato Situación, Tarea, Acción y Resultado (STAR).
  - *Validador de Identidad y Entorno*: Chequeo asincrónico IP, geolocalización latente y capturas de cámara web simuladas con interfaz interactiva ("Iniciar escaneo") para prevenir fraudes.
  - *AI Co-Pilot Adaptive Pair Programming*: Entorno simulado de colaboración en vivo ("Live coding test") con visor de compilador de sandbox interactivo compatible con Rust/WASM y TypeScript, mostrando tasa de completación, dificultad y esfuerzo estimado.

### Módulo I: F3 Cliente Evaluación (Presentación al Cliente & Calibración)
El **F3 Cliente Evaluación** (`/presentacion`) administra la fase de presentación formal de expedientes y calibración técnica con los Hiring Managers del cliente corporativo.
*   **Pipeline de Presentación Kanban y Lista:** Tablero de control clasificado en 3 columnas: `09 - Shortlist / Enviado a Cliente`, `10 - Entrevista con Cliente` y `11 - Stand-by / Back-up`, con soporte Drag & Drop, conmutador Kanban/Lista y pantalla completa.
*   **Integración REST Backend Directa:** Conectado a Server Actions (`getBusquedasAPI`, `getCandidatosAPI`, `getPipelineAPI` y `actualizarPipelineAPI`) para consultar y actualizar en tiempo real el pipeline y los candidatos reales en la nube.
*   **KPIs de Negocio:** Tarjetas de métricas de *Stakeholder Blockage Time*, *Calibration Accuracy*, *cNPS del Cliente* y alerta de saturación de cola (WIP > 10).
*   **Consola de Herramientas de IA para Calibración (Slide-over):** Analítica de Entrevistas Zoom/Meet, Traductor y Estandarizador de Perfiles ATS, Generador de Executive Candidate Briefings por IA, Orquestador de Agendas Condicional y Bot Rastreador de SLA.

### Módulo J: Sistema de Identificadores Alfanuméricos Únicos (`ID: P-xxx` y `ID: M-xxx`)
Para simplificar la interacción en los prompts de desarrollo y la localización exacta de vistas y ventanas emergentes:
*   **Identificadores de Página (`P-xxx`)**: Insignia translúcida monospaciada en la cabecera de todas las rutas (`P-TAL-01`, `P-TAL-02`, `P-DIS-01`, `P-DIS-02`, `P-EVA-01`, `P-EVA-02`, `P-PRE-01`, `P-PRE-02`, `P-CIE-01`, `P-CIE-02`, `P-BUS-01`, `P-DSH-01`, `P-CFG-01`, `P-LGN-01`).
*   **Identificadores de Ventanas Emergentes / Modales (`M-xxx`)**: Insignia de desarrollo en las modales principales: `M-IMP-01` (Modal Ingesta CV en Talento), `M-IMP-02` (Modal Parser Ingesta CV en Descubrimiento), `M-REJ-01` (Modal Motivo Rechazo), `M-ADV-01` (Modal Promoción a F2), `M-TRI-01` (Modal Triage Bot), `M-SEM-01` (Modal Match Semántico IA) y `M-BOL-01` (Modal Búsquedas Booleanas & X-Ray).
*   **Usabilidad & Micro-interacciones**: Texto seleccionable (`select-all`) para fácil copiado en portapapeles y tooltip explicativo al pasar el cursor.

### Módulo K: Homologación Global del Botón "CV" y Canal de Ingreso Dinámico
*   **Botonera Unificada "CV" en Todo el Pipeline**: Botón del documento PDF con ícono `<FileText />` y etiqueta visible `"CV"` presente uniformemente en Kanban, Lista Detallada (columna ACCIONES) y cabeceras de expediente en todas las etapas (`/talento`, `/descubrimiento`, `/evaluacion`, `/presentacion`, `/cierre` y sus vistas de detalle `/[id]`).
*   **Canal de Ingreso Dinámico (`canal_ingreso`)**: Campo que consulta en tiempo real todos los canales únicos existentes en la base de datos backend (`getCandidatosAPI`), agregando la opción `+ Escribir nuevo canal personalizado...` para crear vías de sourcing al vuelo. Sincronizado en la ficha del candidato (`/talento/[id]`) y en las modales de ingesta con IA (`M-IMP-01` y `M-IMP-02`), mostrando el estado real `No especificado` cuando el canal es nulo.
*   **Gestión Global de Motivo de Rechazo**: Traslado de los campos de motivo de descarte y fecha de resolución desde Cierre a la raíz de `PipelineItem` (`motivo_rechazo`, `resolucion.estado_final`, `resolucion.fecha_resolucion`), permitiendo su consulta y edición interactiva en `/descubrimiento/[id]`.

---

# Ejecución del Servidor Local and Tests

1.  **Instala las dependencias (falta ver cuando aplica):**
    ```bash
    npm install
    ```
2.  **ARRANCAR EL SERVIDOR LOCAL EN DESARROLLO ------------------------------------------**
    ```bash
    npm run dev
    ```
3.  **Ejecutar pruebas de Candidatos - Etapa 1 (Lectura):**
    ```bash
    source ~/.zshrc && npx tsx --test tests/candidatos_etapa1.test.js
    ```
4.  **Ejecutar pruebas de Candidatos - Etapa 2 (Escritura/Validación):**
    ```bash
    source ~/.zshrc && npx tsx --test tests/candidatos_etapa2.test.js
    ```
5.  **Ejecutar pruebas de Descubrimiento - Etapa 1 (Lectura de Pipeline):**
    ```bash
    source ~/.zshrc && npx tsx --test tests/descubrimiento_etapa1.test.js
    ```
6.  **Ejecutar pruebas de Descubrimiento - Etapa 2 (Escritura y Mutaciones de Pipeline):**
    ```bash
    source ~/.zshrc && npx tsx --test tests/descubrimiento_etapa2.test.js
    ```
7.  **Ejecutar pruebas de Descubrimiento - Etapa 3 (Detalle y Sincronización IA Backend):**
    ```bash
    source ~/.zshrc && npx tsx --test tests/descubrimiento_etapa3.test.js
    ```
8.  **Ejecutar pruebas del Módulo de Evaluación (KPIs y Mocks):**
    ```bash
    export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && node --experimental-strip-types --test tests/evaluacion.test.js
    ```
9.  **Ejecutar pruebas del Módulo de Presentación (F3):**
    ```bash
    export PATH="/Users/dcastellano/.local/node-v20.12.2-darwin-arm64/bin:$PATH" && npx tsx --test tests/presentacion.test.js
    ```
10. **Ejecutar pruebas del Módulo de Cierre (F4):**
    ```bash
    export PATH="/Users/dcastellano/.local/node-v20.12.2-darwin-arm64/bin:$PATH" && npx tsx --test tests/cierre.test.js
    ```
11. **Ejecutar pruebas de Persistencia de Screening (P-BUS-02):**
    ```bash
    export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && node --experimental-strip-types --test tests/busquedas_screening.test.js
    ```
12. **Ejecutar pruebas de Integración Global de Búsquedas (Todas las Pantallas):**
    ```bash
    export PATH="/Users/dcastellano/.local/node-v20.12.2-darwin-arm64/bin:$PATH" && npx tsx --test tests/busquedas_pantallas.test.js tests/busquedas_migracion.test.js
    ```
13. **Verificación de Tipos TypeScript:**
    ```bash
    npx tsc --noEmit
    ```
14. Abre [http://localhost:3000](http://localhost:3000) en el navegador.


--------------------------------------------------------------------------------------------------------
# Arquitectura de Entornos y Estrategia de Despliegue (Firebase App Hosting)

El frontend de la aplicación cuenta con una **separación física de entornos** desplegada sobre **Firebase App Hosting**, sincronizada de forma continua con la estrategia de ramas del repositorio de GitHub.

## 1. Estrategia de Ramas en GitHub

*   **`main` (Producción):** Rama exclusiva e intocable para el trabajo diario. Queda estrictamente restringido realizar commits directos sobre ella. Únicamente recibe código funcional, probado y auditado a través de integraciones (*Merges* / *Pull Requests*) desde la rama `develop`.
*   **`develop` (Staging / Desarrollo):** Rama central de desarrollo e integración continua. Es el punto neurálgico donde se consolida el trabajo diario, las nuevas funcionalidades (*features*) y las resoluciones de errores (*bugfixes*).

## 2. Entornos de Despliegue Automatizado

*   **Entorno de Pruebas (Staging / QA):**
    *   **Rama origen:** Conectado a `develop`.
    *   **Automatización CI/CD:** Cualquier evento de *push* o *merge* entrante en `develop` dispara automáticamente un pipeline de compilación (Build) y despliegue en el proyecto de pruebas de **Firebase App Hosting**.
*   **Entorno de Producción:**
    *   **Rama origen:** Conectado estrictamente a `main`.
    *   **Aislamiento de Infraestructura:** El pipeline de *release* despliega la aplicación sobre un proyecto de Firebase completamente independiente y aislado a nivel de recursos respecto del entorno de pruebas.

## 3. Flujo de Trabajo del Desarrollador (Developer Workflow)

Para garantizar la estabilidad y prevenir regresiones entre entornos, el desarrollo debe seguir rigurosamente las siguientes pautas:

1.  **Creación de Ramas Temporales (*Feature Branches*):**
    Todo desarrollo de nuevas pantallas, componentes o correcciones debe iniciarse creando una rama de trabajo temporal partiendo **siempre desde `develop`** (nunca desde `main`):
    ```bash
    git checkout develop
    git pull origin develop
    git checkout -b feature/nombre-de-la-funcionalidad
    ```

2.  **Integración y Despliegue en Staging:**
    Una vez finalizado y probado el desarrollo localmente, se sube la rama temporal y se solicita su fusión hacia `develop` para activar el despliegue automático al entorno de pruebas:
    ```bash
    git push origin feature/nombre-de-la-funcionalidad
    # Crear Pull Request de feature/nombre-de-la-funcionalidad -> develop

    # Mis pasos para guardar el desarrollo en la rama desarrollo:
    # Verificar que estoy en desarrollo
    git checkout develop

    # Actualizar con los ultimos cambios de la rama desarrollo (no se si aplica siempre)
    git pull origin develop
   
    # Agregar los cambios
    git add .
    # Commit de los cambios
    git commit -m "feat: conexión a API real en Cloud Run, control de mocks y badge QA"
    # Push de los cambios
    git push origin develop

    # Volver a la rama desarrollo para continuar desarrollando
    git checkout develop
    ```

3.  **Promoción a Producción:**
    Tras la validación funcional satisfactoria en el entorno de Staging, la promoción a Producción se ejecuta mediante el Merge validado desde `develop` hacia `main`:
    ```bash
    # Transición controlada a Producción mediante PR / Merge: develop -> main // Si da error, es que quedan cambios en desarrollo que subir
    git checkout main
    git merge develop
    git push origin main
    git checkout develop
    ```

--------------------------------------------------------------------------------------------------------
# Historico de Cambios (ordenados por los recientes cambios primeros)

*   **13/08/2026:** Migración de Base de Datos Firestore y Desacoplamiento de `id_busqueda` vs. `codigo_busqueda` (`ID: P-BUS-01`, `ID: P-BUS-02`):
    *   **Desacoplamiento Estricto de IDs:** Adaptación de todas las capas del frontend (`src/actions/busquedas.ts`, `src/app/busquedas/page.tsx`, `SearchForm.tsx` y `src/app/busquedas/[id]/page.tsx`) a la migración de Firestore donde el documento posee un `id_busqueda` autogenerado (UUID/Hash técnico) y un campo separado `codigo_busqueda` para el código legible por humanos (ej. "REQ-001").
    *   **Maestro de Búsquedas (`ID: P-BUS-01`):**
        - Columna "ID" visual renderiza `codigo_busqueda` con fallback a `id_busqueda` (`busqueda.codigo_busqueda || busqueda.id_busqueda`).
        - Enrutamiento estricto: El botón "Editar" y los eventos de clic en la fila construyen la URL utilizando siempre el ID técnico de Firestore (`/busquedas/${busqueda.id_busqueda}`).
        - Buscador textual interactivo ampliado para filtrar por `codigo_busqueda` e `id_busqueda`.
    *   **Formularios de Creación / Edición (`ID: P-BUS-02`):**
        - El campo "Código Búsqueda" mapea el texto tecleado por el usuario hacia `codigo_busqueda` en el payload REST de creación/edición en `SearchForm.tsx`.
        - La vista de detalle a pantalla completa renderiza `codigo_busqueda` en el badge de la cabecera superior (`Cliente: X • Código: REQ-001`).
    *   **Suite de Pruebas Automatizadas (`tests/busquedas_migracion.test.js`):** Creación e integración de suite unitaria bajo el test runner nativo de Node.js con `tsx` para validar el comportamiento en modo Mock y REST (3/3 pruebas aprobadas, **100% de éxito en 8/8 pruebas totales** de búsquedas).
    *   **Compilación Estática:** Verificación estricta en TypeScript mediante `npx tsc --noEmit` (**0 errores**).

*   **13/08/2026:** Corrección de Duplicación de URL `/api/v1` en Server Actions y Vistas de Descarga de CV (`src/actions/candidatos.ts` & `src/app/**`):
    *   **Estandarización de URLs de API con `getApiEndpoint`:** Refactorización de `crearCandidatoAPI`, `actualizarCandidatoAPI`, `eliminarCandidatoAPI` e `importarCandidatoIA_API` en `src/actions/candidatos.ts` para sustituir la concatenación manual `${apiBaseUrl}/api/v1/...` por la utilidad normalizadora `getApiEndpoint(...)`, solucionando el error 404 por ruta duplicada (`http://localhost:8080/api/v1/api/v1/candidatos/importar-ia`).
    *   **Actualización de Vistas de Descarga de CV (`src/app/**`):** Estandarización en 10 páginas de componentes de vistas (`cierre`, `descubrimiento`, `evaluacion`, `presentacion`, `talento`) reemplazando concatenaciones manuales por `getApiEndpoint("candidatos/" + candId + "/cv?token=" + token)`.
    *   **Suite de Pruebas Automatizadas Unitarias (`src/utils/__tests__/api.test.ts`):** Creación e integración de pruebas unitarias bajo `node:test` (ejecutable con `npm test`) que validan la normalización automática de URLs independientemente de si las variables de entorno contienen o carecen del segmento `/api/v1`.

*   **12/08/2026:** Corrección de Importaciones con Extensiones `.ts`/`.js` para Despliegue en Firebase App Hosting (`src/actions/busquedas.ts`):
    *   **Resolución de Error TS5097 en Build de Next.js:** Eliminación de extensiones de archivo explícitas (`.ts` y `.js`) en las rutas de importación en `src/actions/busquedas.ts` (`CriterioScreening`, `getApiEndpoint`, `cookies`).
    *   **Homologación de Importaciones con Alias (`@/`)**: Estandarización de las rutas relativas (`../types/screening`, `../utils/api`) al alias global `@/` (`@/types/screening` y `@/utils/api`), alineándolo con `candidatos.ts` y `pipeline.ts`.
    *   **Auditoría y Validación:** Inspección en todo el directorio `src/` confirmando la ausencia de otras extensiones en importaciones y verificación mediante `npx tsc --noEmit` (**0 errores**).

*   **12/08/2026:** Conexión Real a Cloud Run, Flag `NEXT_PUBLIC_USE_MOCKS` y Badge DX/QA (`⚠️ MOCKS ACTIVOS`):
    *   **Conexión Real de Creación de Búsquedas:** Refactorización de `crearBusquedaAPI` y `getBusquedasAPI` en `src/actions/busquedas.ts` para conectar con la API en Cloud Run definida en `NEXT_PUBLIC_ATS_API_URL` (o `NEXT_PUBLIC_API_URL`), inyectando cabeceras `Authorization: Bearer <token>` y `Content-Type: application/json`.
    *   **Control de Mocks por Variable de Entorno:** Implementación del flag de entorno `NEXT_PUBLIC_USE_MOCKS`. Si la variable es `true`, las Server Actions retornan datos estáticos locales; si es `false` o no está definida (entorno de Producción), la aplicación fuerza la llamada HTTP real a la API.
    *   **Manejo de Errores Sin Fallback Silencioso:** Remoción de fallbacks silenciosos a datos falsos en caso de fallas de red o errores HTTP del backend. Captura explícita de códigos de respuesta con feedback visual al usuario en `SearchForm.tsx` vía banner de alerta (`AlertCircle`).
    *   **Indicador Visual DX/QA (`MockModeBadge`):** Creación del componente `src/app/components/MockModeBadge.tsx` que muestra un badge amarillo/naranja con pulso (`⚠️ MOCKS ACTIVOS`). Devuelve `null` estricto en Producción o cuando `NEXT_PUBLIC_USE_MOCKS !== "true"`. Integrado en `layout.tsx` y en el encabezado de `busquedas/page.tsx`.
    *   **Suite de Pruebas Automatizadas:** Creación de `tests/crear_busqueda_api.test.js` bajo `node:test` para validar el comportamiento estático cuando el flag de mocks está activo y la emisión del payload HTTP `POST` a la URL de Cloud Run cuando está inactivo.

*   **12/08/2026:** Separación Física de Entornos y Estrategia de Ramas en GitHub (`Firebase App Hosting`):
    *   **Separación de Entornos:** Documentación e integración de entornos físicamente independientes en **Firebase App Hosting** para Staging y Producción.
    *   **Estrategia de Ramas:** Definición de `main` como rama exclusiva de Producción (protegida para trabajo diario, solo recibe código vía Merge desde `develop`) y `develop` como rama central de integración para Staging.
    *   **Flujo de Trabajo del Desarrollador:** Regla obligatoria de creación de ramas temporales (*feature branches*) partiendo siempre desde `develop` (`git checkout -b feature/nombre-tarea develop`).

*   **31/07/2026:** Indicador de Suma de Pesos en Sección "Criterios de Screening" (`ID: P-BUS-02` — `src/app/components/SearchForm.tsx`):
    *   **Indicador Visual en Tiempo Real:** Añadido un panel informativo debajo del header de la sección "5. Criterios de Screening (Máximo 5)" que se muestra únicamente cuando existe al menos un criterio configurado. Calcula en tiempo real la suma de los campos `peso` de todos los criterios de tipo `deseable` y la compara contra el valor objetivo de **100 puntos**.
    *   **Sistema de Semáforo de Colores:**
        *   🟢 **Verde** (`suma === 100`): Mensaje "✓ Los pesos ponderados suman exactamente 100. ¡Configuración óptima para el scoring de IA!"
        *   🟡 **Ámbar** (`suma < 100`): Mensaje "Los pesos 'Deseable' suman X pts. Se recomienda que la suma sea 100 para un scoring equilibrado."
        *   🔴 **Rojo** (`suma > 100`): Mensaje "⚠ Los pesos suman X pts, que supera el máximo de 100. Reduce el peso de algún criterio."
        *   🟡 **Ámbar sin deseable**: Mensaje "Aún no hay criterios de tipo Deseable. Los criterios Knockout no puntúan."
    *   **Nota técnica:** Los criterios de tipo `knockout` tienen su campo `peso` bloqueado en `0` y se excluyen del cálculo. El indicador es puramente informativo y no bloquea el guardado.

*   **30/07/2026:** Mejoras UI/UX en Sección "Screening Inteligente IA" (`ID: P-DIS-02` — `src/app/components/ScreeningPanel.tsx`):
    *   **Renombrado de Botón Semáforo "INFERIDO":** Eliminado el texto de puntos `(X pts)` del botón INFERIDO del semáforo interactivo para simplificar la lectura. El botón ahora muestra únicamente la etiqueta `INFERIDO`.
    *   **Edición Inline de Evidencia del CV ("Prueba de Vida"):** Implementada la capacidad de edición manual del campo `evidencia_cv` directamente desde el acordeón desplegable de cada criterio. Al expandir el acordeón, se muestra la cita con un icono de lápiz (`Edit2`). Al hacer clic en el lápiz se activa un `textarea` editable. Al confirmar con el botón **"Guardar"** se llama a `actualizarResultadoScreeningAction` (via `PATCH /api/v1/pipeline/:id`) para persistir el cambio en Firestore. El guardado usa UI optimista: `localResultado` se actualiza inmediatamente antes de la respuesta del backend. Botón "Cancelar" descarta la edición sin guardar.
    *   **Cálculo del Fit Score (`displayScore`):** El Fit Score visible en el badge del panel se calcula siguiendo esta lógica de prioridad:
        1.  Si no hay evaluaciones (`!hasEvaluations`): se muestra `0`.
        2.  Si `fitScore` (prop recibida desde Firestore vía backend) es mayor que `0`: se usa ese valor directamente (calculado por el backend tras la inferencia de Gemini).
        3.  En caso contrario (evaluaciones locales sin respuesta de backend): se suma el campo `puntaje_obtenido` de cada ítem con `tipo === "deseable"` en `localResultado` (los criterios `knockout` no suman puntos). `puntaje_obtenido` vale `crit.peso` para `SI`, `Math.round(crit.peso / 2)` para `INFERIDO`, y `0` para `NO`.

*   **29/07/2026:** Consulta Directa por ID de Documento Pipeline en `ID: P-DIS-02` (`GET /api/v1/pipeline/:id`):
    *   **Consulta Prioritaria por ID (`getPipelineItemAPI`):** Implementada en `src/app/descubrimiento/[id]/page.tsx` la llamada directa a `GET /api/v1/pipeline/${id}` como Capa 1 de resolución. Permite recuperar inmediatamente documentos individuales de pipeline desde Firestore (ej. `6EDjceRl0vxbPbOvfRNH`) sin depender exclusivamente del filtrado por búsqueda.

*   **29/07/2026:** Corrección de Atributo `Secure` en Cookies para HTTP Localhost (`src/lib/firebase/auth.ts`):
    *   **Detección Dinámica de Protocolo HTTPS/HTTP:** Corregidas las funciones `setTokenCookie` y `clearTokenCookie` en `auth.ts` para que omitan la restricción `; Secure` cuando se ejecuta bajo el protocolo inseguro `http://localhost:3000`. Esto permite que Chrome almacene correctamente la cookie `azul_ats_token` transmitiendo el JWT real de Firebase a las Server Actions y al backend Express en el puerto 8080.

*   **29/07/2026:** Botón de Logout / Cerrar Sesión en `ID: P-CFG-01` (`src/app/configuracion/page.tsx`):
    *   **Renovación de Sesión:** Agregado el botón **"Cerrar Sesión (Logout)"** en la tarjeta de perfil de la vista de configuración (`P-CFG-01`). Permite limpiar cookies obsoletas y redirigir a la pantalla de `/login` para autenticar con un usuario de Firebase Auth real y obtener un token JWT fresco aceptado por el backend Express en el puerto 8080.

*   **29/07/2026:** Conexión Garantizada al Backend Express Local en Puerto 8080 (`src/actions/pipeline.ts`):
    *   **Fallback de Token en Server Actions:** Actualizada la función `getServerAuthToken()` en `pipeline.ts` para asignar `mock-token-recruiter` si no hay cookie `azul_ats_token` presente, evitando excepciones que desviaban las peticiones HTTP hacia mock data.
    *   **Llamadas Reales a Express Puerto 8080:** Garantizado que la acción `getPipelineAPI()` ejecute siempre la petición `GET http://localhost:8080/api/v1/pipeline?id_busqueda=xxx` directamente contra el servidor Express local en el puerto 8080 conectado a Firestore real.

*   **29/07/2026:** Herramientas de Diagnóstico e Inspección en Tiempo Real REST (`ID: P-DIS-02`):
    *   **Inspector de Diagnóstico en Pantalla (`🐛 Debug`):** Incorporado el botón interactivo en `ScreeningPanel.tsx` que despliega en vivo el Pipeline ID, cantidad de criterios, Fit Score, bandera Knockout y el payload crudo `resultado_screening` recibido de Firestore.
    *   **Trazabilidad en Consola de Navegador:** Agregados registros estructurados `🔍 [DIAGNÓSTICO SCREENING P-DIS-02]` en `fetchBackendData` para auditar las peticiones REST al servidor backend Express local.

*   **29/07/2026:** Integración Completa de Respuesta REST de Backend en Screening (`ID: P-DIS-02`):
    *   **Acceso Seguro a `claves_conexion.id_candidato`:** Implementado encadenamiento opcional seguro (`p.claves_conexion?.id_candidato`) en `src/app/descubrimiento/[id]/page.tsx` para evitar excepciones al iterar sobre los ítems del pipeline.
    *   **Criterios Sintéticos de Respaldo (`effectiveCriterios`):** Agregada la generación dinámica de criterios desde `resultado_screening` cuando la búsqueda carece de la lista cargada, garantizando que el semáforo y evidencias se muestren inmediatamente al recibir el JSON del backend.
    *   **Verificación Automatizada de Payload REST (`tests/busquedas_screening.test.js`):** Integrado test unitario para validar el contrato con la muestra JSON del backend (`3/3 pruebas aprobadas`).

*   **29/07/2026:** Algoritmo de Triple Coincidencia y Pruebas de Despliegue de Screening (`ID: P-DIS-02`):
    *   **Función `findEvaluationForCriterion`:** Implementado el algoritmo de triple coincidencia en `ScreeningPanel.tsx` (Emparejamiento por ID `id_criterio/criterio_id/id`, coincidencia por texto de pregunta y respaldo por índice `localResultado[idx]`).
    *   **Automatización de Pruebas (`tests/busquedas_screening.test.js`):** Creado e integrado el test unitario de emparejamiento de datos de Firestore (`2/2 pruebas aprobadas`), certificando la correcta visualización de semáforos, citas de evidencias y Fit Score.

*   **29/07/2026:** Corrección en Lectura y Despliegue de Resultados Almacenados en Firestore (`ID: P-DIS-02`):
    *   **Extracción Multinivel de Propiedades (`P-DIS-02`):** Agregados fallbacks jerárquicos en `src/app/descubrimiento/[id]/page.tsx` para recuperar `resultado_screening`, `fit_score_screening` y `tiene_knockout` desde `activePipelineItem` o sus variantes de sub-objetos backend.
    *   **Mapeo Flexible de Criterios (`ScreeningPanel.tsx`):** Ampliado el algoritmo de emparejamiento de criterios por `id_criterio`, `criterio_id`, `id` e índice de posición (`|| localResultado[idx]`), garantizando la visualización del semáforo tricolor, puntajes y evidencias previa de Firestore.

*   **29/07/2026:** Unificación de Pantallas e Inferencia en Tiempo Real en Modal `ID: M-SCR-01` (`P-DIS-02`):
    *   **Vista Única Integrada (`ID: M-SCR-01`):** Se unificó la visualización del avance del proceso en tiempo real (Stepper de 4 pasos) y la pantalla de resumen final dentro de una sola interfaz fluida e ininterrumpida en `EvaluarScreeningModal.tsx`.
    *   **Experiencia Continuada:** Durante la inferencia se muestra la barra de progreso porcentual (`0%` a `100%`) y la animación de cada paso. Al concluir, el resumen final (Fit Score %, alerta Knockout, métricas desglosadas `SÍ/INFERIDO/NO` y citas textuales de "Prueba de Vida") se despliega inmediatamente debajo del log de ejecución en la misma pantalla.
    *   **Control del Ciclo de Vida y Refresco Silencioso:** Se solucionó el cierre o reinicio prematuro del modal mediante `prevIsOpen` en `EvaluarScreeningModal.tsx` y llamadas silenciosas `fetchBackendData(true)` en `P-DIS-02`, manteniendo la pantalla fija hasta que el usuario decida cerrar haciendo clic en `"Ver Expediente Actualizado"`.

*   **29/07/2026:** Identificación Oficial (`ID: M-SCR-01`) y Contexto de Búsqueda/Criterios en Modal:
    *   **Etiqueta de Identificación Oficial (`ID: M-SCR-01`):** Incorporada la insignia `ID: M-SCR-01` en el encabezado del modal de inferencia.
    *   **Nombre de Búsqueda Asociada:** Desplegada la línea informativa con el nombre del perfil y cliente de la búsqueda vinculada al pipeline debajo del candidato.
    *   **Detalle de Criterios Configurados:** Incorporado el desglose interactivo con la lista de criterios de la búsqueda (preguntas, insignias de `KNOCKOUT` en rojo vs `PESO: X pts` en amarillo/azul) dentro del cuerpo del modal.
    *   **Pre-flight Checks & Feedback:** Verificación de requisitos pre-ejecución (alerta si la búsqueda carece de criterios o si el candidato no tiene CV adjunto) deshabilitando el botón de inicio con feedback explicativo.

*   **29/07/2026:** Reubicación de "Screening Inteligente IA" a `ID: P-DIS-02` y Fix de Re-render Infinito:
    *   **Migración a F1 Descubrimiento (`ID: P-DIS-02`):** Se reubicó la sección de Screening Inteligente (`ScreeningPanel` y `EvaluarScreeningModal`) a la vista detallada de candidatos en Fase 1 Descubrimiento (`/descubrimiento/[id]`).
    *   **Depuración de `ID: P-TAL-02` (`/talento/[id]`):** Se eliminó la sección de Screening Inteligente de la ficha general de talento, desvinculando estados y peticiones API redundantes.
    *   **Fix de Re-render Infinito (`Maximum update depth exceeded`):** Se resolvió el error en `ScreeningPanel.tsx` reemplazando el `useEffect` incondicional por una comparación por contenido serializado mediante `useRef(JSON.stringify(resultadoScreening))`.

*   **29/07/2026:** Integración de Autenticación con Firebase Token Real en Backend Local y Refactorización de Server Actions:
    *   **Autenticación con Token Real de Firebase:** Se eliminaron los bypasses de usuarios y tokens mock temporales en `src/actions/busquedas.ts` y `src/context/AuthContext.tsx`. El frontend extrae el Firebase ID Token de la sesión activa del usuario autenticado (`azul_ats_token`) y lo transmite en la cabecera `Authorization: Bearer <token>` en las peticiones REST al servidor backend local Express conectado a Firestore.
    *   **Refactorización de Helper de Endpoints (`src/utils/api.ts`):** Se creó la utilidad independiente `src/utils/api.ts` para albergar la función síncrona `getApiEndpoint`, solucionando la restricción de Next.js App Router que exige que todas las funciones exportadas desde archivos con la directiva `'use server'` sean asíncronas (`async`).
    *   **Re-importación en Server Actions:** Se actualizaron los imports de `getApiEndpoint` en `src/actions/busquedas.ts`, `src/actions/candidatos.ts` y `src/actions/pipeline.ts`.

*   **28/07/2026:** Configuración de Entorno a Backend 100% Local (`http://localhost:8080/api/v1`):
    *   **Variables de Entorno (`.env.local`):** Actualizada `NEXT_PUBLIC_API_URL="http://localhost:8080/api/v1"` para redirigir todas las peticiones REST al servidor backend local en el puerto 8080.
    *   **Constructor de Endpoints Dinámico (`getApiEndpoint`):** Implementado `getApiEndpoint` en Server Actions (`busquedas.ts`, `candidatos.ts`, `pipeline.ts`) para eliminar URLs absolutas hardcodeadas y garantizar compatibilidad entre `/api/v1` y rutas relativas.
    *   **Headers & CORS:** Verificado el envío estricto de `Content-Type: application/json` y `Authorization: Bearer <token>` en todas las peticiones.

*   **28/07/2026:** Ampliación del Esquema de Edición en `ID: P-BUS-02` (`PATCH /api/v1/busquedas/:id`):
    *   **Edición Ampliada de Campos Descriptivos:** Habilitada la edición de campos de Identificación, Perfil Técnico, Condiciones y SLA (`responsable_operativo`, `skills_excluyentes`, `skills_deseables`, `nivel_ingles_req`, `modalidad`, `presupuesto_max`, `link_job_description`) en `SearchForm.tsx`.
    *   **Payload Multinivel Adaptado:** Actualizado `actualizarBusquedaAPI` en `src/actions/busquedas.ts` para enviar la estructura JSON jerárquica aceptada por el nuevo esquema expandido del backend Cloud Run.

*   **28/07/2026:** Creación de la Pantalla Completa de Edición de Búsquedas (`ID: P-BUS-02` - `/busquedas/[id]`):
    *   **Navegación Standalone:** Reemplazado el modal lateral (Slide-over) de edición en `/busquedas` (`P-BUS-01`) por una navegación directa a la nueva vista a pantalla completa `/busquedas/[id]` (`P-BUS-02`).
    *   **Maquetación y UI Shell (`ID: P-BUS-02`):** Diseño a pantalla completa con navegación Breadcrumb (`Búsquedas / Editar Búsqueda`), insignias de estado/prioridad y la etiqueta identificadora oficial `ID: P-BUS-02`.
    *   **Integración de Formulario Completo (`SearchForm.tsx`):** Despliegue de las 5 secciones de la posición (Cédula de Identidad, Descripción & Objetivos, Requisitos Exigidos, Beneficios/Modalidad y Criterios de Screening con inmutabilidad de UUIDs v4).
    *   **Botones de Acción & Feedback:** Incorporación de botones de acción "Guardar Cambios de la Búsqueda" y "Cancelar", con feedback de guardado asíncrono y redirección limpia al Maestro de Búsquedas.

*   **28/07/2026:** Lanzamiento e Integración del Módulo de "Screening Inteligente con IA" (Criterios de Aceptación/Descarte):
    *   **Setup de Criterios de Screening en Búsquedas (Etapa 1):** Incorporación del constructor dinámico **Criterios de Screening (Máximo 5)** en `SearchForm.tsx` con reglas excluyentes (`Knockout`, peso 0) y evaluativas (`Deseable` ponderado). Garantizada la inmutabilidad y preservación de los UUIDs v4 (`id`) de las preguntas al editar búsquedas activas para mantener la consistencia con las evaluaciones previas en los pipelines.
    *   **Payload Estricto & Server Actions:** Actualización de `src/actions/busquedas.ts` y `src/actions/pipeline.ts` para llamadas REST seguras con JWT. La edición de búsquedas limita estrictamente el cuerpo de `PATCH /api/v1/busquedas/:id` a `estado_busqueda`, `prioridad` y `criterios_screening` para cumplir con las reglas del backend.
    *   **Inferencia Asistida por IA (`POST /api/v1/pipeline/:id/evaluar-screening` - Etapa 2):** Desarrollo del modal interactivo `EvaluarScreeningModal.tsx` con chequeos pre-flight (alerta si la búsqueda carece de criterios o si el candidato no tiene CV adjunto), animación de progreso y botón de reintento ante fallos de red.
    *   **Panel de Screening & Prueba de Vida (`ScreeningPanel.tsx` - Etapa 2):** Integración del semáforo tricolor (🟢 SÍ, 🟡 INFERIDO, 🔴 NO) con cajas de evidencia cita textual del CV (`evidencia_cv` en `blockquote`), Fit Score acumulado y bandera roja de alerta excluyente ante fallos *Knockout* (`tiene_knockout: true`).
    *   **Human-in-the-Loop & UI Optimista:** Permitida la modificación manual interactiva del semáforo por parte del reclutador con estado optimista local para feedback instantáneo y recálculo automático de puntajes en el backend (`PATCH /api/v1/pipeline/:id`) con `revalidatePath` para refresco en tableros Kanban.
    *   **Certificación y Pruebas:** Ejecución limpia del compilador TypeScript `./node_modules/.bin/tsc --noEmit` (**0 errores**) y actualización completa de la documentación técnica y funcional del proyecto.

*   **28/07/2026:** Estandarización y Ajustes de Regla en Botón "Avanzar estado" (P-PRE-01, P-CIE-01, P-DIS-01 y P-DIS-02):
    *   **Ajuste de Estado Final en P-DIS-01 y P-DIS-02:** Se eliminó la visibilidad del botón **`Avanzar estado`** para los postulantes en estado `04_rechazado` ("04 - RECHAZADO EN FASE INICIAL") en las vistas Kanban y Lista Detallada de **P-DIS-01** y en la ficha de detalle **P-DIS-02**, debido a que corresponde al estado final de la Fase 1 Descubrimiento.
    *   **Corrección en P-DIS-01 (Descubrimiento - Vista Kanban):** Se integró el botón **`Avanzar estado`** en las tarjetas Kanban para postulantes en estado `03_bloqueado` ("03 - EN DUDA A CONFIRMAR") con tooltip `title="A 04 - Rechazado en Fase Inicial"` y función de transición a `04_rechazado`.
    *   **Botón "Avanzar estado" Estandarizado:** Incorporación del botón estandarizado **`Avanzar estado`** con ícono `>>` (`ChevronsRight`), etiqueta visible y tooltip emergente (`title`) al pasar el cursor (mouse hover) indicando el estado destino en las vistas Kanban y Lista Detallada (columna ACCIONES).
    *   **Pantalla P-PRE-01 (Presentación al Cliente):** Avance de postulantes en Kanban y Lista Detallada entre `09_shortlist`, `10_entrevista_cliente` y `11_standby` con tooltips emergentes (`A 10 - Entrevista con Cliente`, `A 11 - Stand-by / Back-up`).
    *   **Pantalla P-CIE-01 (Cierre del Proceso):** Avance de postulantes en Kanban y Lista Detallada entre `12_oferta_extendida`, `13_contratado` e inactivos (`14_rechazado_cliente` / `15_candidato_se_baja`) con tooltips emergentes (`A 13 - Contratado (Won)`, `A 14 - Rechazado por Cliente (Lost)`, `A 12 - Oferta Extendida / Negociación`).
    *   **Pruebas Automatizadas & Compilación Limpia:** Actualización de pruebas unitarias en `tests/descubrimiento_etapa3.test.js`, `tests/presentacion.test.js` y `tests/cierre.test.js` (100% de éxito en 37/37 pruebas totales) y compilación limpia con `npm run build`.

*   **28/07/2026:** Rediseño Visual y Homologación de Distribución de Secciones en `ID: P-CIE-02` (`/cierre/[id]`):
    *   **Estructura y Layout Inspirados en P-EVA-02:** Reorganización completa de la vista de expediente de cierre y negociación para coincidir milimétricamente con el diseño y distribución de la pantalla `ID: P-EVA-02` (`/evaluacion/[id]`).
    *   **Distribución en 3 Columnas (`grid-cols-1 lg:grid-cols-3`):**
        - *Área Principal (`lg:col-span-2`)*: Ficha Hero del candidato (con badge de fase, Fit Score, puesto, cliente, ubicación, canal de ingreso editable y metadatos de contacto/actividad), Sección de Agendamiento Dinámico de Reuniones (ordenadas descendentemente por fecha/hora con creación/edición/eliminación en modal), Trazabilidad Vertical de Notas del Pipeline (con orden invertido de 5 etapas F4 -> F3 -> F2 -> F1 -> Origen y edición global), y Consola de Facilidades de Cierre e IA — F4 organizadas en tabs navegables (Motor Predictivo, Simulador Salarial, Generador Contratos, Feedback Empatía, Pre-Onboarding).
        - *Barra Lateral (`lg:col-span-1`)*: Panel de Acciones del Pipeline F4 (transiciones de estado interno, botón de retroceso a Fase Cliente y botón de graduación/confirmación de contratación Won), Trazabilidad de Datos del Pipeline (ID Pipeline, ID Búsqueda, Estado y línea de tiempo SLA), y Score Visual circular de Fit Score con estrellas de ponderación.
    *   **Preservación Total de Funciones F4:** Mantención íntegra de la conectividad REST backend (`getBusquedasAPI`, `getCandidatosAPI`, `getPipelineAPI`, `actualizarCandidatoAPI`, `actualizarPipelineAPI`), modals interactivas (Reuniones y Cierre Won) y simulaciones de facilidades salariales y legales.
    *   **Validación Automática:** Suite de 37 tests unitarios aprobados al 100% y compilación de producción de Next.js (`npm run build`) limpia.

*   **27/07/2026:** Integración Multietapa de "Canal de Ingreso (Sourcing)", Sección Dinámica de "Reuniones" y Mutabilidad de Puesto:
    *   **Corrección de Peticiones en Modal `M-IMP-01` / `M-IMP-02`:** Solución al bucle infinito de peticiones al endpoint `/api/v1/candidatos` ocasionado por un ciclo de re-renders al abrir el modal de ingesta de candidato por IA.
    *   **Extensión del Campo "Canal de Ingreso (Sourcing)" (`canal_ingreso`):**
        - Inclusión del selector opcional de `canal_ingreso` y su guardado en el servidor a través de `ImportarIaModal.tsx` (`M-IMP-01` y `M-IMP-02`) y las Server Actions `importarCandidatoIA_API`, `crearCandidatoAPI` y `actualizarCandidatoAPI`.
        - Mapeo y habilitación del selector en el modo de edición de `P-TAL-02` (`/talento/[id]`).
        - Integración completa de visualización, edición y persistencia del canal de ingreso en las pantallas de detalle del pipeline: `P-EVA-02` (`/evaluacion/[id]`), `P-PRE-02` (`/presentacion/[id]`) y `P-CIE-02` (`/cierre/[id]`).
    *   **Sección Dinámica de "Reuniones" y Fase Origen (`Reuniones`):**
        - Reestructuración de la sección en `P-DIS-02` (`/descubrimiento/[id]`): cambio de título a `"Reuniones"`, ordenación automática de la lista por fecha descendente, e incorporación de la insignia/badge de la fase de creación (`fase`, ej. `F1 - Descubrimiento`).
        - Extensión de la interfaz `Reunion` (`src/actions/pipeline.ts`) con el parámetro opcional `fase?: string | null`.
        - Replicación completa de la sección `REUNIONES` en `P-EVA-02` (`/evaluacion/[id]`), `P-PRE-02` (`/presentacion/[id]`) y `P-CIE-02` (`/cierre/[id]`), incluyendo modales interactivos de creación, edición y eliminación, asignando las etiquetas origen `F2 - Evaluación`, `F3 - Presentación` y `F4 - Cierre` respectivamente y sincronizándolas en tiempo real vía `actualizarPipelineAPI`.
    *   **Modificación del Cargo/Puesto (`puesto_postulacion`):** Remoción de `puesto` de la lista de campos inmutables en `actualizarCandidatoAPI` y mapeo de la propiedad `puesto_postulacion` en el payload `PATCH /api/v1/candidatos/:id`, permitiendo mutar el puesto del postulante sin errores HTTP 400.
    *   **Pruebas Automáticas:** Actualización y validación de la suite de pruebas unitarias (`tests/descubrimiento_etapa3.test.js` y `tests/candidatos_etapa2.test.js`), alcanzando un **100% de éxito en 34 pruebas pasadas** y compilación limpia de producción en Next.js (`npm run build`).

*   **27/07/2026:** Estandarización del Botón "CV", Sistema de Identificadores Únicos (P-xxx/M-xxx) y Canal de Ingreso Dinámico:
    *   **Botonera Unificada "CV" (Ícono + Texto):** Incorporación del botón de documento PDF con el ícono `<FileText />` acompañado de la etiqueta de texto `"CV"` en las tarjetas Kanban, columna ACCIONES de Lista Detallada y barras de navegación superiores de todas las fases del pipeline (`/talento`, `/descubrimiento`, `/evaluacion`, `/presentacion`, `/cierre` y sus fichas de detalle `/[id]`).
    *   **Canal de Ingreso Dinámico (`canal_ingreso`):** Implementación de la extracción dinámica de canales de sourcing desde la base de datos backend en tiempo real, permitiendo seleccionar o escribir canales personalizados al vuelo en `/talento/[id]` y en la modal de ingesta `ImportarIaModal.tsx`. Corrección del valor por defecto forzado a `"LinkedIn"`, reflejando correctamente `No especificado` para registros nulos.
    *   **Globalización de Motivo de Rechazo y Resolución:** Extracción de `motivo_rechazo` y objeto `resolucion` al nivel global de `PipelineItem` (`src/actions/pipeline.ts`), posibilitando la edición interactiva del motivo de descarte en el detalle de descubrimiento `/descubrimiento/[id]`.
    *   **Asignación de Identificadores Únicos (`ID: P-xxx` y `ID: M-xxx`):** Incorporación de insignias monospaciadas seleccionables en todas las cabeceras de páginas y ventanas emergentes para facilitar la indicación exacta de componentes en los prompts de desarrollo. Separación explícita de `ID: M-IMP-01` (Modal Ingesta en Talento) e `ID: M-IMP-02` (Parser Ingesta en Descubrimiento).

*   **25/07/2026:** Unificación de Campo "Notas iniciales", Solución de Conexión Cloud Run y Actualización de Manual PDF:
    *   **Unificación Global de "Notas iniciales":** Se estandarizó la denominación y etiqueta del campo `notas_iniciales` a **"Notas iniciales"** en todas las vistas de la plataforma (tablero Kanban, tabla de listado, ficha del candidato `/talento/[id]`, formulario de alta `CandidatoForm.tsx`, modal de importación IA `ImportarIaModal.tsx` y tarjetas de sourcing en Descubrimiento).
    *   **Reordenamiento y Resaltado de Notas en Kanban y Ficha:** En las tarjetas Kanban de la Base de Postulantes (`/talento`) y en la ficha de detalle (`/talento/[id]`), el bloque de **Notas iniciales** se posicionó de manera prominente **antes** de *Rubros / Industrias*, presentado en un panel de contraste ámbar (`bg-amber-500/10 border-amber-500/30 text-amber-100 font-medium italic`).
    *   **Corrección de Conexión a Backend Cloud Run:** Se corrigió la variable `NEXT_PUBLIC_API_URL` en `.env.local` y Server Actions (`candidatos.ts`, `busquedas.ts`, `pipeline.ts`) apuntando al endpoint activo en Google Cloud Run (`https://azulats-service1-795205053212.us-east1.run.app`). Asimismo, se amplió el dataset de respaldo local a **24 postulantes completos** distribuidos en todas las fases.
    *   **Actualización del Manual Funcional y PDF:** Se actualizaron las capturas de pantalla reales y se regeneró el PDF ([manual_funcional.pdf](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-app1/docs/manual/manual_funcional.pdf) - 3.29 MB) sin errores de renderizado.

*   **25/07/2026:** Creación de la Página Dedicada de Detalle de Candidato `/presentacion/[id]`:
    *   **Navegación Standalone:** Se eliminó el contenedor deslizable lateral (slide-over) de `/presentacion` en favor de una página dedicada independiente `/presentacion/[id]` con arquitectura y maquetación homologadas a la página de Evaluación (`/evaluacion/[id]`).
    *   **Historial y Línea de Tiempo SLA:** Integración de la trazabilidad de metadatos de pipeline, estados del backend e historial de cambios con indicador de horas de espera.
    *   **Edición Multietapa de Notas:** Módulo de anotaciones para notas de Origen, F1 Descubrimiento, F2 Evaluación y F3 Presentación con guardado asíncrono en backend (`actualizarCandidatoAPI` y `actualizarPipelineAPI`).
    *   **Suite Completa de Herramientas F3:** Adaptación a sistema de pestañas de todas las herramientascliente (Analítica Telemétrica Zoom, Traductor y Estandarizador ATS, Candidate Briefing Ejecutivo por IA, Orquestador de Agendas Condicional y Bot Rastreador de SLA).
    *   **Graduación a Fase 4 Cierre:** Incorporación del modal interactivo de confirmación para graduar al candidato a Fase 4 Cierre (`11_oferta_extendida`) y redirección automatizada a `/cierre`.

*   **25/07/2026:** Nuevo Estado F2 `07 - En Duda Evaluación`, Renumeración Global de Pipeline y Renombrado en Talento:
    *   **Nuevo Estado Intermedio en F2 Evaluación:** Incorporación del estado `07_en_duda_evaluacion` ("07 - EN DUDA EVALUACIÓN") entre Assessment y Descartado en el pipeline de Evaluación. Columna Kanban propia con color ámbar y botón "En Duda" disponible en tarjetas Kanban y vista Lista Detallada. El estado permite señalar candidatos que requieren revisión adicional sin descartarlos definitivamente.
    *   **Renumeración Completa del Pipeline:** Para acomodar el nuevo estado, todos los estados subsiguientes fueron renumerados en cascada:
        - F2 Evaluación: `07_descartado_interno` → `08_descartado_interno`
        - F3 Presentación: `08_shortlist` → `09_shortlist` · `09_entrevista_cliente` → `10_entrevista_cliente` · `10_standby` → `11_standby`
        - F4 Cierre: `11_oferta_extendida` → `12_oferta_extendida` · `12_contratado` → `13_contratado` · `13_rechazado_cliente` → `14_rechazado_cliente` · `14_candidato_se_baja` → `15_candidato_se_baja`
        - Avance F2→F3: `08_presentado_cliente` → `09_presentado_cliente`
        - Avance F3→F4: `11_oferta_extendida` → `12_oferta_extendida`
        - Retroceso F4→F3 ("Volver a Fase Cliente"): `08_shortlist` → `09_shortlist`
    *   **Grid Kanban F2 a 4 Columnas:** Actualización del layout Kanban de F2 Evaluación de `md:grid-cols-3` a `md:grid-cols-2 xl:grid-cols-4` para mostrar correctamente las 4 columnas (Screening, Assessment, En Duda, Descartado) sin ocultar ninguna.
    *   **Renombrado en Talento:** La columna `DESCARTADO` en el Talent Mixer (`/talento`) fue renombrada a `DESCARTADO (NO SELECCIONAR)` para clarificar la intención de no reutilización del candidato en procesos activos.
    *   **Consistencia Total y Tests:** Actualización de `src/lib/evaluacion.ts`, `src/lib/presentacion.ts`, `src/lib/cierre.ts`, todos los archivos de página y las suites de pruebas unitarias. Compilación TypeScript limpia y **33/33 tests aprobados**.

*   **25/07/2026:** Integración Backend en el Módulo "F4 Cierre del Proceso" (Cierre):
    *   **Conexión a Servicios REST Backend:** Se eliminó el mockeo primario en `/cierre`, conectando la vista directamente a las Server Actions (`getBusquedasAPI`, `getCandidatosAPI`, `getPipelineAPI` y `actualizarPipelineAPI`).
    *   **Carga Dinámica de Búsquedas:** El desplegable de *Búsqueda activa* se puebla en tiempo real desde el backend.
    *   **Persistencia de Estados de Cierre:** Las transiciones entre columnas (`12_oferta_extendida`, `13_contratado`, `14_rechazado_cliente`, `15_candidato_se_baja`) persisten asíncronamente mutando `flujo.estado_actual` y `cierre.fecha_cierre` en el servidor.
    *   **Preservación de Facilidades e IA ("OPERAR"):** Mantenimiento 100% operativo del slide-over interactivo con sus 5 componentes simulados (Motor Predictivo de Aceptación, Simulador Salarial Flexible, Generador de Contratos, Feedback Emocional/Estructurado y Cadencias Pre-Onboarding).
    *   **Resiliencia Visual & Pruebas Unitarias:** Inserción de spinner de carga y banner de error con reintento, pasando con 100% de éxito la suite de pruebas automatizadas (`tests/cierre.test.js`).

*   **25/07/2026:** Integración Backend en el Módulo "F3 Cliente Evaluación" (Presentación):
    *   **Conexión a Servicios REST Backend:** Se eliminó la dependencia de mockups como fuente de datos primaria en `/presentacion`, conectando la vista con las Server Actions (`getBusquedasAPI`, `getCandidatosAPI`, `getPipelineAPI` y `actualizarPipelineAPI`).
    *   **Carga Dinámica de Búsquedas y Filtros:** El selector de *Búsqueda activa* en la barra de filtros principal ahora carga dinámicamente el padrón real de vacantes desde el servidor.
    *   **Persistencia de Estados de Pipeline:** Al arrastrar o reubicar postulantes entre las columnas Kanban o Lista (`09_shortlist`, `10_entrevista_cliente`, `11_standby`), la aplicación emite peticiones PATCH asíncronas vía `actualizarPipelineAPI` para actualizar `flujo.estado_actual` y `fecha_ultimo_cambio` en la base de datos de backend.
    *   **Preservación de Herramientas Inteligentes de Cliente:** Mantenimiento operativo completo de la suite interactiva de herramientas en el slide-over ("Analítica de Entrevistas Zoom", "Traductor y Estandarizador de Perfiles ATS", "Generador de Candidate Briefings", "Orquestador de Agendas Condicional" y "Bot Rastreador de SLA").
    *   **Homologación de Botón "Detalles":** Reemplazado el texto y diseño de "Lanzar Herramientas Cliente" / "Lanzar Herramientas IA" por el botón estandarizado **"Detalles"** con ícono `<Eye />` y estilos idénticos a la página de Evaluación tanto en la vista Kanban como en Lista Detallada.
    *   **Resiliencia Visual:** Inserción de un spinner de sincronización de backend y banner de error con botón de reintento ante contingencias de red.
    *   **Suite de Pruebas Unitarias:** Verificación de la suite de pruebas unitarias (`tests/presentacion.test.js`) con 100% de éxito (4/4 pruebas aprobadas) y compilación limpia sin errores de tipos en TypeScript.

*   **25/07/2026:** Optimización de Usabilidad, Estandarización de Botones y Maquetación en Módulo F1 Descubrimiento:
    *   **Renombrado y Destacado de Campo backend `notas_reclutador`:** Integración del campo `notas_reclutador` en `PipelineItem.f1_descubrimiento` y mapeo en el modelo `SourcedCandidate`. En la interfaz se estandarizó su título a **"Notas Descubrimiento"** (en vista Kanban, tabla Lista Detallada y ficha de detalle `/descubrimiento/[id]`), ubicándolo prioritariamente por encima de las notas iniciales y con resplandor cyan glassmorphism.
    *   **Estandarización de Botones de Cambio de Estado:** Los botones de cambio de estado en Kanban, Lista Detallada (columna ACCIONES) y ficha del candidato (`/descubrimiento/[id]`) se actualizaron a la etiqueta visible **`Avanzar estado`** con ícono `>>` (`ChevronsRight`) y tooltip emergente (`title`) que indica el estado meta (`A 02 - Bloqueado / Pendiente`, `A 03 - En Duda a Confirmar`, `A 04 - Rechazado en Fase Inicial`, `A 01 - Nuevo en Revisión`).
    *   **Botón de Rechazo en Kanban y Lista Detallada:** Se incorporó la etiqueta de texto visible **`Rechazar`** junto al ícono `Ban` tanto en la columna ACCIONES de la vista Lista Detallada como en la botonera de las tarjetas Kanban.
    *   **Botón "Avanzar Fase" (Fase 2 Evaluación):** Estandarización de la etiqueta **`Avanzar Fase`** con icono `<UserCheck />` y tooltip `Avanzar a Fase 2 Evaluación`. Se eliminaron las restricciones de estado inicial, haciendo este botón incondicional y **disponible desde cualquier estado** en todas las filas de Lista Detallada, tarjetas Kanban y la vista de detalle.
    *   **Limpieza de Tarjeta Kanban:** Eliminación de la visualización del dato `ID` en las tarjetas de candidato de la vista Kanban.
    *   **Maquetación Adaptativa y Ajuste de Columnas:** Adición de `flex-wrap` y `whitespace-nowrap` en el pie de tarjetas Kanban para evitar recortes de botones. Reajuste proporcional de los anchos en la tabla Lista Detallada para las columnas `ESTADO` (`190px-210px`) y `NOTAS DESCUBRIMIENTO` (`260px-320px`), eliminando huecos vacíos gigantescos y manteniendo una alineación fluida y compacta.

*   **25/07/2026:** Unificación de Campo "Notas iniciales", Solución de Conexión Cloud Run y Actualización de Manual PDF:
    *   **Unificación Global de "Notas iniciales":** Se estandarizó la denominación y etiqueta del campo `notas_iniciales` a **"Notas iniciales"** en todas las vistas de la plataforma (tablero Kanban, tabla de listado, ficha del candidato `/talento/[id]`, formulario de alta `CandidatoForm.tsx`, modal de importación IA `ImportarIaModal.tsx` y tarjetas de sourcing en Descubrimiento).
    *   **Reordenamiento y Resaltado de Notas en Kanban y Ficha:** En las tarjetas Kanban de la Base de Postulantes (`/talento`) y en la ficha de detalle (`/talento/[id]`), el bloque de **Notas iniciales** se posicionó de manera prominente **antes** de *Rubros / Industrias*, presentado en un panel de contraste ámbar (`bg-amber-500/10 border-amber-500/30 text-amber-100 font-medium italic`).
    *   **Corrección de Conexión a Backend Cloud Run:** Se corrigió la variable `NEXT_PUBLIC_API_URL` en `.env.local` y Server Actions (`candidatos.ts`, `busquedas.ts`, `pipeline.ts`) apuntando al endpoint activo en Google Cloud Run (`https://azulats-service1-795205053212.us-east1.run.app`). Asimismo, se amplió el dataset de respaldo local a **24 postulantes completos** distribuidos en todas las fases.
    *   **Actualización del Manual Funcional y PDF:** Se actualizaron las capturas de pantalla reales y se regeneró el PDF ([manual_funcional.pdf](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-app1/docs/manual/manual_funcional.pdf) - 3.29 MB) sin errores de renderizado.

*   **24/07/2026:** Filtro de Estado por Desplegable en Vista de Lista (`/talento`):
    *   **Visibilidad Condicional en Modo "Lista Detallada":** Los botones/controles de filtro de estado (`Todos`, `Pendiente`, `Revisado`, `Seleccionado`, `Descartado`) se configuraron para renderizarse **únicamente en el modo de vista "Lista Detallada"**, ocultándose automáticamente en la vista "Kanban" (donde todas las columnas de estados ya se presentan en paralelo).
    *   **Menú Desplegable (Dropdown) Homologado con Descubrimiento:** Se transformaron los botones horizontales en un control `<select>` compacto con ícono de flecha personalizado, resaltando en todo momento el estado activo actual y desplegando las opciones con colores distintivos por fase (`Pendiente`, `Revisado`, `Seleccionado`, `Descartado`).
    *   **Autorregulación de Filtros:** Al cambiar al modo Kanban, el filtro de estado se restablece automáticamente a *"Todos"* para asegurar la visibilidad completa de los tableros.

*   **24/07/2026:** Rediseño del Botón de Pantalla Completa Activa ("Restaurar"):
    *   **Mejora de UX en Modo Maximizado:** Se reemplazó el texto *"Salir"* en tono rojo por el término **"Restaurar"** con estilo esmeralda/turquesa de marca (`bg-[#6bd8cb]/15 border-[#6bd8cb]/30 text-[#6bd8cb]`), evitando falsas impresiones de salida de aplicación o acciones destructivas.
    *   **Homologación Multipágina:** Cambio aplicado en `/talento`, `/descubrimiento`, `/evaluacion`, `/presentacion` y `/cierre`.

*   **24/07/2026:** Homologación de Botones de Vista y Función "Maximizar" en Talento (`/talento`):
    *   **Botones de Modo de Vista Homologados:** Se adoptó el diseño exacto de los botones selector de vista de la página `/descubrimiento`: cápsula `bg-white/5` con botones individuales *"Kanban"* (`Grid3X3`) y *"Lista Detallada"* (`List`) con resaltado esmeralda (`bg-[#6bd8cb] text-[#101415]`).
    *   **Botón de Maximizar / Salir de Pantalla Completa:** Integración del control `Maximizar` (`Maximize2` / `Minimize2`) en el panel de filtros de `/talento`. Al activarlo, oculta el banner superior de navegación y expande el tablero Kanban y la tabla de Lista Detallada a pantalla completa (`max-w-none px-2`), aprovechando el 100% de la pantalla sin alterar el comportamiento responsivo en móviles ni tablets.

*   **24/07/2026:** Actualización de Título del Módulo Talento (`/talento`):
    *   **Actualización de Marca e Identidad Visual:** Se actualizó el título principal de la cabecera del módulo en `src/app/talento/page.tsx` pasando de *"Postulantes & Candidatos"* a **"Base de Postulantes"**.

*   **24/07/2026:** Reubicación de Botón de Edición y Protección de "Puesto / Cargo" en Detalle (`/talento/[id]`):
    *   **Reubicación Global del Botón de Edición:** Movido el botón "Editar Ficha" / "Guardar Cambios" / "Cancelar" desde la sub-sección de *Perfil Profesional e Idiomas* a la **barra superior global de navegación** del candidato (al lado del ID y consola DAW), dejando claro que la acción aplica a toda la ficha del postulante.
    *   **Diagnóstico de Inmutabilidad Backend:** Se constató que la API REST del backend (`PATCH /api/v1/candidatos/:id`) rechaza modificaciones sobre `puesto_postulacion` por ser una propiedad histórica de origen (junto a `id`, `acepta_privacidad`, `origen`, `url_cv` y `createdAt`).
    *   **Protección y Guardado Exitoso:** Se configuró el campo `Puesto / Cargo` como lectura de origen inmutable en la interfaz y en `actualizarCandidatoAPI`, permitiendo actualizar y guardar exitosamente todos los demás campos mutables (Nombre, Email, LinkedIn, Teléfono, Ubicación, Skills, Idiomas, Resumen, Rubros y Notas) sin errores 400.
    *   **Pruebas e Integridad:** Verificación de la suite de pruebas unitarias (33/33 tests aprobados) y compilación limpia con `npm run build`.

*   **24/07/2026:** Optimización de la Vista de Lista en Módulo Postulantes (`/talento`):
    *   **Remoción de Columnas Redundantes:** Eliminación completa de las columnas "ID" y "Habilidades Clave" en la tabla en modo lista para simplificar la visualización y optimizar el espacio horizontal.
    *   **Ampliación de Columna de Notas:** Duplicación del ancho de la columna "Notas Iniciales" (`min-w-[480px]`, `max-w-[520px]`) y aumento a 3 líneas de texto visibilizado (`line-clamp-3`), optimizando la lectura directa sin romper el diseño responsivo gracias al contenedor con desplazamiento horizontal suave (`overflow-x-auto`).
    *   **Aislamiento de Notas Iniciales:** La columna "Resumen y Notas" fue renombrada a "Notas Iniciales" y adaptada para mostrar únicamente la anotación directa del reclutador (`notas_iniciales`), removiendo la mezcla de resúmenes y rubros.
    *   **Ordenamiento Dinámico en Cabeceras (Estilo Módulo Descubrimiento):** Implementación de la funcionalidad de ordenación bidireccional (ascendente/descendente) en todas las columnas navegables (`Candidato`, `Puesto`, `Ubicación`, `Notas Iniciales`, `Estado` y `Creado`) mediante clic interactivo e indicadores visuales de `ArrowUpDown`, `ChevronUp` y `ChevronDown`.
    *   **Botones Explícitos de Transición en Columna "Acciones":** Integración de botones destacados de cambio de estado rápido (`A Revisado`, `A Seleccionado`, `A Descartado`, `Reactivar`) con estilos visuales diferenciados que guardan las mutaciones al instante contra el backend, preservando las acciones secundarias de Detalle, CV y Copiar datos.
    *   **Pruebas e Integridad del Sistema:** Verificación completa de la suite de pruebas unitarias (33/33 tests aprobados) y compilación limpia en TypeScript sin incidencias (`npm run build`).

*   **24/07/2026:** Flexibilización de Alta de Postulante (CV PDF Opcional):
    *   **Servicios REST (`src/actions/candidatos.ts`):** Modificación de la Server Action `crearCandidatoAPI` para eliminar la exigencia obligatoria del binario de CV en la validación del servidor. El payload `FormData` omite la clave `cv` si no se adjunta archivo, enviando correctamente la petición al backend.
    *   **Formulario de Alta (`CandidatoForm.tsx`):** Actualización de la interfaz en la función "Alta de Postulante" en `/talento` para remover el asterisco obligatorio (`*`) y actualizar las etiquetas a `(opcional)`. El envío del formulario ya no bloquea al usuario si no se proporciona un archivo PDF.
    *   **Control de Impacto Visual en la App (`/talento` y `/talento/[id]`):** En las tarjetas Kanban, en la tabla de listado y en la ficha de detalle, el botón "Ver CV" se ajusta dinámicamente: para postulantes sin CV se deshabilita la previsualización y se despliega una notificación informativa reactiva ("Este postulante no tiene un archivo CV adjunto"), garantizando que no existan errores ni enlaces rotos.
    *   **Pruebas Automatizadas (`tests/candidatos_etapa2.test.js`):** Nueva prueba unitaria para validar la creación exitosa de un postulante sin archivo adjunto a través de `crearCandidatoAPI`, aprobando el 100% de la suite de tests (33/33 tests).

*   **24/07/2026 (Fase 2):** Integración completa de Resumen Profesional (`resumen`) y Rubros (`rubros`):
    *   **Alta Manual e Importación IA:** Modificación del formulario manual (`CandidatoForm.tsx`) para incluir campos independientes para y capturar la información en la creación manual de los candidatos de `resumen` y `rubros`.
    *   **Priorización de Entrada del Reclutador:** Modificación en las rutas del backend (`azulats-service1`) para priorizar la entrada manual del usuario (`req.body.notas_iniciales`) evitando que sea reemplazada por texto de IA, el cual ahora se guarda separadamente en `resumen` y `rubros`.
    *   **Visualización y Edición en detalle / listado:** Visualización y edición en `/talento` (tanto en tarjetas Kanban como en la tabla de listado) y en `/talento/[id]` diferenciándolos de `notas_iniciales` y dándoles estilos visuales específicos.
    *   **Pruebas unitarias:** Actualización de las suites de pruebas automatizadas (`tests/candidatos_etapa1.test.js` y `tests/candidatos_etapa2.test.js`) aprobadas con 100% de éxito.

*   **24/07/2026:** Integración completa de Notas Iniciales (`notas_iniciales`):
    *   **Alta Manual e Importación IA:** Incorporación del campo `notas_iniciales` en el formulario manual (`CandidatoForm.tsx`) y en el modal de importación por IA (`ImportarIaModal.tsx`), enviando la información estructuradamente mediante `importarCandidatoIA_API`.
    *   **Visualización en Tablero y Lista:** Se muestra el nuevo campo tanto en el Grid de tarjetas Kanban (truncando el texto con tooltip en hover) como en una columna dedicada de la tabla de listado en `/talento`.
    *   **Dashboard y Fichas de Detalle:** El campo es editable y persistido correctamente con las Server Actions unificadas de candidatos.
    *   **Pruebas e Integridad:** Nueva suite de pruebas automatizadas en `candidatos_etapa2.test.js` para certificar el paso limpio de notas desde importación por IA, manteniendo 100% de éxito en compilación de producción de Next.js.

*   **22/07/2026:** Rediseño Kanban, Asignación Activa de Búsquedas, Ruteo por ID de Pipeline y Renombramiento de Estados:
    *   **Tablero Kanban en Talento:** Rediseño de la vista principal del módulo de talentos `/talento` para organizar a los candidatos en 4 columnas: PENDIENTE, REVISADO, SELECCIONADO y DESCARTADO, soportando Drag & Drop nativo.
    *   **Modal de Asignación Activa:** Creación de popup glassmorphic interactivo que intercepta transiciones al estado SELECCIONADO para asociar al postulante a una búsqueda activa y registrar un nuevo documento en la colección de `pipeline` en estado inicial.
    *   **Ruteo Detalle por ID de Pipeline:** Actualización de la página de detalle `/descubrimiento/[id]` para emplear el ID del Pipeline asíncronamente con un fallback robusto hacia el id de Candidato.
    *   **Ficha de Metadatos y SLA Timeline:** Incorporación de un visor con metadatos de vinculación del reclutamiento e historial visual secuencial de cambios de estado (SLA tracker).
    *   **Renombramiento de Estados de Descubrimiento:** Remodelación completa de las nomenclaturas para el pipeline de descubrimiento en tablero de columnas, tablas, dropdowns, y mapeos persistentes:
        - `01 - Nuevo (Para Revisión)` ➔ `01 - Nuevo en Revisión` / `01 - NUEVO EN REVISION`
        - `02 - Selección en Marcha / Contactado` ➔ `02 - Bloqueado / Pendiente` / `02 - BLOQUEADO / PENDIENTE`
        - `03 - Bloqueado / Pendiente` ➔ `03 - En Duda a Confirmar` / `03 - EN DUDA A CONFIRMAR`
        - `04 - Descartado / Rechazado / Fase Inicial` ➔ `04 - Rechazado en Fase Inicial` / `04 - RECHAZADO EN FASE INICIAL`
    *   **Compatibilidad y Pruebas:** Implementación de consultas adaptativas insensibles a mayúsculas para retrocompatibilidad con registros existentes, garantizando que el paso de tests automatizados unitarios locales sea del 100%.

*   **22/07/2026 (Stage 3):** Migración del Backend de Descubrimiento - Etapa 3 (Detalle y Sincronización IA Backend):
    *   **Integración del Detalle de Candidatos:** Conexión de `/descubrimiento/[id]` con Server Actions dinámicas. Realiza carga unificada de candidato (`getCandidatosAPI`), búsquedas (`getBusquedasAPI`) y el pipeline correspondiente (`getPipelineAPI`) para poblar el modelo `SourcedCandidate`.
    *   **Mutaciones Dinámicas del Detalle:** Refactorización de `handleSave` y `handleTransitionState` para persistir los cambios mediante Server Actions directas al backend (nombre, puesto, ubicación, notas de motivación, enlace al portfolio/LinkedIn y motivos específicos de descarte/bloqueo).
    *   **Persistencia Física de IA y Outreach:** Captura automática y persistencia con `actualizarPipelineAPI` de los resultados dinámicos tanto del **Match Semántico** (`analisis_semantico` con fit_score, origen, fortalezas, etc.) como del **Outreach Directo** (con su variante y custom outreach templates).
    *   **Fallback Seguro de Conexión:** Robustez añadida mediante cacheo inteligente en `localStorage` ante errores de conexión HTTP de la base de datos, con opción UI para reintentar la llamada.
    *   **Suite de Pruebas Automatizadas:** Creación de `tests/descubrimiento_etapa3.test.js` bajo `node:test` + `tsx` para garantizar que la capa REST del detalle maneja adecuadamente campos permitidos vs denegados y la consolidación de datos IA.

*   **22/07/2026 (Stage 2):** Migración del Backend de Descubrimiento - Etapa 2 (Escritura y Mutaciones de Pipeline):
    *   **Mutaciones del Pipeline:** Implementación de las Server Actions `crearPipelineAPI`, `actualizarPipelineAPI` y `eliminarPipelineAPI` para persistir cambios en el backend.
    *   **Transiciones Kanban Persistentes:** Integración en `handleTransitionState` de llamadas a la API mediante `actualizarPipelineAPI` para persistir los cambios de estado (arrastre Drag & Drop, selección rápida, especificación de motivos de rechazo/bloqueos).
    *   **Ingest Inteligente de CV:** Actualización de la acción de ingestión OCR CV (`handleIngestSubmit`) para crear primero el perfil del candidato vía API (`crearCandidatoAPI`) y luego vincularlo automáticamente en el pipeline (`crearPipelineAPI`).
    *   **Suite de Pruebas Automatizadas:** Creación de `tests/descubrimiento_etapa2.test.js` para asegurar y validar las operaciones de escritura/mutación contra el backend de pipeline.

*   **22/07/2026:** Migración del Backend de Descubrimiento - Etapa 1 (Lectura del Pipeline):
    *   **Consolidación del Pipeline de Búsquedas:** Integración de la Server Action `getPipelineAPI` para consultar items de pipeline asociados a `id_busqueda` contra la API del backend.
    *   **Sincronización en Tablero y Lista:** Refactorización de la vista `/descubrimiento/page.tsx` para cargar dinámicamente las postulaciones y búsquedas activas vía REST, eliminando el mockeo basado puramente en `localStorage` inicial.
    *   **Preservación de Features Simuladas:** Mantenimiento operativo de la importación rápida OCR CV, generación Boolean & X-Ray AI (Gemini 1.5 Flash) y Triage de WhatsApp mediante mutaciones locales en el estado reactivo principal.
    *   **Suite de Pruebas Automatizadas:** Creación de `tests/descubrimiento_etapa1.test.js` bajo `node:test` + `tsx` para verificar el correcto flujo de autorización HTTP y deserialización de items de pipeline del backend.

*   **21/07/2026:** Lanzamiento e integración del Módulo "F4 Cierre del Proceso" (Cierre):
    *   **Tablero Kanban y Detalle en Lista:** Construcción del pipeline final para la entrega al candidato o cierre del expediente (Oferta Extendida / Negociación, Contratado - Won, Rechazado Cliente - Lost, Candidato se baja - Drop-out) con arrastre nativo Drag & Drop, conmutador de pantalla completa, y ordenamiento interactivo multitabla.
    *   **Indicadores KPI y Límites WIP:** Mapeo automatizado de Decision Latency (tiempo de respuesta de la oferta en horas), Constructive Feedback Rate (cobertura de feedback empático y estructurado en descartes), Offer Acceptance Rate (OAR) y WIP de ofertas activas con avisos dinámicos en cabecera si supera el límite de 5 procesos concurrentes.
    *   **Consola de Herramientas de IA para Cierre (Slide-over):** Cajón lateral interactivo con 5 pestañas de simulación funcional: Motor Predictivo de Aceptación (estimación de probabilidad base vs ajustada por mitigadores), Simulador de Salario y Beneficios en Especie (salario flexible interactivo con slider), Copiloto Redactor de Contratos (compilación de fecha e indefectibilidad contractual), Redactor de Empathy Feedback estructurado, y Programador de Cadencias de Pre-Onboarding (adición de hitos interactiva con actualización en timeline en tiempo real).
    *   **Suite de Pruebas Unitarias:** Creación de `tests/cierre.test.js` bajo `node:test` + `tsx` para certificar la consistencia del dataset inicial y la precisión de los KPIs y límites de concurrencia.
    *   **Navegación Global Unificada:** Integración del botón horizontal de acceso rápido "F4 Cierre" en todas las cabeceras compartidas (Dashboard, Descubrimiento, Evaluación, Presentación, Configuración, Búsquedas y Talentos).

*   **21/07/2026:** Lanzamiento e integración del Módulo "F3 Cliente Evaluación" (Presentación):
    *   **Tablero Kanban y Detalle en Lista:** Construcción del pipeline final para la entrega al cliente (Shortlist, Entrevista, Standby) con arrastre nativo y controles avanzados de visualización (modo pantalla completa, filtros dinámicos por cliente/búsqueda y ordenación multitabla).
    *   **Indicadores KPI de Negocio y Alertas SLA:** Mapeo automatizado del Stakeholder Blockage Time (demora de feedback en horas), Calibration Accuracy, cNPS promedio de entrevistas con clientes y control de sobrecarga con alerta de saturación de cola (límite de 10 candidaturas activas en calibración cliente).
    *   **Consola de Herramientas de IA para Calibración (Slide-over):** Panel interactivo con 5 herramientas operativas simuladas con feedback dinámico, simulación de estados y toasts interactivos: Analítica de Entrevistas Zoom/Meet (Sentiment score y microexpresiones con guardado local persistente), Traductor y Estandarizador de Perfiles (Inglés unificado ATS), Generador de Executive Candidate Briefings redactados por IA, Orquestador de Agendas Condicional (sugerencia de horario óptimo) y Bot de alerta de escalamiento e incidencias de SLA.
    *   **Suite de Pruebas Unitarias:** Creación de `tests/presentacion.test.js` bajo `node:test` para certificar la consistencia del dataset inicial y la precisión de los KPIs y límites WIP.
    *   **Navegación Global Unificada:** Integración del botón horizontal de acceso rápido "F3 Cliente Evaluación" en todas las vistas de la aplicación (Dashboard, Búsquedas, Reclutamiento, postulación/Talento, Ajustes/Configuración y F2 Evaluación).

*   **21/07/2026:** Lanzamiento e integración del Módulo "F2 Evaluación":
    *   **Tablero Kanban y Lista Glassmorphic:** Implementación del pipeline interactivo (Screening, Assessment, Descartado) con soporte Drag & Drop nativo de HTML5, animación de transiciones de fase y vista detallada en tabla ordenable.
    *   **Indicadores KPI de Negocio:** Cálculos automáticos de WIP Cycle Time, cNPS promedio e índice Pass-through Rate, con alertas visuales de sobrecarga (límite de 10 candidatos activos en cola).
    *   **Herramientas Operativas Avanzadas de IA:** Slide-over contextual con tabulación interactiva que alberga simuladores visuales para el Sintetizador de llamadas (Pros/Cons/Riesgos), Detector Cronológico (Gaps/Overlaps), Preguntas STAR con copiado rápido, Validador de Identidad/Entorno (IP/Geofencing/Cámara) y AI Co-Pilot (Entorno de Live Coding con sandbox en Rust y TSX).
    *   **Suite de Pruebas Unitarias:** Creación de `tests/evaluacion.test.js` bajo el framework nativo `node:test` para certificar la precisión del dataset inicial y el correcto cómputo de desviaciones en KPIs.

*   **20/07/2026:** Integración de la Importación Asistida por IA (Módulo Postulantes):
    *   **Server Actions Ampliadas:** Incorporación de la Server Action `importarCandidatoIA_API(formData)` en `src/actions/candidatos.ts` para gestionar el enlace asíncrono y seguro con el endpoint `POST /api/v1/candidatos/importar-ia` inyectando JWT.
    *   **Popup de Importación Conectado (`ImportarIaModal.tsx`):** Desarrollo del modal de importación premium con soporte exclusivo para archivos `.pdf`, `.doc` y `.docx` hasta 5MB. Implementa una interfaz de bloqueo visual (blocker overlay) y spinner animado para salvaguardar la sincronización y la experiencia de usuario.
    *   **Acceso e Interactividad Refrescada (`/talento`):** Botón "✨ Importar con IA" junto al botón de registro manual, con notificación de éxito verde conteniendo el nombre extraído del candidato por IA e invocación reactiva a la carga de datos (`loadCandidatos()`).

*   **20/07/2026:** Integración de Fase 2 (Detalles) y Fase 3 (Integración de Gemini AI Live) en Módulo F1 Descubrimiento:
    *   **Página Detallada de Candidato (/descubrimiento/[id]):** Creación de la vista premium en profundidad, persistencia y sincronización dinámica mediante `localStorage`, modal integrado de edición de campos y transiciones rápidas del pipeline de reclutamiento.
    *   **Servicios Live de Google Gemini (1.5 Flash):** Implementación del módulo asíncrono centralizado en `src/lib/gemini.ts` con llamada HTTP de producción a la API y resiliencia auto-failover hacia mocks locales en fallas de API Key o red.
    *   **Motor de Matching Semántico Integrado:** Incorporación del bot de análisis semántico del CV contra vacantes en las vistas de board y detalles, con clasificación de puntos clave (fortalezas, debilidades, recomendaciones) y visualización del tipo de origen (`✨ GEMINI LIVE` / `📋 MOCK`).
    *   **Redactor de Outreach Personalizado & A/B Tests:** Generación asíncrona de invitaciones específicas mediante IA integradas con el conmutador de variantes A y B en la pantalla detallada.
    *   **Constructor de Búsquedas Booleanas:** Generador inteligente de cadenas avanzadas booleanas y X-Ray, con autocompletado de presets, simulación directa de candidatos mapeados, y visualización de origen del dato en tiempo real.
    *   **Optimización de Tipado del Proyecto:** Limpieza y modularización de la interfaz `SemanticMatchResult` para unificar el retorno de datos entre vistas y gemini hooks, logrando una compilación modular sin fallos en Next.js.

*   **20/07/2026:** Integración de Nuevos Campos de Candidato, Modo Edición y Vista de Lista Alternable (Etapas 1 y 2):
    *   **Mapeo de Datos & Inmutabilidad:** Modificación del server action `getCandidatosAPI` en `src/actions/candidatos.ts` para mapear de manera robusta los 6 campos adicionales (`telefono_movil`, `ubicacion`, `skills_principales`, `nivel_ingles`, `otros_idiomas` y `notas_iniciales`). Actualización de `actualizarCandidatoAPI` para implantar protección sobre metadatos históricos inmutables.
    *   **Modo Edición Interactivo y Detalle:** Panel derecho de la ficha `/talento/[id]/page.tsx` dotado de conmutador de edición (`isEditing`) y validaciones en tiempo real para actualizar en caliente los campos mutables del perfil.
    *   **Vista de Lista Alternable:** Agregados controles toggle de tipo rejilla y lista en la bandeja `/talento` con almacenamiento persistente del layout preferido en `localStorage`. Renderiza una tabla glassmórfica con columnas para el ID, Candidato (nombre y email), Puesto, Ubicación, Habilidades clave y fecha de creación, junto a un botón "Detalle" de redirección.
    *   **Formulario de Alta Ampliado:** Extensión del Slide-over en `CandidatoForm.tsx` con inputs para los 6 nuevos campos, incluyendo validación interactiva de formato (3 a 5 tags en habilidades).
    *   **Automatización de Pruebas:** Implementación de dos suites completas de pruebas unitarias (`tests/candidatos_etapa1.test.js` y `tests/candidatos_etapa2.test.js`) ejecutadas a través del runner nativo de Node.js.

*   **18/07/2026:** Integración Definitiva con Backend Real (módulo **Postulantes**):
    *   **Remoción de Mocks:** Desconexión y eliminación absoluta de `mockCandidatos` y `useMockDB()` en `src/actions/candidatos.ts`.
    *   **Integración de Servicios:** Enrutamiento de todas las peticiones POST, GET, PATCH y DELETE directamente al backend, normalizando tipos e inyectando tokens JWT de Firebase.
    *   **Enrutamiento Local:** Reconfiguración de `NEXT_PUBLIC_API_URL` en `.env.local` hacia la instancia backend local `http://localhost:8080` (en `azulats-service1`) para evitar el error 404 del contenedor antiguo en Cloud Run.
    *   **Ayuda de Estados (Tooltip):** Agregado botón de ayuda emergente interactiva (`HelpCircle` con tooltip flotante adaptable a móviles/desktop) en la sección de filtros por estado.
    *   **Limpieza de UI de Tarjetas:** Eliminación de la visualización del ID único de candidato por encima del nombre en las tarjetas individuales de la grilla principal.
    *   **Función de Copiar al Portapapeles:** Introducción de un botón con micro-interacciones (ícono de `Copy` que cambia dinámicamente a checkmark de éxito en color verde `#4ade80` al completar la acción) al lado del botón de ver CV en el listado y detalle. Permite copiar una plantilla de texto plano y legible con toda la información clave del postulante para pegar directo en correos/mensajería.
    *   **Resolución Segura de PDF CV (Bypass 403):** Creación del endpoint `/api/v1/candidatos/:id/cv` en el backend Express y su respectiva habilitación de token por query param en el middleware `verificarToken`. En el frontend, se redireccionan los clicks a este endpoint de streaming seguro, evitando el error `Firebase Storage: User does not have permission... (storage/unauthorized)` al sortear restricciones de reglas del SDK del cliente de Firebase.
    *   **Resumen Profesional (Consola de Detalle):** Se agregó la sección superior "Resumen Profesional" (como un contenedor o tarjeta con el texto "A desarrollar" de fondo italicizado) en el panel derecho de la ficha del postulante, anticipando la futura integración con modelos de lenguaje backend para extractos de perfiles.

*   **18/07/2026:** Ajustes de Nomenclatura, Usabilidad de Correo y Claridad en la vista del módulo **Postulantes**
    *   **Nomenclatura Superior:** Se renombró el botón global del menú superior de "Base de Talentos" a "Postulantes" en todas las vistas de la aplicación.
    *   **Interactividad en Emails (mailto):** Se convirtieron los campos visuales de correo electrónico (en las tarjetas individuales del listado y en la vista de configuración del perfil del usuario) en enlaces interactivos del tipo `mailto:` para facilitar el contacto directo.
    *   **Acción Limpia:** Cambiado el botón de las tarjetas individuales en `/talento` de "Fader Mixer" a "Detalles" para mayor claridad del flujo del usuario.

*   **18/07/2026:** Finalización de la **Fase 3 (Gestión de Roles y Borrado Físico - Derecho al Olvido)** del módulo **Talent Mixer (Postulantes)**:
    *   **Gestión de Roles (Super Administrador):** Extensión de la lógica de roles en `AuthContext.tsx` para admitir dominios `.es` de la organización Digital Ágil en adición al dominio `.com`.
    *   **Zona de Peligro (Derecho al Olvido):** Integración de listado de candidatos en la pantalla de Ajustes y habilitación del botón "Eliminar Permanentemente" por medio del server action `eliminarCandidatoAPI(id, true)`.
    *   **Double-Step Confirmation Modal:** Desarrollo del popup de seguridad para la confirmación de la purga física definitiva de base de datos (Firestore) y archivos binarios (currículums adjuntos PDF) en Cloud Storage mediante validación de palabra clave `CONFIRMAR`.

*   **18/07/2026:** Finalización de la **Fase 2 (Panel de Postulantes en Grilla y Formulario de Alta)** del módulo **Talent Mixer (Postulantes)**:
    *   **Bandeja Principal (/talento):** Construcción del panel interactivo con visualización responsive en grid, buscador reactivo y estados luminosos dinámicos según el estado del candidato.
    *   **Formulario Slide-over (Alta Manual - `CandidatoForm.tsx`):** Formulario embebido con animación de etiquetas flotantes, zona Drag and Drop con verificación restrictiva de la extensión (sólo `.pdf`) y peso (máximo 5MB), consentimiento RGPD y manejo visual de códigos de error API HTTP `400 Bad Request`.
    *   **Consola DAW (Fichas del Detalle - `/talento/[id]`):** Detalle de perfil recreando una consola ecualizadora MIDI con faders de IA analógicos (*Hard Skills*, *Soft Skills*, *Fit Cultural*, y *Seniority*) y control de Soft Delete.

*   **18/07/2026:** Finalización de la **Fase 1 (Infraestructura de Datos y Seguridad)** del nuevo módulo **Talent Mixer (Postulantes)**:
    *   **Seguridad en Edge:** Configuración del proxy interceptor perimetral `src/proxy.ts` para proteger la ruta `/talento`, forzando redirección automática a `/login` para usuarios no autenticados.
    *   **Conector API REST & Mock Fallback:** Creación de Server Actions en `src/actions/candidatos.ts` para operaciones CRUD en Cloud Run con un sistema seguro de datos simulados en memoria (Mock database fallback), previniendo fallos en pruebas locales y forzando `acepta_privacidad: true` y control de inmutabilidad selectiva.
    *   **Navegación Coherente:** Integración del enlace universal y horizontal hacia `/talento` (Talent Mixer, representado con icono `Sliders`) en todas las barras superiores compartidas: Dashboard, Búsquedas, Reclutamiento y Ajustes.

*   **13/08/2026:** Homologación y Fix del Combo Desplegable "Búsqueda" en todo el Pipeline (`F1 Descubrimiento`, `F2 Evaluación`, `F3 Presentación`, `F4 Cierre`):
    *   **Inclusión de Propiedades de Vacante en Candidato:** Inyección de `searchId`, `searchCode`, `searchRole` y `searchClient` en los modelos de candidato (`SourcedCandidate`, `EvaluacionCandidate`, `PresentacionCandidate`, `CierreCandidate`) y en los utilitarios de mapeo (`src/lib/presentacion.ts`, `src/lib/cierre.ts`).
    *   **Regla de Filtrado Multicapa Resiliente (`matchesSearchFilter`):** Se actualizó el filtrado en las 4 páginas del pipeline (`descubrimiento`, `evaluacion`, `presentacion`, `cierre`) para evaluar la coincidencia del candidato por ID técnico (`searchId`), por código legible (`searchCode`), por título compuesto de vacante (`searchRoleCombined`) o por puesto individual. Esto soluciona la divergencia cuando `cand.puesto` ("No especificado") difiere de `busq.perfil_busqueda` y garantiza que los candidatos se muestren correctamente en el tablero al filtrar por una búsqueda.
    *   **Identificadores Técnicos en Valores `<option>`:** Estandarización de `value={b.id_busqueda || b.id}` en los elementos `<select>` manteniendo las etiquetas legibles `[codigo_busqueda] Cliente - Perfil`.

*   **13/08/2026:** Requerimiento Funcional en Pantalla P-DIS-01 (Descubrimiento): Incorporación de la vista "Lista Screening IA":
    *   **3er Modo de Vista en Sección de Filtros:** Expansión del selector de vistas (`Kanban`, `Lista Detallada`, `Lista Screening IA`) con ícono `Sparkles` y resplandor esmeralda. El filtro por estado `Estado Cand.` se encuentra disponible dinámicamente para ambos modos de lista.
    *   **Columnas de Screening Inteligente IA (Homologadas a P-DIS-02):** Implementación de la tabla glassmorphic con columnas dedicadas: *Fit Score IA* (`fit_score_screening` / `pts`), *Alerta Knockout* (`🔴 INCUMPLIDO` / `🟢 CUMPLIDO`), *Desglose Criterios & Semáforo* (`SÍ` 🟢, `INFERIDO` 🔵, `NO` 🔴), *Evidencia CV (Prueba de Vida)* (citas textuales del CV), *NOTAS DESCUBRIMIENTO* (recruiterNotes en glassmorphism cyan), *Estado* y *Acciones* (`Detalles`, `CV`, `Avanzar estado`, `Avanzar Fase`, `Rechazar`, e icono `Re-evaluar IA`).
    *   **Suite de Pruebas Automatizadas:** Creación del archivo de pruebas unitarias/integración `tests/descubrimiento_screening_ia_view.test.js` con verificación de `viewMode`, mapeos de campos de screening, alertas knockout y semáforos.

*   **13/08/2026:** Extensión global del soporte `codigo_busqueda` e `id_busqueda` en todas las pantallas del pipeline (`P-DIS-01`, `P-DIS-02`, `P-EVA-01`, `P-EVA-02`, `P-PRE-01`, `P-PRE-02`, `P-CIE-01`, `P-CIE-02`, `P-TAL-01`, `M-IMP-01/02`). Se formatearon las opciones de los desplegables `<select>` de Búsqueda con la etiqueta legible `[codigo_busqueda] Cliente - Perfil`, se actualizó la indexación multiclave en los utilitarios `busqMap`, y se incluyeron los badges de trazabilidad en los expedientes de candidato.

*   **13/08/2026:** Adaptación del frontend ante la migración de esquema en Firestore para la colección `busquedas` (`id_busqueda` como ID técnico Firestore y `codigo_busqueda` como código alfanumérico legible). Actualizadas las interfaces `Busqueda` y `BusquedaPayload` en `src/actions/busquedas.ts`, el renderizado en la tabla `P-BUS-01`, el formulario `P-BUS-02` y el enrutamiento seguro.

*   **13/07/2026:** Finalización del CRUD del Maestro de Búsquedas mediante el desarrollo de flujos interactivos de lectura y actualización (Edit Mode). Se agregaron filas clicables y botones de acción en la tabla (`src/app/busquedas/page.tsx`), soporte de datos reactivos `initialData` en `SearchForm.tsx` con selectors dinámicos de fase editables, e integración hacia el endpoint Server Action `actualizarBusquedaAPI(id, payload)` vía PATCH.

*   **13/07/2026:** Migración del conector API REST a Server Actions (`src/actions/busquedas.ts`) para resolver el error de CORS del navegador (`Failed to fetch`). La obtención de tokens e invocación a los endpoints de Cloud Run ahora ocurren en el servidor usando cookies seguras.

*   **13/07/2026:** Ejecución de auditoría de integración y QA Automation: se mejoró la resiliencia del listado de búsquedas implementando un estado vacío (Empty State) explícito cuando no hay registros en la base de datos de la API, y se verificaron los límites transaccionales de guardado del Slide-over.

*   **13/07/2026:** Conectada la vista del Maestro de Búsquedas (`src/app/busquedas/page.tsx`) a la API de Cloud Run. Sustitución de datos de maqueta (mock data) por persistencia real a través del método `getBusquedasAPI()` con inyección de JWT, cargadores asíncronos y filtros dinámicos.

*   **13/07/2026:** Conectado el formulario del Slide-over con la API REST real de Cloud Run en `src/actions/busquedas.ts`, implementando `getAuthToken()` para inyección de token Bearer y control específico para Multi-Status (207) y códigos de error.

*   **13/07/2026:** Resolución de incidencias de auditoría: se implementó estado visual de carga (cargador giratorio) en botón Google Sign-In ([F2]) y protección de doble anillo del lado cliente (HOC/useEffect) en todas las páginas protegidas de la aplicación ([T3]).

*   **12/07/2026:** Creación de estado global de autenticación y vinculación de datos reales al perfil de usuario.

*   **12/07/2026:** Implementación funcional del Login y redirección al Dashboard.

*   **12/07/2026:** Desarrollo de la vista de Configuración y finalización del UI Shell base.

*   **12/07/2026:** Desarrollo de la interfaz de Recruitment Management sincronizada con Stitch.

*   **12/07/2026:** Conexión de SearchForm con API externa, integración de Server Actions y manejo de estados UI.

*   **12/07/2026:** Desarrollo de SearchForm.tsx integrado en Slide-over con validación de datos base.
*   **12/07/2026:** Implementación de la vista principal de Búsquedas y componente Slide-over base.
*   **12/07/2026:** Implementación de UI del Dashboard Gerencial (Filtros, KPIs y Recharts).
*   **12/07/2026:** Inicialización del proyecto y configuración base de Firebase y el inicio de sesión glassmórfico.

