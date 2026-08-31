'use client';

import React, { useState } from "react";
import { Sparkles, ChevronRight, AlertTriangle } from "lucide-react";
import ScreeningPanel from "@/app/components/ScreeningPanel";
import EvaluarScreeningModal from "@/app/components/EvaluarScreeningModal";
import type { CriterioScreening, ResultadoScreeningItem } from "@/types/screening";
import type { PipelineItem } from "@/actions/pipeline";

interface ScreeningAccordionSectionProps {
  pipelineItem: PipelineItem | null;
  criteriosBusqueda?: CriterioScreening[];
  candidateName: string;
  busquedaName?: string;
  hasCv: boolean;
  onRefresh?: () => void;
}

export default function ScreeningAccordionSection({
  pipelineItem,
  criteriosBusqueda = [],
  candidateName,
  busquedaName,
  hasCv,
  onRefresh
}: ScreeningAccordionSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);

  const pipelineId = pipelineItem?.id || "";

  // Extract screening results array from various possible object paths
  const resList: ResultadoScreeningItem[] = 
    pipelineItem?.resultado_screening || 
    (pipelineItem as any)?.resultadoScreening || 
    (pipelineItem as any)?.f1_descubrimiento?.resultado_screening || 
    [];

  // Effective criteria resolution
  const effectiveCriterios = (criteriosBusqueda && criteriosBusqueda.length > 0)
    ? criteriosBusqueda
    : resList.map((r: any, idx: number) => ({
        id: r.id_criterio || `crit-${idx}`,
        pregunta: r.pregunta || `Criterio de Evaluación ${idx + 1}`,
        tipo: (r.es_knockout ? "knockout" : "deseable") as "knockout" | "deseable",
        peso: r.puntaje_obtenido || 20
      }));

  const fitScore = 
    pipelineItem?.fit_score_screening ?? 
    (pipelineItem as any)?.fit_score ??
    (pipelineItem as any)?.f1_descubrimiento?.fit_score_screening ??
    0;

  const tieneKnockout = 
    pipelineItem?.tiene_knockout ?? 
    (pipelineItem as any)?.tieneKnockout ??
    (pipelineItem as any)?.f1_descubrimiento?.tiene_knockout ??
    false;

  const fechaModificacion = 
    pipelineItem?.fecha_modificacion_screening || 
    (pipelineItem as any)?.fecha_modificacion ||
    (pipelineItem as any)?.f1_descubrimiento?.fecha_modificacion_screening;

  const hasEvaluations = resList.length > 0;

  const handleModalSuccess = () => {
    setIsEvalModalOpen(false);
    if (onRefresh) {
      onRefresh();
    }
  };

  return (
    <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4 text-left relative overflow-hidden">
      {/* Decorative subtle background gradient */}
      <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-[#6bd8cb]/5 blur-3xl pointer-events-none" />

      {/* Accordion Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-3 text-left cursor-pointer group focus:outline-none"
        >
          <div className="p-2 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb] group-hover:bg-[#6bd8cb] group-hover:text-stone-950 transition-all shadow-sm">
            <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider group-hover:text-[#6bd8cb] transition-colors flex items-center gap-2 flex-wrap">
              <Sparkles className="w-4 h-4 text-[#6bd8cb]" />
              <span>Screening Inteligente IA (Fase 1 / P-DIS-02)</span>
              <span className="text-[9px] font-mono bg-white/5 text-[#879391] px-2 py-0.5 rounded-full border border-white/10">
                {isOpen ? "Ocultar" : "Ver Screening"}
              </span>
            </h3>
            <p className="text-[11px] text-[#879391]">
              Auditoría de Criterios Excluyentes y Deseables de Fase 1 con Gemini 2.5 Flash
            </p>
          </div>
        </button>

        {/* Collapsed view summary badges */}
        {!isOpen && (
          <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
            {hasEvaluations && (
              <div className="px-3 py-1 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/30 text-[#6bd8cb] text-xs font-bold font-mono">
                Fit Score: {fitScore} pts
              </div>
            )}
            {tieneKnockout && (
              <div className="px-2.5 py-1 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Knockout</span>
              </div>
            )}
            {fechaModificacion && (
              <span className="text-[10px] text-[#879391] font-mono bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
                {new Date(fechaModificacion).toLocaleDateString("es-ES")}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Expanded Accordion Body */}
      {isOpen && (
        <div className="pt-2 animate-fadeIn space-y-4">
          <ScreeningPanel
            pipelineId={pipelineId}
            criteriosBusqueda={effectiveCriterios}
            resultadoScreening={resList}
            fitScore={fitScore}
            tieneKnockout={tieneKnockout}
            fechaModificacion={fechaModificacion}
            onEvaluarClick={() => setIsEvalModalOpen(true)}
          />
        </div>
      )}

      {/* Modal de Inferencia IA de Screening */}
      {pipelineId && (
        <EvaluarScreeningModal
          isOpen={isEvalModalOpen}
          onClose={() => setIsEvalModalOpen(false)}
          pipelineId={pipelineId}
          candidateName={candidateName}
          busquedaName={busquedaName}
          criteriosBusqueda={effectiveCriterios}
          hasCv={hasCv}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
