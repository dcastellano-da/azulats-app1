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
