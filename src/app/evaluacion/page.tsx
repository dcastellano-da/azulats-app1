'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
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
  ChevronsRight
} from "lucide-react";
import { 
  EvaluacionCandidate, 
  INITIAL_EVALUACION_CANDIDATES, 
  calculateEvaluacionKPIs 
} from "@/lib/evaluacion";
import { getBusquedasAPI, Busqueda } from "@/actions/busquedas";
import { getCandidatosAPI, Candidato } from "@/actions/candidatos";
import { getPipelineAPI, PipelineItem, actualizarPipelineAPI } from "@/actions/pipeline";

const generateDefaultToolsDetails = (candName: string, role: string, score: number) => {
  const isRust = role.toLowerCase().includes("rust") || role.toLowerCase().includes("architect");
  const isSenior = role.toLowerCase().includes("lead") || role.toLowerCase().includes("senior") || role.toLowerCase().includes("architect");
  
  return {
    sintetizador: {
      pros: [
        `Sólida trayectoria alineada con la posición de ${role}.`,
        "Capacidad comunicativa fluida en entornos multiculturales.",
        "Buen desempeño demostrado en la resolución de problemas técnicos complejos."
      ],
      contras: [
        "Requiere breve período de adaptación a las herramientas internas específicas del cliente."
      ],
      riesgos: [
        "Disponibilidad sujeta a preaviso de 15 días en su empresa actual."
      ]
    },
    inconsistencias: {
      hasGaps: false,
      gaps: [],
      overlaps: []
    },
    preguntas: [
      `¿Cómo abordas la optimización y escalabilidad en arquitecturas para ${role}?`,
      "Describe un proyecto donde tuviste que tomar decisiones críticas bajo presión.",
      "¿Cuál es tu enfoque para la entrega continua y colaboración con equipos de producto?"
    ],
    validador: {
      ip: "185.220.101.5",
      location: "España / Remoto",
      envStatus: "Ambiente limpio verificado. Sin señales de software no autorizado.",
      verificationStatus: "success" as const
    },
    copilot: {
      activeSession: true,
      difficultyLevel: isSenior ? ("Senior" as const) : ("Middle" as const),
      completionRate: Math.min(100, score + 5),
      effortScore: Math.round(((score / 20) + Number.EPSILON) * 10) / 10,
      languageUsed: isRust ? "Rust / WebAssembly" : "TypeScript / React",
      summary: `${candName} completó la sesión de Live Coding con un desempeño sólido (${score}% fit score). Código limpio y estructurado.`
    }
  };
};

const mapPipelineToEvaluacionCandidates = (
  pipelineItems: PipelineItem[],
  candidatosList: Candidato[],
  busquedasList: Busqueda[]
): EvaluacionCandidate[] => {
  const candMap = new Map(candidatosList.map(c => [c.id, c]));
  const busqMap = new Map(busquedasList.map(b => [b.id, b]));

  const result: EvaluacionCandidate[] = [];

  for (const pipe of pipelineItems) {
    const cand = candMap.get(pipe.claves_conexion?.id_candidato);
    const busq = busqMap.get(pipe.claves_conexion?.id_busqueda);

    const stateStr = (pipe.flujo?.estado_actual || "").toLowerCase();
    
    let currentPhase: EvaluacionCandidate["currentPhase"] = "05_screening";
    if (stateStr.includes("05") || stateStr.includes("screening")) {
      currentPhase = "05_screening";
    } else if (stateStr.includes("06") || stateStr.includes("assessment") || stateStr.includes("prueba")) {
      currentPhase = "06_assessment";
    } else if (stateStr.includes("07") || stateStr.includes("descartado")) {
      currentPhase = "07_descartado_interno";
    } else {
      currentPhase = "05_screening";
    }

    const candName = cand?.nombre_completo || "Candidato";
    const role = cand?.puesto || busq?.perfil_busqueda || "Especialista Tech";
    const client = busq?.cliente || "Cliente";
    const location = cand?.ubicacion || "España / Remoto";
    const score = pipe.f1_descubrimiento?.analisis_semantico?.fit_score ?? pipe.evaluacion?.puntaje_tecnico ?? 85;
    const entryDate = pipe.flujo?.fecha_ultimo_cambio || pipe.createdAt || new Date().toISOString();
    const email = cand?.email || "candidato@email.com";
    const contactNumber = cand?.telefono_movil || "+34 600 000 000";
    const recruiterNotes = pipe.f1_descubrimiento?.notas_reclutador || cand?.notas_iniciales || undefined;

    result.push({
      id: cand?.id || pipe.claves_conexion?.id_candidato || pipe.id,
      pipeId: pipe.id,
      name: candName,
      role,
      client,
      location,
      score,
      currentPhase,
      entryDate,
      cNPS: 9,
      lastActivity: pipe.flujo?.fecha_ultimo_cambio 
        ? `Último cambio: ${new Date(pipe.flujo.fecha_ultimo_cambio).toLocaleDateString("es-ES")}` 
        : "Registro sincronizado desde backend",
      experienceYears: 5,
      contactNumber,
      email,
      recruiterNotes,
      toolsDetails: generateDefaultToolsDetails(candName, role, score)
    });
  }

  return result;
};

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
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Details slide-over
  const [activeCandidate, setActiveCandidate] = useState<EvaluacionCandidate | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "sintetizador" | "inconsistencias" | "preguntas" | "validador" | "copilot">("general");
  
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
          const promises = searchesList.map(s => getPipelineAPI(s.id));
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
        const match = searchesList.find(s => `${s.cliente} - ${s.perfil_busqueda}` === selectedSearch);
        if (match) {
          const res = await getPipelineAPI(match.id);
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
    if (activeCandidate && activeCandidate.id === id) {
      setActiveCandidate((prev) => prev ? { ...prev, currentPhase: targetPhase, lastActivity: `Estado cambiado a ${label}` } : null);
    }

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
      case "07_descartado_interno": return "07 - Descartado (Interno)";
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
        const nuevoEstado = "08_presentado_cliente";
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
          if (activeCandidate?.id === candidateToAdvance.id) {
            setActiveCandidate(null);
          }
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
      if (activeCandidate) {
        setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
          ...c,
          toolsDetails: {
            ...c.toolsDetails,
            copilot: {
              ...c.toolsDetails.copilot,
              completionRate: 95,
              effortScore: 4.8,
              summary: "Simulación de Codificación Completa con éxito. Desempeño sólido validado por el Evaluador Co-Pilot en tiempo real (métrica cruzada con requerimientos)."
            }
          }
        } : c));
        setActiveCandidate(prev => prev ? {
          ...prev,
          toolsDetails: {
            ...prev.toolsDetails,
            copilot: {
              ...prev.toolsDetails.copilot,
              completionRate: 95,
              effortScore: 4.8,
              summary: "Simulación de Codificación Completa con éxito. Desempeño sólido validado por el Evaluador Co-Pilot en tiempo real (métrica cruzada con requerimientos)."
            }
          }
        } : null);
      }
    }, 2500);
  };

  const triggerValidadorSimulation = () => {
    setIsSimulatingValidadorCheck(true);
    setSimulatedValidadorSuccess(null);
    setTimeout(() => {
      setIsSimulatingValidadorCheck(false);
      const isSuccess = Math.random() > 0.3;
      setSimulatedValidadorSuccess(isSuccess);
      if (activeCandidate) {
        setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
          ...c,
          toolsDetails: {
            ...c.toolsDetails,
            validador: {
              ...c.toolsDetails.validador,
              verificationStatus: isSuccess ? "success" : "fail",
              envStatus: isSuccess 
                ? "Entorno de red verificado sin proxies sospechosos ni compartición de pantallas de terceros." 
                : "Advertencia: Múltiples pantallas detectadas en llamadas de WebRTC activas."
            }
          }
        } : c));
        setActiveCandidate(prev => prev ? {
          ...prev,
          toolsDetails: {
            ...prev.toolsDetails,
            validador: {
              ...prev.toolsDetails.validador,
              verificationStatus: isSuccess ? "success" : "fail",
              envStatus: isSuccess 
                ? "Entorno de red verificado sin proxies sospechosos ni compartición de pantallas de terceros." 
                : "Advertencia: Múltiples pantallas detectadas en llamadas de WebRTC activas."
            }
          }
        } : null);
      }
    }, 2000);
  };

  // Filter logic
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSearchFilter = 
      selectedSearch === "Todos" || `${c.client} - ${c.role}` === selectedSearch;

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
  const countDescartados = candidates.filter((c) => c.currentPhase === "07_descartado_interno").length;

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
        <section className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col xl:flex-row gap-4 justify-between items-center text-left">
          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center">
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs xl:w-72">
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
                onChange={(e) => setSelectedSearch(e.target.value)}
                className="bg-[#101415]/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb] cursor-pointer w-full md:w-auto"
              >
                <option value="Todos" className="bg-[#15181a]">Todas las Búsquedas</option>
                {activeBusquedas.map((b) => (
                  <option key={b.id} value={`${b.cliente} - ${b.perfil_busqueda}`} className="bg-[#15181a] text-white">
                    {b.cliente} - {b.perfil_busqueda}
                  </option>
                ))}
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
                  <option value="07_descartado_interno" className="bg-[#15181a]">07 - Descartado (Interno)</option>
                </select>
              </div>
            )}
          </div>

          {/* Toggle buttons for viewMode and Fullscreen */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-center md:justify-end">
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
            </div>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isFullScreen
                  ? "bg-[#6bd8cb]/15 border-[#6bd8cb]/30 text-[#6bd8cb] hover:bg-[#6bd8cb]/25 shadow-sm"
                  : "bg-white/5 border-white/10 text-[#c4c1fb]/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Restaurar</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Pantalla Completa</span>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            
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
                  <KanbanCard key={cad.id} cad={cad} onSelect={setActiveCandidate} onTransition={handleTransitionState} onAdvancePhase={handleAdvancePhase} onDragStart={handleDragStart} />
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
                  <KanbanCard key={cad.id} cad={cad} onSelect={setActiveCandidate} onTransition={handleTransitionState} onAdvancePhase={handleAdvancePhase} onDragStart={handleDragStart} />
                ))}
                {countAssessment === 0 && <EmptyColumnText text="Ningún assessment activo" />}
              </div>
            </div>

            {/* COLUMN 3: Discarded */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "07_descartado_interno")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-rose-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">07 - DESCARTADO (INTERNO)</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">No cumple con barra mínima</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-rose-400">
                  {countDescartados}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "07_descartado_interno").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={setActiveCandidate} onTransition={handleTransitionState} onAdvancePhase={handleAdvancePhase} onDragStart={handleDragStart} />
                ))}
                {countDescartados === 0 && <EmptyColumnText text="Ningún descarte" />}
              </div>
            </div>

          </div>
        ) : (
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
                  <th className="px-5 py-4">
                    Notas Reclutador
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white text-center" onClick={() => toggleSort("cnps")}>
                    cNPS {renderSortIcon("cnps")}
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white text-center" onClick={() => toggleSort("score")}>
                    Fit Score {renderSortIcon("score")}
                  </th>
                  <th className="px-5 py-4 text-right">Acciones & Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {sortedListCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-8 text-center text-[#879391] bg-white/5">
                      No se encontraron candidatos evaluados que coincidan con los criterios establecidos.
                    </td>
                  </tr>
                ) : (
                  sortedListCandidates.map((cad) => (
                    <tr key={cad.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{cad.name}</div>
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
                      <td className="py-4 px-5 min-w-[240px] max-w-[300px]">
                        {cad.recruiterNotes ? (
                          <div className="p-2 rounded-lg bg-[#6bd8cb]/10 border border-[#6bd8cb]/25 text-[#6bd8cb] text-[10px] leading-snug font-medium shadow-sm flex items-start gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-[#6bd8cb] shrink-0 mt-0.5" />
                            <span className="text-white font-medium line-clamp-3">{cad.recruiterNotes}</span>
                          </div>
                        ) : (
                          <span className="text-[#879391]/50 text-[10px] italic">Sin notas de evaluación</span>
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
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-[10px] flex-wrap">
                          {/* Detalles button */}
                          <button
                            onClick={() => {
                              setActiveCandidate(cad);
                              setActiveTab("general");
                            }}
                            className="px-2.5 py-1 rounded border border-[#c4c1fb]/20 bg-[#c4c1fb]/5 text-[#c4c1fb] font-bold hover:bg-[#c4c1fb] hover:text-[#101415] transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title="Ver expediente y detalles completos"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalles</span>
                          </button>

                          {/* Diagnóstico IA */}
                          <button
                            onClick={() => {
                              setActiveCandidate(cad);
                              setActiveTab("sintetizador");
                            }}
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

                          {cad.currentPhase === "07_descartado_interno" && (
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

                          {/* Rechazar / Descartar */}
                          {cad.currentPhase !== "07_descartado_interno" && (
                            <button
                              onClick={() => handleTransitionState(cad.id, "07_descartado_interno")}
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
        )}

      </div>

      {/* Advanced AI Tools Panel / Drawer Sidebar */}
      {activeCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-end pointer-events-auto">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-[#000000]/60 backdrop-blur-sm transition-opacity duration-300 animate-fadeIn" 
            onClick={() => setActiveCandidate(null)}
          />

          {/* Slider content drawer container */}
          <aside className="absolute top-0 right-0 h-full w-full max-w-3xl bg-[#15181a] border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] animate-slideIn">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 bg-[#101415]/90 backdrop-blur-md flex justify-between items-center text-left">
              <div>
                <span className="text-[9px] font-mono text-[#6bd8cb] bg-[#6bd8cb]/15 px-2.5 py-0.5 rounded border border-[#6bd8cb]/25 uppercase font-bold tracking-widest inline-block mb-1">
                  MÓDULO DE SELECCIÓN F2
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Expediente de {activeCandidate.name}</span>
                  <span className="px-2 py-0.5 text-xs text-white/40 font-mono bg-white/5 rounded-md border border-white/10">
                    {activeCandidate.id}
                  </span>
                </h2>
                <p className="text-[10px] text-[#879391] mt-0.5">
                  Herramientas operativas avanzadas y diagnóstico libre de sesgos en el filtro interno.
                </p>
              </div>
              <button
                onClick={() => setActiveCandidate(null)}
                className="w-10 h-10 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white transition-all text-[#c4c1fb] flex items-center justify-center cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* TAB SELECTORS */}
            <nav className="flex items-center overflow-x-auto bg-[#101415]/40 border-b border-white/5 px-4 py-1 gap-1 select-none">
              <button 
                onClick={() => setActiveTab("general")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "general" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
                }`}
              >
                1. General & Info
              </button>
              <button 
                onClick={() => setActiveTab("sintetizador")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "sintetizador" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <FileText className="w-3 h-3" />
                <span>5. Sintetizador</span>
              </button>
              <button 
                onClick={() => setActiveTab("inconsistencias")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "inconsistencias" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <AlertTriangle className="w-3 h-3 text-[#ffb4ab]" />
                <span>6. Detector Crono</span>
              </button>
              <button 
                onClick={() => setActiveTab("preguntas")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "preguntas" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>7. Preguntas STAR</span>
              </button>
              <button 
                onClick={() => setActiveTab("validador")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "validador" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>8. Validador Identidad</span>
              </button>
              <button 
                onClick={() => setActiveTab("copilot")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "copilot" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <Code className="w-3 h-3 text-[#6bd8cb]" />
                <span>Co-Pilot adaptativo</span>
              </button>
            </nav>

            {/* TAB PREVIEW BODY */}
            <div className="flex-grow overflow-y-auto p-6 space-y-6 text-white text-left">
              
              {/* TAB 1: GENERAL PROFILE DETAILS */}
              {activeTab === "general" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Basic Card Profile Info */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.01] flex flex-col md:flex-row gap-5 items-start md:items-center">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#9b5de5] to-[#6bd8cb] p-0.5 shadow-md self-center">
                      <div className="w-full h-full bg-[#15181a] rounded-2xl flex items-center justify-center text-xl font-extrabold text-[#6bd8cb]">
                        {activeCandidate.name.charAt(0)}
                      </div>
                    </div>
                    <div className="space-y-1 flex-grow">
                      <h3 className="text-lg font-bold text-white">{activeCandidate.name}</h3>
                      <p className="text-xs text-[#c4c1fb] font-semibold">{activeCandidate.role}</p>
                      <div className="text-[10px] text-[#879391] flex items-center gap-1.5 flex-wrap">
                        <span className="flex items-center gap-1 border border-white/5 bg-white/5 rounded px-2.5 py-0.5">
                          <Building2 className="w-3 h-3" />
                          {activeCandidate.client}
                        </span>
                        <span className="flex items-center gap-1 border border-white/5 bg-white/5 rounded px-2.5 py-0.5">
                          <MapPin className="w-3 h-3" />
                          {activeCandidate.location}
                        </span>
                      </div>
                    </div>
                    <div className="text-right self-stretch flex flex-col justify-between items-end gap-2 border-t border-white/5 md:border-t-0 pt-3.5 md:pt-0">
                      <span className="text-[10px] text-[#879391] block uppercase font-extrabold tracking-widest">
                        Fit Score
                      </span>
                      <div className="text-2xl font-black text-[#6bd8cb] bg-[#6bd8cb]/10 px-3 py-1.5 rounded-xl border border-[#6bd8cb]/20 font-mono">
                        {activeCandidate.score}%
                      </div>
                    </div>
                  </div>

                  {/* Metadata fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1">
                      <span className="text-[9px] text-[#879391] uppercase tracking-wider font-bold">Información de contacto</span>
                      <div className="space-y-1.5 text-xs">
                        <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#6bd8cb]" />{activeCandidate.contactNumber}</p>
                        <p className="flex items-center gap-2 text-wrap truncate"><Mail className="w-3.5 h-3.5 text-[#c4c1fb]" />{activeCandidate.email}</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-1">
                      <span className="text-[9px] text-[#879391] uppercase tracking-wider font-bold">Estado actual & Retención</span>
                      <div className="space-y-1 text-xs">
                        <p className="font-semibold text-white">Estado: <span className="text-[#c4c1fb]">{getPhaseLabel(activeCandidate.currentPhase).substring(5)}</span></p>
                        <p className="text-[#879391]">Ingresó al WIP: {new Date(activeCandidate.entryDate).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  {/* Decision workflow block */}
                  <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] space-y-3.5">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2.5">
                      <Zap className="w-4 h-4 text-[#6bd8cb]" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Avanzar o Modificar Fase</h4>
                    </div>

                    <p className="text-xs text-[#879391] leading-relaxed">
                      Elige el estado del candidato en el flujo interno de evaluación técnica de la agencia:
                    </p>

                    <div className="flex flex-wrap gap-2.5 pt-1">
                      <button
                        onClick={() => handleTransitionState(activeCandidate.id, "05_screening")}
                        disabled={activeCandidate.currentPhase === "05_screening"}
                        className="px-3.5 py-2.5 rounded-xl border border-amber-500/25 bg-amber-500/5 text-amber-400 hover:bg-amber-500 hover:text-stone-950 font-bold text-xs disabled:opacity-30 disabled:hover:bg-amber-500/5 disabled:hover:text-amber-400 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Mover a Screening
                      </button>

                      <button
                        onClick={() => handleTransitionState(activeCandidate.id, "06_assessment")}
                        disabled={activeCandidate.currentPhase === "06_assessment"}
                        className="px-3.5 py-2.5 rounded-xl border border-[#6bd8cb]/25 bg-[#6bd8cb]/5 text-[#6bd8cb] hover:bg-[#6bd8cb] hover:text-[#101415] font-bold text-xs disabled:opacity-30 disabled:hover:bg-[#6bd8cb]/5 disabled:hover:text-[#6bd8cb] disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Mover a Assessment
                      </button>

                      <button
                        onClick={() => handleTransitionState(activeCandidate.id, "07_descartado_interno")}
                        disabled={activeCandidate.currentPhase === "07_descartado_interno"}
                        className="px-3.5 py-2.5 rounded-xl border border-rose-500/25 bg-rose-500/5 text-rose-450 hover:bg-rose-550 hover:text-white font-bold text-xs disabled:opacity-30 disabled:hover:bg-rose-500/5 disabled:hover:text-rose-450 disabled:cursor-not-allowed transition-all cursor-pointer"
                      >
                        Marcar como Descartado
                      </button>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 5: SINTETIZADOR DE ENTREVISTAS */}
              {activeTab === "sintetizador" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-xl border border-white/5 bg-[#6bd8cb]/5 text-[11px] text-white/90">
                    <span className="font-bold text-[#6bd8cb]">Herramienta 5: Sintetizador de Entrevistas</span>
                    <p className="mt-0.5 text-[#879391] leading-relaxed">
                      Cruza de forma inteligente el manuscrito de la llamada inicial del reclutador, sus notas improvisadas en la agenda y la descripción vacante de la búsqueda.
                    </p>
                  </div>

                  <div className="space-y-4">
                    {/* PROS */}
                    <div className="p-4.5 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] space-y-2">
                      <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">Puntos Fuertes (Pros)</span>
                      <ul className="list-disc pl-4 text-xs space-y-1.5 text-white/80">
                        {activeCandidate.toolsDetails.sintetizador.pros.map((pro, index) => (
                          <li key={index}>{pro}</li>
                        ))}
                      </ul>
                    </div>

                    {/* CONTRAS */}
                    <div className="p-4.5 rounded-xl border border-amber-500/10 bg-amber-500/[0.01] space-y-2">
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Déficit o Brechas Técnicas (Cons)</span>
                      <ul className="list-disc pl-4 text-xs space-y-1.5 text-white/80">
                        {activeCandidate.toolsDetails.sintetizador.contras.map((con, index) => (
                          <li key={index}>{con}</li>
                        ))}
                      </ul>
                    </div>

                    {/* RIESGOS */}
                    <div className="p-4.5 rounded-xl border border-rose-500/10 bg-rose-500/[0.01] space-y-2">
                      <span className="text-[10px] text-rose-400 font-bold uppercase tracking-wider block">Señales de Alerta (Riesgos)</span>
                      <ul className="list-disc pl-4 text-xs space-y-1.5 text-white/80">
                        {activeCandidate.toolsDetails.sintetizador.riesgos.map((risk, index) => (
                          <li key={index}>{risk}</li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>
              )}

              {/* TAB 6: DETECTOR DE INCONSISTENCIAS CRONOLOGICAS */}
              {activeTab === "inconsistencias" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-xl border border-white/5 bg-rose-950/20 text-[11px] text-white/90">
                    <span className="font-bold text-rose-450">Herramienta 6: Detector de Inconsistencias Cronológicas</span>
                    <p className="mt-0.5 text-[#879391]">
                      Analiza secuencias entre fechas de empleos listados en la hoja de vida (PDF/Doc) para alertar sobre huecos prolongados o solapamientos.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-black block">Análisis de consistencia</span>
                    
                    {!activeCandidate.toolsDetails.inconsistencias.hasGaps && activeCandidate.toolsDetails.inconsistencias.overlaps.length === 0 ? (
                      <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center flex flex-col items-center justify-center gap-2">
                        <Check className="w-8 h-8 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">Línea temporal impecable</span>
                        <p className="text-xs text-[#879391] max-w-sm">No se detectaron brechas desocupadas ni períodos superpuestos en su trayectoria.</p>
                      </div>
                    ) : (
                      <div className="space-y-3.5">
                        {/* Gaps */}
                        {activeCandidate.toolsDetails.inconsistencias.gaps.map((gap, index) => (
                          <div key={index} className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/[0.03] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-rose-450 bg-rose-500/10 px-2 py-0.5 rounded font-black uppercase">Hueco temporal detectado</span>
                              <span className="text-xs font-mono font-bold text-white">{gap.period} ({gap.duration})</span>
                            </div>
                            <p className="text-xs text-[#879391] italic">"{gap.description}"</p>
                          </div>
                        ))}

                        {/* Overlaps */}
                        {activeCandidate.toolsDetails.inconsistencias.overlaps.map((overlap, index) => (
                          <div key={index} className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/[0.03] space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded font-black uppercase">Solapamiento sospechoso</span>
                              <span className="text-xs font-mono font-bold text-white">Alerta de doble ocupación</span>
                            </div>
                            <p className="text-xs text-[#879391] italic">"{overlap}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 7: GENERADOR DE PREGUNTAS TECNICAS (STAR) */}
              {activeTab === "preguntas" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-xl border border-white/5 bg-[#6bd8cb]/5 text-[11px] text-white/90">
                    <span className="font-bold text-[#6bd8cb]">Herramienta 7: Generador de Preguntas Técnicas STAR</span>
                    <p className="mt-0.5 text-[#879391]">
                      Formula dinámicamente tres preguntas de comportamiento y código cruzando el stack específico de su CV técnico con la descripción funcional.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-black block">Preguntas de evaluación preparadas</span>

                    {activeCandidate.toolsDetails.preguntas.map((q, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-3">
                        <div className="flex justify-between items-start gap-3">
                          <span className="w-5 h-5 rounded-md bg-[#c4c1fb] text-[#101415] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span className="text-xs text-white leading-relaxed flex-grow text-left font-semibold">{q}</span>
                        </div>
                        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                          <button
                            onClick={() => handleCopyText(q, `q-${idx}`)}
                            className="text-[9px] text-[#6bd8cb] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>{copiedTextType === `q-${idx}` ? "Copiado!" : "Copiar plantilla de pregunta"}</span>
                          </button>
                          <span className="text-[8px] uppercase tracking-wider font-extrabold text-[#c4c1fb]">Método STAR</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: VALIDADOR DE IDENTIDAD Y ENTORNO */}
              {activeTab === "validador" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-xl border border-white/5 bg-[#6bd8cb]/5 text-[11px] text-white/90">
                    <span className="font-bold text-[#6bd8cb]">Herramienta 8: Validador de Identidad y Entorno</span>
                    <p className="mt-0.5 text-[#879391]">
                      Chequeo asincrónico por IP, geolocalización latente y capturas de cámara web dinámicas para evitar fraude y verificar entorno de test limpio.
                    </p>
                  </div>

                  {/* Simulator Trigger */}
                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white">Ejecutar Chequeo de Identidad</span>
                      <p className="text-[10px] text-[#879391]">Sondea las conexiones WebRTC y valida fotograma de control.</p>
                    </div>

                    <button
                      onClick={triggerValidadorSimulation}
                      disabled={isSimulatingValidadorCheck}
                      className="px-4 py-2 text-[10px] font-black rounded-xl bg-emerald-500 text-stone-950 font-bold hover:bg-emerald-400 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0"
                    >
                      {isSimulatingValidadorCheck ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Verificando...</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Iniciar escaneo</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Diagnostic Details */}
                  <div className="space-y-3.5 border-t border-white/5 pt-4">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-black block">Resultado de la verificación</span>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-1">
                        <span className="text-[8px] text-[#879391] uppercase font-bold tracking-wider">Dirección IP Escaneada</span>
                        <code className="text-xs font-mono text-[#6bd8cb] block">{activeCandidate.toolsDetails.validador.ip}</code>
                      </div>
                      <div className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-1">
                        <span className="text-[8px] text-[#879391] uppercase font-bold tracking-wider">Geolocalización declarada</span>
                        <code className="text-xs font-mono text-[#c4c1fb] block">{activeCandidate.toolsDetails.validador.location}</code>
                      </div>
                    </div>

                    {/* Status Alert box */}
                    <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                      activeCandidate.toolsDetails.validador.verificationStatus === "success" ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400" :
                      activeCandidate.toolsDetails.validador.verificationStatus === "fail" ? "border-rose-500/20 bg-rose-500/5 text-rose-450" :
                      "border-amber-500/20 bg-amber-500/5 text-amber-400"
                    }`}>
                      {activeCandidate.toolsDetails.validador.verificationStatus === "success" ? <ShieldCheck className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
                      <div className="space-y-1 text-xs">
                        <p className="font-bold uppercase tracking-wider text-[10px]">
                          {activeCandidate.toolsDetails.validador.verificationStatus === "success" ? "VERIFICADO - ENTORNO INTEGRIL" :
                           activeCandidate.toolsDetails.validador.verificationStatus === "fail" ? "FALLÓ - POSIBLE FRAUDE DETECTADO" :
                           "PENDIENTE DE CHEQUEO"}
                        </p>
                        <p className="text-[#879391] leading-normal">{activeCandidate.toolsDetails.validador.envStatus}</p>
                      </div>
                    </div>

                    {/* CCTV camera capture simulation placeholder */}
                    <div className="p-4 rounded-xl border border-white/5 bg-black/40 flex flex-col items-center justify-center space-y-3 relative overflow-hidden h-[180px]">
                      <div className="absolute top-2 left-2 flex items-center gap-1 text-[8px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded uppercase">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></div>
                        <span>Cámara en vivo (Captura al azar)</span>
                      </div>

                      {activeCandidate.toolsDetails.validador.verificationStatus === "fail" ? (
                        <>
                          <div className="w-12 h-12 bg-white/5 rounded-full border border-rose-500/40 flex items-center justify-center text-rose-400">
                            <X className="w-6 h-6 animate-pulse" />
                          </div>
                          <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">FALLA EN CHEQUEO VISUAL</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-12 h-12 text-[#6bd8cb] opacity-50" />
                          <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5 leading-normal">
                            <Check className="w-3.5 h-3.5" />
                            <span>Fotograma verificado con ID oficial</span>
                          </span>
                        </>
                      )}
                    </div>

                  </div>
                </div>
              )}

              {/* CO-PILOT ADAPTATIVO PAIR-PROGRAMMING */}
              {activeTab === "copilot" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="p-4 rounded-xl border border-white/5 bg-indigo-950/20 text-[11px] text-white/90">
                    <span className="font-bold text-[#c4c1fb]">Entorno de Pair-Programming Adaptativo (AI Co-Pilot)</span>
                    <p className="mt-0.5 text-[#879391]">
                      Colaboración en vivo de código (Live coding test) asistida por IA. Analiza métricas de dificultad, tiempo de resolución y calcula el esfuerzo real comparado con el estándar del equipo cliente.
                    </p>
                  </div>

                  {/* Simulator action */}
                  <div className="p-4 rounded-xl border border-white/10 bg-white/[0.02] flex items-center justify-between">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-white">Simular Sesión de Programación en Vivo</span>
                      <p className="text-[10px] text-[#879391]">Ejecuta el asistente y analiza el rendimiento en tiempo real.</p>
                    </div>

                    <button
                      onClick={triggerCopilotSimulation}
                      disabled={isSimulatingCopilotRun}
                      className="px-4 py-2 text-[10px] font-black rounded-xl bg-[#6bd8cb] text-[#101415] hover:bg-[#5bc2b5] transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 shadow shadow-[#6bd8cb]/15"
                    >
                      {isSimulatingCopilotRun ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Procesando código...</span>
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-3.5 h-3.5" />
                          <span>Lanzar Simulación</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Code Editor emulator block */}
                  <div className="border border-white/10 bg-[#101415] rounded-xl overflow-hidden font-mono">
                    <div className="flex justify-between items-center bg-white/5 px-4 py-2 border-b border-white/5 text-[10px] text-[#879391]">
                      <span>sandbox_exercise.{activeCandidate.toolsDetails.copilot.languageUsed === "Rust / WebAssembly" ? "rs" : "tsx"}</span>
                      <span className="text-[#6bd8cb]">LIVE_COMPILED_STABLE</span>
                    </div>

                    <div className="p-4 text-xs text-[#a5d6ff] text-left overflow-x-auto space-y-1 h-[140px] max-h-[140px]">
                      {activeCandidate.toolsDetails.copilot.languageUsed === "Rust / WebAssembly" ? (
                        <>
                          <p><span className="text-rose-420">pub fn</span> <span className="text-[#d2a8ff]">optimize_memory_allocation</span>{"(buffer: &[u8]) -> Result<Vec<u8>, Error> {"}</p>
                          <p className="pl-4"><span className="text-rose-420">let mut</span> {"processed_output = Vec::with_capacity(buffer.len());"}</p>
                          <p className="pl-4 text-[#8b949e]">// AI assisted memory mapping and bound checks</p>
                          <p className="pl-4"><span className="text-[#68b688]">for</span> {"chunk in buffer.chunks_exact(4) {"}</p>
                          <p className="pl-8">{"processed_output.extend_from_slice(chunk);"}</p>
                          <p className="pl-4">{"}"}</p>
                          <p className="pl-4">{"Ok(processed_output)"}</p>
                          <p>{"}"}</p>
                        </>
                      ) : (
                        <>
                          <p><span className="text-rose-420">export const</span> <span className="text-[#d2a8ff]">useMemoryCache</span>{" = (key: string, initialData: any) => {"}</p>
                          <p className="pl-4"><span className="text-rose-420">const</span> {"[cached, setCached] = useState(initialData);"}</p>
                          <p className="pl-4 text-[#8b949e]">// Auto-pilot dependency injection check</p>
                          <p className="pl-4">{"useEffect(() => {"}</p>
                          <p className="pl-8">{"globalCache.registerKey(key, cached);"}</p>
                          <p className="pl-4">{"}, [key, cached]);"}</p>
                          <p className="pl-4">{"return [cached, setCached];"}</p>
                          <p>{"}"}</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Copilot performance stats metrics */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
                    <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
                      <span className="text-[9px] text-[#879391] uppercase tracking-wider font-bold">Nivel Dificultad</span>
                      <span className="text-base font-bold text-white block mt-1">{activeCandidate.toolsDetails.copilot.difficultyLevel}</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
                      <span className="text-[9px] text-[#879391] uppercase tracking-wider font-bold">Tasa Completación</span>
                      <span className="text-base font-bold text-[#6bd8cb] block mt-1">{activeCandidate.toolsDetails.copilot.completionRate}%</span>
                    </div>
                    <div className="p-3.5 rounded-xl bg-white/[0.01] border border-white/5 flex flex-col justify-between">
                      <span className="text-[9px] text-[#879391] uppercase tracking-wider font-bold">Esfuerzo Estimado</span>
                      <span className="text-base font-bold text-[#c4c1fb] block mt-1">{activeCandidate.toolsDetails.copilot.effortScore} / 5 pts</span>
                    </div>
                  </div>

                  {/* Summary commentary box */}
                  <div className="p-4 rounded-xl border border-white/5 bg-[#15181a]">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-black block mb-1">Comentario del Evaluador Co-Pilot</span>
                    <p className="text-xs text-[#879391] leading-relaxed italic">
                      "{activeCandidate.toolsDetails.copilot.summary}"
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Slider footer */}
            <div className="px-6 py-4.5 border-t border-white/10 bg-[#101415]/90 backdrop-blur-md flex justify-between items-center">
              <span className="text-[10px] text-[#879391] font-mono">
                Sincronizado con base de datos de Maquetas
              </span>
              
              <button
                onClick={() => setActiveCandidate(null)}
                className="px-5 py-2 rounded-xl text-xs font-black bg-white/5 border border-white/10 text-white hover:bg-white/10 cursor-pointer transition-all"
              >
                Cerrar expediente
              </button>
            </div>

          </aside>
        </div>
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

    </div>
  );
}

// Side Components
function KanbanCard({ 
  cad, 
  onSelect, 
  onTransition,
  onAdvancePhase,
  onDragStart 
}: { 
  cad: EvaluacionCandidate; 
  onSelect: (cad: EvaluacionCandidate) => void;
  onTransition: (id: string, phase: EvaluacionCandidate["currentPhase"]) => void;
  onAdvancePhase: (cad: EvaluacionCandidate) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
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
        <h3 className="text-xs font-bold text-white tracking-tight group-hover:text-[#6bd8cb] transition-colors break-words">
          {cad.name}
        </h3>
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

      {/* Screening brief details */}
      <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
        <span className="text-[8px] font-bold tracking-wider text-white/40 uppercase block">Actividad Reciente</span>
        <p className="text-[9px] text-[#879391] leading-relaxed truncate">{cad.lastActivity}</p>
      </div>

      {/* Advanced diagnostics trigger button */}
      <button
        onClick={() => {
          onSelect(cad);
        }}
        className="w-full py-1.5 rounded-xl border border-[#c4c1fb]/25 bg-[#c4c1fb]/5 hover:bg-[#c4c1fb]/15 hover:text-white transition-all text-[9.5px] font-black text-[#c4c1fb] flex items-center justify-center gap-1 cursor-pointer shadow shadow-[#4338ca]/5"
      >
        <Cpu className="w-3.5 h-3.5 text-[#c4c1fb] animate-pulse" />
        <span>Abrir Diagnóstico IA</span>
      </button>

      {/* Footer controls quick shifts: Detalles, Avanzar estado, Avanzar Fase, Rechazar */}
      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
        {/* Detalles button */}
        <button
          onClick={() => onSelect(cad)}
          className="px-2 py-1 rounded border border-[#c4c1fb]/20 bg-[#c4c1fb]/5 hover:bg-[#c4c1fb] hover:text-[#101415] text-[9px] font-bold text-[#c4c1fb] transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0 whitespace-nowrap"
          title="Ver expediente y detalles completos del candidato"
        >
          <Eye className="w-3 h-3 shrink-0" />
          <span>Detalles</span>
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

        {cad.currentPhase === "07_descartado_interno" && (
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
        {cad.currentPhase !== "07_descartado_interno" && (
          <button
            onClick={() => onTransition(cad.id, "07_descartado_interno")}
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
