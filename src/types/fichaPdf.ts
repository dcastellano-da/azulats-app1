/**
 * Parámetros de selección para la generación de la Ficha Técnica de Presentación a Cliente a PDF (Dossier V2)
 */
export interface FichaPdfOpciones {
  /** Incluir síntesis del perfil redactada por IA al vuelo */
  incluir_resumen_ia?: boolean;
  /** Incluir dimensiones psicométricas y arquetipo cultural (módulo CFV) */
  incluir_test_personalidad?: boolean;
  /** Incluir pretensiones económicas y modalidad (Smart Scorecard) */
  incluir_pretension_salarial?: boolean;
  /** Incluir aspectos destacados del reclutador (Assessment Manual) */
  incluir_notas_assessment?: boolean;
  /** Incluir bitacora cronologica de notas de Fase 1 y Fase 2 */
  incluir_bitacora?: boolean;
  /** Incluir historial laboral y trayectoria educativa del candidato */
  incluir_trayectoria?: boolean;
  /** Modo Ciego: Ocultar foto, nombre completo, correo y teléfono del candidato */
  anonimizar_candidato?: boolean;
}

/**
 * Estados del flujo animado de generación visual ("Efecto Wow")
 */
export type PasosProgresoFichaPdf =
  | "idle"
  | "recopilando"
  | "redactando_ia"
  | "renderizando_pdf"
  | "completado"
  | "error";

/**
 * Estructura de respuesta de la Server Action de generación de Ficha PDF
 */
export interface GenerarFichaPdfResponse {
  status: number;
  success: boolean;
  message: string;
  /** Cadena en Base64 o Data URI del PDF renderizado */
  data?: string;
  /** Nombre del archivo sugerido para descarga */
  filename?: string;
  contentType?: string;
}
