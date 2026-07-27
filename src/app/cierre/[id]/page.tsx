'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Building2, 
  MapPin, 
  Ban, 
  AlertCircle, 
  Clock,
  Check,
  Copy, 
  UserCheck, 
  RefreshCw, 
  Cpu, 
  ArrowLeft,
  Edit2,
  Save,
  X,
  FileText,
  ChevronsRight,
  ChevronsLeft,
  ShieldCheck,
  Zap,
  AlertTriangle,
  Phone,
  Mail,
  Star,
  ChevronRight,
  Compass,
  Send,
  Languages,
  Calendar,
  Bell,
  Sparkles,
  TrendingUp,
  DollarSign,
  Briefcase,
  FileCheck,
  HeartHandshake,
  UserPlus
} from "lucide-react";

// Backend API Actions
import { getBusquedasAPI, Busqueda } from "@/actions/busquedas";
import { getCandidatosAPI, actualizarCandidatoAPI, Candidato } from "@/actions/candidatos";
import { getPipelineAPI, PipelineItem, actualizarPipelineAPI } from "@/actions/pipeline";
import { 
  CierreCandidate, 
  generateDefaultCierreToolsDetails 
} from "@/lib/cierre";

type DiagTab = "motor" | "simulador" | "contratos" | "feedback" | "onboarding";

export default function CierreDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

  const [cand, setCand] = useState<CierreCandidate | null>(null);
  const [activePipelineItem, setActivePipelineItem] = useState<PipelineItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab for Closure & AI Facilities
  const [activeTab, setActiveTab] = useState<DiagTab>("motor");

  // Editing state for Recruiter Notes across all phases
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editInitialNotes, setEditInitialNotes] = useState("");
  const [editF1Notes, setEditF1Notes] = useState("");
  const [editF2Notes, setEditF2Notes] = useState("");
  const [editF3Notes, setEditF3Notes] = useState("");
  const [editF4Notes, setEditF4Notes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Salary Simulator Interactive States
  const [simBaseSalary, setSimBaseSalary] = useState(55000);
  const [simBonusAnnual, setSimBonusAnnual] = useState(7000);
  const [simBenefitsValue, setSimBenefitsValue] = useState(4000);

  // Notifications & Toast
  const [copiedTextType, setCopiedTextType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Facility Simulation Loading States
  const [isSimulatingMotor, setIsSimulatingMotor] = useState(false);
  const [isSimulatingContractGen, setIsSimulatingContractGen] = useState(false);
  const [isSimulatingFeedbackGen, setIsSimulatingFeedbackGen] = useState(false);
  const [isSimulatingPreOnboarding, setIsSimulatingPreOnboarding] = useState(false);

  // Final Hire / Close Modal State
  const [isCloseModalOpen, setIsCloseModalOpen] = useState(false);
  const [isClosingProcess, setIsClosingProcess] = useState(false);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const loadCandidateData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const searches = await getBusquedasAPI();
      const candidatesRes = await getCandidatosAPI();
      let candidatesList: Candidato[] = [];
      if (candidatesRes.success && Array.isArray(candidatesRes.data)) {
        candidatesList = candidatesRes.data;
      }

      let pipeItems: PipelineItem[] = [];
      if (searches.length > 0) {
        const promises = searches.map(s => getPipelineAPI(s.id));
        const results = await Promise.all(promises);
        results.forEach(res => {
          if (res.success && Array.isArray(res.data)) {
            pipeItems = pipeItems.concat(res.data);
          }
        });
      }

      let targetPipe = pipeItems.find(p => p.id === id || p.claves_conexion?.id_candidato === id);
      let targetCand = candidatesList.find(c => c.id === id || (targetPipe && c.id === targetPipe.claves_conexion?.id_candidato));

      if (targetPipe || targetCand) {
        const candMap = new Map(candidatesList.map(c => [c.id, c]));
        const busqMap = new Map(searches.map(b => [b.id, b]));

        const cObj = targetCand || candMap.get(targetPipe?.claves_conexion?.id_candidato || "");
        const bObj = busqMap.get(targetPipe?.claves_conexion?.id_busqueda || "");

        const stateStr = (targetPipe?.flujo?.estado_actual || "").toLowerCase();
        let currentPhase: CierreCandidate["currentPhase"] = "12_oferta_extendida";
        if (stateStr.includes("11") || stateStr.includes("oferta") || stateStr.includes("negociacion")) {
          currentPhase = "12_oferta_extendida";
        } else if (stateStr.includes("12") || stateStr.includes("contratado") || stateStr.includes("won")) {
          currentPhase = "13_contratado";
        } else if (stateStr.includes("13") || stateStr.includes("rechazado") || stateStr.includes("lost")) {
          currentPhase = "14_rechazado_cliente";
        } else if (stateStr.includes("14") || stateStr.includes("baja") || stateStr.includes("drop")) {
          currentPhase = "15_candidato_se_baja";
        }

        const candName = cObj?.nombre_completo || "Candidato";
        const role = cObj?.puesto || bObj?.perfil_busqueda || "Especialista Tech";
        const client = bObj?.cliente || "Cliente General";
        const location = cObj?.ubicacion || "España / Remoto";
        const score = targetPipe?.f1_descubrimiento?.analisis_semantico?.fit_score ?? targetPipe?.f2_evaluacion?.puntaje_tecnico ?? targetPipe?.evaluacion?.puntaje_tecnico ?? 88;
        
        const initialNotes = cObj?.notas_iniciales || "";
        const f1Notes = targetPipe?.f1_descubrimiento?.notas_reclutador || "";
        const f2Notes = targetPipe?.f2_evaluacion?.notas_reclutador || targetPipe?.evaluacion?.notas_reclutador || "";
        const f3Notes = (targetPipe as any)?.f3_presentacion?.notas_reclutador || 
                        (targetPipe as any)?.presentacion?.notas_reclutador || 
                        (targetPipe as any)?.f3_cliente?.notas_reclutador || 
                        (targetPipe as any)?.f3?.notas_reclutador || 
                        (targetPipe as any)?.f3_presentacion?.feedback_cliente || 
                        (targetPipe as any)?.presentacion?.feedback_cliente || "";
        const f4Notes = (targetPipe as any)?.f4_cierre?.notas_reclutador || (targetPipe as any)?.cierre?.notas_reclutador || "";
        
        const entryDate = targetPipe?.flujo?.fecha_ultimo_cambio || targetPipe?.createdAt || new Date().toISOString();
        const offerDate = targetPipe?.createdAt || new Date().toISOString();
        const closedDate = (targetPipe as any)?.cierre?.fecha_cierre;
        const defaults = generateDefaultCierreToolsDetails(candName, role, score);

        const item: CierreCandidate = {
          id: cObj?.id || targetPipe?.claves_conexion?.id_candidato || id,
          pipeId: targetPipe?.id || id,
          name: candName,
          role,
          client,
          location,
          score,
          currentPhase,
          entryDate,
          offerDate,
          closedDate,
          cNPS: 9,
          lastActivity: targetPipe?.flujo?.fecha_ultimo_cambio 
            ? `Último cambio: ${new Date(targetPipe.flujo.fecha_ultimo_cambio).toLocaleDateString("es-ES")}` 
            : "Registro sincronizado desde backend",
          experienceYears: 5,
          contactNumber: cObj?.telefono_movil || "+34 600 000 000",
          email: cObj?.email || "candidato@email.com",
          feedbackStatus: "pendiente",
          initialNotes,
          f1Notes,
          f2Notes,
          f3Notes,
          f4Notes,
          recruiterNotes: f4Notes || f3Notes || f2Notes,
          url_cv: cObj?.url_cv || undefined,
          salaryDetails: defaults.salaryDetails,
          toolsDetails: defaults.toolsDetails
        };

        setCand(item);
        setActivePipelineItem(targetPipe || null);
        setEditInitialNotes(initialNotes);
        setEditF1Notes(f1Notes);
        setEditF2Notes(f2Notes);
        setEditF3Notes(f3Notes);
        setEditF4Notes(f4Notes);

        setSimBaseSalary(item.salaryDetails.baseSalary);
        setSimBonusAnnual(item.salaryDetails.bonusAnnual);
        setSimBenefitsValue(item.salaryDetails.benefitsValue);
      } else {
        setError("No se encontró el expediente del candidato en el pipeline de cierre.");
      }
    } catch (err: any) {
      console.error("Error al obtener detalle del candidato en cierre:", err);
      setError(err.message || "Error al conectar con los servicios backend del pipeline.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCandidateData();
  }, [id]);

  const handleSaveNotes = async () => {
    if (!cand) return;
    setIsSavingNotes(true);
    try {
      // 1. Update Candidate initial notes in backend
      if (cand.id) {
        await actualizarCandidatoAPI(cand.id, {
          notas_iniciales: editInitialNotes.trim()
        });
      }
      // 2. Update Pipeline notes in backend
      if (cand.pipeId) {
        await actualizarPipelineAPI(cand.pipeId, {
          f1_descubrimiento: { notas_reclutador: editF1Notes.trim() },
          f2_evaluacion: { notas_reclutador: editF2Notes.trim() },
          evaluacion: { notas_reclutador: editF2Notes.trim() },
          f3_presentacion: { notas_reclutador: editF3Notes.trim() },
          presentacion: { notas_reclutador: editF3Notes.trim() },
          f3_cliente: { notas_reclutador: editF3Notes.trim() },
          f4_cierre: { notas_reclutador: editF4Notes.trim() },
          cierre: { notas_reclutador: editF4Notes.trim() }
        } as any);
      }
      setCand(prev => prev ? {
        ...prev,
        initialNotes: editInitialNotes.trim(),
        f1Notes: editF1Notes.trim(),
        f2Notes: editF2Notes.trim(),
        f3Notes: editF3Notes.trim(),
        f4Notes: editF4Notes.trim(),
        recruiterNotes: editF4Notes.trim() || editF3Notes.trim()
      } : null);
      setIsEditingNotes(false);
      triggerToast("Historial de notas de cierre guardado correctamente.");
    } catch (err) {
      console.error("Error al guardar historial de notas:", err);
      triggerToast("Error al guardar notas en el servidor.");
    } finally {
      setIsSavingNotes(false);
    }
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
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
      const downloadUrl = `${apiBaseUrl}/api/v1/candidatos/${candId}/cv?token=${token}`;
      window.open(downloadUrl, "_blank");
    } else {
      window.open(urlCv, "_blank");
    }
  };

  const handleTransitionState = async (targetPhase: CierreCandidate["currentPhase"]) => {
    if (!cand) return;
    const now = new Date().toISOString();
    const label = getPhaseLabel(targetPhase);
    setCand(prev => prev ? { ...prev, currentPhase: targetPhase, lastActivity: `Estado cambiado a ${label}` } : null);
    setActivePipelineItem(prev => prev ? {
      ...prev,
      flujo: { ...prev.flujo, estado_actual: targetPhase, fecha_ultimo_cambio: now }
    } : null);

    if (cand.pipeId) {
      try {
        await actualizarPipelineAPI(cand.pipeId, {
          flujo: { estado_actual: targetPhase, fecha_ultimo_cambio: now },
          cierre: { fecha_cierre: (targetPhase === "13_contratado" || targetPhase === "14_rechazado_cliente" || targetPhase === "15_candidato_se_baja") ? now : undefined }
        } as any);
        triggerToast(`Estado cambiado a ${label}`);
      } catch (err) {
        console.error("Error al actualizar estado:", err);
      }
    }
  };

  const confirmHireProcessAction = async () => {
    if (!cand) return;
    setIsClosingProcess(true);
    try {
      if (cand.pipeId) {
        const now = new Date().toISOString();
        const nuevoEstado = "13_contratado";
        const historialActualizado = [
          { estado: nuevoEstado, timestamp: now },
          ...(activePipelineItem?.flujo?.historial_estados || [])
        ];
        await actualizarPipelineAPI(cand.pipeId, {
          flujo: {
            estado_actual: nuevoEstado,
            fecha_ultimo_cambio: now,
            historial_estados: historialActualizado
          },
          cierre: {
            fecha_cierre: now
          }
        } as any);
      }
      setIsCloseModalOpen(false);
      setCand(prev => prev ? { ...prev, currentPhase: "13_contratado", closedDate: new Date().toISOString() } : null);
      triggerToast(`¡Felicitaciones! Contratación cerrada con éxito para ${cand.name}.`);
    } catch (err: any) {
      console.error("Error al cerrar contratación:", err);
      triggerToast("Error al registrar la contratación en el servidor.");
    } finally {
      setIsClosingProcess(false);
    }
  };

  const [isRevertingPhase, setIsRevertingPhase] = useState(false);

  const handleRevertToClientPhase = async () => {
    if (!cand) return;
    setIsRevertingPhase(true);
    try {
      const now = new Date().toISOString();
      const targetPhase = "09_shortlist";
      const historialActualizado = [
        { estado: targetPhase, timestamp: now },
        ...(activePipelineItem?.flujo?.historial_estados || [])
      ];

      if (cand.pipeId) {
        await actualizarPipelineAPI(cand.pipeId, {
          flujo: {
            estado_actual: targetPhase,
            fecha_ultimo_cambio: now,
            historial_estados: historialActualizado
          }
        } as any);
      }

      triggerToast(`Expediente devuelto a Fase Cliente (09_shortlist).`);
      router.push(`/presentacion/${cand.pipeId || cand.id}`);
    } catch (err: any) {
      console.error("Error al revertir candidato a Fase Cliente:", err);
      triggerToast("Error al actualizar el estado en el servidor.");
    } finally {
      setIsRevertingPhase(false);
    }
  };

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextType(type);
    triggerToast("Texto copiado al portapapeles con éxito.");
    setTimeout(() => setCopiedTextType(null), 2000);
  };

  // FACILITY 1: Motor Predictivo
  const runPredictiveEngine = () => {
    if (!cand) return;
    setIsSimulatingMotor(true);
    setTimeout(() => {
      setIsSimulatingMotor(false);
      setCand(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          predictiveMotor: {
            ...prev.toolsDetails.predictiveMotor,
            adjustedProbability: 95,
            mitigationActionSelected: true
          }
        }
      } : null);
      triggerToast("Motor predictivo recalculado con éxito (+5% probabilidad por ajuste).");
    }, 1800);
  };

  // FACILITY 2: Simulador Salarial
  const recalculateOfferSimulator = () => {
    if (!cand) return;
    setCand(prev => prev ? {
      ...prev,
      salaryDetails: {
        ...prev.salaryDetails,
        baseSalary: simBaseSalary,
        bonusAnnual: simBonusAnnual,
        benefitsValue: simBenefitsValue
      }
    } : null);
    triggerToast("Propuesta económica recalculada y actualizada en la ficha.");
  };

  // FACILITY 3: Generador Contratos
  const generateDraftContract = () => {
    if (!cand) return;
    setIsSimulatingContractGen(true);
    setTimeout(() => {
      setIsSimulatingContractGen(false);
      setCand(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          contractGenerator: {
            ...prev.toolsDetails.contractGenerator,
            generated: true,
            documentUrl: `/documents/contrato_borrador_${cand.id}.pdf`
          }
        }
      } : null);
      triggerToast("Carta Oferta y borrador de contrato redactados por IA.");
    }, 2000);
  };

  // FACILITY 4: Feedback Empatía
  const generateEmpathyFeedback = () => {
    if (!cand) return;
    setIsSimulatingFeedbackGen(true);
    setTimeout(() => {
      setIsSimulatingFeedbackGen(false);
      const text = `Estimado/a ${cand.name},\n\nQueremos agradecerte sinceramente por tu dedicación a lo largo del proceso de selección para la vacante de ${cand.role} en ${cand.client}.\n\nTras una exhaustiva evaluación, el equipo ha tomado una decisión basada en requerimientos técnicos muy específicos de la fase final. Queremos destacar tus fortalezas en Fit Score (${cand.score}%) y mantener tu perfil en nuestra red preferencial para futuras búsquedas de alta jerarquía.`;
      setCand(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          feedbackWriter: {
            ...prev.toolsDetails.feedbackWriter,
            generatedFeedback: text,
            isSent: true
          }
        }
      } : null);
      triggerToast("Feedback empático generado y listo para enviar.");
    }, 2000);
  };

  // FACILITY 5: Pre-Onboarding Cadences
  const triggerPreOnboardingCadence = () => {
    if (!cand) return;
    setIsSimulatingPreOnboarding(true);
    setTimeout(() => {
      setIsSimulatingPreOnboarding(false);
      setCand(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          preOnboard: {
            ...prev.toolsDetails.preOnboard,
            ghostingRisk: "Bajo",
            cadenceSteps: prev.toolsDetails.preOnboard.cadenceSteps.map(s => ({ ...s, status: "sent" }))
          }
        }
      } : null);
      triggerToast("Cadencia pre-onboarding activada y secuencia de bienvenida iniciada.");
    }, 1500);
  };

  const getPhaseLabel = (phase: CierreCandidate["currentPhase"]) => {
    switch (phase) {
      case "12_oferta_extendida": return "12 - Oferta Extendida / Negociación";
      case "13_contratado": return "13 - Contratado (Won)";
      case "14_rechazado_cliente": return "14 - Rechazado por Cliente (Lost)";
      case "15_candidato_se_baja": return "15 - Candidato se Baja (Drop-out)";
    }
  };

  const phaseColors = {
    "12_oferta_extendida": "text-[#6bd8cb] border-[#6bd8cb]/20 bg-[#6bd8cb]/10",
    "13_contratado": "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    "14_rechazado_cliente": "text-rose-400 border-rose-500/20 bg-rose-500/10",
    "15_candidato_se_baja": "text-amber-400 border-amber-500/20 bg-amber-500/10"
  };

  // ── Loading ──
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#101415] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-emerald-400 font-bold">Cargando expediente de cierre y negociación...</p>
      </div>
    );
  }

  // ── Error ──
  if (error || !cand) {
    return (
      <div className="min-h-screen bg-[#101415] text-white p-8 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <h2 className="text-lg font-bold text-white">{error || "Candidato no encontrado"}</h2>
        <p className="text-xs text-[#879391] max-w-md text-center">
          {`El ID solicitado "${id}" no corresponde a un expediente de cierre registrado.`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => loadCandidateData()}
            className="px-4 py-2 bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 rounded-xl text-xs hover:bg-[#6bd8cb] hover:text-black transition-all font-bold"
          >
            Reintentar
          </button>
          <Link
            href="/cierre"
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-[#c4c1fb] hover:text-black transition-all"
          >
            Volver a Cierre
          </Link>
        </div>
      </div>
    );
  }

  const totalComp = cand.salaryDetails.baseSalary + cand.salaryDetails.bonusAnnual + cand.salaryDetails.benefitsValue;

  return (
    <div className="relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161a1b] border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs animate-fadeIn">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Radial Background Glows */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-emerald-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#6bd8cb]/5 blur-[90px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">

        {/* ── Top Header Navigation Bar ── */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link
              href="/cierre"
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              title="Volver a la vista general de Cierre"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Fase 4: Cierre del Proceso
                </span>
                <span title="ID de vista para prompts de desarrollo" className="text-[9px] font-mono text-[#6bd8cb]/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-all cursor-help uppercase tracking-wider font-semibold">
                  ID: P-CIE-02
                </span>
                <span className="text-xs text-[#879391]">/</span>
                <span className="text-xs text-[#879391] font-mono">{cand.pipeId || cand.id}</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                {cand.name}
              </h1>
            </div>
          </div>

          {/* Contextual Action Pipeline Header Links */}
          <div className="flex items-center gap-2">
            {/* PDF CV Direct View button */}
            <button
              onClick={() => cand && handleViewCv(cand.id, cand.url_cv)}
              title={cand?.url_cv ? "Ver Documento CV PDF" : "Sin CV adjunto"}
              className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs ${
                cand?.url_cv
                  ? "text-[#6bd8cb] bg-white/5 border-white/10 hover:bg-[#6bd8cb]/10 hover:border-[#6bd8cb]/30"
                  : "text-[#879391]/40 bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CV</span>
            </button>
            <Link
              href="/descubrimiento"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-[#c4c1fb] hover:bg-white/5 transition-all"
            >
              F1 Descubrimiento
            </Link>
            <Link
              href="/evaluacion"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-[#9b5de5] hover:bg-white/5 transition-all"
            >
              F2 Evaluación
            </Link>
            <Link
              href="/presentacion"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-amber-400 hover:bg-white/5 transition-all"
            >
              F3 Cliente
            </Link>
            <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/25">
              F4 Cierre (Actual)
            </div>
          </div>
        </header>

        {/* ── Candidate Profile Summary Header Card ── */}
        <section className="glass-panel p-6 rounded-3xl border border-white/10 relative overflow-hidden space-y-6">
          <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-black text-white">{cand.name}</h2>
                <span className={`text-xs px-3 py-1 rounded-full font-bold border ${phaseColors[cand.currentPhase]}`}>
                  {getPhaseLabel(cand.currentPhase)}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-white/5 text-[#c4c1fb] border border-white/10">
                  Fit Score: {cand.score}%
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Probabilidad Aceptación: {cand.toolsDetails.predictiveMotor.adjustedProbability}%
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-[#879391] flex-wrap">
                <span className="flex items-center gap-1.5 text-white font-medium">
                  <Building2 className="w-3.5 h-3.5 text-emerald-400" />
                  {cand.client} — {cand.role}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#6bd8cb]" />
                  {cand.location}
                </span>
                <span className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#879391]" />
                  {cand.contactNumber}
                </span>
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-[#879391]" />
                  {cand.email}
                </span>
              </div>
            </div>

            {/* Header Action Buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Revert to Client Phase Button */}
              <button
                onClick={handleRevertToClientPhase}
                disabled={isRevertingPhase}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Cambia el estado del expediente al primer estado de la Fase 3 Cliente (09_shortlist)"
              >
                {isRevertingPhase ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ChevronsLeft className="w-3.5 h-3.5" />
                )}
                <span>Volver a Fase Cliente</span>
              </button>

              {/* Hire Button */}
              {cand.currentPhase !== "13_contratado" && (
                <button
                  onClick={() => setIsCloseModalOpen(true)}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#6bd8cb] text-[#101415] font-black text-xs hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Cerrar Contratación (Won)</span>
                </button>
              )}

              {/* State Dropdown Transitions */}
              <select
                value={cand.currentPhase}
                onChange={(e) => handleTransitionState(e.target.value as CierreCandidate["currentPhase"])}
                className="bg-[#101415] border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-400 cursor-pointer"
              >
                <option value="12_oferta_extendida" className="bg-[#15181a]">12 - Oferta / Negociación</option>
                <option value="13_contratado" className="bg-[#15181a]">13 - Contratado (Won)</option>
                <option value="14_rechazado_cliente" className="bg-[#15181a]">14 - Rechazado por Cliente (Lost)</option>
                <option value="15_candidato_se_baja" className="bg-[#15181a]">15 - Candidato se Baja (Drop-out)</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── Metadata & SLA Timeline Section ── */}
        {activePipelineItem && (
          <section className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Línea de Tiempo & Metadatos del Pipeline de Cierre
              </span>
              <span className="text-[10px] text-[#879391] font-mono">
                Actualizado: {new Date(activePipelineItem.updatedAt || Date.now()).toLocaleString("es-ES")}
              </span>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[9px] text-[#879391] font-bold uppercase block">ID Búsqueda Asignada</span>
                <span className="font-mono text-white font-bold">{activePipelineItem.claves_conexion?.id_busqueda}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[9px] text-[#879391] font-bold uppercase block">ID Registro Pipeline</span>
                <span className="font-mono text-[#6bd8cb] font-bold">{activePipelineItem.id}</span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1">
                <span className="text-[9px] text-[#879391] font-bold uppercase block">Fecha de Cierre / Modificación</span>
                <span className="font-mono text-emerald-400 font-bold">
                  {cand.closedDate ? new Date(cand.closedDate).toLocaleDateString("es-ES") : "En Negociación Activa"}
                </span>
              </div>
            </div>

            {/* SLA History Steps */}
            {activePipelineItem.flujo?.historial_estados && activePipelineItem.flujo.historial_estados.length > 0 && (
              <div className="pt-2">
                <span className="text-[9px] text-[#879391] font-bold uppercase block mb-2">Historial de Transiciones</span>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {activePipelineItem.flujo.historial_estados.map((h, i) => (
                    <div key={i} className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded bg-white/5 text-[9.5px] font-mono text-[#c4c1fb] border border-white/10">
                        {h.estado} ({new Date(h.timestamp).toLocaleDateString("es-ES")})
                      </span>
                      {i < (activePipelineItem.flujo.historial_estados?.length || 0) - 1 && (
                        <ChevronRight className="w-3 h-3 text-white/20 shrink-0" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {/* ── Recruiter Notes Section across Pipeline Stages ── */}
        <section className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-white/10">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              Historial de Anotaciones del Expediente Completo
            </h3>
            
            {isEditingNotes ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsEditingNotes(false)}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-xs text-[#879391] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {isSavingNotes ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  <span>Guardar Historial</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Editar Anotaciones</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs">
            {/* Notes 1: Initial */}
            <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-[9.5px] font-bold text-[#879391] uppercase tracking-wider block">Notas Origen</span>
              {isEditingNotes ? (
                <textarea
                  value={editInitialNotes}
                  onChange={(e) => setEditInitialNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#101415] border border-white/15 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-sans resize-none"
                  placeholder="Sin notas..."
                />
              ) : (
                <p className="text-[#e0e3e5] leading-relaxed italic text-[11px]">
                  {cand.initialNotes || editInitialNotes || "Sin anotaciones."}
                </p>
              )}
            </div>

            {/* Notes 2: F1 Sourcing */}
            <div className="p-3.5 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 space-y-2">
              <span className="text-[9.5px] font-bold text-cyan-400 uppercase tracking-wider block">Notas F1</span>
              {isEditingNotes ? (
                <textarea
                  value={editF1Notes}
                  onChange={(e) => setEditF1Notes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#101415] border border-cyan-500/30 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-cyan-400 font-sans resize-none"
                  placeholder="Sin notas de F1..."
                />
              ) : (
                <p className="text-cyan-100 leading-relaxed italic text-[11px]">
                  {cand.f1Notes || editF1Notes || "Sin anotaciones en F1."}
                </p>
              )}
            </div>

            {/* Notes 3: F2 Evaluación */}
            <div className="p-3.5 rounded-2xl bg-purple-500/5 border border-purple-500/15 space-y-2">
              <span className="text-[9.5px] font-bold text-purple-400 uppercase tracking-wider block">Notas F2</span>
              {isEditingNotes ? (
                <textarea
                  value={editF2Notes}
                  onChange={(e) => setEditF2Notes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#101415] border border-purple-500/30 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-purple-400 font-sans resize-none"
                  placeholder="Sin notas de F2..."
                />
              ) : (
                <p className="text-purple-100 leading-relaxed italic text-[11px]">
                  {cand.f2Notes || editF2Notes || "Sin anotaciones en F2."}
                </p>
              )}
            </div>

            {/* Notes 4: F3 Presentación Cliente */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-2">
              <span className="text-[9.5px] font-bold text-amber-400 uppercase tracking-wider block">Notas F3</span>
              {isEditingNotes ? (
                <textarea
                  value={editF3Notes}
                  onChange={(e) => setEditF3Notes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#101415] border border-amber-500/30 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-amber-400 font-sans resize-none"
                  placeholder="Notas F3..."
                />
              ) : (
                <p className="text-amber-100 leading-relaxed italic text-[11px]">
                  {cand.f3Notes || editF3Notes || "Sin anotaciones en F3."}
                </p>
              )}
            </div>

            {/* Notes 5: F4 Cierre */}
            <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/15 space-y-2">
              <span className="text-[9.5px] font-bold text-emerald-400 uppercase tracking-wider block">Notas F4 Cierre</span>
              {isEditingNotes ? (
                <textarea
                  value={editF4Notes}
                  onChange={(e) => setEditF4Notes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#101415] border border-emerald-500/30 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-emerald-400 font-sans resize-none"
                  placeholder="Notas de negociación de oferta..."
                />
              ) : (
                <p className="text-emerald-100 leading-relaxed italic text-[11px]">
                  {cand.f4Notes || editF4Notes || "Sin observaciones registradas en negociación de cierre."}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Closure Facilities & Operational AI Tools Tabbed Navigation ── */}
        <section className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
          
          {/* Tab Selector Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
            <button
              onClick={() => setActiveTab("motor")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "motor"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Motor Predictivo</span>
            </button>

            <button
              onClick={() => setActiveTab("simulador")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "simulador"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Simulador Salarial</span>
            </button>

            <button
              onClick={() => setActiveTab("contratos")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "contratos"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>Generador Contratos</span>
            </button>

            <button
              onClick={() => setActiveTab("feedback")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "feedback"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <HeartHandshake className="w-3.5 h-3.5" />
              <span>Feedback Empatía</span>
            </button>

            <button
              onClick={() => setActiveTab("onboarding")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "onboarding"
                  ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Pre-Onboarding</span>
            </button>
          </div>

          {/* TAB 1: Motor Predictivo */}
          {activeTab === "motor" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Motor Predictivo de Aceptación de Ofertas</h4>
                  <p className="text-[10px] text-[#879391]">Inferencia por machine learning sobre probabilidad de firma de propuesta económica</p>
                </div>
                <button
                  onClick={runPredictiveEngine}
                  disabled={isSimulatingMotor}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {isSimulatingMotor ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <TrendingUp className="w-3.5 h-3.5" />
                  )}
                  <span>Recalcular Motor Predictivo</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Probabilidad Ajustada de Aceptación</span>
                  <span className="text-3xl font-black text-emerald-400">{cand.toolsDetails.predictiveMotor.adjustedProbability}%</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold block w-fit">
                    Alta certidumbre de cierre
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Factores de Riesgo / Oportunidad</span>
                  <ul className="space-y-1">
                    {cand.toolsDetails.predictiveMotor.riskFactors.map((r, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-[#e0e3e5]">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Simulador Salarial */}
          {activeTab === "simulador" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Simulador Salarial & Paquete de Compensación</h4>
                  <p className="text-[10px] text-[#879391]">Modelado interactivo de salario fijo, variable y beneficios monetizados</p>
                </div>
                <button
                  onClick={recalculateOfferSimulator}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Aplicar Cambios en Oferta</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Salario Fijo Bruto Anual (€)</span>
                  <input
                    type="number"
                    value={simBaseSalary}
                    onChange={(e) => setSimBaseSalary(Number(e.target.value))}
                    className="w-full bg-[#101415] border border-white/15 rounded-xl p-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Bonus Variable Anual (€)</span>
                  <input
                    type="number"
                    value={simBonusAnnual}
                    onChange={(e) => setSimBonusAnnual(Number(e.target.value))}
                    className="w-full bg-[#101415] border border-white/15 rounded-xl p-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Beneficios Monetizados (€)</span>
                  <input
                    type="number"
                    value={simBenefitsValue}
                    onChange={(e) => setSimBenefitsValue(Number(e.target.value))}
                    className="w-full bg-[#101415] border border-white/15 rounded-xl p-2 text-sm text-white font-mono font-bold focus:outline-none focus:border-emerald-400"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex justify-between items-center">
                <span>Compensación Total Estimada (OTE):</span>
                <span className="text-xl font-black font-mono">{totalComp.toLocaleString("es-ES")} € / año</span>
              </div>
            </div>
          )}

          {/* TAB 3: Generador de Contratos */}
          {activeTab === "contratos" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Generador de Cartas Oferta y Contratos por IA</h4>
                  <p className="text-[10px] text-[#879391]">Generación automática de propuesta legal estructurada</p>
                </div>
                <button
                  onClick={generateDraftContract}
                  disabled={isSimulatingContractGen}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {isSimulatingContractGen ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileCheck className="w-3.5 h-3.5" />
                  )}
                  <span>Generar Carta Oferta IA</span>
                </button>
              </div>

              {cand.toolsDetails.contractGenerator.generated ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Documento Listo</span>
                    <a
                      href={cand.toolsDetails.contractGenerator.documentUrl || "#"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold text-[10px] flex items-center gap-1"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Descargar Borrador PDF</span>
                    </a>
                  </div>
                  <p className="text-[#e0e3e5] leading-relaxed font-mono">
                    {`CARTA OFERTA DE EMPLEO DE ${cand.client.toUpperCase()}\nPosición: ${cand.role}\nCompensación Total: ${totalComp.toLocaleString("es-ES")} € / año\nTipo Contrato: ${cand.toolsDetails.contractGenerator.contractType}\nFecha Incorporación: ${cand.toolsDetails.contractGenerator.startDate}`}
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-[#879391]">
                  Aún no se ha redactado la carta oferta. Haz clic en el botón superior para generarla.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Feedback Empatía */}
          {activeTab === "feedback" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Generador de Feedback Empático por IA</h4>
                  <p className="text-[10px] text-[#879391]">Comunicaciones empáticas para candidatos no seleccionados o bajas</p>
                </div>
                <button
                  onClick={generateEmpathyFeedback}
                  disabled={isSimulatingFeedbackGen}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {isSimulatingFeedbackGen ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <HeartHandshake className="w-3.5 h-3.5" />
                  )}
                  <span>Redactar Feedback Empático</span>
                </button>
              </div>

              {cand.toolsDetails.feedbackWriter.generatedFeedback ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Mensaje Preparado</span>
                    <button
                      onClick={() => handleCopyText(cand.toolsDetails.feedbackWriter.generatedFeedback, "feedback")}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-emerald-400" />
                      <span>{copiedTextType === "feedback" ? "¡Copiado!" : "Copiar Feedback"}</span>
                    </button>
                  </div>
                  <p className="text-[#e0e3e5] leading-relaxed whitespace-pre-line">
                    {cand.toolsDetails.feedbackWriter.generatedFeedback}
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-[#879391]">
                  Sin mensaje redactado aún. Haz clic en el botón superior para compilar el texto de devolución empática.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Pre-Onboarding */}
          {activeTab === "onboarding" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Cadencias de Pre-Onboarding Automatizadas</h4>
                  <p className="text-[10px] text-[#879391]">Mantén el enganche del candidato contratado entre la firma y el primer día laboral</p>
                </div>
                <button
                  onClick={triggerPreOnboardingCadence}
                  disabled={isSimulatingPreOnboarding}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20"
                >
                  {isSimulatingPreOnboarding ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Iniciar Cadencia Pre-Onboarding</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Riesgo de Ghosting / Deserción:</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Riesgo {cand.toolsDetails.preOnboard.ghostingRisk}
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {cand.toolsDetails.preOnboard.cadenceSteps.map((step, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-black/40 border border-white/5 flex justify-between items-center text-xs">
                      <div>
                        <span className="text-emerald-400 font-bold font-mono text-[10px] block">{step.day}</span>
                        <span className="text-[#e0e3e5] font-bold">{step.title}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        step.status === "sent" ? "bg-emerald-500/10 text-emerald-400" : "bg-white/5 text-[#879391]"
                      }`}>
                        {step.status === "sent" ? "Enviado" : "Programado"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </section>

      </div>

      {/* ── Final Hire Modal Confirmation ── */}
      {isCloseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141819] border border-emerald-500/30 rounded-3xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Cerrar Contratación (Won)</h3>
              </div>
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="text-white/40 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#879391]">
              <p>
                ¿Confirmas que la oferta ha sido aceptada y deseas marcar formalmente a <strong className="text-white">{cand.name}</strong> como <strong className="text-emerald-400">Contratado/a (Won)</strong>?
              </p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                Esta acción registrará la fecha de cierre en la base de datos y computará exitosamente la métrica de contrataciones del pipeline.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsCloseModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-[#879391] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmHireProcessAction}
                disabled={isClosingProcess}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#6bd8cb] text-black font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {isClosingProcess ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                <span>Confirmar Contratación</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
