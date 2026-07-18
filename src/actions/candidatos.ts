'use server';

import { cookies } from "next/headers";

export interface Candidato {
  id: string;
  nombre_completo: string;
  email: string;
  linkedin_url: string;
  puesto: string;
  origen: string; // 'Landing Page' | 'Manual'
  acepta_privacidad: boolean;
  estado_revision: 'Pendiente' | 'Revisado' | 'Descartado' | 'Seleccionado';
  url_cv: string;
  createdAt: string;
  updatedAt?: string;
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

const apiToFrontendStatus = (apiStatus: string): 'Pendiente' | 'Revisado' | 'Descartado' | 'Seleccionado' => {
  const s = (apiStatus || "").toLowerCase().trim();
  if (s === "pendiente") return "Pendiente";
  if (s === "revisado") return "Revisado";
  if (s === "descartado") return "Descartado";
  if (s === "seleccionado") return "Seleccionado";
  if (apiStatus === "Pendiente" || apiStatus === "Revisado" || apiStatus === "Descartado" || apiStatus === "Seleccionado") {
    return apiStatus as 'Pendiente' | 'Revisado' | 'Descartado' | 'Seleccionado';
  }
  return "Pendiente";
};

/**
 * Server Action: Retrieves all candidates espontáneos.
 * GET /api/v1/candidatos
 */
export async function getCandidatosAPI(): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return {
        status: 500,
        success: false,
        message: "Error de configuración: NEXT_PUBLIC_API_URL no está definido."
      };
    }

    const url = `${apiBaseUrl}/api/v1/candidatos`;
    console.log(`[Candidatos Action] GET a: ${url}`);
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
      const candidates: Candidato[] = result.data.map((cand: any) => ({
        id: cand.id || "",
        nombre_completo: cand.nombre_completo || "",
        email: cand.email || "",
        linkedin_url: cand.linkedin_url || "",
        puesto: cand.puesto_postulacion || cand.puesto || "",
        origen: cand.origen || "Landing Page",
        acepta_privacidad: !!cand.acepta_privacidad,
        estado_revision: apiToFrontendStatus(cand.estado_revision),
        url_cv: cand.url_cv || "",
        createdAt: cand.createdAt || new Date().toISOString(),
        updatedAt: cand.updatedAt
      }));

      return {
        status,
        success: true,
        message: "Candidatos recuperados correctamente del backend.",
        data: candidates
      };
    }

    return {
      status,
      success: false,
      message: result?.message || `Error al obtener candidatos de la API (Código HTTP ${status}).`,
    };
  } catch (error: any) {
    console.error("[Candidatos Action] Error en getCandidatosAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend de candidatos: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Alta manual de perfiles espontáneos.
 * POST /api/v1/candidatos [multipart/form-data]
 */
export async function crearCandidatoAPI(formData: FormData): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return {
        status: 500,
        success: false,
        message: "Error de configuración: NEXT_PUBLIC_API_URL no está definido."
      };
    }

    const nombre = formData.get("nombre_completo")?.toString()?.trim();
    const email = formData.get("email")?.toString()?.trim();
    const puesto = formData.get("puesto")?.toString()?.trim();
    const linkedin = formData.get("linkedin_url")?.toString()?.trim() || "";
    const aceptaPrivacidadStr = formData.get("acepta_privacidad")?.toString();
    const cvFile = formData.get("cv");

    // Server-side validation to enable robust 400 Bad Request simulation
    if (!nombre || !email || !puesto || !cvFile) {
      return {
        status: 400,
        success: false,
        message: "Falta completar campos obligatorios del candidato (nombre_completo, email, puesto) o cargar su CV."
      };
    }

    if (aceptaPrivacidadStr !== "true") {
      return {
        status: 400,
        success: false,
        message: "Debe aceptar la política de privacidad y tratamiento de datos personales conforme al RGPD."
      };
    }

    const url = `${apiBaseUrl}/api/v1/candidatos`;
    console.log(`[Candidatos Action] POST multipart/form-data a: ${url}`);
    
    // Construct clean FormData matching backend key names
    const apiFormData = new FormData();
    apiFormData.append("cv", cvFile);
    apiFormData.append("nombre_completo", nombre);
    apiFormData.append("email", email);
    apiFormData.append("puesto_postulacion", puesto);
    if (linkedin) apiFormData.append("linkedin_url", linkedin);
    apiFormData.append("acepta_privacidad", "true");

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: apiFormData
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    if (status === 201 || status === 200) {
      const candidate: Candidato = {
        id: result?.data?.id || `new-cand`,
        nombre_completo: nombre,
        email,
        linkedin_url: linkedin,
        puesto,
        origen: "Manual",
        acepta_privacidad: true,
        estado_revision: "Pendiente",
        url_cv: result?.data?.url_cv || "",
        createdAt: new Date().toISOString()
      };
      
      return {
        status,
        success: true,
        message: "Candidato registrado correctamente en el sistema.",
        data: candidate
      };
    }

    return {
      status,
      success: false,
      message: result?.message || result?.error || `Error al crear candidato en el backend (Código ${status}).`,
    };
  } catch (error: any) {
    console.error("[Candidatos Action] Error en crearCandidatoAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Update candidate information/status (Mutación Controlada).
 * PATCH /api/v1/candidatos/:id
 */
export async function actualizarCandidatoAPI(id: string, payload: Partial<Candidato>): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return {
        status: 500,
        success: false,
        message: "Error de configuración: NEXT_PUBLIC_API_URL no está definido."
      };
    }

    // Mutability Matrix Safeguard: Do not allow unauthorized modifications
    const forbiddenKeys: Array<keyof Candidato> = ["id", "acepta_privacidad", "origen", "url_cv", "createdAt"];
    const containsForbidden = forbiddenKeys.some(key => key in payload);
    if (containsForbidden) {
      return {
        status: 400,
        success: false,
        message: "Acceso denegado: Intento de modificar metadatos históricos inmitables (ID, Origen, Consentimiento, CV original)."
      };
    }

    const apiPayload: any = {};
    if (payload.nombre_completo !== undefined) apiPayload.nombre_completo = payload.nombre_completo;
    if (payload.email !== undefined) apiPayload.email = payload.email;
    if (payload.linkedin_url !== undefined) apiPayload.linkedin_url = payload.linkedin_url;
    if (payload.estado_revision !== undefined) {
      if (payload.estado_revision === "Pendiente") {
        apiPayload.estado_revision = "pendiente";
      } else {
        apiPayload.estado_revision = payload.estado_revision;
      }
    }

    const url = `${apiBaseUrl}/api/v1/candidatos/${id}`;
    console.log(`[Candidatos Action] PATCH a: ${url}`);
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(apiPayload)
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    if (status === 200) {
      return {
        status,
        success: true,
        message: "Candidato actualizado en el backend con éxito.",
        data: {
          id,
          estado_revision: payload.estado_revision || undefined,
          updatedAt: result?.data?.updatedAt || new Date().toISOString()
        }
      };
    }

    return {
      status,
      success: false,
      message: result?.message || `Error al actualizar candidato en el backend (Código ${status}).`,
    };
  } catch (error: any) {
    console.error("[Candidatos Action] Error en actualizarCandidatoAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Deletes candidate from system.
 * DELETE /api/v1/candidatos/:id
 * @param hardDelete: false for Soft Delete (leads to state: 'Descartado'), true for physical removal of file and document.
 */
export async function eliminarCandidatoAPI(id: string, hardDelete: boolean): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return {
        status: 500,
        success: false,
        message: "Error de configuración: NEXT_PUBLIC_API_URL no está definido."
      };
    }

    // A Soft Delete translates to a PATCH changing status to 'Descartado'
    if (!hardDelete) {
      return await actualizarCandidatoAPI(id, { estado_revision: "Descartado" });
    }

    const url = `${apiBaseUrl}/api/v1/candidatos/${id}`;
    console.log(`[Candidatos Action] DELETE a: ${url}`);
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

    if (status === 200) {
      return {
        status,
        success: true,
        message: "Candidato y su CV asociados han sido eliminados de manera física en el sistema.",
        data: result
      };
    }

    return {
      status,
      success: false,
      message: result?.message || `Error al realizar borrado físico en el backend (Código ${status}).`,
    };
  } catch (error: any) {
    console.error("[Candidatos Action] Error en eliminarCandidatoAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}
