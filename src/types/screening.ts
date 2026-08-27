export interface CriterioScreening {
  id: string;
  pregunta: string;
  tipo: 'knockout' | 'deseable';
  peso: number;
}

export interface ResultadoScreeningItem {
  id_criterio: string;
  evaluacion: 'SI' | 'INFERIDO' | 'NO';
  evidencia_cv: string;
  es_knockout: boolean;
  puntaje_obtenido: number;
  pregunta?: string;
}

export interface PipelineScreeningData {
  resultado_screening?: ResultadoScreeningItem[];
  fit_score_screening?: number;
  tiene_knockout?: boolean;
  fecha_modificacion_screening?: string;
}

export interface PretensionCondiciones {
  pretension_salarial?: string;
  disponibilidad?: string;
  modalidad_preferida?: string;
}

export interface AuditoriaVeracidad {
  inconsistencias_detectadas?: string[];
  confirmaciones_fortalezas?: string[];
}

export interface ExperienciaConsolidadaObj {
  resumen_trayectoria?: string;
  hitos_clave?: string[];
  motivos_salida?: string[];
  herramientas_clave?: string[];
}

export interface AlineacionMotivadoresObj {
  encaje_cultural?: string;
  preferencias_laborales?: string;
  balance_estabilidad_crecimiento?: string;
}

export interface InformeEntrevistaIA {
  experiencia_consolidada?: string | ExperienciaConsolidadaObj;
  alineacion_motivadores?: string | AlineacionMotivadoresObj;
  pretension_economica_condiciones?: PretensionCondiciones;
  proximos_pasos?: string[];
  auditoria_veracidad?: AuditoriaVeracidad;
  fecha_analisis?: string;
}

export interface DimensionesPsicometricas {
  dim_mente: number;       // Extravertido (0) vs Introvertido (100)
  dim_energia: number;     // Intuitivo (0) vs Observador (100)
  dim_naturaleza: number;  // Racional (0) vs Emocional (100)
  dim_tactica: number;     // Planificador (0) vs Prospectivo (100)
  dim_identidad: number;   // Asertivo (0) vs Turbulento (100)
}

export interface TestPersonalidad {
  arquetipo_codigo: string; // ej. "ENTJ-A", "INFP-T"
  arquetipo_nombre: string; // ej. "Comandante", "Mediador"
  dimensiones: DimensionesPsicometricas;
  analisis_encaje: string;  // Párrafo breve generado por la IA
  fecha_analisis: string;   // Timestamp ISO 8601 del backend
}

export interface AssessmentManual {
  resumen_texto: string;
  fecha_evaluacion?: string; // String ISO 8601 inyectado por el backend
}



