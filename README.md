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
│   │   │   └── CandidatoForm.tsx  # Formulario del Postulante (PDF <5MB, floating labels, RGPD)
│   │   ├── globals.css            # Estilos globales y tokens del Stitch Design System
│   │   ├── layout.tsx             # Layout base, tipografía Google Font Manrope
│   │   ├── dashboard/page.tsx     # Dashboard Gerencial con filtros temporales y de clientes
│   │   ├── login/page.tsx         # Interfaz Premium Glassmorphic de inicio de sesión
│   │   ├── talento/
│   │   │   ├── page.tsx           # Talent Mixer (Grid responsive de candidatos con filtros)
│   │   │   └── [id]/page.tsx      # Ficha del Candidato (DAW Console faders de métricas IA)
│   │   └── configuracion/page.tsx # Panel de Ajustes y "Zona de Peligro" (Derecho al Olvido)
│   ├── actions/
│   │   ├── busquedas.ts           # Server Actions para llamadas REST a búsquedas
│   │   └── candidatos.ts          # Server Actions para crear, actualizar y borrar postulantes
│   ├── lib/
│   │   └── firebase/
│   │       ├── config.ts          # Singleton de inicialización Firebase
│   │       └── auth.ts            # Métodos de autenticación y manejo de cookies
│   └── proxy.ts                   # Seguridad Edge de rutas en Next.js 16 (Cookie check guard)
```

---

## Configuración y Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto para conectar las claves cliente oficiales de Firebase:

```env
# Claves Cliente de Firebase Auth
NEXT_PUBLIC_FIREBASE_API_KEY=tu_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=tu_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=tu_firebase_app_id
```

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

## Datos Funcionales - Módulos de la Aplicación

### Módulo A: Portal de Inicios de Sesión
*   Brinda acceso seguro con tokens de sesión persistentes de 7 días.
*   Presenta interfaces adaptativas glassmorphism y selección de flujo Firebase vs Demo.

### Módulo B: Dashboard Gerencial
El **Dashboard Gerencial** sirve como un centro de control analítico de reclutamiento enfocado en los mercados de España (ej. sedes en Madrid, Barcelona, Valencia, Bilbao).
*   **Filtros Globales:** Permite acotar las visualizaciones estadísticas por intervalos temporales y clientes corporativos clave (ej. Telefónica S.A., Banco Santander, SEAT S.A.).
*   **KPIs de Rendimiento:** Centraliza la cuantificación rápida del volumen de búsquedas activas, postulantes en bandeja, y el tiempo promedio que toma asignar a un recurso (lead-time).
*   **Analíticas Históricas:** Cuenta con gráficos interactivos que trazan el comportamiento histórico y la carga laboral mensual de los evaluadores de talento, conectable en fases subsecuentes al pipeline de BigQuery.

### Módulo C (UI): Maestro de Búsquedas con tabla de datos y contenedor Slide-over
El **Maestro de Búsquedas** centraliza todas las solicitudes de personal y vacantes en curso de forma dinámica.
*   **Búsqueda y Filtros en Tiempo Real:** Barra de búsqueda fluida (búsqueda por cargo, cliente y responsable operativo) y filtrado selectivo según el estado de la búsqueda (`preparacion_previa`, `evaluacion_tecnica`, `revision_cliente`, `oferta_cierre`).
*   **Conexión API REST:** Carga de registros en tiempo real consumiendo el endpoint `GET /api/v1/busquedas` con cabeceras `Authorization: Bearer <token>` inyectadas automáticamente.
*   **Estados de Carga y Error:** Inserción de un spinner de carga en el centro de la tabla durante solicitudes de red y manejo de reintentos manuales ante caídas de enlace.
*   **Slide-over Contenedor de Alta:** Panel lateral interactivo y deslizable (Slide-over) para la creación de ofertas sin interrupciones de navegación.
*   **Formulario de Alta de Búsquedas (Cédula de Identidad):** Formulario de alta con 6 campos obligatorios (cliente corporativo de España, perfil de búsqueda, estado_fase inhabilitado, responsable operativo, responsable validación, fecha inicio objetivo) con validación previa en cliente.

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
*   **Bandeja Principal (/talento):** Listado responsivo en formato de tarjetas con indicadores de burbuja de luz led reactivos según el estado. Cuenta con buscador en caliente y barra de clasificación por fase.
*   **Consola DAW (Faders de Calificación IA):** Faders de ecualización analógicos simulados e interactivos dentro de la ficha de detalle (`/talento/[id]`) para calificar en caliente los scores de *Hard Skills*, *Soft Skills*, *Fit Cultural* y *Seniority Index*.
*   **Slide-over de Alta de Candidato:** Formulario con etiquetas flotantes dinámicas, Drag-and-drop de archivos PDF, control estricto de consentimiento legal y captura inteligente para alertas de error `400 Bad Request` del servidor.
*   **Importación Asistida por IA:** Popup glassmórfico de importación con zona Drag & Drop compatible con formatos `.pdf`, `.doc` y `.docx` (máx 5MB). Realiza la llamada asíncrona a `POST /api/v1/candidatos/importar-ia` del backend, bloquea la interfaz durante la inferencia y muestra una notificación de éxito reactiva con autorefresco de la base de candidatos tras su creación (201).

### Módulo G: F1 Descubrimiento (Atracción & Sourcing inicial)
El **F1 Descubrimiento** brinda a los reclutadores el tablero maestro de sourcing potenciado por inteligencia artificial para detectar y evaluar candidatos.
*   **Estructuración Kanban Estricta:** Pipeline clasificado en 4 columnas de progresión (`01 - Nuevo (Para Revisión)`, `02 - Contactado (En Espera)`, `03 - Bloqueado / Pendiente` y `04 - Rechazado en Fase Inicial`).
*   **Métricas de Funnel Temprano:** KPI cards en cabecera para *TTFME* (Time to First Meaningful Engagement con fórmulas interactivas de cálculo en overlay manual `?`), índice de personalización A/B, tasa de rechazo temprano, y volumen total.
*   **Vista de Lista Detallada con Ordenamiento:** Tabla responsiva de tipo glassmorphism con ordenamiento interactivo ascendente/descendente en todas sus cabeceras clave (excepto acciones) y un panel lateral con indicador de filtro de estado adicional.
*   **Maximizado (Pantalla Completa):** Botón interactivo para maximizar la región operativa del headlining y tablero de búsqueda, ocultando las barras y KPIs globales para potenciar la visibilidad del reclutador, y conmutando automáticamente al modo "Salir".
*   **Ficha Premium de Postulante (/descubrimiento/[id]):** Sección de detalles en profundidad, autocompletado y edición sincrónica persistiendo en `localStorage` con botón 'Detalles' para visualización técnica en profundidad.
*   **Integración Gemini AI Sourcing (Live vs Mock):**
  - *Motor de Matching Semántico*: Analiza con la API de Google Gemini (1.5 Flash) el CV y puesto mostrando un Fit score (%), fortalezas, debilidades e instrucciones detalladas con indicador específico de fuente (`✨ GEMINI LIVE` vs `📋 MOCK`).
  - *Redacción de Outreach con Inteligencia Artificial*: Genera mensajes adaptados al perfil del candidato y permite A/B testing reescribiendo variantes A y B dináminamente con IA.
  - *Sourcing Avanzado Booleano & X-Ray*: Generador de cadenas booleanas y strings premium de X-Ray (LinkedIn / Google) con auto-fill de plantillas (e.g. Rust Architect, UX Designer) e importación simulada directa al backlog del kanban, indicando si proviene de Gemini o Mock.

### Módulo H: F2 Evaluación (Pruebas Técnicas & Simulaciones IA)
El **F2 Evaluación** gestiona la fase interna de validación técnica, entrevistas en profundidad y assessments interactivos libres de sesgo tecnológico.
*   **Pipeline de Evaluación Kanban:** Tablero de control clasificado en 3 columnas de progresión técnica: `05 - Entrevista Inicial / screening`, `06 - Prueba / Assessment Técnico` y `07 - Descartado (Interno)`, provisto de interacciones *Drag & Drop* completas y actualización instantánea de fase.
*   **Métricas e Indicadores de Rendimiento de Evaluación:** Tarjetas analíticas de control para *WIP Cycle Time* promedio (horas activas acumuladas en evaluación), *cNPS* general de candidatos, e índice de aprobación *Pass-through Rate*. Adicionalmente, incluye alerta de sobrecarga operativa en color amarillo ámbar cuando el WIP supera los 10 candidatos activos.
*   **Filtros de Búsqueda y Multi-Cliente:** Barra de filtrado dinámico para acotar y aislar candidatos por rol y cliente corporativo clave (ej. Telefónica, Santander, SEAT).
*   **Slide-over Contenedor de Diagnóstico IA:** Cajón lateral deslizable e interactivo enfocado en herramientas cognitivas avanzadas libres de sesgos:
  - *Sintetizador de Entrevistas*: Cruce inteligente de notas de llamadas y descripciones de puestos clasificando en Puntos Fuertes (Pros), Brechas Técnicas (Cons) y Señales de Alerta (Riesgos).
  - *Detector de Inconsistencias Cronológicas*: Escaneo automático de la trayectoria laboral del candidato para alertar sobre solapamientos sospechosos u holguras (gaps) de tiempo.
  - *Generador de Preguntas Técnicas STAR*: Formulación automatizada de cuestionarios de comportamiento y código contextualizados bajo el formato Situación, Tarea, Acción y Resultado (STAR).
  - *Validador de Identidad y Entorno*: Chequeo asincrónico IP, geolocalización latente y capturas de cámara web simuladas con interfaz interactiva ("Iniciar escaneo") para prevenir fraudes.
  - *AI Co-Pilot Adaptive Pair Programming*: Entorno simulado de colaboración en vivo ("Live coding test") con visor de compilador de sandbox interactivo compatible con Rust/WASM y TypeScript, mostrando tasa de completación, dificultad y esfuerzo estimado.

---

## Ejecución del Servidor Local and Tests

1.  **Instala las dependencias:**
    ```bash
    npm install
    ```
2.  **Arranca el servidor local de desarrollo:**
    ```bash
    npm run dev
    ```
3.  **Ejecutar pruebas unitarias de integración (Etapa 1: Lectura):**
    ```bash
    source ~/.zshrc && npx tsx --test tests/candidatos_etapa1.test.js
    ```
4.  **Ejecutar pruebas unitarias de integración (Etapa 2: Escritura/Validación):**
    ```bash
    source ~/.zshrc && npx tsx --test tests/candidatos_etapa2.test.js
    ```
5.  **Ejecutar pruebas del Módulo de Evaluación (KPIs y Mocks):**
    ```bash
    export NVM_DIR="$HOME/.nvm" && [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh" && node --experimental-strip-types --test tests/evaluacion.test.js
    ```
6.  **Ejecutar pruebas del Módulo de Presentación (F3):**
    ```bash
    export PATH="/Users/dcastellano/.local/node-v20.12.2-darwin-arm64/bin:$PATH" && npx tsx --test tests/presentacion.test.js
    ```
7.  **Ejecutar pruebas del Módulo de Cierre (F4):**
    ```bash
    export PATH="/Users/dcastellano/.local/node-v20.12.2-darwin-arm64/bin:$PATH" && npx tsx --test tests/cierre.test.js
    ```
8.  Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---
## Despliegue en hosting Pruebas de Firebase
```bash
git add .   
git commit -m "Texto del cambio" 
git push origin main
```

-------------------------------------------------------------------------------------------------
### Log de Cambios

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
    *   **Consistencia de Navegación Global:** Vinculación del acceso directo horizontal "F2 Evaluación" en los encabezados principales de Dashboard, Descubrimiento, Búsquedas, Talento, Configuración y Reclutamiento.

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

