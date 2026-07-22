'use server';

import { cookies } from "next/headers";

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
  f1_descubrimiento?: {
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
  evaluacion?: {
    puntaje_tecnico?: number | null;
    feedback_cliente?: string | null;
  } | null;
  cierre?: {
    fecha_cierre?: string | null;
    motivo_rechazo?: string | null;
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
    throw new Error("Sesión inactiva o expirada. Por favor vuelva a iniciar sesión.");
  }
  return token;
}

/**
 * Server Action: Queries pipeline records for a specific search process.
 * GET /api/v1/pipeline?id_busqueda=xxx
 */
export async function getPipelineAPI(id_busqueda: string): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api-azulats-yur42lfa-ew.a.run.app";
    
    if (!id_busqueda) {
      return {
        status: 400,
        success: false,
        message: "El identificador de búsqueda (id_busqueda) es obligatorio para consultar el pipeline."
      };
    }

    const url = `${apiBaseUrl}/api/v1/pipeline?id_busqueda=${encodeURIComponent(id_busqueda)}`;
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

    if (status === 200 && result && result.status === "success" && Array.isArray(result.data)) {
      return {
        status,
        success: true,
        message: "Registros del pipeline recuperados correctamente.",
        data: result.data as PipelineItem[]
      };
    }

    return {
      status,
      success: false,
      message: result?.message || `Error al obtener el pipeline del backend (Código HTTP ${status}).`,
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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api-azulats-yur42lfa-ew.a.run.app";

    if (!id_busqueda || !id_candidato) {
      return {
        status: 400,
        success: false,
        message: "El id_busqueda y el id_candidato son obligatorios."
      };
    }

    const url = `${apiBaseUrl}/api/v1/pipeline`;
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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api-azulats-yur42lfa-ew.a.run.app";

    if (!id) {
      return {
        status: 400,
        success: false,
        message: "El identificador del registro del pipeline (id) es obligatorio."
      };
    }

    const url = `${apiBaseUrl}/api/v1/pipeline/${encodeURIComponent(id)}`;
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
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "https://api-azulats-yur42lfa-ew.a.run.app";

    if (!id) {
      return {
        status: 400,
        success: false,
        message: "El identificador del registro del pipeline (id) es obligatorio."
      };
    }

    const url = `${apiBaseUrl}/api/v1/pipeline/${encodeURIComponent(id)}`;
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
