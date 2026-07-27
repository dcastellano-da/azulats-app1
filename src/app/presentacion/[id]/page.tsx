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
  Code,
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
  Sparkles
} from "lucide-react";

// Backend API Actions
import { getBusquedasAPI, Busqueda } from "@/actions/busquedas";
import { getCandidatosAPI, actualizarCandidatoAPI, Candidato } from "@/actions/candidatos";
import { getPipelineAPI, PipelineItem, actualizarPipelineAPI } from "@/actions/pipeline";
import { 
  PresentacionCandidate, 
  generateDefaultPresentacionToolsDetails 
} from "@/lib/presentacion";

type DiagTab = "general" | "analitica" | "traductor" | "briefing" | "agenda" | "tracker";

export default function PresentacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

  const [cand, setCand] = useState<PresentacionCandidate | null>(null);
  const [activePipelineItem, setActivePipelineItem] = useState<PipelineItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab for Client & AI Tools
  const [activeTab, setActiveTab] = useState<DiagTab>("general");

  // Editing state for Recruiter Notes across all phases
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editInitialNotes, setEditInitialNotes] = useState("");
  const [editF1Notes, setEditF1Notes] = useState("");
  const [editF2Notes, setEditF2Notes] = useState("");
  const [editF3Notes, setEditF3Notes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Notifications & Toast
  const [copiedTextType, setCopiedTextType] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Tool Simulation Loading States
  const [isSimulatingAnalysis, setIsSimulatingAnalysis] = useState(false);
  const [isSimulatingTranslation, setIsSimulatingTranslation] = useState(false);
  const [isSimulatingBriefingGen, setIsSimulatingBriefingGen] = useState(false);
  const [isSimulatingAgendasSlot, setIsSimulatingAgendasSlot] = useState(false);
  const [isSimulatingSlaPing, setIsSimulatingSlaPing] = useState(false);

  // Phase 4 Advance Modal State
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isAdvancingPhase, setIsAdvancingPhase] = useState(false);

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
        let currentPhase: PresentacionCandidate["currentPhase"] = "09_shortlist";
        if (stateStr.includes("09") || stateStr.includes("shortlist") || stateStr.includes("presentado") || stateStr.includes("enviado")) {
          currentPhase = "09_shortlist";
        } else if (stateStr.includes("10") || stateStr.includes("entrevista") || stateStr.includes("cliente")) {
          currentPhase = "10_entrevista_cliente";
        } else if (stateStr.includes("11") || stateStr.includes("standby") || stateStr.includes("back-up") || stateStr.includes("backup")) {
          currentPhase = "11_standby";
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

        const item: PresentacionCandidate = {
          id: cObj?.id || targetPipe?.claves_conexion?.id_candidato || id,
          pipeId: targetPipe?.id || id,
          name: candName,
          role,
          client,
          location,
          score,
          currentPhase,
          entryDate: targetPipe?.flujo?.fecha_ultimo_cambio || targetPipe?.createdAt || new Date().toISOString(),
          cNPS: 9,
          lastActivity: targetPipe?.flujo?.fecha_ultimo_cambio 
            ? `Último cambio: ${new Date(targetPipe.flujo.fecha_ultimo_cambio).toLocaleDateString("es-ES")}` 
            : "Registro sincronizado desde backend",
          experienceYears: 5,
          contactNumber: cObj?.telefono_movil || "+34 600 000 000",
          email: cObj?.email || "candidato@email.com",
          initialNotes,
          f1Notes,
          f2Notes,
          f3Notes,
          recruiterNotes: f3Notes || f2Notes,
          url_cv: cObj?.url_cv || undefined,
          toolsDetails: generateDefaultPresentacionToolsDetails(candName, role, score)
        };

        setCand(item);
        setActivePipelineItem(targetPipe || null);
        setEditInitialNotes(initialNotes);
        setEditF1Notes(f1Notes);
        setEditF2Notes(f2Notes);
        setEditF3Notes(f3Notes);
      } else {
        setError("No se encontró el expediente del candidato en el pipeline de presentación.");
      }
    } catch (err: any) {
      console.error("Error al obtener detalle del candidato:", err);
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
          f3_cliente: { notas_reclutador: editF3Notes.trim() }
        } as any);
      }
      setCand(prev => prev ? {
        ...prev,
        initialNotes: editInitialNotes.trim(),
        f1Notes: editF1Notes.trim(),
        f2Notes: editF2Notes.trim(),
        f3Notes: editF3Notes.trim(),
        recruiterNotes: editF3Notes.trim() || editF2Notes.trim()
      } : null);
      setIsEditingNotes(false);
      triggerToast("Historial de notas guardado correctamente.");
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

  const handleTransitionState = async (targetPhase: PresentacionCandidate["currentPhase"]) => {
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
          flujo: { estado_actual: targetPhase, fecha_ultimo_cambio: now }
        });
        triggerToast(`Estado cambiado a ${label}`);
      } catch (err) {
        console.error("Error al actualizar estado:", err);
      }
    }
  };

  const confirmAdvancePhaseAction = async () => {
    if (!cand) return;
    setIsAdvancingPhase(true);
    try {
      if (cand.pipeId) {
        const now = new Date().toISOString();
        const nuevoEstado = "12_oferta_extendida";
        const historialActualizado = [
          { estado: nuevoEstado, timestamp: now },
          ...(activePipelineItem?.flujo?.historial_estados || [])
        ];
        await actualizarPipelineAPI(cand.pipeId, {
          flujo: {
            estado_actual: nuevoEstado,
            fecha_ultimo_cambio: now,
            historial_estados: historialActualizado
          }
        });
      }
      setIsAdvanceModalOpen(false);
      router.push("/cierre");
    } catch (err: any) {
      console.error("Error al avanzar candidato a Fase 4:", err);
    } finally {
      setIsAdvancingPhase(false);
    }
  };

  const [isRevertingPhase, setIsRevertingPhase] = useState(false);

  const handleRevertToEvalPhase = async () => {
    if (!cand) return;
    setIsRevertingPhase(true);
    try {
      const now = new Date().toISOString();
      const targetPhase = "05_screening";
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

      triggerToast(`Expediente devuelto a Fase Evaluación (05_screening).`);
      router.push(`/evaluacion/${cand.pipeId || cand.id}`);
    } catch (err: any) {
      console.error("Error al revertir candidato a Fase Evaluación:", err);
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

  // TOOL 1: Analítica Zoom
  const runZoomAnalysis = () => {
    if (!cand) return;
    setIsSimulatingAnalysis(true);
    setTimeout(() => {
      setIsSimulatingAnalysis(false);
      setCand(prev => prev ? {
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
      triggerToast("Análisis telemétrico de Zoom completado (+2 insights añadidos).");
    }, 2000);
  };

  // TOOL 2: Traductor ATS
  const runTranslationAndStadardizer = () => {
    if (!cand) return;
    setIsSimulatingTranslation(true);
    setTimeout(() => {
      setIsSimulatingTranslation(false);
      setCand(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          traductor: {
            ...prev.toolsDetails.traductor,
            cvTranslated: true
          }
        }
      } : null);
      triggerToast("CV traducido y normalizado al inglés bajo formato ATS.");
    }, 2000);
  };

  // TOOL 3: Briefing Generator
  const runBriefingGenerator = () => {
    if (!cand) return;
    setIsSimulatingBriefingGen(true);
    setTimeout(() => {
      setIsSimulatingBriefingGen(false);
      const outputText = `El candidato ${cand.name} califica con aptitudes relevantes para la vacante de ${cand.role} en ${cand.client}.\n\nDemuestra contar con ${cand.experienceYears} años de experiencia laboral. El Co-Pilot de IA valora sus capacidades técnicas y fluidez conversacional en un ${cand.score}% de coincidencia inicial.\n\nSLA salarial comprobado favorablemente. Se posiciona como una contratación estratégica recomendada por la agencia.`;
      setCand(prev => prev ? {
        ...prev,
        toolsDetails: {
          ...prev.toolsDetails,
          briefing: {
            generated: true,
            content: outputText
          }
        }
      } : null);
      triggerToast("Briefing Ejecutivo redactado por IA.");
    }, 2000);
  };

  // TOOL 4: Agenda Orchestrator
  const suggestOptimalSlot = () => {
    if (!cand) return;
    setIsSimulatingAgendasSlot(true);
    setTimeout(() => {
      setIsSimulatingAgendasSlot(false);
      setCand(prev => prev ? {
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
      triggerToast("Slot óptimo reservado y coordinado automáticamente.");
    }, 1800);
  };

  // TOOL 5: SLA Tracker Ping
  const sendSlaAlertPing = () => {
    if (!cand) return;
    setIsSimulatingSlaPing(true);
    setTimeout(() => {
      setIsSimulatingSlaPing(false);
      setCand(prev => prev ? {
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
      triggerToast("Notificación de escalamiento SLA enviada al Hiring Manager.");
    }, 1200);
  };

  const getPhaseLabel = (phase: PresentacionCandidate["currentPhase"]) => {
    switch (phase) {
      case "09_shortlist": return "09 - Shortlist / Enviado a Cliente";
      case "10_entrevista_cliente": return "10 - Entrevista con Cliente";
      case "11_standby": return "11 - Stand-by / Back-up";
    }
  };

  const phaseColors = {
    "09_shortlist": "text-amber-400 border-amber-500/20 bg-amber-500/10",
    "10_entrevista_cliente": "text-emerald-400 border-emerald-500/20 bg-emerald-500/10",
    "11_standby": "text-purple-400 border-purple-500/20 bg-purple-500/10"
  };

  // ── Loading ──
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#101415] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#6bd8cb] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#6bd8cb] font-bold">Cargando expediente de presentación al cliente...</p>
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
          {`El ID solicitado "${id}" no corresponde a un expediente de presentación registrado.`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => loadCandidateData()}
            className="px-4 py-2 bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 rounded-xl text-xs hover:bg-[#6bd8cb] hover:text-black transition-all font-bold"
          >
            Reintentar
          </button>
          <Link
            href="/presentacion"
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-[#c4c1fb] hover:text-black transition-all"
          >
            Volver a Presentación
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 overflow-x-hidden text-left">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161a1b] border border-amber-500/30 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Radial Background Glows */}
      <div className="absolute top-20 left-10 w-72 h-72 rounded-full bg-amber-500/5 blur-[90px] pointer-events-none" />
      <div className="absolute bottom-20 right-10 w-80 h-80 rounded-full bg-[#6bd8cb]/5 blur-[90px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto space-y-6">

        {/* ── Top Header Navigation Bar ── */}
        <header className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link
              href="/presentacion"
              className="p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all cursor-pointer"
              title="Volver a la vista general de Presentación"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Fase 3: Calibración final
                </span>
                <span title="ID de vista para prompts de desarrollo" className="text-[9px] font-mono text-[#6bd8cb]/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-all cursor-help uppercase tracking-wider font-semibold">
                  ID: P-PRE-02
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
            <div className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/25">
              F3 Cliente (Actual)
            </div>
            <Link
              href="/cierre"
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#879391] hover:text-emerald-400 hover:bg-white/5 transition-all"
            >
              F4 Cierre
            </Link>
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
                <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  cNPS: {cand.cNPS || 9} / 10
                </span>
              </div>
              
              <div className="flex items-center gap-4 text-xs text-[#879391] flex-wrap">
                <span className="flex items-center gap-1.5 text-white font-medium">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
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
              {/* Revert to Evaluation Phase Button */}
              <button
                onClick={handleRevertToEvalPhase}
                disabled={isRevertingPhase}
                className="px-3.5 py-2 rounded-xl bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="Cambia el estado del expediente al primer estado de la Fase 2 Evaluación (05_screening)"
              >
                {isRevertingPhase ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <ChevronsLeft className="w-3.5 h-3.5" />
                )}
                <span>Volver a Fase Evaluación</span>
              </button>

              {/* Advance Phase Button */}
              <button
                onClick={() => setIsAdvanceModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#6bd8cb] text-[#101415] font-black text-xs hover:opacity-90 transition-all flex items-center gap-2 shadow-lg shadow-emerald-500/10 cursor-pointer"
              >
                <UserCheck className="w-4 h-4" />
                <span>Avanzar a Fase 4 Cierre</span>
              </button>

              {/* State Dropdown Transitions */}
              <select
                value={cand.currentPhase}
                onChange={(e) => handleTransitionState(e.target.value as PresentacionCandidate["currentPhase"])}
                className="bg-[#101415] border border-white/20 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="09_shortlist" className="bg-[#15181a]">09 - Shortlist / Enviado</option>
                <option value="10_entrevista_cliente" className="bg-[#15181a]">10 - Entrevista con Cliente</option>
                <option value="11_standby" className="bg-[#15181a]">11 - Stand-by / Back-up</option>
              </select>
            </div>
          </div>
        </section>

        {/* ── Metadata & SLA Timeline Section ── */}
        {activePipelineItem && (
          <section className="glass-panel p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Línea de Tiempo SLA & Metadatos del Pipeline
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
                <span className="text-[9px] text-[#879391] font-bold uppercase block">Última Modificación de Estado</span>
                <span className="font-mono text-amber-400 font-bold">
                  {new Date(activePipelineItem.flujo?.fecha_ultimo_cambio || Date.now()).toLocaleDateString("es-ES")}
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
              <FileText className="w-4 h-4 text-amber-500" />
              Historial de Anotaciones del Expediente
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
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
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
                <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                <span>Editar Anotaciones</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* Notes 1: Initial */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
              <span className="text-[10px] font-bold text-[#879391] uppercase tracking-wider block">Notas Iniciales (Sourcing)</span>
              {isEditingNotes ? (
                <textarea
                  value={editInitialNotes}
                  onChange={(e) => setEditInitialNotes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#101415] border border-white/15 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-sans resize-none"
                  placeholder="Sin notas de origen..."
                />
              ) : (
                <p className="text-[#e0e3e5] leading-relaxed italic">
                  {cand.initialNotes || editInitialNotes || "Sin anotaciones iniciales registradas."}
                </p>
              )}
            </div>

            {/* Notes 2: F1 Sourcing */}
            <div className="p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/15 space-y-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider block">Notas F1 Descubrimiento</span>
              {isEditingNotes ? (
                <textarea
                  value={editF1Notes}
                  onChange={(e) => setEditF1Notes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#101415] border border-cyan-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-sans resize-none"
                  placeholder="Sin notas de F1..."
                />
              ) : (
                <p className="text-cyan-100 leading-relaxed italic">
                  {cand.f1Notes || editF1Notes || "Sin anotaciones en Fase 1."}
                </p>
              )}
            </div>

            {/* Notes 3: F2 Evaluación */}
            <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/15 space-y-2">
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">Notas F2 Evaluación</span>
              {isEditingNotes ? (
                <textarea
                  value={editF2Notes}
                  onChange={(e) => setEditF2Notes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#101415] border border-purple-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-purple-400 font-sans resize-none"
                  placeholder="Sin notas de F2..."
                />
              ) : (
                <p className="text-purple-100 leading-relaxed italic">
                  {cand.f2Notes || editF2Notes || "Sin anotaciones de evaluación técnica."}
                </p>
              )}
            </div>

            {/* Notes 4: F3 Presentación Cliente */}
            <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/15 space-y-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Notas F3 Cliente Presentación</span>
              {isEditingNotes ? (
                <textarea
                  value={editF3Notes}
                  onChange={(e) => setEditF3Notes(e.target.value)}
                  rows={4}
                  className="w-full bg-[#101415] border border-amber-500/30 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-amber-400 font-sans resize-none"
                  placeholder="Notas de interacción con cliente..."
                />
              ) : (
                <p className="text-amber-100 leading-relaxed italic">
                  {cand.f3Notes || editF3Notes || "Expediente entregado al cliente sin observaciones adicionales."}
                </p>
              )}
            </div>
          </div>
        </section>

        {/* ── Client & AI Diagnostic Tools Tabbed Navigation ── */}
        <section className="glass-panel p-6 rounded-3xl border border-white/10 space-y-6">
          
          {/* Tab Selector Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-white/10">
            <button
              onClick={() => setActiveTab("general")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "general"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>General & Briefing</span>
            </button>

            <button
              onClick={() => setActiveTab("analitica")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "analitica"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Analítica Zoom</span>
            </button>

            <button
              onClick={() => setActiveTab("traductor")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "traductor"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <Languages className="w-3.5 h-3.5" />
              <span>Traductor ATS</span>
            </button>

            <button
              onClick={() => setActiveTab("briefing")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "briefing"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Briefing Ejecutivo</span>
            </button>

            <button
              onClick={() => setActiveTab("agenda")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "agenda"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Orquestador Agendas</span>
            </button>

            <button
              onClick={() => setActiveTab("tracker")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "tracker"
                  ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
                  : "bg-white/5 text-[#879391] hover:text-white hover:bg-white/10"
              }`}
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Rastreador SLA</span>
            </button>
          </div>

          {/* TAB 1: General Info */}
          {activeTab === "general" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <h4 className="text-sm font-bold text-white">Resumen Ejecutivo de Calibración</h4>
                <p className="text-[#879391] leading-relaxed">
                  {`El expediente de ${cand.name} para la vacante de ${cand.role} en ${cand.client} se encuentra presentado activamente.`}
                </p>
                <div className="flex items-center gap-4 text-[#c4c1fb] font-mono">
                  <span>Años Experiencia: {cand.experienceYears} años</span>
                  <span>cNPS Evaluador: {cand.cNPS || 9}</span>
                  <span>Fit Score: {cand.score}%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Analítica Zoom */}
          {activeTab === "analitica" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Analítica Telemétrica Zoom / Meet</h4>
                  <p className="text-[10px] text-[#879391]">Transcripciones e inferencias de sentimiento del postulante</p>
                </div>
                <button
                  onClick={runZoomAnalysis}
                  disabled={isSimulatingAnalysis}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isSimulatingAnalysis ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Zap className="w-3.5 h-3.5" />
                  )}
                  <span>Ejecutar Análisis Telemétrico</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Sentiment Score General</span>
                  <span className="text-2xl font-black text-amber-400">{cand.toolsDetails.analitica.sentimentScore} / 100</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold block w-fit">
                    {cand.toolsDetails.analitica.globalSentiment}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Microexpresiones Detectadas</span>
                  <ul className="space-y-1">
                    {cand.toolsDetails.analitica.microExpressionsDetected.map((m, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 text-[#e0e3e5]">
                        <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>{m}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Transcripts */}
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                <span className="text-[10px] font-bold text-white/40 uppercase block">Snippets de Transcripción Registrados</span>
                <div className="space-y-2">
                  {cand.toolsDetails.analitica.transcriptSnippets.map((t, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/5 text-[11px]">
                      <span className="font-bold text-[#6bd8cb] block">{t.speaker}:</span>
                      <p className="text-[#879391] italic">"{t.text}"</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Traductor ATS */}
          {activeTab === "traductor" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Traductor & Estandarizador ATS</h4>
                  <p className="text-[10px] text-[#879391]">Formateo unificado de currículums en inglés para clientes corporativos</p>
                </div>
                <button
                  onClick={runTranslationAndStadardizer}
                  disabled={isSimulatingTranslation}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isSimulatingTranslation ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Languages className="w-3.5 h-3.5" />
                  )}
                  <span>Traducir CV al Inglés</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">CV Original</span>
                  <p className="text-[#879391] leading-relaxed italic">{cand.toolsDetails.traductor.originalCVText}</p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-2">
                  <span className="text-[10px] font-bold text-[#6bd8cb] uppercase block">Resumen Traducido ATS</span>
                  <p className="text-[#e0e3e5] leading-relaxed font-mono">
                    {cand.toolsDetails.traductor.translatedCVText}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Briefing Ejecutivo */}
          {activeTab === "briefing" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Candidate Briefing Ejecutivo por IA</h4>
                  <p className="text-[10px] text-[#879391]">Documento estructurado de presentación para el Hiring Manager</p>
                </div>
                <button
                  onClick={runBriefingGenerator}
                  disabled={isSimulatingBriefingGen}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isSimulatingBriefingGen ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Generar Briefing IA</span>
                </button>
              </div>

              {cand.toolsDetails.briefing.generated ? (
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Briefing Listo</span>
                    <button
                      onClick={() => handleCopyText(cand.toolsDetails.briefing.content, "briefing")}
                      className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-white text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3 text-amber-500" />
                      <span>{copiedTextType === "briefing" ? "¡Copiado!" : "Copiar Briefing"}</span>
                    </button>
                  </div>
                  <p className="text-[#e0e3e5] leading-relaxed whitespace-pre-line">
                    {cand.toolsDetails.briefing.content}
                  </p>
                </div>
              ) : (
                <div className="p-8 text-center border border-dashed border-white/10 rounded-2xl text-[#879391]">
                  Aún no se ha generado el briefing ejecutivo. Haz clic en el botón superior para generarlo.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: Orquestador Agendas */}
          {activeTab === "agenda" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Orquestador de Agendas Condicional</h4>
                  <p className="text-[10px] text-[#879391]">Mapeo de slots óptimos para entrevista con el Hiring Manager</p>
                </div>
                <button
                  onClick={suggestOptimalSlot}
                  disabled={isSimulatingAgendasSlot}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isSimulatingAgendasSlot ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Calendar className="w-3.5 h-3.5" />
                  )}
                  <span>Reservar Slot Óptimo</span>
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3">
                <span className="text-[10px] font-bold text-white/40 uppercase block">Slots Sugeridos Disponibles</span>
                <div className="space-y-2">
                  {cand.toolsDetails.agenda.suggestedSlots.map((slot, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-black/40 border border-white/5 flex items-center justify-between text-xs">
                      <span className="text-[#e0e3e5]">{slot}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold">Disponible</span>
                    </div>
                  ))}
                </div>

                {cand.toolsDetails.agenda.recruiterSlotSelected && (
                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 space-y-1">
                    <span className="text-[10px] font-bold uppercase block">Slot Seleccionado</span>
                    <span className="font-bold">{cand.toolsDetails.agenda.recruiterSlotSelected}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: Bot SLA Tracker */}
          {activeTab === "tracker" && (
            <div className="space-y-4 animate-fadeIn text-xs">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-bold text-white">Bot Rastreador de SLA</h4>
                  <p className="text-[10px] text-[#879391]">Monitoreo de horas de espera y envío de recordatorios al cliente</p>
                </div>
                <button
                  onClick={sendSlaAlertPing}
                  disabled={isSimulatingSlaPing}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isSimulatingSlaPing ? (
                    <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>Enviar Alerta SLA</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Horas Transcurridas</span>
                  <span className="text-xl font-black text-white">{cand.toolsDetails.tracker.hoursSinceSent} horas</span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Estado SLA</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded inline-block ${
                    cand.toolsDetails.tracker.slaExceeded ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  }`}>
                    {cand.toolsDetails.tracker.slaExceeded ? "Excedido (>48h)" : "Normal (<48h)"}
                  </span>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold text-white/40 uppercase block">Alertas Enviadas</span>
                  <span className="text-xl font-black text-amber-400">{cand.toolsDetails.tracker.totalRemindersSent} alertas</span>
                </div>
              </div>
            </div>
          )}

        </section>

      </div>

      {/* ── Phase 4 Advance Modal Confirmation ── */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#141819] border border-emerald-500/30 rounded-3xl p-6 max-w-md w-full space-y-5 text-left shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b border-white/10">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Avanzar a Fase 4 Cierre</h3>
              </div>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="text-white/40 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#879391]">
              <p>
                ¿Confirmas que deseas graduar al candidato <strong className="text-white">{cand.name}</strong> a la <strong className="text-emerald-400">Fase 4: Cierre del Proceso (11 - Oferta Extendida)</strong>?
              </p>
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-[11px]">
                El expediente se moverá formalmente a la mesa de oferta y negociación en el pipeline de cierre.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold text-[#879391] hover:text-white hover:bg-white/5 transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmAdvancePhaseAction}
                disabled={isAdvancingPhase}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-[#6bd8cb] text-black font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20"
              >
                {isAdvancingPhase ? (
                  <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                ) : (
                  <UserCheck className="w-4 h-4" />
                )}
                <span>Confirmar Graduación a F4</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
