'use client';

import React, { useState, useTransition } from "react";
import { Sparkles, AlertTriangle, CheckCircle2, HelpCircle, XCircle, Quote, RefreshCw, Edit2, Save } from "lucide-react";
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
  // Accordion state: tracks which criteria have their evidence panel expanded
  const [expandedEvidencia, setExpandedEvidencia] = useState<Record<string, boolean>>({});
  // Inline evidence edit state
  const [editingEvidencia, setEditingEvidencia] = useState<Record<string, boolean>>({});
  const [editEvidenciaText, setEditEvidenciaText] = useState<Record<string, string>>({});
  const [savingEvidencia, setSavingEvidencia] = useState<Record<string, boolean>>({});

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

  // Handle inline evidence save
  const handleSaveEvidencia = async (criterioId: string, idx: number) => {
    const newText = editEvidenciaText[criterioId] ?? "";
    setSavingEvidencia(prev => ({ ...prev, [criterioId]: true }));

    const updatedArray = localResultado.map(r => {
      const matchId = r.id_criterio === criterioId || (r as any).criterio_id === criterioId || (r as any).id === criterioId;
      const matchIdx = !matchId && localResultado.indexOf(r) === idx;
      if (matchId || matchIdx) {
        return { ...r, evidencia_cv: newText };
      }
      return r;
    });

    // If no item matched, append one
    if (!updatedArray.find(r => r.id_criterio === criterioId)) {
      const crit = criteriosBusqueda.find(c => c.id === criterioId);
      if (crit) {
        updatedArray.push({
          id_criterio: criterioId,
          evaluacion: (localResultado[idx]?.evaluacion || "NO") as "SI" | "INFERIDO" | "NO",
          evidencia_cv: newText,
          es_knockout: crit.tipo === "knockout",
          puntaje_obtenido: localResultado[idx]?.puntaje_obtenido || 0
        });
      }
    }

    setLocalResultado(updatedArray);
    setEditingEvidencia(prev => ({ ...prev, [criterioId]: false }));

    try {
      await actualizarResultadoScreeningAction(pipelineId, updatedArray);
    } catch (error) {
      console.error("Error al guardar evidencia:", error);
    } finally {
      setSavingEvidencia(prev => ({ ...prev, [criterioId]: false }));
    }
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
                  <span className="text-[10px] text-[#879391] mr-1 uppercase tracking-wider font-semibold shrink-0">
                    Semáforo:
                  </span>

                  {/* SÍ */}
                  <button
                    type="button"
                    onClick={() => handleEvaluacionChange(crit.id, "SI")}
                    disabled={isPending}
                    className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-bold transition-all border flex-1 min-w-0 ${
                      evaluacion === "SI"
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-sm shadow-emerald-500/20 scale-105"
                        : "bg-white/5 text-[#879391] border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>SÍ</span>
                  </button>

                  {/* INFERIDO */}
                  <button
                    type="button"
                    onClick={() => handleEvaluacionChange(crit.id, "INFERIDO")}
                    disabled={isPending}
                    className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-bold transition-all border flex-1 min-w-0 ${
                      evaluacion === "INFERIDO"
                        ? "bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm shadow-amber-500/20 scale-105"
                        : "bg-white/5 text-[#879391] border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>INFERIDO</span>
                  </button>

                  {/* NO */}
                  <button
                    type="button"
                    onClick={() => handleEvaluacionChange(crit.id, "NO")}
                    disabled={isPending}
                    className={`flex items-center justify-center gap-1 py-1 rounded-lg text-[11px] font-bold transition-all border flex-1 min-w-0 ${
                      evaluacion === "NO"
                        ? "bg-red-500/20 text-red-400 border-red-500/40 shadow-sm shadow-red-500/20 scale-105"
                        : "bg-white/5 text-[#879391] border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>NO</span>
                  </button>
                </div>

                {/* Caja de Evidencia ("Prueba de Vida") — acordeón colapsable con edición inline */}
                {(() => {
                  const key = crit.id || String(idx);
                  const isExpanded = expandedEvidencia[key];
                  const isEditing = editingEvidencia[key];
                  const isSaving = savingEvidencia[key];
                  const currentText = isEditing
                    ? (editEvidenciaText[key] ?? evidencia)
                    : evidencia;

                  return (
                    <div className="rounded-lg border border-white/5 text-[11px] overflow-hidden">
                      {/* Accordion header */}
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedEvidencia(prev => ({
                            ...prev,
                            [key]: !prev[key]
                          }))
                        }
                        className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 bg-black/30 hover:bg-black/50 transition-colors cursor-pointer text-left"
                      >
                        <div className="flex items-center gap-1.5">
                          <Quote className="w-3.5 h-3.5 text-[#6bd8cb] shrink-0 opacity-70" />
                          <span className="text-[10px] text-[#879391] font-bold uppercase tracking-wider">
                            Evidencia del CV (Prueba de Vida)
                          </span>
                        </div>
                        <span
                          className={`text-[#879391] text-[10px] transition-transform duration-200 ${
                            isExpanded ? "rotate-180" : ""
                          }`}
                        >
                          ▾
                        </span>
                      </button>

                      {/* Expanded body */}
                      {isExpanded && (
                        <div className="px-2.5 py-2 bg-black/40 border-t border-white/5 space-y-2">
                          {isEditing ? (
                            <>
                              <textarea
                                value={currentText}
                                onChange={e =>
                                  setEditEvidenciaText(prev => ({
                                    ...prev,
                                    [key]: e.target.value
                                  }))
                                }
                                rows={4}
                                className="w-full bg-black/60 border border-[#6bd8cb]/30 rounded-lg px-2.5 py-2 text-[11px] text-[#c4c1fb] italic leading-relaxed resize-none focus:outline-none focus:border-[#6bd8cb]/60 placeholder:text-[#879391]/50 transition-colors"
                                placeholder="Escribe la evidencia del CV…"
                                autoFocus
                              />
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingEvidencia(prev => ({
                                      ...prev,
                                      [key]: false
                                    }))
                                  }
                                  className="px-2.5 py-1 rounded-lg text-[10px] font-bold text-[#879391] border border-white/10 hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                  Cancelar
                                </button>
                                <button
                                  type="button"
                                  disabled={isSaving}
                                  onClick={() => handleSaveEvidencia(crit.id, idx)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#6bd8cb] text-stone-950 hover:brightness-110 disabled:opacity-50 transition-all cursor-pointer"
                                >
                                  {isSaving
                                    ? <RefreshCw className="w-3 h-3 animate-spin" />
                                    : <Save className="w-3 h-3" />}
                                  {isSaving ? "Guardando…" : "Guardar"}
                                </button>
                              </div>
                            </>
                          ) : (
                            <div className="flex items-start gap-2">
                              <blockquote className="italic text-[#c4c1fb] leading-relaxed flex-1">
                                &ldquo;{currentText}&rdquo;
                              </blockquote>
                              <button
                                type="button"
                                title="Editar evidencia"
                                onClick={() => {
                                  setEditEvidenciaText(prev => ({
                                    ...prev,
                                    [key]: evidencia
                                  }));
                                  setEditingEvidencia(prev => ({
                                    ...prev,
                                    [key]: true
                                  }));
                                }}
                                className="shrink-0 p-1 rounded-md text-[#879391] hover:text-[#6bd8cb] hover:bg-white/5 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
