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
  telefono_movil?: string | null;
  ubicacion?: string | null;
  skills_principales?: string | null;
  nivel_ingles?: string | null;
  otros_idiomas?: string | null;
  notas_iniciales?: string | null;
  resumen?: string | null;
  rubros?: string | null;
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
        updatedAt: cand.updatedAt,
        telefono_movil: cand.telefono_movil || "",
        ubicacion: cand.ubicacion || "",
        skills_principales: cand.skills_principales || "",
        nivel_ingles: cand.nivel_ingles || "",
        otros_idiomas: cand.otros_idiomas || "",
        notas_iniciales: cand.notas_iniciales || "",
        resumen: cand.resumen || "",
        rubros: cand.rubros || ""
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

    // Nuevos campos opcionales
    const telefono = formData.get("telefono_movil")?.toString()?.trim() || "";
    const ubicacion = formData.get("ubicacion")?.toString()?.trim() || "";
    const skills = formData.get("skills_principales")?.toString()?.trim() || "";
    const ingles = formData.get("nivel_ingles")?.toString()?.trim() || "";
    const otrosIdiomas = formData.get("otros_idiomas")?.toString()?.trim() || "";
    const notas = formData.get("notas_iniciales")?.toString()?.trim() || "";
    const resumen = formData.get("resumen")?.toString()?.trim() || "";
    const rubros = formData.get("rubros")?.toString()?.trim() || "";

    // Server-side validation to enable robust 400 Bad Request simulation
    if (!nombre || !email || !puesto) {
      return {
        status: 400,
        success: false,
        message: "Falta completar campos obligatorios del candidato (nombre_completo, email, puesto)."
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
    if (cvFile && typeof cvFile !== "string" && (cvFile as any).size > 0) {
      apiFormData.append("cv", cvFile);
    }
    apiFormData.append("nombre_completo", nombre);
    apiFormData.append("email", email);
    apiFormData.append("puesto_postulacion", puesto);
    if (linkedin) apiFormData.append("linkedin_url", linkedin);
    apiFormData.append("acepta_privacidad", "true");
    
    apiFormData.append("telefono_movil", telefono);
    apiFormData.append("ubicacion", ubicacion);
    apiFormData.append("skills_principales", skills);
    apiFormData.append("nivel_ingles", ingles);
    apiFormData.append("otros_idiomas", otrosIdiomas);
    apiFormData.append("notas_iniciales", notas);
    apiFormData.append("resumen", resumen);
    apiFormData.append("rubros", rubros);

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
        createdAt: new Date().toISOString(),
        telefono_movil: telefono,
        ubicacion: ubicacion,
        skills_principales: skills,
        nivel_ingles: ingles,
        otros_idiomas: otrosIdiomas,
        notas_iniciales: notas,
        resumen: resumen,
        rubros: rubros
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
    const forbiddenKeys: Array<keyof Candidato> = ["id", "acepta_privacidad", "origen", "url_cv", "createdAt", "puesto"];
    const containsForbidden = forbiddenKeys.some(key => key in payload);
    if (containsForbidden) {
      return {
        status: 400,
        success: false,
        message: "Acceso denegado: Intento de modificar metadatos históricos inmutables (ID, Origen, Consentimiento, CV original, Puesto de postulación original)."
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
    if (payload.telefono_movil !== undefined) apiPayload.telefono_movil = payload.telefono_movil;
    if (payload.ubicacion !== undefined) apiPayload.ubicacion = payload.ubicacion;
    if (payload.skills_principales !== undefined) apiPayload.skills_principales = payload.skills_principales;
    if (payload.nivel_ingles !== undefined) apiPayload.nivel_ingles = payload.nivel_ingles;
    if (payload.otros_idiomas !== undefined) apiPayload.otros_idiomas = payload.otros_idiomas;
    if (payload.notas_iniciales !== undefined) apiPayload.notas_iniciales = payload.notas_iniciales;
    if (payload.resumen !== undefined) apiPayload.resumen = payload.resumen;
    if (payload.rubros !== undefined) apiPayload.rubros = payload.rubros;

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
          ...payload,
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

/**
 * Server Action: Importación asistida por Inteligencia Artificial (Genkit + Vertex AI).
 * POST /api/v1/candidatos/importar-ia
 */
export async function importarCandidatoIA_API(formData: FormData): Promise<APIResponse> {
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

    const cvFile = formData.get("cv");
    if (!cvFile) {
      return {
        status: 400,
        success: false,
        message: "Debe cargar un currículum (archivo PDF, DOC o DOCX)."
      };
    }

    const url = `${apiBaseUrl}/api/v1/candidatos/importar-ia`;
    console.log(`[Candidatos Action] POST (Importar IA) a: ${url}`);
    
    const apiFormData = new FormData();
    apiFormData.append("cv", cvFile);
    
    const notas = formData.get("notas_iniciales")?.toString()?.trim();
    if (notas) {
      apiFormData.append("notas_iniciales", notas);
    }

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
      return {
        status,
        success: true,
        message: "Candidato importado y procesado por IA correctamente.",
        data: result?.data
      };
    }

    return {
      status,
      success: false,
      message: result?.message || result?.error || `Error al importar candidato con IA (Código ${status}).`,
    };
  } catch (error: any) {
    console.error("[Candidatos Action] Error en importarCandidatoIA_API:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

