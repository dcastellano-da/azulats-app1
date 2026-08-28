'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getApiEndpoint } from "@/utils/api";
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
  ShieldCheck,
  Code,
  Zap,
  AlertTriangle,
  Phone,
  Mail,
  Star,
  ChevronRight,
  Compass,
  HelpCircle,
  Share2,
  Plus,
  Trash2,
  Video,
  ExternalLink,
  Calendar,
  Brain,
  Download
} from "lucide-react";

// Backend API Actions
import { getBusquedasAPI, Busqueda } from "@/actions/busquedas";
import { getCandidatosAPI, actualizarCandidatoAPI, Candidato } from "@/actions/candidatos";
import { getPipelineAPI, PipelineItem, actualizarPipelineAPI, Reunion } from "@/actions/pipeline";
import { EvaluacionCandidate } from "@/lib/evaluacion";
import type { InformeEntrevistaIA, TestPersonalidad, AssessmentManual } from "@/types/screening";
import AnalizarTranscripcionModal from "@/app/components/AnalizarTranscripcionModal";
import InformeScreeningCard from "@/app/components/InformeScreeningCard";
import AnalizarTestPersonalidadModal from "@/app/components/AnalizarTestPersonalidadModal";
import TestPersonalidadCard from "@/app/components/TestPersonalidadCard";
import AssessmentManualCard from "@/app/components/AssessmentManualCard";
import GenerarFichaPdfModal from "@/app/components/GenerarFichaPdfModal";

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
      gaps: [] as { period: string; duration: string; description: string }[],
      overlaps: [] as string[]
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

type DiagTab = "sintetizador" | "inconsistencias" | "preguntas" | "validador" | "copilot";

export default function EvaluacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

  const [cand, setCand] = useState<EvaluacionCandidate | null>(null);
  const [activePipelineItem, setActivePipelineItem] = useState<PipelineItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active Tab for AI Diagnostic Tools
  const [activeTab, setActiveTab] = useState<DiagTab>("sintetizador");

  // Transcripción de Screening IA State
  const [isTranscripcionModalOpen, setIsTranscripcionModalOpen] = useState(false);
  const [informeEntrevistaIA, setInformeEntrevistaIA] = useState<InformeEntrevistaIA | null>(null);

  // Test de Personalidad CFV-V3 State
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isFichaPdfModalOpen, setIsFichaPdfModalOpen] = useState(false);
  const [testPersonalidad, setTestPersonalidad] = useState<TestPersonalidad | null>(null);
  const [assessmentManual, setAssessmentManual] = useState<AssessmentManual | null>(null);

  // Editing state for Recruiter Notes across all phases
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editInitialNotes, setEditInitialNotes] = useState("");
  const [editF1Notes, setEditF1Notes] = useState("");
  const [editF2Notes, setEditF2Notes] = useState("");
  const [editCanalIngreso, setEditCanalIngreso] = useState("");
  const [existingChannels, setExistingChannels] = useState<string[]>([
    "Headhunting",
    "LinkedIn",
    "Referido",
    "InfoJob",
    "Otros"
  ]);
  const [isCustomChannel, setIsCustomChannel] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Simulation states
  const [copiedTextType, setCopiedTextType] = useState<string | null>(null);

  // Phase 3 Advance Modal State
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isAdvancingPhase, setIsAdvancingPhase] = useState(false);

  // Meetings modal and action states
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [editingMeeting, setEditingMeeting] = useState<Reunion | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);
  const [meetingForm, setMeetingForm] = useState({
    fecha_hora: "",
    link_reunion: "",
    objetivo: "",
    notas: ""
  });
  const [savingMeeting, setSavingMeeting] = useState(false);

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
        const dbChannels = candidatesList
          .map(c => c.canal_ingreso)
          .filter((ch): ch is string => Boolean(ch && ch.trim()));
        const defaults = ["Headhunting", "LinkedIn", "Referido", "InfoJob", "Otros"];
        setExistingChannels(Array.from(new Set([...defaults, ...dbChannels])));
      }

      let pipeItems: PipelineItem[] = [];
      if (searches.length > 0) {
        const promises = searches.map(s => getPipelineAPI(s.id_busqueda || s.id));
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
        const busqMap = new Map<string, Busqueda>();
        searches.forEach(b => {
          if (b.id) busqMap.set(b.id, b);
          if (b.id_busqueda) busqMap.set(b.id_busqueda, b);
          if (b.codigo_busqueda) busqMap.set(b.codigo_busqueda, b);
        });

        const cObj = targetCand || candMap.get(targetPipe?.claves_conexion?.id_candidato || "");
        const bObj = busqMap.get(targetPipe?.claves_conexion?.id_busqueda || "");

        const stateStr = (targetPipe?.flujo?.estado_actual || "").toLowerCase();
        let currentPhase: EvaluacionCandidate["currentPhase"] = "05_screening";
        if (stateStr.includes("05") || stateStr.includes("screening")) {
          currentPhase = "05_screening";
        } else if (stateStr.includes("06") || stateStr.includes("assessment") || stateStr.includes("prueba")) {
          currentPhase = "06_assessment";
        } else if (stateStr.includes("07") || stateStr.includes("en_duda") || stateStr.includes("duda")) {
          currentPhase = "07_en_duda_evaluacion";
        } else if (stateStr.includes("08") || stateStr.includes("descartado")) {
          currentPhase = "08_descartado_interno";
        }

        const candName = cObj?.nombre_completo || "Candidato";
        const role = cObj?.puesto || bObj?.perfil_busqueda || "Especialista Tech";
        const client = bObj?.cliente || "Cliente General";
        const location = cObj?.ubicacion || "España / Remoto";
        const score = targetPipe?.f1_descubrimiento?.analisis_semantico?.fit_score ?? targetPipe?.evaluacion?.puntaje_tecnico ?? 88;
        
        const initialNotes = cObj?.notas_iniciales || "";
        const f1Notes = targetPipe?.f1_descubrimiento?.notas_reclutador || "";
        const f2Notes = targetPipe?.f2_evaluacion?.notas_reclutador || targetPipe?.evaluacion?.notas_reclutador || "";

        const item: EvaluacionCandidate = {
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
          recruiterNotes: f2Notes,
          url_cv: cObj?.url_cv || undefined,
          canal_ingreso: cObj?.canal_ingreso || null,
          reuniones: targetPipe?.f1_descubrimiento?.reuniones || [],
          toolsDetails: generateDefaultToolsDetails(candName, role, score)
        };

        setCand(item);
        setActivePipelineItem(targetPipe || null);
        setInformeEntrevistaIA(targetPipe?.f2_evaluacion?.informe_entrevista_ia || (targetPipe?.evaluacion as any)?.informe_entrevista_ia || null);
        setTestPersonalidad(targetPipe?.f2_evaluacion?.test_personalidad || (targetPipe?.evaluacion as any)?.test_personalidad || null);
        setAssessmentManual(targetPipe?.f2_evaluacion?.assessment_manual || (targetPipe?.evaluacion as any)?.assessment_manual || null);
        setEditInitialNotes(initialNotes);
        setEditF1Notes(f1Notes);
        setEditF2Notes(f2Notes);
        setEditCanalIngreso(cObj?.canal_ingreso || "");
        setIsCustomChannel(false);
      } else {
        setError("No se encontró el expediente del candidato en el pipeline de evaluación.");
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
      // 1. Update Candidate initial notes and canal_ingreso in backend
      if (cand.id) {
        await actualizarCandidatoAPI(cand.id, {
          notas_iniciales: editInitialNotes.trim(),
          canal_ingreso: editCanalIngreso.trim()
        });
        if (editCanalIngreso.trim()) {
          setExistingChannels(prev => Array.from(new Set([...prev, editCanalIngreso.trim()])));
        }
      }
      // 2. Update Pipeline F1 and F2 notes in backend
      if (cand.pipeId) {
        await actualizarPipelineAPI(cand.pipeId, {
          f1_descubrimiento: { notas_reclutador: editF1Notes.trim() },
          f2_evaluacion: { notas_reclutador: editF2Notes.trim() },
          evaluacion: { notas_reclutador: editF2Notes.trim() }
        });
      }
      setCand(prev => prev ? {
        ...prev,
        initialNotes: editInitialNotes.trim(),
        f1Notes: editF1Notes.trim(),
        f2Notes: editF2Notes.trim(),
        recruiterNotes: editF2Notes.trim(),
        canal_ingreso: editCanalIngreso.trim() || null
      } : null);
      setIsEditingNotes(false);
    } catch (err) {
      console.error("Error al guardar historial de notas:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Meetings Handler Functions
  const handleOpenCreateMeeting = () => {
    setEditingMeeting(null);
    const nowISO = new Date().toISOString().slice(0, 16);
    setMeetingForm({
      fecha_hora: nowISO,
      link_reunion: "",
      objetivo: "",
      notas: ""
    });
    setIsMeetingModalOpen(true);
  };

  const handleOpenEditMeeting = (m: Reunion) => {
    setEditingMeeting(m);
    let formattedDate = m.fecha_hora;
    try {
      if (m.fecha_hora) {
        formattedDate = new Date(m.fecha_hora).toISOString().slice(0, 16);
      }
    } catch (_) {}
    setMeetingForm({
      fecha_hora: formattedDate || "",
      link_reunion: m.link_reunion || "",
      objetivo: m.objetivo || "",
      notas: m.notas || ""
    });
    setIsMeetingModalOpen(true);
  };

  const handleSaveMeeting = async () => {
    if (!meetingForm.fecha_hora) {
      alert("Por favor indica la fecha y hora de la reunión.");
      return;
    }
    if (!meetingForm.objetivo.trim()) {
      alert("Por favor especifica el objetivo de la reunión.");
      return;
    }

    try {
      setSavingMeeting(true);
      const formattedFechaHora = new Date(meetingForm.fecha_hora).toISOString();
      const currentMeetings = activePipelineItem?.f1_descubrimiento?.reuniones || cand?.reuniones || [];

      let updatedMeetings: Reunion[] = [];
      if (editingMeeting) {
        updatedMeetings = currentMeetings.map(m => 
          m.id_reunion === editingMeeting.id_reunion
            ? {
                ...m,
                fecha_hora: formattedFechaHora,
                link_reunion: meetingForm.link_reunion.trim(),
                objetivo: meetingForm.objetivo.trim(),
                notas: meetingForm.notas.trim(),
                fase: m.fase || "F2 - Evaluación"
              }
            : m
        );
      } else {
        const newMeeting: Reunion = {
          id_reunion: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `reu-${Date.now()}`,
          fecha_hora: formattedFechaHora,
          link_reunion: meetingForm.link_reunion.trim(),
          objetivo: meetingForm.objetivo.trim(),
          notas: meetingForm.notas.trim(),
          fase: "F2 - Evaluación"
        };
        updatedMeetings = [...currentMeetings, newMeeting];
      }

      if (activePipelineItem?.id || cand?.pipeId) {
        const pipeId = activePipelineItem?.id || cand?.pipeId!;
        const f1Data = activePipelineItem?.f1_descubrimiento || (cand as any)?.f1_descubrimiento || {};
        
        const payload = {
          f1_descubrimiento: {
            ...f1Data,
            reuniones: updatedMeetings
          }
        };

        const res = await actualizarPipelineAPI(pipeId, payload);
        if (!res.success) {
          throw new Error(res.message || "Error al actualizar la reunión en el pipeline.");
        }

        setActivePipelineItem(prev => prev ? {
          ...prev,
          f1_descubrimiento: {
            ...prev.f1_descubrimiento,
            reuniones: updatedMeetings
          }
        } : null);
      }

      setCand(prev => prev ? { ...prev, reuniones: updatedMeetings } : null);
      setIsMeetingModalOpen(false);
    } catch (err: any) {
      console.error("Error al guardar la reunión:", err);
      alert(err.message || "Ocurrió un error al guardar la reunión.");
    } finally {
      setSavingMeeting(false);
    }
  };

  const confirmDeleteMeetingAction = async () => {
    if (!deletingMeetingId) return;

    try {
      setSavingMeeting(true);
      const currentMeetings = activePipelineItem?.f1_descubrimiento?.reuniones || cand?.reuniones || [];
      const updatedMeetings = currentMeetings.filter(m => m.id_reunion !== deletingMeetingId);

      if (activePipelineItem?.id || cand?.pipeId) {
        const pipeId = activePipelineItem?.id || cand?.pipeId!;
        const f1Data = activePipelineItem?.f1_descubrimiento || (cand as any)?.f1_descubrimiento || {};
        
        const payload = {
          f1_descubrimiento: {
            ...f1Data,
            reuniones: updatedMeetings
          }
        };

        const res = await actualizarPipelineAPI(pipeId, payload);
        if (!res.success) {
          throw new Error(res.message || "Error al eliminar la reunión del pipeline.");
        }

        setActivePipelineItem(prev => prev ? {
          ...prev,
          f1_descubrimiento: {
            ...prev.f1_descubrimiento,
            reuniones: updatedMeetings
          }
        } : null);
      }

      setCand(prev => prev ? { ...prev, reuniones: updatedMeetings } : null);
      setDeletingMeetingId(null);
    } catch (err: any) {
      console.error("Error al eliminar la reunión:", err);
      alert(err.message || "Ocurrió un error al eliminar la reunión.");
    } finally {
      setSavingMeeting(false);
    }
  };

  // View CV Document PDF handler
  const handleViewCv = (candId: string, urlCv?: string) => {
    if (!urlCv) {
      alert("Este postulante no tiene un archivo CV adjunto.");
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

  const handleTransitionState = async (targetPhase: EvaluacionCandidate["currentPhase"]) => {
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
        const nuevoEstado = "09_presentado_cliente";
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
      router.push("/evaluacion");
    } catch (err: any) {
      console.error("Error al avanzar candidato a Fase 3:", err);
    } finally {
      setIsAdvancingPhase(false);
    }
  };

  const handleCopyText = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTextType(type);
    setTimeout(() => setCopiedTextType(null), 2000);
  };

  const getPhaseLabel = (phase: EvaluacionCandidate["currentPhase"]) => {
    switch (phase) {
      case "05_screening": return "05 - Screening";
      case "06_assessment": return "06 - Assessment";
      case "07_en_duda_evaluacion": return "07 - En Duda";
      case "08_descartado_interno": return "08 - Descartado";
    }
  };

  const phaseColors = {
    "05_screening": "text-amber-400 border-amber-500/20 bg-amber-500/10",
    "06_assessment": "text-[#6bd8cb] border-[#6bd8cb]/20 bg-[#6bd8cb]/10",
    "07_en_duda_evaluacion": "text-amber-500 border-amber-500/20 bg-amber-500/10",
    "08_descartado_interno": "text-rose-400 border-rose-500/20 bg-rose-500/10"
  };

  // ── Loading ──
  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#101415] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#6bd8cb] border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-[#6bd8cb] font-bold">Cargando expediente de evaluación...</p>
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
          {`El ID solicitado "${id}" no corresponde a un perfil de evaluación registrado.`}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => loadCandidateData()}
            className="px-4 py-2 bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 rounded-xl text-xs hover:bg-[#6bd8cb] hover:text-black transition-all font-bold"
          >
            Reintentar
          </button>
          <Link
            href="/evaluacion"
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-[#c4c1fb] hover:text-black transition-all"
          >
            Volver a Evaluación
          </Link>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#101415] text-[#e0e3e5] px-4 md:px-8 py-6 selection:bg-[#c4c1fb] selection:text-stone-900">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Breadcrumb Navigation ── */}
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <Link
            href="/evaluacion"
            className="flex items-center gap-2 text-xs font-bold text-[#879391] hover:text-[#c4c1fb] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a F2 Evaluación</span>
          </Link>

          <div className="flex items-center gap-2">
            <span title="ID de vista para prompts de desarrollo" className="text-[9px] font-mono text-[#6bd8cb]/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-all cursor-help uppercase tracking-wider font-semibold">
              ID: P-EVA-02
            </span>
            {/* PDF CV Direct View button */}
            <button
              onClick={() => cand && handleViewCv(cand.id, cand.url_cv)}
              title={cand?.url_cv ? "Ver Documento CV PDF" : "Sin CV adjunto"}
              className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs ${
                cand?.url_cv
                  ? "text-[#6bd8cb] bg-white/5 border-white/10 hover:bg-[#6bd8cb]/10 hover:border-[#6bd8cb]/30"
                  : "text-[#879391]/40 bg-white/5 border-white/5 hover:bg-white/10"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>CV</span>
            </button>

            {/* Analizar Transcripción Button */}
            <button
              onClick={() => setIsTranscripcionModalOpen(true)}
              title="Analizar Transcripción de Screening con IA (ID: M-TRN-01)"
              className="px-3.5 py-1.5 rounded-xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/15 hover:bg-[#6bd8cb] hover:text-stone-950 text-[#6bd8cb] transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm shadow-[#6bd8cb]/10"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Analizar Transcripción</span>
            </button>

            {/* Analizar Test Personalidad Button (CFV-V3) */}
            <button
              onClick={() => setIsTestModalOpen(true)}
              title="Analizar Test de Personalidad con IA (CFV-V3)"
              className="px-3.5 py-1.5 rounded-xl border border-[#9b5de5]/30 bg-[#9b5de5]/15 hover:bg-[#9b5de5] hover:text-stone-950 text-[#c4c1fb] hover:text-stone-950 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm shadow-[#9b5de5]/10"
            >
              <Brain className="w-3.5 h-3.5" />
              <span>Analizar Test Personalidad</span>
            </button>

            {/* Generar Ficha PDF Button */}
            <button
              onClick={() => setIsFichaPdfModalOpen(true)}
              title="Generar Ficha Técnica a PDF (Dossier Presentación a Cliente)"
              className="px-3.5 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-500/15 hover:bg-emerald-500 hover:text-stone-950 text-emerald-300 transition-all cursor-pointer flex items-center justify-center gap-1.5 font-bold text-xs shadow-sm shadow-emerald-500/10"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Generar Ficha (PDF)</span>
            </button>

            <span className="text-[10px] font-bold text-[#c4c1fb] bg-[#c4c1fb]/10 px-3 py-1 rounded-full uppercase tracking-wider border border-[#c4c1fb]/20">
              Fase 2: Evaluación Interna
            </span>
          </div>
        </div>

        {/* ── Main Grid Layout ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ══════════════════════════════════
              MAIN AREA (col-span-2)
          ══════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-6">

            {/* ── Hero Card ── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden space-y-6">
              {/* Decorative gradient blob */}
              <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-[#c4c1fb]/5 blur-3xl pointer-events-none" />

              {/* Header: name + badge */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-[#879391] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {cand.id} • F2 Evaluación Interna
                  </span>
                  <h1 className="text-xl font-bold text-white tracking-tight">{cand.name}</h1>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-3 py-1 rounded-full border text-xs font-bold ${phaseColors[cand.currentPhase]}`}>
                    {getPhaseLabel(cand.currentPhase)}
                  </span>
                  <div className="px-3 py-1 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb] text-xs font-bold font-mono">
                    Fit: {cand.score}%
                  </div>
                </div>
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Puesto Vacante</span>
                    <div className="flex items-center gap-2 text-xs text-white font-semibold">
                      {cand.role}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Cliente</span>
                    <div className="flex items-center gap-2 text-xs text-[#c4c1fb]">
                      <Building2 className="w-4 h-4 text-[#c4c1fb]/70" />
                      <span>{cand.client}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Ubicación</span>
                    <div className="flex items-center gap-2 text-xs text-[#879391]">
                      <MapPin className="w-4 h-4 text-[#6bd8cb]/70" />
                      <span>{cand.location}</span>
                    </div>
                  </div>

                  {/* Canal de Ingreso (Sourcing) */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-[#6bd8cb]" />
                      Canal de Ingreso (Sourcing)
                    </span>
                    {isEditingNotes ? (
                      <div className="space-y-1.5">
                        <select
                          value={isCustomChannel || (!existingChannels.includes(editCanalIngreso) && editCanalIngreso !== "") ? "OTHER_CUSTOM" : editCanalIngreso}
                          onChange={(e) => {
                            if (e.target.value === "OTHER_CUSTOM") {
                              setIsCustomChannel(true);
                              setEditCanalIngreso("");
                            } else {
                              setIsCustomChannel(false);
                              setEditCanalIngreso(e.target.value);
                            }
                          }}
                          className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none cursor-pointer font-medium"
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

                        {(isCustomChannel || (!existingChannels.includes(editCanalIngreso) && editCanalIngreso !== "")) && (
                          <input
                            type="text"
                            value={editCanalIngreso}
                            onChange={(e) => setEditCanalIngreso(e.target.value)}
                            placeholder="Escribe la vía de sourcing (ej: Headhunting, LinkedIn...)..."
                            className="bg-[#101415] border border-[#6bd8cb]/40 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none mt-1"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-xs">
                        {cand.canal_ingreso ? (
                          <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-md bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb]">
                            {cand.canal_ingreso}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-white/40 italic">
                            No especificado
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Contacto</span>
                    <div className="flex items-center gap-2 text-xs text-[#879391]">
                      <Phone className="w-3.5 h-3.5 text-[#6bd8cb]" />
                      <span>{cand.contactNumber}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#879391] mt-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#c4c1fb]" />
                      <span className="truncate">{cand.email}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Última actividad</span>
                    <div className="flex items-center gap-1.5 text-xs text-[#879391]">
                      <Clock className="w-3.5 h-3.5 text-amber-400/70" />
                      <span>{cand.lastActivity}</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Entrada al WIP</span>
                    <p className="text-xs text-[#879391]">{new Date(cand.entryDate).toLocaleString("es-ES")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Smart Scorecard de Transcripción de Screening IA */}
            <InformeScreeningCard
              informe={informeEntrevistaIA}
              onEditClick={() => setIsTranscripcionModalOpen(true)}
              onReanalyzeClick={() => setIsTranscripcionModalOpen(true)}
            />

            {/* Smart Scorecard de Test de Personalidad IA (Cognitive Fit Vision - V3) */}
            <TestPersonalidadCard
              pipelineId={cand.pipeId || cand.id}
              testPersonalidad={testPersonalidad}
              onReanalyzeClick={() => setIsTestModalOpen(true)}
              onSaveComplete={(updated) => {
                setTestPersonalidad(updated);
                loadCandidateData();
              }}
            />

            {/* Tarjeta de Assessment Técnico Manual (Registro Manual y Trazabilidad en F2) */}
            <AssessmentManualCard
              pipelineId={cand.pipeId || cand.id}
              assessmentManual={assessmentManual}
              onSaveComplete={(updated) => {
                setAssessmentManual(updated);
                loadCandidateData();
              }}
            />

            {/* Sección de Agendamiento Dinámico de Reuniones */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 text-left space-y-5">
              {(() => {
                const rawMeetings: Reunion[] = (activePipelineItem?.f1_descubrimiento?.reuniones || cand?.reuniones) || [];
                const sortedMeetings = [...rawMeetings].sort((a, b) => {
                  const timeA = a.fecha_hora ? new Date(a.fecha_hora).getTime() : 0;
                  const timeB = b.fecha_hora ? new Date(b.fecha_hora).getTime() : 0;
                  return timeB - timeA;
                });

                return (
                  <>
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-white/5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb]">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                            <span>Reuniones</span>
                            <span className="text-[10px] bg-white/10 text-[#6bd8cb] px-2 py-0.5 rounded-full font-mono font-bold">
                              {sortedMeetings.length}
                            </span>
                          </h3>
                          <p className="text-[10px] text-[#879391] mt-0.5">
                            Agendamiento e historial de entrevistas del expediente
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={handleOpenCreateMeeting}
                        className="px-3.5 py-2 rounded-xl bg-[#6bd8cb] hover:bg-[#6bd8cb]/90 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer self-start sm:self-auto"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Nueva Reunión</span>
                      </button>
                    </div>

                    {/* Lista de Reuniones ordenadas por fecha descendente */}
                    {sortedMeetings.length === 0 ? (
                      <div className="p-6 text-center border border-dashed border-white/10 rounded-2xl space-y-2">
                        <Calendar className="w-8 h-8 text-[#879391]/50 mx-auto" />
                        <p className="text-xs text-[#879391]">No hay reuniones agendadas.</p>
                        <button
                          onClick={handleOpenCreateMeeting}
                          className="text-xs font-bold text-[#6bd8cb] hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Agendar la primera reunión
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {sortedMeetings.map((meeting) => (
                          <div 
                            key={meeting.id_reunion}
                            className="p-4 rounded-2xl bg-stone-950/45 border border-white/10 hover:border-[#6bd8cb]/30 transition-all space-y-3"
                          >
                            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-white/5 pb-2.5">
                              <div className="space-y-0.5">
                                <h4 className="text-xs font-bold text-white flex items-center gap-2 flex-wrap">
                                  <span className="inline-block text-[9.5px] font-bold font-mono px-2 py-0.5 rounded-md bg-[#6bd8cb]/10 border border-[#6bd8cb]/25 text-[#6bd8cb] uppercase tracking-wider">
                                    {meeting.fase || "F2 - Evaluación"}
                                  </span>
                                  <span>{meeting.objetivo || "Reunión de Evaluación"}</span>
                                </h4>
                                <div className="flex items-center gap-2 text-[11px] text-[#6bd8cb] font-mono">
                                  <Clock className="w-3.5 h-3.5 text-[#6bd8cb]" />
                                  <span>
                                    {meeting.fecha_hora 
                                      ? new Date(meeting.fecha_hora).toLocaleString("es-ES", {
                                          dateStyle: "full",
                                          timeStyle: "short"
                                        })
                                      : "Sin fecha definida"}
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button
                                  onClick={() => handleOpenEditMeeting(meeting)}
                                  className="px-2.5 py-1.5 rounded-lg border border-white/10 hover:border-[#6bd8cb]/40 bg-white/5 hover:bg-[#6bd8cb]/10 text-white/80 hover:text-[#6bd8cb] text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                                  title="Modificar datos de la reunión"
                                >
                                  <Edit2 className="w-3.5 h-3.5 text-[#6bd8cb]" />
                                  <span>Modificar</span>
                                </button>
                                <button
                                  onClick={() => setDeletingMeetingId(meeting.id_reunion)}
                                  className="p-1.5 rounded-lg border border-white/10 hover:border-rose-500/40 bg-white/5 hover:bg-rose-500/10 text-white/70 hover:text-rose-400 transition-all cursor-pointer"
                                  title="Eliminar reunión"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>

                            {meeting.link_reunion && (
                              <div className="flex items-center gap-2">
                                <a
                                  href={meeting.link_reunion.startsWith("http") ? meeting.link_reunion : `https://${meeting.link_reunion}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/20 text-indigo-300 text-xs font-bold transition-all inline-flex items-center gap-1.5"
                                >
                                  <Video className="w-3.5 h-3.5 text-indigo-400" />
                                  <span className="truncate max-w-xs">{meeting.link_reunion}</span>
                                  <ExternalLink className="w-3 h-3 ml-0.5 shrink-0" />
                                </a>
                              </div>
                            )}

                            {meeting.notas && (
                              <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 text-xs text-[#879391] leading-relaxed">
                                <span className="text-[10px] uppercase font-bold text-white/40 block mb-0.5">Notas de la sesión:</span>
                                <p className="whitespace-pre-wrap">{meeting.notas}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* ── Trazabilidad de Notas del Pipeline (Invertido: F2 arriba -> F1 centro -> Postulante abajo) ── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-6 text-left relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 pb-4 gap-3">
                <div>
                  <span className="text-[9px] font-mono text-[#6bd8cb] bg-[#6bd8cb]/10 px-2.5 py-0.5 rounded border border-[#6bd8cb]/20 uppercase font-bold tracking-widest inline-block mb-1">
                    TRAZABILIDAD DE RECLUTAMIENTO
                  </span>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#6bd8cb]" />
                    <span>Historial y Trazabilidad de Notas del Candidato</span>
                  </h3>
                </div>

                {/* Global Edit Button covering all notes */}
                <div>
                  {!isEditingNotes ? (
                    <button
                      onClick={() => setIsEditingNotes(true)}
                      className="px-4 py-2 rounded-xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/15 text-[#6bd8cb] hover:bg-[#6bd8cb] hover:text-[#101415] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-[#6bd8cb]/10"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar Historial de Notas</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={handleSaveNotes}
                        disabled={isSavingNotes}
                        className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6bd8cb] to-[#0d9488] text-[#101415] hover:opacity-90 text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-[#6bd8cb]/20 disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>{isSavingNotes ? "Guardando..." : "Guardar Todos los Cambios"}</span>
                      </button>
                      <button
                        onClick={() => {
                          setEditInitialNotes(cand.initialNotes || "");
                          setEditF1Notes(cand.f1Notes || "");
                          setEditF2Notes(cand.f2Notes || "");
                          setIsEditingNotes(false);
                        }}
                        className="px-3.5 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>Cancelar</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="relative pl-6 md:pl-8 space-y-6 border-l-2 border-white/10 ml-2 md:ml-3 pt-1 pb-1">

                {/* ── 01 (ARRIBA). FASE 2: EVALUACIÓN INTERNA (MÓDULO ACTUAL) ── */}
                <div className="relative space-y-2">
                  {/* Step Node Icon */}
                  <div className="absolute -left-[31px] md:-left-[39px] top-0 w-7 h-7 rounded-full bg-[#15181a] border-2 border-[#6bd8cb] text-[#6bd8cb] flex items-center justify-center text-[10px] font-mono font-bold shadow-md shadow-[#6bd8cb]/20">
                    01
                  </div>

                  <div className="p-4 rounded-2xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6bd8cb]/15 pb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-[#6bd8cb]" />
                        <span className="text-xs font-bold text-[#6bd8cb] uppercase tracking-wider">
                          Fase 2: Evaluación Interna (Módulo Actual)
                        </span>
                      </div>
                      <span className="text-[9.5px] font-mono text-[#6bd8cb]/80 bg-[#6bd8cb]/10 px-2 py-0.5 rounded border border-[#6bd8cb]/20">
                        campo: f2_evaluacion.notas_reclutador
                      </span>
                    </div>

                    {isEditingNotes ? (
                      <textarea
                        value={editF2Notes}
                        onChange={e => setEditF2Notes(e.target.value)}
                        rows={3}
                        placeholder="Escribe las notas de evaluación técnica y screening de esta fase..."
                        className="w-full bg-[#101415]/90 border border-[#6bd8cb]/50 p-3.5 text-xs rounded-xl text-white placeholder-[#879391] focus:border-[#6bd8cb] focus:outline-none resize-none leading-relaxed"
                      />
                    ) : (
                      <div className="p-3.5 bg-black/40 border border-[#6bd8cb]/20 rounded-xl text-xs text-white leading-relaxed font-medium">
                        {cand.f2Notes ? (
                          cand.f2Notes
                        ) : (
                          <span className="italic text-[#879391]">Sin notas de evaluación asignadas para esta fase. Usa "Editar Historial de Notas" para agregar anotaciones.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 02 (CENTRO). FASE 1: DESCUBRIMIENTO & SOURCING ── */}
                <div className="relative space-y-2">
                  {/* Step Node Icon */}
                  <div className="absolute -left-[31px] md:-left-[39px] top-0 w-7 h-7 rounded-full bg-[#15181a] border-2 border-[#c4c1fb]/40 text-[#c4c1fb] flex items-center justify-center text-[10px] font-mono font-bold shadow-md">
                    02
                  </div>

                  <div className="p-4 rounded-2xl border border-[#c4c1fb]/25 bg-[#c4c1fb]/5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#c4c1fb]/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Compass className="w-3.5 h-3.5 text-[#c4c1fb]" />
                        <span className="text-xs font-bold text-[#c4c1fb] uppercase tracking-wider">
                          Fase 1: Descubrimiento & Sourcing
                        </span>
                      </div>
                      <span className="text-[9.5px] font-mono text-[#c4c1fb]/70 bg-[#c4c1fb]/10 px-2 py-0.5 rounded border border-[#c4c1fb]/20">
                        campo: f1_descubrimiento.notas_reclutador
                      </span>
                    </div>

                    {isEditingNotes ? (
                      <textarea
                        value={editF1Notes}
                        onChange={e => setEditF1Notes(e.target.value)}
                        rows={3}
                        placeholder="Escribe las notas de sourcing y filtro inicial de Fase 1..."
                        className="w-full bg-[#101415]/90 border border-[#c4c1fb]/40 p-3.5 text-xs rounded-xl text-white placeholder-[#879391] focus:border-[#c4c1fb] focus:outline-none resize-none leading-relaxed"
                      />
                    ) : (
                      <div className="p-3.5 bg-black/40 border border-[#c4c1fb]/15 rounded-xl text-xs text-white leading-relaxed">
                        {cand.f1Notes ? (
                          cand.f1Notes
                        ) : (
                          <span className="italic text-[#879391]">Sin notas registradas durante la Fase 1.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 03 (ABAJO). NOTAS INICIALES DEL POSTULANTE ── */}
                <div className="relative space-y-2">
                  {/* Step Node Icon */}
                  <div className="absolute -left-[31px] md:-left-[39px] top-0 w-7 h-7 rounded-full bg-[#15181a] border-2 border-white/20 text-white/60 flex items-center justify-center text-[10px] font-mono font-bold shadow-md">
                    03
                  </div>

                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2">
                      <div className="flex items-center gap-2">
                        <UserCheck className="w-3.5 h-3.5 text-white/70" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Notas Iniciales del Postulante
                        </span>
                      </div>
                      <span className="text-[9.5px] font-mono text-[#879391] bg-white/5 px-2 py-0.5 rounded border border-white/5">
                        campo: postulantes.notas_iniciales
                      </span>
                    </div>

                    {isEditingNotes ? (
                      <textarea
                        value={editInitialNotes}
                        onChange={e => setEditInitialNotes(e.target.value)}
                        rows={3}
                        placeholder="Escribe las notas iniciales del postulante..."
                        className="w-full bg-[#101415]/90 border border-white/20 p-3.5 text-xs rounded-xl text-white placeholder-[#879391] focus:border-white focus:outline-none resize-none leading-relaxed"
                      />
                    ) : (
                      <div className="p-3.5 bg-black/40 border border-white/5 rounded-xl text-xs text-white/90 leading-relaxed italic">
                        {cand.initialNotes ? (
                          cand.initialNotes
                        ) : (
                          <span className="text-white/30 not-italic">Sin notas iniciales registradas en el perfil del postulante.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* ── Diagnostic Tools Tabs ── */}
            <div className="glass-panel rounded-3xl border border-white/10 overflow-hidden">
              {/* Tab header */}
              <div className="px-6 py-3 border-b border-white/10 bg-[#101415]/60">
                <div className="flex items-center gap-2 mb-3">
                  <Cpu className="w-4 h-4 text-[#c4c1fb] animate-pulse" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Herramientas de Diagnóstico IA — F2</span>
                </div>
                <nav className="flex items-center overflow-x-auto gap-1 select-none">
                  {([
                    { key: "sintetizador", icon: <FileText className="w-3.5 h-3.5" />, label: "5. Sintetizador" },
                    { key: "inconsistencias", icon: <AlertTriangle className="w-3.5 h-3.5 text-[#ffb4ab]" />, label: "6. Detector Crono" },
                    { key: "preguntas", icon: <Zap className="w-3.5 h-3.5" />, label: "7. Preguntas STAR" },
                    { key: "validador", icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />, label: "8. Validador ID" },
                    { key: "copilot", icon: <Code className="w-3.5 h-3.5 text-[#6bd8cb]" />, label: "Co-Pilot" }
                  ] as { key: DiagTab; icon: React.ReactNode; label: string }[]).map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                        activeTab === tab.key
                          ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30"
                          : "text-[#879391] hover:text-white"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab body */}
              <div className="p-6 space-y-5">

                {/* 5. Sintetizador */}
                {activeTab === "sintetizador" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="p-4 rounded-xl border border-white/5 bg-[#6bd8cb]/5 text-xs text-white/90">
                      <span className="font-bold text-[#6bd8cb]">Sintetizador de Entrevistas</span>
                      <p className="mt-0.5 text-[#879391] leading-relaxed">
                        Cruza el manuscrito de la llamada del reclutador con los requerimientos vacantes de la búsqueda.
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.02] space-y-2">
                        <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Puntos Fuertes (Pros)</span>
                        <ul className="list-disc pl-4 text-xs space-y-1 text-white/80">
                          {cand.toolsDetails.sintetizador.pros.map((pro, i) => <li key={i}>{pro}</li>)}
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.02] space-y-2">
                        <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">Déficit o Brechas (Cons)</span>
                        <ul className="list-disc pl-4 text-xs space-y-1 text-white/80">
                          {cand.toolsDetails.sintetizador.contras.map((c, i) => <li key={i}>{c}</li>)}
                        </ul>
                      </div>
                      <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/[0.02] space-y-2">
                        <span className="text-xs text-rose-400 font-bold uppercase tracking-wider block">Señales de Alerta (Riesgos)</span>
                        <ul className="list-disc pl-4 text-xs space-y-1 text-white/80">
                          {cand.toolsDetails.sintetizador.riesgos.map((r, i) => <li key={i}>{r}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. Detector Crono */}
                {activeTab === "inconsistencias" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="p-4 rounded-xl border border-white/5 bg-rose-950/20 text-xs text-white/90">
                      <span className="font-bold text-rose-400">Detector de Inconsistencias Cronológicas</span>
                      <p className="mt-0.5 text-[#879391]">
                        Analiza secuencias temporales en la hoja de vida para alertar sobre huecos desocupados o solapamientos.
                      </p>
                    </div>
                    <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center flex flex-col items-center gap-2">
                      <Check className="w-8 h-8 text-emerald-400" />
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Línea temporal impecable</span>
                      <p className="text-xs text-[#879391]">No se detectaron brechas sin justificar en su trayectoria profesional.</p>
                    </div>
                  </div>
                )}

                {/* 7. Preguntas STAR */}
                {activeTab === "preguntas" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="p-4 rounded-xl border border-white/5 bg-[#6bd8cb]/5 text-xs text-white/90">
                      <span className="font-bold text-[#6bd8cb]">Generador de Preguntas Técnicas STAR</span>
                      <p className="mt-0.5 text-[#879391]">
                        Preguntas de comportamiento y código personalizadas según el stack funcional de la vacante.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {cand.toolsDetails.preguntas.map((q, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                          <div className="flex gap-3 items-start">
                            <span className="w-5 h-5 rounded bg-[#c4c1fb] text-[#101415] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="text-xs text-white leading-relaxed flex-grow font-semibold">{q}</span>
                          </div>
                          <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                            <button
                              onClick={() => handleCopyText(q, `q-${idx}`)}
                              className="text-[10px] text-[#6bd8cb] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>{copiedTextType === `q-${idx}` ? "¡Copiado!" : "Copiar plantilla"}</span>
                            </button>
                            <span className="text-[9px] uppercase tracking-wider font-bold text-[#c4c1fb]">Método STAR</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 8. Validador */}
                {activeTab === "validador" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="p-4 rounded-xl border border-white/5 bg-[#6bd8cb]/5 text-xs text-white/90">
                      <span className="font-bold text-[#6bd8cb]">Validador de Identidad y Entorno</span>
                      <p className="mt-0.5 text-[#879391]">
                        Chequeo por IP, geolocalización latente y verificación de entorno de test sin proxies sospechosos.
                      </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1">
                        <span className="text-[9px] text-[#879391] uppercase font-bold tracking-wider block">Dirección IP Escaneada</span>
                        <code className="text-xs font-mono text-[#6bd8cb] block">{cand.toolsDetails.validador.ip}</code>
                      </div>
                      <div className="p-4 rounded-xl bg-black/30 border border-white/5 space-y-1">
                        <span className="text-[9px] text-[#879391] uppercase font-bold tracking-wider block">Geolocalización declarada</span>
                        <code className="text-xs font-mono text-[#c4c1fb] block">{cand.toolsDetails.validador.location}</code>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-bold ${
                      cand.toolsDetails.validador.verificationStatus === "success"
                        ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-400"
                        : "border-rose-500/20 bg-rose-500/5 text-rose-400"
                    }`}>
                      <ShieldCheck className="w-5 h-5 shrink-0" />
                      <div>
                        <span className="block">
                          {cand.toolsDetails.validador.verificationStatus === "success"
                            ? "VERIFICADO — ENTORNO ÍNTEGRO"
                            : "ALERTA — POSIBLE FRAUDE DETECTADO"}
                        </span>
                        <p className="font-normal text-[#879391] leading-relaxed mt-0.5">{cand.toolsDetails.validador.envStatus}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Co-Pilot */}
                {activeTab === "copilot" && (
                  <div className="space-y-5 animate-fadeIn">
                    <div className="p-4 rounded-xl border border-white/5 bg-indigo-950/20 text-xs text-white/90">
                      <span className="font-bold text-[#c4c1fb]">Entorno de Pair-Programming Adaptativo (AI Co-Pilot)</span>
                      <p className="mt-0.5 text-[#879391]">Colaboración en vivo de código asistida por IA y telemetría de esfuerzo técnico.</p>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                        <span className="text-[9px] text-[#879391] uppercase tracking-wider font-bold block">Nivel Dificultad</span>
                        <span className="text-base font-bold text-white block mt-1">{cand.toolsDetails.copilot.difficultyLevel}</span>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                        <span className="text-[9px] text-[#879391] uppercase tracking-wider font-bold block">Tasa Completación</span>
                        <span className="text-base font-bold text-[#6bd8cb] block mt-1">{cand.toolsDetails.copilot.completionRate}%</span>
                      </div>
                      <div className="p-4 rounded-xl bg-white/[0.01] border border-white/5">
                        <span className="text-[9px] text-[#879391] uppercase tracking-wider font-bold block">Esfuerzo Estimado</span>
                        <span className="text-base font-bold text-[#c4c1fb] block mt-1">{cand.toolsDetails.copilot.effortScore} / 5 pts</span>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl border border-white/5 bg-[#15181a]">
                      <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold block mb-1">Comentario del Evaluador Co-Pilot</span>
                      <p className="text-xs text-[#879391] leading-relaxed italic">
                        &quot;{cand.toolsDetails.copilot.summary}&quot;
                      </p>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* ══════════════════════════════════
              SIDEBAR (col-span-1)
          ══════════════════════════════════ */}
          <div className="space-y-6">

            {/* ── Acciones F2 ── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5 text-left">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">
                Acciones del Pipeline F2
              </h3>

              {/* Cambio de Estado */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#879391] block">Cambio de Estado Interno</span>
                <div className="space-y-2">
                  <button
                    onClick={() => handleTransitionState("05_screening")}
                    disabled={cand.currentPhase === "05_screening"}
                    className="w-full py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 hover:text-white transition-all text-xs font-bold text-amber-400 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>05 - Screening</span>
                  </button>
                  <button
                    onClick={() => handleTransitionState("06_assessment")}
                    disabled={cand.currentPhase === "06_assessment"}
                    className="w-full py-2.5 rounded-xl border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 hover:bg-[#6bd8cb]/15 hover:text-white transition-all text-xs font-bold text-[#6bd8cb] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>06 - Assessment</span>
                  </button>
                  <button
                    onClick={() => handleTransitionState("07_en_duda_evaluacion")}
                    disabled={cand.currentPhase === "07_en_duda_evaluacion"}
                    className="w-full py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 hover:text-white transition-all text-xs font-bold text-amber-500 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <HelpCircle className="w-4 h-4" />
                    <span>07 - En Duda</span>
                  </button>
                  <button
                    onClick={() => handleTransitionState("08_descartado_interno")}
                    disabled={cand.currentPhase === "08_descartado_interno"}
                    className="w-full py-2.5 rounded-xl border border-rose-500/20 bg-rose-500/5 hover:bg-rose-500/15 hover:text-white transition-all text-xs font-bold text-rose-400 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Ban className="w-4 h-4" />
                    <span>08 - Descartar</span>
                  </button>
                </div>
              </div>

              {/* Avanzar Fase */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#879391] block">Avance de Fase</span>
                <button
                  onClick={() => setIsAdvanceModalOpen(true)}
                  className="w-full py-2.5 rounded-xl border border-emerald-500/25 bg-emerald-500/5 hover:bg-emerald-500 hover:text-stone-950 transition-all text-xs font-black text-emerald-400 flex items-center justify-center gap-2 cursor-pointer shadow shadow-emerald-500/5"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Avanzar a Fase 3 (Cliente)</span>
                </button>
              </div>
            </div>

            {/* ── Datos del Pipeline ── */}
            {activePipelineItem && (
              <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-4 text-left">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">
                  Trazabilidad del Pipeline
                </h3>

                <div className="space-y-2 text-xs">
                  <div className="space-y-1 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block">ID Pipeline</span>
                    <span className="font-mono text-white/80 select-all text-[10px]">{activePipelineItem.id}</span>
                  </div>
                  <div className="space-y-1 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block">ID Búsqueda</span>
                    <span className="font-mono text-white/80 select-all text-[10px]">
                      {cand?.busqObj?.codigo_busqueda 
                        ? `${cand.busqObj.codigo_busqueda} (${activePipelineItem.claves_conexion.id_busqueda})` 
                        : activePipelineItem.claves_conexion.id_busqueda}
                    </span>
                  </div>
                  <div className="space-y-1 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block">Estado en Pipeline</span>
                    <span className="text-[#c4c1fb] font-bold block mt-0.5">{activePipelineItem.flujo.estado_actual}</span>
                  </div>
                  <div className="space-y-1 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block">Última Modificación</span>
                    <span className="text-white/80 block mt-0.5 text-[10px]">
                      {activePipelineItem.flujo.fecha_ultimo_cambio
                        ? new Date(activePipelineItem.flujo.fecha_ultimo_cambio).toLocaleString()
                        : "No especificado"}
                    </span>
                  </div>
                </div>

                {/* Historial SLA */}
                {activePipelineItem.flujo.historial_estados && activePipelineItem.flujo.historial_estados.length > 0 ? (
                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">
                      Historial y Trazabilidad de Estados (SLA)
                    </span>
                    <div className="relative pl-6 border-l border-white/10 space-y-5 ml-2 pt-1 pb-1">
                      {activePipelineItem.flujo.historial_estados.map((entry, idx) => (
                        <div key={idx} className="relative space-y-1">
                          <div className={`absolute -left-[29.5px] top-1 w-2.5 h-2.5 rounded-full border border-[#101415] shadow-sm ${
                            idx === 0 ? "bg-[#c4c1fb] ring-4 ring-[#c4c1fb]/20" : "bg-[#879391]"
                          }`} />
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                            <span className={`text-xs font-bold ${idx === 0 ? "text-white" : "text-white/60"}`}>
                              {entry.estado}
                            </span>
                            <span className="text-[10px] text-[#879391] font-mono">
                              {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : "N/A"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[11px] text-[#879391] italic">
                      No se registra historial previo de transiciones para esta postulación.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Score visual ── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 text-center space-y-3">
              <span className="text-[10px] uppercase tracking-wider font-bold text-white/30 block">Fit Score F2</span>
              <div className="relative inline-flex items-center justify-center w-24 h-24 mx-auto">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
                  <circle cx="48" cy="48" r="40" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                  <circle
                    cx="48" cy="48" r="40"
                    fill="none"
                    stroke="#6bd8cb"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 40}`}
                    strokeDashoffset={`${2 * Math.PI * 40 * (1 - cand.score / 100)}`}
                    className="transition-all duration-700"
                  />
                </svg>
                <span className="absolute text-xl font-black text-[#6bd8cb] font-mono">{cand.score}%</span>
              </div>
              <div className="flex items-center justify-center gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-3.5 h-3.5 ${i < Math.round(cand.score / 20) ? "text-amber-400 fill-amber-400" : "text-white/10"}`}
                  />
                ))}
              </div>
              <p className="text-[10px] text-[#879391]">
                {cand.score >= 85 ? "Candidato destacado — alta prioridad" : cand.score >= 70 ? "Candidato apto — seguimiento recomendado" : "Candidato en evaluación"}
              </p>
            </div>

          </div>
        </div>
      </div>

      {/* ── Modal: Confirmar Avance a Fase 3 ── */}
      {isAdvanceModalOpen && cand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fadeIn">
          <div
            className="relative w-full max-w-md bg-[#15181a] border border-[#6bd8cb]/30 rounded-3xl p-6 shadow-2xl space-y-5 text-left animate-scaleUp"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-start">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#6bd8cb]/20 to-[#0d9488]/30 border border-[#6bd8cb]/40 flex items-center justify-center text-[#6bd8cb] shadow-lg shadow-[#6bd8cb]/10">
                <UserCheck className="w-6 h-6" />
              </div>
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
                className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-[#6bd8cb] uppercase tracking-wider bg-[#6bd8cb]/10 px-2.5 py-0.5 rounded-full border border-[#6bd8cb]/20 inline-block">
                Promoción de Pipeline
              </span>
              <h3 className="text-lg font-extrabold text-white tracking-tight">
                ¿Avanzar a Fase 3 (Presentación al Cliente)?
              </h3>
              <p className="text-xs text-[#879391] leading-relaxed">
                Estás a punto de promocionar el expediente de <strong className="text-white">{cand.name}</strong> a <strong className="text-[#6bd8cb]">Fase 3 (Cliente / Presentación)</strong>.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">{cand.name}</span>
                <span className="text-[10px] text-[#879391]">{cand.role} • {cand.client}</span>
              </div>
              <span className="px-2.5 py-1 text-[9px] font-bold rounded-full bg-[#6bd8cb]/15 text-[#6bd8cb] border border-[#6bd8cb]/30 font-mono">
                Fit {cand.score}%
              </span>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
              <button
                onClick={() => setIsAdvanceModalOpen(false)}
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

      {/* --- MODAL CREAR / EDITAR REUNIÓN --- */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-[#101415]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 p-6 space-y-5 text-left shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#6bd8cb]" />
                <span>{editingMeeting ? "Editar Reunión" : "Nueva Reunión"}</span>
              </h3>
              <button
                onClick={() => setIsMeetingModalOpen(false)}
                className="text-white/40 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Fecha y Hora */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#879391] block">
                  Fecha y Hora <span className="text-rose-400">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={meetingForm.fecha_hora}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, fecha_hora: e.target.value }))}
                  className="w-full bg-[#15181a] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb]"
                />
              </div>

              {/* Objetivo */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#879391] block">
                  Objetivo de la Reunión <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ej: Evaluación Técnica y Live Coding"
                  value={meetingForm.objetivo}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, objetivo: e.target.value }))}
                  className="w-full bg-[#15181a] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb]"
                />
              </div>

              {/* Link de la reunión */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#879391] block flex items-center gap-1">
                  <Video className="w-3 h-3 text-[#6bd8cb]" />
                  Enlace de la Reunión (Google Meet, Teams, Zoom, etc.)
                </label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/abc-defg-hij"
                  value={meetingForm.link_reunion}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, link_reunion: e.target.value }))}
                  className="w-full bg-[#15181a] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb]"
                />
              </div>

              {/* Notas */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold text-[#879391] block">
                  Notas u Observaciones
                </label>
                <textarea
                  rows={3}
                  placeholder="Escribe aquí anotaciones relevantes acordadas en la sesión..."
                  value={meetingForm.notas}
                  onChange={(e) => setMeetingForm(prev => ({ ...prev, notas: e.target.value }))}
                  className="w-full bg-[#15181a] border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb] resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
              <button
                onClick={() => setIsMeetingModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5 text-[#879391] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveMeeting}
                disabled={savingMeeting}
                className="px-4 py-2 rounded-xl bg-[#6bd8cb] hover:bg-[#6bd8cb]/90 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingMeeting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>{savingMeeting ? "Guardando..." : (editingMeeting ? "Guardar Cambios" : "Crear Reunión")}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMACIÓN DE ELIMINACIÓN DE REUNIÓN --- */}
      {deletingMeetingId && (
        <div className="fixed inset-0 bg-[#101415]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl overflow-hidden border border-rose-500/20 p-6 space-y-4 text-left shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-white/5">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider text-rose-400">
                  Eliminar Reunión
                </h3>
                <p className="text-[10px] text-[#879391] mt-0.5">
                  Fase 2 • Evaluación
                </p>
              </div>
            </div>

            <p className="text-xs text-[#e0e3e5] leading-relaxed">
              ¿Estás seguro de que deseas eliminar esta reunión? Esta acción actualizará el expediente.
            </p>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setDeletingMeetingId(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5 text-[#879391] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteMeetingAction}
                disabled={savingMeeting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {savingMeeting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{savingMeeting ? "Eliminando..." : "Eliminar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Modal: Analizar Transcripción de Screening IA */}
      <AnalizarTranscripcionModal
        isOpen={isTranscripcionModalOpen}
        onClose={() => setIsTranscripcionModalOpen(false)}
        pipelineId={cand.pipeId || id}
        candidateName={cand.name}
        currentState={cand.currentPhase}
        initialInforme={informeEntrevistaIA}
        onSuccess={(nuevoInforme) => {
          setInformeEntrevistaIA(nuevoInforme);
          if (activePipelineItem) {
            setActivePipelineItem({
              ...activePipelineItem,
              f2_evaluacion: {
                ...activePipelineItem.f2_evaluacion,
                informe_entrevista_ia: nuevoInforme
              }
            });
          }
        }}
      />

      {/* Modal: Analizar Test de Personalidad IA (Cognitive Fit Vision - V3) */}
      <AnalizarTestPersonalidadModal
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        pipelineId={cand.pipeId || id}
        candidateName={cand.name}
        onAnalysisComplete={(nuevoTestData) => {
          setTestPersonalidad(nuevoTestData);
          loadCandidateData();
        }}
      />

      {/* Modal: Generar Ficha Técnica a PDF (Dossier Presentación a Cliente) */}
      <GenerarFichaPdfModal
        isOpen={isFichaPdfModalOpen}
        onClose={() => setIsFichaPdfModalOpen(false)}
        pipelineId={cand.pipeId || id}
        candidateName={cand.name}
        roleName={cand.role}
      />
    </main>
  );
}
