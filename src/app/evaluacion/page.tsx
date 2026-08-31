'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getApiEndpoint } from "@/utils/api";
import { 
  Compass, 
  Building2, 
  MapPin, 
  ChevronRight, 
  Ban, 
  Users, 
  LayoutDashboard, 
  Briefcase,
  Search,
  Contact,
  Settings,
  Sparkles,
  AlertCircle,
  Clock,
  Check,
  CheckCircle2,
  Copy,
  UserCheck,
  RefreshCw,
  Cpu,
  Grid3X3,
  List,
  ArrowUpDown,
  ChevronUp,
  ChevronDown,
  Maximize2,
  Minimize2,
  X,
  Phone,
  Mail,
  Zap,
  ShieldCheck,
  Code,
  FileText,
  AlertTriangle,
  PlayCircle,
  Eye,
  Camera,
  ChevronsRight,
  HelpCircle,
  Brain,
  ClipboardCheck
} from "lucide-react";
import { 
  EvaluacionCandidate, 
  INITIAL_EVALUACION_CANDIDATES, 
  calculateEvaluacionKPIs,
  mapPipelineToEvaluacionCandidates
} from "@/lib/evaluacion";
import { getBusquedasAPI, Busqueda } from "@/actions/busquedas";
import { getCandidatosAPI, Candidato } from "@/actions/candidatos";
import { getPipelineAPI, PipelineItem, actualizarPipelineAPI } from "@/actions/pipeline";
import DensitySelector, { DensityMode } from "@/components/screening/DensitySelector";
import TestPersonalidadTable from "@/components/evaluacion/TestPersonalidadTable";
import EntrevistaTable from "@/components/evaluacion/EntrevistaTable";
import AnalizarTestPersonalidadModal from "@/app/components/AnalizarTestPersonalidadModal";
import AnalizarTranscripcionModal from "@/app/components/AnalizarTranscripcionModal";

export default function EvaluacionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // States
  const [activeBusquedas, setActiveBusquedas] = useState<Busqueda[]>([]);
  const [candidates, setCandidates] = useState<EvaluacionCandidate[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSearch, setSelectedSearch] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [viewMode, setViewMode] = useState<"kanban" | "lista" | "lista_entrevista" | "test_personalidad">("kanban");
  const [density, setDensity] = useState<DensityMode>("compact");
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [selectedCandidateForTest, setSelectedCandidateForTest] = useState<EvaluacionCandidate | null>(null);
  const [isTranscriptModalOpen, setIsTranscriptModalOpen] = useState(false);
  const [selectedCandidateForTranscript, setSelectedCandidateForTranscript] = useState<EvaluacionCandidate | null>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Toast notification state
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // View CV Document PDF handler
  const handleViewCv = (candId: string, urlCv?: string) => {
    if (!urlCv) {
      setToast({
        type: "error",
        message: "Este postulante no tiene un archivo CV adjunto."
      });
      setTimeout(() => setToast(null), 4000);
      return;
    }
    if (urlCv.startsWith("gs://")) {
      const match = document.cookie.match(/(^| )azul_ats_token=([^;]+)/);
      const token = match ? match[2] : "";
      const downloadUrl = getApiEndpoint(`candidatos/${candId}/cv?token=${token}`);
      window.open(downloadUrl, "_blank");
    } else {
      window.open(urlCv, "_blank");
    }
  };
  
  // Navigation handler for detail page
  const handleViewDetails = (cad: EvaluacionCandidate) => {
    router.push(`/evaluacion/${cad.pipeId || cad.id}`);
  };
  
  // Sorthing states (list view)
  const [sortField, setSortField] = useState<string>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Custom alerts or notifications
  const [isWipWarningDismissed, setIsWipWarningDismissed] = useState(false);
  const [copiedTextType, setCopiedTextType] = useState<string | null>(null);
  const [activeMetricHelp, setActiveMetricHelp] = useState<string | null>(null);

  // Simulated Tool Action States
  const [isSimulatingCopilotRun, setIsSimulatingCopilotRun] = useState(false);
  const [simulatedCopilotCompleted, setSimulatedCopilotCompleted] = useState(false);
  const [isSimulatingValidadorCheck, setIsSimulatingValidadorCheck] = useState(false);
  const [simulatedValidadorSuccess, setSimulatedValidadorSuccess] = useState<boolean | null>(null);

  // Phase 3 Advance Modal State
  const [candidateToAdvance, setCandidateToAdvance] = useState<EvaluacionCandidate | null>(null);
  const [isAdvancingPhase, setIsAdvancingPhase] = useState(false);

  // Fetch backend data
  const fetchBackendData = async () => {
    setDataLoading(true);
    setDataError(null);
    try {
      // 1. Fetch active searches
      const searchesList = await getBusquedasAPI();
      setActiveBusquedas(searchesList);

      // 2. Fetch candidates
      const candidatesRes = await getCandidatosAPI();
      let candidatesList: Candidato[] = [];
      if (candidatesRes.success && Array.isArray(candidatesRes.data)) {
        candidatesList = candidatesRes.data;
      }

      // 3. Fetch pipelines
      let pipeItems: PipelineItem[] = [];
      if (selectedSearch === "Todos") {
        if (searchesList.length > 0) {
          const promises = searchesList.map(s => getPipelineAPI(s.id_busqueda || s.id));
          const results = await Promise.all(promises);
          results.forEach(res => {
            if (res.success && Array.isArray(res.data)) {
              pipeItems = pipeItems.concat(res.data);
            }
          });
        } else {
          const res = await getPipelineAPI("REQ-001");
          if (res.success && Array.isArray(res.data)) {
            pipeItems = res.data;
          }
        }
      } else {
        const match = searchesList.find(s => 
          (s.id_busqueda || s.id) === selectedSearch || 
          s.codigo_busqueda === selectedSearch || 
          `${s.cliente} - ${s.perfil_busqueda}` === selectedSearch
        );
        if (match) {
          const res = await getPipelineAPI(match.id_busqueda || match.id);
          if (res.success && Array.isArray(res.data)) {
            pipeItems = res.data;
          }
        }
      }

      // Map to EvaluacionCandidate[]
      const mapped = mapPipelineToEvaluacionCandidates(pipeItems, candidatesList, searchesList);
      setCandidates(mapped);
    } catch (err: any) {
      console.error("Error al obtener datos de evaluacion del backend:", err);
      setDataError(err.message || "Error al conectar con los servicios backend del pipeline.");
    } finally {
      setDataLoading(false);
    }
  };

  // Restore saved search filter from localStorage on initial mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedSearch = localStorage.getItem("evaluacion_selected_search");
      if (savedSearch) {
        setSelectedSearch(savedSearch);
      }
    }
  }, []);

  const handleSelectSearchChange = (value: string) => {
    setSelectedSearch(value);
    if (typeof window !== "undefined") {
      localStorage.setItem("evaluacion_selected_search", value);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, [selectedSearch]);

  // Client-side auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#101415] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6bd8cb] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // KPIs
  const kpis = calculateEvaluacionKPIs(candidates);
  
  // State transition
  const handleTransitionState = async (id: string, targetPhase: EvaluacionCandidate["currentPhase"]) => {
    const targetCandidate = candidates.find(c => c.id === id);
    const label = getPhaseLabel(targetPhase);

    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, currentPhase: targetPhase, lastActivity: `Estado cambiado a ${label}` } : c))
    );

    if (targetCandidate?.pipeId) {
      try {
        const res = await actualizarPipelineAPI(targetCandidate.pipeId, {
          flujo: {
            estado_actual: targetPhase,
            fecha_ultimo_cambio: new Date().toISOString()
          }
        });
        if (!res.success) {
          console.warn("[Evaluacion] Warning al actualizar pipeline en backend:", res.message);
        }
      } catch (err) {
        console.error("[Evaluacion] Error al actualizar pipeline en backend:", err);
      }
    }
  };

  const getPhaseLabel = (phase: EvaluacionCandidate["currentPhase"]) => {
    switch (phase) {
      case "05_screening": return "05 - Screening (Entrevista Inicial)";
      case "06_assessment": return "06 - Prueba / Assessment Técnico";
      case "07_en_duda_evaluacion": return "07 - En Duda Evaluación";
      case "08_descartado_interno": return "08 - Descartado (Interno)";
    }
  };

  // Trigger phase advance modal
  const handleAdvancePhase = (cad: EvaluacionCandidate) => {
    setCandidateToAdvance(cad);
  };

  const confirmAdvancePhaseAction = async () => {
    if (!candidateToAdvance) return;
    setIsAdvancingPhase(true);
    try {
      if (candidateToAdvance.pipeId) {
        const now = new Date().toISOString();
        const nuevoEstado = "09_presentado_cliente";
        const res = await actualizarPipelineAPI(candidateToAdvance.pipeId, {
          flujo: {
            estado_actual: nuevoEstado,
            fecha_ultimo_cambio: now,
            historial_estados: [
              { estado: nuevoEstado, timestamp: now }
            ]
          }
        });
        if (res.success) {
          setCandidates((prev) => prev.filter((c) => c.id !== candidateToAdvance.id));
        }
      } else {
        setCandidates((prev) => prev.filter((c) => c.id !== candidateToAdvance.id));
      }
      setCandidateToAdvance(null);
    } catch (err: any) {
      console.error("Error al avanzar candidato a Fase 3:", err);
    } finally {
      setIsAdvancingPhase(false);
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetCol: EvaluacionCandidate["currentPhase"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (id) {
      handleTransitionState(id, targetCol);
    }
  };

  // Copy helper
  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextType(type);
    setTimeout(() => setCopiedTextType(null), 2000);
  };

  const triggerCopilotSimulation = () => {
    setIsSimulatingCopilotRun(true);
    setSimulatedCopilotCompleted(false);
    setTimeout(() => {
      setIsSimulatingCopilotRun(false);
      setSimulatedCopilotCompleted(true);
    }, 2500);
  };

  const triggerValidadorSimulation = () => {
    setIsSimulatingValidadorCheck(true);
    setSimulatedValidadorSuccess(null);
    setTimeout(() => {
      setIsSimulatingValidadorCheck(false);
      const isSuccess = Math.random() > 0.3;
      setSimulatedValidadorSuccess(isSuccess);
    }, 2000);
  };

  // Filter logic
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client.toLowerCase().includes(searchTerm.toLowerCase());

    const searchRoleCombined = `${c.searchClient || c.client} - ${c.searchRole || c.role}`;
    const matchesSearchFilter = 
      selectedSearch === "Todos" ||
      c.searchId === selectedSearch ||
      c.searchCode === selectedSearch ||
      searchRoleCombined === selectedSearch ||
      `${c.client} - ${c.role}` === selectedSearch;

    return matchesSearch && matchesSearchFilter;
  });

  // Candidate status filter for list view
  const listFilteredCandidates = filteredCandidates.filter((c) => {
    if (filterStatus === "Todos") return true;
    return c.currentPhase === filterStatus;
  });

  // Sorting
  const sortedListCandidates = [...listFilteredCandidates].sort((a, b) => {
    let valA: any = "";
    let valB: any = "";

    if (sortField === "name") {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortField === "score") {
      valA = a.score;
      valB = b.score;
    } else if (sortField === "client") {
      valA = `${a.client} - ${a.role}`.toLowerCase();
      valB = `${b.client} - ${b.role}`.toLowerCase();
    } else if (sortField === "phase") {
      valA = a.currentPhase;
      valB = b.currentPhase;
    } else if (sortField === "cnps") {
      valA = a.cNPS || 0;
      valB = b.cNPS || 0;
    } else if (sortField === "archetype" || sortField === "dimensions") {
      valA = `${a.test_personalidad?.arquetipo_codigo || ''} ${a.test_personalidad?.arquetipo_nombre || ''}`.toLowerCase();
      valB = `${b.test_personalidad?.arquetipo_codigo || ''} ${b.test_personalidad?.arquetipo_nombre || ''}`.toLowerCase();
    } else if (sortField === "verdict") {
      valA = (a.test_personalidad?.analisis_encaje || "").toLowerCase();
      valB = (b.test_personalidad?.analisis_encaje || "").toLowerCase();
    } else if (sortField === "notes") {
      valA = (a.recruiterNotes || "").toLowerCase();
      valB = (b.recruiterNotes || "").toLowerCase();
    } else if (sortField === "exp_entrevista") {
      const expA = typeof a.informe_entrevista_ia?.experiencia_consolidada === "string"
        ? a.informe_entrevista_ia.experiencia_consolidada
        : (a.informe_entrevista_ia?.experiencia_consolidada?.resumen_trayectoria || "");
      const expB = typeof b.informe_entrevista_ia?.experiencia_consolidada === "string"
        ? b.informe_entrevista_ia.experiencia_consolidada
        : (b.informe_entrevista_ia?.experiencia_consolidada?.resumen_trayectoria || "");
      valA = expA.toLowerCase();
      valB = expB.toLowerCase();
    } else if (sortField === "alig_entrevista") {
      const aligA = typeof a.informe_entrevista_ia?.alineacion_motivadores === "string"
        ? a.informe_entrevista_ia.alineacion_motivadores
        : (a.informe_entrevista_ia?.alineacion_motivadores?.encaje_cultural || "");
      const aligB = typeof b.informe_entrevista_ia?.alineacion_motivadores === "string"
        ? b.informe_entrevista_ia.alineacion_motivadores
        : (b.informe_entrevista_ia?.alineacion_motivadores?.encaje_cultural || "");
      valA = aligA.toLowerCase();
      valB = aligB.toLowerCase();
    } else if (sortField === "pretension") {
      valA = (a.informe_entrevista_ia?.pretension_economica_condiciones?.pretension_salarial || "").toLowerCase();
      valB = (b.informe_entrevista_ia?.pretension_economica_condiciones?.pretension_salarial || "").toLowerCase();
    } else if (sortField === "auditoria") {
      const incsA = Array.isArray(a.informe_entrevista_ia?.auditoria_veracidad?.inconsistencias_detectadas) 
        ? a.informe_entrevista_ia.auditoria_veracidad.inconsistencias_detectadas.length 
        : 0;
      const incsB = Array.isArray(b.informe_entrevista_ia?.auditoria_veracidad?.inconsistencias_detectadas) 
        ? b.informe_entrevista_ia.auditoria_veracidad.inconsistencias_detectadas.length 
        : 0;
      valA = incsA;
      valB = incsB;
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-white/20 ml-1 inline-block" />;
    }
    return sortDirection === "asc" 
      ? <ChevronUp className="w-3 h-3 text-[#6bd8cb] ml-1 inline-block" />
      : <ChevronDown className="w-3 h-3 text-[#6bd8cb] ml-1 inline-block" />;
  };

  // Phase Counts
  const countScreening = candidates.filter((c) => c.currentPhase === "05_screening").length;
  const countAssessment = candidates.filter((c) => c.currentPhase === "06_assessment").length;
  const countEnDuda = candidates.filter((c) => c.currentPhase === "07_en_duda_evaluacion").length;
  const countDescartados = candidates.filter((c) => c.currentPhase === "08_descartado_interno").length;

  return (
    <div className={`relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden transition-all duration-350 ${isFullScreen ? 'p-4' : ''}`}>
      {/* Background blurs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-[#9b5de5]/5 blur-[90px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#6bd8cb]/5 blur-[90px] pointer-events-none"></div>

      <div className={`relative z-10 mx-auto space-y-8 ${isFullScreen ? 'max-w-none' : 'max-w-7xl'}`}>
        
        {/* Header */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-6 border-b border-white/10">
          <div className="flex justify-between items-center w-full lg:w-auto gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#9b5de5] to-[#6bd8cb] flex items-center justify-center shadow-lg shadow-[#9b5de5]/20">
                <Compass className="w-6 h-6 text-[#101415]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Fase 2: Filtro de la Agencia
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#9b5de5]/15 text-[#9b5de5] border border-[#9b5de5]/25 rounded-md animate-pulse">
                    EVALUACIÓN INTERNA
                  </span>
                  <span title="ID de vista para prompts de desarrollo" className="text-[9px] font-mono text-[#6bd8cb]/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-all cursor-help uppercase tracking-wider font-semibold">
                    ID: P-EVA-01
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                  Pipeline de Evaluación
                </h1>
              </div>
            </div>

            {/* Mobile/Tablet Avatar (visible in top-right of the title block on mobile/tablet) */}
            <Link
              href="/configuracion"
              className="lg:hidden relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#9b5de5] to-[#6bd8cb] text-white flex items-center justify-center text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 select-none cursor-pointer shrink-0"
              title="Ajustes de Perfil"
            >
              {user?.displayName
                ? user.displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                : user?.email
                  ? user.email.slice(0, 2).toUpperCase()
                  : "AD"}
            </Link>
          </div>

          <div className="flex items-start gap-3">
            <div className="flex items-center flex-wrap gap-3">
              {/* Grupo 1: Navegación Global */}
              <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1 shadow-inner">
                <Link
                  href="/dashboard"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-[#6bd8cb] hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>

                <Link
                  href="/busquedas"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-[#6bd8cb] hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Búsquedas</span>
                </Link>

                <Link
                  href="/talento"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-[#6bd8cb] hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
                >
                  <Contact className="w-4 h-4" />
                  <span className="hidden sm:inline">Postulantes</span>
                </Link>
              </div>

              {/* Separador visual */}
              <div className="text-white/20 select-none text-xs font-light hidden sm:block">|</div>

              {/* Grupo 2: Navegación Contextual del Pipeline */}
              <div className="flex items-center gap-1 bg-[#9b5de5]/5 border border-[#9b5de5]/20 rounded-xl p-1 shadow-inner">
                <Link
                  href="/descubrimiento"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#c4c1fb] hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4" />
                  <span className="hidden sm:inline">F1 Descubrimiento</span>
                </Link>

                <div 
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#9b5de5]/25 text-white flex items-center gap-1.5 select-none"
                  title="F2 Evaluación (Módulo Actual)"
                >
                  <Compass className="w-4 h-4 text-white" />
                  <span className="hidden sm:inline">F2 Evaluación</span>
                </div>

                <Link
                  href="/presentacion"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-500 hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-205 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">F3 Cliente</span>
                </Link>

                <Link
                  href="/cierre"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-500 hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-205 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-emerald-500" />
                  <span className="hidden sm:inline">F4 Cierre</span>
                </Link>
              </div>
            </div>
            <Link
              href="/configuracion"
              className="hidden lg:flex relative w-9 h-9 rounded-full bg-gradient-to-tr from-[#9b5de5] to-[#6bd8cb] text-white flex items-center justify-center text-xs font-black shadow-md hover:scale-105 active:scale-95 transition-all duration-200 border border-white/20 select-none cursor-pointer shrink-0"
              title="Ajustes de Perfil"
            >
              {user?.displayName
                ? user.displayName.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
                : user?.email
                  ? user.email.slice(0, 2).toUpperCase()
                  : "AD"}
            </Link>
          </div>
        </header>

        {/* Warning Indicator limits if WIP overloaded */}
        {kpis.isWipOverloaded && !isWipWarningDismissed && (
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 text-xs flex justify-between items-center gap-3 animate-fadeIn">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <div>
                <span className="font-bold">¡Sobrecarga de Trabajo Interno (Límite WIP Excedido)! </span>
                Actualmente tienes {kpis.activeWipCount} candidatos en la Fase de Evaluación. Criterio de eficiencia: si hay más de 10 candidatos aquí, se recomienda frenar el sourcing primario para concentrarse en validar y liberar a los actuales.
              </div>
            </div>
            <button 
              onClick={() => setIsWipWarningDismissed(true)} 
              className="text-[#879391] hover:text-white text-[10px] uppercase font-bold cursor-pointer pr-1"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* KPIs Cards Row */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px]">
            <div className="flex justify-between items-start mb-1">
              <div className="text-left">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">WIP Cycle Time</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Tiempo promedio de respuesta</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'wip_cycle' ? null : 'wip_cycle')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-white">{kpis.wipCycleTimeHours} horas</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                kpis.wipCycleTimeHours > 48 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {kpis.wipCycleTimeHours > 48 ? "Fuera de meta (>48h)" : "En línea (<48h)"}
              </span>
            </div>
            <Clock className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none" />

            {/* Help Overlay */}
            {activeMetricHelp === 'wip_cycle' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-[#6bd8cb] uppercase tracking-wider">WIP Cycle Time</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Mide las horas laborables que en promedio acumulan los candidatos activos en fases de Screening y Assessment técnico interno.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: Σ(Tiempo transcurrido en fase actual) / Nº de candidatos en el WIP
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px]">
            <div className="flex justify-between items-start mb-1">
              <div className="text-left">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">cNPS Medio</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Score de candidaturas</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'cnps' ? null : 'cnps')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-[#c4c1fb]">{kpis.avgCNPS} / 10</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">Experiencia A+</span>
            </div>
            <Users className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none" />

            {/* Help Overlay */}
            {activeMetricHelp === 'cnps' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-[#6bd8cb] uppercase tracking-wider">Candidate NPS</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Mide el nivel de recomendación y satisfacción de los postulantes respecto al trato de selección y calidad de feedbacks.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: Promedio de puntuaciones de satisfacción cNPS (escala 1-10) del pool
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px]">
            <div className="flex justify-between items-start mb-1">
              <div className="text-left">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">Pass-through Rate</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Validación al Cliente</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'pass_through' ? null : 'pass_through')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-emerald-400">{kpis.passThroughRate}%</span>
              <span className="text-[10px] text-[#c4c1fb] bg-white/5 px-2 py-0.5 rounded">Filtro Exitoso</span>
            </div>
            <UserCheck className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none" />

            {/* Help Overlay */}
            {activeMetricHelp === 'pass_through' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-[#6bd8cb] uppercase tracking-wider">Pass-through Rate</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Refleja el porcentaje de candidatos validados en la llamada de Screening que logran acceder y ser habilitados para la fase de assessment.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: (Candidatos en Assessment / Total de Candidatos en Evaluación) * 100
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px]">
            <div className="flex justify-between items-start mb-1">
              <div className="text-left">
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">Candidatos Activos WIP</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Evaluación + Screening</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'active_wip' ? null : 'active_wip')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-rose-450">{kpis.activeWipCount} activos</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                kpis.isWipOverloaded ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20"
              }`}>
                {kpis.isWipOverloaded ? "Saturado" : "Saludable"}
              </span>
            </div>
            <Cpu className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none" />

            {/* Help Overlay */}
            {activeMetricHelp === 'active_wip' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-[#6bd8cb] uppercase tracking-wider">Candidatos WIP</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Cantidad total de perfiles y expedientes siendo procesados en paralelo por el equipo de selección. Límite ideal recomendado: &le; 10 postulantes.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Cálculo: Conteo directo de perfiles en las fases 05_screening y 06_assessment
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Global Filter Bar */}
        <section className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col 2xl:flex-row gap-4 justify-between items-center text-left">
          <div className="flex flex-col md:flex-row flex-wrap gap-3 w-full 2xl:w-auto items-center">
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs 2xl:w-72">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#879391]" />
              <input
                type="text"
                placeholder="Buscar por candidato, rol o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#101415]/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#879391] focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/15 focus:outline-none transition-all"
              />
            </div>

            {/* Client/Search select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-[#879391] whitespace-nowrap">Búsqueda:</span>
              <select
                value={selectedSearch}
                onChange={(e) => handleSelectSearchChange(e.target.value)}
                className="bg-[#101415]/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb] cursor-pointer w-full md:w-auto"
              >
                <option value="Todos" className="bg-[#15181a]">Todas las Búsquedas</option>
                {activeBusquedas.map((b) => {
                  const searchVal = b.id_busqueda || b.id;
                  const codeLabel = b.codigo_busqueda ? `[${b.codigo_busqueda}] ` : "";
                  const optionLabel = `${codeLabel}${b.cliente} - ${b.perfil_busqueda}`;
                  return (
                    <option key={searchVal} value={searchVal} className="bg-[#15181a] text-white">
                      {optionLabel}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* State filter - List View exclusive */}
            {viewMode === "lista" && (
              <div className="flex items-center gap-2 w-full md:w-auto animate-fadeIn">
                <span className="text-xs text-[#c4c1fb] whitespace-nowrap font-medium">Estado:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#101415]/60 border border-[#c4c1fb]/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb] cursor-pointer w-full md:w-auto"
                >
                  <option value="Todos" className="bg-[#15181a]">Todos los estados</option>
                  <option value="05_screening" className="bg-[#15181a]">05 - Screening</option>
                  <option value="06_assessment" className="bg-[#15181a]">06 - Assessment Técnico</option>
                  <option value="07_en_duda_evaluacion" className="bg-[#15181a]">07 - En Duda Evaluación</option>
                  <option value="08_descartado_interno" className="bg-[#15181a]">08 - Descartado (Interno)</option>
                </select>
              </div>
            )}

            {/* Density Selector - Test Personalidad or Lista Entrevista View */}
            {(viewMode === "test_personalidad" || viewMode === "lista_entrevista") && (
              <DensitySelector density={density} onChange={setDensity} />
            )}
          </div>

          {/* Toggle buttons for viewMode and Fullscreen */}
          <div className="flex items-center flex-wrap gap-3 w-full 2xl:w-auto justify-center 2xl:justify-end shrink-0">
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 select-none">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-[#6bd8cb] text-[#101415] shadow shadow-[#0d9488]/10"
                    : "text-[#879391] hover:text-white"
                }`}
              >
                <Grid3X3 className="w-3.5 h-3.5" />
                <span>Kanban</span>
              </button>
              <button
                onClick={() => setViewMode("lista")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "lista"
                    ? "bg-[#6bd8cb] text-[#101415] shadow shadow-[#0d9488]/10"
                    : "text-[#879391] hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista detallada</span>
              </button>
              <button
                onClick={() => setViewMode("lista_entrevista")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "lista_entrevista"
                    ? "bg-[#6bd8cb] text-[#101415] shadow shadow-[#0d9488]/10"
                    : "text-[#879391] hover:text-white"
                }`}
                title="Nueva Vista: Lista Entrevista de Screening (ID: P-EVA-01)"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Lista Entrevista</span>
              </button>
              <button
                onClick={() => setViewMode("test_personalidad")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "test_personalidad"
                    ? "bg-[#6bd8cb] text-[#101415] shadow shadow-[#0d9488]/10"
                    : "text-[#879391] hover:text-white"
                }`}
                title="Nueva Vista: Lista Test Personalidad (ID: P-EVA-01)"
              >
                <Brain className="w-3.5 h-3.5" />
                <span>Lista Test Personalidad</span>
              </button>
            </div>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isFullScreen
                  ? "bg-[#6bd8cb]/15 border-[#6bd8cb]/30 text-[#6bd8cb] hover:bg-[#6bd8cb]/25 shadow-sm"
                  : "bg-white/5 border-white/10 text-[#c4c1fb]/80 hover:bg-white/10 hover:text-white"
              }`}
              title={isFullScreen ? "Restaurar vista normal" : "Maximizar pantalla"}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Restaurar</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Maximizar</span>
                </>
              )}
            </button>
          </div>
        </section>

        {/* Loading and Error Feedback Banners */}
        {dataLoading && (
          <div className="p-4 rounded-xl border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 text-[#6bd8cb] text-xs flex items-center justify-center gap-2 animate-pulse">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Sincronizando pipeline de evaluación con los servicios backend...</span>
          </div>
        )}

        {dataError && (
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex justify-between items-center gap-3">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{dataError}</span>
            </div>
            <button
              onClick={() => fetchBackendData()}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 rounded-lg font-bold text-[10px] uppercase cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* View Mode Content */}
        {viewMode === "kanban" ? (
          /* Kanban Board layout */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 animate-fadeIn">
            
            {/* COLUMN 1: Screening */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "05_screening")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-amber-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">05 - SCREENING / ENTREVISTA INICIAL</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Validación de perfil y salarios</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-400">
                  {countScreening}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "05_screening").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={handleViewDetails} onTransition={handleTransitionState} onAdvancePhase={handleAdvancePhase} onDragStart={handleDragStart} onViewCv={handleViewCv} />
                ))}
                {countScreening === 0 && <EmptyColumnText text="Ningún programado" />}
              </div>
            </div>

            {/* COLUMN 2: Assessment */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "06_assessment")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-[#6bd8cb] text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">06 - PRUEBA / ASSESSMENT TÉCNICO</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Pruebas psicotécnicas e interactivos</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#6bd8cb]">
                  {countAssessment}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "06_assessment").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={handleViewDetails} onTransition={handleTransitionState} onAdvancePhase={handleAdvancePhase} onDragStart={handleDragStart} onViewCv={handleViewCv} />
                ))}
                {countAssessment === 0 && <EmptyColumnText text="Ningún assessment activo" />}
              </div>
            </div>

            {/* COLUMN 3: En Duda */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "07_en_duda_evaluacion")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-amber-400 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">07 - EN DUDA EVALUACIÓN</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Requiere revisión adicional</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-400">
                  {countEnDuda}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "07_en_duda_evaluacion").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={handleViewDetails} onTransition={handleTransitionState} onAdvancePhase={handleAdvancePhase} onDragStart={handleDragStart} onViewCv={handleViewCv} />
                ))}
                {countEnDuda === 0 && <EmptyColumnText text="Ningún candidato en duda" />}
              </div>
            </div>

            {/* COLUMN 4: Discarded */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "08_descartado_interno")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-rose-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">08 - DESCARTADO (INTERNO)</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">No cumple con barra mínima</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-rose-400">
                  {countDescartados}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "08_descartado_interno").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={handleViewDetails} onTransition={handleTransitionState} onAdvancePhase={handleAdvancePhase} onDragStart={handleDragStart} onViewCv={handleViewCv} />
                ))}
                {countDescartados === 0 && <EmptyColumnText text="Ningún descarte" />}
              </div>
            </div>

          </div>
        ) : viewMode === "lista" ? (
          /* Detailed List Layout */
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md animate-fadeIn text-left">
            <table className="w-full text-xs text-left">
              <thead className="bg-[#101415]/80 text-[10px] font-bold text-[#879391] uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-5 py-4 cursor-pointer hover:text-white" onClick={() => toggleSort("name")}>
                    Candidato {renderSortIcon("name")}
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white" onClick={() => toggleSort("client")}>
                    Puesto / Cliente {renderSortIcon("client")}
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white" onClick={() => toggleSort("phase")}>
                    Estado actual {renderSortIcon("phase")}
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white min-w-[220px]" onClick={() => toggleSort("notes")}>
                    NOTAS RECLUTADOR EVALUACIONES {renderSortIcon("notes")}
                  </th>
                  <th className="px-5 py-4 min-w-[320px]">
                    Scorecard Entrevista IA
                  </th>
                  <th className="px-5 py-4 min-w-[240px]">
                    Test Personalidad
                  </th>
                  <th className="px-5 py-4 min-w-[240px]">
                    Assessment Técnico
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white text-center" onClick={() => toggleSort("cnps")}>
                    cNPS {renderSortIcon("cnps")}
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white text-center" onClick={() => toggleSort("score")}>
                    Fit Score {renderSortIcon("score")}
                  </th>
                  <th className="px-5 py-4 text-right min-w-[440px]">Acciones & Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {sortedListCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-5 py-8 text-center text-[#879391] bg-white/5">
                      No se encontraron candidatos evaluados que coincidan con los criterios establecidos.
                    </td>
                  </tr>
                ) : (
                  sortedListCandidates.map((cad, index) => (
                    <tr key={cad.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <button
                          onClick={() => handleViewDetails(cad)}
                          className="font-bold text-white text-sm hover:text-[#6bd8cb] cursor-pointer transition-colors text-left block hover:underline"
                          title={`Ver expediente y detalles completos de ${cad.name}`}
                        >
                          {cad.name}
                        </button>
                        <div className="text-[10px] text-[#879391] mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-[#6bd8cb]/70" />
                          {cad.location}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="text-[#e0e3e5]">{cad.role}</div>
                        <div className="text-[10px] text-[#879391] mt-0.5 font-bold flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-[#c4c1fb]" />
                          {cad.client}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full inline-block ${
                          cad.currentPhase === "05_screening" ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" :
                          cad.currentPhase === "06_assessment" ? "bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/15" : 
                          "bg-rose-500/10 text-rose-450 border border-rose-500/15"
                        }`}>
                          {getPhaseLabel(cad.currentPhase).substring(5)}
                        </span>
                      </td>
                      {/* 1. Notas Reclutador (Humano) */}
                      <td className="py-4 px-5 min-w-[220px] max-w-[280px] relative group">
                        {cad.recruiterNotes ? (
                          <>
                            <div className="flex items-start gap-1.5 cursor-help p-2 rounded-lg bg-[#6bd8cb]/10 border border-[#6bd8cb]/25 text-[#6bd8cb] text-[10px] leading-snug font-medium shadow-sm">
                              <FileText className="w-3.5 h-3.5 text-[#6bd8cb] shrink-0 mt-0.5" />
                              <span className="text-white font-medium line-clamp-3 flex-grow">{cad.recruiterNotes}</span>
                              <span className="shrink-0 p-0.5 rounded-full bg-[#6bd8cb]/20 text-[#6bd8cb] group-hover:bg-[#6bd8cb] group-hover:text-black transition-all">
                                <HelpCircle className="w-3.5 h-3.5" />
                              </span>
                            </div>

                            {/* Hover Popover despliega el texto completo de las notas */}
                            <div className={`absolute ${index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 hidden group-hover:block z-50 w-96 p-4 rounded-2xl glass-panel border border-[#6bd8cb]/40 bg-[#101415]/95 shadow-2xl space-y-2 pointer-events-none animate-fadeIn text-left backdrop-blur-md`}>
                              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                                <HelpCircle className="w-4 h-4 text-[#6bd8cb]" />
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                  Notas Reclutador Evaluaciones
                                </h4>
                              </div>
                              <p className="text-[11px] text-white/95 leading-relaxed font-normal whitespace-pre-line">
                                {cad.recruiterNotes}
                              </p>
                            </div>
                          </>
                        ) : (
                          <span className="text-[#879391]/50 text-[10px] italic block">Sin notas registradas</span>
                        )}
                      </td>

                      {/* 2. Scorecard Entrevista IA (Columna Dedicada + Hover Tooltip) */}
                      <td className="py-4 px-5 min-w-[320px] max-w-[400px]">
                        {cad.informe_entrevista_ia ? (() => {
                          const inf = cad.informe_entrevista_ia;
                          const pret = inf.pretension_economica_condiciones || {};
                          const aud = inf.auditoria_veracidad || {};
                          const incs = aud.inconsistencias_detectadas || [];
                          const forts = aud.confirmaciones_fortalezas || [];
                          const expText = typeof inf.experiencia_consolidada === "string" 
                            ? inf.experiencia_consolidada 
                            : (inf.experiencia_consolidada?.resumen_trayectoria || "");
                          const aligText = typeof inf.alineacion_motivadores === "string" 
                            ? inf.alineacion_motivadores 
                            : (inf.alineacion_motivadores?.encaje_cultural || "");

                          return (
                            <div className="relative group cursor-help">
                              {/* Tarjeta Sintetizada Visible en la Celda */}
                              <div className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-[#6bd8cb]/20 transition-all space-y-1.5">
                                {/* Fila 1: Micro-chips de Condiciones */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#6bd8cb]/15 border border-[#6bd8cb]/30 text-[9.5px] font-bold text-[#6bd8cb]">
                                    <Sparkles className="w-3 h-3 text-[#6bd8cb]" />
                                    <span>{pret.pretension_salarial || "Salario N/E"}</span>
                                  </span>

                                  {pret.modalidad_preferida && (
                                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-medium text-[#c4c1fb]">
                                      {pret.modalidad_preferida}
                                    </span>
                                  )}

                                  {pret.disponibilidad && (
                                    <span className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] font-medium text-white/70">
                                      {pret.disponibilidad}
                                    </span>
                                  )}

                                  {/* Badge Auditoría de Veracidad */}
                                  {incs.length > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/30 text-[9px] font-bold text-rose-300">
                                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                                      <span>{incs.length} Inconsistencia{incs.length > 1 ? "s" : ""}</span>
                                    </span>
                                  ) : forts.length > 0 ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[9px] font-bold text-emerald-300">
                                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                                      <span>Verificado</span>
                                    </span>
                                  ) : null}
                                </div>

                                {/* Fila 2: Snippet de Motivación o Trayectoria (1 línea) */}
                                {(expText || aligText) && (
                                  <p className="text-[10px] text-[#879391] line-clamp-1 italic">
                                    "{aligText || expText}"
                                  </p>
                                )}
                              </div>

                              {/* HOVER TOOLTIP / POPOVER DESPLEGABLE CON DETALLES COMPLETOS */}
                              <div className={`absolute ${index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 -translate-x-1/2 hidden group-hover:block z-50 w-96 p-4 rounded-2xl glass-panel border border-[#6bd8cb]/40 bg-[#101415]/95 shadow-2xl space-y-3 pointer-events-none animate-fadeIn text-left backdrop-blur-md`}>
                                {/* Top Header */}
                                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-[#6bd8cb]/20 text-[#6bd8cb]">
                                      <Sparkles className="w-4 h-4" />
                                    </div>
                                    <div>
                                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                        Smart Scorecard — Entrevista IA
                                      </h4>
                                      <p className="text-[9px] text-[#879391]">Inspección rápida al pasar el cursor</p>
                                    </div>
                                  </div>
                                  <span className="text-[8px] font-mono text-[#6bd8cb] bg-[#6bd8cb]/10 px-1.5 py-0.5 rounded border border-[#6bd8cb]/20 uppercase font-bold">
                                    f2_evaluacion
                                  </span>
                                </div>

                                {/* Experiencia Consolidada */}
                                {expText && (
                                  <div className="space-y-1">
                                    <span className="text-[9px] uppercase font-bold text-[#6bd8cb] tracking-wider block">
                                      Experiencia Consolidada
                                    </span>
                                    <p className="text-[10px] text-white/90 leading-relaxed line-clamp-3">
                                      {expText}
                                    </p>
                                  </div>
                                )}

                                {/* Pretensión y Condiciones Grid */}
                                <div className="grid grid-cols-3 gap-1.5 p-2 rounded-xl bg-black/40 border border-white/5 text-[9.5px]">
                                  <div>
                                    <span className="text-[8px] uppercase text-[#879391] block font-bold">Pretensión</span>
                                    <span className="font-bold text-[#6bd8cb]">{pret.pretension_salarial || "N/E"}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] uppercase text-[#879391] block font-bold">Disponibilidad</span>
                                    <span className="font-bold text-white">{pret.disponibilidad || "N/E"}</span>
                                  </div>
                                  <div>
                                    <span className="text-[8px] uppercase text-[#879391] block font-bold">Modalidad</span>
                                    <span className="font-bold text-[#c4c1fb]">{pret.modalidad_preferida || "N/E"}</span>
                                  </div>
                                </div>

                                {/* Auditoría de Veracidad */}
                                {(incs.length > 0 || forts.length > 0) && (
                                  <div className="space-y-1.5 pt-1 border-t border-white/5">
                                    <span className="text-[9px] uppercase font-bold text-amber-400 block flex items-center gap-1">
                                      <ShieldCheck className="w-3 h-3 text-amber-400" />
                                      Auditoría de Veracidad
                                    </span>
                                    {incs.length > 0 && (
                                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-200 text-[9.5px] space-y-1">
                                        <span className="font-bold text-rose-400 block">Inconsistencias:</span>
                                        <ul className="list-disc pl-3 space-y-0.5">
                                          {incs.map((inc: string, idx: number) => (
                                            <li key={idx}>{inc}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                    {forts.length > 0 && (
                                      <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-200 text-[9.5px] space-y-1">
                                        <span className="font-bold text-emerald-400 block">Fortalezas Validadas:</span>
                                        <ul className="list-disc pl-3 space-y-0.5">
                                          {forts.map((fort: string, idx: number) => (
                                            <li key={idx}>{fort}</li>
                                          ))}
                                        </ul>
                                      </div>
                                    )}
                                  </div>
                                )}

                              </div>
                            </div>
                          );
                        })() : (
                          <span className="text-[#879391]/40 text-[10px] italic block">Sin entrevista de screening IA</span>
                        )}
                      </td>
                      {/* Columna Resumen: Test Personalidad (P-EVA-01) */}
                      <td className="py-4 px-5 min-w-[240px] max-w-[300px]">
                        {cad.test_personalidad && cad.test_personalidad.arquetipo_codigo ? (
                          <div className="p-2.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-[#9b5de5]/30 transition-all space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#9b5de5]/20 border border-[#9b5de5]/30 text-[9.5px] font-bold text-[#c4c1fb]">
                                <Brain className="w-3 h-3 text-[#9b5de5]" />
                                <span>{cad.test_personalidad.arquetipo_codigo}</span>
                              </span>
                              {cad.test_personalidad.arquetipo_nombre && (
                                <span className="text-[9.5px] font-bold text-white/90 truncate">
                                  "{cad.test_personalidad.arquetipo_nombre}"
                                </span>
                              )}
                            </div>
                            {cad.test_personalidad.analisis_encaje && (
                              <p className="text-[10px] text-[#879391] line-clamp-1 italic">
                                "{cad.test_personalidad.analisis_encaje}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-[#879391]/40 text-[10px] italic block">Sin test de personalidad</span>
                        )}
                      </td>
                      {/* Columna Resumen: Assessment Técnico Manual (P-EVA-01) */}
                      <td className="py-4 px-5 min-w-[240px] max-w-[300px] relative group">
                        {cad.assessment_manual && cad.assessment_manual.resumen_texto ? (
                          <>
                            <div className="flex items-start gap-1.5 cursor-help p-2 rounded-lg bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[10px] leading-snug font-medium shadow-sm">
                              <ClipboardCheck className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                              <span className="text-white font-medium line-clamp-2 flex-grow">{cad.assessment_manual.resumen_texto}</span>
                              <span className="shrink-0 p-0.5 rounded-full bg-amber-500/20 text-amber-300 group-hover:bg-amber-400 group-hover:text-black transition-all" title="Leer todo el resumen de evaluación técnica">
                                <HelpCircle className="w-3.5 h-3.5" />
                              </span>
                            </div>

                            {/* Hover Popover despliega el contenido íntegro del resumen_texto (sin la fecha) */}
                            <div className={`absolute ${index < 2 ? 'top-full mt-2' : 'bottom-full mb-2'} left-0 hidden group-hover:block z-50 w-96 p-4 rounded-2xl glass-panel border border-amber-500/40 bg-[#101415]/95 shadow-2xl space-y-2 pointer-events-none animate-fadeIn text-left backdrop-blur-md`}>
                              <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                                <ClipboardCheck className="w-4 h-4 text-amber-400" />
                                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                                  Resumen de Evaluación Técnica
                                </h4>
                              </div>
                              <p className="text-[11px] text-white/95 leading-relaxed font-normal whitespace-pre-line">
                                {cad.assessment_manual.resumen_texto}
                              </p>
                            </div>
                          </>
                        ) : (
                          <span className="text-[#879391]/40 text-[10px] italic block">Sin evaluación técnica</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-bold text-sm text-[#c4c1fb]">
                        {cad.cNPS !== undefined ? cad.cNPS : "-"}
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="font-bold text-white font-mono bg-white/5 rounded-md px-2 py-1 inline-block border border-white/5">
                          {cad.score}%
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right min-w-[440px]">
                        <div className="flex items-center justify-end gap-1.5 text-[10px] flex-wrap">
                          {/* Detalles button */}
                          <button
                            onClick={() => handleViewDetails(cad)}
                            className="px-2.5 py-1 rounded-xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/10 hover:bg-[#6bd8cb]/20 hover:border-[#6bd8cb]/60 hover:shadow-md hover:shadow-[#6bd8cb]/10 text-[10px] font-extrabold text-[#6bd8cb] transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title="Ver expediente y detalles completos"
                          >
                            <span>Detalles</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#6bd8cb]" />
                          </button>

                          {/* PDF CV Direct View button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCv(cad.id, cad.url_cv);
                            }}
                            title={cad.url_cv ? "Ver Documento CV PDF" : "Sin CV adjunto"}
                            className={`px-2.5 py-1 rounded transition-all cursor-pointer flex items-center justify-center gap-1 font-bold shrink-0 text-[10px] ${
                              cad.url_cv
                                ? "text-[#6bd8cb] bg-white/5 border border-white/10 hover:bg-[#6bd8cb]/10 hover:border-[#6bd8cb]/30"
                                : "text-[#879391]/40 bg-white/5 border border-white/5 hover:bg-white/10"
                            }`}
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>CV</span>
                          </button>

                          {/* Diagnóstico IA */}
                          <button
                            onClick={() => handleViewDetails(cad)}
                            className="px-2.5 py-1 rounded border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 text-[#6bd8cb] font-bold hover:bg-[#6bd8cb] hover:text-[#101415] transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title="Diagnóstico Motor IA"
                          >
                            <Cpu className="w-3.5 h-3.5 text-[#6bd8cb] animate-pulse" />
                            <span>Diagnóstico IA</span>
                          </button>

                          {/* Avanzar estado */}
                          {cad.currentPhase === "05_screening" && (
                            <button
                              onClick={() => handleTransitionState(cad.id, "06_assessment")}
                              title="Avanzar estado a 06 - Assessment Técnico"
                              className="px-2.5 py-1 rounded bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb] font-bold hover:bg-[#6bd8cb] hover:text-stone-950 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                              <span>Avanzar estado</span>
                            </button>
                          )}

                          {cad.currentPhase === "06_assessment" && (
                            <button
                              onClick={() => handleTransitionState(cad.id, "05_screening")}
                              title="Volver estado a 05 - Screening"
                              className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold hover:bg-amber-500 hover:text-stone-950 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                              <span>Volver a Screen</span>
                            </button>
                          )}

                          {cad.currentPhase === "07_en_duda_evaluacion" && (
                            <button
                              onClick={() => handleTransitionState(cad.id, "06_assessment")}
                              title="Volver a Assessment"
                              className="px-2.5 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold hover:bg-amber-500 hover:text-stone-950 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                              <span>Volver a Assessment</span>
                            </button>
                          )}

                          {cad.currentPhase === "08_descartado_interno" && (
                            <button
                              onClick={() => handleTransitionState(cad.id, "05_screening")}
                              title="Reactivar candidato a 05 - Screening"
                              className="px-2.5 py-1 rounded bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                              <span>Reactivar</span>
                            </button>
                          )}

                          {/* Avanzar Fase (Fase 3: Cliente) */}
                          <button
                            onClick={() => handleAdvancePhase(cad)}
                            className="px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold hover:bg-emerald-500 hover:text-stone-950 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                            title="Avanzar a Fase 3 (Presentación al Cliente)"
                          >
                            <UserCheck className="w-3.5 h-3.5 shrink-0" />
                            <span>Avanzar Fase</span>
                          </button>
                          
                          {/* Botón En Duda */}
                          {cad.currentPhase !== "08_descartado_interno" && cad.currentPhase !== "07_en_duda_evaluacion" && (
                            <button
                              onClick={() => handleTransitionState(cad.id, "07_en_duda_evaluacion")}
                              className="px-2.5 py-1 rounded border border-amber-500/20 bg-amber-500/5 text-amber-500 hover:bg-amber-500 hover:text-white font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                              title="Marcar en duda"
                            >
                              <HelpCircle className="w-3.5 h-3.5 shrink-0" />
                              <span>En Duda</span>
                            </button>
                          )}

                          {/* Rechazar / Descartar */}
                          {cad.currentPhase !== "08_descartado_interno" && (
                            <button
                              onClick={() => handleTransitionState(cad.id, "08_descartado_interno")}
                              className="px-2 py-1 rounded border border-white/5 bg-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-[#879391] hover:text-rose-400 font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                              title="Descartar internamente"
                            >
                              <Ban className="w-3.5 h-3.5 shrink-0" />
                              <span>Rechazar</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : viewMode === "lista_entrevista" ? (
          /* Nueva Vista "Lista Entrevista" (ID: P-EVA-01) */
          <EntrevistaTable
            candidates={sortedListCandidates}
            density={density}
            handleSort={toggleSort}
            renderSortIcon={renderSortIcon}
            handleViewCv={handleViewCv}
            onOpenTranscriptModal={(cad) => {
              setSelectedCandidateForTranscript(cad);
              setIsTranscriptModalOpen(true);
            }}
            onViewDetails={handleViewDetails}
          />
        ) : (
          /* Nueva Vista "Lista Test Personalidad" (ID: P-EVA-01) */
          <TestPersonalidadTable
            candidates={sortedListCandidates}
            density={density}
            handleSort={toggleSort}
            renderSortIcon={renderSortIcon}
            handleViewCv={handleViewCv}
            onOpenAnalysisModal={(cad) => {
              setSelectedCandidateForTest(cad);
              setIsTestModalOpen(true);
            }}
            onViewDetails={handleViewDetails}
          />
        )}

      </div>

      {/* Modal Ingesta Test Personalidad CFV-V3 */}
      {selectedCandidateForTest && (
        <AnalizarTestPersonalidadModal
          isOpen={isTestModalOpen}
          onClose={() => {
            setIsTestModalOpen(false);
            setSelectedCandidateForTest(null);
          }}
          pipelineId={selectedCandidateForTest.pipeId || selectedCandidateForTest.id}
          candidateName={selectedCandidateForTest.name}
          onAnalysisComplete={() => {
            fetchBackendData();
            setToast({
              type: "success",
              message: "Test de personalidad analizado e inyectado correctamente."
            });
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}

      {/* Modal Analizar Transcripción Entrevista Screening M-TRN-01 */}
      {selectedCandidateForTranscript && (
        <AnalizarTranscripcionModal
          isOpen={isTranscriptModalOpen}
          onClose={() => {
            setIsTranscriptModalOpen(false);
            setSelectedCandidateForTranscript(null);
          }}
          pipelineId={selectedCandidateForTranscript.pipeId || selectedCandidateForTranscript.id}
          candidateName={selectedCandidateForTranscript.name}
          currentState={selectedCandidateForTranscript.currentPhase}
          initialInforme={selectedCandidateForTranscript.informe_entrevista_ia}
          onSuccess={() => {
            fetchBackendData();
            setToast({
              type: "success",
              message: "Informe de entrevista de screening procesado e inyectado correctamente."
            });
            setTimeout(() => setToast(null), 4000);
          }}
        />
      )}


      {/* Modal Emergente Mejorado: Confirmar Cambio de Fase a Cliente (Fase 3) */}
      {candidateToAdvance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div 
            className="relative w-full max-w-md bg-[#15181a] border border-[#6bd8cb]/30 rounded-3xl p-6 shadow-2xl space-y-5 text-left animate-scaleUp"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header badge & close button */}
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6bd8cb]/20 to-[#0d9488]/30 border border-[#6bd8cb]/40 flex items-center justify-center text-[#6bd8cb] shadow-lg shadow-[#6bd8cb]/10">
                <UserCheck className="w-6 h-6" />
              </div>
              <button
                onClick={() => setCandidateToAdvance(null)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content text */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#6bd8cb] uppercase tracking-wider bg-[#6bd8cb]/10 px-2.5 py-0.5 rounded-full border border-[#6bd8cb]/20 inline-block">
                Promoción de Pipeline
              </span>
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                ¿Avanzar a Fase 3 (Presentación al Cliente)?
              </h3>
              <p className="text-xs text-[#879391] leading-relaxed">
                Estás a punto de promocionar el expediente de <strong className="text-white">{candidateToAdvance.name}</strong> a <strong className="text-[#6bd8cb]">Fase 3 (Cliente / Presentación)</strong>.
              </p>
            </div>

            {/* Candidate Card Summary */}
            <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">{candidateToAdvance.name}</span>
                <span className="text-[10px] text-[#879391]">{candidateToAdvance.role} • {candidateToAdvance.client}</span>
              </div>
              <span className="px-2.5 py-1 text-[9px] font-bold rounded-full bg-[#6bd8cb]/15 text-[#6bd8cb] border border-[#6bd8cb]/30 font-mono">
                Fit {candidateToAdvance.score}%
              </span>
            </div>

            {/* Action Buttons: Cancelar & Confirmar */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
              <button
                onClick={() => setCandidateToAdvance(null)}
                className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white font-bold text-xs cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAdvancePhaseAction}
                disabled={isAdvancingPhase}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6bd8cb] to-[#0d9488] text-stone-950 hover:opacity-90 font-black text-xs cursor-pointer transition-all shadow-lg shadow-[#6bd8cb]/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                {isAdvancingPhase ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Avanzando...</span>
                  </>
                ) : (
                  <>
                    <UserCheck className="w-4 h-4" />
                    <span>Confirmar y Avanzar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Feedback Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 bg-[#15181a] border border-[#6bd8cb]/40 text-[#6bd8cb] px-4.5 py-3 rounded-2xl shadow-2xl backdrop-blur-md animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-[#6bd8cb]" />
          <span className="text-xs font-bold text-white">{toast.message}</span>
        </div>
      )}

    </div>
  );
}

// Side Components
function KanbanCard({ 
  cad, 
  onSelect, 
  onTransition,
  onAdvancePhase,
  onDragStart,
  onViewCv
}: { 
  cad: EvaluacionCandidate; 
  onSelect: (cad: EvaluacionCandidate) => void;
  onTransition: (id: string, phase: EvaluacionCandidate["currentPhase"]) => void;
  onAdvancePhase: (cad: EvaluacionCandidate) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onViewCv: (id: string, urlCv?: string) => void;
}) {
  const getWipTimerStatus = (entryIso: string) => {
    const entry = new Date(entryIso);
    const hours = (Date.now() - entry.getTime()) / (1000 * 60 * 60);
    return {
      hours: Math.round(hours),
      isDelayed: hours > 48
    };
  };

  const timer = getWipTimerStatus(cad.entryDate);

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, cad.id)}
      className="p-4 rounded-xl border border-white/10 bg-[#15181a]/40 hover:bg-[#15181a]/95 hover:border-white/20 transition-all duration-200 group flex flex-col space-y-3.5 relative overflow-hidden cursor-grab active:cursor-grabbing text-left"
    >
      <div className="flex justify-between items-start">
        <span className="text-[9px] font-mono text-[#879391]">{cad.id}</span>
        
        <div className="flex items-center gap-1">
          <Clock className={`w-3.5 h-3.5 ${timer.isDelayed ? "text-rose-455 animate-pulse" : "text-[#c4c1fb]"}`} />
          <span className={`text-[9px] font-bold ${timer.isDelayed ? "text-rose-400" : "text-[#879391]"}`} title="Horas acumuladas en evaluación">
            {timer.hours}h WIP
          </span>
        </div>
      </div>

      <div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(cad);
          }}
          className="hover:underline cursor-pointer text-left inline-block"
          title="Ver expediente y detalles completos del candidato"
        >
          <h3 className="text-xs font-bold text-white tracking-tight group-hover:text-[#6bd8cb] transition-colors break-words">
            {cad.name}
          </h3>
        </button>
        <p className="text-[10px] text-[#c4c1fb] mt-0.5 font-medium leading-normal">{cad.role}</p>
      </div>

      <div className="space-y-1 pt-1.5 border-t border-white/5 text-[9px] text-[#879391]">
        <div className="flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-[#c4c1fb]/60" />
          <span className="truncate">{cad.client}</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          <MapPin className="w-3.5 h-3.5 text-[#6bd8cb]/60" />
          <span className="truncate">{cad.location}</span>
        </div>
      </div>

      {/* Recruiter Notes / Notas Evaluación (Destacado y POR ENCIMA de Actividad Reciente) */}
      {cad.recruiterNotes && (
        <div className="text-[9px] leading-relaxed p-2 rounded-lg bg-[#6bd8cb]/10 border border-[#6bd8cb]/30 text-[#6bd8cb] shadow-sm">
          <div className="flex items-center gap-1 uppercase font-bold text-[8px] mb-0.5 text-[#6bd8cb]">
            <FileText className="w-3 h-3 text-[#6bd8cb] shrink-0" />
            <span>NOTAS RECLUTADOR:</span>
          </div>
          <p className="font-semibold text-white/90">{cad.recruiterNotes}</p>
        </div>
      )}

      {/* Transcripción de Entrevista IA summary badge */}
      {cad.informe_entrevista_ia && (
        <div className="p-2 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[10px] space-y-1 text-left">
          <div className="flex items-center justify-between">
            <span className="font-bold text-[#6bd8cb] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Transcripción IA
            </span>
            {cad.informe_entrevista_ia.pretension_economica_condiciones?.pretension_salarial && (
              <span className="text-[9px] font-mono text-emerald-300 font-bold">
                {cad.informe_entrevista_ia.pretension_economica_condiciones.pretension_salarial}
              </span>
            )}
          </div>
          {cad.informe_entrevista_ia.pretension_economica_condiciones?.modalidad_preferida && (
            <div className="text-[9px] text-[#c4c1fb]">
              Modalidad: {cad.informe_entrevista_ia.pretension_economica_condiciones.modalidad_preferida}
            </div>
          )}
        </div>
      )}

      {/* Test de Personalidad summary badge (CFV-V3) */}
      {cad.test_personalidad && cad.test_personalidad.arquetipo_codigo && (
        <div className="p-2 rounded-xl bg-[#9b5de5]/10 border border-[#9b5de5]/30 text-[10px] space-y-1 text-left shadow-sm">
          <div className="flex items-center justify-between gap-1.5">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#9b5de5]/20 border border-[#9b5de5]/30 text-[9.5px] font-bold text-[#c4c1fb]">
              <Brain className="w-3 h-3 text-[#9b5de5]" />
              <span>{cad.test_personalidad.arquetipo_codigo}</span>
            </span>
            {cad.test_personalidad.arquetipo_nombre && (
              <span className="text-[9.5px] font-bold text-white/90 truncate">
                "{cad.test_personalidad.arquetipo_nombre}"
              </span>
            )}
          </div>
          {cad.test_personalidad.analisis_encaje && (
            <p className="text-[9.5px] text-[#879391] line-clamp-2 italic leading-relaxed">
              "{cad.test_personalidad.analisis_encaje}"
            </p>
          )}
        </div>
      )}

      {/* Assessment Técnico Manual summary badge */}
      {cad.assessment_manual && cad.assessment_manual.resumen_texto && (
        <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[10px] space-y-1 text-left shadow-sm">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[9.5px]">
            <ClipboardCheck className="w-3.5 h-3.5 shrink-0" />
            <span>Assessment Técnico:</span>
          </div>
          <p className="text-[9.5px] text-white/90 line-clamp-2 leading-relaxed font-normal">
            {cad.assessment_manual.resumen_texto}
          </p>
        </div>
      )}

      {/* Screening brief details */}
      <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
        <span className="text-[8px] font-bold tracking-wider text-white/40 uppercase block">Actividad Reciente</span>
        <p className="text-[9px] text-[#879391] leading-relaxed truncate">{cad.lastActivity}</p>
      </div>

      {/* Advanced diagnostics trigger button */}
      <button
        onClick={() => onSelect(cad)}
        className="w-full py-1.5 rounded-xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/10 hover:bg-[#6bd8cb]/20 hover:border-[#6bd8cb]/60 hover:shadow-md hover:shadow-[#6bd8cb]/10 transition-all text-[10px] font-extrabold text-[#6bd8cb] flex items-center justify-center gap-1 cursor-pointer"
        title="Ver expediente y detalles completos del candidato"
      >
        <span>Detalles</span>
        <ChevronRight className="w-3.5 h-3.5 text-[#6bd8cb]" />
      </button>

      {/* Footer controls quick shifts: Detalles, Avanzar estado, Avanzar Fase, Rechazar */}
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
        {/* Detalles button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onSelect(cad);
          }}
          className="px-2.5 py-1 rounded-xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/10 hover:bg-[#6bd8cb]/20 hover:border-[#6bd8cb]/60 hover:shadow-md hover:shadow-[#6bd8cb]/10 text-[10px] font-extrabold text-[#6bd8cb] transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
          title="Ver expediente y detalles completos del candidato"
        >
          <span>Detalles</span>
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-[#6bd8cb]" />
        </button>

        {/* PDF CV Direct View button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewCv(cad.id, cad.url_cv);
          }}
          title={cad.url_cv ? "Ver Documento CV PDF" : "Sin CV adjunto"}
          className={`px-2 py-1 rounded transition-all cursor-pointer flex items-center justify-center gap-1 font-bold shrink-0 text-[9px] ${
            cad.url_cv
              ? "text-[#6bd8cb] bg-white/5 border border-white/10 hover:bg-[#6bd8cb]/10 hover:border-[#6bd8cb]/30"
              : "text-[#879391]/40 bg-white/5 border border-white/5 hover:bg-white/10"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>CV</span>
        </button>

        {/* Avanzar estado button */}
        {cad.currentPhase === "05_screening" && (
          <button
            onClick={() => onTransition(cad.id, "06_assessment")}
            title="Avanzar estado a 06 - Assessment Técnico"
            className="px-2 py-1 rounded bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 hover:bg-[#6bd8cb]/35 text-[#6bd8cb] font-bold text-[9px] flex items-center justify-center gap-1 flex-grow cursor-pointer whitespace-nowrap"
          >
            <ChevronsRight className="w-3 h-3 shrink-0" />
            <span>Avanzar estado</span>
          </button>
        )}

        {cad.currentPhase === "06_assessment" && (
          <button
            onClick={() => onTransition(cad.id, "05_screening")}
            title="Volver estado a 05 - Screening"
            className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 text-amber-400 font-bold text-[9px] flex items-center justify-center gap-1 flex-grow cursor-pointer whitespace-nowrap"
          >
            <ChevronsRight className="w-3 h-3 shrink-0" />
            <span>Volver a Screen</span>
          </button>
        )}

        {cad.currentPhase === "07_en_duda_evaluacion" && (
          <button
            onClick={() => onTransition(cad.id, "06_assessment")}
            title="Volver a Assessment"
            className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 text-amber-400 font-bold text-[9px] flex items-center justify-center gap-1 flex-grow cursor-pointer whitespace-nowrap"
          >
            <ChevronsRight className="w-3 h-3 shrink-0" />
            <span>Volver a Assessment</span>
          </button>
        )}

        {cad.currentPhase === "08_descartado_interno" && (
          <button
            onClick={() => onTransition(cad.id, "05_screening")}
            title="Reactivar candidato a 05 - Screening"
            className="px-2 py-1 rounded bg-indigo-500/15 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500 hover:text-white font-bold text-[9px] flex items-center justify-center gap-1 flex-grow text-center transition-all cursor-pointer whitespace-nowrap"
          >
            <ChevronsRight className="w-3 h-3 shrink-0" />
            <span>Reactivar</span>
          </button>
        )}

        {/* Avanzar Fase (Fase 3: Cliente / Presentación) */}
        <button
          onClick={() => onAdvancePhase(cad)}
          className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-stone-950 font-bold text-[9px] flex items-center justify-center gap-1 flex-grow cursor-pointer transition-all whitespace-nowrap"
          title="Avanzar a Fase 3 (Presentación al Cliente)"
        >
          <UserCheck className="w-3.5 h-3.5 shrink-0" />
          <span>Avanzar Fase</span>
        </button>

        {/* Discard button */}
        {cad.currentPhase !== "08_descartado_interno" && (
          <button
            onClick={() => onTransition(cad.id, "08_descartado_interno")}
            className="px-2 py-1 rounded border border-white/5 bg-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-[#879391] hover:text-rose-400 text-[9px] font-bold transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
            title="Descartar internamente"
          >
            <Ban className="w-3 h-3 shrink-0" />
            <span>Rechazar</span>
          </button>
        )}
      </div>

    </div>
  );
}

function EmptyColumnText({ text }: { text: string }) {
  return (
    <div className="h-44 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl p-4 text-center">
      <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
        {text}
      </span>
    </div>
  );
}
