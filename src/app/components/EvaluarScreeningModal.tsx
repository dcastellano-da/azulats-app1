'use client';

import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  Check, 
  FileSearch, 
  Target, 
  ShieldAlert, 
  Database,
  ChevronRight
} from "lucide-react";
import { evaluarScreeningAction } from "@/actions/pipeline";
import { CriterioScreening, ResultadoScreeningItem } from "@/types/screening";

interface EvaluarScreeningModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: string;
  candidateName: string;
  busquedaName?: string;
  criteriosBusqueda?: CriterioScreening[];
  hasCv: boolean;
  onSuccess?: () => void;
}

const EVALUATION_STEPS = [
  {
    id: 1,
    title: "Extracción y Lectura del CV",
    description: "Gemini 2.5 Flash procesa el archivo PDF/Word buscando experiencia relevante.",
    icon: FileSearch
  },
  {
    id: 2,
    title: "Análisis de Concordancia Semántica",
    description: "Comparación contextual contra los criterios de evaluación de la posición.",
    icon: Target
  },
  {
    id: 3,
    title: "Evaluación Knockout y Fit Score",
    description: "Verificación de reglas excluyentes e índice de adecuación del candidato.",
    icon: ShieldAlert
  },
  {
    id: 4,
    title: "Consolidación de Evidencias (Prueba de Vida)",
    description: "Generación de citas textuales del CV y guardado en Firestore.",
    icon: Database
  }
];

export default function EvaluarScreeningModal({
  isOpen,
  onClose,
  pipelineId,
  candidateName,
  busquedaName,
  criteriosBusqueda = [],
  hasCv,
  onSuccess
}: EvaluarScreeningModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"idle" | "evaluating" | "success" | "error">("idle");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [evalResultData, setEvalResultData] = useState<any>(null);

  const stepIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const prevIsOpen = useRef(isOpen);

  // Reset modal internal state ONLY when transitioning from closed to open
  useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      setStep("idle");
      setActiveStepIndex(0);
      setErrorMessage(null);
      setEvalResultData(null);
      setLoading(false);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  if (!isOpen) return null;

  const hasCriterios = criteriosBusqueda && criteriosBusqueda.length > 0;

  const handleStartEvaluation = async () => {
    if (!hasCriterios || !hasCv) return;

    setLoading(true);
    setStep("evaluating");
    setActiveStepIndex(0);
    setErrorMessage(null);

    // Smooth step progress animation during async API call
    stepIntervalRef.current = setInterval(() => {
      setActiveStepIndex((prev) => (prev < 2 ? prev + 1 : prev));
    }, 900);

    try {
      const result = await evaluarScreeningAction(pipelineId);

      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);

      if (result.success) {
        setActiveStepIndex(3);
        setEvalResultData(result.data);
        setStep("success");
        setLoading(false);
        if (onSuccess) onSuccess();
      } else {
        setStep("error");
        setErrorMessage(result.message || "Error al procesar la evaluación con la IA.");
        setLoading(false);
      }
    } catch (err: any) {
      if (stepIntervalRef.current) clearInterval(stepIntervalRef.current);
      setStep("error");
      setErrorMessage(`Error de red al conectar con Gemini: ${err.message || err}`);
      setLoading(false);
    }
  };

  const handleFinish = () => {
    if (onSuccess) onSuccess();
    onClose();
  };

  // Helper stats from result data or criteria
  const resultadoList: ResultadoScreeningItem[] = 
    evalResultData?.resultado_screening || 
    evalResultData?.data?.resultado_screening || [];
  
  const fitScore: number = 
    typeof evalResultData?.fit_score_screening === "number" 
      ? evalResultData.fit_score_screening 
      : (typeof evalResultData?.data?.fit_score_screening === "number" ? evalResultData.data.fit_score_screening : 0);

  const tieneKnockout: boolean = 
    Boolean(evalResultData?.tiene_knockout ?? evalResultData?.data?.tiene_knockout ?? false);

  const totalSi = resultadoList.filter(r => r.evaluacion === "SI").length;
  const totalInferido = resultadoList.filter(r => r.evaluacion === "INFERIDO").length;
  const totalNo = resultadoList.filter(r => r.evaluacion === "NO").length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl overflow-hidden border border-white/15 bg-[#121517] rounded-3xl shadow-2xl space-y-5 p-6 text-white text-left max-h-[92vh] flex flex-col">
        
        {/* Header con Badge de ID de Pantalla/Modal */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#6bd8cb]/20 to-[#c4c1fb]/20 border border-[#6bd8cb]/30 text-[#6bd8cb] shadow-inner">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-white tracking-wide">
                  Evaluación de Screening con IA
                </h2>
                <span className="text-[10px] font-mono text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded-md border border-[#6bd8cb]/20 font-bold">
                  ID: M-SCR-01
                </span>
              </div>
              <div className="text-[11px] text-[#879391] space-y-0.5 mt-1">
                <p>
                  Candidato: <span className="text-[#c4c1fb] font-semibold">{candidateName}</span>
                </p>
                <p>
                  Búsqueda: <span className="text-[#6bd8cb] font-semibold">{busquedaName || "Búsqueda activa"}</span>
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-[#879391] hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="space-y-4 py-1 overflow-y-auto custom-scrollbar flex-1 pr-1">
          
          {/* Pre-flight Warnings */}
          {!hasCriterios && (
            <div className="flex gap-3 p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300">
              <AlertCircle className="w-5 h-5 shrink-0 text-amber-400" />
              <div>
                <p className="font-semibold text-amber-200">Sin Criterios de Screening</p>
                <p className="mt-0.5 leading-relaxed text-[11px]">
                  La búsqueda asociada no tiene criterios de descarte o evaluación configurados. Agrega criterios en la búsqueda antes de evaluar con la IA.
                </p>
              </div>
            </div>
          )}

          {!hasCv && (
            <div className="flex gap-3 p-3.5 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs text-red-300">
              <FileText className="w-5 h-5 shrink-0 text-red-400" />
              <div>
                <p className="font-semibold text-red-200">Sin CV Cargado</p>
                <p className="mt-0.5 leading-relaxed text-[11px]">
                  El candidato no tiene un archivo de currículum registrado en el sistema. Se requiere un CV (.pdf, .doc, .docx) para que Gemini analice las evidencias.
                </p>
              </div>
            </div>
          )}

          {/* VISTA 1: Pre-ejecución / Idle */}
          {hasCriterios && hasCv && step === "idle" && (
            <div className="space-y-4">
              <p className="text-xs text-[#c4c1fb] leading-relaxed">
                El motor inteligente procesará el archivo CV del candidato para analizar objetivamente su grado de coincidencia frente a los{" "}
                <span className="font-bold text-[#6bd8cb]">{criteriosBusqueda.length} criterios</span> de la posición.
              </p>

              {/* Detalle de Criterios de la Búsqueda */}
              <div className="space-y-2 pt-1">
                <span className="text-[10px] uppercase font-bold text-[#879391] tracking-wider block">
                  Detalle de Criterios a Evaluar ({criteriosBusqueda.length})
                </span>
                <div className="max-h-44 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {criteriosBusqueda.map((crit, idx) => (
                    <div key={crit.id || idx} className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-white font-medium leading-tight">
                          {idx + 1}. {crit.pregunta}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold shrink-0 ${
                          crit.tipo === "knockout" 
                            ? "bg-purple-500/20 text-purple-300 border border-purple-500/30" 
                            : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        }`}>
                          {crit.tipo === "knockout" ? "EXCLUYENTE" : `PESO: ${crit.peso} pts`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/10 text-[11px] space-y-2 text-[#879391]">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#6bd8cb]" />
                  <span>Gemini 2.5 Flash extraerá citas textuales ("Prueba de Vida").</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span>Asignación de estados: SÍ (100%), INFERIDO (50%) o NO (0%).</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  <span>Las reglas excluyentes (Knockout) no superadas activarán la bandera roja.</span>
                </div>
              </div>
            </div>
          )}

          {/* VISTA UNIFICADA: Avance en Tiempo Real (Stepper) + Resumen Final de Resultados */}
          {(step === "evaluating" || step === "success") && (
            <div className="space-y-5 py-1">
              
              {/* 1. SECCIÓN SUPERIOR: Avance en Tiempo Real (Stepper) */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-white flex items-center gap-2">
                    {step === "evaluating" ? (
                      <>
                        <Sparkles className="w-4 h-4 text-[#6bd8cb] animate-spin" />
                        Ejecutando Inferencia IA con Gemini 2.5 Flash...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        Proceso de Inferencia IA Finalizado (100%)
                      </>
                    )}
                  </span>
                  <span className="font-mono font-bold text-[#6bd8cb]">
                    {step === "success" ? "100%" : `${Math.round(((activeStepIndex + 1) / EVALUATION_STEPS.length) * 100)}%`}
                  </span>
                </div>

                {/* Barra de progreso animada */}
                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6bd8cb] to-[#c4c1fb] transition-all duration-500 ease-out"
                    style={{ width: step === "success" ? "100%" : `${((activeStepIndex + 1) / EVALUATION_STEPS.length) * 100}%` }}
                  />
                </div>

                {/* Pasos de ejecución con indicador visual */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  {EVALUATION_STEPS.map((s, idx) => {
                    const Icon = s.icon;
                    const isDone = step === "success" || idx < activeStepIndex;
                    const isCurrent = step === "evaluating" && idx === activeStepIndex;

                    return (
                      <div 
                        key={s.id} 
                        className={`p-2.5 rounded-xl border transition-all duration-300 flex items-center gap-2.5 ${
                          isCurrent 
                            ? "bg-[#6bd8cb]/10 border-[#6bd8cb]/40 text-[#6bd8cb]" 
                            : isDone 
                              ? "bg-white/[0.03] border-emerald-500/30 text-white" 
                              : "bg-white/[0.01] border-white/5 opacity-40 text-white/50"
                        }`}
                      >
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isDone 
                            ? "bg-emerald-500/20 text-emerald-400" 
                            : isCurrent 
                              ? "bg-[#6bd8cb]/20 text-[#6bd8cb]" 
                              : "bg-white/5 text-white/30"
                        }`}>
                          {isDone ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                        </div>
                        <div className="min-w-0 flex-1 text-left">
                          <p className="text-[11px] font-bold truncate">
                            Paso {s.id}: {s.title}
                          </p>
                          <span className="text-[9px] text-[#879391] block truncate">
                            {isDone ? "Completado" : isCurrent ? "En progreso..." : "Pendiente"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2. SECCIÓN INFERIOR: Resumen Final de Resultados (aparece al concluir la inferencia) */}
              {step === "success" && (
                <div className="space-y-4 animate-fadeIn pt-1">
                  
                  {/* Badge de resultado general y Fit Score */}
                  <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                    tieneKnockout 
                      ? "bg-rose-500/10 border-rose-500/30 text-rose-300" 
                      : "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                  }`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-xl ${tieneKnockout ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                        {tieneKnockout ? <ShieldAlert className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
                      </div>
                      <div>
                        <h3 className="text-xs font-extrabold uppercase tracking-wider">
                          {tieneKnockout ? "Alerta de Criterio Excluyente (Knockout)" : "Evaluación Finalizada con Éxito"}
                        </h3>
                        <p className="text-[11px] opacity-80 mt-0.5">
                          {tieneKnockout 
                            ? "El candidato incumple al menos 1 criterio excluyente configurado." 
                            : "El expediente y las evidencias se han consolidado correctamente."}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 pl-3">
                      <span className="text-[10px] uppercase font-bold text-white/50 block">Fit Score</span>
                      <span className="text-xl font-extrabold font-mono text-[#6bd8cb]">{fitScore}%</span>
                    </div>
                  </div>

                  {/* Tarjetas de Métricas Desglosadas */}
                  <div className="grid grid-cols-3 gap-3 text-center">
                    <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Cumplidos (SÍ)</span>
                      <span className="text-lg font-black text-emerald-300 mt-1 block font-mono">{totalSi}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                      <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Inferidos</span>
                      <span className="text-lg font-black text-amber-300 mt-1 block font-mono">{totalInferido}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                      <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">No Cumplidos</span>
                      <span className="text-lg font-black text-rose-300 mt-1 block font-mono">{totalNo}</span>
                    </div>
                  </div>

                  {/* Previsualización de Evidencias Textuales Extraídas ("Prueba de vida") */}
                  {resultadoList.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] uppercase font-bold text-[#879391] tracking-wider block">
                        Evidencias Extraídas del CV ("Prueba de Vida")
                      </span>
                      <div className="max-h-40 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {resultadoList.map((item, idx) => {
                          const critDef = criteriosBusqueda.find(c => c.id === item.id_criterio);
                          return (
                            <div key={item.id_criterio || idx} className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-1.5">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-white">
                                  {critDef?.pregunta || `Criterio ${idx + 1}`}
                                </span>
                                <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                  item.evaluacion === "SI" 
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" 
                                    : item.evaluacion === "INFERIDO" 
                                      ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                                      : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                                }`}>
                                  {item.evaluacion}
                                </span>
                              </div>
                              {item.evidencia_cv && (
                                <blockquote className="pl-2.5 border-l-2 border-[#6bd8cb]/50 text-[11px] text-[#879391] italic bg-white/[0.01] py-1">
                                  "{item.evidencia_cv}"
                                </blockquote>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* VISTA 3: Error State */}
          {step === "error" && (
            <div className="space-y-3 py-2">
              <div className="flex gap-3 p-4 rounded-2xl border border-red-500/30 bg-red-500/10 text-xs text-red-300">
                <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <p className="font-bold text-red-200">Error durante el proceso de inferencia</p>
                  <p className="mt-1 leading-relaxed text-[11px]">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 shrink-0">
          {step === "idle" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#879391] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStartEvaluation}
                disabled={!hasCriterios || !hasCv}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#6bd8cb] to-[#4eb8ab] text-[#121517] shadow-lg shadow-[#6bd8cb]/20 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Iniciar Inferencia IA</span>
              </button>
            </>
          )}

          {step === "evaluating" && (
            <span className="text-[11px] text-[#879391] animate-pulse font-mono">
              Analizando en tiempo real con Gemini...
            </span>
          )}

          {step === "success" && (
            <button
              type="button"
              onClick={handleFinish}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#6bd8cb] text-[#121517] hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#6bd8cb]/20"
            >
              <span>Ver Expediente Actualizado</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {step === "error" && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#879391] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="button"
                onClick={handleStartEvaluation}
                className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 text-[#121517] hover:bg-amber-400 transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar</span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
