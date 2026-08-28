'use server';

import { cookies } from "next/headers";
import { getApiEndpoint } from "@/utils/api";

export interface ConfiguracionAgenciaPayload {
  nombreAgencia?: string;
  nombreComercial?: string;
  sloganAgencia?: string | null;
  logoUrl?: string | null;
  colorPrimario?: string;
  selloTexto?: string;
  emailContacto?: string | null;
  telefonoContacto?: string | null;
  direccion?: string | null;
  mostrarSelloPoweredBy?: boolean;
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
    return "mock-token-recruiter";
  }
  return token;
}

/**
 * Server Action: Queries agency branding configuration (P-CFG-01) from backend microservice.
 * GET /api/v1/configuracion-agencia
 */
export async function getConfiguracionAgenciaAPI(): Promise<APIResponse> {
  try {
    const isMock = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
    if (isMock) {
      return {
        status: 200,
        success: true,
        message: "Configuración obtenida en modo mock.",
        data: {
          nombre_comercial: "Azul Consultora Tech",
          nombre_agencia: "Azul Consultora Tech",
          slogan_agencia: "Headhunting & IT Talent Solutions",
          logo_url: null,
          color_primario: "#1e3a8a",
          sello_texto: "Powered by Azul ATS",
          email_contacto: null,
          telefono_contacto: null,
          direccion: null,
          mostrar_sello_powered_by: true
        }
      };
    }

    const token = await getServerAuthToken();
    const url = getApiEndpoint("configuracion-agencia");

    console.log(`[Config Action] GET a: ${url}`);
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

    console.log(`[Config Action] GET respuesta (HTTP ${status}):`, result);

    if ((status === 200 || status === 201) && result) {
      return {
        status: 200,
        success: true,
        message: "Configuración de agencia obtenida con éxito.",
        data: result.data || result
      };
    }

    return {
      status,
      success: false,
      message: result?.message || `Respuesta HTTP ${status} al consultar la configuración de agencia.`
    };
  } catch (error: any) {
    console.error("[Config Action] Error en getConfiguracionAgenciaAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al consultar backend: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Updates agency branding configuration in backend microservice.
 * Sends all schema fields using `null` instead of `undefined` to meet Firebase Admin SDK requirements.
 * POST /api/v1/configuracion-agencia
 */
export async function actualizarConfiguracionAgenciaAPI(
  payload: ConfiguracionAgenciaPayload
): Promise<APIResponse> {
  try {
    const isMock = process.env.NEXT_PUBLIC_USE_MOCKS === "true";
    if (isMock) {
      return {
        status: 200,
        success: true,
        message: "Configuración de agencia guardada en modo mock.",
        data: payload
      };
    }

    const token = await getServerAuthToken();
    const url = getApiEndpoint("configuracion-agencia");

    const nombre = payload.nombreAgencia || payload.nombreComercial || "Azul ATS Agency";
    const logo = payload.logoUrl && payload.logoUrl.trim() !== "" ? payload.logoUrl : null;
    const slogan = payload.sloganAgencia && payload.sloganAgencia.trim() !== "" ? payload.sloganAgencia : null;

    const jsonBody = JSON.stringify({
      nombre_comercial: nombre,
      nombre_agencia: nombre,
      nombreAgencia: nombre,

      slogan_agencia: slogan,
      sloganAgencia: slogan,

      logo_url: logo,
      logoUrl: logo,

      color_primario: payload.colorPrimario || "#1e3a8a",
      sello_texto: payload.mostrarSelloPoweredBy ? "Powered by Azul ATS" : "",

      email_contacto: payload.emailContacto || null,
      telefono_contacto: payload.telefonoContacto || null,
      direccion: payload.direccion || null,

      mostrar_sello_powered_by: payload.mostrarSelloPoweredBy ?? true,
      mostrarSelloPoweredBy: payload.mostrarSelloPoweredBy ?? true,
      updatedAt: new Date().toISOString()
    });

    console.log(`[Config Action] Enviando POST a backend microservicio: ${url}`);
    
    let response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: jsonBody
    });

    let status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    console.log(`[Config Action] POST respuesta (HTTP ${status}):`, result);

    if (status === 200 || status === 201 || result?.status === "success" || result?.success === true) {
      return {
        status: 200,
        success: true,
        message: result?.message || "Configuración de agencia (P-CFG-01) guardada correctamente en el backend.",
        data: result?.data || result || payload
      };
    }

    return {
      status,
      success: false,
      message: result?.message || result?.error || result?.detail || `El backend devolvió un código de respuesta HTTP ${status}.`
    };
  } catch (error: any) {
    console.error("[Config Action] Error en actualizarConfiguracionAgenciaAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}
