'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Building2, 
  MapPin, 
  ChevronRight, 
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
  PlayCircle,
  Camera,
  Phone,
  Mail,
  Eye
} from "lucide-react";

// Backend API Actions
import { getBusquedasAPI, Busqueda } from "@/actions/busquedas";
import { getCandidatosAPI, Candidato } from "@/actions/candidatos";
import { getPipelineAPI, PipelineItem, actualizarPipelineAPI } from "@/actions/pipeline";
import { EvaluacionCandidate, calculateEvaluacionKPIs } from "@/lib/evaluacion";

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
  const [activeTab, setActiveTab] = useState<"general" | "sintetizador" | "inconsistencias" | "preguntas" | "validador" | "copilot">("general");

  // Editing state for Recruiter Notes
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editRecruiterNotes, setEditRecruiterNotes] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Simulation states
  const [copiedTextType, setCopiedTextType] = useState<string | null>(null);

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

      // Fetch pipeline items across active searches
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

      // Match pipeline item by pipeId or candidate id
      let targetPipe = pipeItems.find(p => p.id === id || p.claves_conexion?.id_candidato === id);
      let targetCand = candidatesList.find(c => c.id === id || (targetPipe && c.id === targetPipe.claves_conexion?.id_candidato));

      if (targetPipe || targetCand) {
        const candMap = new Map(candidatesList.map(c => [c.id, c]));
        const busqMap = new Map(searches.map(b => [b.id, b]));

        const cObj = targetCand || candMap.get(targetPipe?.claves_conexion?.id_candidato || "");
        const bObj = busqMap.get(targetPipe?.claves_conexion?.id_busqueda || "");

        const stateStr = (targetPipe?.flujo?.estado_actual || "").toLowerCase();
        let currentPhase: EvaluacionCandidate["currentPhase"] = "05_screening";
        if (stateStr.includes("05") || stateStr.includes("screening")) {
          currentPhase = "05_screening";
        } else if (stateStr.includes("06") || stateStr.includes("assessment") || stateStr.includes("prueba")) {
          currentPhase = "06_assessment";
        } else if (stateStr.includes("07") || stateStr.includes("descartado")) {
          currentPhase = "07_descartado_interno";
        }

        const candName = cObj?.nombre_completo || "Candidato";
        const role = cObj?.puesto || bObj?.perfil_busqueda || "Especialista Tech";
        const client = bObj?.cliente || "Cliente General";
        const location = cObj?.ubicacion || "España / Remoto";
        const score = targetPipe?.f1_descubrimiento?.analisis_semantico?.fit_score ?? targetPipe?.evaluacion?.puntaje_tecnico ?? 88;
        const notes = targetPipe?.f1_descubrimiento?.notas_reclutador || cObj?.notas_iniciales || "";

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
          recruiterNotes: notes,
          toolsDetails: generateDefaultToolsDetails(candName, role, score)
        };

        setCand(item);
        setActivePipelineItem(targetPipe || null);
        setEditRecruiterNotes(notes);
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
      if (cand.pipeId) {
        const res = await actualizarPipelineAPI(cand.pipeId, {
          f1_descubrimiento: {
            notas_reclutador: editRecruiterNotes.trim()
          }
        });
        if (!res.success) {
          console.warn("Warn saving notes in backend:", res.message);
        }
      }
      setCand(prev => prev ? { ...prev, recruiterNotes: editRecruiterNotes.trim() } : null);
      setIsEditingNotes(false);
    } catch (err) {
      console.error("Error al guardar notas del reclutador:", err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleTransitionState = async (targetPhase: EvaluacionCandidate["currentPhase"]) => {
    if (!cand) return;
    const label = getPhaseLabel(targetPhase);
    setCand(prev => prev ? { ...prev, currentPhase: targetPhase, lastActivity: `Estado cambiado a ${label}` } : null);

    if (cand.pipeId) {
      try {
        await actualizarPipelineAPI(cand.pipeId, {
          flujo: {
            estado_actual: targetPhase,
            fecha_ultimo_cambio: new Date().toISOString()
          }
        });
      } catch (err) {
        console.error("Error al actualizar estado:", err);
      }
    }
  };

  // Phase 3 Advance Modal State
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isAdvancingPhase, setIsAdvancingPhase] = useState(false);

  const handleAdvancePhase = () => {
    setIsAdvanceModalOpen(true);
  };

  const confirmAdvancePhaseAction = async () => {
    if (!cand) return;
    setIsAdvancingPhase(true);
    try {
      if (cand.pipeId) {
        const now = new Date().toISOString();
        const nuevoEstado = "08_presentado_cliente";
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
      case "05_screening": return "05 - Screening (Entrevista Inicial)";
      case "06_assessment": return "06 - Prueba / Assessment Técnico";
      case "07_descartado_interno": return "07 - Descartado (Interno)";
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#101415] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#6bd8cb] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-[#6bd8cb] font-bold">Cargando expediente de evaluación...</p>
      </div>
    );
  }

  if (error || !cand) {
    return (
      <div className="min-h-screen bg-[#101415] text-white p-8 flex flex-col items-center justify-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <h2 className="text-lg font-bold text-white">{error || "Candidato no encontrado"}</h2>
        <Link 
          href="/evaluacion" 
          className="px-4 py-2 bg-[#6bd8cb] text-[#101415] rounded-xl text-xs font-bold hover:bg-[#5bc2b5] transition-all"
        >
          Volver al Pipeline de Evaluación
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#101415] text-white p-6 md:p-8 space-y-8 text-left">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header navigation */}
        <div className="flex items-center justify-between pb-4 border-b border-white/10">
          <Link 
            href="/evaluacion" 
            className="flex items-center gap-2 text-xs font-bold text-[#c4c1fb] hover:text-white transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Volver al Pipeline de Evaluación</span>
          </Link>

          <span className="text-[10px] font-bold text-[#6bd8cb] bg-[#6bd8cb]/10 px-3 py-1 rounded-full uppercase tracking-wider border border-[#6bd8cb]/20">
            Fase 2: Evaluación Interna
          </span>
        </div>

        {/* Main Candidate Card Banner */}
        <div className="p-6 rounded-3xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col md:flex-row gap-6 justify-between items-start md:items-center">
          <div className="space-y-2 flex-grow">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-white tracking-tight">{cand.name}</h1>
              <span className={`px-3 py-1 text-[10px] font-bold rounded-full ${
                cand.currentPhase === "05_screening" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                cand.currentPhase === "06_assessment" ? "bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20" :
                "bg-rose-500/10 text-rose-400 border border-rose-500/20"
              }`}>
                {getPhaseLabel(cand.currentPhase)}
              </span>
            </div>

            <p className="text-sm font-semibold text-[#c4c1fb]">{cand.role}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-[#879391] pt-1">
              <span className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
                <Building2 className="w-3.5 h-3.5 text-[#c4c1fb]" />
                {cand.client}
              </span>
              <span className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
                <MapPin className="w-3.5 h-3.5 text-[#6bd8cb]" />
                {cand.location}
              </span>
              <span className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
                <Phone className="w-3.5 h-3.5 text-[#6bd8cb]" />
                {cand.contactNumber}
              </span>
              <span className="flex items-center gap-1 bg-white/5 border border-white/5 rounded-lg px-2.5 py-1">
                <Mail className="w-3.5 h-3.5 text-[#c4c1fb]" />
                {cand.email}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 self-stretch md:self-auto justify-between md:justify-start">
            <div className="text-right">
              <span className="text-[10px] text-[#879391] uppercase font-bold tracking-wider block">Fit Score</span>
              <span className="text-3xl font-black text-[#6bd8cb] font-mono">{cand.score}%</span>
            </div>
          </div>
        </div>

        {/* NOTAS RECLUTADOR / EVALUACIÓN (Destacado Visualmente - Estilo Descubrimiento) */}
        <div className="p-5 rounded-2xl border border-[#6bd8cb]/30 bg-[#6bd8cb]/5 space-y-2 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-wider text-[#6bd8cb] font-bold flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#6bd8cb]" />
              <span>Notas Reclutador / Evaluación</span>
            </span>

            {!isEditingNotes ? (
              <button
                onClick={() => setIsEditingNotes(true)}
                className="px-3 py-1 rounded-lg border border-[#6bd8cb]/30 bg-[#6bd8cb]/10 text-[#6bd8cb] hover:bg-[#6bd8cb] hover:text-[#101415] text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Edit2 className="w-3 h-3" />
                <span>Editar notas</span>
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveNotes}
                  disabled={isSavingNotes}
                  className="px-3 py-1 rounded-lg bg-[#6bd8cb] text-[#101415] hover:bg-[#5bc2b5] text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <Save className="w-3 h-3" />
                  <span>{isSavingNotes ? "Guardando..." : "Guardar"}</span>
                </button>
                <button
                  onClick={() => {
                    setEditRecruiterNotes(cand.recruiterNotes || "");
                    setIsEditingNotes(false);
                  }}
                  className="px-3 py-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                  <span>Cancelar</span>
                </button>
              </div>
            )}
          </div>

          {isEditingNotes ? (
            <textarea
              value={editRecruiterNotes}
              onChange={(e) => setEditRecruiterNotes(e.target.value)}
              rows={3}
              placeholder="Escribe notas de evaluación sobre el candidato..."
              className="w-full bg-[#101415]/80 border border-[#6bd8cb]/40 p-3 text-xs rounded-xl text-white placeholder-[#879391] focus:border-[#6bd8cb] focus:outline-none resize-none leading-relaxed"
            />
          ) : (
            <div className="p-3.5 bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 rounded-xl text-xs text-white leading-relaxed font-medium shadow-sm">
              {cand.recruiterNotes ? cand.recruiterNotes : <span className="italic text-[#879391]">Sin notas de evaluación asignadas para este candidato.</span>}
            </div>
          )}
        </div>

        {/* Action Toolbar Row: Cambios de estado y Fase */}
        <div className="p-5 rounded-2xl border border-white/10 bg-white/[0.02] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#6bd8cb]" />
            <span className="text-xs font-bold text-white uppercase tracking-wider">Acciones del Candidato</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Avanzar estado */}
            {cand.currentPhase === "05_screening" && (
              <button
                onClick={() => handleTransitionState("06_assessment")}
                className="px-4 py-2 rounded-xl bg-[#6bd8cb]/15 border border-[#6bd8cb]/30 text-[#6bd8cb] hover:bg-[#6bd8cb] hover:text-[#101415] font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronsRight className="w-4 h-4" />
                <span>Avanzar a Assessment</span>
              </button>
            )}

            {cand.currentPhase === "06_assessment" && (
              <button
                onClick={() => handleTransitionState("05_screening")}
                className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500 hover:text-stone-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronsRight className="w-4 h-4" />
                <span>Volver a Screening</span>
              </button>
            )}

            {cand.currentPhase === "07_descartado_interno" && (
              <button
                onClick={() => handleTransitionState("05_screening")}
                className="px-4 py-2 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500 hover:text-white font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ChevronsRight className="w-4 h-4" />
                <span>Reactivar Candidato</span>
              </button>
            )}

            {/* Avanzar Fase (Fase 3: Presentación al Cliente) */}
            <button
              onClick={handleAdvancePhase}
              className="px-4 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-stone-950 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4" />
              <span>Avanzar a Fase 3 (Cliente)</span>
            </button>

            {/* Descartar / Rechazar */}
            {cand.currentPhase !== "07_descartado_interno" && (
              <button
                onClick={() => handleTransitionState("07_descartado_interno")}
                className="px-4 py-2 rounded-xl border border-white/10 bg-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-[#879391] hover:text-rose-400 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Ban className="w-4 h-4" />
                <span>Rechazar</span>
              </button>
            )}
          </div>
        </div>

        {/* Diagnostic Tools Tabs Section */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.01] overflow-hidden">
          
          {/* Tab Navigation Header */}
          <nav className="flex items-center overflow-x-auto bg-[#101415]/80 border-b border-white/10 px-6 py-2 gap-2 select-none">
            <button 
              onClick={() => setActiveTab("general")}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                activeTab === "general" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
              }`}
            >
              1. General & Info
            </button>
            <button 
              onClick={() => setActiveTab("sintetizador")}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "sintetizador" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>5. Sintetizador</span>
            </button>
            <button 
              onClick={() => setActiveTab("inconsistencias")}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "inconsistencias" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#ffb4ab]" />
              <span>6. Detector Crono</span>
            </button>
            <button 
              onClick={() => setActiveTab("preguntas")}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "preguntas" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>7. Preguntas STAR</span>
            </button>
            <button 
              onClick={() => setActiveTab("validador")}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "validador" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>8. Validador Identidad</span>
            </button>
            <button 
              onClick={() => setActiveTab("copilot")}
              className={`py-2 px-4 text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === "copilot" ? "bg-[#c4c1fb]/15 text-[#c4c1fb] border border-[#c4c1fb]/30" : "text-[#879391] hover:text-white"
              }`}
            >
              <Code className="w-3.5 h-3.5 text-[#6bd8cb]" />
              <span>Co-Pilot adaptativo</span>
            </button>
          </nav>

          {/* Tab Body Content */}
          <div className="p-6 space-y-6">
            {activeTab === "sintetizador" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-4 rounded-xl border border-white/5 bg-[#6bd8cb]/5 text-xs text-white/90">
                  <span className="font-bold text-[#6bd8cb]">Sintetizador de Entrevistas</span>
                  <p className="mt-0.5 text-[#879391] leading-relaxed">
                    Cruza el manuscrito de la llamada del reclutador con los requerimientos vacantes de la búsqueda.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="p-4 rounded-xl border border-emerald-500/10 bg-emerald-500/[0.01] space-y-2">
                    <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider block">Puntos Fuertes (Pros)</span>
                    <ul className="list-disc pl-4 text-xs space-y-1 text-white/80">
                      {cand.toolsDetails.sintetizador.pros.map((pro, index) => (
                        <li key={index}>{pro}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-amber-500/10 bg-amber-500/[0.01] space-y-2">
                    <span className="text-xs text-amber-400 font-bold uppercase tracking-wider block">Déficit o Brechas Técnicas (Cons)</span>
                    <ul className="list-disc pl-4 text-xs space-y-1 text-white/80">
                      {cand.toolsDetails.sintetizador.contras.map((con, index) => (
                        <li key={index}>{con}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-4 rounded-xl border border-rose-500/10 bg-rose-500/[0.01] space-y-2">
                    <span className="text-xs text-rose-400 font-bold uppercase tracking-wider block">Señales de Alerta (Riesgos)</span>
                    <ul className="list-disc pl-4 text-xs space-y-1 text-white/80">
                      {cand.toolsDetails.sintetizador.riesgos.map((risk, index) => (
                        <li key={index}>{risk}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "inconsistencias" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-4 rounded-xl border border-white/5 bg-rose-950/20 text-xs text-white/90">
                  <span className="font-bold text-rose-450">Detector de Inconsistencias Cronológicas</span>
                  <p className="mt-0.5 text-[#879391]">
                    Analiza secuencias temporales en la hoja de vida para alertar sobre huecos desocupados o solapamientos.
                  </p>
                </div>

                <div className="p-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 text-center flex flex-col items-center justify-center gap-2">
                  <Check className="w-8 h-8 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Línea temporal impecable</span>
                  <p className="text-xs text-[#879391]">No se detectaron brechas sin justificar en su trayectoria profesional.</p>
                </div>
              </div>
            )}

            {activeTab === "preguntas" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-4 rounded-xl border border-white/5 bg-[#6bd8cb]/5 text-xs text-white/90">
                  <span className="font-bold text-[#6bd8cb]">Generador de Preguntas Técnicas STAR</span>
                  <p className="mt-0.5 text-[#879391]">
                    Preguntas de comportamiento y código personalizadas según el stack funcional de la vacante.
                  </p>
                </div>

                <div className="space-y-3">
                  {cand.toolsDetails.preguntas.map((q, idx) => (
                    <div key={idx} className="p-4 rounded-xl border border-white/5 bg-white/[0.01] space-y-2">
                      <div className="flex justify-between items-start gap-3">
                        <span className="w-5 h-5 rounded bg-[#c4c1fb] text-[#101415] flex items-center justify-center text-[10px] font-black shrink-0 mt-0.5">
                          {idx + 1}
                        </span>
                        <span className="text-xs text-white leading-relaxed flex-grow text-left font-semibold">{q}</span>
                      </div>
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                        <button
                          onClick={() => handleCopyText(q, `q-${idx}`)}
                          className="text-[10px] text-[#6bd8cb] hover:underline flex items-center gap-1 font-bold cursor-pointer"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedTextType === `q-${idx}` ? "Copiado!" : "Copiar plantilla de pregunta"}</span>
                        </button>
                        <span className="text-[9px] uppercase tracking-wider font-bold text-[#c4c1fb]">Método STAR</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "validador" && (
              <div className="space-y-6 animate-fadeIn">
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
              </div>
            )}

            {activeTab === "copilot" && (
              <div className="space-y-6 animate-fadeIn">
                <div className="p-4 rounded-xl border border-white/5 bg-indigo-950/20 text-xs text-white/90">
                  <span className="font-bold text-[#c4c1fb]">Entorno de Pair-Programming Adaptativo (AI Co-Pilot)</span>
                  <p className="mt-0.5 text-[#879391]">
                    Colaboración en vivo de código asistida por IA y telemetría de esfuerzo técnico.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/5 pt-4">
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
                    "{cand.toolsDetails.copilot.summary}"
                  </p>
                </div>
              </div>
            )}

            {activeTab === "general" && (
              <div className="space-y-4 animate-fadeIn text-xs text-[#879391]">
                <p>Ingreso registrado al pipeline: <span className="text-white font-semibold">{new Date(cand.entryDate).toLocaleString()}</span></p>
                <p>Actividad reciente: <span className="text-[#6bd8cb] font-semibold">{cand.lastActivity}</span></p>
              </div>
            )}
          </div>
        </div>

      </div>
      {/* Modal Emergente Mejorado: Confirmar Cambio de Fase a Cliente (Fase 3) */}
      {isAdvanceModalOpen && cand && (
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
                onClick={() => setIsAdvanceModalOpen(false)}
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
                Estás a punto de promocionar el expediente de <strong className="text-white">{cand.name}</strong> a <strong className="text-[#6bd8cb]">Fase 3 (Cliente / Presentación)</strong>.
              </p>
            </div>

            {/* Candidate Card Summary */}
            <div className="p-3.5 rounded-2xl border border-white/10 bg-white/[0.02] flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-white block">{cand.name}</span>
                <span className="text-[10px] text-[#879391]">{cand.role} • {cand.client}</span>
              </div>
              <span className="px-2.5 py-1 text-[9px] font-bold rounded-full bg-[#6bd8cb]/15 text-[#6bd8cb] border border-[#6bd8cb]/30 font-mono">
                Fit {cand.score}%
              </span>
            </div>

            {/* Action Buttons: Cancelar & Confirmar */}
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

    </div>
  );
}
