'use client';

import React, { useEffect, useState, useMemo } from "react";
import { Busqueda } from "@/actions/busquedas";
import { Candidato } from "@/actions/candidatos";
import { PipelineItem } from "@/actions/pipeline";

interface PipelineChartProps {
  busquedas?: Busqueda[];
  candidatos?: Candidato[];
  pipelineItems?: PipelineItem[];
  selectedClient?: string;
  selectedSearch?: string;
}

export interface StateDefinition {
  code: string;
  label: string;
  fill: string;
}

export interface PhaseGroupDefinition {
  phaseId: string;
  phaseTitle: string;
  badgeBg: string;
  badgeText: string;
  borderColor: string;
  states: StateDefinition[];
}

export const PIPELINE_PHASES: PhaseGroupDefinition[] = [
  {
    phaseId: "F1",
    phaseTitle: "F1 Descubrimiento",
    badgeBg: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400",
    badgeText: "text-indigo-400",
    borderColor: "border-t-indigo-500",
    states: [
      { code: "01_nuevo", label: "01 - NUEVO EN REVISION", fill: "#6366f1" },
      { code: "02_contactado", label: "02 - BLOQUEADO / PENDIENTE", fill: "#6bd8cb" },
      { code: "03_bloqueado", label: "03 - EN DUDA A CONFIRMAR", fill: "#f59e0b" },
      { code: "04_rechazado", label: "04 - RECHAZADO EN FASE INICIAL", fill: "#f43f5e" }
    ]
  },
  {
    phaseId: "F2",
    phaseTitle: "F2 Evaluación",
    badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-400",
    badgeText: "text-amber-400",
    borderColor: "border-t-amber-500",
    states: [
      { code: "05_screening", label: "05 - SCREENING / ENTREVISTA INICIAL", fill: "#f59e0b" },
      { code: "06_assessment", label: "06 - PRUEBA / ASSESSMENT TÉCNICO", fill: "#6bd8cb" },
      { code: "07_en_duda_evaluacion", label: "07 - EN DUDA EVALUACIÓN", fill: "#fbbf24" },
      { code: "08_descartado_interno", label: "08 - DESCARTADO (INTERNO)", fill: "#f43f5e" }
    ]
  },
  {
    phaseId: "F3",
    phaseTitle: "F3 Cliente",
    badgeBg: "bg-purple-500/10 border-purple-500/30 text-purple-400",
    badgeText: "text-purple-400",
    borderColor: "border-t-purple-500",
    states: [
      { code: "09_shortlist", label: "09 - SHORTLIST / ENVIADO", fill: "#a855f7" },
      { code: "10_entrevista_cliente", label: "10 - ENTREVISTA CON CLIENTE", fill: "#10b981" },
      { code: "11_standby", label: "11 - STAND-BY / BACK-UP", fill: "#c084fc" }
    ]
  },
  {
    phaseId: "F4",
    phaseTitle: "F4 Cierre",
    badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
    badgeText: "text-emerald-400",
    borderColor: "border-t-emerald-500",
    states: [
      { code: "12_oferta_extendida", label: "12 - OFERTA EXTENDIDA / NEGOCIACIÓN", fill: "#f59e0b" },
      { code: "13_contratado", label: "13 - CONTRATADO (WON)", fill: "#10b981" },
      { code: "14_rechazado_cliente", label: "14 - RECHAZADO CLIENTE (LOST)", fill: "#f43f5e" },
      { code: "15_candidato_se_baja", label: "15 - CANDIDATO SE BAJA (DROP-OUT)", fill: "#fb7185" }
    ]
  }
];

export default function PipelineChart({
  busquedas = [],
  candidatos = [],
  pipelineItems = [],
  selectedClient = "all",
  selectedSearch = "all"
}: PipelineChartProps) {
  const [mounted, setMounted] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const phaseData = useMemo(() => {
    // 1. Filter active searches matching selectedClient and selectedSearch
    let searchesInScope = busquedas.filter((b) => {
      const status = (b.estado_fase || b.estado_sla?.estado_busqueda || "").toLowerCase();
      return status !== "cerrada" && status !== "cancelada";
    });

    if (selectedClient !== "all") {
      searchesInScope = searchesInScope.filter((b) => b.cliente === selectedClient);
    }
    if (selectedSearch !== "all") {
      searchesInScope = searchesInScope.filter(
        (b) =>
          (b.id || b.id_busqueda || b.codigo_busqueda) === selectedSearch ||
          `${b.cliente} - ${b.perfil_busqueda}` === selectedSearch
      );
    }

    const searchIds = new Set(
      searchesInScope.flatMap((b) =>
        [b.id, b.id_busqueda, b.codigo_busqueda, `${b.cliente} - ${b.perfil_busqueda}`].filter(Boolean) as string[]
      )
    );
    const searchProfiles = new Set(
      searchesInScope.map((b) => (b.perfil_busqueda || "").toLowerCase()).filter(Boolean)
    );

    const counts: Record<string, number> = {
      "01_nuevo": 0,
      "02_contactado": 0,
      "03_bloqueado": 0,
      "04_rechazado": 0,
      "05_screening": 0,
      "06_assessment": 0,
      "07_en_duda_evaluacion": 0,
      "08_descartado_interno": 0,
      "09_shortlist": 0,
      "10_entrevista_cliente": 0,
      "11_standby": 0,
      "12_oferta_extendida": 0,
      "13_contratado": 0,
      "14_rechazado_cliente": 0,
      "15_candidato_se_baja": 0
    };

    if (pipelineItems && pipelineItems.length > 0) {
      const itemsInScope = pipelineItems.filter((p: any) =>
        searchIds.has(p.claves_conexion?.id_busqueda || p.id_busqueda)
      );

      itemsInScope.forEach((p: any) => {
        const rawState = (
          p.flujo?.estado_actual ||
          p.estado_actual ||
          p.currentPhase ||
          ""
        ).toString().toLowerCase().trim();

        if (rawState === "01_nuevo" || rawState.includes("01") || rawState.includes("nuevo")) {
          counts["01_nuevo"] += 1;
        } else if (rawState === "02_contactado" || rawState.includes("02") || rawState.includes("contactado")) {
          counts["02_contactado"] += 1;
        } else if (rawState === "03_bloqueado" || rawState.includes("03") || rawState.includes("bloqueado")) {
          counts["03_bloqueado"] += 1;
        } else if (rawState === "04_rechazado" || rawState.includes("04") || rawState.includes("rechazado en fase inicial")) {
          counts["04_rechazado"] += 1;
        } else if (rawState === "05_screening" || rawState.includes("05") || rawState.includes("screening")) {
          counts["05_screening"] += 1;
        } else if (rawState === "06_assessment" || rawState.includes("06") || rawState.includes("assessment") || rawState.includes("prueba")) {
          counts["06_assessment"] += 1;
        } else if (rawState === "07_en_duda_evaluacion" || rawState.includes("07") || rawState.includes("duda")) {
          counts["07_en_duda_evaluacion"] += 1;
        } else if (rawState === "08_descartado_interno" || rawState.includes("08") || rawState.includes("descartado")) {
          counts["08_descartado_interno"] += 1;
        } else if (rawState === "09_shortlist" || rawState.includes("09") || rawState.includes("shortlist")) {
          counts["09_shortlist"] += 1;
        } else if (rawState === "10_entrevista_cliente" || rawState.includes("10") || rawState.includes("entrevista con cliente")) {
          counts["10_entrevista_cliente"] += 1;
        } else if (rawState === "11_standby" || rawState.includes("11") || rawState.includes("standby")) {
          counts["11_standby"] += 1;
        } else if (rawState === "12_oferta_extendida" || rawState.includes("12") || rawState.includes("oferta")) {
          counts["12_oferta_extendida"] += 1;
        } else if (rawState === "13_contratado" || rawState.includes("13") || rawState.includes("contratado")) {
          counts["13_contratado"] += 1;
        } else if (rawState === "14_rechazado_cliente" || rawState.includes("14") || rawState.includes("rechazado cliente")) {
          counts["14_rechazado_cliente"] += 1;
        } else if (rawState === "15_candidato_se_baja" || rawState.includes("15") || rawState.includes("se baja")) {
          counts["15_candidato_se_baja"] += 1;
        } else {
          counts["01_nuevo"] += 1;
        }
      });
    } else {
      let candidatesInScope = candidatos;
      if (selectedClient !== "all" || selectedSearch !== "all") {
        candidatesInScope = candidatos.filter((c: any) => {
          const cSearchId = c.id_busqueda || c.codigo_busqueda || c.busqueda_id || c.searchId || c.claves_conexion?.id_busqueda;
          if (cSearchId && searchIds.has(cSearchId)) return true;
          const cPuesto = (c.puesto || c.role || "").toLowerCase();
          if (cPuesto && searchProfiles.has(cPuesto)) return true;
          return false;
        });
      }

      if (candidatesInScope.length > 0) {
        candidatesInScope.forEach((c: any) => {
          const rawState = (
            c.estado_actual ||
            c.currentPhase ||
            c.flujo?.estado_actual ||
            c.phase1State ||
            c.fase_pipeline ||
            c.estado_revision ||
            ""
          ).toString().toLowerCase().trim();

          if (rawState.includes("01") || rawState === "01_nuevo" || rawState.includes("nuevo")) {
            counts["01_nuevo"] += 1;
          } else if (rawState.includes("02") || rawState === "02_contactado" || rawState.includes("contactado")) {
            counts["02_contactado"] += 1;
          } else if (rawState.includes("03") || rawState === "03_bloqueado" || rawState.includes("bloqueado")) {
            counts["03_bloqueado"] += 1;
          } else if (rawState.includes("04") || rawState === "04_rechazado" || rawState.includes("rechazado en fase inicial")) {
            counts["04_rechazado"] += 1;
          } else if (rawState.includes("05") || rawState === "05_screening" || rawState.includes("screening")) {
            counts["05_screening"] += 1;
          } else if (rawState.includes("06") || rawState === "06_assessment" || rawState.includes("assessment") || rawState.includes("prueba")) {
            counts["06_assessment"] += 1;
          } else if (rawState.includes("07") || rawState === "07_en_duda_evaluacion" || rawState.includes("duda")) {
            counts["07_en_duda_evaluacion"] += 1;
          } else if (rawState.includes("08") || rawState === "08_descartado_interno" || rawState.includes("descartado (interno)")) {
            counts["08_descartado_interno"] += 1;
          } else if (rawState.includes("09") || rawState === "09_shortlist" || rawState.includes("shortlist")) {
            counts["09_shortlist"] += 1;
          } else if (rawState.includes("10") || rawState === "10_entrevista_cliente" || rawState.includes("entrevista con cliente")) {
            counts["10_entrevista_cliente"] += 1;
          } else if (rawState.includes("11") || rawState === "11_standby" || rawState.includes("standby") || rawState.includes("back-up")) {
            counts["11_standby"] += 1;
          } else if (rawState.includes("12") || rawState === "12_oferta_extendida" || rawState.includes("oferta")) {
            counts["12_oferta_extendida"] += 1;
          } else if (rawState.includes("13") || rawState === "13_contratado" || rawState.includes("contratado") || rawState.includes("won")) {
            counts["13_contratado"] += 1;
          } else if (rawState.includes("14") || rawState === "14_rechazado_cliente" || rawState.includes("rechazado cliente")) {
            counts["14_rechazado_cliente"] += 1;
          } else if (rawState.includes("15") || rawState === "15_candidato_se_baja" || rawState.includes("se baja") || rawState.includes("drop")) {
            counts["15_candidato_se_baja"] += 1;
          } else if (rawState.includes("descartado") || rawState.includes("rechazado")) {
            counts["08_descartado_interno"] += 1;
          } else if (rawState.includes("finalizado")) {
            counts["13_contratado"] += 1;
          } else if (rawState.includes("seleccionado") || rawState.includes("revisado")) {
            counts["01_nuevo"] += 1;
          } else {
            counts["01_nuevo"] += 1;
          }
        });
      }
    }

    return PIPELINE_PHASES.map((phase) => {
      const statesWithCount = phase.states.map((st) => ({
        ...st,
        candidatos: counts[st.code] || 0
      }));
      const totalPhaseCandidates = statesWithCount.reduce((acc, curr) => acc + curr.candidatos, 0);
      return {
        ...phase,
        totalPhaseCandidates,
        states: statesWithCount
      };
    });
  }, [busquedas, candidatos, pipelineItems, selectedClient, selectedSearch]);

  const totalCandidatesInPipeline = useMemo(() => {
    return phaseData.reduce((acc, phase) => acc + phase.totalPhaseCandidates, 0);
  }, [phaseData]);

  const maxStateCount = useMemo(() => {
    return Math.max(1, ...phaseData.flatMap((p) => p.states.map((s) => s.candidatos)));
  }, [phaseData]);

  if (!mounted) {
    return (
      <div className="glass-panel rounded-2xl p-6 h-96 flex items-center justify-center backdrop-blur-md">
        <span className="text-[#879391] text-sm font-medium animate-pulse">Cargando estado del pipeline...</span>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl p-6 relative overflow-hidden backdrop-blur-md min-h-[384px] flex flex-col justify-between">
      <div className="flex items-start justify-between mb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-white">Postulantes por Estado Actual</h3>
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
              title="Ver criterio y fórmula de cálculo"
            >
              ?
            </button>
          </div>
          <p className="text-xs text-[#879391]">
            Distribución de candidatos por el campo estado_actual según filtros aplicados ({totalCandidatesInPipeline} postulantes)
          </p>
        </div>
      </div>

      {/* Help Overlay */}
      {showHelp && (
        <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-5 rounded-2xl flex flex-col justify-between z-30 border border-white/10 animate-fadeIn">
          <div className="space-y-3 text-left">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <span className="text-xs font-bold text-[#6bd8cb] uppercase tracking-wider">Criterio - Postulantes por Estado Actual</span>
              <button 
                onClick={() => setShowHelp(false)}
                className="text-white/40 hover:text-white font-bold text-xs cursor-pointer"
              >
                Cerrar
              </button>
            </div>
            <p className="text-xs text-white/80 leading-relaxed">
              Muestra la cantidad total de postulantes clasificados en cada categoría del campo "estado_actual" en el pipeline de reclutamiento (los 15 estados estandarizados agrupados en F1 Descubrimiento, F2 Evaluación, F3 Cliente y F4 Cierre), calculados dinámicamente en función de los filtros seleccionados (Cliente y Búsqueda).
            </p>
            <p className="text-[10px] text-[#c4c1fb] font-mono tracking-tight pt-1">
              Fórmula: Agregación de Count(Candidatos) por el campo estado_actual en las búsquedas en alcance.
            </p>
          </div>
        </div>
      )}

      {/* Grouped Phase Grid with States */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-2">
        {phaseData.map((phase) => (
          <div 
            key={phase.phaseId}
            className={`rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3 border-t-2 ${phase.borderColor}`}
          >
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-md border ${phase.badgeBg}`}>
                {phase.phaseTitle}
              </span>
              <span className="text-xs font-mono font-semibold text-[#879391]">
                {phase.totalPhaseCandidates} postulantes
              </span>
            </div>

            <div className="space-y-2.5">
              {phase.states.map((st) => {
                const pct = Math.min(100, Math.round((st.candidatos / maxStateCount) * 100));
                return (
                  <div key={st.code} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-white/90 text-[11px] truncate tracking-wide">
                        {st.label}
                      </span>
                      <span className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-full border ${st.candidatos > 0 ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-[#879391]'}`}>
                        {st.candidatos}
                      </span>
                    </div>
                    <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className="h-full rounded-full transition-all duration-500" 
                        style={{ width: `${st.candidatos > 0 ? Math.max(pct, 6) : 0}%`, backgroundColor: st.fill }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
