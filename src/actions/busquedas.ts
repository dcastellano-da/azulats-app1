'use server';

import { cookies } from "next/headers";

export interface BusquedaPayload {
  cliente: string;
  perfil_busqueda: string;
  estado_fase: string;
  responsable_operativo: string;
  responsable_validacion: string;
  fecha_inicio_objetivo: string;

  // Nuevos campos del backend
  id_busqueda?: string;
  seniority?: string;
  skills_excluyentes?: string[];
  skills_deseables?: string[];
  nivel_ingles_req?: string;
  modalidad?: string;
  presupuesto_max?: string;
  prioridad?: string;
  link_job_description?: string;
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
  seniority?: string;
  skills_excluyentes?: string[];
  skills_deseables?: string[];
  nivel_ingles_req?: string;
  modalidad?: string;
  presupuesto_max?: string;
  prioridad?: string;
  link_job_description?: string;
}

/**
 * Returns security JWT token from Next.js server cookies.
 */
async function getServerAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("azul_ats_token")?.value;
  if (!token) {
    throw new Error("Sesión inactiva o expirada. Por favor vuelva a iniciar sesión.");
  }
  return token;
}

/**
 * Server Action: Communicates with Cloud Run API v1 endpoint to create a search process.
 */
export async function crearBusquedaAPI(payload: BusquedaPayload): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api-azulats-yur42lfa-ew.a.run.app";
    const url = `${apiBaseUrl}/api/v1/busquedas`;

    // Map flat frontend payload to the 4-block nested structure required by backend
    const nestedPayload = {
      id_busqueda: payload.id_busqueda || undefined,
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
      }
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
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api-azulats-yur42lfa-ew.a.run.app";
    const url = `${apiBaseUrl}/api/v1/busquedas`;

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
      throw new Error(`Error en la consulta REST del servidor (Código ${response.status}): ${errorText}`);
    }

    const json = await response.json();
    const rawData = json.data || [];

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
      const seniority = item.perfil_tecnico?.seniority ?? item.seniority ?? "";
      const skills_excluyentes = Array.isArray(item.perfil_tecnico?.skills_excluyentes) ? item.perfil_tecnico.skills_excluyentes : (item.skills_excluyentes || []);
      const skills_deseables = Array.isArray(item.perfil_tecnico?.skills_deseables) ? item.perfil_tecnico.skills_deseables : (item.skills_deseables || []);
      const nivel_ingles_req = item.perfil_tecnico?.nivel_ingles_req ?? item.nivel_ingles_req ?? "";
      const modalidad = item.condiciones?.modalidad ?? item.modalidad ?? "";
      const presupuesto_max = item.estado_sla?.presupuesto_max ?? item.presupuesto_max ?? "";
      const prioridad = item.estado_sla?.prioridad ?? item.prioridad ?? "Normal";
      const link_job_description = item.estado_sla?.link_job_description ?? item.link_job_description ?? "";

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
        seniority,
        skills_excluyentes,
        skills_deseables,
        nivel_ingles_req,
        modalidad,
        presupuesto_max,
        prioridad,
        link_job_description
      };
    });

    return mapped;
  } catch (error: any) {
    console.error("[Server Action] Error al obtener listado:", error);
    throw error;
  }
}

/**
 * Server Action: Sends a PATCH request to Cloud Run API to update an existing search process.
 */
export async function actualizarBusquedaAPI(id: string, payload: Partial<BusquedaPayload>): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api-azulats-yur42lfa-ew.a.run.app";
    const url = `${apiBaseUrl}/api/v1/busquedas/${id}`;

    // Filter and map fields: only allow modifying 'estado_busqueda' and 'prioridad' (via state mapping)
    const patchPayload: any = {};
    if (payload.estado_fase) {
      patchPayload.estado_busqueda = payload.estado_fase;
    }
    if (payload.prioridad) {
      patchPayload.prioridad = payload.prioridad;
    }

    console.log(`[Server Action] Realizando PATCH a: ${url}`);
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(patchPayload)
    });

    const status = response.status;
    let data: any = null;
    try {
      data = await response.json();
    } catch (_) {
      // Empty or non-JSON response payload
    }

    if (status === 200) {
      return {
        status,
        success: true,
        message: "Proceso de búsqueda actualizado con éxito.",
        data
      };
    }

    if (status === 207) {
      return {
        status,
        success: true,
        message: "Actualización parcial: Se actualizó localmente pero falló la réplica analítica en BigQuery (Multi-Status).",
        data
      };
    }

    return {
      status,
      success: false,
      message: data?.message || data?.error || `Error al actualizar en el servidor (Código ${status}).`,
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
