# Plan de Implementación - Backend Módulo Postulantes (Candidatos)

Este plan detalla los cambios requeridos en el backend (`azulats-service1`) para habilitar las operaciones de gestión administrativa (B2B) sobre los candidatos espontáneos que llegan a la Landing Page, divididos en **dos etapas independientes y evaluables**.

---

## User Review Required

> [!IMPORTANT]
> **Exclusión de Hard Delete (Físico) Activo:**
> Siguiendo tus lineamientos, la funcionalidad de eliminación física (`DELETE /api/v1/candidatos/:id`) no se habilitará de forma activa en los endpoints operativos de esta entrega. La ruta y lógica correspondiente se dejarán redactadas y **totalmente comentadas** en el código fuente (`candidatosRoutes.js` y `candidatosController.js`) con una explicación exhaustiva sobre la orquestación en cascada (Storage PDF + Firestore JSON) para su activación a futuro.
>
> **Simulación para Entornos de Pruebas (Bypass Middleware):**
> Para permitir la ejecución y evaluación automatizada de las rutas administrativas HTTP (GET y PATCH) bajo `authMiddleware` sin depender de logins de Google/Firebase en vivo, agregaremos un bypass en `verificarToken` activo únicamente cuando `process.env.NODE_ENV === 'test'` si el token coincide con `mock-token-recruiter`.

---

## Estructura de Fases de Desarrollo

```mermaid
graph TD
    Stage1[Etapa 1: Lectura, Edición Controlada y Refactorización de Storage] --> Stage2[Etapa 2: Borrado Suave y Esqueleto de Borrado Físico Comentado]
```

---

## Proposed Changes

### ETAPA 1: Lectura (Read), Edición Controlada (Update), Refactorización y Pruebas
*Objetivo:* Implementar la infraestructura de servicios para Storage, las rutas GET y PATCH de candidatos con su middleware de seguridad y pruebas con tokens simulados en ambiente `test`.

#### [NEW] [storageService.js](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-service1/src/services/storageService.js)
- Crear un servicio utilitario para aislar llamadas a Storage:
  - `uploadFileFromBuffer(file, candidatoId)`: (Opcional - para ordenar) o simplemente extraer la lógica de eliminación `deleteFile(storagePath)` y `deleteFileFromGsUri(gsUri)` para que esté disponible en toda la app.

#### [MODIFY] [authMiddleware.js](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-service1/src/middlewares/authMiddleware.js)
- Agregar validación en `verificarToken`: si `process.env.NODE_ENV === 'test'` y el token de autorización es `mock-token-recruiter`, inyectar `{ email: 'reclutador@digitalagil.es', rol: 'Reclutador' }` en `req.user` y permitir acceso.

#### [MODIFY] [candidatosController.js](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-service1/src/controllers/candidatosController.js)
- **Refactorizar `registrarCandidato`**: Importar `deleteFile` de `storageService.js` en lugar de llamar directamente a `fileRef.delete()` en el catch del rollback. Además, inicializar `estado_revision: 'pendiente'` por defecto al guardar un candidato.
- **Implementar `obtenerCandidatos`**:
  - Obtener documentos de la colección `postulantes`.
  - Permitir filtrar por `req.query.estado_revision`.
  - Aplicar obligatoriamente `orderBy('createdAt', 'desc')`.
- **Implementar `actualizarCandidato`**:
  - Obtener `id` de `req.params`.
  - Validar e impedir inyección: Si en el body de la petición vienen campos inmutables (`acepta_privacidad`, `url_cv`, `origen`, `createdAt`, `id`), retornar inmediatamente `HTTP 400 Bad Request`.
  - Campos editables admitidos: `nombre_completo`, `email`, `linkedin_url` y `estado_revision`.
  - Inyectar la marca temporal de actualización del servidor `updatedAt: new Date().toISOString()`.

#### [MODIFY] [candidatosRoutes.js](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-service1/src/routes/candidatosRoutes.js)
- Importar `verificarToken` y los nuevos métodos del controlador.
- Registrar e integrar:
  - `GET /` -> `verificarToken`, `obtenerCandidatos`
  - `PATCH /:id` -> `verificarToken`, `actualizarCandidato`

#### [MODIFY] [prueba-postulantes.js](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-service1/tests/prueba-postulantes.js)
- Ampliar el script de prueba para realizar solicitudes autenticadas enviando `Authorization: Bearer mock-token-recruiter`:
  1. **Prueba GET**: Consultar todos los candidatos y validar orden descendente.
  2. **Prueba GET con Filtro**: Filtrar por `estado_revision=pendiente`.
  3. **Prueba PATCH exitoso**: Modificar el campo `estado_revision` a `"Revisado"` y corregir el email. Chequear que retorne `updatedAt`.
  4. **Prueba PATCH inválida (Caso Negativo)**: Intentar enviar `acepta_privacidad: false` o `url_cv: "gs://trampa"` esperando devolución explícita de `HTTP 400`.

#### [MODIFY] [README.md](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-service1/README.md)
- Documentar los endpoints `GET /api/v1/candidatos` y `PATCH /api/v1/candidatos/:id` en la sección "Endpoints Disponibles", especificando esquemas, filtros, autorizaciones y códigos HTTP de respuesta.

---

### ETAPA 2: Borrado Suave (Soft Delete) y Esqueleto Comentado de Eliminación RGPD
*Objetivo:* Proporcionar el mecanismo de borrado operativo diario (Soft Delete) modificando el estado de revisión, y establecer la estructura del Hard Delete documentado en código fuente.

#### [MODIFY] [candidatosController.js](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-service1/src/controllers/candidatosController.js)
- Añadir como mejora comentada un esqueleto del método `eliminarCandidato` (Hard Delete), el cual explicará la orquestación recursiva:
  ```javascript
  /*
  // MEJORA FUTURA: Habilitar borrado físico para Super Administrador (cumplimiento RGPD)
  export const eliminarCandidatoFisico = async (req, res) => {
    // 1. Validar que el usuario sea Super Administrador (jwt payload con rol o email '.es')
    // 2. Recuperar url_cv del postulante para localizar el archivo del Storage
    // 3. Invocar deleteFileFromGsUri(url_cv) para limpiar Storage
    // 4. Tras éxito de borrado en Storage, eliminar documento respectivo en Firestore
  }
  */
  ```

#### [MODIFY] [candidatosRoutes.js](file:///Users/dcastellano/Documents/devs/da-rh1/azulats-service1/src/routes/candidatosRoutes.js)
- Añadir la declaración de la ruta `DELETE /:id` totalmente comentada, vinculada al esqueleto de borrado físico.
- Agregar comentarios explicativos al inicio del router que dejen asentado que el flujo operativo de descarte es un **Soft Delete** realizado de manera estándar invocando a `PATCH /:id` con `estado_revision: 'Descartado'`.

---

## Plan de Verificación y Ajustes Manuales por Etapa

### Etapa 1
#### Indicaciones de Cambios Manuales:
- **Aprovisionar Índice Compuesto en Firestore:**
  Es mandatorio dar de alta el siguiente índice compuesto en la consola web de Firebase para evitar errores `HTTP 500` en filtros ordenados:
  * Colección: `postulantes`
  * Campos: `estado_revision` (Ascendente) y `createdAt` (Descendente)

#### Pruebas Automatizadas:
- Iniciar Express en puerto 8080 localmente:
  `NODE_ENV=test node index.js`
- Ejecutar el runner:
  `NODE_ENV=test node tests/prueba-postulantes.js`

#### Pruebas Manuales:
- Ejecutar un curl al `GET` usando token simulado:
  ```bash
  curl -H "Authorization: Bearer mock-token-recruiter" http://localhost:8080/api/v1/candidatos
  ```

---

### Etapa 2
#### Pruebas Automatizadas:
- Ejecutar la suite adaptada para verificar que al cambiar el estado a "Descartado" se persista exitosamente sin alterar la integridad histórica de bases de datos.

#### Pruebas Manuales:
- Enviar un `PATCH` estableciendo el estado del postulante como "Descartado" y corroborar en Firestore que el registro continúe existiendo pero con `estado_revision = 'Descartado'` y el timestamp `updatedAt` inyectado.
