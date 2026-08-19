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

