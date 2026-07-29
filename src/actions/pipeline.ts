'use server';

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ResultadoScreeningItem } from "@/types/screening";
import { getApiEndpoint } from "@/utils/api";

export interface Reunion {
  id_reunion: string;
  fecha_hora: string;
  link_reunion?: string | null;
  objetivo?: string | null;
  notas?: string | null;
  fase?: string | null;
}

export interface PipelineItem {
  id: string;
  claves_conexion: {
    id_busqueda: string;
    id_candidato: string;
  };
  flujo: {
    estado_actual: string;
    fecha_ultimo_cambio: string;
    historial_estados?: Array<{ estado: string; timestamp: string }>;
  };
  resultado_screening?: ResultadoScreeningItem[];
  fit_score_screening?: number;
  tiene_knockout?: boolean;
  fecha_modificacion_screening?: string;
  f1_descubrimiento?: {
    notas_reclutador?: string | null;
    reuniones?: Reunion[] | null;
    analisis_semantico?: {
      origen?: string;
      fit_score?: number;
      fortalezas?: string[];
      debilidades?: string[];
      recomendaciones?: string;
    } | null;
    outreach?: {
      variante_enviada?: string | null;
      fecha_envio?: string | null;
    } | null;
  } | null;
  f2_evaluacion?: {
    notas_reclutador?: string | null;
    puntaje_tecnico?: number | null;
    feedback_cliente?: string | null;
    reuniones?: Reunion[] | null;
  } | null;
  evaluacion?: {
    notas_reclutador?: string | null;
    puntaje_tecnico?: number | null;
    feedback_cliente?: string | null;
    reuniones?: Reunion[] | null;
  } | null;
  f3_presentacion?: {
    notas_reclutador?: string | null;
    feedback_cliente?: string | null;
    reuniones?: Reunion[] | null;
  } | null;
  presentacion?: {
    notas_reclutador?: string | null;
    feedback_cliente?: string | null;
    reuniones?: Reunion[] | null;
  } | null;
  f3_cliente?: {
    notas_reclutador?: string | null;
    feedback_cliente?: string | null;
    reuniones?: Reunion[] | null;
  } | null;
  f4_cierre?: {
    notas_reclutador?: string | null;
    reuniones?: Reunion[] | null;
  } | null;
  cierre?: {
    fecha_cierre?: string | null;
    motivo_rechazo?: string | null;
    notas_reclutador?: string | null;
    reuniones?: Reunion[] | null;
  } | null;
  motivo_rechazo?: string | null;
  resolucion?: {
    estado_final?: string | null;
    motivo_rechazo?: string | null;
    fecha_resolucion?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface APIResponse {
  status: number;
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Returns security JWT token from Next.js server cookies.
 */
async function getServerAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("azul_ats_token")?.value;
  if (!token) {
    console.log("[Server Action] Token de sesión no encontrado en cookie, usando mock-token-recruiter para conectar a Express local puerto 8080");
    return "mock-token-recruiter";
  }
  return token;
}

/**
 * Server Action: Queries pipeline records for a specific search process.
 * GET /api/v1/pipeline?id_busqueda=xxx
 */
export async function getPipelineAPI(id_busqueda: string): Promise<APIResponse> {
  const fallbackPipeline: PipelineItem[] = [
    {
      id: "pipe-001",
      claves_conexion: {
        id_busqueda: id_busqueda || "REQ-001",
        id_candidato: "cand-001"
      },
      flujo: {
        estado_actual: "01_nuevo",
        fecha_ultimo_cambio: new Date().toISOString()
      },
      f1_descubrimiento: {
        notas_reclutador: "Candidato con perfil sobresaliente. Muy buena disposición para entrevista técnica.",
        analisis_semantico: {
          origen: "✨ GEMINI LIVE",
          fit_score: 94,
          fortalezas: [
            "Sólida experiencia de 5+ años en desarrollo web React senior.",
            "Excelente manejo del ecosistema TypeScript y optimización frontend."
          ],
          debilidades: [
            "Poco bagaje en frameworks de backend nativos."
          ],
          recomendaciones: "Avanzar directamente a entrevista técnica intermedia."
        },
        outreach: {
          variante_enviada: "A",
          fecha_envio: "2026-07-20"
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "pipe-002",
      claves_conexion: {
        id_busqueda: id_busqueda || "REQ-001",
        id_candidato: "cand-002"
      },
      flujo: {
        estado_actual: "02_contactado",
        fecha_ultimo_cambio: new Date().toISOString()
      },
      f1_descubrimiento: {
        notas_reclutador: "Contactado por LinkedIn. Pendiente de confirmar pretensión salarial.",
        analisis_semantico: {
          origen: "✨ GEMINI LIVE",
          fit_score: 87,
          fortalezas: ["Buena comunicación", "Conocimientos de React"],
          debilidades: ["Falta experiencia en Next.js"],
          recomendaciones: "Sondear disponibilidad."
        },
        outreach: {
          variante_enviada: "B",
          fecha_envio: "2026-07-21"
        }
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  try {
    const token = await getServerAuthToken();
    if (token === "mock_session_token_for_docs_generation") {
      return {
        status: 200,
        success: true,
        message: "Pipeline recuperado correctamente (modo mockup).",
        data: fallbackPipeline
      };
    }

    if (!id_busqueda) {
      return {
        status: 400,
        success: false,
        message: "El identificador de búsqueda (id_busqueda) es obligatorio para consultar el pipeline."
      };
    }

    const url = getApiEndpoint(`pipeline?id_busqueda=${encodeURIComponent(id_busqueda)}`);
    console.log(`[Pipeline Action] GET a: ${url}`);
    
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    console.log(`[Pipeline Action] Response HTTP Status ${status} para id_busqueda="${id_busqueda}":`, JSON.stringify(result).substring(0, 300));

    if (status === 200 && result) {
      const rawData = Array.isArray(result.data) 
        ? result.data 
        : (Array.isArray(result) ? result : null);

      if (rawData) {
        console.log(`[Pipeline Action] ✅ Entregando ${rawData.length} ítems del pipeline desde Express/Firestore.`);
        // Log screening fields for EACH item so we can diagnose what the backend actually returns
        rawData.forEach((item: any) => {
          console.log(`[Pipeline Action] 📋 Ítem ID=${item.id} | resultado_screening=${JSON.stringify(item.resultado_screening ?? "CAMPO_AUSENTE")} | fit_score_screening=${item.fit_score_screening ?? "CAMPO_AUSENTE"} | tiene_knockout=${item.tiene_knockout ?? "CAMPO_AUSENTE"}`);
        });
        return {
          status: 200,
          success: true,
          message: "Registros del pipeline recuperados correctamente de la base de datos.",
          data: rawData as PipelineItem[]
        };
      }
    }

    if (status !== 200) {
      return {
        status,
        success: false,
        message: result?.message || `Error al obtener el pipeline del backend (Código HTTP ${status}).`,
      };
    }

    return {
      status: 200,
      success: true,
      message: "Respuesta de respaldo de pipeline.",
      data: fallbackPipeline
    };
  } catch (error: any) {
    console.error("[Pipeline Action] Error en getPipelineAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend de pipeline: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Creates a connection between a candidate and a search in the pipeline.
 * POST /api/v1/pipeline
 */
export async function crearPipelineAPI(id_busqueda: string, id_candidato: string): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const url = getApiEndpoint("pipeline");
    console.log(`[Pipeline Action] POST a: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ id_busqueda, id_candidato })
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    if ((status === 200 || status === 201) && result && result.status === "success") {
      return {
        status,
        success: true,
        message: "Registro creado exitosamente en el pipeline.",
        data: result.data
      };
    }

    return {
      status,
      success: false,
      message: result?.message || `Error al crear registro en el pipeline (Código HTTP ${status}).`,
    };
  } catch (error: any) {
    console.error("[Pipeline Action] Error en crearPipelineAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Updates a connection in the pipeline.
 * PATCH /api/v1/pipeline/:id
 */
export async function actualizarPipelineAPI(id: string, payload: any): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const url = getApiEndpoint(`pipeline/${encodeURIComponent(id)}`);
    console.log(`[Pipeline Action] PATCH a: ${url}`);

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    if (status === 200 && result && result.status === "success") {
      return {
        status,
        success: true,
        message: "Registro del pipeline actualizado correctamente.",
        data: result.data
      };
    }

    return {
      status,
      success: false,
      message: result?.message || `Error al actualizar el pipeline del backend (Código HTTP ${status}).`,
    };
  } catch (error: any) {
    console.error("[Pipeline Action] Error en actualizarPipelineAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Deletes a connection from the pipeline.
 * DELETE /api/v1/pipeline/:id
 */
export async function eliminarPipelineAPI(id: string): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const url = getApiEndpoint(`pipeline/${encodeURIComponent(id)}`);
    console.log(`[Pipeline Action] DELETE a: ${url}`);

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    if (status === 200 && result && result.status === "success") {
      return {
        status,
        success: true,
        message: "Registro del pipeline eliminado correctamente."
      };
    }

    return {
      status,
      success: false,
      message: result?.message || `Error al eliminar el pipeline del backend (Código HTTP ${status}).`,
    };
  } catch (error: any) {
    console.error("[Pipeline Action] Error en eliminarPipelineAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Dispara la inferencia de IA para evaluar el CV del candidato contra los criterios de screening.
 * POST /api/v1/pipeline/:id/evaluar-screening
 */
export async function evaluarScreeningAction(pipelineId: string): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const url = getApiEndpoint(`pipeline/${pipelineId}/evaluar-screening`);

    console.log(`[Pipeline Action] Evaluando screening con IA a: ${url}`);
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const status = response.status;
    let data: any = null;
    try {
      data = await response.json();
    } catch (_) {}

    if (status === 200) {
      revalidatePath(`/talento/${pipelineId}`);
      revalidatePath("/evaluacion");
      revalidatePath("/descubrimiento");
      return {
        status,
        success: true,
        message: "Evaluación de screening realizada con éxito por la IA.",
        data
      };
    }

    if (status === 400) {
      return {
        status,
        success: false,
        message: data?.message || data?.error || "El candidato no posee un archivo CV registrado para evaluar.",
        data
      };
    }

    return {
      status,
      success: false,
      message: data?.message || data?.error || `Error del servidor backend al evaluar screening (${status}).`,
      data
    };
  } catch (error: any) {
    console.error("[Pipeline Action] Error en evaluarScreeningAction:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el servicio de IA: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Actualiza manualmente los resultados del screening (Human-in-the-Loop) y recalcula puntajes en backend.
 * PATCH /api/v1/pipeline/:id
 */
export async function actualizarResultadoScreeningAction(
  pipelineId: string,
  resultadoScreening: ResultadoScreeningItem[]
): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const url = getApiEndpoint(`pipeline/${pipelineId}`);

    const payload = {
      resultado_screening: resultadoScreening
    };

    console.log(`[Pipeline Action] Actualizando resultado de screening en: ${url}`);
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const status = response.status;
    let data: any = null;
    try {
      data = await response.json();
    } catch (_) {}

    if (status === 200) {
      revalidatePath(`/talento/${pipelineId}`);
      revalidatePath("/evaluacion");
      revalidatePath("/descubrimiento");
      return {
        status,
        success: true,
        message: "Resultado de screening actualizado y puntajes recalculados.",
        data
      };
    }

    return {
      status,
      success: false,
      message: data?.message || data?.error || `Error al actualizar screening (${status}).`,
      data
    };
  } catch (error: any) {
    console.error("[Pipeline Action] Error en actualizarResultadoScreeningAction:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Objeto individual de pipeline por su ID.
 * GET /api/v1/pipeline/:id
 */
export async function getPipelineItemAPI(id: string): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const url = getApiEndpoint(`pipeline/${id}`);

    console.log(`[Pipeline Action] getPipelineItemAPI GET a: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const status = response.status;
    let data: any = null;
    try {
      data = await response.json();
    } catch (_) {}

    console.log(`[Pipeline Action] getPipelineItemAPI HTTP ${status} para id="${id}": ${JSON.stringify(data).substring(0, 300)}`);

    if (status === 200) {
      return {
        status,
        success: true,
        message: "Registro de pipeline obtenido correctamente.",
        data: data.data || data
      };
    }

    return {
      status,
      success: false,
      message: data?.message || `Error al obtener el pipeline (${status}).`,
      data
    };
  } catch (error: any) {
    return {
      status: 500,
      success: false,
      message: `Error de red: ${error.message || error}`
    };
  }
}


