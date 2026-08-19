'use client';

import React, { useState, useEffect, useRef, useTransition } from "react";
import { 
  Sparkles as SparklesIcon, 
  X as XIcon, 
  AlertCircle as AlertCircleIcon, 
  AlertTriangle as AlertTriangleIcon,
  CheckCircle2 as CheckCircle2Icon, 
  RefreshCw as RefreshCwIcon, 
  FileText as FileTextIcon, 
  UploadCloud as UploadCloudIcon,
  FileCheck as FileCheckIcon,
  Save as SaveIcon,
  Check as CheckIcon,
  ArrowRight as ArrowRightIcon,
  ShieldCheck as ShieldCheckIcon,
  Building2 as Building2Icon,
  Clock as ClockIcon,
  DollarSign as DollarSignIcon,
  Plus as PlusIcon,
  Trash2 as Trash2Icon
} from "lucide-react";
import { analizarTranscripcionAction, actualizarInformeEntrevistaAction } from "@/actions/pipeline";
import type { InformeEntrevistaIA } from "@/types/screening";

interface AnalizarTranscripcionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pipelineId: string;
  candidateName: string;
  currentState?: string;
  initialInforme?: InformeEntrevistaIA | null;
  onSuccess?: (informe: InformeEntrevistaIA) => void;
}

export default function AnalizarTranscripcionModal({
  isOpen,
  onClose,
  pipelineId,
  candidateName,
  currentState = "05_screening",
  initialInforme,
  onSuccess
}: AnalizarTranscripcionModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<"upload" | "processing" | "review" | "error">("upload");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Editable Form State (Human-in-the-Loop)
  const [formData, setFormData] = useState<InformeEntrevistaIA>({
    experiencia_consolidada: "",
    alineacion_motivadores: "",
    pretension_economica_condiciones: {
      pretension_salarial: "",
      disponibilidad: "",
      modalidad_preferida: ""
    },
    proximos_pasos: [],
    auditoria_veracidad: {
      inconsistencias_detectadas: [],
      confirmaciones_fortalezas: []
    }
  });

  // Action item & Audit write-in helpers
  const [newProximoPaso, setNewProximoPaso] = useState("");
  const [newInconsistencia, setNewInconsistencia] = useState("");
  const [newFortaleza, setNewFortaleza] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialInforme && (initialInforme.experiencia_consolidada || initialInforme.pretension_economica_condiciones)) {
        setFormData(normalizeInforme(initialInforme));
        setStep("review");
      } else {
        setStep("upload");
      }
      setSelectedFile(null);
      setErrorMessage(null);
      setLoading(false);
    }
  }, [isOpen, initialInforme]);

  if (!isOpen) return null;

  const isStateWarning = !(
    currentState.toLowerCase().includes("05") || 
    currentState.toLowerCase().includes("screening")
  );

  function normalizeInforme(inf: InformeEntrevistaIA): InformeEntrevistaIA {
    return {
      experiencia_consolidada: typeof inf.experiencia_consolidada === "string"
        ? inf.experiencia_consolidada
        : (inf.experiencia_consolidada?.resumen_trayectoria || ""),
      alineacion_motivadores: typeof inf.alineacion_motivadores === "string"
        ? inf.alineacion_motivadores
        : (inf.alineacion_motivadores?.encaje_cultural || ""),
      pretension_economica_condiciones: {
        pretension_salarial: inf.pretension_economica_condiciones?.pretension_salarial || "",
        disponibilidad: inf.pretension_economica_condiciones?.disponibilidad || "",
        modalidad_preferida: inf.pretension_economica_condiciones?.modalidad_preferida || ""
      },
      proximos_pasos: Array.isArray(inf.proximos_pasos) ? inf.proximos_pasos : [],
      auditoria_veracidad: {
        inconsistencias_detectadas: Array.isArray(inf.auditoria_veracidad?.inconsistencias_detectadas) 
          ? inf.auditoria_veracidad.inconsistencias_detectadas 
          : [],
        confirmaciones_fortalezas: Array.isArray(inf.auditoria_veracidad?.confirmaciones_fortalezas) 
          ? inf.auditoria_veracidad.confirmaciones_fortalezas 
          : []
      },
      fecha_analisis: inf.fecha_analisis || new Date().toISOString()
    };
  }

  const validateAndSetFile = (file: File) => {
    setErrorMessage(null);
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (!validTypes.includes(file.type) && !["pdf", "doc", "docx", "txt"].includes(ext || "")) {
      setErrorMessage("Formato no permitido. Solo se aceptan archivos PDF, DOC, DOCX o TXT.");
      return false;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("El archivo excede el límite máximo de peso permitido (5MB).");
      return false;
    }

    setSelectedFile(file);
    return true;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const handleUploadAndAnalyze = async () => {
    if (!selectedFile) return;

    setLoading(true);
    setStep("processing");
    setErrorMessage(null);

    try {
      const data = new FormData();
      data.append("transcripcion", selectedFile);

      const result = await analizarTranscripcionAction(pipelineId, data);

      if (result.success && result.data) {
        let extractedInforme: InformeEntrevistaIA | null = null;
        if (result.data.f2_evaluacion?.informe_entrevista_ia) {
          extractedInforme = result.data.f2_evaluacion.informe_entrevista_ia;
        } else if (result.data.informe_entrevista_ia) {
          extractedInforme = result.data.informe_entrevista_ia;
        } else if (typeof result.data === "object" && result.data.pretension_economica_condiciones) {
          extractedInforme = result.data;
        }

        if (extractedInforme) {
          const normalized = normalizeInforme(extractedInforme);
          setFormData(normalized);
          setStep("review");
          if (onSuccess) onSuccess(normalized);
        } else {
          setStep("error");
          setErrorMessage("No se pudo estructurar el informe devuelto por la IA. Revisa el documento de transcripción.");
        }
      } else {
        setStep("error");
        setErrorMessage(result.message || "Ocurrió un error al analizar la transcripción con la IA.");
      }
    } catch (err: any) {
      setStep("error");
      setErrorMessage(`Error de red o timeout al procesar el documento: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveHumanInTheLoop = () => {
    setLoading(true);
    startTransition(async () => {
      try {
        const payload: InformeEntrevistaIA = {
          ...formData,
          fecha_analisis: new Date().toISOString()
        };
        const res = await actualizarInformeEntrevistaAction(pipelineId, payload);
        if (res.success) {
          if (onSuccess) onSuccess(payload);
          onClose();
        } else {
          setErrorMessage(res.message || "Error al guardar los cambios en la base de datos.");
        }
      } catch (err: any) {
        setErrorMessage(`Error al persistir cambios: ${err.message || err}`);
      } finally {
        setLoading(false);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl overflow-hidden border border-white/15 bg-[#121517] rounded-3xl shadow-2xl space-y-5 p-6 text-white text-left max-h-[92vh] flex flex-col">
        
        {/* Header con ID visible M-TRN-01 */}
        <div className="flex items-center justify-between pb-3.5 border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-br from-[#6bd8cb]/20 to-[#c4c1fb]/20 border border-[#6bd8cb]/30 text-[#6bd8cb] shadow-inner">
              <SparklesIcon className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-extrabold text-white tracking-wide">
                  Analizar Transcripción de Screening
                </h2>
                <span className="text-[10px] font-mono text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded-md border border-[#6bd8cb]/20 font-bold select-all cursor-help" title="ID de pantalla / modal">
                  ID: M-TRN-01
                </span>
              </div>
              <p className="text-[11px] text-[#879391] mt-0.5">
                Candidato: <span className="text-[#c4c1fb] font-semibold">{candidateName}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-xl text-[#879391] hover:text-white hover:bg-white/10 transition-all disabled:opacity-30 cursor-pointer"
          >
            <XIcon className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Modal Content Scrollable */}
        <div className="space-y-4 py-1 overflow-y-auto custom-scrollbar flex-1 pr-1">

          {/* Warning Banner if candidate is not in 05_screening */}
          {isStateWarning && (
            <div className="flex gap-3 p-3.5 rounded-2xl border border-amber-500/30 bg-amber-500/10 text-xs text-amber-300 animate-fadeIn">
              <AlertTriangleIcon className="w-5 h-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <p className="font-bold text-amber-200">Advertencia de Estado en Pipeline</p>
                <p className="mt-0.5 leading-relaxed text-[11px]">
                  El postulante se encuentra actualmente en la fase <strong className="text-white">"{currentState}"</strong>, en lugar de <strong className="text-[#6bd8cb]">"05 - Screening / Entrevista Inicial"</strong>. Puedes analizar la transcripción de todos modos, pero se recomienda verificar la coherencia del estado.
                </p>
              </div>
            </div>
          )}

          {/* Banner de Errores explicito */}
          {errorMessage && (
            <div className="flex gap-3 p-3.5 rounded-2xl border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300 animate-fadeIn">
              <AlertCircleIcon className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
              <div>
                <p className="font-bold text-rose-200">Error durante la operación</p>
                <p className="mt-0.5 leading-relaxed text-[11px]">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* STEP 1: UPLOAD FILE */}
          {step === "upload" && (
            <div className="space-y-4">
              <p className="text-xs text-[#c4c1fb] leading-relaxed">
                Sube el documento de transcripción de la llamada o reunión (.pdf, .doc, .docx, .txt hasta 5MB). El backend procesará el texto en memoria con Gemini 2.5 Flash y descartará el archivo binario tras la inferencia.
              </p>

              {/* Drag and Drop Box */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 border-2 border-dashed rounded-3xl text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                  dragActive
                    ? "border-[#6bd8cb] bg-[#6bd8cb]/10"
                    : selectedFile
                      ? "border-emerald-500/40 bg-emerald-500/5"
                      : "border-white/15 bg-white/[0.02] hover:border-white/30 hover:bg-white/[0.04]"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                      <FileCheckIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">{selectedFile.name}</p>
                      <p className="text-[10px] text-[#879391] mt-0.5">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Haz clic para cambiar de archivo
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-[#6bd8cb]/10 text-[#6bd8cb] flex items-center justify-center border border-[#6bd8cb]/20">
                      <UploadCloudIcon className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">Arrastra la transcripción aquí o haz clic para explorar</p>
                      <p className="text-[10px] text-[#879391] mt-0.5">Formatos admitidos: PDF, DOC, DOCX, TXT (Máx. 5MB)</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: PROCESSING ANIMATION */}
          {step === "processing" && (
            <div className="p-8 text-center space-y-4 border border-white/10 rounded-3xl bg-white/[0.02] animate-fadeIn">
              <div className="w-12 h-12 rounded-2xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/30 text-[#6bd8cb] flex items-center justify-center mx-auto">
                <RefreshCwIcon className="w-6 h-6 animate-spin" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white">Sintetizando entrevista con Gemini 2.5 Flash</h3>
                <p className="text-xs text-[#879391]">
                  Triangulando transcripción de llamada con el CV del postulante y los criterios de la búsqueda en memoria RAM...
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: REVIEW & EDIT (Human-in-the-Loop) */}
          {step === "review" && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-3.5 rounded-2xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/25 text-xs text-[#6bd8cb] flex items-center justify-between">
                <span className="font-bold flex items-center gap-2">
                  <SparklesIcon className="w-4 h-4" />
                  Informe Generado por IA — Human-in-the-Loop (Revisa y Edita)
                </span>
                <button
                  type="button"
                  onClick={() => setStep("upload")}
                  className="text-[10px] underline hover:text-white cursor-pointer font-semibold"
                >
                  Volver a cargar transcripción
                </button>
              </div>

              {/* Form Block 1: Experiencia Consolidada */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-bold text-[#879391] block">
                  Experiencia Consolidada (Hitos y Trayectoria Validada)
                </label>
                <textarea
                  rows={3}
                  value={typeof formData.experiencia_consolidada === "string" ? formData.experiencia_consolidada : JSON.stringify(formData.experiencia_consolidada)}
                  onChange={(e) => setFormData(prev => ({ ...prev, experiencia_consolidada: e.target.value }))}
                  placeholder="Resumen de trayectoria real y herramientas validadas en la entrevista..."
                  className="w-full bg-[#15181a] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#6bd8cb] resize-none leading-relaxed"
                />
              </div>

              {/* Form Block 2: Alineación y Motivadores */}
              <div className="space-y-1.5 text-left">
                <label className="text-[10px] uppercase font-bold text-[#879391] block">
                  Alineación y Motivadores ("Qué está buscando")
                </label>
                <textarea
                  rows={2}
                  value={typeof formData.alineacion_motivadores === "string" ? formData.alineacion_motivadores : JSON.stringify(formData.alineacion_motivadores)}
                  onChange={(e) => setFormData(prev => ({ ...prev, alineacion_motivadores: e.target.value }))}
                  placeholder="Encaje cultural, motivadores de cambio, clima laboral preferido..."
                  className="w-full bg-[#15181a] border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#6bd8cb] resize-none leading-relaxed"
                />
              </div>

              {/* Form Block 3: Pretensión Económica y Condiciones */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3 text-left">
                <span className="text-[10px] uppercase font-bold text-[#c4c1fb] tracking-wider block flex items-center gap-1.5">
                  <DollarSignIcon className="w-3.5 h-3.5 text-[#6bd8cb]" />
                  Pretensión Económica y Condiciones
                </span>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-[#879391]">Banda Salarial</label>
                    <input
                      type="text"
                      value={formData.pretension_economica_condiciones?.pretension_salarial || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pretension_economica_condiciones: {
                          ...prev.pretension_economica_condiciones,
                          pretension_salarial: e.target.value
                        }
                      }))}
                      placeholder="Ej: 4.500 USD brutos/mes"
                      className="w-full bg-[#101415] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-[#879391]">Disponibilidad</label>
                    <input
                      type="text"
                      value={formData.pretension_economica_condiciones?.disponibilidad || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pretension_economica_condiciones: {
                          ...prev.pretension_economica_condiciones,
                          disponibilidad: e.target.value
                        }
                      }))}
                      placeholder="Ej: Inmediata / Preaviso 2 sem."
                      className="w-full bg-[#101415] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] uppercase font-bold text-[#879391]">Modalidad Preferida</label>
                    <input
                      type="text"
                      value={formData.pretension_economica_condiciones?.modalidad_preferida || ""}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        pretension_economica_condiciones: {
                          ...prev.pretension_economica_condiciones,
                          modalidad_preferida: e.target.value
                        }
                      }))}
                      placeholder="Ej: Remoto / Híbrido"
                      className="w-full bg-[#101415] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb]"
                    />
                  </div>
                </div>
              </div>

              {/* Form Block 4: Auditoría de Veracidad */}
              <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3 text-left">
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider block flex items-center gap-1.5">
                  <ShieldCheckIcon className="w-3.5 h-3.5 text-amber-400" />
                  Auditoría de Veracidad (Cruce Transcripción vs CV)
                </span>

                {/* Inconsistencias list */}
                <div className="space-y-2">
                  <label className="text-[9px] uppercase font-bold text-rose-300 block">
                    Inconsistencias Detectadas
                  </label>
                  {(formData.auditoria_veracidad?.inconsistencias_detectadas || []).map((inc, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-200">
                      <span>• {inc}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          auditoria_veracidad: {
                            ...prev.auditoria_veracidad,
                            inconsistencias_detectadas: (prev.auditoria_veracidad?.inconsistencias_detectadas || []).filter((_, idx) => idx !== i)
                          }
                        }))}
                        className="text-rose-400 hover:text-white p-1"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newInconsistencia}
                      onChange={(e) => setNewInconsistencia(e.target.value)}
                      placeholder="Escribir nueva inconsistencia..."
                      className="w-full bg-[#101415] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-rose-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newInconsistencia.trim()) return;
                        setFormData(prev => ({
                          ...prev,
                          auditoria_veracidad: {
                            ...prev.auditoria_veracidad,
                            inconsistencias_detectadas: [...(prev.auditoria_veracidad?.inconsistencias_detectadas || []), newInconsistencia.trim()]
                          }
                        }));
                        setNewInconsistencia("");
                      }}
                      className="px-3 py-2 bg-rose-500/20 border border-rose-500/30 text-rose-300 rounded-xl text-xs font-bold hover:bg-rose-500 hover:text-stone-950"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Fortalezas confirmadas list */}
                <div className="space-y-2 pt-2">
                  <label className="text-[9px] uppercase font-bold text-emerald-300 block">
                    Confirmaciones / Fortalezas Validadas
                  </label>
                  {(formData.auditoria_veracidad?.confirmaciones_fortalezas || []).map((fort, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-200">
                      <span>• {fort}</span>
                      <button
                        type="button"
                        onClick={() => setFormData(prev => ({
                          ...prev,
                          auditoria_veracidad: {
                            ...prev.auditoria_veracidad,
                            confirmaciones_fortalezas: (prev.auditoria_veracidad?.confirmaciones_fortalezas || []).filter((_, idx) => idx !== i)
                          }
                        }))}
                        className="text-emerald-400 hover:text-white p-1"
                      >
                        <Trash2Icon className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFortaleza}
                      onChange={(e) => setNewFortaleza(e.target.value)}
                      placeholder="Escribir fortaleza validada..."
                      className="w-full bg-[#101415] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-400"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newFortaleza.trim()) return;
                        setFormData(prev => ({
                          ...prev,
                          auditoria_veracidad: {
                            ...prev.auditoria_veracidad,
                            confirmaciones_fortalezas: [...(prev.auditoria_veracidad?.confirmaciones_fortalezas || []), newFortaleza.trim()]
                          }
                        }));
                        setNewFortaleza("");
                      }}
                      className="px-3 py-2 bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 rounded-xl text-xs font-bold hover:bg-emerald-500 hover:text-stone-950"
                    >
                      <PlusIcon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>

              {/* Form Block 5: Próximos Pasos */}
              <div className="space-y-2 text-left">
                <label className="text-[10px] uppercase font-bold text-[#879391] block">
                  Próximos Pasos (Action Items)
                </label>
                {(formData.proximos_pasos || []).map((paso, i) => (
                  <div key={i} className="flex items-center justify-between gap-2 p-2 bg-white/5 border border-white/10 rounded-xl text-xs text-white">
                    <span>{i + 1}. {paso}</span>
                    <button
                      type="button"
                      onClick={() => setFormData(prev => ({
                        ...prev,
                        proximos_pasos: (prev.proximos_pasos || []).filter((_, idx) => idx !== i)
                      }))}
                      className="text-white/40 hover:text-rose-400 p-1"
                    >
                      <Trash2Icon className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newProximoPaso}
                    onChange={(e) => setNewProximoPaso(e.target.value)}
                    placeholder="Agregar acción o tarea de seguimiento..."
                    className="w-full bg-[#15181a] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newProximoPaso.trim()) return;
                      setFormData(prev => ({
                        ...prev,
                        proximos_pasos: [...(prev.proximos_pasos || []), newProximoPaso.trim()]
                      }));
                      setNewProximoPaso("");
                    }}
                    className="px-4 py-2.5 bg-[#6bd8cb]/20 border border-[#6bd8cb]/30 text-[#6bd8cb] rounded-xl text-xs font-bold hover:bg-[#6bd8cb] hover:text-stone-950"
                  >
                    <PlusIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 shrink-0">
          {step === "upload" && (
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
                onClick={handleUploadAndAnalyze}
                disabled={!selectedFile || loading}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#6bd8cb] to-[#4eb8ab] text-[#121517] shadow-lg shadow-[#6bd8cb]/20 hover:brightness-110 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <SparklesIcon className="w-4 h-4" />
                <span>Analizar con IA</span>
              </button>
            </>
          )}

          {step === "processing" && (
            <span className="text-[11px] text-[#879391] animate-pulse font-mono">
              Procesando en RAM con Gemini 2.5 Flash...
            </span>
          )}

          {(step === "review" || step === "error") && (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-[#879391] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cerrar
              </button>
              {step === "review" && (
                <button
                  type="button"
                  onClick={handleSaveHumanInTheLoop}
                  disabled={loading || isPending}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#6bd8cb] text-[#121517] hover:brightness-110 transition-all cursor-pointer shadow-lg shadow-[#6bd8cb]/20 disabled:opacity-50"
                >
                  {isPending || loading ? (
                    <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  ) : (
                    <SaveIcon className="w-4 h-4" />
                  )}
                  <span>{isPending || loading ? "Guardando..." : "Confirmar e Integrar al Expediente"}</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
