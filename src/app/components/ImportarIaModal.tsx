'use client';

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  X, 
  Upload, 
  FileText, 
  Trash2, 
  AlertCircle, 
  Sparkles, 
  CheckCircle2, 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  RefreshCw, 
  FileCheck,
  Check,
  Briefcase,
  FileEdit,
  Share2
} from "lucide-react";
import { importarCandidatoIA_API, actualizarCandidatoAPI, getCandidatosAPI, Candidato } from "@/actions/candidatos";
import { crearPipelineAPI, actualizarPipelineAPI } from "@/actions/pipeline";
import { getBusquedasAPI } from "@/actions/busquedas";
import EvaluarScreeningModal from "./EvaluarScreeningModal";
import type { CriterioScreening } from "@/types/screening";

export interface SearchOption {
  id: string;
  client?: string;
  role?: string;
  perfil_busqueda?: string;
  cliente?: string;
  codigo_busqueda?: string;
  code?: string;
  criterios_screening?: CriterioScreening[];
}

export interface ImportarIaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (nombreCompleto: string, candidateData?: Partial<Candidato> | null, selectedSearchId?: string) => void;
  onCandidateCreated?: (nombreCompleto: string, candidateData?: Partial<Candidato> | null, selectedSearchId?: string) => void;
  mode?: "talento" | "descubrimiento";
  searches?: SearchOption[];
  defaultSearchId?: string;
  targetEstadoRevision?: "Pendiente" | "Revisado" | "Descartado" | "Seleccionado";
}

type ModalStepState = "idle" | "processing" | "result" | "error";

interface ProcessingStep {
  title: string;
  subtitle: string;
}

const PROCESSING_STEPS: ProcessingStep[] = [
  {
    title: "1. Lectura y validación de documento",
    subtitle: "Comprobando formato y preparando el archivo para procesamiento"
  },
  {
    title: "2. Inferencia y análisis con IA (Gemini)",
    subtitle: "Extrayendo contacto, historial laboral, habilidades e idiomas"
  },
  {
    title: "3. Sincronización de perfil y asignación de estado",
    subtitle: "Estructurando ficha, guardando estado y vinculando a la búsqueda activa"
  }
];

const DEFAULT_SEARCHES: SearchOption[] = [];

export default function ImportarIaModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  onCandidateCreated,
  mode = "talento",
  searches = DEFAULT_SEARCHES,
  defaultSearchId,
  targetEstadoRevision
}: ImportarIaModalProps) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notasText, setNotasText] = useState("");
  const [selectedSearchId, setSelectedSearchId] = useState<string>("");
  const [canalIngreso, setCanalIngreso] = useState<string>("");
  const [existingChannels, setExistingChannels] = useState<string[]>([
    "Headhunting",
    "LinkedIn",
    "Referido",
    "InfoJob",
    "Otros"
  ]);
  const [isCustomChannel, setIsCustomChannel] = useState(false);
  
  // Step visualization state
  const [stepState, setStepState] = useState<ModalStepState>("idle");
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);
  const [extractedCandidato, setExtractedCandidato] = useState<Partial<Candidato> | null>(null);

  // Auto-screening & created pipeline state
  const [autoScreeningEnabled, setAutoScreeningEnabled] = useState(false);
  const [createdPipelineId, setCreatedPipelineId] = useState<string>("");
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [evalModalData, setEvalModalData] = useState<{
    pipelineId: string;
    candidateName: string;
    busquedaName?: string;
    criteriosBusqueda?: CriterioScreening[];
    hasCv: boolean;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasLoadedChannelsRef = useRef(false);

  // Initialize selected search ID & auto-screening preference when modal opens
  useEffect(() => {
    if (isOpen) {
      const storageKeyAuto = mode === "descubrimiento" ? "descubrimiento_auto_screening_enabled" : "talento_auto_screening_enabled";
      const savedAutoScreening = localStorage.getItem(storageKeyAuto);
      if (savedAutoScreening !== null) {
        setAutoScreeningEnabled(savedAutoScreening === "true");
      }

      const storageKeySearch = mode === "descubrimiento" ? "descubrimiento_last_selected_search_id" : "talento_last_selected_search_id";
      const savedSearchId = localStorage.getItem(storageKeySearch);
      if (savedSearchId && searches.some(s => (s.id || s.code) === savedSearchId)) {
        setSelectedSearchId(savedSearchId);
      } else if (defaultSearchId) {
        setSelectedSearchId(defaultSearchId);
      } else if (searches.length > 0) {
        setSelectedSearchId(searches[0].id);
      }
    }
  }, [isOpen, defaultSearchId, searches, mode]);

  const handleSelectSearchId = (id: string) => {
    setSelectedSearchId(id);
    if (id) {
      const storageKeySearch = mode === "descubrimiento" ? "descubrimiento_last_selected_search_id" : "talento_last_selected_search_id";
      localStorage.setItem(storageKeySearch, id);
    }
  };

  const handleToggleAutoScreening = (enabled: boolean) => {
    setAutoScreeningEnabled(enabled);
    const storageKeyAuto = mode === "descubrimiento" ? "descubrimiento_auto_screening_enabled" : "talento_auto_screening_enabled";
    localStorage.setItem(storageKeyAuto, String(enabled));
  };

  const hasExistingScreening = (cand: Partial<Candidato> | null): boolean => {
    if (!cand) return false;
    const c = cand as any;
    if (Array.isArray(c.resultado_screening) && c.resultado_screening.length > 0) return true;
    if (typeof c.fit_score_screening === "number" || typeof c.fit_score === "number") return true;
    if (c.tiene_screening === true || c.screening_completado === true) return true;
    if (c.fecha_modificacion_screening) return true;
    return false;
  };

  // Load existing channels dynamically from DB ONCE when modal is opened
  useEffect(() => {
    if (isOpen && !hasLoadedChannelsRef.current) {
      hasLoadedChannelsRef.current = true;
      getCandidatosAPI().then((res) => {
        if (res.success && res.data) {
          const defaults = ["Headhunting", "LinkedIn", "Referido", "InfoJob", "Otros"];
          const dbChannels = res.data
            .map((c: Candidato) => c.canal_ingreso)
            .filter((ch: string | null | undefined): ch is string => Boolean(ch && ch.trim()));
          const uniqueChannels = Array.from(new Set([...defaults, ...dbChannels]));
          setExistingChannels(uniqueChannels);
        }
      }).catch(err => {
        console.warn("Error loading channels in ImportarIaModal:", err);
      });
    }

    if (!isOpen) {
      hasLoadedChannelsRef.current = false;
    }
  }, [isOpen]);

  const resetState = () => {
    hasLoadedChannelsRef.current = false;
    setFile(null);
    setFileError(null);
    setErrorMessage(null);
    setNotasText("");
    setCanalIngreso("");
    setIsCustomChannel(false);
    setStepState("idle");
    setCurrentStepIndex(0);
    setProgressPercent(0);
    setExtractedCandidato(null);
    setCreatedPipelineId("");
    if (searches.length > 0) {
      setSelectedSearchId(defaultSearchId || searches[0].id);
    } else {
      setSelectedSearchId("");
    }
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
  };

  const handleClose = () => {
    if (stepState === "processing") return;
    
    // If we finished successfully and user closes modal, trigger onSuccess
    if (stepState === "result" && extractedCandidato?.nombre_completo) {
      onSuccess(extractedCandidato.nombre_completo, extractedCandidato, selectedSearchId);
    }
    
    resetState();
    onClose();
  };

  // Prevent background scroll when opened
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const validateFile = (selected?: File) => {
    if (!selected) return;

    if (selected.size > 5 * 1024 * 1024) {
      setFile(null);
      setFileError("El archivo supera el tamaño máximo permitido de 5MB.");
      return;
    }

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ];
    const allowedExtensions = /\.(pdf|doc|docx)$/i;

    if (!allowedTypes.includes(selected.type) && !allowedExtensions.test(selected.name)) {
      setFile(null);
      setFileError("Formato de archivo inválido. Solo se admiten formatos PDF, DOC o DOCX.");
      return;
    }

    setFile(selected);
    setFileError(null);
    setErrorMessage(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    validateFile(selected);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (stepState === "idle" && e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const removeFile = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFile(null);
    setFileError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    if (stepState === "idle") {
      fileInputRef.current?.click();
    }
  };

  const startStepProgressAnimation = () => {
    setCurrentStepIndex(0);
    setProgressPercent(15);

    let currentP = 15;
    let stepIdx = 0;

    progressTimerRef.current = setInterval(() => {
      if (stepIdx === 0 && currentP < 35) {
        currentP += 5;
      } else if (stepIdx === 0 && currentP >= 35) {
        stepIdx = 1;
        setCurrentStepIndex(1);
        currentP = 40;
      } else if (stepIdx === 1 && currentP < 80) {
        currentP += 4;
      } else if (stepIdx === 1 && currentP >= 80) {
        stepIdx = 2;
        setCurrentStepIndex(2);
        currentP = 85;
      } else if (stepIdx === 2 && currentP < 95) {
        currentP += 1;
      }
      setProgressPercent(Math.min(currentP, 95));
    }, 450);
  };

  const stopStepProgressAnimation = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
  };

  const handleProcess = async () => {
    if (!file) {
      setErrorMessage("Por favor, selecciona un currículum para procesar.");
      return;
    }

    if ((mode === "descubrimiento" || searches.length > 0) && !selectedSearchId) {
      setErrorMessage("Por favor, selecciona la Búsqueda Activa a la que se asociará el talento.");
      return;
    }

    setStepState("processing");
    setErrorMessage(null);
    startStepProgressAnimation();

    const formData = new FormData();
    formData.append("cv", file);
    
    // Pass initial candidate notes and sourcing channel
    if (mode !== "descubrimiento" && notasText.trim()) {
      formData.append("notas_iniciales", notasText.trim());
    }
    if (canalIngreso.trim()) {
      formData.append("canal_ingreso", canalIngreso.trim());
    }

    try {
      const response = await importarCandidatoIA_API(formData);

      if (response.success && (response.status === 201 || response.status === 200)) {
        const data: Partial<Candidato> = response.data || {};

        // 1. Enforce estado_revision and canal_ingreso
        const newStatus = targetEstadoRevision || (mode === "descubrimiento" ? "Seleccionado" : null);
        const updatePayload: Partial<Candidato> = {};
        if (newStatus) updatePayload.estado_revision = newStatus;
        if (canalIngreso.trim()) updatePayload.canal_ingreso = canalIngreso.trim();

        if (Object.keys(updatePayload).length > 0 && data.id) {
          try {
            await actualizarCandidatoAPI(data.id, updatePayload);
            if (updatePayload.estado_revision) data.estado_revision = updatePayload.estado_revision;
            if (updatePayload.canal_ingreso) data.canal_ingreso = updatePayload.canal_ingreso;
          } catch (err) {
            console.warn("[ImportarIaModal] Warning setting estado_revision / canal_ingreso:", err);
          }
        }

        // 2. Link candidate to search in pipeline if selected
        if (selectedSearchId && data.id) {
          try {
            const pipeRes = await crearPipelineAPI(selectedSearchId, data.id);
            let pipeId = "";
            if (pipeRes.success && pipeRes.data) {
              pipeId = pipeRes.data.id || pipeRes.data._id || pipeRes.data.id_pipeline || pipeRes.data.claves_conexion?.id_candidato || (typeof pipeRes.data === "string" ? pipeRes.data : "");
            }
            if (!pipeId && data.id) {
              pipeId = data.id;
            }
            setCreatedPipelineId(pipeId);
            
            // In descubrimiento mode, store notes directly in pipeline_entrevistas.f1_descubrimiento.notas_reclutador
            if (mode === "descubrimiento" && notasText.trim() && pipeRes.success && pipeRes.data?.id) {
              await actualizarPipelineAPI(pipeRes.data.id, {
                f1_descubrimiento: {
                  notas_reclutador: notasText.trim()
                }
              });
            }
          } catch (err) {
            console.warn("[ImportarIaModal] Warning linking to pipeline or updating recruiter notes:", err);
            if (data.id) setCreatedPipelineId(data.id);
          }
        } else if (data.id) {
          setCreatedPipelineId(data.id);
        }

        stopStepProgressAnimation();
        setCurrentStepIndex(2);
        setProgressPercent(100);
        setExtractedCandidato(data);

        setTimeout(() => {
          setStepState("result");
        }, 500);
      } else {
        stopStepProgressAnimation();
        setStepState("error");
        setErrorMessage(response.message || "Error al procesar la importación con IA.");
      }
    } catch (err: any) {
      stopStepProgressAnimation();
      setStepState("error");
      setErrorMessage("Error de red inesperado al conectar con el servidor.");
    }
  };

  const handleFinish = async () => {
    const nombre = extractedCandidato?.nombre_completo || "Candidato";
    const pipeId = createdPipelineId;

    if (autoScreeningEnabled && pipeId) {
      const activeSearchObj = searches.find(s => 
        s.id === selectedSearchId || 
        (s as any).id_busqueda === selectedSearchId || 
        (s as any).code === selectedSearchId ||
        (s as any).codigo_busqueda === selectedSearchId
      );

      let searchCriterios: CriterioScreening[] | undefined = (activeSearchObj as any)?.criterios_screening;

      // Fallback: If searchCriterios is missing, fetch real searches from getBusquedasAPI
      if (!searchCriterios || searchCriterios.length === 0) {
        try {
          const allSearches = await getBusquedasAPI();
          const matchBusq = allSearches.find(b => 
            b.id === selectedSearchId || 
            b.id_busqueda === selectedSearchId || 
            b.codigo_busqueda === selectedSearchId
          );
          if (matchBusq && Array.isArray(matchBusq.criterios_screening) && matchBusq.criterios_screening.length > 0) {
            searchCriterios = matchBusq.criterios_screening;
          }
        } catch (err) {
          console.warn("[ImportarIaModal] Fallback fetching search criteria failed:", err);
        }
      }

      const busqName = activeSearchObj 
        ? `${activeSearchObj.role || activeSearchObj.perfil_busqueda || activeSearchObj.id} (${activeSearchObj.client || activeSearchObj.cliente || "Empresa"})`
        : "Búsqueda activa";

      setEvalModalData({
        pipelineId: pipeId,
        candidateName: nombre,
        busquedaName: busqName,
        criteriosBusqueda: searchCriterios || [],
        hasCv: Boolean(extractedCandidato?.url_cv || file)
      });
      setIsEvalModalOpen(true);
      return;
    }

    onSuccess(nombre, extractedCandidato, selectedSearchId);
    onClose();
    resetState();

    if (mode === "descubrimiento" && pipeId) {
      router.push(`/descubrimiento/${pipeId}`);
    }
  };

  const handleImportAnother = () => {
    const nombre = extractedCandidato?.nombre_completo || "Candidato";
    if (onCandidateCreated) {
      onCandidateCreated(nombre, extractedCandidato, selectedSearchId);
    }
    
    // Reset file and form fields to idle state without closing modal
    setFile(null);
    setFileError(null);
    setErrorMessage(null);
    setNotasText("");
    setStepState("idle");
    setCurrentStepIndex(0);
    setProgressPercent(0);
    setExtractedCandidato(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "IA";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const parseSkills = (skillsRaw?: string | null): string[] => {
    if (!skillsRaw) return [];
    return skillsRaw
      .split(/[,;\n]+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  };

  // Find active search label for display in result
  const activeSearchObj = searches.find(s => s.id === selectedSearchId);
  const activeCodeLabel = activeSearchObj?.codigo_busqueda || activeSearchObj?.code || activeSearchObj?.id;
  const activeSearchLabel = activeSearchObj 
    ? `${activeCodeLabel ? `[${activeCodeLabel}] ` : ""}${activeSearchObj.role || activeSearchObj.perfil_busqueda || activeSearchObj.id} (${activeSearchObj.client || activeSearchObj.cliente || "Empresa"})`
    : selectedSearchId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-auto">
      {/* Backdrop overlay */}
      <div
        className="absolute inset-0 bg-[#000000]/75 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />

      {/* Modal box */}
      <div className="relative z-10 w-full max-w-lg bg-[#15181a]/95 border border-white/10 rounded-3xl p-6 shadow-2xl text-white backdrop-blur-md flex flex-col space-y-5 transition-all">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#6bd8cb]/15 border border-[#6bd8cb]/30 flex items-center justify-center text-[#6bd8cb]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight leading-none">
                {mode === "descubrimiento" ? "Parser Ingesta CV con IA" : "Importar Candidato con IA"}
              </h3>
              <p className="text-[10px] text-[#879391] mt-1 font-medium">
                {stepState === "idle" && (mode === "descubrimiento" ? "Sube el CV y asócialo a una búsqueda activa" : "Extrae la información clave del CV de forma automática")}
                {stepState === "processing" && "Ejecutando motor de inferencia Genkit + Gemini"}
                {stepState === "result" && "Resultado del análisis y perfil generado"}
                {stepState === "error" && "Hubo un inconveniente durante la importación"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span title="ID de componente emergente para prompts de desarrollo" className="text-[9px] font-mono text-[#6bd8cb]/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-all cursor-help uppercase tracking-wider font-semibold">
              ID: {mode === "descubrimiento" ? "M-IMP-02" : "M-IMP-01"}
            </span>
            <button
              onClick={handleClose}
              disabled={stepState === "processing"}
              className={`w-8 h-8 rounded-lg border border-white/5 bg-white/5 flex items-center justify-center text-[#c4c1fb] transition-all ${
                stepState === "processing" ? "opacity-30 cursor-not-allowed" : "hover:bg-white/10 hover:text-white cursor-pointer"
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ----------------- STATE 1: IDLE ----------------- */}
        {stepState === "idle" && (
          <>
            {/* Campo Obligatorio: Búsqueda Activa (Modo Descubrimiento o si hay búsquedas) */}
            {(mode === "descubrimiento" || searches.length > 0) && (
              <div className="flex flex-col text-left space-y-1.5">
                <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-[#6bd8cb]" />
                    Búsqueda Activa Asociada *
                  </span>
                  <span className="text-[9px] text-[#6bd8cb] font-semibold lowercase">fase: 01 - nuevo en revisión</span>
                </label>
                <select
                  value={selectedSearchId}
                  onChange={(e) => handleSelectSearchId(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all cursor-pointer"
                >
                  {searches.map((s) => {
                    const codeLabel = s.codigo_busqueda || s.code || s.id;
                    const label = `${codeLabel} - ${s.role || s.perfil_busqueda || "Posición"} (${s.client || s.cliente || "Cliente"})`;
                    return (
                      <option key={s.id} value={s.id} className="bg-[#15181a] text-white">
                        {label}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="flex flex-col">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="hidden"
              />

              {!file ? (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={triggerFileSelect}
                  className={`w-full min-h-[140px] rounded-2xl border border-dashed flex flex-col items-center justify-center p-5 text-center cursor-pointer transition-all duration-200 ${
                    isDragActive
                      ? "border-[#6bd8cb] bg-[#6bd8cb]/10"
                      : "border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="w-10 h-10 rounded-2xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 flex items-center justify-center text-[#6bd8cb] mb-2.5">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-xs font-bold text-white mb-1">Arrastra y suelta el CV aquí</p>
                  <p className="text-[10px] text-[#879391] font-medium">o haz clic para examinar tus archivos</p>
                  <span className="text-[10px] text-[#c4c1fb] mt-2.5 bg-[#c4c1fb]/10 px-3 py-0.5 rounded-full border border-[#c4c1fb]/20 font-medium">
                    PDF, DOC, DOCX • Máx 5MB
                  </span>
                  {fileError && (
                    <div className="mt-2.5 flex items-center gap-1.5 text-rose-400 text-[11px] font-semibold bg-rose-500/10 px-3 py-1.5 rounded-xl border border-rose-500/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{fileError}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-3.5 rounded-2xl border border-[#6bd8cb]/40 bg-[#6bd8cb]/10 transition-all">
                  <div className="flex items-center gap-3 max-w-[80%]">
                    <div className="w-9 h-9 rounded-xl bg-[#6bd8cb]/20 border border-[#6bd8cb]/30 flex items-center justify-center text-[#6bd8cb] shrink-0">
                      <FileText className="w-4.5 h-4.5" />
                    </div>
                    <div className="text-left min-w-0">
                      <p className="text-xs font-bold text-white truncate">{file.name}</p>
                      <p className="text-[10px] text-[#879391] mt-0.5">
                        {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.name.split('.').pop()?.toUpperCase()}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={removeFile}
                    className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
                    title="Quitar Archivo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Campo Canal de Ingreso */}
            <div className="flex flex-col text-left space-y-1.5">
              <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5 text-[#6bd8cb]" />
                  Canal de Ingreso (Sourcing)
                </span>
                <span className="text-[9px] text-[#879391] font-normal lowercase">(opcional)</span>
              </label>
              <div className="space-y-2">
                <select
                  value={isCustomChannel || (!existingChannels.includes(canalIngreso) && canalIngreso !== "") ? "OTHER_CUSTOM" : canalIngreso}
                  onChange={(e) => {
                    if (e.target.value === "OTHER_CUSTOM") {
                      setIsCustomChannel(true);
                      setCanalIngreso("");
                    } else {
                      setIsCustomChannel(false);
                      setCanalIngreso(e.target.value);
                    }
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all cursor-pointer font-medium"
                >
                  <option value="" className="bg-[#15181a]">-- Sin especificar (opcional) --</option>
                  <optgroup label="Canales detectados en la Base de Datos">
                    {existingChannels.map((ch) => (
                      <option key={ch} value={ch} className="bg-[#15181a] text-white">
                        {ch}
                      </option>
                    ))}
                  </optgroup>
                  <option value="OTHER_CUSTOM" className="bg-[#15181a] text-[#6bd8cb] font-semibold">
                    + Escribir nuevo canal personalizado...
                  </option>
                </select>

                {(isCustomChannel || (!existingChannels.includes(canalIngreso) && canalIngreso !== "")) && (
                  <input
                    type="text"
                    value={canalIngreso}
                    onChange={(e) => setCanalIngreso(e.target.value)}
                    placeholder="Escribe la vía de sourcing específica (ej: Headhunting, LinkedIn, Referido...)..."
                    className="w-full bg-[#15181a] border border-[#6bd8cb]/40 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Campo de Notas (dinámico según modo) */}
            <div className="flex flex-col text-left space-y-1.5">
              <label className="text-[10px] font-bold text-[#c4c1fb] tracking-wider uppercase flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <FileEdit className="w-3.5 h-3.5 text-[#6bd8cb]" />
                  {mode === "descubrimiento" ? "Notas del Reclutador (F1 Descubrimiento)" : "Notas iniciales"}
                </span>
                <span className="text-[9px] text-[#879391] font-normal lowercase">(opcional)</span>
              </label>
              <textarea
                value={notasText}
                onChange={(e) => setNotasText(e.target.value)}
                placeholder={
                  mode === "descubrimiento"
                    ? "Añade observaciones del reclutador para la fase F1 Descubrimiento (pipeline_entrevistas.f1_descubrimiento.notas_reclutador)..."
                    : "Añade anotaciones o contexto relevante sobre este perfil..."
                }
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/20 focus:outline-none transition-all placeholder:text-white/30 resize-y min-h-[60px]"
              />
            </div>

            {/* Auto Screening Option Checkbox */}
            <div className="pt-1 text-left">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/90 bg-white/5 border border-white/10 p-3 rounded-2xl hover:bg-white/[0.08] transition-colors select-none">
                <input
                  type="checkbox"
                  checked={autoScreeningEnabled}
                  onChange={(e) => handleToggleAutoScreening(e.target.checked)}
                  className="w-4 h-4 rounded text-[#6bd8cb] focus:ring-[#6bd8cb] bg-black/40 border-white/20 cursor-pointer"
                />
                <div className="flex items-center gap-1.5 font-medium">
                  <Sparkles className="w-3.5 h-3.5 text-[#6bd8cb]" />
                  <span>Ejecutar proceso de Screening Inteligente IA al confirmar</span>
                </div>
              </label>
            </div>

            {/* Global errors */}
            {errorMessage && (
              <div className="flex gap-2.5 p-3 rounded-2xl border border-rose-500/20 bg-rose-500/5 text-rose-400 text-xs leading-relaxed text-left font-medium">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2 justify-end">
              <button
                onClick={handleClose}
                className="px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#c4c1fb] border border-[#c4c1fb]/20 bg-white/5 hover:bg-white/10 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleProcess}
                disabled={!file}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-[#101415] bg-[#6bd8cb] hover:bg-[#6bd8cb]/95 transition-all shadow-md flex items-center gap-2 ${
                  !file ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Procesar PDF</span>
              </button>
            </div>
          </>
        )}

        {/* ----------------- STATE 2: PROCESSING (PASOS DEL PROCESO) ----------------- */}
        {stepState === "processing" && (
          <div className="py-2 flex flex-col space-y-6">
            
            {/* Progress Bar Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#6bd8cb] font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  Procesando CV con Inteligencia Artificial...
                </span>
                <span className="text-xs font-bold text-[#c4c1fb]">{progressPercent}%</span>
              </div>

              {/* Visual Progress Track */}
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-[#6bd8cb] to-[#c4c1fb] transition-all duration-500 ease-out"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            {/* Stepper Timeline */}
            <div className="space-y-4">
              {PROCESSING_STEPS.map((step, idx) => {
                const isDone = idx < currentStepIndex || (idx === currentStepIndex && progressPercent === 100);
                const isCurrent = idx === currentStepIndex && progressPercent < 100;

                return (
                  <div 
                    key={idx}
                    className={`flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all ${
                      isCurrent 
                        ? "bg-[#6bd8cb]/10 border-[#6bd8cb]/40 text-white shadow-lg" 
                        : isDone 
                        ? "bg-white/5 border-white/10 text-white" 
                        : "bg-white/[0.02] border-white/5 text-[#879391]"
                    }`}
                  >
                    {/* Step Icon */}
                    <div className="mt-0.5 shrink-0">
                      {isDone ? (
                        <div className="w-6 h-6 rounded-full bg-[#6bd8cb] flex items-center justify-center text-[#101415]">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : isCurrent ? (
                        <div className="w-6 h-6 rounded-full border-2 border-[#6bd8cb] border-t-transparent animate-spin flex items-center justify-center" />
                      ) : (
                        <div className="w-6 h-6 rounded-full border border-white/20 flex items-center justify-center text-xs font-bold text-[#879391]">
                          {idx + 1}
                        </div>
                      )}
                    </div>

                    {/* Step Info */}
                    <div className="text-left flex-1 min-w-0">
                      <p className={`text-xs font-bold ${isCurrent ? "text-[#6bd8cb]" : isDone ? "text-white" : "text-[#879391]"}`}>
                        {step.title}
                      </p>
                      <p className="text-[10px] text-[#879391] mt-0.5 leading-snug">
                        {step.subtitle}
                      </p>
                    </div>

                    {/* Active Badge */}
                    {isCurrent && (
                      <span className="text-[9px] font-bold text-[#6bd8cb] bg-[#6bd8cb]/20 px-2 py-0.5 rounded-md border border-[#6bd8cb]/30 animate-pulse shrink-0">
                        En ejecución
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="text-[10px] text-[#879391] text-center italic bg-white/5 p-2.5 rounded-xl border border-white/5">
              Por favor no cierres esta ventana mientras la IA analiza y registra la información.
            </div>
          </div>
        )}

        {/* ----------------- STATE 3: RESULT (RESULTADO FINAL DEL PROCESO) ----------------- */}
        {stepState === "result" && extractedCandidato && (
          <div className="flex flex-col space-y-4 text-left animate-fade-in">
            
            {/* Banner de Éxito y Asignación de Estados */}
            <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-[#6bd8cb]/15 border border-[#6bd8cb]/40 text-[#6bd8cb]">
              <div className="w-9 h-9 rounded-xl bg-[#6bd8cb]/20 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-5 h-5 text-[#6bd8cb]" />
              </div>
              <div className="text-xs">
                <h4 className="font-bold text-white">¡Perfil Ingestado e Importado Exitosamente!</h4>
                <div className="mt-1.5 flex flex-wrap gap-2 text-[10px]">
                  <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold">
                    Talento: Seleccionado
                  </span>
                  {mode === "descubrimiento" && (
                    <span className="bg-[#c4c1fb]/20 text-[#c4c1fb] border border-[#c4c1fb]/30 px-2 py-0.5 rounded font-bold">
                      Descubrimiento: 01 - Nuevo en Revisión
                    </span>
                  )}
                </div>
                {activeSearchLabel && mode === "descubrimiento" && (
                  <p className="text-[10px] text-[#879391] mt-1">
                    Búsqueda vinculada: <span className="text-white font-semibold">{activeSearchLabel}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Card del Candidato Extraído */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3.5">
              
              {/* Header Candidato */}
              <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#6bd8cb] to-[#c4c1fb] p-0.5 shrink-0">
                  <div className="w-full h-full bg-[#15181a] rounded-[14px] flex items-center justify-center text-[#6bd8cb] font-bold text-sm">
                    {getInitials(extractedCandidato.nombre_completo)}
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-white truncate">
                    {extractedCandidato.nombre_completo || "Sin Nombre"}
                  </h4>
                  <p className="text-xs text-[#6bd8cb] font-medium truncate mt-0.5">
                    {extractedCandidato.puesto || "Puesto no especificado"}
                  </p>
                </div>
              </div>

              {/* Metadata Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                <div className="flex items-center gap-2 text-[#879391] bg-white/5 p-2 rounded-xl border border-white/5 truncate">
                  <Mail className="w-4 h-4 text-[#c4c1fb] shrink-0" />
                  <span className="truncate text-white text-[11px]">
                    {extractedCandidato.email || "No especificado"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[#879391] bg-white/5 p-2 rounded-xl border border-white/5 truncate">
                  <Phone className="w-4 h-4 text-[#c4c1fb] shrink-0" />
                  <span className="truncate text-white text-[11px]">
                    {extractedCandidato.telefono_movil || "No especificado"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[#879391] bg-white/5 p-2 rounded-xl border border-white/5 truncate">
                  <MapPin className="w-4 h-4 text-[#c4c1fb] shrink-0" />
                  <span className="truncate text-white text-[11px]">
                    {extractedCandidato.ubicacion || "No especificada"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[#879391] bg-white/5 p-2 rounded-xl border border-white/5 truncate">
                  <Globe className="w-4 h-4 text-[#c4c1fb] shrink-0" />
                  <span className="truncate text-white text-[11px]">
                    Inglés: <strong className="text-[#6bd8cb]">{extractedCandidato.nivel_ingles || "No indicado"}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[#879391] bg-[#6bd8cb]/10 p-2 rounded-xl border border-[#6bd8cb]/20 truncate col-span-1 sm:col-span-2">
                  <Share2 className="w-4 h-4 text-[#6bd8cb] shrink-0" />
                  <span className="truncate text-white text-[11px]">
                    Canal de Ingreso: <strong className="text-[#6bd8cb] font-semibold">{extractedCandidato.canal_ingreso || canalIngreso || "No especificado"}</strong>
                  </span>
                </div>
              </div>

              {/* Skills section */}
              {parseSkills(extractedCandidato.skills_principales).length > 0 && (
                <div className="space-y-1 pt-0.5">
                  <span className="text-[10px] font-bold text-[#c4c1fb] uppercase tracking-wider block">
                    Habilidades Destacadas
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
                    {parseSkills(extractedCandidato.skills_principales).map((skill, index) => (
                      <span 
                        key={index}
                        className="text-[10px] bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20 px-2.5 py-0.5 rounded-lg font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Sección de Notas según el modo */}
              {mode === "descubrimiento" ? (
                notasText.trim() && (
                  <div className="space-y-1 pt-0.5 border-t border-white/5">
                    <span className="text-[10px] font-bold text-[#6bd8cb] uppercase tracking-wider block">
                      Notas del Reclutador (F1 Descubrimiento)
                    </span>
                    <p className="text-[11px] text-[#879391] bg-white/5 p-2.5 rounded-xl border border-[#6bd8cb]/20 leading-relaxed max-h-20 overflow-y-auto">
                      {notasText.trim()}
                    </p>
                  </div>
                )
              ) : (
                (extractedCandidato.resumen || extractedCandidato.notas_iniciales) && (
                  <div className="space-y-1 pt-0.5 border-t border-white/5">
                    <span className="text-[10px] font-bold text-[#c4c1fb] uppercase tracking-wider block">
                      Resumen del Perfil
                    </span>
                    <p className="text-[11px] text-[#879391] bg-white/5 p-2.5 rounded-xl border border-white/5 leading-relaxed max-h-20 overflow-y-auto">
                      {extractedCandidato.resumen || extractedCandidato.notas_iniciales}
                    </p>
                  </div>
                )
              )}

              {/* Existing Screening Status Notice */}
              {extractedCandidato && (
                <div className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 ${
                  hasExistingScreening(extractedCandidato)
                    ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                    : "bg-cyan-500/10 border-cyan-500/30 text-cyan-300"
                }`}>
                  {hasExistingScreening(extractedCandidato) ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Screening Previo Realizado</span>
                        <span>Este postulante ya cuenta con una evaluación de Screening Inteligente IA previa.</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">Sin Screening Previo</span>
                        <span>Este postulante aún no tiene realizado el proceso de Screening Inteligente IA.</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Auto Screening Option Checkbox */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-white/90 bg-white/5 border border-white/10 p-3 rounded-2xl hover:bg-white/[0.08] transition-colors select-none">
                  <input
                    type="checkbox"
                    checked={autoScreeningEnabled}
                    onChange={(e) => handleToggleAutoScreening(e.target.checked)}
                    className="w-4 h-4 rounded text-[#6bd8cb] focus:ring-[#6bd8cb] bg-black/40 border-white/20 cursor-pointer"
                  />
                  <div className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-[#6bd8cb]" />
                    <span>Ejecutar proceso de Screening Inteligente IA al confirmar</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Result Actions */}
            <div className="flex gap-3 pt-1 justify-end">
              <button
                onClick={handleImportAnother}
                className="px-4 py-2.5 rounded-xl text-xs font-bold text-[#c4c1fb] border border-[#c4c1fb]/20 bg-white/5 hover:bg-white/10 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Importar otro CV</span>
              </button>

              <button
                onClick={handleFinish}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-[#101415] bg-[#6bd8cb] hover:bg-[#6bd8cb]/95 transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <FileCheck className="w-4 h-4" />
                <span>{mode === "descubrimiento" ? "Finalizar y Ver en Pipeline" : "Finalizar y Ver en Lista"}</span>
              </button>
            </div>
          </div>
        )}

        {/* ----------------- STATE 4: ERROR ----------------- */}
        {stepState === "error" && (
          <div className="py-4 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
              <AlertCircle className="w-6 h-6" />
            </div>
            
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Error al Procesar el CV</h4>
              <p className="text-xs text-rose-400 max-w-xs leading-relaxed">
                {errorMessage || "No se pudo extraer la información del documento."}
              </p>
            </div>

            <div className="flex gap-3 pt-2 justify-center">
              <button
                onClick={resetState}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-white/10 hover:bg-white/15 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Intentar de nuevo</span>
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modal de Inferencia IA de Screening desencadenado desde Ingesta (M-SCR-01) */}
      {evalModalData && (
        <EvaluarScreeningModal
          isOpen={isEvalModalOpen}
          onClose={() => {
            const targetPipeId = evalModalData?.pipelineId || createdPipelineId || (extractedCandidato as any)?.id;
            setIsEvalModalOpen(false);
            setEvalModalData(null);
            const nombre = extractedCandidato?.nombre_completo || "Candidato";
            onSuccess(nombre, extractedCandidato, selectedSearchId);
            onClose();
            resetState();
            if (mode === "descubrimiento" && targetPipeId) {
              router.push(`/descubrimiento/${targetPipeId}`);
            }
          }}
          pipelineId={evalModalData.pipelineId}
          candidateName={evalModalData.candidateName}
          busquedaName={evalModalData.busquedaName}
          criteriosBusqueda={evalModalData.criteriosBusqueda}
          hasCv={evalModalData.hasCv}
          onSuccess={() => {
            if (onCandidateCreated) {
              onCandidateCreated(extractedCandidato?.nombre_completo || "Candidato", extractedCandidato, selectedSearchId);
            }
          }}
        />
      )}
    </div>
  );
}
