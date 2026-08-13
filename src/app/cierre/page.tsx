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
  ChevronsRight,
  Users, 
  LayoutDashboard, 
  Briefcase,
  Search,
  Contact,
  Settings,
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
  calculateCierreKPIs,
  mapPipelineToCierreCandidates
} from "@/lib/cierre";
import { getBusquedasAPI, Busqueda } from "@/actions/busquedas";
import { getCandidatosAPI, Candidato } from "@/actions/candidatos";
import { getPipelineAPI, PipelineItem, actualizarPipelineAPI } from "@/actions/pipeline";

export default function CierrePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // Backend States
  const [activeBusquedas, setActiveBusquedas] = useState<Busqueda[]>([]);
  const [dataLoading, setDataLoading] = useState<boolean>(true);
  const [dataError, setDataError] = useState<string | null>(null);

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

  // View CV Document PDF handler
  const handleViewCv = (candId: string, urlCv?: string) => {
    if (!urlCv) {
      triggerToast("Este postulante no tiene un archivo CV adjunto.");
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

      // Map to CierreCandidate[]
      const mapped = mapPipelineToCierreCandidates(pipeItems, candidatesList, searchesList);
      setCandidates(mapped);
    } catch (err: any) {
      console.error("Error al obtener datos de cierre del backend:", err);
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

  const handleViewDetails = (cad: CierreCandidate) => {
    router.push(`/cierre/${cad.pipeId || cad.id}`);
  };

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
  const handleTransitionState = async (id: string, targetPhase: CierreCandidate["currentPhase"]) => {
    const targetCandidate = candidates.find(c => c.id === id);
    const label = getPhaseLabel(targetPhase);
    const nowIso = new Date().toISOString();

    setCandidates((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          let closedDate: string | undefined = undefined;
          if (targetPhase !== "12_oferta_extendida") {
            closedDate = nowIso;
          }
          return { 
            ...c, 
            currentPhase: targetPhase, 
            closedDate, 
            lastActivity: `Estado cambiado a ${label}` 
          };
        }
        return c;
      })
    );
    if (activeCandidate && activeCandidate.id === id) {
      setActiveCandidate((prev) => {
        if (!prev) return null;
        return { 
          ...prev, 
          currentPhase: targetPhase, 
          closedDate: targetPhase !== "12_oferta_extendida" ? nowIso : undefined 
        };
      });
    }
    triggerToast(`Candidato reubicado a la columna de ${label.substring(5)}`);

    if (targetCandidate?.pipeId) {
      try {
        const payload: any = {
          flujo: {
            estado_actual: targetPhase,
            fecha_ultimo_cambio: nowIso
          }
        };
        if (targetPhase !== "12_oferta_extendida") {
          payload.cierre = {
            fecha_cierre: nowIso
          };
        }
        const res = await actualizarPipelineAPI(targetCandidate.pipeId, payload);
        if (!res.success) {
          console.warn("[Cierre] Warning al actualizar pipeline en backend:", res.message);
        }
      } catch (err) {
        console.error("[Cierre] Error al actualizar pipeline en backend:", err);
      }
    }
  };

  const getPhaseLabel = (phase: CierreCandidate["currentPhase"]) => {
    switch (phase) {
      case "12_oferta_extendida": return "12 - Oferta Extendida / Negociación";
      case "13_contratado": return "13 - Contratado (Won)";
      case "14_rechazado_cliente": return "14 - Rechazado por Cliente (Lost)";
      case "15_candidato_se_baja": return "15 - Candidato se baja (Drop-out)";
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

    const searchRoleCombined = `${c.searchClient || c.client} - ${c.searchRole || c.role}`;
    const matchesSearchFilter =
      selectedSearch === "Todos" ||
      c.searchId === selectedSearch ||
      c.searchCode === selectedSearch ||
      searchRoleCombined === selectedSearch ||
      `${c.client} - ${c.role}` === selectedSearch;

    const matchesPhaseFilter =
      viewMode === "kanban" || filterStatus === "Todos" || c.currentPhase === filterStatus;

    return matchesSearch && matchesSearchFilter && matchesPhaseFilter;
  });

  const sortedListCandidates = [...filteredCandidates].sort(sortCandidates);

  // Column counts
  const countNego = candidates.filter((c) => c.currentPhase === "12_oferta_extendida").length;
  const countWon = candidates.filter((c) => c.currentPhase === "13_contratado").length;
  const countInactive = candidates.filter((c) => c.currentPhase === "14_rechazado_cliente" || c.currentPhase === "15_candidato_se_baja").length;

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
                  <span title="ID de vista para prompts de desarrollo" className="text-[9px] font-mono text-[#6bd8cb]/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-all cursor-help uppercase tracking-wider font-semibold">
                    ID: P-CIE-01
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

        {/* Backend loading / error indicator */}
        {dataLoading && (
          <div className="p-3 rounded-xl border border-[#6bd8cb]/20 bg-[#6bd8cb]/10 text-[#6bd8cb] text-xs flex items-center gap-2.5 animate-fadeIn">
            <div className="w-4 h-4 border-2 border-[#6bd8cb] border-t-transparent rounded-full animate-spin"></div>
            <span>Sincronizando pipeline y postulantes desde servicios backend...</span>
          </div>
        )}

        {dataError && (
          <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-500/10 text-rose-300 text-xs flex justify-between items-center gap-3 animate-fadeIn text-left">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <div>
                <span className="font-bold">Error Backend: </span>
                {dataError}
              </div>
            </div>
            <button 
              onClick={() => fetchBackendData()} 
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold text-[10px] uppercase cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

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
                    Cálculo: Conteo directo de candidatos en fase '12_oferta_extendida'.
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
                <span className="text-xs text-[#c4c1fb] whitespace-nowrap font-medium">Fase cierre:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-[#101415]/60 border border-[#c4c1fb]/20 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 cursor-pointer w-full md:w-auto font-bold"
                >
                  <option value="Todos" className="bg-[#15181a]">Todas las Fases</option>
                  <option value="12_oferta_extendida" className="bg-[#15181a]">12 - Oferta Extendida</option>
                  <option value="13_contratado" className="bg-[#15181a]">13 - Contratado</option>
                  <option value="14_rechazado_cliente" className="bg-[#15181a]">14 - Rechazado por Cliente</option>
                  <option value="15_candidato_se_baja" className="bg-[#15181a]">15 - Candidato se baja</option>
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
                  <span className="hidden sm:inline">Maximizar</span>
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
              onDrop={(e) => handleDrop(e, "12_oferta_extendida")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-amber-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">12 - Oferta Extendida / Negociación</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Propuestas en revisión final</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-500 font-mono">
                  {countNego}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "12_oferta_extendida").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={handleViewDetails} onTransition={handleTransitionState} onDragStart={handleDragStart} onViewCv={handleViewCv} />
                ))}
                {countNego === 0 && <EmptyColumnText text="Ninguna propuesta activa" />}
              </div>
            </div>

            {/* COLUMN 2: Contratado (Won) */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "13_contratado")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-emerald-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide uppercase">13 - Contratado (Won)</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Firmados y en pre-onboarding</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-emerald-400 font-mono">
                  {countWon}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.currentPhase === "13_contratado").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={handleViewDetails} onTransition={handleTransitionState} onDragStart={handleDragStart} onViewCv={handleViewCv} />
                ))}
                {countWon === 0 && <EmptyColumnText text="Ninguna contratación" />}
              </div>
            </div>

            {/* COLUMN 3: Inactivos (Rejected / Dropped-out) */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "14_rechazado_cliente")} // Default transition to reject
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
                {filteredCandidates.filter(c => c.currentPhase === "14_rechazado_cliente" || c.currentPhase === "15_candidato_se_baja").map((cad) => (
                  <KanbanCard key={cad.id} cad={cad} onSelect={handleViewDetails} onTransition={handleTransitionState} onDragStart={handleDragStart} onViewCv={handleViewCv} />
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
                  <th className="px-5 py-4 text-right">ACCIONES</th>
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
                          cad.currentPhase === "13_contratado" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                          cad.currentPhase === "12_oferta_extendida" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                          "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}>
                          {cad.currentPhase === "12_oferta_extendida" ? "12 - Oferta Extendida" :
                           cad.currentPhase === "13_contratado" ? "13 - Contratado" :
                           cad.currentPhase === "14_rechazado_cliente" ? "14 - Rechazado Cliente" : "15 - Desistido"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-[11px] text-[#879391] italic">
                          {cad.feedbackStatus === "entregado_manual" ? "Feedback entregado" : "Pendiente de envío"}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <div className="font-bold text-white font-mono bg-white/5 rounded-md px-2 py-1 inline-block border border-white/5">
                          {cad.score}%
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5 text-[10px]">
                          {/* Avanzar estado button */}
                          {cad.currentPhase === "12_oferta_extendida" && (
                            <button
                              onClick={() => handleTransitionState(cad.id, "13_contratado")}
                              title="A 13 - Contratado (Won)"
                              className="px-2.5 py-1 rounded bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb] font-bold hover:bg-[#6bd8cb] hover:text-stone-950 transition-all text-[10px] cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                              <span>Avanzar estado</span>
                            </button>
                          )}

                          {cad.currentPhase === "13_contratado" && (
                            <button
                              onClick={() => handleTransitionState(cad.id, "14_rechazado_cliente")}
                              title="A 14 - Rechazado por Cliente (Lost)"
                              className="px-2.5 py-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-400 font-bold hover:bg-rose-500 hover:text-white transition-all text-[10px] cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                              <span>Avanzar estado</span>
                            </button>
                          )}

                          {(cad.currentPhase === "14_rechazado_cliente" || cad.currentPhase === "15_candidato_se_baja") && (
                            <button
                              onClick={() => handleTransitionState(cad.id, "12_oferta_extendida")}
                              title="A 12 - Oferta Extendida / Negociación"
                              className="px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-all text-[10px] cursor-pointer flex items-center gap-1 shrink-0"
                            >
                              <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
                              <span>Avanzar estado</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleViewDetails(cad)}
                            className="px-2.5 py-1 rounded border border-[#c4c1fb]/20 bg-[#c4c1fb]/5 text-[#c4c1fb] font-bold hover:bg-[#c4c1fb] hover:text-[#101415] transition-all flex items-center gap-1 cursor-pointer shrink-0"
                            title="Ver expediente y detalles completos"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detalles</span>
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
    </div>
  );
}

// INNER COMPONENTS

interface KanbanCardProps {
  cad: CierreCandidate;
  onSelect: (c: CierreCandidate) => void;
  onTransition: (id: string, phase: CierreCandidate["currentPhase"]) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onViewCv?: (id: string, urlCv?: string) => void;
}

function KanbanCard({ cad, onSelect, onTransition, onDragStart, onViewCv }: KanbanCardProps) {
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
      <div className="flex justify-between items-center text-[10px] bg-white/[0.02] p-2.5 rounded-xl border border-white/5 mt-2 flex-wrap gap-1.5">
        {cad.currentPhase === "12_oferta_extendida" && (
          <div className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            <span className="text-[#879391]">Previa Aceptación:</span>
            <span className="font-bold text-amber-400 font-mono">
              {cad.toolsDetails.predictiveMotor.adjustedProbability}%
            </span>
          </div>
        )}
        {cad.currentPhase === "13_contratado" && (
          <div className="flex items-center gap-1 text-emerald-450">
            <Check className="w-3.5 h-3.5 shrink-0" />
            <span className="font-bold">Contratado</span>
          </div>
        )}
        {(cad.currentPhase === "14_rechazado_cliente" || cad.currentPhase === "15_candidato_se_baja") && (
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
          className="px-2.5 py-1 rounded border border-[#c4c1fb]/20 bg-[#c4c1fb]/5 text-[#c4c1fb] font-bold hover:bg-[#c4c1fb] hover:text-[#101415] transition-all flex items-center gap-1 cursor-pointer shrink-0 ml-auto"
          title="Ver expediente y detalles completos"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Detalles</span>
        </button>
        {/* PDF CV Direct View button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewCv && onViewCv(cad.id, cad.url_cv);
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
      </div>

      {/* Avanzar estado button */}
      {cad.currentPhase === "12_oferta_extendida" && (
        <button
          onClick={(e) => { e.stopPropagation(); onTransition(cad.id, "13_contratado"); }}
          title="A 13 - Contratado (Won)"
          className="w-full px-2 py-1 rounded bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 hover:bg-[#6bd8cb]/35 text-[#6bd8cb] font-bold text-[9.5px] flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
        >
          <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
          <span>Avanzar estado</span>
        </button>
      )}

      {cad.currentPhase === "13_contratado" && (
        <button
          onClick={(e) => { e.stopPropagation(); onTransition(cad.id, "14_rechazado_cliente"); }}
          title="A 14 - Rechazado por Cliente (Lost)"
          className="w-full px-2 py-1 rounded bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/25 text-rose-400 font-bold text-[9.5px] flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
        >
          <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
          <span>Avanzar estado</span>
        </button>
      )}

      {(cad.currentPhase === "14_rechazado_cliente" || cad.currentPhase === "15_candidato_se_baja") && (
        <button
          onClick={(e) => { e.stopPropagation(); onTransition(cad.id, "12_oferta_extendida"); }}
          title="A 12 - Oferta Extendida / Negociación"
          className="w-full px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/25 text-indigo-400 font-bold text-[9.5px] flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
        >
          <ChevronsRight className="w-3.5 h-3.5 shrink-0" />
          <span>Avanzar estado</span>
        </button>
      )}

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
