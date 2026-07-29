'use client';

import React, { useState, useTransition } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, HelpCircle, XCircle, Quote, RefreshCw } from "lucide-react";
import { CriterioScreening, ResultadoScreeningItem } from "@/types/screening";
import { actualizarResultadoScreeningAction } from "@/actions/pipeline";

interface ScreeningPanelProps {
  pipelineId: string;
  criteriosBusqueda?: CriterioScreening[];
  resultadoScreening?: ResultadoScreeningItem[];
  fitScore?: number;
  tieneKnockout?: boolean;
  fechaModificacion?: string;
  onEvaluarClick: () => void;
}

export default function ScreeningPanel({
  pipelineId,
  criteriosBusqueda = [],
  resultadoScreening = [],
  fitScore = 0,
  tieneKnockout = false,
  fechaModificacion,
  onEvaluarClick
}: ScreeningPanelProps) {
  // Local optimistic state for instant UI feedback (Sugerencia C)
  const [localResultado, setLocalResultado] = useState<ResultadoScreeningItem[]>(resultadoScreening);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Sync props when parent updates without triggering infinite re-render loops
  const prevResultadoJson = React.useRef(JSON.stringify(resultadoScreening || []));

  React.useEffect(() => {
    if (resultadoScreening && resultadoScreening.length > 0) {
      const currentJson = JSON.stringify(resultadoScreening);
      if (prevResultadoJson.current !== currentJson) {
        prevResultadoJson.current = currentJson;
        setLocalResultado(resultadoScreening);
      }
    } else if (resultadoScreening) {
      setLocalResultado(resultadoScreening);
    }
  }, [resultadoScreening]);

  // Handle manual Human-in-the-Loop semaphore change
  const handleEvaluacionChange = (criterioId: string, nuevaEvaluacion: "SI" | "INFERIDO" | "NO") => {
    setUpdatingId(criterioId);

    // Build updated array optimistically
    const updatedArray = criteriosBusqueda.map((crit) => {
      const existing = localResultado.find((r) => r.id_criterio === crit.id);
      const isThisCrit = crit.id === criterioId;
      const targetEval = isThisCrit ? nuevaEvaluacion : (existing?.evaluacion || "NO");
      const isKnockout = crit.tipo === "knockout";

      let puntajeObtenido = 0;
      if (!isKnockout) {
        if (targetEval === "SI") puntajeObtenido = crit.peso;
        else if (targetEval === "INFERIDO") puntajeObtenido = Math.round(crit.peso / 2);
        else puntajeObtenido = 0;
      }

      return {
        id_criterio: crit.id,
        evaluacion: targetEval,
        evidencia_cv: existing?.evidencia_cv || (isThisCrit ? "Modificación manual por reclutador (Human-in-the-Loop)." : "Sin evidencia registrada."),
        es_knockout: isKnockout,
        puntaje_obtenido: puntajeObtenido
      };
    });

    // Optimistic UI update
    setLocalResultado(updatedArray);

    startTransition(async () => {
      try {
        await actualizarResultadoScreeningAction(pipelineId, updatedArray);
      } catch (error) {
        console.error("Error al actualizar resultado de screening manual:", error);
      } finally {
        setUpdatingId(null);
      }
    });
  };

  // Helper function for ultra-flexible criteria evaluation matching
  const findEvaluationForCriterion = (crit: CriterioScreening, idx: number): ResultadoScreeningItem | undefined => {
    if (!localResultado || localResultado.length === 0) return undefined;

    // 1. Match by exact ID
    let match = localResultado.find(
      (r) => r.id_criterio === crit.id || (r as any).criterio_id === crit.id || (r as any).id === crit.id
    );
    if (match) return match;

    // 2. Match by question text if present
    if (crit.pregunta) {
      match = localResultado.find(
        (r) => (r as any).pregunta && (r as any).pregunta.trim().toLowerCase() === crit.pregunta.trim().toLowerCase()
      );
      if (match) return match;
    }

    // 3. Fallback: match by index position
    if (idx < localResultado.length) {
      return localResultado[idx];
    }

    return undefined;
  };

  const hasEvaluations = (resultadoScreening && resultadoScreening.length > 0) || (localResultado && localResultado.length > 0);

  // Calculate local optimistic fit score & knockout status
  let calculatedScore = 0;
  let calculatedKnockout = false;

  criteriosBusqueda.forEach((crit, idx) => {
    const res = findEvaluationForCriterion(crit, idx);
    if (res) {
      if (crit.tipo === "knockout" && res.evaluacion === "NO") {
        calculatedKnockout = true;
      }
      if (crit.tipo === "deseable") {
        calculatedScore += res.puntaje_obtenido || 0;
      }
    }
  });

  const displayScore = hasEvaluations ? (fitScore > 0 ? fitScore : calculatedScore) : 0;
  const isKnockoutActive = tieneKnockout || calculatedKnockout;

  const [showDebugInfo, setShowDebugInfo] = useState(false);

  return (
    <div className="p-5 rounded-2xl bg-[#15181a] border border-white/10 shadow-xl space-y-4 text-white">
      {/* Header Panel */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-[#6bd8cb]/20 to-[#c4c1fb]/20 border border-[#6bd8cb]/30 text-[#6bd8cb]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-wide flex items-center gap-2">
              Screening Inteligente IA
              {isPending && <RefreshCw className="w-3.5 h-3.5 text-[#6bd8cb] animate-spin" />}
            </h3>
            <p className="text-[11px] text-[#879391]">
              {fechaModificacion
                ? `Última evaluación: ${new Date(fechaModificacion).toLocaleString()}`
                : "Auditoría de Criterios con Gemini 2.5 Flash"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Diagnostic Toggle Button */}
          <button
            type="button"
            onClick={() => setShowDebugInfo(!showDebugInfo)}
            title="Ver inspector de diagnóstico de datos REST / Firestore"
            className="p-1.5 rounded-lg border border-white/10 text-[10px] text-[#879391] hover:text-white hover:bg-white/5 font-mono cursor-pointer transition-all"
          >
            🐛 Debug
          </button>

          {/* Fit Score Badge */}
          {hasEvaluations && (
            <div className="px-3 py-1 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/30 text-[#6bd8cb] text-xs font-bold flex items-center gap-1.5">
              <span>Fit Score:</span>
              <span className="text-sm">{displayScore} pts</span>
            </div>
          )}

          {/* Botón Disparador Modal */}
          <button
            type="button"
            onClick={onEvaluarClick}
            disabled={isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#6bd8cb] to-[#4eb8ab] text-[#121517] shadow-md shadow-[#6bd8cb]/20 hover:brightness-110 transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{hasEvaluations ? "Re-evaluar con IA" : "Evaluar con IA"}</span>
          </button>
        </div>
      </div>

      {/* Widget de Diagnóstico en Tiempo Real */}
      {showDebugInfo && (
        <div className="p-3.5 rounded-xl bg-black/60 border border-cyan-500/30 text-[10px] font-mono space-y-1.5 text-cyan-200 animate-fadeIn">
          <div className="flex justify-between items-center font-bold border-b border-cyan-500/20 pb-1">
            <span>Inspector de Datos REST (P-DIS-02)</span>
            <span className="text-[9px] bg-cyan-500/20 px-1.5 py-0.5 rounded text-cyan-300">Live DB</span>
          </div>
          <p>Pipeline ID: <span className="text-white">{pipelineId}</span></p>
          <p>Criterios Búsqueda: <span className="text-white">{criteriosBusqueda.length}</span></p>
          <p>Resultados Recibidos DB: <span className="text-white">{resultadoScreening?.length || 0} ítems</span></p>
          <p>Fit Score DB: <span className="text-white">{fitScore}</span> | Knockout DB: <span className="text-white">{tieneKnockout ? "TRUE" : "FALSE"}</span></p>
          <div className="pt-1">
            <span className="opacity-70 block mb-0.5">Payload Crudo `resultado_screening`:</span>
            <pre className="p-2 rounded bg-black/80 text-[9px] text-emerald-400 overflow-x-auto max-h-28 custom-scrollbar">
              {JSON.stringify(resultadoScreening || [], null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* Alerta de Knockout Activo */}
      {isKnockoutActive && (
        <div className="flex items-center gap-3 p-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs animate-pulse">
          <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
          <div>
            <span className="font-bold uppercase tracking-wider text-[11px] text-red-400">
              Alerta Excluyente (Knockout)
            </span>
            <p className="text-[11px] text-red-200 mt-0.5">
              El candidato ha incumplido al menos un criterio excluyente. Revisar abajo y tomar la decisión final de mover a Descartado.
            </p>
          </div>
        </div>
      )}

      {/* Lista de Criterios o Estado Vacío */}
      {criteriosBusqueda.length === 0 ? (
        <div className="p-4 rounded-xl border border-dashed border-white/10 text-center text-xs text-[#879391]">
          No hay criterios de screening configurados en esta búsqueda.
        </div>
      ) : !hasEvaluations ? (
        <div className="p-5 rounded-xl bg-white/[0.02] border border-white/10 text-center space-y-2">
          <Sparkles className="w-6 h-6 text-[#6bd8cb] mx-auto opacity-60" />
          <p className="text-xs text-[#c4c1fb]">
            Esta postulación aún no ha sido evaluada con la IA.
          </p>
          <p className="text-[11px] text-[#879391]">
            Haz clic en <strong>"Evaluar con IA"</strong> para auditar los {criteriosBusqueda.length} criterios contra el CV.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {criteriosBusqueda.map((crit, idx) => {
            const res = findEvaluationForCriterion(crit, idx);
            const evaluacion = res?.evaluacion || "NO";
            const evidencia = res?.evidencia_cv || "Sin evidencia citada por la IA.";
            const isKnockoutFailed = crit.tipo === "knockout" && evaluacion === "NO";
            const isItemUpdating = updatingId === crit.id;

            return (
              <div
                key={crit.id || idx}
                className={`p-3.5 rounded-xl border transition-all space-y-2.5 ${
                  isKnockoutFailed
                    ? "bg-red-500/[0.08] border-red-500/30"
                    : "bg-white/[0.02] border-white/10 hover:border-white/20"
                }`}
              >
                {/* Pregunta & Badges */}
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2 max-w-[70%]">
                    <span className="text-[10px] font-bold text-[#c4c1fb] mt-0.5 shrink-0">
                      #{idx + 1}
                    </span>
                    <p className="text-xs font-medium text-white leading-snug">
                      {crit.pregunta}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {crit.tipo === "knockout" ? (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-red-500/20 text-red-400 border border-red-500/30">
                        Knockout
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/30">
                        +{crit.peso} pts
                      </span>
                    )}

                    {isItemUpdating && (
                      <RefreshCw className="w-3 h-3 text-[#6bd8cb] animate-spin" />
                    )}
                  </div>
                </div>

                {/* Semáforo Interactivo (Human-in-the-Loop + UI Optimista) */}
                <div className="flex items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-[#879391] mr-1 uppercase tracking-wider font-semibold">
                    Semáforo:
                  </span>

                  {/* SÍ */}
                  <button
                    type="button"
                    onClick={() => handleEvaluacionChange(crit.id, "SI")}
                    disabled={isPending}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                      evaluacion === "SI"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-105"
                        : "bg-white/5 text-[#879391] border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>SÍ</span>
                  </button>

                  {/* INFERIDO */}
                  <button
                    type="button"
                    onClick={() => handleEvaluacionChange(crit.id, "INFERIDO")}
                    disabled={isPending}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                      evaluacion === "INFERIDO"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/20 scale-105"
                        : "bg-white/5 text-[#879391] border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>INFERIDO ({crit.tipo === "deseable" ? Math.round(crit.peso / 2) : 0} pts)</span>
                  </button>

                  {/* NO */}
                  <button
                    type="button"
                    onClick={() => handleEvaluacionChange(crit.id, "NO")}
                    disabled={isPending}
                    className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all border ${
                      evaluacion === "NO"
                        ? "bg-red-500/20 text-red-400 border-red-500/40 shadow-sm shadow-red-500/20 scale-105"
                        : "bg-white/5 text-[#879391] border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>NO</span>
                  </button>
                </div>

                {/* Caja de Evidencia ("Prueba de Vida") */}
                <div className="p-2.5 rounded-lg bg-black/40 border border-white/5 text-[11px] flex items-start gap-2">
                  <Quote className="w-4 h-4 text-[#6bd8cb] shrink-0 mt-0.5 opacity-70" />
                  <div>
                    <span className="text-[10px] text-[#879391] font-bold uppercase tracking-wider block mb-0.5">
                      Evidencia del CV (Prueba de Vida):
                    </span>
                    <blockquote className="italic text-[#c4c1fb] leading-relaxed">
                      "{evidencia}"
                    </blockquote>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
