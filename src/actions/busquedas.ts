'use server';

import { cookies } from "next/headers";
import type { CriterioScreening } from "@/types/screening";
import { getApiEndpoint } from "@/utils/api";

export interface BusquedaPayload {
  cliente: string;
  perfil_busqueda: string;
  estado_fase: string;
  responsable_operativo: string;
  responsable_validacion: string;
  fecha_inicio_objetivo: string;

  // Nuevos campos del backend
  id_busqueda?: string;
  codigo_busqueda?: string;
  seniority?: string;
  skills_excluyentes?: string[];
  skills_deseables?: string[];
  nivel_ingles_req?: string;
  modalidad?: string;
  presupuesto_max?: string;
  prioridad?: string;
  link_job_description?: string;
  criterios_screening?: CriterioScreening[];
}

export interface APIResponse {
  status: number;
  success: boolean;
  message: string;
  data?: any;
}

export interface Busqueda {
  id: string;
  cliente: string;
  perfil_busqueda: string;
  estado_fase: string;
  responsable_operativo: string;
  responsable_validacion: string;
  fecha_inicio_objetivo: string;
  fecha_creacion?: string;
  candidatos_contador?: number;

  // Nuevos campos del backend
  id_busqueda?: string;
  codigo_busqueda?: string;
  seniority?: string;
  skills_excluyentes?: string[];
  skills_deseables?: string[];
  nivel_ingles_req?: string;
  modalidad?: string;
  presupuesto_max?: string;
  prioridad?: string;
  link_job_description?: string;
  criterios_screening?: CriterioScreening[];

  // Campos jerárquicos y de ubicación
  estado_sla?: {
    estado_busqueda?: string;
    prioridad?: string;
    presupuesto_max?: string;
    link_job_description?: string;
    [key: string]: any;
  };
  ubicacion?: string;
}

/**
 * Shared fallback mock dataset for searches (persists edits in memory during dev/demo sessions)
 */
let fallbackBusquedas: Busqueda[] = [
  {
    id: "REQ-001",
    cliente: "Telefónica S.A.",
    perfil_busqueda: "Senior React Developer",
    estado_fase: "Evaluación Técnica",
    responsable_operativo: "Ana Martínez",
    responsable_validacion: "Carlos Gómez",
    fecha_inicio_objetivo: "2026-08-01",
    fecha_creacion: "2026-07-01",
    candidatos_contador: 8,
    id_busqueda: "REQ-001",
    codigo_busqueda: "REQ-001",
    seniority: "Senior",
    skills_excluyentes: ["React", "TypeScript", "Next.js"],
    skills_deseables: ["TailwindCSS", "GraphQL"],
    nivel_ingles_req: "C1 Avanzado",
    modalidad: "Remoto España",
    presupuesto_max: "65.000€",
    prioridad: "Alta",
    link_job_description: "https://telefonica.es/jobs/req-001",
    criterios_screening: [
      { id: "crit-001-1", pregunta: "¿Tiene al menos 4 años de experiencia sólida en React y TypeScript?", tipo: "knockout", peso: 0 },
      { id: "crit-001-2", pregunta: "¿Posee nivel de inglés B2 o C1 conversacional?", tipo: "deseable", peso: 30 },
      { id: "crit-001-3", pregunta: "¿Ha trabajado con Server Actions o Next.js App Router?", tipo: "deseable", peso: 20 }
    ]
  },
  {
    id: "REQ-002",
    cliente: "SEAT S.A.",
    perfil_busqueda: "Software Architect Rust",
    estado_fase: "Preparación Previa",
    responsable_operativo: "Daniel Castellano",
    responsable_validacion: "Laura Fernández",
    fecha_inicio_objetivo: "2026-08-15",
    fecha_creacion: "2026-07-05",
    candidatos_contador: 5,
    id_busqueda: "REQ-002",
    codigo_busqueda: "REQ-002",
    seniority: "Lead / Architect",
    skills_excluyentes: ["Rust", "WASM", "C++"],
    skills_deseables: ["Docker", "Kubernetes"],
    nivel_ingles_req: "B2 Intermedio",
    modalidad: "Híbrido Barcelona",
    presupuesto_max: "80.000€",
    prioridad: "Alta",
    link_job_description: "https://seat.es/careers/req-002",
    criterios_screening: [
      { id: "crit-002-1", pregunta: "¿Tiene al menos 3 años de experiencia en desarrollo de sistemas con Rust?", tipo: "knockout", peso: 0 },
      { id: "crit-002-2", pregunta: "¿Experiencia previa en sectores automotriz o de sistemas embebidos?", tipo: "deseable", peso: 40 }
    ]
  },
  {
    id: "REQ-003",
    cliente: "Banco Santander",
    perfil_busqueda: "Cloud Security Expert",
    estado_fase: "Revisión de Cliente",
    responsable_operativo: "Marcos Valls",
    responsable_validacion: "Elena Prieto",
    fecha_inicio_objetivo: "2026-09-01",
    fecha_creacion: "2026-07-10",
    candidatos_contador: 6,
    id_busqueda: "REQ-003",
    codigo_busqueda: "REQ-003",
    seniority: "Senior",
    skills_excluyentes: ["AWS", "GCP", "Kubernetes", "IAM"],
    skills_deseables: ["Terraform", "Python"],
    nivel_ingles_req: "C1 Avanzado",
    modalidad: "Presencial Madrid",
    presupuesto_max: "75.000€",
    prioridad: "Alta",
    link_job_description: "https://santander.com/req-003",
    criterios_screening: [
      { id: "crit-003-1", pregunta: "¿Posee certificaciones vigentes de Seguridad Cloud (ej. AWS Security, GCP Security)?", tipo: "knockout", peso: 0 },
      { id: "crit-003-2", pregunta: "¿Demuestra experiencia en diseño de políticas IAM y hardening de Kubernetes?", tipo: "deseable", peso: 50 }
    ]
  },
  {
    id: "REQ-004",
    cliente: "Inditex S.A.",
    perfil_busqueda: "UX/UI Designer",
    estado_fase: "Oferta & Cierre",
    responsable_operativo: "Sofia Rivas",
    responsable_validacion: "Javier Ortiz",
    fecha_inicio_objetivo: "2026-07-28",
    fecha_creacion: "2026-06-20",
    candidatos_contador: 4,
    id_busqueda: "REQ-004",
    codigo_busqueda: "REQ-004",
    seniority: "Mid-Senior",
    skills_excluyentes: ["Figma", "Design Systems", "Prototyping"],
    skills_deseables: ["User Research", "HTML/CSS"],
    nivel_ingles_req: "B2 Intermedio",
    modalidad: "Híbrido La Coruña",
    presupuesto_max: "55.000€",
    prioridad: "Normal",
    link_job_description: "https://inditex.com/jobs/req-004",
    criterios_screening: [
      { id: "crit-004-1", pregunta: "¿Manejo avanzado de Figma y creación de Design Systems escalables?", tipo: "knockout", peso: 0 },
      { id: "crit-004-2", pregunta: "¿Experiencia previa diseñando interfaces para e-commerce de alto tráfico?", tipo: "deseable", peso: 30 }
    ]
  }
];

/**
 * Returns security JWT token from Next.js server cookies.
 * The cookie `azul_ats_token` is set client-side by Firebase Auth
 * (via setTokenCookie in src/lib/firebase/auth.ts) after login.
 */
async function getServerAuthToken(): Promise<string> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("azul_ats_token")?.value;
    if (!token) {
      console.log("[Server Action busquedas] Token de sesión no encontrado en cookie, usando mock-token-recruiter para conectar a Express local puerto 8080");
      return "mock-token-recruiter";
    }
    return token;
  } catch {
    return "mock-token-recruiter";
  }
}


/**
 * Server Action: Communicates with Cloud Run API v1 endpoint to create a search process.
 */
export async function crearBusquedaAPI(payload: BusquedaPayload): Promise<APIResponse> {
  try {
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
    const token = await getServerAuthToken();
    const url = getApiEndpoint("busquedas");

    const mappedCriterios = (payload.criterios_screening || []).map(c => ({
      id: c.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `crit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`),
      pregunta: c.pregunta,
      tipo: c.tipo,
      peso: c.tipo === 'knockout' ? 0 : Number(c.peso || 0)
    }));

    if (useMocks || token === "mock_session_token_for_docs_generation") {
      console.log("[Server Action crearBusquedaAPI] Flag NEXT_PUBLIC_USE_MOCKS activo o token de docs. Retornando datos mock estáticos.");
      const generatedCode = payload.codigo_busqueda || payload.id_busqueda || `REQ-MOCK-${Date.now()}`;
      const newBusqueda: Busqueda = {
        id: payload.id_busqueda || generatedCode,
        cliente: payload.cliente,
        perfil_busqueda: payload.perfil_busqueda,
        estado_fase: payload.estado_fase || "Abierta",
        responsable_operativo: payload.responsable_operativo,
        responsable_validacion: payload.responsable_validacion,
        fecha_inicio_objetivo: payload.fecha_inicio_objetivo,
        fecha_creacion: new Date().toISOString(),
        candidatos_contador: 0,
        id_busqueda: payload.id_busqueda || generatedCode,
        codigo_busqueda: generatedCode,
        seniority: payload.seniority,
        skills_excluyentes: payload.skills_excluyentes,
        skills_deseables: payload.skills_deseables,
        nivel_ingles_req: payload.nivel_ingles_req,
        modalidad: payload.modalidad,
        presupuesto_max: payload.presupuesto_max,
        prioridad: payload.prioridad || "Normal",
        link_job_description: payload.link_job_description,
        criterios_screening: mappedCriterios
      };
      fallbackBusquedas.unshift(newBusqueda);
      return {
        status: 201,
        success: true,
        message: "Búsqueda guardada en la base de datos (Modo Mock).",
        data: newBusqueda
      };
    }

    // Map flat frontend payload to the 4-block nested structure required by backend
    const nestedPayload = {
      id_busqueda: payload.id_busqueda || undefined,
      codigo_busqueda: payload.codigo_busqueda || undefined,
      identificacion: {
        cliente: payload.cliente,
        hiring_manager: payload.responsable_operativo || "",
        fecha_apertura: payload.fecha_inicio_objetivo ? new Date(payload.fecha_inicio_objetivo).toISOString() : new Date().toISOString()
      },
      perfil_tecnico: {
        rol_solicitado: payload.perfil_busqueda,
        seniority: payload.seniority || "",
        skills_excluyentes: payload.skills_excluyentes || [],
        skills_deseables: payload.skills_deseables || [],
        nivel_ingles_req: payload.nivel_ingles_req || ""
      },
      condiciones: {
        modalidad: payload.modalidad || "",
        zona_horaria_ubicacion: payload.responsable_validacion || ""
      },
      estado_sla: {
        presupuesto_max: payload.presupuesto_max || "",
        estado_busqueda: payload.estado_fase || "preparacion_previa",
        prioridad: payload.prioridad || "Normal",
        link_job_description: payload.link_job_description || ""
      },
      criterios_screening: mappedCriterios
    };

    console.log(`[Server Action] Realizando POST a: ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(nestedPayload)
    });

    const status = response.status;
    let data: any = null;
    try {
      data = await response.json();
    } catch (_) {
      // Safely handle empty payload responses
    }

    if (status === 201) {
      return {
        status,
        success: true,
        message: "Búsqueda guardada en la base de datos.",
        data
      };
    }

    if (status === 207) {
      return {
        status,
        success: true,
        message: "Sincronización parcial: Los datos se guardaron pero la réplica analítica en BigQuery falló (Multi-Status).",
        data
      };
    }

    // Handle 400, 500 or any other response status
    return {
      status,
      success: false,
      message: data?.message || data?.error || `Error del servidor backend (Código ${status}).`,
      data
    };
  } catch (error: any) {
    console.error("[Server Action] Error al guardar busqueda:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red: No se pudo conectar con el microservicio (${error.message || error})`
    };
  }
}

/**
 * Server Action: Retrieves the list of search processes from Cloud Run GET endpoint.
 */
export async function getBusquedasAPI(): Promise<Busqueda[]> {
  try {
    const useMocks = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
    if (useMocks) {
      console.log("[Server Action getBusquedasAPI] Flag NEXT_PUBLIC_USE_MOCKS activo. Retornando datos mock estáticos.");
      return fallbackBusquedas;
    }
    const token = await getServerAuthToken();
    const url = getApiEndpoint("busquedas");

    console.log(`[Server Action] Realizando GET a: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error(`[Server Action] GET /busquedas failed. Status: ${response.status}. Body: ${errorText}`);
      throw new Error(`Backend respondió con ${response.status}: ${errorText}`);
    }

    const json = await response.json();
    console.log("[Server Action] GET /busquedas raw response keys:", Object.keys(json));
    console.log("[Server Action] GET /busquedas json.data type:", typeof json.data, "| length:", Array.isArray(json.data) ? json.data.length : "N/A");
    console.log("[Server Action] GET /busquedas full response (truncated):", JSON.stringify(json).substring(0, 500));
    const rawData = json.data || json.busquedas || json.results || json || [];

    if (!Array.isArray(rawData)) {
      console.error("[Server Action] rawData is not an array:", typeof rawData, rawData);
    }

    console.log("[Server Action] rawData.length:", Array.isArray(rawData) ? rawData.length : "not array");

    // Map the 4-block nested representation back to flat frontend properties
    const mapped: Busqueda[] = rawData.map((item: any) => {
      const cliente = item.identificacion?.cliente ?? item.cliente ?? "";
      const perfil_busqueda = item.perfil_tecnico?.rol_solicitado ?? item.perfil_busqueda ?? "";
      const estado_fase = item.estado_sla?.estado_busqueda ?? item.estado_fase ?? "";
      const responsable_operativo = item.identificacion?.hiring_manager ?? item.responsable_operativo ?? "";
      const responsable_validacion = item.condiciones?.zona_horaria_ubicacion ?? item.responsable_validacion ?? "";
      const fecha_inicio_objetivo = item.identificacion?.fecha_apertura ?? item.fecha_inicio_objetivo ?? "";

      // Nuevos campos del backend
      const id_busqueda = item.id_busqueda || item.id || "";
      const codigo_busqueda = item.codigo_busqueda || item.codigo || item.id_busqueda || item.id || "";
      const seniority = item.perfil_tecnico?.seniority ?? item.seniority ?? "";
      const skills_excluyentes = Array.isArray(item.perfil_tecnico?.skills_excluyentes) ? item.perfil_tecnico.skills_excluyentes : (item.skills_excluyentes || []);
      const skills_deseables = Array.isArray(item.perfil_tecnico?.skills_deseables) ? item.perfil_tecnico.skills_deseables : (item.skills_deseables || []);
      const nivel_ingles_req = item.perfil_tecnico?.nivel_ingles_req ?? item.nivel_ingles_req ?? "";
      const modalidad = item.condiciones?.modalidad ?? item.modalidad ?? "";
      const presupuesto_max = item.estado_sla?.presupuesto_max ?? item.presupuesto_max ?? "";
      const prioridad = item.estado_sla?.prioridad ?? item.prioridad ?? "Normal";
      const link_job_description = item.estado_sla?.link_job_description ?? item.link_job_description ?? "";
      
      // Log raw item for target search to inspect exact backend keys
      if (item.id === "PRUEB1" || item.id_busqueda === "PRUEB1" || (typeof item.id === 'string' && item.id.includes("PRUEB1"))) {
        console.log("[Server Action GET Item PRUEB1 Keys]:", Object.keys(item));
        console.log("[Server Action GET Item PRUEB1 Raw]:", JSON.stringify(item));
      }

      // Parse array of criteria safely from item.criterios_screening, item.criterios or nested blocks
      const criterios_screening = (Array.isArray(item.criterios_screening) && item.criterios_screening.length > 0)
        ? item.criterios_screening 
        : ((Array.isArray(item.criterios) && item.criterios.length > 0)
          ? item.criterios 
          : ((Array.isArray(item.estado_sla?.criterios_screening) && item.estado_sla.criterios_screening.length > 0)
            ? item.estado_sla.criterios_screening
            : ((Array.isArray(item.perfil_tecnico?.criterios_screening) && item.perfil_tecnico.criterios_screening.length > 0)
              ? item.perfil_tecnico.criterios_screening
              : (Array.isArray(item.criterios_screening) ? item.criterios_screening : []))));

      return {
        id: item.id || item.id_busqueda || "",
        cliente,
        perfil_busqueda,
        estado_fase,
        responsable_operativo,
        responsable_validacion,
        fecha_inicio_objetivo,
        fecha_creacion: item.createdAt || item.fecha_creacion,
        candidatos_contador: item.candidatos_contador ?? 0,
        id_busqueda,
        codigo_busqueda,
        seniority,
        skills_excluyentes,
        skills_deseables,
        nivel_ingles_req,
        modalidad,
        presupuesto_max,
        prioridad,
        link_job_description,
        criterios_screening,
        estado_sla: item.estado_sla || {
          estado_busqueda: estado_fase,
          prioridad,
          presupuesto_max,
          link_job_description
        },
        ubicacion: item.condiciones?.zona_horaria_ubicacion || item.ubicacion || ""
      };
    });

    return mapped;
  } catch (error: any) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "(sin definir)";
    console.error(`[Server Action] Error al obtener listado. URL: ${apiUrl} →`, error?.message ?? error);
    // En desarrollo, propaga el error en lugar de retornar datos mock silenciosamente.
    if (process.env.NODE_ENV === "development") {
      throw error;
    }
    return fallbackBusquedas;
  }
}

/**
 * Server Action: Sends a PATCH request to Cloud Run API to update an existing search process.
 */
export async function actualizarBusquedaAPI(id: string, payload: Partial<BusquedaPayload>): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    
    // Format screening criteria array strictly matching backend schema { id, pregunta, tipo, peso }
    const criteriosMapped = payload.criterios_screening ? payload.criterios_screening.map(c => ({
      id: String(c.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `crit_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`)),
      pregunta: String(c.pregunta || "").trim(),
      tipo: (c.tipo === "knockout" ? "knockout" : "deseable") as "knockout" | "deseable",
      peso: c.tipo === "knockout" ? 0 : Number(c.peso || 0)
    })) : undefined;

    // Synchronize local memory cache (ensures persistence during dev/demo sessions)
    const targetIdx = fallbackBusquedas.findIndex(b => b.id === id || b.id_busqueda === id);
    if (targetIdx !== -1) {
      if (payload.estado_fase) fallbackBusquedas[targetIdx].estado_fase = payload.estado_fase;
      if (payload.prioridad) fallbackBusquedas[targetIdx].prioridad = payload.prioridad;
      if (payload.responsable_operativo) fallbackBusquedas[targetIdx].responsable_operativo = payload.responsable_operativo;
      if (payload.skills_excluyentes) fallbackBusquedas[targetIdx].skills_excluyentes = payload.skills_excluyentes;
      if (payload.skills_deseables) fallbackBusquedas[targetIdx].skills_deseables = payload.skills_deseables;
      if (payload.nivel_ingles_req) fallbackBusquedas[targetIdx].nivel_ingles_req = payload.nivel_ingles_req;
      if (payload.modalidad) fallbackBusquedas[targetIdx].modalidad = payload.modalidad;
      if (payload.presupuesto_max) fallbackBusquedas[targetIdx].presupuesto_max = payload.presupuesto_max;
      if (payload.link_job_description) fallbackBusquedas[targetIdx].link_job_description = payload.link_job_description;
      if (criteriosMapped !== undefined) fallbackBusquedas[targetIdx].criterios_screening = criteriosMapped;
    }

    if (token === "mock_session_token_for_docs_generation") {
      return {
        status: 200,
        success: true,
        message: "Proceso de búsqueda actualizado con éxito (Modo Demo).",
        data: targetIdx !== -1 ? fallbackBusquedas[targetIdx] : { ...payload, criterios_screening: criteriosMapped }
      };
    }

    const url = getApiEndpoint(`busquedas/${id}`);

    // EXPANDED PATCH PAYLOAD (Backend update allowing descriptive field mutations)
    const patchPayload: Record<string, any> = {};

    if (payload.estado_fase) {
      patchPayload.estado_busqueda = payload.estado_fase;
    }
    if (payload.prioridad) {
      patchPayload.prioridad = payload.prioridad;
    }
    if (payload.responsable_operativo !== undefined) {
      patchPayload.identificacion = {
        hiring_manager: payload.responsable_operativo
      };
    }
    if (payload.skills_excluyentes !== undefined || payload.skills_deseables !== undefined || payload.nivel_ingles_req !== undefined) {
      patchPayload.perfil_tecnico = {
        skills_excluyentes: payload.skills_excluyentes || [],
        skills_deseables: payload.skills_deseables || [],
        nivel_ingles_req: payload.nivel_ingles_req || ""
      };
    }
    if (payload.modalidad !== undefined) {
      patchPayload.condiciones = {
        modalidad: payload.modalidad
      };
    }
    if (payload.presupuesto_max !== undefined || payload.link_job_description !== undefined) {
      patchPayload.estado_sla = {
        estado_busqueda: payload.estado_fase || "Abierta",
        prioridad: payload.prioridad || "Normal",
        presupuesto_max: payload.presupuesto_max || "",
        link_job_description: payload.link_job_description || ""
      };
    }
    if (criteriosMapped !== undefined) {
      patchPayload.criterios_screening = criteriosMapped;
    }

    console.log(`[Server Action] Realizando PATCH a: ${url}`, JSON.stringify(patchPayload));
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(patchPayload)
    });

    const status = response.status;
    console.log("[Server Action Backend Headers]:", {
      server: response.headers.get("server"),
      date: response.headers.get("date"),
      etag: response.headers.get("etag"),
      xCloudTrace: response.headers.get("x-cloud-trace-context")
    });

    let data: any = null;
    try {
      data = await response.json();
    } catch (_) {
      // Empty or non-JSON response payload
    }

    if (status === 200) {
      console.log("[Server Action PATCH Response Status 200 Data]:", JSON.stringify(data));
      return {
        status,
        success: true,
        message: "Proceso de búsqueda actualizado con éxito en la base de datos.",
        data: data?.data || data || (targetIdx !== -1 ? fallbackBusquedas[targetIdx] : payload)
      };
    }

    if (status === 207) {
      return {
        status,
        success: true,
        message: "Actualización parcial: Se actualizó localmente pero falló la réplica analítica en BigQuery (Multi-Status).",
        data: data?.data || data
      };
    }

    // Report real HTTP failure from backend without masking
    console.error(`[Server Action] PATCH ${url} falló con código ${status}. Respuesta del servidor:`, data);
    return {
      status,
      success: false,
      message: data?.message || data?.error || `Error al actualizar en la base de datos (Código ${status}).`,
      data
    };
  } catch (error: any) {
    console.error("[Server Action] Error al actualizar búsqueda:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red: No se pudo conectar con el microservicio (${error.message || error})`
    };
  }
}
