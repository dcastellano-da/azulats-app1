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
  FileText,
  AlertTriangle,
  PlayCircle,
  Eye,
  Send,
  Languages,
  Calendar,
  Bell,
  Sparkles,
  DollarSign,
  Download
} from "lucide-react";
import { 
  CierreCandidate, 
  INITIAL_CIERRE_CANDIDATES, 
  calculateCierreKPIs 
} from "@/lib/cierre";

const ACTIVE_BUSQUEDAS = [
  { id: "b1", client: "Inditex S.A.", role: "Frontend Dev (React/Node)" },
  { id: "b2", client: "Telefónica S.A.", role: "Product Manager Tech" },
  { id: "b3", client: "SEAT S.A.", role: "Software Architect Rust" },
  { id: "b4", client: "Banco Santander", role: "SecOps Specialist" }
];

export default function CierrePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // States
  const [candidates, setCandidates] = useState<CierreCandidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSearch, setSelectedSearch] = useState("Todos");
  const [filterStatus, setFilterStatus] = useState("Todos");
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Details slide-over
  const [activeCandidate, setActiveCandidate] = useState<CierreCandidate | null>(null);
  const [activeTab, setActiveTab] = useState<"general" | "predictivo" | "compensacion" | "contrato" | "feedback" | "preonboarding">("general");
  
  // Sorting states (list view)
  const [sortField, setSortField] = useState<string>("score");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  
  // Custom alerts or notifications
  const [isWipWarningDismissed, setIsWipWarningDismissed] = useState(false);
  const [copiedTextType, setCopiedTextType] = useState<string | null>(null);
  const [activeMetricHelp, setActiveMetricHelp] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Simulated Tool Action States
  const [isSimulatingNego, setIsSimulatingNego] = useState(false);
  const [isSimulatingContractGen, setIsSimulatingContractGen] = useState(false);
  const [isSimulatingFeedbackGen, setIsSimulatingFeedbackGen] = useState(false);
  const [isSimulatingOnboardAdd, setIsSimulatingOnboardAdd] = useState(false);

  // Custom Simulator States
  const [simBaseSal, setSimBaseSal] = useState<number>(0);
  const [simBonus, setSimBonus] = useState<number>(0);
  const [simBenefits, setSimBenefits] = useState<number>(0);

  // Custom Contract States
  const [contractType, setContractType] = useState("Indefinido - Tiempo Completo");
  const [contractStartDate, setContractStartDate] = useState("2026-09-01");

  // Custom Feedback State
  const [rejectionReasonInput, setRejectionReasonInput] = useState("");

  // Toast notifier helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Initialize
  useEffect(() => {
    setCandidates(INITIAL_CIERRE_CANDIDATES);
  }, []);

  // Client-side auth redirect
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load simulator values when candidate is activated
  useEffect(() => {
    if (activeCandidate) {
      setSimBaseSal(activeCandidate.salaryDetails.baseSalary);
      setSimBonus(activeCandidate.salaryDetails.bonusAnnual);
      setSimBenefits(activeCandidate.salaryDetails.benefitsValue);
      setContractStartDate(activeCandidate.toolsDetails.contractGenerator.startDate || "2026-09-01");
      setContractType(activeCandidate.toolsDetails.contractGenerator.contractType || "Indefinido - Tiempo Completo");
      setRejectionReasonInput(activeCandidate.toolsDetails.feedbackWriter.reasonsForReject || "");
    }
  }, [activeCandidate]);

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
  const kpis = calculateCierreKPIs(candidates);
  
  // State transition
  const handleTransitionState = (id: string, targetPhase: CierreCandidate["currentPhase"]) => {
    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const nowIso = new Date().toISOString();
          let closedDate: string | undefined = undefined;
          if (targetPhase !== "11_oferta_extendida") {
            closedDate = nowIso;
          }
          return { 
            ...c, 
            currentPhase: targetPhase, 
            closedDate, 
            lastActivity: `Estado cambiado a ${getPhaseLabel(targetPhase)}` 
          };
        }
        return c;
      })
    );
    if (activeCandidate && activeCandidate.id === id) {
      setActiveCandidate((prev) => {
        if (!prev) return null;
        const nowIso = new Date().toISOString();
        return { 
          ...prev, 
          currentPhase: targetPhase, 
          closedDate: targetPhase !== "11_oferta_extendida" ? nowIso : undefined 
        };
      });
    }
    triggerToast(`Candidato reubicado a la columna de ${getPhaseLabel(targetPhase).substring(5)}`);
  };

  const getPhaseLabel = (phase: CierreCandidate["currentPhase"]) => {
    switch (phase) {
      case "11_oferta_extendida": return "11 - Oferta Extendida / Negociación";
      case "12_contratado": return "12 - Contratado (Won)";
      case "13_rechazado_cliente": return "13 - Rechazado por Cliente (Lost)";
      case "14_candidato_se_baja": return "14 - Candidato se baja (Drop-out)";
    }
  };

  // Drag and Drop
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetCol: CierreCandidate["currentPhase"]) => {
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

  // INTERACTIVE CLOSING TOOLS SIMULATIONS

  // TOOL 1: Motor Predictivo - Ajuste de Bono
  const toggleMitigateRisk = () => {
    if (!activeCandidate) return;
    setIsSimulatingNego(true);
    setTimeout(() => {
      setIsSimulatingNego(false);
      const isCurrentlySelected = activeCandidate.toolsDetails.predictiveMotor.mitigationActionSelected;
      const targetBonus = isCurrentlySelected ? 2000 : 5000;
      const updatedProb = isCurrentlySelected ? 55 : 85;

      setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
        ...c,
        salaryDetails: { ...c.salaryDetails, bonusAnnual: targetBonus },
        toolsDetails: {
          ...c.toolsDetails,
          predictiveMotor: {
            ...c.toolsDetails.predictiveMotor,
            mitigationActionSelected: !isCurrentlySelected,
            adjustedProbability: updatedProb
          }
        }
      } : c));

      setSimBonus(targetBonus);
      setActiveCandidate(prev => {
        if (!prev) return null;
        return {
          ...prev,
          salaryDetails: { ...prev.salaryDetails, bonusAnnual: targetBonus },
          toolsDetails: {
            ...prev.toolsDetails,
            predictiveMotor: {
              ...prev.toolsDetails.predictiveMotor,
              mitigationActionSelected: !isCurrentlySelected,
              adjustedProbability: updatedProb
            }
          }
        };
      });

      triggerToast(
        isCurrentlySelected 
          ? "Mitigación removida. Bono variable restablecido a base."
          : "Mitigación de IA Aplicada. Bono variable incrementado. Probabilidad de aceptación sube al 85%."
      );
    }, 1200);
  };

  // TOOL 3: Generador de Contratos
  const generateContractDraft = () => {
    if (!activeCandidate) return;
    setIsSimulatingContractGen(true);
    setTimeout(() => {
      setIsSimulatingContractGen(false);
      setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
        ...c,
        toolsDetails: {
          ...c.toolsDetails,
          contractGenerator: {
            ...c.toolsDetails.contractGenerator,
            generated: true,
            contractType,
            startDate: contractStartDate
          }
        }
      } : c));

      setActiveCandidate(prev => {
        if (!prev) return null;
        return {
          ...prev,
          toolsDetails: {
            ...prev.toolsDetails,
            contractGenerator: {
              ...prev.toolsDetails.contractGenerator,
              generated: true,
              contractType,
              startDate: contractStartDate
            }
          }
        };
      });

      triggerToast("Borrador de contrato redactado mediante Co-Pilot de Azul ATS.");
    }, 1500);
  };

  // TOOL 4: Redactor de Feedback & Registro
  const generateAiFeedback = () => {
    if (!activeCandidate) return;
    setIsSimulatingFeedbackGen(true);
    setTimeout(() => {
      setIsSimulatingFeedbackGen(false);
      const text = rejectionReasonInput || "Falta de ajuste en pretensiones finales frente a la banda corporativa máxima del cliente.";
      const feedbackDraft = `Estimado/a ${activeCandidate.name},\n\nQueremos agradecerte sinceramente tu participación activa y honestidad en el proceso de selección para el puesto de ${activeCandidate.role} con nuestro cliente ${activeCandidate.client}.\n\nTras evaluar el resultado del proceso de negociación y cierre, lamentablemente te informamos que en esta ocasión no procederemos con tu contratación. Identificamos en tu perfil profesional capacidades valiosas y habilidades comunicativas excelentes, no obstante, la causa del descarte radica en: ${text.toLowerCase()}.\n\nRegistramos tu postulación para futuros contactos donde exista mayor sintonía operativa. Te deseamos el mayor de los éxitos.\n\nCierre de Triada / Co-Pilot de Azul ATS.`;
      
      setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
        ...c,
        toolsDetails: {
          ...c.toolsDetails,
          feedbackWriter: {
            ...c.toolsDetails.feedbackWriter,
            reasonsForReject: text,
            generatedFeedback: feedbackDraft
          }
        }
      } : c));

      setActiveCandidate(prev => {
        if (!prev) return null;
        return {
          ...prev,
          toolsDetails: {
            ...prev.toolsDetails,
            feedbackWriter: {
              ...prev.toolsDetails.feedbackWriter,
              reasonsForReject: text,
              generatedFeedback: feedbackDraft
            }
          }
        };
      });

      triggerToast("Borrador empático de feedback estructurado e indexado por IA.");
    }, 1500);
  };

  const deliverManualFeedback = () => {
    if (!activeCandidate) return;
    setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
      ...c,
      feedbackStatus: "entregado_manual",
      toolsDetails: {
        ...c.toolsDetails,
        feedbackWriter: {
          ...c.toolsDetails.feedbackWriter,
          isSent: true
        }
      }
    } : c));

    setActiveCandidate(prev => {
      if (!prev) return null;
      return {
        ...prev,
        feedbackStatus: "entregado_manual",
        toolsDetails: {
          ...prev.toolsDetails,
          feedbackWriter: {
            ...prev.toolsDetails.feedbackWriter,
            isSent: true
          }
        }
      };
    });

    triggerToast("Feedback registrado formalmente. Métrica de Tasa de Cierre Constructivo incrementada.");
  };

  // TOOL 5: Pre-Onboarding - Agregar hito
  const addPreonboardMilestone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCandidate) return;
    const form = e.target as HTMLFormElement;
    const day = (form.elements.namedItem("day") as HTMLInputElement).value;
    const title = (form.elements.namedItem("title") as HTMLInputElement).value;
    
    if (!day || !title) return;
    
    setIsSimulatingOnboardAdd(true);
    setTimeout(() => {
      setIsSimulatingOnboardAdd(false);
      const newStep = {
        day,
        title,
        status: "scheduled" as const,
        previewText: `Notificación programada para el día ${day}: ${title}.`
      };

      setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
        ...c,
        toolsDetails: {
          ...c.toolsDetails,
          preOnboard: {
            ...c.toolsDetails.preOnboard,
            cadenceSteps: [...c.toolsDetails.preOnboard.cadenceSteps, newStep]
          }
        }
      } : c));

      setActiveCandidate(prev => {
        if (!prev) return null;
        return {
          ...prev,
          toolsDetails: {
            ...prev.toolsDetails,
            preOnboard: {
              ...prev.toolsDetails.preOnboard,
              cadenceSteps: [...prev.toolsDetails.preOnboard.cadenceSteps, newStep]
            }
          }
        };
      });

      form.reset();
      triggerToast("Nuevo hito de acompañamiento programado en la cadencia de pre-onboarding.");
    }, 800);
  };

  // Sorting list view candidates helper
  const sortCandidates = (a: CierreCandidate, b: CierreCandidate) => {
    let aVal: any = a[sortField as keyof CierreCandidate];
    let bVal: any = b[sortField as keyof CierreCandidate];

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
      ? <ChevronUp className="w-3 h-3 text-emerald-400 ml-1 inline-block" />
      : <ChevronDown className="w-3 h-3 text-emerald-400 ml-1 inline-block" />;
  };

  // Applied Filters
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
  const countNego = candidates.filter((c) => c.currentPhase === "11_oferta_extendida").length;
  const countWon = candidates.filter((c) => c.currentPhase === "12_contratado").length;
  const countInactive = candidates.filter((c) => c.currentPhase === "13_rechazado_cliente" || c.currentPhase === "14_candidato_se_baja").length;

  return (
    <div className={`relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden transition-all duration-350 ${isFullScreen ? 'p-4' : ''}`}>
      {/* Background radial blurs */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-emerald-500/5 blur-[90px] pointer-events-none"></div>
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#6bd8cb]/5 blur-[90px] pointer-events-none"></div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 bg-[#15181a] border border-[#6bd8cb]/30 text-white rounded-xl shadow-2xl flex items-center gap-2.5 max-w-sm animate-fadeIn">
          <Zap className="w-4 h-4 text-[#6bd8cb] shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      <div className={`relative z-10 mx-auto space-y-8 ${isFullScreen ? 'max-w-none' : 'max-w-7xl'}`}>
        
        {/* Navigation Banner Header */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-6 border-b border-white/10">
          <div className="flex justify-between items-center w-full lg:w-auto gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-500 to-[#6bd8cb] flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Compass className="w-6 h-6 text-[#101415]" />
              </div>
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Fase 4: Cierre del Proceso
                  </span>
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 rounded-md animate-pulse">
                    CONTRATACIÓN Y OFERTAS
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                  Cierre y Negociación de Candidatos
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

          {/* Top horizontal actions menu */}
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

                <Link
                  href="/presentacion"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-amber-500 hover:bg-[#9b5de5]/10 hover:text-white transition-all duration-200 flex items-center gap-1.5"
                >
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">F3 Cliente</span>
                </Link>

                <div
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/25 flex items-center gap-1.5 select-none"
                  title="F4 Cierre (Módulo Actual)"
                >
                  <Compass className="w-4 h-4 text-emerald-400" />
                  <span className="hidden sm:inline">F4 Cierre</span>
                </div>
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
                <span className="font-bold">¡Alerta de Saturación de Ofertas en Cierre (Límite WIP Excedido)! </span>
                Actualmente tienes {kpis.activeClosingWipCount} candidatos bajo negociación formal (Oferta Extendida). Se recomienda asignar tiempo intensivo al cierre individual antes de ofertar a nuevos postulantes a fin de evitar cancelaciones por tardanza.
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
          
          {/* CARD 1: Decision Latency */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px] text-left">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">Decision Latency</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Demora promedio de aceptación</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'decision_latency' ? null : 'decision_latency')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-white">{kpis.avgDecisionLatencyHours} horas</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                kpis.avgDecisionLatencyHours > 48 ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
              }`}>
                {kpis.avgDecisionLatencyHours > 48 ? "Alerta (>48h)" : "Correcto (<48h)"}
              </span>
            </div>
            <Clock className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none text-emerald-500" />

            {/* Help Overlay */}
            {activeMetricHelp === 'decision_latency' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Decision Latency</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Mide las horas laborables transcurridas desde que se extiende la oferta formal escrita hasta que el candidato firma o la rechaza. Meta: inferior a 48 horas.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: Σ(Horas hasta cierre) / Nº candidatos en cierre finalizado
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CARD 2: Calibration Accuracy */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px] text-left">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">Constructive Feedback</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Tasa de cierre empático</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'feedback_closure' ? null : 'feedback_closure')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-emerald-400">{kpis.feedbackClosureRate}%</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                kpis.feedbackClosureRate >= 50 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-450 border border-rose-500/20"
              }`}>
                {kpis.feedbackClosureRate >= 50 ? "Sano" : "Bajo"}
              </span>
            </div>
            <ShieldCheck className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none text-[#6bd8cb]" />

            {/* Help Overlay */}
            {activeMetricHelp === 'feedback_closure' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Constructive Feedback Rate</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Mide la cobertura de candidatos desestimados en las instancias finales (Rechazados por cliente o Desertores) que recibieron feedback personalizado oral ó escrito manual calificado, protegiendo el employer branding.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: (Nº candidatos con feedback manual) / (Total descartados) * 100
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CARD 3: Offer Acceptance Rate */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px] text-left">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">Offer Acceptance (OAR)</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Porcentaje de éxito final</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'oar' ? null : 'oar')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-[#c4c1fb]">{kpis.offerAcceptanceRate}%</span>
              <span className="text-[10px] text-emerald-450 bg-[#6bd8cb]/15 px-2 py-0.5 rounded font-bold">Excelente</span>
            </div>
            <UserCheck className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none text-[#c4c1fb]" />

            {/* Help Overlay */}
            {activeMetricHelp === 'oar' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-wider">Offer Acceptance Rate</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Mide la tasa de éxito de las propuestas económicas emitidas. Es la métrica decisiva para calibrar si los salarios ofertados corresponden a la realidad macroeconómica del rol.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: (Nº Contratados (12) / Total ofertas resueltas (12 y 14)) * 100
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* CARD 4: WIP Total of Phase */}
          <div className="glass-panel p-5 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px] text-left">
            <div className="flex justify-between items-start mb-1">
              <div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block">Closing WIP</span>
                <p className="text-[9px] text-[#879391] mt-0.5">Propuestas activas en mesa</p>
              </div>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'closing_wip' ? null : 'closing_wip')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm shrink-0"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-emerald-400">{kpis.activeClosingWipCount} en nego</span>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                kpis.isWipOverloaded ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20"
              }`}>
                {kpis.isWipOverloaded ? "Sobrecargado" : "Saludable"}
              </span>
            </div>
            <Cpu className="absolute top-2 right-2 w-12 h-12 opacity-5 pointer-events-none text-emerald-500" />

            {/* Help Overlay */}
            {activeMetricHelp === 'closing_wip' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-[#6bd8cb] uppercase tracking-wider">Carga de Negociación</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Conteo total de perfiles que recibieron formalmente el contrato o carta de oferta y están en interacciones semanales/diarias previas a la decisión final. Límite ideal recomendado &le; 5.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Cálculo: Conteo directo de candidatos en fase '11_oferta_extendida'.
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
                className="w-full bg-[#101415]/60 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#879391] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/15 focus:outline-none transition-all font-medium"
              />
            </div>

            {/* Client/Search select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-[#879391] whitespace-nowrap font-medium">Búsqueda activa:</span>
              <select
                value={selectedSearch}
                onChange={(e) => setSelectedSearch(e.target.value)}
                className="bg-[#101415]/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer w-full md:w-auto font-bold"
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
                <span className="text-xs text-[#c4c1fb] whitespace-nowrap font-medium">Fase cierre:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#101415]/60 border border-[#c4c1fb]/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer w-full md:w-auto font-bold"
                >
                  <option value="Todos" className="bg-[#15181a]">Todas las Fases</option>
                  <option value="11_oferta_extendida" className="bg-[#15181a]">11 - Oferta Extendida</option>
                  <option value="12_contratado" className="bg-[#15181a]">12 - Contratado</option>
                  <option value="13_rechazado_cliente" className="bg-[#15181a]">13 - Rechazado por Cliente</option>
                  <option value="14_candidato_se_baja" className="bg-[#15181a]">14 - Candidato se baja</option>
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
                    ? "bg-emerald-500 text-[#101415] shadow shadow-emerald-500/10"
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
                    ? "bg-emerald-500 text-[#101415] shadow shadow-emerald-500/10"
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
            
            {/* COLUMN 1: Oferta Extendida / Negociación */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "11_oferta_extendida")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-amber-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">11 - Oferta Extendida / Negociación</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Propuestas en revisión final</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-500 font-mono">
                  {countNego}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "11_oferta_extendida").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={setActiveCandidate} onTransition={handleTransitionState} onDragStart={handleDragStart} />
                ))}
                {countNego === 0 && <EmptyColumnText text="Ninguna propuesta activa" />}
              </div>
            </div>

            {/* COLUMN 2: Contratado (Won) */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "12_contratado")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-emerald-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">12 - Contratado (Won)</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Firmados y en pre-onboarding</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 font-mono">
                  {countWon}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "12_contratado").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={setActiveCandidate} onTransition={handleTransitionState} onDragStart={handleDragStart} />
                ))}
                {countWon === 0 && <EmptyColumnText text="Ninguna contratación" />}
              </div>
            </div>

            {/* COLUMN 3: Inactivos (Rejected / Dropped-out) */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "13_rechazado_cliente")} // Default transition to reject
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-rose-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">Inactivos (13 Lost & 14 Drop-out)</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Rechazos cliente o desistidos</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-rose-455 font-mono">
                  {countInactive}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "13_rechazado_cliente" || c.currentPhase === "14_candidato_se_baja").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={setActiveCandidate} onTransition={handleTransitionState} onDragStart={handleDragStart} />
                ))}
                {countInactive === 0 && <EmptyColumnText text="Ningún finalizado inactivo" />}
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
                    Fase Cierre {renderSortIcon("phase")}
                  </th>
                  <th className="px-5 py-4 text-center">
                    Feedback de Cierre
                  </th>
                  <th className="px-5 py-4 cursor-pointer hover:text-white text-center" onClick={() => toggleSort("score")}>
                    Fit Score {renderSortIcon("score")}
                  </th>
                  <th className="px-5 py-4 text-right">Herramientas IA Cierre</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-medium">
                {sortedListCandidates.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-5 py-8 text-center text-[#879391] bg-white/5">
                      No se encontraron candidatos de cierre que coincidan con la búsqueda.
                    </td>
                  </tr>
                ) : (
                  sortedListCandidates.map((cad) => (
                    <tr key={cad.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-bold text-white text-sm">{cad.name}</div>
                        <div className="text-[10px] text-[#879391] mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-emerald-500/70" />
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
                          cad.currentPhase === "11_oferta_extendida" ? "bg-amber-500/10 text-amber-400 border border-amber-500/15" :
                          cad.currentPhase === "12_contratado" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/15" : 
                          "bg-rose-500/10 text-rose-400 border border-rose-500/15"
                        }`}>
                          {getPhaseLabel(cad.currentPhase).substring(5)}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full inline-block font-mono ${
                          cad.feedbackStatus === "entregado_manual" 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25" 
                            : cad.currentPhase === "11_oferta_extendida" || cad.currentPhase === "12_contratado" 
                            ? "bg-white/5 text-white/50 border border-white/5" 
                            : "bg-rose-500/10 text-rose-455 border border-[#ffb4ab]/25"
                        }`}>
                          {cad.feedbackStatus === "entregado_manual" ? "Cualitativo Entregado" : "Pendiente"}
                        </span>
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
                          className="px-3.5 py-1.5 text-[10px] font-black rounded-xl bg-gradient-to-tr from-emerald-500/25 to-[#c4c1fb]/15 border border-[#c4c1fb]/20 text-[#c4c1fb] hover:bg-[#c4c1fb] hover:text-[#101415] hover:shadow-lg transition-all cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Lanzar Co-Pilot Cierre</span>
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
                <span className="text-[9px] font-mono text-emerald-400 bg-emerald-500/15 px-2.5 py-0.5 rounded border border-emerald-500/25 uppercase font-bold tracking-widest inline-block mb-1">
                  MÓDULO DE NEGOCIACIÓN F4
                </span>
                <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                  <span>Negociación de {activeCandidate.name}</span>
                  <span className="px-2 py-0.5 text-xs text-white/40 font-mono bg-white/5 rounded-md border border-white/10">
                    {activeCandidate.id}
                  </span>
                </h2>
                <p className="text-[10px] text-[#879391] mt-0.5">
                  Herramientas operativas avanzadas: predictores de aceptación, simuladores financieros de beneficios, contratos y pre-onboard.
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
                  activeTab === "general" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                1. Propuesta & Info
              </button>
              <button 
                onClick={() => setActiveTab("predictivo")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "predictivo" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>2. Motor Predictivo</span>
              </button>
              <button 
                onClick={() => setActiveTab("compensacion")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "compensacion" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>3. Simulador de Salario</span>
              </button>
              <button 
                onClick={() => setActiveTab("contrato")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "contrato" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>4. Generador de Contrato</span>
              </button>
              <button 
                onClick={() => setActiveTab("feedback")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "feedback" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <Languages className="w-3.5 h-3.5" />
                <span>5. Feedback de Cierre</span>
              </button>
              <button 
                onClick={() => setActiveTab("preonboarding")}
                className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                  activeTab === "preonboarding" ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "text-[#879391] hover:text-white"
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>6. Pre-Onboarding</span>
              </button>
            </nav>

            {/* TAB CONTENT */}
            <div className="flex-grow p-6 overflow-y-auto space-y-6">
              
              {/* TAB 1: GENERAL & INFO */}
              {activeTab === "general" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    
                    {/* Contact details */}
                    <div className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-3.5">
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-bold">Información de Contacto</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Nombre completo:</span>
                          <span className="text-white font-bold">{activeCandidate.name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Correo electrónico:</span>
                          <a href={`mailto:${activeCandidate.email}`} className="text-emerald-400 underline font-bold hover:text-emerald-300">
                            {activeCandidate.email}
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Teléfono móvil:</span>
                          <a href={`tel:${activeCandidate.contactNumber}`} className="text-white hover:text-emerald-500 font-mono">
                            {activeCandidate.contactNumber}
                          </a>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Ubicación física:</span>
                          <span className="text-[#e2e5e7]">{activeCandidate.location}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Experiencia laboral:</span>
                          <span className="text-[#e2e5e7] font-semibold">{activeCandidate.experienceYears} años</span>
                        </div>
                      </div>
                    </div>

                    {/* Financial details */}
                    <div className="glass-panel p-4.5 rounded-2xl border border-white/5 space-y-3.5">
                      <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-bold">Desglose de Propuesta Financiera</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Expectativa del Candidato:</span>
                          <span className="text-white/80 font-mono font-bold">
                            {activeCandidate.salaryDetails.expectedSalary.toLocaleString()} € / año
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Salario Base Propuesto:</span>
                          <span className="text-white font-mono font-bold">
                            {activeCandidate.salaryDetails.baseSalary.toLocaleString()} € / año
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Bono Variable Anual:</span>
                          <span className="text-amber-400 font-mono font-bold">
                            + {activeCandidate.salaryDetails.bonusAnnual.toLocaleString()} € / año
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Salario en Especie / Beneficios:</span>
                          <span className="text-emerald-400 font-mono font-bold">
                            + {activeCandidate.salaryDetails.benefitsValue.toLocaleString()} € / año
                          </span>
                        </div>
                        <hr className="border-white/5 my-1" />
                        <div className="flex justify-between text-sm">
                          <span className="text-white font-semibold">Compensación Total Directa:</span>
                          <span className="text-[#6bd8cb] font-mono font-black">
                            {(
                              activeCandidate.salaryDetails.baseSalary + 
                              activeCandidate.salaryDetails.bonusAnnual + 
                              activeCandidate.salaryDetails.benefitsValue
                            ).toLocaleString()} € / año
                          </span>
                        </div>
                      </div>
                    </div>

                  </div>

                  {/* Flow Status Controller */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4">
                    <h4 className="text-xs font-black text-[#c4c1fb] uppercase tracking-widest font-bold">Control manual del Embudo de Cierre</h4>
                    <p className="text-[11px] text-[#879391]">
                      Transiciona manualmente al candidato dentro del embudo operativo. Estas acciones recalcularán los KPIs del dashboard al instante.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 select-none">
                      <button
                        onClick={() => handleTransitionState(activeCandidate.id, "11_oferta_extendida")}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer text-center ${
                          activeCandidate.currentPhase === "11_oferta_extendida"
                            ? "bg-amber-500/10 border-amber-500/40 text-amber-400 shadow-md"
                            : "bg-white/5 border-white/5 text-[#879391] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        11. Oferta Extendida
                      </button>
                      <button
                        onClick={() => handleTransitionState(activeCandidate.id, "12_contratado")}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer text-center ${
                          activeCandidate.currentPhase === "12_contratado"
                            ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-md font-bold"
                            : "bg-white/5 border-white/5 text-[#879391] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        12. Contratado (Won)
                      </button>
                      <button
                        onClick={() => handleTransitionState(activeCandidate.id, "13_rechazado_cliente")}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer text-center ${
                          activeCandidate.currentPhase === "13_rechazado_cliente"
                            ? "bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-md"
                            : "bg-white/5 border-white/5 text-[#879391] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        13. Rechazado Cliente
                      </button>
                      <button
                        onClick={() => handleTransitionState(activeCandidate.id, "14_candidato_se_baja")}
                        className={`px-3 py-2.5 rounded-xl border text-xs font-semibold tracking-wide transition-all cursor-pointer text-center ${
                          activeCandidate.currentPhase === "14_candidato_se_baja"
                            ? "bg-rose-500/15 border-rose-500/40 text-rose-450 shadow-md"
                            : "bg-white/5 border-white/5 text-[#879391] hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        14. Candidato se baja
                      </button>
                    </div>
                  </div>

                  {/* General timeline activity log */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3 text-left">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-bold">Bitácora de Actividades</h4>
                    <div className="space-y-3">
                      <div className="flex gap-3 text-xs">
                        <span className="w-16 font-mono text-[#879391] shrink-0">Hoy</span>
                        <div className="space-y-0.5">
                          <p className="text-white font-bold">{activeCandidate.lastActivity}</p>
                          <p className="text-[10px] text-[#879391]">Recruiter Operations Terminal • Auditado</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="w-16 font-mono text-[#879391] shrink-0">Ayer</span>
                        <div className="space-y-0.5">
                          <p className="text-white/80">Propuesta económica calibrada con el motor predictivo de riesgo.</p>
                          <p className="text-[10px] text-[#879391]">Co-Pilot Suggestion Run</p>
                        </div>
                      </div>
                      <div className="flex gap-3 text-xs">
                        <span className="w-16 font-mono text-[#879391] shrink-0">2 días</span>
                        <div className="space-y-0.5">
                          <p className="text-white/80">Proceso habilitado en la Fase 4 de Cierre. Solicitud de contrato inicial.</p>
                          <p className="text-[10px] text-[#879391]">System Event Handler</p>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* TAB 2: MOTOR PREDICTIVO */}
              {activeTab === "predictivo" && (
                <div className="space-y-5 animate-fadeIn">
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-4 text-left">
                    <div className="flex items-center gap-2 text-amber-500">
                      <Sparkles className="w-5 h-5 animate-pulse" />
                      <h4 className="text-sm font-black uppercase tracking-wider font-bold">Simulación del Motor Predictivo de Cierre</h4>
                    </div>
                    <p className="text-xs text-white/80 leading-relaxed">
                      El modelo inteligente evalúa las variables de compensación ofrecida cara a la banda de riesgo del perfil, arrojando la probabilidad matemática de que el candidato acepte la propuesta sin desertar o solicitar re-negociaciones.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                      <div className="p-4 bg-[#101415] rounded-xl border border-white/5 space-y-1">
                        <span className="text-[9px] uppercase font-bold text-[#879391]">Probabilidad Base</span>
                        <p className="text-2xl font-black text-white/40">{activeCandidate.toolsDetails.predictiveMotor.baseProbability}%</p>
                        <p className="text-[9px] text-[#879391]">Cálculo inicial sin mitigaciones</p>
                      </div>

                      <div className="p-4 bg-[#101415] rounded-xl border border-white/5 space-y-1 col-span-2">
                        <span className="text-[9px] uppercase font-bold text-amber-500">Probabilidad Calibrada (Con IA)</span>
                        <div className="flex justify-between items-end">
                          <p className="text-3xl font-black text-amber-500">
                            {activeCandidate.toolsDetails.predictiveMotor.adjustedProbability}%
                          </p>
                          <span className={`text-[10px] px-2 py-0.5 font-bold rounded ${
                            activeCandidate.toolsDetails.predictiveMotor.adjustedProbability >= 80 
                              ? "bg-emerald-500/10 text-emerald-450 border border-emerald-500/20" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          }`}>
                            {activeCandidate.toolsDetails.predictiveMotor.adjustedProbability >= 80 ? "Alta Probabilidad" : "Atención Requerida"}
                          </span>
                        </div>
                        <p className="text-[9px] text-[#879391] mt-0.5">Calculada según flexibilidad económica agregada</p>
                      </div>
                    </div>
                  </div>

                  {/* Risk Factors */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3.5 text-left">
                    <h4 className="text-xs font-black text-[#ffb4ab] uppercase tracking-widest font-bold">Factores de Riesgo Críticos Detectados</h4>
                    <div className="space-y-2">
                      {activeCandidate.toolsDetails.predictiveMotor.riskFactors.length === 0 ? (
                        <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> No se detectan anomalías de alto riesgo para esta postulación.
                        </p>
                      ) : (
                        activeCandidate.toolsDetails.predictiveMotor.riskFactors.map((factor, idx) => (
                          <div key={idx} className="flex gap-2 text-xs text-amber-300 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10 items-start">
                            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                            <span>{factor}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Mitigation Toggle */}
                  {activeCandidate.currentPhase === "11_oferta_extendida" && (
                    <div className="p-5 rounded-2xl border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 flex flex-col md:flex-row justify-between items-center gap-4 text-left">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-white uppercase">Acción Correctiva Sugerida por Co-Pilot</h4>
                        <p className="text-[11px] text-[#879391] leading-normal">
                          Incrementar el bono variable anual propuesto a fin de compensar la brecha del 8% contra la pretensión salarial declarada por el candidato.
                        </p>
                      </div>
                      <button
                        onClick={toggleMitigateRisk}
                        disabled={isSimulatingNego}
                        className={`px-4 py-2.5 rounded-xl font-bold text-xs uppercase cursor-pointer flex items-center gap-2 transition-all ${
                          isSimulatingNego 
                            ? "bg-white/5 text-white/50 border border-white/10 shrink-0"
                            : activeCandidate.toolsDetails.predictiveMotor.mitigationActionSelected
                            ? "bg-rose-500 hover:bg-rose-600 text-white font-bold shrink-0 shadow-md"
                            : "bg-emerald-500 hover:bg-emerald-600 text-[#101415] font-black shrink-0 shadow-lg shadow-[#0d9488]/10"
                        }`}
                      >
                        {isSimulatingNego ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Calculando...</span>
                          </>
                        ) : activeCandidate.toolsDetails.predictiveMotor.mitigationActionSelected ? (
                          <span>Remover Mitigación</span>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Aplicar mitigación</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 3: SALARY SIMULATOR */}
              {activeTab === "compensacion" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 text-left space-y-4">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-bold">Simulador de Compensación Total Flexible</h4>
                    <p className="text-[11px] text-[#879391] leading-relaxed">
                      Actualiza los valores de la propuesta para simular el impacto en la remuneración flexible y contrastarlo con las expectativas del postulante.
                    </p>

                    <div className="space-y-4">
                      {/* Base Salary Input */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <label className="text-[#e2e5e7] font-semibold">Salario Base Bruto Anual: ({simBaseSal.toLocaleString()} €)</label>
                        </div>
                        <input
                          type="range"
                          min={30000}
                          max={100000}
                          step={1000}
                          value={simBaseSal}
                          onChange={(e) => setSimBaseSal(Number(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      {/* Variable Bonus Input */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <label className="text-[#e2e5e7] font-semibold">Bono Variable Anual: ({simBonus.toLocaleString()} €)</label>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={15000}
                          step={500}
                          value={simBonus}
                          onChange={(e) => setSimBonus(Number(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>

                      {/* Corporate Benefits Value Input */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <label className="text-[#e2e5e7] font-semibold">Monetización de Beneficios Extra: ({simBenefits.toLocaleString()} €)</label>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={5000}
                          step={100}
                          value={simBenefits}
                          onChange={(e) => setSimBenefits(Number(e.target.value))}
                          className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Calculations breakdown details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-left">
                    <div className="glass-panel p-5 rounded-2xl border border-white/5 space-y-3">
                      <h4 className="text-xs font-bold text-white uppercase">Cálculo de Remuneración Estimada</h4>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Salario Bruto Total:</span>
                          <span className="font-mono text-white">{(simBaseSal + simBonus).toLocaleString()} € / año</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Neto Aproximado (Fijo IRPF 30%):</span>
                          <span className="font-mono text-white/80">{(simBaseSal * 0.70).toLocaleString()} € / año (Neto)</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#879391]">Sueldo Mensual Neto Estimado x12:</span>
                          <span className="font-mono text-white/90">{Math.round((simBaseSal * 0.70) / 12).toLocaleString()} € / mes</span>
                        </div>
                        <hr className="border-white/5 my-1" />
                        <div className="flex justify-between text-[#6bd8cb] font-bold">
                          <span>Compensación Total Flexible:</span>
                          <span className="font-mono">{(simBaseSal + simBonus + simBenefits).toLocaleString()} €</span>
                        </div>
                      </div>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
                      <div>
                        <h4 className="text-xs font-bold text-white uppercase mb-2">Contraste contra Expectativas</h4>
                        <div className="space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-[#879391]">Expectativa Candidato:</span>
                            <span className="font-mono text-white font-semibold">
                              {activeCandidate.salaryDetails.expectedSalary.toLocaleString()} € / año
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#879391]">Simulación Actual Flexible:</span>
                            <span className="font-mono text-white font-semibold">
                              {(simBaseSal + simBonus + simBenefits).toLocaleString()} € / año
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4">
                        {(simBaseSal + simBonus + simBenefits) >= activeCandidate.salaryDetails.expectedSalary ? (
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-[11px] leading-normal flex items-start gap-2">
                            <Check className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>La compensación simulada iguala o supera la pretensión declarada. Óptimo nivel de retención económica.</span>
                          </div>
                        ) : (
                          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-[11px] leading-normal flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                            <span>La compensación simulada está por debajo de las pretensiones. Alto riesgo de rechazo o contraoferta externa.</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Set salary changes */}
                  <div className="flex justify-end select-none">
                    <button
                      onClick={() => {
                        setCandidates(prev => prev.map(c => c.id === activeCandidate.id ? {
                          ...c,
                          salaryDetails: {
                            baseSalary: simBaseSal,
                            expectedSalary: c.salaryDetails.expectedSalary,
                            bonusAnnual: simBonus,
                            benefitsValue: simBenefits
                          }
                        } : c));
                        setActiveCandidate(prev => {
                          if (!prev) return null;
                          return {
                            ...prev,
                            salaryDetails: {
                              baseSalary: simBaseSal,
                              expectedSalary: prev.salaryDetails.expectedSalary,
                              bonusAnnual: simBonus,
                              benefitsValue: simBenefits
                            }
                          };
                        });
                        triggerToast("Cambios del simulador de salarios guardados en el perfil.");
                      }}
                      className="px-4.5 py-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-[#6bd8cb] font-black text-xs text-[#101415] hover:shadow-lg transition-all cursor-pointer"
                    >
                      Aplicar propuesta salarial en perfil
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 4: CONTRACT DRAFT GENERATOR */}
              {activeTab === "contrato" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 text-left space-y-4">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-bold">Auto-Generador Operativo de Contratos de Empleados</h4>
                    <p className="text-[11px] text-[#879391] leading-relaxed">
                      Rellena los valores básicos del contrato de contratación y procesa el borrador formal listo para firmar digitalmente.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium">
                      <div className="space-y-1.5">
                        <label className="text-[#e2e5e7]">Tipo de Contrato Colectivo:</label>
                        <select 
                          value={contractType}
                          onChange={(e) => setContractType(e.target.value)}
                          className="w-full bg-[#101415] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        >
                          <option value="Indefinido - Tiempo Completo">Indefinido - Tiempo Completo</option>
                          <option value="Indefinido - Cuadro Técnico Especializado">Indefinido - Cuadro Técnico Especializado</option>
                          <option value="Indefinido - Alta Dirección">Indefinido - Alta Dirección</option>
                          <option value="Temporal - Por Obra / Servicio Determinado">Temporal - Por Obra / Servicio Determinado</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[#e2e5e7]">Fecha Oficial de Incorporación:</label>
                        <input
                          type="date"
                          value={contractStartDate}
                          onChange={(e) => setContractStartDate(e.target.value)}
                          className="w-full bg-[#101415] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 select-none">
                      <button
                        onClick={generateContractDraft}
                        disabled={isSimulatingContractGen}
                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold text-[#c4c1fb] inline-flex items-center gap-2 cursor-pointer"
                      >
                        {isSimulatingContractGen ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Redactando mediante IA...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5" />
                            <span>Generar borrador de contrato</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {activeCandidate.toolsDetails.contractGenerator.generated ? (
                    <div className="glass-panel p-5 rounded-2xl border border-white/5 text-left space-y-4 animate-scaleUp">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> BORRADOR JURÍDICO AUTOGENERADO
                        </span>
                        <div className="flex gap-1.5 select-none">
                          <button
                            onClick={() => {
                              const draftText = (document.getElementById("contract-draft-text") as HTMLPreElement)?.innerText;
                              if (draftText) handleCopyText(draftText, "copy_contract");
                            }}
                            className="p-2 rounded bg-white/5 border border-white/10 transition-all hover:bg-white/10 hover:text-white text-[#c4c1fb]"
                            title="Copiar texto"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); triggerToast("Borrador descargado como archivo PDF legal en local."); }}
                            className="p-2 rounded bg-[#6bd8cb]/15 border border-[#6bd8cb]/20 text-[#6bd8cb] transition-all hover:bg-[#6bd8cb]/25"
                            title="Descargar PDF"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>

                      <pre 
                        id="contract-draft-text" 
                        className="text-[10px] leading-relaxed text-white/70 font-mono overflow-y-auto max-h-60 bg-[#101415] p-3 rounded-lg border border-white/5 whitespace-pre-wrap"
                      >
                        {`CONTRATO INDIVIDUAL DE TRABAJO Y PRESTACIÓN DE SERVICIOS
--------------------------------------------------------
Compañía Contratante: ${activeCandidate.client}
Empleado Alterno: ${activeCandidate.name}
Puesto de Trabajo: Ref. ${activeCandidate.role}
Clasificación Contractual: ${contractType}
Fecha de Alta y Comienzo: ${contractStartDate}

CLÁUSULAS ESPECÍFICAS DE NEGOCIACIÓN:
1. COMPENSACIÓN MONETARIA: Compañía asigna un salario bruto fijo anualizado por cuantía exacta de ${activeCandidate.salaryDetails.baseSalary.toLocaleString()} € pagaderos en prorrateo de 12 mensualidades ordenamiento mercantil.
2. RETRIBUCIÓN ADICIONAL VARIABLE (BONO): Se adiciona cuantía máxima de bono variable estimada de ${activeCandidate.salaryDetails.bonusAnnual.toLocaleString()} € condicionada al cumplimiento de objetivos de plataforma tecnológica.
3. REMUNERACIÓN EN ESPECIE (BENEFICIOS): Acceso directo a cobertura corporativa de seguro médico familiar, cheque guardería y gimnasio flexible valorados acumuladamente en ${activeCandidate.salaryDetails.benefitsValue.toLocaleString()} € anuales monetizados por la gestora.

Con la aceptación verbal e inicio de firma digital de las partes en fecha ${new Date().toLocaleDateString("es-ES")}, expídase copia para DocuSign Inc.`}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center text-[#879391] text-xs">
                      No hay borradores redactados en la sesión actual. Rellena los datos superiores y pulsa "Generar borrador de contrato" para simular la redacción jurídica.
                    </div>
                  )}

                </div>
              )}

              {/* TAB 5: REDACTOR DE FEEDBACK */}
              {activeTab === "feedback" && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 text-left space-y-4">
                    <h4 className="text-xs font-black text-[#ffb4ab] uppercase tracking-widest font-bold">Redactor y Normalizador de Feedback Constructivo</h4>
                    <p className="text-[11px] text-[#879391] leading-relaxed">
                      Para perfiles no incorporados (13 y 14), indexa las causas de rechazo para sugerir un email empático que evite frustración y cuide al candidato (Employer Branding).
                    </p>

                    <div className="space-y-2">
                      <label className="text-xs text-[#e2e5e7] font-semibold">Causas Técnicas / Razones del Descarte:</label>
                      <textarea
                        rows={3}
                        value={rejectionReasonInput}
                        onChange={(e) => setRejectionReasonInput(e.target.value)}
                        placeholder="Escribe la causa real de no contratación (ej. Desestimada al no poder flexibilizar el paquete salarial fijo)..."
                        className="w-full bg-[#101415] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#ffb4ab] placeholder-[#879391] font-medium"
                      />
                    </div>

                    <div className="flex gap-2.5 select-none">
                      <button
                        onClick={generateAiFeedback}
                        disabled={isSimulatingFeedbackGen}
                        className="px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold text-[#c4c1fb] inline-flex items-center gap-2 cursor-pointer"
                      >
                        {isSimulatingFeedbackGen ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>Redactando...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <span>Redactar email empático por IA</span>
                          </>
                        )}
                      </button>

                      {activeCandidate.toolsDetails.feedbackWriter.generatedFeedback && (
                        <button
                          onClick={deliverManualFeedback}
                          className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-[#101415] text-xs font-black inline-flex items-center gap-1.5 cursor-pointer shadow-md"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Registrar Feedback como Entregado</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {activeCandidate.toolsDetails.feedbackWriter.generatedFeedback ? (
                    <div className="glass-panel p-5 rounded-2xl border border-white/5 text-left space-y-4 animate-scaleUp">
                      <div className="flex justify-between items-center pb-2 border-b border-white/5">
                        <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1.5">
                          <Check className="w-4 h-4" /> BORRADOR DE EMAIL EMPÁTICO IA
                        </span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] uppercase font-bold ${
                            activeCandidate.feedbackStatus === "entregado_manual" 
                              ? "text-emerald-450" 
                              : "text-amber-500"
                          }`}>
                            {activeCandidate.feedbackStatus === "entregado_manual" ? "Registrado (Tasa +1)" : "Borrador sin registrar"}
                          </span>
                          <button
                            onClick={() => handleCopyText(activeCandidate.toolsDetails.feedbackWriter.generatedFeedback, "copy_feedback")}
                            className="p-2 rounded bg-white/5 border border-white/10 transition-all hover:bg-white/10 hover:text-white text-[#c4c1fb] select-none cursor-pointer"
                            title="Copiar texto"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <pre 
                        className="text-[10px] leading-relaxed text-white/80 font-mono overflow-y-auto max-h-60 bg-[#101415] p-3 rounded-lg border border-white/5 whitespace-pre-wrap"
                      >
                        {activeCandidate.toolsDetails.feedbackWriter.generatedFeedback}
                      </pre>
                    </div>
                  ) : (
                    <div className="p-6 border border-dashed border-white/10 rounded-2xl text-center text-[#879391] text-xs">
                      No hay feedbacks generados. Describe la causa en el cuadro superior y pulsa "Redactar email empático por IA".
                    </div>
                  )}

                </div>
              )}

              {/* TAB 6: PRE-ONBOARDING */}
              {activeTab === "preonboarding" && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Summary & Risk rating */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#101415] rounded-xl border border-white/5 space-y-1 text-left">
                      <span className="text-[9px] uppercase font-bold text-[#879391]">Risk de Ghosting / Fuga</span>
                      <p className={`text-xl font-black ${
                        activeCandidate.toolsDetails.preOnboard.ghostingRisk === "Alto" ? "text-rose-450" :
                        activeCandidate.toolsDetails.preOnboard.ghostingRisk === "Medio" ? "text-amber-500" : "text-emerald-400"
                      }`}>
                        {activeCandidate.toolsDetails.preOnboard.ghostingRisk}
                      </p>
                      <p className="text-[9.5px] text-[#879391]">Riesgo predicho de contraofertas</p>
                    </div>

                    <div className="p-4 bg-[#101415] rounded-xl border border-white/5 space-y-1 col-span-2 text-left">
                      <span className="text-[9px] uppercase font-bold text-emerald-400">Objetivo del Pre-Onboarding</span>
                      <p className="text-[10px] text-white/80 leading-normal mt-0.5">
                        Mitigar abandonos de último momento durante el período de preaviso de los candidatos bajo contrato formal enviando contenido de valor sobre la compañía.
                      </p>
                    </div>
                  </div>

                  {/* Touchpoints Cadence Timeline */}
                  <div className="glass-panel p-5 rounded-2xl border border-white/5 text-left space-y-4">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest font-bold">Cadence Sequencer - Timeline de Contactos</h4>
                    
                    <div className="relative border-l border-white/10 ml-2.5 pl-5 space-y-5">
                      {activeCandidate.toolsDetails.preOnboard.cadenceSteps.length === 0 ? (
                        <p className="text-xs text-[#879391] py-2">Ningún contacto de acompañamiento programado. Solo aplica para candidatos contratados.</p>
                      ) : (
                        activeCandidate.toolsDetails.preOnboard.cadenceSteps.map((step, idx) => (
                          <div key={idx} className="relative text-xs">
                            {/* Bullet icon */}
                            <span className={`absolute -left-7 top-[1px] w-4 h-4 rounded-full border flex items-center justify-center ${
                              step.status === "sent" 
                                ? "bg-emerald-500/10 border-emerald-500 text-emerald-400" 
                                : "bg-[#101415] border-white/20 text-[#879391]"
                            }`}>
                              {step.status === "sent" ? (
                                <Check className="w-2.5 h-2.5" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500/70" />
                              )}
                            </span>

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-white uppercase">{step.day} :</span>
                                <span className="font-semibold text-white/90">{step.title}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono ${
                                  step.status === "sent" ? "bg-emerald-500/10 text-emerald-450" : "bg-white/5 text-[#879391]"
                                }`}>
                                  {step.status === "sent" ? "Enviado" : "Programado"}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#879391] font-medium leading-normal bg-[#101415]/60 p-2.5 rounded-lg border border-white/[0.03]">
                                {step.previewText}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Add Touchpoint Form */}
                  {activeCandidate.currentPhase === "12_contratado" && (
                    <form onSubmit={addPreonboardMilestone} className="glass-panel p-5 rounded-2xl border border-white/5 text-left space-y-3.5">
                      <h4 className="text-xs font-bold text-white uppercase">Agregar Hito Personalizado en la Cadence</h4>
                      
                      <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                          <label className="text-[9.5px] uppercase font-bold text-[#879391]">Plazo (ej: Día +15):</label>
                          <input
                            type="text"
                            name="day"
                            required
                            placeholder="Día +15"
                            className="w-full bg-[#101415] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                        <div className="space-y-1 col-span-2">
                          <label className="text-[9.5px] uppercase font-bold text-[#879391]">Acción / Título del Hito:</label>
                          <input
                            type="text"
                            name="title"
                            required
                            placeholder="Sesión telemétrica de bienvenida tecnica"
                            className="w-full bg-[#101415] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end select-none">
                        <button
                          type="submit"
                          disabled={isSimulatingOnboardAdd}
                          className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-xs font-bold text-[#c4c1fb] inline-flex items-center gap-1.5 cursor-pointer"
                        >
                          {isSimulatingOnboardAdd ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Programando...</span>
                            </>
                          ) : (
                            <>
                              <Zap className="w-3.5 h-3.5 text-amber-500" />
                              <span>Programar contacto</span>
                            </>
                          )}
                        </button>
                      </div>
                    </form>
                  )}

                </div>
              )}

            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// INNER COMPONENTS

interface KanbanCardProps {
  cad: CierreCandidate;
  onSelect: (c: CierreCandidate) => void;
  onTransition: (id: string, phase: CierreCandidate["currentPhase"]) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
}

function KanbanCard({ cad, onSelect, onTransition, onDragStart }: KanbanCardProps) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, cad.id)}
      onClick={() => onSelect(cad)}
      className="p-4 bg-[#191c1e]/70 border border-white/5 hover:border-emerald-500/35 rounded-2xl hover:bg-[#1c2022] hover:shadow-2xl transition-all duration-200 cursor-pointer space-y-4 text-left group relative"
    >
      {/* Glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-emerald-500/[0.01] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      {/* Header Info */}
      <div className="space-y-1">
        <div className="flex justify-between items-start gap-1">
          <h4 className="font-bold text-sm text-white group-hover:text-emerald-450 transition-colors">
            {cad.name}
          </h4>
          <span className="text-[10px] text-white/30 font-mono select-all">
            {cad.id}
          </span>
        </div>
        <p className="text-xs text-[#879391] font-medium truncate">{cad.role}</p>
        <span className="text-[10px] text-[#e0e3e5] font-bold flex items-center gap-1.5 pt-0.5">
          <Building2 className="w-3.5 h-3.5 text-[#c4c1fb] shrink-0" />
          <span>{cad.client}</span>
        </span>
      </div>

      <div className="flex justify-between items-center text-[10px] text-[#879391] pt-1 border-t border-white/[0.03]">
        <div className="flex items-center gap-1">
          <MapPin className="w-3 h-3 text-[#c4c1fb]" />
          <span>{cad.location.split(",")[0]}</span>
        </div>
        <span className="font-bold text-white bg-white/5 rounded-md px-1.5 py-0.5 border border-white/5 font-mono">
          {cad.score}% Fit
        </span>
      </div>

      {/* Extra actions button */}
      <div className="flex justify-between items-center text-[10px] bg-white/[0.02] p-2.5 rounded-xl border border-white/5 mt-2">
        {cad.currentPhase === "11_oferta_extendida" && (
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="text-[#879391]">Previa Aceptación:</span>
            <span className="font-bold text-amber-400 font-mono">
              {cad.toolsDetails.predictiveMotor.adjustedProbability}%
            </span>
          </div>
        )}
        {cad.currentPhase === "12_contratado" && (
          <div className="flex items-center gap-1 text-emerald-450">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">Contratado</span>
          </div>
        )}
        {(cad.currentPhase === "13_rechazado_cliente" || cad.currentPhase === "14_candidato_se_baja") && (
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              cad.feedbackStatus === "entregado_manual" ? "bg-emerald-400" : "bg-rose-500"
            }`} />
            <span className={cad.feedbackStatus === "entregado_manual" ? "text-emerald-400 font-bold" : "text-[#879391]"}>
              {cad.feedbackStatus === "entregado_manual" ? "Feedback Completo" : "Feedback Pendiente"}
            </span>
          </div>
        )}

        <button 
          onClick={(e) => { e.stopPropagation(); onSelect(cad); }}
          className="text-[9.5px] uppercase font-bold text-emerald-450 hover:underline hover:text-emerald-400 ml-auto flex items-center gap-0.5 select-none"
        >
          <span>Operar</span>
          <ChevronRight className="w-3 h-3 mt-0.5" />
        </button>
      </div>

      {/* Quick fast controls */}
      <div className="grid grid-cols-3 gap-1 pt-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-200 select-none">
        {cad.currentPhase !== "11_oferta_extendida" && (
          <button 
            onClick={(e) => { e.stopPropagation(); onTransition(cad.id, "11_oferta_extendida"); }}
            className="px-1.5 py-1 text-[8.5px] font-bold rounded bg-white/5 border border-white/5 text-[#879391] hover:text-white"
          >
            Nego
          </button>
        )}
        {cad.currentPhase !== "12_contratado" && (
          <button 
            onClick={(e) => { e.stopPropagation(); onTransition(cad.id, "12_contratado"); }}
            className="px-1.5 py-1 text-[8.5px] font-bold rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
          >
            Habilitar
          </button>
        )}
        {(cad.currentPhase !== "13_rechazado_cliente" && cad.currentPhase !== "14_candidato_se_baja") && (
          <button 
            onClick={(e) => { e.stopPropagation(); onTransition(cad.id, "13_rechazado_cliente"); }}
            className="px-1.5 py-1 text-[8.5px] font-bold rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
          >
            Rechazar
          </button>
        )}
      </div>

    </div>
  );
}

function EmptyColumnText({ text }: { text: string }) {
  return (
    <div className="py-10 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.005] select-none">
      <p className="text-[10px] text-[#879391] font-bold uppercase tracking-wider">{text}</p>
      <p className="text-[9px] text-[#879391]/60 mt-0.5">Arrastra un candidato aquí</p>
    </div>
  );
}
