'use server';

import { cookies } from "next/headers";

export interface BusquedaPayload {
  cliente: string;
  perfil_busqueda: string;
  estado_fase: string;
  responsable_operativo: string;
  responsable_validacion: string;
  fecha_inicio_objetivo: string;
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

    console.log(`[Server Action] Realizando POST a: ${url}`);
    const response = await fetch(url, {
      method: "POST",
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
    } catch (_) {
      // Safely handle empty payload responses
    }

    if (status === 201) {
      return {
        status,
        success: true,
        message: "Búsqueda guardada en Firestore y BigQuery.",
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
      throw new Error(`Error en la consulta REST del servidor (Código ${response.status})`);
    }

    const json = await response.json();
    return (json.data || []) as Busqueda[];
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

    console.log(`[Server Action] Realizando PATCH a: ${url}`);
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
