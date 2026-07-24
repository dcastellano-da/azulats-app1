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
  Send,
  Languages,
  Calendar,
  Bell
} from "lucide-react";
import { 
  PresentacionCandidate, 
  INITIAL_PRESENTACION_CANDIDATES, 
  calculatePresentacionKPIs 
} from "@/lib/presentacion";

const ACTIVE_BUSQUEDAS = [
  { id: "b1", client: "Inditex S.A.", role: "Frontend Dev (React/Node)" },
  { id: "b2", client: "Telefónica S.A.", role: "Product Manager Tech" },
  { id: "b3", client: "SEAT S.A.", role: "Software Architect Rust" },
  { id: "b4", client: "Banco Santander", role: "SecOps Specialist" }
];

export default function PresentacionPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // States
  const [candidates, setCandidates] = useState<PresentacionCandidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSearch, setSelectedSearch] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Details slide-over
  const [activeCandidate, setActiveCandidate] = useState<PresentacionCandidate | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "analitica" | "traductor" | "briefing" | "agenda" | "tracker">("general");
  
  // Sorting states (list view)
  const [sortField, setSortField] = useState<string>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Custom alerts or notifications
  const [isWipWarningDismissed, setIsWipWarningDismissed] = useState(false);
  const [copiedTextType, setCopiedTextType] = useState<string | null>(null);
  const [activeMetricHelp, setActiveMetricHelp] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulated Tool Action States
  const [isSimulatingAnalysis, setIsSimulatingAnalysis] = useState(false);
  const [isSimulatingTranslation, setIsSimulatingTranslation] = useState(false);
  const [isSimulatingBriefingGen, setIsSimulatingBriefingGen] = useState(false);
  const [isSimulatingAgendasSlot, setIsSimulatingAgendasSlot] = useState(false);
  const [isSimulatingSlaPing, setIsSimulatingSlaPing] = useState(false);

  // Toast notifier helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize
  useEffect(() => {
    setCandidates(INITIAL_PRESENTACION_CANDIDATES);
  }, []);

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
  const kpis = calculatePresentacionKPIs(candidates);
  
  // State transition
  const handleTransitionState = (id: string, targetPhase: PresentacionCandidate["currentPhase"]) => {
    setCandidates((prev) =>
      prev.map((c) => (c.id === id ? { ...c, currentPhase: targetPhase, lastActivity: `Estado cambiado a ${getPhaseLabel(targetPhase)}` } : c))
    );
    if (activeCandidate && activeCandidate.id === id) {
      setActiveCandidate((prev) => prev ? { ...prev, currentPhase: targetPhase } : null);
    }
    triggerToast(`Candidato reubicado a la columna de ${getPhaseLabel(targetPhase).substring(5)}`);
  };

  const getPhaseLabel = (phase: PresentacionCandidate["currentPhase"]) => {
    switch (phase) {
      case "08_shortlist": return "08 - Shortlist / Enviado a Cliente";
      case "09_entrevista_cliente": return "09 - Entrevista con Cliente";
      case "10_standby": return "10 - Stand-by / Back-up";
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetCol: PresentacionCandidate["currentPhase"]) => {
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
    triggerToast("Texto copiado al portapapeles con éxito.");
    setTimeout(() => setCopiedTextType(null), 2000);
  };

  // TOOL 1: Analítica de Entrevistas Zoom/Meet
  const runZoomAnalysis = () => {
    if (!activeCandidate) return;
    setIsSimulatingAnalysis(true);
    setTimeout(() => {
      setIsSimulatingAnalysis(false);
      setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
        ...c,
        toolsDetails: {
          ...c.toolsDetails,
          analitica: {
            ...c.toolsDetails.analitica,
            sentimentScore: 94,
            globalSentiment: "Positivo",
            microExpressionsDetected: [
              ...c.toolsDetails.analitica.microExpressionsDetected,
              "Alineación de objetivos de equipo",
              "Sinceridad en banda salarial"
            ]
          }
        }
      } : c));
      setActiveCandidate(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          analitica: {
            ...prev.toolsDetails.analitica,
            sentimentScore: 94,
            globalSentiment: "Positivo",
            microExpressionsDetected: [
              ...prev.toolsDetails.analitica.microExpressionsDetected,
              "Alineación de objetivos de equipo",
              "Sinceridad en banda salarial"
            ]
          }
        }
      } : null);
      triggerToast("Análisis telemétrico de Zoom y Calibración completado. Co-Pilot indexó +2 insights de microexpresiones.");
    }, 2000);
  };

  // TOOL 2: Traductor y Estandarizador de Perfiles
  const runTranslationAndStadardizer = () => {
    if (!activeCandidate) return;
    setIsSimulatingTranslation(true);
    setTimeout(() => {
      setIsSimulatingTranslation(false);
      setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
        ...c,
        toolsDetails: {
          ...c.toolsDetails,
          traductor: {
            ...c.toolsDetails.traductor,
            cvTranslated: true
          }
        }
      } : c));
      setActiveCandidate(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          traductor: {
            ...prev.toolsDetails.traductor,
            cvTranslated: true
          }
        }
      } : null);
      triggerToast("CV traducido y normalizado al inglés bajo el formato unificado ATS.");
    }, 2000);
  };

  // TOOL 3: Generador de Candidate Briefings
  const runBriefingGenerator = () => {
    if (!activeCandidate) return;
    setIsSimulatingBriefingGen(true);
    setTimeout(() => {
      setIsSimulatingBriefingGen(false);
      const outputText = `El candidato ${activeCandidate.name} califica con aptitudes relevantes para la vacante de ${activeCandidate.role} en ${activeCandidate.client}.\n\nDemuestra contar con ${activeCandidate.experienceYears} años de experiencia laboral. El Co-Pilot de IA valora sus capacidades técnicas y fluidez conversacional en un ${activeCandidate.score}% de coincidencia inicial.\n\nSLA salarial comprobado favorablemente. Se posiciona como una contratación estratégica recomendada por la agencia.`;
      setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
        ...c,
        toolsDetails: {
          ...c.toolsDetails,
          briefing: {
            generated: true,
            content: outputText
          }
        }
      } : c));
      setActiveCandidate(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          briefing: {
            generated: true,
            content: outputText
          }
        }
      } : null);
      triggerToast("Briefing Ejecutivo redactado inteligentemente por IA.");
    }, 2000);
  };

  // TOOL 4: Orquestador de Agendas Condicional
  const suggestOptimalSlot = () => {
    if (!activeCandidate) return;
    setIsSimulatingAgendasSlot(true);
    setTimeout(() => {
      setIsSimulatingAgendasSlot(false);
      setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
        ...c,
        toolsDetails: {
          ...c.toolsDetails,
          agenda: {
            ...c.toolsDetails.agenda,
            recruiterSlotSelected: "Jueves 23 Julio - 11:30h CEST (Sugerido por IA)",
            isScheduled: true
          }
        }
      } : c));
      setActiveCandidate(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          agenda: {
            ...prev.toolsDetails.agenda,
            recruiterSlotSelected: "Jueves 23 Julio - 11:30h CEST (Sugerido por IA)",
            isScheduled: true
          }
        }
      } : null);
      triggerToast("Calendarios mapeados. Slot óptimo reservado y coordinado automáticamente.");
    }, 1800);
  };

  // TOOL 5: Bot Rastreador de SLA para Clientes
  const sendSlaAlertPing = () => {
    if (!activeCandidate) return;
    setIsSimulatingSlaPing(true);
    setTimeout(() => {
      setIsSimulatingSlaPing(false);
      setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
        ...c,
        toolsDetails: {
          ...c.toolsDetails,
          tracker: {
            ...c.toolsDetails.tracker,
            totalRemindersSent: c.toolsDetails.tracker.totalRemindersSent + 1,
            lastReminderTime: new Date().toISOString()
          }
        }
      } : c));
      setActiveCandidate(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          tracker: {
            ...prev.toolsDetails.tracker,
            totalRemindersSent: prev.toolsDetails.tracker.totalRemindersSent + 1,
            lastReminderTime: new Date().toISOString()
          }
        }
      } : null);
      triggerToast("Notificación de escalamiento SLA enviada al Hiring Manager por Teams, Slack y Correo.");
    }, 1200);
  };

  // Sort list view candidates helper
  const sortCandidates = (a: PresentacionCandidate, b: PresentacionCandidate) => {
    let aVal: any = a[sortField as keyof PresentacionCandidate];
    let bVal: any = b[sortField as keyof PresentacionCandidate];

    // Sub-field mapping
    if (sortField === "phase") {
      aVal = a.currentPhase;
      bVal = b.currentPhase;
    }

    if (aVal === undefined) return 1;
    if (bVal === undefined) return -1;

    if (typeof aVal === 'string') {
      return sortDirection === "asc" 
        ? aVal.localeCompare(bVal) 
        : bVal.localeCompare(aVal);
    } else {
      return sortDirection === "asc"
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    }
  };

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
      ? <ChevronUp className="w-3 h-3 text-amber-500 ml-1 inline-block" />
      : <ChevronDown className="w-3 h-3 text-amber-500 ml-1 inline-block" />;
  };

  // Filters application
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSearchFilter =
      selectedSearch === "Todos" || `${c.client} - ${c.role}` === selectedSearch;

    const matchesPhaseFilter =
      viewMode === "kanban" || filterStatus === "Todos" || c.currentPhase === filterStatus;

    return matchesSearch && matchesSearchFilter && matchesPhaseFilter;
  });

  const sortedListCandidates = [...filteredCandidates].sort(sortCandidates);

  // Column counts
  const countShortlist = candidates.filter((c) => c.currentPhase === "08_shortlist").length;
  const countEntrevista = candidates.filter((c) => c.currentPhase === "09_entrevista_cliente").length;
  const countStandby = candidates.filter((c) => c.currentPhase === "10_standby").length;

  return (
    <div className={`relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden transition-all duration-350 ${isFullScreen ? 'p-4' : ''}`}>
      {/* Background radial blurs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-amber-500/5 blur-[90px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#6bd8cb]/5 blur-[90px] pointer-events-none"></div>

      <div className={`relative z-10 mx-auto space-y-8 ${isFullScreen ? 'max-w-none' : 'max-w-7xl'}`}>
        
        {/* Navigation Banner Header */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-6 border-b border-white/10">
          <div className="flex justify-between items-center w-full lg:w-auto gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-[#6bd8cb] flex items-center justify-center shadow-lg shadow-amber-500/20">
                <Compass className="w-6 h-6 text-[#101415]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Fase 3: Calibración final
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500/10 text-amber-500 border border-amber-500/25 rounded-md animate-pulse">
                    EVALUACIÓN CLIENTE
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                  Presentación al Cliente
                </h1>
              </div>
            </div>

            {/* Mobile/Tablet Avatar */}
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

                <Link
                  href="/evaluacion"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#9b5de5] hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-[#9b5de5]" />
                  <span className="hidden sm:inline">F2 Evaluación</span>
                </Link>

                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/25 flex items-center gap-1.5 select-none"
                  title="F3 Cliente Evaluación (Módulo Actual)"
                >
                  <Compass className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">F3 Cliente</span>
                </div>

                <Link
                  href="/cierre"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-500 hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
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
          <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-300 text-xs flex justify-between items-center gap-3 animate-fadeIn text-left">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 animate-bounce" />
              <div>
                <span className="font-bold">¡Alerta de Saturación de SLA en Cliente (WIP Excedido)! </span>
                Actualmente tienes {kpis.activeWipCount} candidatos en la Fase de Calibración del Cliente. El compromiso SLA establece un límite áureo recomendado de &le; 10 postulantes simultáneos para garantizar un ciclo de revisión ágil por parte del Hiring Manager.
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
          
          {/* CARD 1: Stakeholder Blockage Time */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px] text-left">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">Blockage Time</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Demora de feedback del cliente</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'blockage_time' ? null : 'blockage_time')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-white">{kpis.blockageTimeHours} horas</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                kpis.blockageTimeHours > 48 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {kpis.blockageTimeHours > 48 ? "Retrasado (>48h)" : "A tiempo (<48h)"}
              </span>
            </div>
            <Clock className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none text-amber-500" />

            {/* Help Overlay */}
            {activeMetricHelp === 'blockage_time' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Stakeholder Blockage Time</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Mide las horas promedio que pasa un candidato en Shortlist (08) o Stand-by (10) esperando respuesta o agenda del cliente final. Meta: inferior a 48 horas.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: Σ(Horas desde envío a cliente) / Nº candidatos bloqueados
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: Calibration Accuracy */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px] text-left">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">Calibration Accuracy</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Alineación de requisitos técnicos</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'calibration_accuracy' ? null : 'calibration_accuracy')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-amber-500">{kpis.calibrationAccuracy}%</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                kpis.calibrationAccuracy >= 75 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-450 border border-rose-500/20"
              }`}>
                {kpis.calibrationAccuracy >= 75 ? "Preciso" : "Descalibrado"}
              </span>
            </div>
            <UserCheck className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none text-[#6bd8cb]" />

            {/* Help Overlay */}
            {activeMetricHelp === 'calibration_accuracy' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Calibration Accuracy</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Mide el porcentaje de postulantes sobre la Shortlist que acceden a entrevista con cliente (09) o quedan en reserva calificada (10) sin ser rechazados.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: (Nº Candidatos entrevista + standby) / Total en fase * 100
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: cNPS Promedio de Fase */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px] text-left">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">cNPS del Cliente</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Satisfacción con el cliente final</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'cnps_phase' ? null : 'cnps_phase')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-[#c4c1fb]">{kpis.avgCNPS} / 10</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded font-bold">Excelente</span>
            </div>
            <Users className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none text-[#c4c1fb]" />

            {/* Help Overlay */}
            {activeMetricHelp === 'cnps_phase' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Candidate NPS de Triada</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Puntuación otorgada por el candidato sobre su experiencia específica en las entrevistas presenciales y virtuales con los gerentes del cliente corporativo.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: Promedio aritmético simple del Score cNPS de los postulantes evaluados.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: WIP Total de Fase */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px] text-left">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">WIP Activos en Cliente</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Enviados + En Entrevista</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'wip_presentacion' ? null : 'wip_presentacion')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-rose-450">{kpis.activeWipCount} activos</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                kpis.isWipOverloaded ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse" : "bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20"
              }`}>
                {kpis.isWipOverloaded ? "Sobrecargado" : "Saludable"}
              </span>
            </div>
            <Cpu className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none text-rose-500" />

            {/* Help Overlay */}
            {activeMetricHelp === 'wip_presentacion' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-amber-500 uppercase tracking-wider">Carga Máxima de Calibración</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Suma total de expedientes activos en revisión del cliente. Superar 10 postulantes arriesga el cumplimiento SLA y los tiempos máximos de respuesta.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Cálculo: Conteo de candidatos en estados 08, 09 y 10.
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
                placeholder="Buscar candidato, rol o cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#101415]/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#879391] focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 focus:outline-none transition-all font-medium"
              />
            </div>

            {/* Client/Search select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-[#879391] whitespace-nowrap font-medium">Búsqueda activa:</span>
              <select
                value={selectedSearch}
                onChange={(e) => setSelectedSearch(e.target.value)}
                className="bg-[#101415]/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer w-full md:w-auto font-bold"
              >
                <option value="Todos" className="bg-[#15181a]">Todas las Búsquedas</option>
                {ACTIVE_BUSQUEDAS.map((b) => (
                  <option key={b.id} value={`${b.client} - ${b.role}`} className="bg-[#15181a] text-white">
                    {b.client} - {b.role}
                  </option>
                ))}
              </select>
            </div>

            {/* State filter - List View exclusive */}
            {viewMode === "lista" && (
              <div className="flex items-center gap-2 w-full md:w-auto animate-fadeIn">
                <span className="text-xs text-[#c4c1fb] whitespace-nowrap font-medium">Fase:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#101415]/60 border border-[#c4c1fb]/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 cursor-pointer w-full md:w-auto font-bold"
                >
                  <option value="Todos" className="bg-[#15181a]">Todas las Fases</option>
                  <option value="08_shortlist" className="bg-[#15181a]">08 - Shortlist / Enviado</option>
                  <option value="09_entrevista_cliente" className="bg-[#15181a]">09 - Entrevista con Cliente</option>
                  <option value="10_standby" className="bg-[#15181a]">10 - Stand-by</option>
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
                    ? "bg-amber-500 text-[#101415] shadow shadow-amber-500/10"
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
                    ? "bg-amber-500 text-[#101415] shadow shadow-amber-500/10"
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

        {/* View Mode Content */}
        {viewMode === "kanban" ? (
          /* Kanban Board Layout */
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
            
            {/* COLUMN 1: Shortlist / Enviado a Cliente */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "08_shortlist")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-amber-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">08 - Shortlist / Enviado a Cliente</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Expedientes presentados para aprobación</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-500 font-mono">
                  {countShortlist}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "08_shortlist").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={setActiveCandidate} onTransition={handleTransitionState} onDragStart={handleDragStart} />
                ))}
                {countShortlist === 0 && <EmptyColumnText text="Ninguna presentación" />}
              </div>
            </div>

            {/* COLUMN 2: Entrevista con Cliente */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "09_entrevista_cliente")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-emerald-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">09 - Entrevista con Cliente</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Agendas coordinadas y entrevistas activas</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 font-mono">
                  {countEntrevista}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "09_entrevista_cliente").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={setActiveCandidate} onTransition={handleTransitionState} onDragStart={handleDragStart} />
                ))}
                {countEntrevista === 0 && <EmptyColumnText text="Ninguna reunión agendada" />}
              </div>
            </div>

            {/* COLUMN 3: Stand-by / Backup */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "10_standby")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-purple-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">10 - Stand-by / Back-up</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Calificados en reserva técnica</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-purple-400 font-mono">
                  {countStandby}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "10_standby").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={setActiveCandidate} onTransition={handleTransitionState} onDragStart={handleDragStart} />
                ))}
                {countStandby === 0 && <EmptyColumnText text="Ningún recurso en reserva" />}
              </div>
            </div>

          </div>
        ) : (
          /* Detailed List Layout */
          <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md animate-fadeIn text-left">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-[#101415]/80 text-[10px] font-bold text-[#879391] uppercase tracking-wider border-b border-white/10">
                <tr>
                  <th className="px-5 py-4 cursor-pointer hover:text-white" onClick={() => toggleSort("name")}>
                    Candidato {renderSortIcon("name")}
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white" onClick={() => toggleSort("client")}>
                    Puesto / Cliente {renderSortIcon("client")}
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white" onClick={() => toggleSort("phase")}>
                    Fase {renderSortIcon("phase")}
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white text-center" onClick={() => toggleSort("cnps")}>
                    cNPS F3 {renderSortIcon("cnps")}
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white text-center" onClick={() => toggleSort("score")}>
                    Fit Score {renderSortIcon("score")}
                  </th>
                  <th className="px-5 py-4 text-right">Herramientas Operativas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {sortedListCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#879391] bg-white/5">
                      No se encontraron candidatos presentados que coincidan con los filtros aplicados.
                    </td>
                  </tr>
                ) : (
                  sortedListCandidates.map((cad) => (
                    <tr key={cad.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{cad.name}</div>
                        <div className="text-[10px] text-[#879391] mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-amber-500/70" />
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
                          cad.currentPhase === "08_shortlist" ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" :
                          cad.currentPhase === "09_entrevista_cliente" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : 
                          "bg-purple-500/10 text-purple-400 border border-purple-500/15"
                        }`}>
                          {getPhaseLabel(cad.currentPhase).substring(5)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center font-mono font-bold text-sm text-[#c4c1fb]">
                        {cad.cNPS !== undefined ? cad.cNPS : "-"} / 10
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="font-bold text-white font-mono bg-white/5 rounded-md px-2 py-1 inline-block border border-white/5">
                          {cad.score}%
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => {
                            setActiveCandidate(cad);
                            setActiveTab("general");
                          }}
                          className="px-3.5 py-1.5 text-[10px] font-black rounded-xl bg-gradient-to-tr from-amber-500/25 to-[#c4c1fb]/15 border border-[#c4c1fb]/20 text-[#c4c1fb] hover:bg-[#c4c1fb] hover:text-[#101415] hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lanzar Herramientas IA</span>
                        </button>
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

          {/* Slider Drawer Container */}
          <aside className="absolute top-0 right-0 h-full w-full max-w-3xl bg-[#15181a] border-l border-white/10 shadow-2xl flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] animate-slideIn text-left">
            
            {/* Header */}
            <div className="px-6 py-5 border-b border-white/10 bg-[#101415]/90 backdrop-blur-md flex justify-between items-center">
              <div>
                <span className="text-[9px] font-mono text-amber-500 bg-amber-500/15 px-2.5 py-0.5 rounded border border-amber-500/25 uppercase font-bold tracking-widest inline-block mb-1">
                  MÓDULO DE CLIENTE F3
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Expediente de {activeCandidate.name}</span>
                  <span className="px-2 py-0.5 text-xs text-white/40 font-mono bg-white/5 rounded-md border border-white/10">
                    {activeCandidate.id}
                  </span>
                </h2>
                <p className="text-[10px] text-[#879391] mt-0.5">
                  Herramientas operativas automatizadas: briefings, calendarios ágiles y alertas de cumplimiento de SLA.
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
            <nav className="flex items-center overflow-x-auto bg-[#101415]/40 border-b border-white/5 px-4 py-1.5 gap-1 select-none">
              <button 
                onClick={() => setActiveTab("general")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeTab === "general" ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                1. General & Info
              </button>
              <button 
                onClick={() => setActiveTab("analitica")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "analitica" ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                <span>2. Analítica Zoom/Meet</span>
              </button>
              <button 
                onClick={() => setActiveTab("traductor")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "traductor" ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>3. Traductor CV</span>
              </button>
              <button 
                onClick={() => setActiveTab("briefing")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "briefing" ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>4. AI Briefing</span>
              </button>
              <button 
                onClick={() => setActiveTab("agenda")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "agenda" ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>5. Agenda Condicional</span>
              </button>
              <button 
                onClick={() => setActiveTab("tracker")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "tracker" ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>6. Rastro SLA</span>
              </button>
            </nav>

            {/* TAB CONTENT ACCORDION */}
            <div className="flex-grow p-6 overflow-y-auto space-y-6">
              
              {/* TAB 1: GENERAL */}
              {activeTab === "general" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-3.5">
                      <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest">Información de Contacto</h4>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Nombre completo:</span>
                          <span className="text-white font-bold">{activeCandidate.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Correo electrónico:</span>
                          <a href={`mailto:${activeCandidate.email}`} className="text-amber-400 underline font-bold hover:text-amber-300">
                            {activeCandidate.email}
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Teléfono móvil:</span>
                          <a href={`tel:${activeCandidate.contactNumber}`} className="text-white hover:text-amber-500 font-mono">
                            {activeCandidate.contactNumber}
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Ubicación física:</span>
                          <span className="text-[#e2e5e7]">{activeCandidate.location}</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-3.5">
                      <h4 className="text-xs font-black text-[#6bd8cb] uppercase tracking-widest font-bold">Estado en Proceso</h4>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Cliente corporativo:</span>
                          <span className="text-white font-bold">{activeCandidate.client}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Puesto Técnico:</span>
                          <span className="text-white font-bold">{activeCandidate.role}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Años experiencia:</span>
                          <span className="text-white font-bold">{activeCandidate.experienceYears} años</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Puntuación de ajuste (Fit):</span>
                          <span className="text-white font-bold font-mono text-sm">{activeCandidate.score}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-3">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest font-black block">Actividad en esta Fase</span>
                    <p className="text-xs text-[#e0e3e5] leading-relaxed">
                      {activeCandidate.lastActivity}
                    </p>
                    <div className="text-[10px] text-[#879391] font-mono pt-1">
                      Fecha de Ingreso a F3: {new Date(activeCandidate.entryDate).toLocaleString("es-ES")}
                    </div>
                  </div>

                  {/* Operational controls to shift candidate phase directly inside slide-over */}
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-3.5">
                    <span className="text-xs font-black text-white uppercase tracking-wider block">Asignar Nueva Fase del Cliente</span>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleTransitionState(activeCandidate.id, "08_shortlist")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeCandidate.currentPhase === "08_shortlist"
                            ? "bg-amber-500 text-stone-900 border border-amber-500 font-black"
                            : "bg-white/5 border border-white/10 text-[#879391] hover:text-white"
                        }`}
                      >
                        08 - Shortlist / Enviado
                      </button>
                      <button
                        onClick={() => handleTransitionState(activeCandidate.id, "09_entrevista_cliente")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeCandidate.currentPhase === "09_entrevista_cliente"
                            ? "bg-emerald-500 text-stone-900 border border-emerald-500 font-black"
                            : "bg-white/5 border border-white/10 text-[#879391] hover:text-white"
                        }`}
                      >
                        09 - Entrevista
                      </button>
                      <button
                        onClick={() => handleTransitionState(activeCandidate.id, "10_standby")}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          activeCandidate.currentPhase === "10_standby"
                            ? "bg-purple-500 text-white border border-purple-500 font-black"
                            : "bg-white/5 border border-white/10 text-[#879391] hover:text-white"
                        }`}
                      >
                        10 - Stand-by / Backup
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: ANALÍTICA ZOOM/MEET */}
              {activeTab === "analitica" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">Telemetría de Llamada con Cliente</h4>
                      <p className="text-[10px] text-[#879391]">Transcripción en tiempo real y detección de microexpresiones por redes neuronales.</p>
                    </div>
                    
                    <button
                      onClick={runZoomAnalysis}
                      disabled={isSimulatingAnalysis}
                      className="px-4 py-2 font-black rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#101415] text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/10 shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingAnalysis ? 'animate-spin' : ''}`} />
                      <span>{isSimulatingAnalysis ? "Analizando..." : "Correr Calibración IA"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="glass-panel p-4 rounded-xl border border-white/5 text-center flex flex-col justify-center space-y-1 bg-[#101415]/75">
                      <span className="text-[9px] uppercase font-bold text-[#879391]">Índice de Sentimiento</span>
                      <span className="text-2xl font-black text-amber-500 font-mono">
                        {activeCandidate.toolsDetails.analitica.sentimentScore}%
                      </span>
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-white/5 text-center flex flex-col justify-center space-y-1 bg-[#101415]/75">
                      <span className="text-[9px] uppercase font-bold text-[#879391]">Clasificación Global</span>
                      <span className="text-sm font-bold text-emerald-400">
                        {activeCandidate.toolsDetails.analitica.globalSentiment}
                      </span>
                    </div>

                    <div className="glass-panel p-4 rounded-xl border border-white/5 text-center flex flex-col justify-center space-y-1 bg-[#101415]/75">
                      <span className="text-[9px] uppercase font-bold text-[#879391]">Alineación Salarial</span>
                      {activeCandidate.toolsDetails.analitica.salaryAlert ? (
                        <div className="flex items-center justify-center gap-1 text-rose-400 font-bold text-xs bg-rose-500/5 py-1 px-2 rounded border border-rose-500/10 animate-pulse">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Desalineación Directa</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1 text-emerald-400 font-bold text-xs bg-emerald-500/5 py-1 px-2 rounded border border-emerald-500/10">
                          <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                          <span>Alineado</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Salary details check */}
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 flex justify-between text-xs">
                    <div>
                      <span className="text-[#879391] block">Pretensiones Salariales Candidato:</span>
                      <span className="font-bold text-white">{activeCandidate.toolsDetails.analitica.salaryRequested}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[#879391] block">Banda Máxima Autorizada Cliente:</span>
                      <span className="font-bold text-[#6bd8cb]">{activeCandidate.toolsDetails.analitica.salaryOffered}</span>
                    </div>
                  </div>

                  {/* Transcript Snippets */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Extracto Clave Zoom (Meeting)</h5>
                    <div className="space-y-3 bg-[#101415]/50 border border-white/5 rounded-xl p-4 overflow-y-auto max-h-48">
                      {activeCandidate.toolsDetails.analitica.transcriptSnippets.map((t, idx) => (
                        <div key={idx} className="text-xs space-y-1">
                          <span className={`font-black uppercase tracking-wider text-[9px] ${t.speaker === "Candidato" || t.speaker === "Candidata" ? "text-amber-500" : "text-[#c4c1fb]"}`}>
                            {t.speaker}:
                          </span>
                          <p className="text-[#e2e5e7] italic leading-relaxed">"{t.text}"</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Micro-expressions detected list */}
                  <div className="space-y-2.5">
                    <h5 className="text-[10px] font-bold text-white/50 uppercase tracking-wider">Microexpresiones & Insights de Voz</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {activeCandidate.toolsDetails.analitica.microExpressionsDetected.map((m, idx) => (
                        <span key={idx} className="px-2.5 py-1 text-[9px] font-mono font-bold bg-[#6bd8cb]/15 text-[#6bd8cb] border border-[#6bd8cb]/25 rounded">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 3: TRADUCTOR CV */}
              {activeTab === "traductor" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">Traductor y Estandarizador de Perfiles</h4>
                      <p className="text-[10px] text-[#879391]">Traduce y normaliza de forma síncrona el currículum al inglés para simplificar la evaluación del cliente internacional.</p>
                    </div>

                    <button
                      onClick={runTranslationAndStadardizer}
                      disabled={isSimulatingTranslation || activeCandidate.toolsDetails.traductor.cvTranslated}
                      className="px-4 py-2 font-black rounded-xl bg-[#6bd8cb] text-[#101415] hover:bg-[#6bd8cb]/95 text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      {isSimulatingTranslation ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : activeCandidate.toolsDetails.traductor.cvTranslated ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Traducido Exitosamente</span>
                        </>
                      ) : (
                        <>
                          <Languages className="w-3.5 h-3.5" />
                          <span>Traducir al Inglés & Estandarizar</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left text-xs">
                    <div className="space-y-2">
                      <span className="text-[9px] uppercase font-bold text-white/40 block">Extracto Original (Castellano/Portugués)</span>
                      <div className="bg-[#101415]/75 border border-white/5 rounded-xl p-4 min-h-36 font-sans leading-relaxed text-[#c4c1fb]">
                        {activeCandidate.toolsDetails.traductor.originalCVText}
                      </div>
                    </div>

                    <div className="space-y-2">
                       <span className="text-[9px] uppercase font-bold text-white/40 block">Vista Normalizada Standard (Inglés)</span>
                       <div className="bg-[#101415]/75 border border-white/5 rounded-xl p-4 min-h-36 font-sans leading-relaxed text-white">
                         {activeCandidate.toolsDetails.traductor.cvTranslated ? (
                           <div className="space-y-2.5">
                             <div className="flex items-center gap-1.5 pb-1 border-b border-white/10 text-emerald-400 text-[10px] font-bold">
                               <Check className="w-3.5 h-3.5 shrink-0" />
                               <span>CV NORMALIZED (ATS SECURE STYLE)</span>
                             </div>
                             <p>{activeCandidate.toolsDetails.traductor.translatedCVText}</p>
                           </div>
                         ) : (
                           <div className="flex flex-col items-center justify-center h-28 text-center text-[#879391] italic text-[11px] gap-2">
                             <Languages className="w-6 h-6 opacity-30" />
                             <span>Traducción pendiente. Haz click en el botón superior.</span>
                           </div>
                         )}
                       </div>
                    </div>
                  </div>

                  {activeCandidate.toolsDetails.traductor.cvTranslated && (
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex justify-between items-center gap-2">
                      <span>Currículum disponible para el cliente en formato internacional estándar (PDF / CV Inglés).</span>
                      <button 
                        onClick={() => handleCopyText(activeCandidate.toolsDetails.traductor.translatedCVText, "translated_cv")}
                        className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/25 hover:bg-emerald-500/25 transition-all text-[10px] font-bold cursor-pointer shrink-0"
                      >
                        Copiar CV Traducido
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 4: CANDIDATE BRIEFING */}
              {activeTab === "briefing" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">Generador de Candidate Briefings</h4>
                      <p className="text-[10px] text-[#879391]">Crea el resumen ejecutivo de 3 párrafos (Fit Técnico, Fit Cultural, Alineación Salarial) listo para enviar por correo o Teams al Hiring Manager.</p>
                    </div>

                    <button
                      onClick={runBriefingGenerator}
                      disabled={isSimulatingBriefingGen}
                      className="px-4 py-2 font-black rounded-xl bg-gradient-to-tr from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-[#101415] text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSimulatingBriefingGen ? 'animate-spin' : ''}`} />
                      <span>{isSimulatingBriefingGen ? "Generando..." : "Generar Briefing IA"}</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[9px] uppercase font-bold text-white/40 block">Briefing Ejecutivo de Presentación</span>
                    <div className="bg-[#101415] border border-white/10 rounded-2xl p-5 min-h-[160px] font-mono text-xs leading-relaxed text-left relative">
                      {activeCandidate.toolsDetails.briefing.generated ? (
                        <>
                          <p className="whitespace-pre-line text-[#e0e3e5]">{activeCandidate.toolsDetails.briefing.content}</p>
                          <button
                            onClick={() => handleCopyText(activeCandidate.toolsDetails.briefing.content, "copiar_briefing")}
                            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/15 transition-all text-[10px] text-[#c4c1fb] font-bold flex items-center gap-1 cursor-pointer"
                          >
                            {copiedTextType === "copiar_briefing" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copiedTextType === "copiar_briefing" ? "Copiado" : "Copiar plantilla"}</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-28 text-center text-[#879391] italic text-[11px] gap-2.5">
                          <FileText className="w-7 h-7 opacity-30 animate-pulse" />
                          <span>No hay briefing generado todavía. Presiona "Generar Briefing IA" para compilar el resumen ejecutivo.</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {activeCandidate.toolsDetails.briefing.generated && (
                    <div className="p-3 bg-[#161a1b] rounded-xl text-[10px] text-[#879391] leading-relaxed flex items-start gap-2">
                      <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span>Tip de IA: Este resumen resalta el ajuste del salario y minimiza las brechas de retención primarias. Copia el texto para enviárselo directamente al cliente por email.</span>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 5: AGENDA CONDICIONAL */}
              {activeTab === "agenda" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">Orquestador de Agendas Condicional</h4>
                      <p className="text-[10px] text-[#879391]">Cruza calendarios de reclutadores, clientes y candidatos para proponer slots óptimos de entrevista eliminando demoras de coordinación manual.</p>
                    </div>

                    <button
                      onClick={suggestOptimalSlot}
                      disabled={isSimulatingAgendasSlot || activeCandidate.toolsDetails.agenda.isScheduled}
                      className="px-4 py-2 font-black rounded-xl bg-amber-500 text-stone-900 hover:bg-amber-600 text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shrink-0 animate-pulse"
                    >
                      {activeCandidate.toolsDetails.agenda.isScheduled ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Reunión Agendada</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Sugerir Horario Óptimo</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Scheduled info badge */}
                  {activeCandidate.toolsDetails.agenda.isScheduled && (
                    <div className="p-4.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs space-y-1">
                      <div className="font-bold flex items-center gap-1.5 text-sm">
                        <Check className="w-4 h-4 shrink-0" />
                        <span>¡Reunión en Agenda Confirmada!</span>
                      </div>
                      <p className="text-[11px] text-white">Slot reservado: <span className="font-bold text-emerald-400">{activeCandidate.toolsDetails.agenda.recruiterSlotSelected}</span></p>
                    </div>
                  )}

                  {/* Suggested list check */}
                  <div className="space-y-3.5">
                    <span className="text-[9px] uppercase font-bold text-white/40 block">Franjas de Tiempo Libres Intersectadas</span>
                    {activeCandidate.toolsDetails.agenda.suggestedSlots && activeCandidate.toolsDetails.agenda.suggestedSlots.length > 0 ? (
                      <div className="grid grid-cols-1 gap-2.5">
                        {activeCandidate.toolsDetails.agenda.suggestedSlots.map((slot, idx) => (
                          <div 
                            key={idx} 
                            onClick={suggestOptimalSlot}
                            className="bg-[#101415]/75 border border-white/5 hover:border-amber-500/30 p-3.5 rounded-xl flex justify-between items-center transition-all cursor-pointer text-xs"
                          >
                            <span className="font-bold text-[#e0e3e5]">{slot}</span>
                            <span className="text-[10px] text-amber-500 hover:underline">Agendar con este slot</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      !activeCandidate.toolsDetails.agenda.isScheduled && (
                        <div className="h-28 flex items-center justify-center text-center text-[#879391] italic text-[11px]">
                          No hay franjas libres configuradas para este cliente. Haz clic en "Sugerir Horario Óptimo" para generar intersecciones de calendarios.
                        </div>
                      )
                    )}
                  </div>

                  {/* Visual flowchart mock calendar components */}
                  <div className="p-4 rounded-xl border border-white/10 bg-white/5 space-y-2 text-xs">
                    <span className="font-bold text-white block">Esquema de disponibilidad analizada:</span>
                    <div className="grid grid-cols-3 gap-2.5 text-center text-[10px] font-mono">
                      <div className="p-2 bg-[#161a1b] rounded border border-white/5">
                        <span className="text-[#879391] block">Candidato</span>
                        <span className="text-emerald-400 font-bold">12 Slots OK</span>
                      </div>
                      <div className="p-2 bg-[#161a1b] rounded border border-white/5">
                        <span className="text-[#879391] block">Recruiter</span>
                        <span className="text-emerald-400 font-bold">8 Slots OK</span>
                      </div>
                      <div className="p-2 bg-[#161a1b] rounded border border-white/5">
                        <span className="text-[#879391] block">Cliente (Hiring)</span>
                        <span className="text-amber-500 font-bold">3 Slots OK</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 6: RASTREADOR DE SLA */}
              {activeTab === "tracker" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex justify-between items-center pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white">Bot Rastreador de SLAs para Clientes</h4>
                      <p className="text-[10px] text-[#879391]">Monitorea si el cliente responde dentro de las 48 horas de SLA para evitar que el candidato se enfríe y pierda enganche (engagement).</p>
                    </div>

                    <button
                      onClick={sendSlaAlertPing}
                      disabled={isSimulatingSlaPing}
                      className="px-4 py-2 font-black rounded-xl bg-amber-500 text-stone-900 hover:bg-amber-600 text-xs transition-all disabled:opacity-50 flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
                    >
                      <Send className={`w-3.5 h-3.5 ${isSimulatingSlaPing ? 'animate-spin' : ''}`} />
                      <span>{isSimulatingSlaPing ? "Enviando..." : "Enviar Ping de recordatorio (SLA)"}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5">
                    <div className="glass-panel p-4.5 rounded-xl border border-white/5 bg-[#101415]/75 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-[#879391] block">Tiempo transcurrido desde Envío</span>
                      <span className="text-xl font-black font-mono text-white block">
                        {activeCandidate.toolsDetails.tracker.hoursSinceSent} horas
                      </span>
                    </div>

                    <div className="glass-panel p-4.5 rounded-xl border border-white/5 bg-[#101415]/75 space-y-1">
                      <span className="text-[9px] uppercase font-bold text-[#879391] block">Pings enviados por ATS</span>
                      <span className="text-xl font-black font-mono text-[#6bd8cb] block">
                        {activeCandidate.toolsDetails.tracker.totalRemindersSent} alertas
                      </span>
                    </div>
                  </div>

                  {activeCandidate.toolsDetails.tracker.slaExceeded ? (
                    <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex items-center gap-3">
                      <AlertTriangle className="w-5 h-5 text-rose-455 shrink-0 animate-pulse" />
                      <div>
                        <span className="font-black text-white">¡SLA de 48 Horas Excedido! </span>
                        El Hiring Manager de {activeCandidate.client} acumula {activeCandidate.toolsDetails.tracker.hoursSinceSent} horas sin proveer calificado feedback. Se recomienda enviar un Ping o alertar al Key Account Manager de forma manual para evitar cancelaciones tempranas.
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-xs flex items-center gap-3">
                      <ShieldCheck className="w-5 h-5 text-emerald-450 shrink-0" />
                      <div>
                        <span className="font-black text-white">SLA en rango óptimo.</span>
                        Menos de 48 horas en espera. No se requiere intervención crítica, el proceso fluye correctamente según los tiempos esperados.
                      </div>
                    </div>
                  )}

                  {activeCandidate.toolsDetails.tracker.lastReminderTime && (
                    <div className="p-3 bg-[#161a1b] rounded-xl text-[10px] text-[#879391]">
                      Última notificación enviada: <span className="font-bold text-[#c4c1fb]">{new Date(activeCandidate.toolsDetails.tracker.lastReminderTime).toLocaleString("es-ES")}</span>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Slider footer */}
            <div className="px-6 py-4.5 border-t border-white/10 bg-[#101415]/90 backdrop-blur-md flex justify-between items-center">
              <span className="text-[10px] text-[#879391] font-mono">
                Sincronizado con base de datos de Maquetas (Fase 3)
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

      {/* FLOATING TOAST FEEDBACK NOTIFIER */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-[100] px-4 py-3 rounded-xl border border-emerald-500/20 bg-[#101415]/90 shadow-xl shadow-emerald-500/5 backdrop-blur text-emerald-400 text-xs font-bold font-sans flex items-center gap-2 animate-fadeIn border-l-4 border-l-emerald-500">
          <Check className="w-4 h-4 shrink-0 text-emerald-500" />
          <span>{toastMessage}</span>
        </div>
      )}

    </div>
  );
}

// Subcomponents
function KanbanCard({ 
  cad, 
  onSelect, 
  onTransition,
  onDragStart 
}: { 
  cad: PresentacionCandidate; 
  onSelect: (cad: PresentacionCandidate) => void;
  onTransition: (id: string, phase: PresentacionCandidate["currentPhase"]) => void;
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
          <span className={`text-[9px] font-bold ${timer.isDelayed ? "text-rose-400 animate-pulse" : "text-[#879391]"}`} title="Horas acumuladas esperando respuesta">
            {timer.hours}h WIP
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-xs font-bold text-white tracking-tight group-hover:text-amber-500 transition-colors break-words">
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
          <MapPin className="w-3.5 h-3.5 text-amber-500/60" />
          <span className="truncate">{cad.location}</span>
        </div>
      </div>

      <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
        <span className="text-[8px] font-bold tracking-wider text-white/40 uppercase block">Actividad Reciente</span>
        <p className="text-[9px] text-[#879391] leading-relaxed truncate">{cad.lastActivity}</p>
      </div>

      {/* Advanced diagnostics trigger button */}
      <button
        onClick={() => {
          onSelect(cad);
        }}
        className="w-full py-1.5 rounded-xl border border-amber-500/25 bg-amber-500/5 hover:bg-amber-500/15 hover:text-white transition-all text-[9.5px] font-black text-amber-500 flex items-center justify-center gap-1 cursor-pointer shadow"
      >
        <Cpu className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
        <span>Lanzar Herramientas Cliente</span>
      </button>

      {/* Footer controls quick shifts */}
      <div className="flex gap-1.5 pt-2 border-t border-white/5">
        {cad.currentPhase === "08_shortlist" && (
          <button
            onClick={() => onTransition(cad.id, "09_entrevista_cliente")}
            className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/35 text-emerald-400 font-bold text-[9px] flex items-center justify-center gap-0.5 flex-grow cursor-pointer"
          >
            <span>Entrevista</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}

        {cad.currentPhase === "09_entrevista_cliente" && (
          <div className="flex gap-1 flex-grow">
            <button
              onClick={() => onTransition(cad.id, "08_shortlist")}
              className="px-2 py-1 rounded bg-[#161a1b] border border-white/10 hover:bg-white/10 text-white font-bold text-[9px] flex-grow text-center transition-all cursor-pointer"
            >
              Shortlist
            </button>
            <button
              onClick={() => onTransition(cad.id, "10_standby")}
              className="px-2 py-1 rounded bg-purple-500/10 border border-purple-500/20 hover:bg-purple-500/25 text-purple-400 font-bold text-[9px] flex-grow text-center transition-all cursor-pointer"
            >
              Stand-by
            </button>
          </div>
        )}

        {cad.currentPhase === "10_standby" && (
          <button
            onClick={() => onTransition(cad.id, "09_entrevista_cliente")}
            className="px-2 py-1 rounded bg-emerald-500/15 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-stone-900 font-bold text-[9px] flex-grow text-center transition-all cursor-pointer"
          >
            Volver a Entrevista
          </button>
        )}
      </div>

    </div>
  );
}

function EmptyColumnText({ text }: { text: string }) {
  return (
    <div className="h-44 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl p-4 text-center">
      <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold font-sans">
        {text}
      </span>
    </div>
  );
}
