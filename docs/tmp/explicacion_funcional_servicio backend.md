# Explicación Funcional del Servicio de Postulantes (Talent Mixer)

Este documento detalla el funcionamiento lógico, los flujos de negocio y las reglas de seguridad aplicadas en el **Módulo de Postulantes (Candidatos Espontáneos)** de la plataforma Azul ATS.

---

## 1. Introducción y Objetivo General
El Servicio de Postulantes actúa como la pasarela de entrada (B2C) y panel de control administrativo (B2B) del talento espontáneo que se registra en la Landing Page de Azul ATS. Su propósito es doble:
*   **Captar currículums (CVs) de forma autónoma y masiva**, aplicando consistencia transaccional y validaciones legales rigurosas desde el primer instante.
*   **Proveer a los reclutadores una herramienta de administración centralizada**, permitiéndoles clasificar, corregir datos erróneos de contacto y progresar o descartar postulantes de manera segura.

---

## 2. Flujo Funcional del Candidato (B2C: Portal Público)

El registro se realiza a través de un endpoint público expuesto para la Landing Page web. Sigue una arquitectura secuencial blindada:

```mermaid
graph TD
    User([Candidato]) --> Form[Formulario de Registro B2C]
    Form --> VerifyCORS{Verificación CORS}
    VerifyCORS -- No --> Block[Rechazar HTTP 403]
    VerifyCORS -- Sí --> ValidateSize{Binario <5MB y PDF/DOC/DOCX?}
    ValidateSize -- No --> ErrorVal[Error de Formato HTTP 400]
    ValidateSize -- Sí --> CheckRGPD{¿Acepta Privacidad?}
    CheckRGPD -- No --> ErrorRGPD[Requerido Legalmente HTTP 400]
    CheckRGPD -- Sí --> UploadStorage[Cargar CV a Storage]
    UploadStorage --> WriteFirestore[Registrar Postulante en Firestore]
    WriteFirestore -- Error Firestore --> Rollback[Rollback: Eliminar CV de Storage]
    WriteFirestore -- Éxito --> BQ[Sincronización Analítica a BigQuery]
```

### Reglas Funcionales Clave:
1.  **Validación de Formato e Integridad:** Solo se admiten archivos en formato `.pdf`, `.doc`, y `.docx` con un peso máximo de 5 megabytes (5MB) para evitar denegación de servicios por sobrecarga de memoria o almacenamiento.
2.  **Consentimiento Legal Obligatorio (RGPD):** Para registrarse, el candidato debe aceptar de forma explícita las políticas de privacidad. El backend requiere que el parámetro `acepta_privacidad` sea exactamente `true`. Si no lo es, la postulación es denegada, garantizando la trazabilidad de auditorías legales en el ATS.
3.  **Mecanismo Antihuerfanos (Consistencia Transaccional):** Al procesar un alta, primero se almacena el archivo binario del CV en Firebase Storage usando un identificador único (UUID). Inmediatamente después, se intentan escribir los datos del candidato en Firestore. Si la escritura en Firestore falla (por caída de red u otra anomalía), el servicio ejecuta un **Rollback automático**, borrando el archivo cargado en la nube. Esto asegura que no se acumulen archivos de currículum huérfanos que consuman espacio innecesario sin tener una ficha asociada en la base de datos.
4.  **Enriquecimiento en Calidad y Analítica:** Cada candidato registrado exitosamente se inicializa por defecto con el estado de revisión `"pendiente"`. A través de BigQuery CDC (Firebase Extensions), la información se streamea de inmediato para analíticas de rendimiento de canales de captación.
5.  **Campos Opcionales de Perfil Técnico y de Contacto:** Se incorporan 6 nuevos campos para robustecer la ficha de talentos:
    *   `telefono_movil`: Teléfono personal móvil (opcional, admite null o vacío).
    *   `ubicacion`: Dirección o ciudad y país (opcional, admite null o vacío).
    *   `skills_principales`: Habilidades o tecnologías clave separadas por comas. Opcional, pero si se envía y posee caracteres no vacíos, se aplica una validación estricta que exige contener entre 3 y 5 etiquetas/habilidades.
    *   `nivel_ingles`: Nivel del idioma inglés (opcional, texto libre sin nomenclaturas restrictivas).
    *   `otros_idiomas`: Otros idiomas o dialectos que posee (opcional, admite null o vacío).
    *   `notas_iniciales`: Texto libre para observaciones o apreciaciones preliminares sobre el candidato (opcional, admite null o vacío).

---

## 3. Flujo de Gestión Administrativa (B2B: Portal de Reclutamiento)

El panel administrativo de contratación permite a los reclutadores autorizados gestionar y procesar las solicitudes. Este portal cuenta con políticas estrictas de control:

### A. Listado y Filtros Inteligentes
*   Los reclutadores pueden consultar todos los postulantes. El sistema impone un **ordenamiento cronológico descendente** obligatorio (las postulaciones más recientes aparecen primero).
*   Se soporta el filtrado de perfiles por estado de revisión (`pendiente`, `Revisado`, `Descartado`).
*   *Requisito técnico:* Para combinar ordenamiento por fecha con filtros de estados, se requiere el uso de un índice compuesto en Firestore (`estado_revision` Ascendente, `createdAt` Descendente).

### B. Mutabilidad y Trazabilidad Histórica
Para prevenir inconsistencias y mantener el legajo histórico legal inalterado, se han dividido los datos en dos clases:

*   **Campos Mutables (Modificables):**
    *   `nombre_completo` y `email`: Permite corregir errores tipográficos de los candidatos en sus datos de contacto.
    *   `linkedin_url`: Para complementar el perfil del candidato.
    *   `estado_revision`: Propiedad operativa para avanzar postulantes en el proceso de reclutamiento.
    *   `telefono_movil`, `ubicacion`, `skills_principales`, `nivel_ingles`, `otros_idiomas`, `notas_iniciales`: Nuevos campos de perfil y contacto que los reclutadores pueden ingresar o modificar de forma libre (respetando la regla de 3-5 tags para `skills_principales` si es provisto).
*   **Campos Inmutables (Bloqueados):**
    *   `acepta_privacidad`: Inalterable. Impedimos que se modifique o anule el consentimiento histórico de privacidad ya firmado.
    *   `url_cv`: Protege al currículum original de ser alterado por terceros, previniendo inyecciones de archivos maliciosos.
    *   `origen` y `createdAt`: Sellos inalterables del canal de adquisición del postulante y del timestamp de origen.

> [!NOTE]
> Cualquier intento de enviar campos inmutables en una petición de actualización (`PATCH`) será automáticamente bloqueado por el servidor con código **HTTP 400 Bad Request**.

### C. Ciclo de Descarte (Soft Delete)
*   En la operativa ordinaria, cuando un reclutador descarta a un postulante del proceso, esta acción se clasifica como una **desestimación lógica o Borrado Suave**.
*   El estado del candidato se actualiza a `"Descartado"`, lo que causa que se excluya de las listas activas, pero el documento sigue residiendo físicamente en base de datos. De esta forma, conservamos la integridad documental de las vacantes y los registros de auditoría operativa.

### D. Derecho al Olvido / RGPD (Hard Delete Comentado)
*   Para cumplir con solicitudes explícitas de eliminación permanente de datos personales bajo la directiva RGPD, el backend cuenta con un flujo cascada inactivo (debidamente comentado en código).
*   En este escenario, se requiere el rol de **Super Administrador**. Al ejecutarse la orden, el servicio localiza la ficha del postulante, extrae la dirección `gs://` del CV en Firebase Storage, procede a la remoción física del PDF de la nube y posteriormente elimina de manera permanente el documento JSON de la base de datos Firestore, completando un borrado físico sin residuos.

---

## 4. Seguridad de los Servicios de Postulantes
*   **Servicios Públicos (B2C):** Libre acceso a solicitudes de alta (`POST /`) desde la whitelist CORS configurada (`ALLOWED_ORIGINS`).
*   **Servicios Privados (B2B):** Todo acceso a consulta (`GET`) y actualización (`PATCH`) exige un JSON Web Token (JWT) en el header de autorización (`Authorization: Bearer <token_firebase>`). Solo credenciales de Firebase válidas y con roles habilitados pueden interactuar con perfiles de candidatos.

---

## 5. Referencia Técnica de APIs Disponibles (Resumen de Endpoints)

A continuación se detallan los detalles de envío, autorización, parámetros y respuestas para cada endpoint habilitado en la API `/api/v1/candidatos`:

### Endpoint 1: Registrar Postulante (B2C)
*   **Ruta:** `POST /api/v1/candidatos`
*   **Tipo de Solicitud (Content-Type):** `multipart/form-data`
*   **Uso:** Registro autónomo por parte de candidatos en la Landing Page.
*   **Parámetros:**
    *   `cv` *(Archivo adjunto en binario; obligatorio)*: El documento CV en formatos PDF (preferente), DOC, o DOCX de hasta 5MB.
    *   `nombre_completo` *(Texto; obligatorio)*: Nombre y apellido del candidato.
    *   `email` *(Texto; obligatorio)*: Correo electrónico de comunicación.
    *   `puesto_postulacion` *(Texto; opcional)*: Puesto deseado o área funcional básica.
    *   `linkedin_url` *(Texto; opcional)*: Enlace al perfil público de LinkedIn.
    *   `acepta_privacidad` *(Texto/Boolean; obligatorio)*: Debe enviarse en valor `'true'`.
    *   `telefono_movil` *(Texto; opcional)*: Número móvil.
    *   `ubicacion` *(Texto; opcional)*: Dirección o ciudad/país.
    *   `skills_principales` *(Texto; opcional)*: 3 a 5 tecnologías clave separadas por comas.
    *   `nivel_ingles` *(Texto; opcional)*: Nivel del idioma inglés.
    *   `otros_idiomas` *(Texto; opcional)*: Otros idiomas del candidato.
    *   `notas_iniciales` *(Texto; opcional)*: Anotaciones de reclutamiento preliminares.
*   **Códigos de Respuesta:**
    *   `201 Created`: Postulación y archivo CV persistidos con éxito.
    *   `400 Bad Request`: Parámetro requerido ausente, falta aceptación de privacidad, o formato incompatibles/tamaño excedido del archivo adjunto.
    *   `403 Forbidden`: Bloqueo por origen no permitido por las directrices CORS.
*   **Ejemplo de Petición (curl):**
    ```bash
    curl -X POST http://localhost:8080/api/v1/candidatos \
      -F "cv=@curriculum.pdf" \
      -F "nombre_completo=Andrea Soler" \
      -F "email=andrea.soler@domain.com" \
      -F "puesto_postulacion=Product Owner" \
      -F "acepta_privacidad=true"
    ```
*   **Ejemplo de Respuesta Exitosa (`201 Created`):**
    ```json
    {
      "status": "success",
      "message": "Postulación registrada con éxito en todos los sistemas.",
      "data": {
        "id": "e44c2079-c5c8-4a92-bf32-90177dfc8aa0",
        "nombre_completo": "Andrea Soler",
        "email": "andrea.soler@domain.com",
        "puesto_postulacion": "Product Owner",
        "url_cv": "gs://azul-ats-1.firebasestorage.app/cvs/e44c2079-c5c8-4a92-bf32-90177dfc8aa0_curriculum.pdf",
        "estado_revision": "pendiente",
        "telefono_movil": "+34666555444",
        "ubicacion": "Madrid, España",
        "skills_principales": "Product Management, Scrum, Agile",
        "nivel_ingles": "C1 Advanced",
        "otros_idiomas": "Francés (Medio)",
        "notas_iniciales": "Contacto inicial positivo en evento de empleo."
      }
    }
    ```

---

### Endpoint 2: Consultar Candidatos (B2B)
*   **Ruta:** `GET /api/v1/candidatos`
*   **Autorización:** Header `Authorization: Bearer <Token Firebase Recruiter/Admin>`
*   **Uso:** Recuperación y ordenación de postulantes para panel interno.
*   **Parámetros de Query (Opcionales):**
    *   `estado_revision` *(Query String; opcional)*: Permite filtrar por `pendiente`, `Revisado` o `Descartado`.
*   **Códigos de Respuesta:**
    *   `200 OK`: Devuelve listado JSON ordenado decrecientemente por `createdAt`.
    *   `401 Unauthorized`: Header `Authorization` ausente u omitido.
    *   `403 Forbidden`: Firma o Token JWT inválido, expirado o sin permisos.
    *   `500 Internal Server Error`: Fallo interno de Firestore o advertencia de índice compuesto ausente.
*   **Ejemplo de Petición (curl):**
    ```bash
    curl -H "Authorization: Bearer mock-token-recruiter" \
      http://localhost:8080/api/v1/candidatos?estado_revision=pendiente
    ```
*   **Ejemplo de Respuesta Exitosa (`200 OK`):**
    ```json
    {
      "status": "success",
      "data": [
        {
          "id": "e44c2079-c5c8-4a92-bf32-90177dfc8aa0",
          "nombre_completo": "Andrea Soler",
          "email": "andrea.soler@domain.com",
          "puesto_postulacion": "Product Owner",
          "estado_revision": "pendiente",
          "url_cv": "gs://azul-ats-1.firebasestorage.app/cvs/e44c2079-c5c8-4a92-bf32-90177dfc8aa0_curriculum.pdf",
          "acepta_privacidad": true,
          "origen": "landing_page",
          "createdAt": "2026-07-18T14:46:12.110Z"
        }
      ]
    }
    ```

---

### Endpoint 3: Actualizar/Descartar Postulante (B2B)
*   **Ruta:** `PATCH /api/v1/candidatos/:id`
*   **Autorización:** Header `Authorization: Bearer <Token Firebase Recruiter/Admin>`
*   **Tipo de Solicitud (Content-Type):** `application/json`
*   **Uso:** Avance en el pipeline, descarte operativo (Soft Delete) y corrección de datos.
*   **Parámetros permitidos en JSON Body:**
    *   `nombre_completo` *(Texto; opcional)*
    *   `email` *(Texto; opcional)*
    *   `linkedin_url` *(Texto; opcional)*
    *   `estado_revision` *(Texto; opcional)*: Admite `"Revisado"` o `"Descartado"`.
    *   `telefono_movil` *(Texto; opcional)*
    *   `ubicacion` *(Texto; opcional)*
    *   `skills_principales` *(Texto; opcional)*: Lista con validación estricta de 3 a 5 habilidades separadas por comas.
    *   `nivel_ingles` *(Texto; opcional)*
    *   `otros_idiomas` *(Texto; opcional)*
    *   `notas_iniciales` *(Texto; opcional)*
*   **Campos inmutables bloqueados (Generarán HTTP 400 si se incluyen):**
    *   `acepta_privacidad`, `url_cv`, `origen`, `createdAt`, e `id`.
*   **Códigos de Respuesta:**
    *   `200 OK`: Actualización satisfactoria, devuelve el objeto mutado más la marca de fecha de servidor `updatedAt`.
    *   `400 Bad Request`: Violación de la regla de mutación estricta al intentar incrustar campos bloqueados.
    *   `401/403`: Códigos de denegación por token incorrrecto o ausente.
*   **Ejemplo de Petición (curl):**
    ```bash
    curl -X PATCH http://localhost:8080/api/v1/candidatos/e44c2079-c5c8-4a92-bf32-90177dfc8aa0 \
      -H "Authorization: Bearer mock-token-recruiter" \
      -H "Content-Type: application/json" \
      -d '{"estado_revision": "Descartado"}'
    ```
*   **Ejemplo de Respuesta Exitosa (`200 OK`):**
    ```json
    {
      "status": "success",
      "message": "Ficha del candidato actualizada exitosamente.",
      "data": {
        "id": "e44c2079-c5c8-4a92-bf32-90177dfc8aa0",
        "estado_revision": "Descartado",
        "updatedAt": "2026-07-18T14:48:30.210Z"
      }
    }
    ```

---

### Endpoint 4: Eliminación Permanente / RGPD (B2B - Comentado en Código)
*   **Ruta:** `DELETE /api/v1/candidatos/:id`
*   **Autorización:** Header `Authorization: Bearer <Token Firebase Super Admin>`
*   **Uso:** Remoción total (cascada Storage + Firestore) por derecho al olvido.
*   **Parámetros:** `id` del postulante en path de ruta.
*   **Códigos de Respuesta Previstos:**
    *   `200 OK`: Borrado físico exitoso.
    *   `401/403/404`: Respuestas en caso de tokens inválidos o inexistencia del identificador.
*   **Ejemplo de Petición (curl):**
    ```bash
    curl -X DELETE http://localhost:8080/api/v1/candidatos/e44c2079-c5c8-4a92-bf32-90177dfc8aa0 \
      -H "Authorization: Bearer mock-token-superadmin"
    ```
