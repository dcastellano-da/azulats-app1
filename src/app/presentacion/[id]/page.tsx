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
  Calendar,
  Sparkles,
  Share2,
  Plus,
  Trash2,
  Video,
  ExternalLink,
  HelpCircle,
  Download
} from "lucide-react";

// Backend API Actions
import { getBusquedasAPI, Busqueda } from "@/actions/busquedas";
import { getCandidatosAPI, actualizarCandidatoAPI, Candidato } from "@/actions/candidatos";
import { getPipelineAPI, PipelineItem, actualizarPipelineAPI, Reunion } from "@/actions/pipeline";
import { 
  PresentacionCandidate 
} from "@/lib/presentacion";
import GenerarFichaPdfModal from "@/app/components/GenerarFichaPdfModal";
import ScreeningAccordionSection from "@/app/components/ScreeningAccordionSection";
import type { CriterioScreening } from "@/types/screening";

export default function PresentacionDetallePage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const id = Array.isArray(params?.id) ? params.id[0] : params?.id as string;

  const [cand, setCand] = useState<PresentacionCandidate | null>(null);
  const [activePipelineItem, setActivePipelineItem] = useState<PipelineItem | null>(null);
  const [criteriosBusqueda, setCriteriosBusqueda] = useState<CriterioScreening[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [isFichaPdfModalOpen, setIsFichaPdfModalOpen] = useState(false);

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

  // Phase 4 Advance Modal State
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

  const [editCanalIngreso, setEditCanalIngreso] = useState("");
  const [existingChannels, setExistingChannels] = useState<string[]>([
    "Headhunting",
    "LinkedIn",
    "Referido",
    "InfoJob",
    "Otros"
  ]);
  const [isCustomChannel, setIsCustomChannel] = useState(false);

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
          canal_ingreso: cObj?.canal_ingreso || null,
          reuniones: targetPipe?.f1_descubrimiento?.reuniones || []
        };

        setCand(item);
        setActivePipelineItem(targetPipe || null);
        if (bObj?.criterios_screening) setCriteriosBusqueda(bObj.criterios_screening);
        setEditInitialNotes(initialNotes);
        setEditF1Notes(f1Notes);
        setEditF2Notes(f2Notes);
        setEditF3Notes(f3Notes);
        setEditCanalIngreso(cObj?.canal_ingreso || "");
        setIsCustomChannel(false);
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
        recruiterNotes: editF3Notes.trim(),
        canal_ingreso: editCanalIngreso.trim() || null
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
                fase: m.fase || "F3 - Presentación"
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
          fase: "F3 - Presentación"
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

  const getPhaseLabel = (phase: PresentacionCandidate["currentPhase"]) => {
    switch (phase) {
      case "09_shortlist": return "09 - Shortlist";
      case "10_entrevista_cliente": return "10 - Entrevista Cliente";
      case "11_standby": return "11 - Stand-by";
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
    <main className="min-h-screen bg-[#101415] text-[#e0e3e5] px-4 md:px-8 py-6 selection:bg-[#c4c1fb] selection:text-stone-900">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#161a1b] border border-amber-500/30 text-amber-300 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">

        {/* ── Breadcrumb Navigation ── */}
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <Link
            href="/presentacion"
            className="flex items-center gap-2 text-xs font-bold text-[#879391] hover:text-[#c4c1fb] transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver a F3 Presentación</span>
          </Link>

          <div className="flex items-center gap-2">
            <span title="ID de vista para prompts de desarrollo" className="text-[9px] font-mono text-[#6bd8cb]/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-all cursor-help uppercase tracking-wider font-semibold">
              ID: P-PRE-02
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
              Fase 3: Calibración Final
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
                    {cand.id} • F3 Presentación al Cliente
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
                                    {meeting.fase || "F3 - Presentación"}
                                  </span>
                                  <span>{meeting.objetivo || "Reunión de Presentación"}</span>
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

            {/* ── Trazabilidad de Notas del Pipeline (Invertido: F3 arriba -> F2 -> F1 -> Origen abajo) ── */}
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
                          setEditF3Notes(cand.f3Notes || "");
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

                {/* ── 01 (ARRIBA). FASE 3: PRESENTACIÓN AL CLIENTE (MÓDULO ACTUAL) ── */}
                <div className="relative space-y-2">
                  <div className="absolute -left-[31px] md:-left-[39px] top-0 w-7 h-7 rounded-full bg-[#15181a] border-2 border-amber-500 text-amber-400 flex items-center justify-center text-[10px] font-mono font-bold shadow-md shadow-amber-500/20">
                    01
                  </div>

                  <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber-500/15 pb-2">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                          Fase 3: Presentación al Cliente (Módulo Actual)
                        </span>
                      </div>
                      <span className="text-[9.5px] font-mono text-amber-400/80 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        campo: f3_presentacion.notas_reclutador
                      </span>
                    </div>

                    {isEditingNotes ? (
                      <textarea
                        value={editF3Notes}
                        onChange={e => setEditF3Notes(e.target.value)}
                        rows={3}
                        placeholder="Escribe las notas de calibración e interacción con el cliente en esta fase..."
                        className="w-full bg-[#101415]/90 border border-amber-500/50 p-3.5 text-xs rounded-xl text-white placeholder-[#879391] focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
                      />
                    ) : (
                      <div className="p-3.5 bg-black/40 border border-amber-500/20 rounded-xl text-xs text-white leading-relaxed font-medium">
                        {cand.f3Notes ? (
                          cand.f3Notes
                        ) : (
                          <span className="italic text-[#879391]">Sin notas de presentación asignadas para esta fase. Usa "Editar Historial de Notas" para agregar anotaciones.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 02 (CENTRO). FASE 2: EVALUACIÓN INTERNA ── */}
                <div className="relative space-y-2">
                  <div className="absolute -left-[31px] md:-left-[39px] top-0 w-7 h-7 rounded-full bg-[#15181a] border-2 border-[#6bd8cb]/40 text-[#6bd8cb] flex items-center justify-center text-[10px] font-mono font-bold shadow-md">
                    02
                  </div>

                  <div className="p-4 rounded-2xl border border-[#6bd8cb]/25 bg-[#6bd8cb]/5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#6bd8cb]/10 pb-2">
                      <div className="flex items-center gap-2">
                        <Cpu className="w-3.5 h-3.5 text-[#6bd8cb]" />
                        <span className="text-xs font-bold text-[#6bd8cb] uppercase tracking-wider">
                          Fase 2: Evaluación Interna
                        </span>
                      </div>
                      <span className="text-[9.5px] font-mono text-[#6bd8cb]/70 bg-[#6bd8cb]/10 px-2 py-0.5 rounded border border-[#6bd8cb]/20">
                        campo: f2_evaluacion.notas_reclutador
                      </span>
                    </div>

                    {isEditingNotes ? (
                      <textarea
                        value={editF2Notes}
                        onChange={e => setEditF2Notes(e.target.value)}
                        rows={3}
                        placeholder="Escribe las notas de evaluación técnica..."
                        className="w-full bg-[#101415]/90 border border-[#6bd8cb]/40 p-3.5 text-xs rounded-xl text-white placeholder-[#879391] focus:border-[#6bd8cb] focus:outline-none resize-none leading-relaxed"
                      />
                    ) : (
                      <div className="p-3.5 bg-black/40 border border-[#6bd8cb]/15 rounded-xl text-xs text-white leading-relaxed">
                        {cand.f2Notes ? (
                          cand.f2Notes
                        ) : (
                          <span className="italic text-[#879391]">Sin notas de evaluación registradas.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 03 (CENTRO). FASE 1: DESCUBRIMIENTO & SOURCING ── */}
                <div className="relative space-y-2">
                  <div className="absolute -left-[31px] md:-left-[39px] top-0 w-7 h-7 rounded-full bg-[#15181a] border-2 border-[#c4c1fb]/40 text-[#c4c1fb] flex items-center justify-center text-[10px] font-mono font-bold shadow-md">
                    03
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
                        placeholder="Escribe las notas de sourcing..."
                        className="w-full bg-[#101415]/90 border border-[#c4c1fb]/40 p-3.5 text-xs rounded-xl text-white placeholder-[#879391] focus:border-[#c4c1fb] focus:outline-none resize-none leading-relaxed"
                      />
                    ) : (
                      <div className="p-3.5 bg-black/40 border border-[#c4c1fb]/15 rounded-xl text-xs text-white leading-relaxed">
                        {cand.f1Notes ? (
                          cand.f1Notes
                        ) : (
                          <span className="italic text-[#879391]">Sin notas de descubrimiento registradas.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* ── 04 (ABAJO). NOTAS INICIALES DE ORIGEN ── */}
                <div className="relative space-y-2">
                  <div className="absolute -left-[31px] md:-left-[39px] top-0 w-7 h-7 rounded-full bg-[#15181a] border-2 border-white/20 text-white/60 flex items-center justify-center text-[10px] font-mono font-bold shadow-md">
                    04
                  </div>

                  <div className="p-4 rounded-2xl border border-white/10 bg-white/5 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <FileText className="w-3.5 h-3.5 text-white/60" />
                        <span className="text-xs font-bold text-white/80 uppercase tracking-wider">
                          Notas iniciales (Origen)
                        </span>
                      </div>
                      <span className="text-[9.5px] font-mono text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                        campo: candidatos.notas_iniciales
                      </span>
                    </div>

                    {isEditingNotes ? (
                      <textarea
                        value={editInitialNotes}
                        onChange={e => setEditInitialNotes(e.target.value)}
                        rows={3}
                        placeholder="Escribe las notas de origen del candidato..."
                        className="w-full bg-[#101415]/90 border border-white/20 p-3.5 text-xs rounded-xl text-white placeholder-[#879391] focus:border-white/50 focus:outline-none resize-none leading-relaxed"
                      />
                    ) : (
                      <div className="p-3.5 bg-black/40 border border-white/10 rounded-xl text-xs text-white/70 leading-relaxed font-sans">
                        {cand.initialNotes ? (
                          cand.initialNotes
                        ) : (
                          <span className="italic text-[#879391]">Sin anotaciones iniciales registradas.</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* ── Screening Inteligente IA (Fase 1) Desplegable ── */}
            {cand && (
              <ScreeningAccordionSection
                pipelineItem={activePipelineItem}
                criteriosBusqueda={criteriosBusqueda}
                candidateName={cand.name}
                busquedaName={cand.client}
                hasCv={Boolean(cand.url_cv)}
                onRefresh={loadCandidateData}
              />
            )}
          </div>

          {/* ══════════════════════════════════
              SIDEBAR (col-span-1)
          ══════════════════════════════════ */}
          <div className="space-y-6">

            {/* ── Acciones F3 ── */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5 text-left">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">
                Acciones del Pipeline F3
              </h3>

              {/* Cambio de Estado */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#879391] block">Cambio de Estado Interno</span>
                <div className="space-y-2">
                  <button
                    onClick={() => handleTransitionState("09_shortlist")}
                    disabled={cand.currentPhase === "09_shortlist"}
                    className="w-full py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 hover:text-white transition-all text-xs font-bold text-amber-400 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>09 - Shortlist</span>
                  </button>
                  <button
                    onClick={() => handleTransitionState("10_entrevista_cliente")}
                    disabled={cand.currentPhase === "10_entrevista_cliente"}
                    className="w-full py-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/15 hover:text-white transition-all text-xs font-bold text-emerald-400 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>10 - Entrevista Cliente</span>
                  </button>
                  <button
                    onClick={() => handleTransitionState("11_standby")}
                    disabled={cand.currentPhase === "11_standby"}
                    className="w-full py-2.5 rounded-xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/15 hover:text-white transition-all text-xs font-bold text-purple-400 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>11 - Stand-by</span>
                  </button>

                  <button
                    onClick={handleRevertToEvalPhase}
                    disabled={isRevertingPhase}
                    className="w-full py-2.5 rounded-xl border border-amber-500/20 bg-amber-500/5 hover:bg-amber-500/15 text-amber-400 font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                    title="Cambia el estado del expediente al primer estado de la Fase 2 Evaluación (05_screening)"
                  >
                    {isRevertingPhase ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <ChevronsLeft className="w-3.5 h-3.5" />
                    )}
                    <span>Volver a Fase Evaluación</span>
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
                  <span>Avanzar a Fase 4 (Cierre)</span>
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
              <span className="text-[10px] uppercase tracking-wider font-bold text-white/30 block">Fit Score F3</span>
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
                {cand.score >= 85 ? "Candidato destacado — alta prioridad de presentación" : cand.score >= 70 ? "Candidato apto — seguimiento recomendado" : "Candidato en calibración"}
              </p>
            </div>

          </div>

        </div>

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
                ¿Confirmas que deseas graduar al candidato <strong className="text-white">{cand.name}</strong> a la <strong className="text-emerald-400">Fase 4: Cierre del Proceso (12 - Oferta Extendida)</strong>?
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
                  placeholder="Ej: Presentación de shortlist al cliente"
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
                {savingMeeting ? <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
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
                  Fase 3 • Presentación
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
                {savingMeeting ? <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{savingMeeting ? "Eliminando..." : "Eliminar"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
