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

---

## Ejecución del Servidor Local

1.  Instala las dependencias:
    ```bash
    npm install
    ```
2.  Arranca el servidor local de desarrollo:
    ```bash
    npm run dev
    ```
3.  Abre [http://localhost:3000](http://localhost:3000) en el navegador.

---

## Log de Cambios

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

