# Plan de Implementación: Nuevos Campos en Módulo de Postulantes (/talento)

Este plan detalla los cambios requeridos en el frontend (`azulats-app1`) para incorporar seis (6) nuevos campos en la visualización, creación y edición de candidatos espontáneos y postulantes en la ruta `/talento` y su vista de detalle `/talento/[id]`.

## Campos Nuevos a Integrar
Conforme a la definición del servicio backend (`azulats-service1`), se añaden los siguientes campos:
1. `telefono_movil`: Teléfono personal móvil (opcional).
2. `ubicacion`: Ciudad y país (opcional).
3. `skills_principales`: 3 a 5 etiquetas clave separadas por comas (validadas por el backend).
4. `nivel_ingles`: Nivel técnico del idioma inglés (opcional).
5. `otros_idiomas`: Otros idiomas (opcional).
6. `notas_iniciales`: Comentarios u observaciones preliminares (opcional).

---

## User Review Required

> [!IMPORTANT]
> **Edición de Datos en Detalle (`/talento/[id]`):**
> Habilitaremos un **Modo de Edición (Edit Mode)** interactivo dentro de la Ficha del Candidato (`/talento/[id]`). Esto permitirá que el reclutador pulse un botón de "Editar", modifique los datos personales mutables (`nombre_completo`, `email`, `linkedin_url`, y los 6 nuevos campos) directamente dentro de la interfaz glassmorphic, y guarde los cambios llamando a `actualizarCandidatoAPI`.
>
> **Restricciones de Mutabilidad:**
> No se permitirá editar campos inmutables como `id`, `acepta_privacidad`, `origen`, `url_cv`, y `createdAt`. Intentar enviarlos en el PATCH generará un error 400 del servidor que la interfaz capturará debidamente y mostrará en pantalla.

---

## Proposed Changes

### 1. Conectores de API (Server Actions)

#### [MODIFY] [candidatos.ts](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-app1/src/actions/candidatos.ts)
- Extender la interfaz `Candidato` para incorporar las 6 nuevas propiedades opcionales.
- Modificar `getCandidatosAPI` para mapear los nuevos campos desde el JSON del backend (`cand.telefono_movil`, `cand.ubicacion`, etc.) y asignarlos a la interfaz del frontend.
- Modificar `crearCandidatoAPI` para leer los nuevos campos opcionales del `FormData` y agregarlos en la llamada HTTP de red `multipart/form-data`.
- Modificar `actualizarCandidatoAPI` para mapear los nuevos campos en `payload` si vienen definidos y enviarlos en el body `application/json` del método PATCH.

### 2. Formulario de Creación de Candidato (B2C/Manual)

#### [MODIFY] [CandidatoForm.tsx](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-app1/src/app/components/CandidatoForm.tsx)
- Agregar inputs adicionales en una sección visualmente integrada llamada "Perfil Profesional e Idiomas (Opcional)".
- Diseñar los campos con el mismo patrón de floating labels que el resto de los campos y clases glassmórficas.
- Agregar un helper text explicativo sobre la regla de validación de `skills_principales` (debe poseer entre 3 y 5 tecnologías separadas por comas).
- Enviar las 6 nuevas variables de estado a través del `FormData` en `handleSubmit`.

### 3. Vistas de Talento y Ficha de Detalle

#### [MODIFY] [page.tsx](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-app1/src/app/talento/page.tsx)
- Opcionalmente, agregar la ubicación u otra información de contacto rápido en la tarjeta del listado si es provista, de forma sutil para no sobrecargar el layout premium de tarjetas.
- Actualizar el formato para copiar al portapapeles (`handleCopyCandidateData`) para incluir los nuevos campos (Teléfono, Ubicación, Habilidades, Inglés, Otros Idiomas) en caso de que existan.

#### [MODIFY] [page.tsx](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-app1/src/app/talento/[id]/page.tsx)
- **Visualización de Campos:**
  - Agregar campos de contacto (`telefono_movil` y `ubicacion`) en el panel izquierdo de información estática.
  - Reemplazar la sección estática "Resumen Profesional (A desarrollar)" por una ficha premium de **Perfil Profesional** que muestre:
    - *Tecnologías y Skills:* Renderizado de forma dinámica como pill tags con brillos de color teal/indigo.
    - *Nivel de Inglés e Idiomas:* En un contenedor estilizado de lectura.
    - *Notas de Reclutamiento:* Reflejadas como notas de audio/tarjeta con un fondo diferenciado.
- **Modo de Edición (Edit Console):**
  - Implementar estado reactivo `isEditing` (booleano).
  - Agregar botón "Editar Perfil" en el panel de acciones.
  - Al activar `isEditing`, reemplazar la información estática del perfil por campos tipo `input` y `textarea` para todos los datos mutables.
  - Enviar mediante PATCH a `actualizarCandidatoAPI` el conjunto de cambios al presionar "Guardar Cambios".
  - Controlar fallos de validación en tiempo real (por ejemplo, si el backend devuelve un error 400 por no cumplir las 3-5 habilidades en `skills_principales`, mostrar el banner rojo de error en el detalle).

### 4. Pruebas y Certificación de Calidad

#### [NEW] [candidatos.test.js](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-app1/tests/candidatos.test.js)
- Crear una batería de pruebas unitarias y de integración que use el cargador nativo de Node.js (`node:test`) y aserciones (`node:assert`).
- Probar:
  1. Validación en frontend del formato de `skills_principales` (validar cantidad de tags entre 3 y 5 cuando no esté vacío, antes de enviar).
  2. Llamada estructurada a `crearCandidatoAPI` simulando el contenido de los nuevos campos.
  3. Llamada a `actualizarCandidatoAPI` emulando las mutaciones permitidas y arrojando control de errores en campos inmutables.
  4. Mapeo de `getCandidatosAPI` para garantizar que todos los nuevos campos sean leídos y mapeados a los tipos TypeScript correspondientes.

### 5. Documentación

#### [MODIFY] [README.md](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-app1/README.md)
- Actualizar la ficha técnica del Módulo F: Talent Mixer para detallar las nuevas especificaciones de campos e indicar la habilitación del modo de edición interactivo en la ficha de detalle `/talento/[id]`.
- Explicar la directiva de validación estricta de 3-5 tags de habilidades principales.
- Agregar instrucciones para ejecutar el set de pruebas locales utilizando Node.js.

#### [MODIFY] [manual_funcional.md](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-app1/docs/manual/manual_funcional.md)
- Actualizar el manual detallando los campos adicionales agregados en la creación (`CandidatoForm.tsx`) y los del panel informativo.
- Explicar gráficamente cómo activar el "Modo Edición" interactivo en la ficha del postulante (`/talento/[id]`) y las reglas de validación en el cliente y servidor.

---

## Plan de Verificación

### Pruebas Automatizadas
- Ejecutar el runner nativo de Node:
  ```bash
  source ~/.zshrc && node --test tests/candidatos.test.js
  ```
- Correr el compilador y linter de Next.js para certificar que no existen fallos tipográficos de TypeScript ó fallos de build en producción:
  ```bash
  source ~/.zshrc && npm run build
  ```

### Pruebas Manuales
- **Bandeja de Alta:** Verificar que el formulario Slide-over permite ingresar los nuevos datos y los envía al backend de desarrollo en el puerto 8080.
- **Detalle de Candidato:** Modificar un postulante activando el Edit Mode, guardar cambios, comprobar recarga táctil y verificar en la grilla que los campos persisten y son renderizados de forma correcta (skills en pills, notas formateadas).
- **Validación de Errores:** Intentar actualizar Skills Principales con menos de 3 tags en el Edit Mode, verificar que el API devuelve error 400 y que la vista muestra el error al usuario de manera limpia.
