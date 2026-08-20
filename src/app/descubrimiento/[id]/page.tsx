'use client';

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getApiEndpoint } from "@/utils/api";
import { 
  Building2, 
  MapPin, 
  ChevronRight, 
  Ban, 
  AlertCircle, 
  Clock, 
  ExternalLink, 
  MessageSquare, 
  GitFork, 
  Globe, 
  Check, 
  Copy, 
  UserCheck, 
  RefreshCw, 
  Cpu, 
  ArrowLeft,
  Edit2,
  Trash2,
  Sparkles,
  Send,
  Save,
  X,
  FileText,
  ChevronsRight,
  Calendar,
  Video,
  Plus,
  Share2,
  Mail,
  Phone
} from "lucide-react";
import { analyzeSemanticMatchLive, generateOutreachMessageLive, SemanticMatchResult } from "@/lib/gemini";

// Backend API Actions
import { getBusquedasAPI } from "@/actions/busquedas";
import type { Busqueda } from "@/actions/busquedas";
import { getCandidatosAPI, actualizarCandidatoAPI } from "@/actions/candidatos";
import type { Candidato } from "@/actions/candidatos";
import { getPipelineAPI, getPipelineItemAPI, actualizarPipelineAPI } from "@/actions/pipeline";
import type { PipelineItem, Reunion } from "@/actions/pipeline";
import ScreeningPanel from "@/app/components/ScreeningPanel";
import EvaluarScreeningModal from "@/app/components/EvaluarScreeningModal";
import type { CriterioScreening } from "@/types/screening";

interface SourcedCandidate {
  id: string;
  pipeId?: string;
  name: string;
  role: string;
  client: string;
  location: string;
  phase1State: "01_nuevo" | "02_contactado" | "03_bloqueado" | "04_rechazado";
  score: number;
  lastChangeDate: string;
  ttfme: string;
  outreachVariation: "A" | "B";
  customOutreachA: string;
  customOutreachB: string;
  blockReason?: string;
  missingField?: "cv" | "salario" | "ingles";
  motivationNote?: string;
  recruiterNotes?: string;
  socialLinks?: {
    github?: string;
    stackoverflow?: string;
    portfolio?: string;
  };
  rejectionReason?: string;
  reuniones?: Reunion[];
  url_cv?: string;
  canal_ingreso?: string | null;
  email?: string;
  telefono_movil?: string;
  skills_principales?: string;
  nivel_ingles?: string;
  otros_idiomas?: string;
  resumen?: string;
  rubros?: string;
  origen?: string;
  estado_revision?: string;
  createdAt?: string;
}

const SEMANTIC_MATCH_DB: Record<string, SemanticMatchResult> = {
  "Diego Lozano": {
    score: 94,
    positives: [
      "Sólida experiencia de 5+ años en desarrollo web React senior.",
      "Excelente manejo del ecosistema TypeScript y optimización frontend.",
      "Afinidad probada trabajando en proyectos de telecomunicaciones/Telefónica."
    ],
    negatives: [
      "Poco bagaje en frameworks de backend nativos.",
      "Historial de empleo con saltos cortos (menores a 18 meses) en los últimos 3 años."
    ],
    recommendations: [
      "Avanzar directamente a entrevista técnica intermedia.",
      "Preguntar sobre su proyección a largo plazo y estabilidad en el equipo."
    ]
  },
  "Marta Galiano": {
    score: 91,
    positives: [
      "Gran destreza liderando desarrollos en JS/TS bajo metodologías ágiles.",
      "Fuerte portafolio en Github que demuestra excelentes estándares de estructuración de APIs.",
      "Perfil localizado de manera óptima y proactiva."
    ],
    negatives: [
      "No cuenta con experiencia industrial con Rust directamente.",
      "Habilidades en infraestructuras Cloud (GCP/Kubernetes) limitadas."
    ],
    recommendations: [
      "Validar vocación para capacitarse velozmente en lenguajes de sistemas como Rust.",
      "Mantener contacto regular para agendar screening técnico inicial."
    ]
  },
  "Javier Galdón": {
    score: 97,
    positives: [
      "8 años de trayectoria avanzada como Software Architect en SEAT S.A.",
      "Profundo dominio práctico en Rust y su integración a compilaciones WebAssembly (WASM).",
      "Experiencia real modelando frameworks de baja latencia."
    ],
    negatives: [
      "Pretensiones económicas rozando el techo de la actual oferta asignada.",
      "Estudios formales no completados (compensado por robusto portafolio)."
    ],
    recommendations: [
      "Aprobar paso directo al comité técnico final.",
      "Sondear flexibilidad de bandas salariales con la gerencia del cliente."
    ]
  },
  "Carlos Tejera": {
    score: 87,
    positives: [
      "Experiencia comprobada administrando flujos de datos con Apache Kafka y Cassandra.",
      "Habilidades superiores diseñando microservicios robustos y tolerantes a fallos.",
      "Rol anterior destacado como Principal Data Engineer en Telefónica."
    ],
    negatives: [
      "Nivel de inglés formal reportado como intermedio (B2 lectura/escritura).",
      "Poco apego a tareas multidisciplinares relativas a UI/UX."
    ],
    recommendations: [
      "Efectuar comprobación telefónica improvisada para validar fluidez conversacional en inglés.",
      "Solicitar referencias técnicas de proyectos de Big Data pasados."
    ]
  },
  "Alberto Ruiz": {
    score: 79,
    positives: [
      "Background solvente desarrollando APIs backend escalables en Python e integrando Django.",
      "Experiencia práctica interactuando con bases de datos PostgreSQL y Redis.",
      "Familiaridad sólida configurando pipelines de CI/CD (GitHub Actions/Docker)."
    ],
    negatives: [
      "Pretensiones salariales iniciales de 65.000€ exceden el presupuesto previsto de hasta 52.000€.",
      "Nivel de seniority requerido está por encima de sus últimas responsabilidades."
    ],
    recommendations: [
      "Descartar formalmente y enviar feedback constructivo detallado."
    ]
  }
};

const getDynamicMatchResult = (cad: SourcedCandidate): SemanticMatchResult => {
  const score = cad.score || 85;
  return {
    score,
    positives: [
      `El perfil demuestra aptitudes iniciales para cubrir el rol de ${cad.role} en ${cad.client}.`,
      `Residencia técnica en ${cad.location} compatible con los lineamientos del cliente.`,
      `El fit score inicial del backlog coincide con los parámetros básicos del puesto.`
    ],
    negatives: [
      `Se requiere profundizar en el nivel de expertise en la suite exacta de tecnologías requeridas.`,
      `Trayectoria histórica con pocos periodos de permanencia estable y prolongada.`
    ],
    recommendations: [
      `Lanzar bot de triage o llamada telefónica exploratoria corta.`,
      `Pedir referencias profesionales actualizadas de sus últimos líderes.`
    ]
  };
};

const mapSinglePipelineToSourcedCandidate = (
  pipe: PipelineItem | null,
  cand: Candidato,
  busq?: Busqueda
): SourcedCandidate => {
  let phase1State: SourcedCandidate["phase1State"] = "01_nuevo";
  if (pipe) {
    const stateStr = pipe.flujo?.estado_actual || "";
    const lowerState = stateStr.toLowerCase();
    if (lowerState.includes("01 -") || lowerState.includes("01_nuevo")) {
      phase1State = "01_nuevo";
    } else if (lowerState.includes("02 -") || lowerState.includes("02_contactado")) {
      phase1State = "02_contactado";
    } else if (lowerState.includes("03 -") || lowerState.includes("03_bloqueado")) {
      phase1State = "03_bloqueado";
    } else if (lowerState.includes("04 -") || lowerState.includes("04_rechazado") || lowerState.includes("descartado") || lowerState.includes("rechazado")) {
      phase1State = "04_rechazado";
    } else {
      if (lowerState === "02_contactado") phase1State = "02_contactado";
      else if (lowerState === "03_bloqueado") phase1State = "03_bloqueado";
      else if (lowerState === "04_rechazado") phase1State = "04_rechazado";
    }
  }

  let lastChangeDate = "Hace poco";
  if (pipe?.flujo?.fecha_ultimo_cambio) {
    const diffMs = Date.now() - new Date(pipe.flujo.fecha_ultimo_cambio).getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours < 1) {
      const diffMins = Math.floor(diffMs / (1000 * 60));
      lastChangeDate = diffMins <= 1 ? "Ahora mismo" : `Hace ${diffMins} min`;
    } else if (diffHours < 24) {
      lastChangeDate = `Hace ${diffHours} horas`;
    } else {
      const diffDays = Math.floor(diffHours / 24);
      lastChangeDate = `Hace ${diffDays} ${diffDays === 1 ? "día" : "días"}`;
    }
  }

  let blockReason = (pipe as any)?.resolucion?.motivo_rechazo || (pipe as any)?.motivo_rechazo || pipe?.cierre?.motivo_rechazo || undefined;
  let missingField: SourcedCandidate["missingField"] = undefined;
  if (phase1State === "03_bloqueado" && pipe) {
    blockReason = (pipe as any)?.resolucion?.motivo_rechazo || (pipe as any)?.motivo_rechazo || pipe?.cierre?.motivo_rechazo || "Falta información";
    if (blockReason.toLowerCase().includes("cv")) {
      missingField = "cv";
    } else if (blockReason.toLowerCase().includes("salario") || blockReason.toLowerCase().includes("pretensión")) {
      missingField = "salario";
    } else if (blockReason.toLowerCase().includes("ingles") || blockReason.toLowerCase().includes("inglés")) {
      missingField = "ingles";
    }
  }

  const score = pipe?.f1_descubrimiento?.analisis_semantico?.fit_score ?? 80;
  const rejectionReason = (pipe as any)?.resolucion?.motivo_rechazo || (pipe as any)?.motivo_rechazo || pipe?.cierre?.motivo_rechazo || (phase1State === "04_rechazado" ? "No cumple barra mínima" : undefined);

  let socialLinks: SourcedCandidate["socialLinks"] = {
    portfolio: cand.linkedin_url || ""
  };

  // Retrieve custom outreach variations from pipe if saved
  const outreachInfo = (pipe?.f1_descubrimiento as any)?.outreach_custom || {};

  return {
    id: cand.id,
    pipeId: pipe?.id,
    name: cand.nombre_completo || "Candidato Desconocido",
    role: cand.puesto || busq?.perfil_busqueda || "Developer",
    client: busq?.cliente || "Cliente Genérico",
    location: cand.ubicacion || "Remoto España",
    phase1State,
    score,
    lastChangeDate,
    ttfme: "4.2 días",
    outreachVariation: (pipe?.f1_descubrimiento?.outreach?.variante_enviada || "A") as "A" | "B",
    customOutreachA: outreachInfo.customOutreachA || `Hola ${cand.nombre_completo}, he visto tu experiencia como ${cand.puesto} y me ha parecido muy interesante para el rol en el que estamos trabajando...`,
    customOutreachB: outreachInfo.customOutreachB || `Estimado/a ${cand.nombre_completo}, formo parte del equipo de talent sourcing. Observo que tienes un gran perfil técnico en ingeniería de software...`,
    blockReason,
    missingField,
    motivationNote: cand.notas_iniciales || undefined,
    recruiterNotes: pipe?.f1_descubrimiento?.notas_reclutador || undefined,
    socialLinks,
    rejectionReason,
    reuniones: pipe?.f1_descubrimiento?.reuniones || [],
    url_cv: cand.url_cv || undefined,
    canal_ingreso: cand.canal_ingreso || null,
    email: cand.email || undefined,
    telefono_movil: cand.telefono_movil || undefined,
    skills_principales: cand.skills_principales || undefined,
    nivel_ingles: cand.nivel_ingles || undefined,
    otros_idiomas: cand.otros_idiomas || undefined,
    resumen: cand.resumen || undefined,
    rubros: cand.rubros || undefined,
    origen: cand.origen || undefined,
    estado_revision: cand.estado_revision || undefined,
    createdAt: cand.createdAt || undefined
  };
};

export default function SourcedCandidateDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [candidates, setCandidates] = useState<SourcedCandidate[]>([]);
  const [cand, setCand] = useState<SourcedCandidate | null>(null);
  const [activePipelineItem, setActivePipelineItem] = useState<PipelineItem | null>(null);
  const [activeBusquedaObj, setActiveBusquedaObj] = useState<Busqueda | null>(null);
  const [criteriosBusqueda, setCriteriosBusqueda] = useState<CriterioScreening[]>([]);
  const [isEvalModalOpen, setIsEvalModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Edit Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editClient, setEditClient] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editCanalIngreso, setEditCanalIngreso] = useState("");
  const [existingChannels, setExistingChannels] = useState<string[]>([
    "Headhunting",
    "LinkedIn",
    "Referido",
    "InfoJob",
    "Otros"
  ]);
  const [isCustomChannel, setIsCustomChannel] = useState(false);
  const [editMotivation, setEditMotivation] = useState("");
  const [editRecruiterNotes, setEditRecruiterNotes] = useState("");
  const [editScore, setEditScore] = useState(80);
  const [editGithub, setEditGithub] = useState("");
  const [editPortfolio, setEditPortfolio] = useState("");
  const [editBlockReason, setEditBlockReason] = useState("");
  const [editRejectionReason, setEditRejectionReason] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editSkills, setEditSkills] = useState("");
  const [editNivelIngles, setEditNivelIngles] = useState("");
  const [editOtrosIdiomas, setEditOtrosIdiomas] = useState("");
  const [editResumen, setEditResumen] = useState("");
  const [editRubros, setEditRubros] = useState("");

  // P-TAL-02 Collapsible Accordion State
  const [isTalentoAccordionOpen, setIsTalentoAccordionOpen] = useState(false);

  // Simulated integrations states
  const [enriching, setEnriching] = useState(false);
  const [copiedOutreach, setCopiedOutreach] = useState(false);
  
  // Rejection modal simulation
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [customRejectionReason, setCustomRejectionReason] = useState("Presupuesto");

  // Semantic Match modal simulation
  const [isSemanticOpen, setIsSemanticOpen] = useState(false);
  const [isAnalyzingSemantic, setIsAnalyzingSemantic] = useState(false);
  const [semanticResult, setSemanticResult] = useState<SemanticMatchResult | null>(null);
  const [isGeneratingOutreach, setIsGeneratingOutreach] = useState(false);

  // WhatsApp Triage Bot modal simulation
  const [triageOpen, setTriageOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ sender: "bot" | "user"; text: string }[]>([]);
  const [chatInput, setChatInput] = useState("");

  // Phase 2 Advance Modal State
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isAdvancingPhase, setIsAdvancingPhase] = useState(false);

  // Phase 1 Meetings State
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
                fase: m.fase || "F1 - Descubrimiento"
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
          fase: "F1 - Descubrimiento"
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

      const raw = localStorage.getItem("azul_ats_discovery_candidates");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SourcedCandidate[];
          const updatedCandidates = parsed.map(c => {
            if (c.id === cand?.id || c.pipeId === cand?.pipeId) {
              return { ...c, reuniones: updatedMeetings };
            }
            return c;
          });
          localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(updatedCandidates));
        } catch (_) {}
      }

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

      const raw = localStorage.getItem("azul_ats_discovery_candidates");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SourcedCandidate[];
          const updatedCandidates = parsed.map(c => {
            if (c.id === cand?.id || c.pipeId === cand?.pipeId) {
              return { ...c, reuniones: updatedMeetings };
            }
            return c;
          });
          localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(updatedCandidates));
        } catch (_) {}
      }

      setDeletingMeetingId(null);
    } catch (err: any) {
      console.error("Error al eliminar la reunión:", err);
      alert(err.message || "Ocurrió un error al eliminar la reunión.");
    } finally {
      setSavingMeeting(false);
    }
  };

  const confirmAdvancePhaseAction = async () => {
    if (!cand) return;
    setIsAdvancingPhase(true);
    try {
      if (activePipelineItem?.id) {
        const now = new Date().toISOString();
        const nuevoEstado = "05_screening";
        const historialActualizado = [
          { estado: nuevoEstado, timestamp: now },
          ...(activePipelineItem.flujo.historial_estados || [])
        ];
        await actualizarPipelineAPI(activePipelineItem.id, {
          flujo: {
            estado_actual: nuevoEstado,
            fecha_ultimo_cambio: now,
            historial_estados: historialActualizado
          }
        });
        // Actualizar state local para reflejar el historial inmediatamente
        setActivePipelineItem(prev => prev ? {
          ...prev,
          flujo: {
            ...prev.flujo,
            estado_actual: nuevoEstado,
            fecha_ultimo_cambio: now,
            historial_estados: historialActualizado
          }
        } : null);
      }
      setCand(prev => prev ? { ...prev, phase1State: "05_screening" as any } : null);
      setIsAdvanceModalOpen(false);
    } catch (err: any) {
      console.error("Error al avanzar fase:", err);
    } finally {
      setIsAdvancingPhase(false);
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

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Fetch real data from backend
  const fetchBackendData = async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      setError(null);

      // 1. Get active searches
      const searchRes = await getBusquedasAPI();
      let searchesList: Busqueda[] = Array.isArray(searchRes) ? searchRes : [];

      const activeBusqueda = searchesList.find(b => Array.isArray(b.criterios_screening) && b.criterios_screening.length > 0) || searchesList[0];
      if (activeBusqueda) {
        if (activeBusqueda.criterios_screening) {
          setCriteriosBusqueda(activeBusqueda.criterios_screening);
        }
        setActiveBusquedaObj(activeBusqueda);
      }

      // 2. Direct pipeline item lookup by ID (e.g. /descubrimiento/6EDjceRl0vxbPbOvfRNH)
      let foundPipeItem: PipelineItem | undefined;
      let foundSearch: Busqueda | undefined;

      console.log(`🔍 [DIAGNÓSTICO SCREENING P-DIS-02] Consultando ID de URL: "${id}"`);
      try {
        const directRes = await getPipelineItemAPI(id);
        if (directRes.success && directRes.data) {
          const rawItem = Array.isArray(directRes.data) ? directRes.data[0] : directRes.data;
          if (rawItem && (rawItem.id || rawItem.claves_conexion)) {
            foundPipeItem = rawItem;
            console.log(`🔍 [DIAGNÓSTICO SCREENING P-DIS-02] Pipeline encontrado por ID directo /pipeline/${id}:`, foundPipeItem);
          }
        }
      } catch (err) {
        console.warn("Direct pipeline lookup skipped:", err);
      }

      // Search loop fallback across searches
      if (!foundPipeItem && searchesList.length > 0) {
        const promises = searchesList.map(s => getPipelineAPI(s.id_busqueda || s.id));
        const results = await Promise.all(promises);
        
        for (let i = 0; i < results.length; i++) {
          const res = results[i];
          if (res.success && Array.isArray(res.data)) {
            const item = res.data.find(p => 
              p.id === id || 
              p.claves_conexion?.id_candidato === id ||
              (p as any).id_candidato === id
            );
            if (item) {
              foundPipeItem = item;
              foundSearch = searchesList[i];
              break;
            }
          }
        }
      }

      console.log(`🔍 [DIAGNÓSTICO SCREENING P-DIS-02] Pipeline Item Encontrado:`, foundPipeItem ? {
        id: foundPipeItem.id,
        id_busqueda: foundPipeItem.claves_conexion?.id_busqueda,
        id_candidato: foundPipeItem.claves_conexion?.id_candidato,
        fit_score_screening: foundPipeItem.fit_score_screening,
        tiene_knockout: foundPipeItem.tiene_knockout,
        fecha_modificacion_screening: foundPipeItem.fecha_modificacion_screening,
        resultado_screening_count: foundPipeItem.resultado_screening?.length || 0,
        resultado_screening_raw: foundPipeItem.resultado_screening
      } : "NINGUNO (null/undefined)");

      // Resolve specific search & criteria for this pipeline item
      let resolvedSearch = foundSearch;
      if (!resolvedSearch && foundPipeItem?.claves_conexion?.id_busqueda) {
        resolvedSearch = searchesList.find(s => 
          (s.id_busqueda || s.id) === foundPipeItem?.claves_conexion?.id_busqueda ||
          s.codigo_busqueda === foundPipeItem?.claves_conexion?.id_busqueda
        );
      }
      if (!resolvedSearch) {
        resolvedSearch = activeBusqueda;
      }

      if (resolvedSearch) {
        setActiveBusquedaObj(resolvedSearch);
        if (Array.isArray(resolvedSearch.criterios_screening) && resolvedSearch.criterios_screening.length > 0) {
          setCriteriosBusqueda(resolvedSearch.criterios_screening);
        }
      }

      // 3. Get Candidates
      const candRes = await getCandidatosAPI();
      if (!candRes.success || !candRes.data) {
        throw new Error(candRes.message || "Error al obtener candidatos.");
      }
      const candidatesList = candRes.data as Candidato[];

      const dbChannels = candidatesList
        .map(c => c.canal_ingreso)
        .filter((ch): ch is string => Boolean(ch && ch.trim()));
      const defaults = ["Headhunting", "LinkedIn", "Referido", "InfoJob", "Otros"];
      setExistingChannels(Array.from(new Set([...defaults, ...dbChannels])));
      
      const candidateId = foundPipeItem?.claves_conexion?.id_candidato || (foundPipeItem as any)?.id_candidato || id;
      const foundCandidate = candidatesList.find(c => c.id === candidateId || c.id === id);
      
      if (!foundCandidate) {
        setCand(null);
        setActivePipelineItem(null);
        setLoading(false);
        return;
      }

      // Map to SourcedCandidate
      const sourced = mapSinglePipelineToSourcedCandidate(foundPipeItem || null, foundCandidate, resolvedSearch);
      setCand(sourced);
      setActivePipelineItem(foundPipeItem || null);
      syncEditForm(sourced);
      setCandidates([sourced]);
    } catch (e: any) {
      console.error("Error loading candidate from backend, falling back to localStorage:", e);
      setError(e.message || "Error al cargar datos reales del candidato.");
      
      const raw = localStorage.getItem("azul_ats_discovery_candidates");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SourcedCandidate[];
          setCandidates(parsed);
          const found = parsed.find(c => c.id === id || c.pipeId === id);
          if (found) {
            setCand(found);
            syncEditForm(found);
          }
        } catch (_) {}
      }
    } finally {
      setLoading(false);
    }
  };

  // Load from backend on init
  useEffect(() => {
    if (!authLoading && user) {
      fetchBackendData();
    }
  }, [id, user, authLoading]);

  const syncEditForm = (c: SourcedCandidate) => {
    setEditName(c.name || "");
    setEditRole(c.role || "");
    setEditClient(c.client || "");
    setEditLocation(c.location || "");
    setEditCanalIngreso(c.canal_ingreso || "");
    setIsCustomChannel(false);
    setEditMotivation(c.motivationNote || "");
    setEditRecruiterNotes(c.recruiterNotes || "");
    setEditScore(c.score || 80);
    setEditGithub(c.socialLinks?.github || "");
    setEditPortfolio(c.socialLinks?.portfolio || "");
    setEditBlockReason(c.blockReason || "");
    setEditRejectionReason(c.rejectionReason || "");
    setEditEmail(c.email || "");
    setEditTelefono(c.telefono_movil || "");
    setEditSkills(c.skills_principales || "");
    setEditNivelIngles(c.nivel_ingles || "");
    setEditOtrosIdiomas(c.otros_idiomas || "");
    setEditResumen(c.resumen || "");
    setEditRubros(c.rubros || "");
  };

  const handleUpdateCandidatesList = (updatedList: SourcedCandidate[]) => {
    setCandidates(updatedList);
    localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(updatedList));
    const current = updatedList.find(c => c.id === id);
    if (current) {
      setCand(current);
      syncEditForm(current);
    }
  };

  const handleSave = async () => {
    if (!editName.trim() || !editRole.trim() || !editClient.trim()) {
      alert("El nombre, puesto y cliente son campos obligatorios.");
      return;
    }

    try {
      setLoading(true);
      // 1. Update Candidate
      const candPayload: Partial<Candidato> = {};
      if (editName.trim() !== cand?.name) candPayload.nombre_completo = editName.trim();
      if (editRole.trim() !== cand?.role) candPayload.puesto = editRole.trim();
      if (editLocation.trim() !== cand?.location) candPayload.ubicacion = editLocation.trim();
      if (editMotivation.trim() !== cand?.motivationNote) candPayload.notas_iniciales = editMotivation.trim();
      if (editPortfolio.trim() !== cand?.socialLinks?.portfolio) candPayload.linkedin_url = editPortfolio.trim();
      if (editCanalIngreso.trim() !== (cand?.canal_ingreso || "")) candPayload.canal_ingreso = editCanalIngreso.trim();
      if (editEmail.trim() !== (cand?.email || "")) candPayload.email = editEmail.trim();
      if (editTelefono.trim() !== (cand?.telefono_movil || "")) candPayload.telefono_movil = editTelefono.trim();
      if (editSkills.trim() !== (cand?.skills_principales || "")) candPayload.skills_principales = editSkills.trim();
      if (editNivelIngles.trim() !== (cand?.nivel_ingles || "")) candPayload.nivel_ingles = editNivelIngles.trim();
      if (editOtrosIdiomas.trim() !== (cand?.otros_idiomas || "")) candPayload.otros_idiomas = editOtrosIdiomas.trim();
      if (editResumen.trim() !== (cand?.resumen || "")) candPayload.resumen = editResumen.trim();
      if (editRubros.trim() !== (cand?.rubros || "")) candPayload.rubros = editRubros.trim();

      if (cand && Object.keys(candPayload).length > 0) {
        const res = await actualizarCandidatoAPI(cand.id, candPayload);
        if (!res.success) {
          throw new Error(res.message || "Error al actualizar la información del candidato.");
        }
        if (editCanalIngreso.trim()) {
          setExistingChannels(prev => Array.from(new Set([...prev, editCanalIngreso.trim()])));
        }
      }

      // 2. Update Pipeline
      if (cand?.pipeId) {
        const pipePayload: any = {
          f1_descubrimiento: {
            ...(cand as any).f1_descubrimiento,
            notas_reclutador: editRecruiterNotes.trim(),
            analisis_semantico: {
              ...(cand as any).f1_descubrimiento?.analisis_semantico,
              fit_score: Number(editScore),
              origen: "Gemini AI"
            },
            outreach: {
              ...(cand as any).f1_descubrimiento?.outreach,
              variante_enviada: cand.outreachVariation
            },
            outreach_custom: {
              customOutreachA: cand.customOutreachA,
              customOutreachB: cand.customOutreachB
            }
          }
        };

        const nowIso = new Date().toISOString();

        if (editRejectionReason.trim()) {
          pipePayload.motivo_rechazo = editRejectionReason.trim();
          pipePayload.resolucion = {
            estado_final: cand.phase1State === "04_rechazado" ? "Descartado" : cand.phase1State,
            motivo_rechazo: editRejectionReason.trim(),
            fecha_resolucion: nowIso
          };
        }

        if (cand.phase1State === "03_bloqueado") {
          pipePayload.cierre = {
            fecha_cierre: nowIso,
            motivo_rechazo: editBlockReason.trim() || editRejectionReason.trim()
          };
        } else if (cand.phase1State === "04_rechazado") {
          pipePayload.cierre = {
            fecha_cierre: nowIso,
            motivo_rechazo: editRejectionReason.trim()
          };
        }

        const res = await actualizarPipelineAPI(cand.pipeId, pipePayload);
        if (!res.success) {
          throw new Error(res.message || "Error al actualizar el pipeline.");
        }
      }

      // Update LocalStorage too
      const raw = localStorage.getItem("azul_ats_discovery_candidates");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SourcedCandidate[];
          const updated = parsed.map(c => {
            if (c.id === id) {
              return {
                ...c,
                name: editName.trim(),
                role: editRole.trim(),
                client: editClient.trim(),
                location: editLocation.trim(),
                motivationNote: editMotivation.trim(),
                recruiterNotes: editRecruiterNotes.trim(),
                score: Number(editScore),
                socialLinks: {
                  ...c.socialLinks,
                  github: editGithub.trim() || undefined,
                  portfolio: editPortfolio.trim() || undefined
                },
                blockReason: c.phase1State === "03_bloqueado" ? editBlockReason.trim() : c.blockReason,
                rejectionReason: c.phase1State === "04_rechazado" ? editRejectionReason : c.rejectionReason,
                canal_ingreso: editCanalIngreso.trim() || null,
                lastChangeDate: "Recién editado"
              };
            }
            return c;
          });
          localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(updated));
          setCandidates(updated);
        } catch (_) {}
      }

      await fetchBackendData();
      setIsEditing(false);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al guardar los cambios.");
    } finally {
      setLoading(false);
    }
  };

  const handleTransitionState = async (newState: SourcedCandidate["phase1State"], params?: Partial<SourcedCandidate>) => {
    if (!cand) return;

    const mapPhaseToBackendState = (phase: string) => {
      switch (phase) {
        case "01_nuevo":
          return "01 - Nuevo en Revisión";
        case "02_contactado":
          return "02 - Bloqueado / Pendiente";
        case "03_bloqueado":
          return "03 - En Duda a Confirmar";
        case "04_rechazado":
          return "04 - Rechazado en Fase Inicial";
        default:
          return "01 - Nuevo en Revisión";
      }
    };

    try {
      setLoading(true);

      // Update candidate's review state in master table
      const candPayload: Partial<Candidato> = {};
      if (newState === "04_rechazado") {
        candPayload.estado_revision = "Descartado";
      } else if (newState === "02_contactado") {
        candPayload.estado_revision = "Seleccionado";
      } else {
        candPayload.estado_revision = "Pendiente";
      }

      if (params?.motivationNote) {
        candPayload.notas_iniciales = params.motivationNote;
      }
      await actualizarCandidatoAPI(cand.id, candPayload);

      // Update relation in pipeline
      if (cand.pipeId) {
        const payload: any = {
          flujo: {
            estado_actual: mapPhaseToBackendState(newState),
            fecha_ultimo_cambio: new Date().toISOString()
          }
        };

        if (newState === "03_bloqueado" || newState === "04_rechazado") {
          const reason = params?.blockReason || params?.rejectionReason || "Cierre de revisión";
          payload.cierre = {
            fecha_cierre: new Date().toISOString(),
            motivo_rechazo: reason
          };
        } else {
          payload.cierre = {
            fecha_cierre: null,
            motivo_rechazo: null
          };
        }

        await actualizarPipelineAPI(cand.pipeId, payload);
      }

      // Update LocalStorage too
      const raw = localStorage.getItem("azul_ats_discovery_candidates");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SourcedCandidate[];
          const updated = parsed.map(c => {
            if (c.id === id) {
              return {
                ...c,
                phase1State: newState,
                lastChangeDate: "Hace unos segundos",
                ...params
              };
            }
            return c;
          });
          localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(updated));
          setCandidates(updated);
        } catch (_) {}
      }

      await fetchBackendData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al actualizar la transición del candidato.");
    } finally {
      setLoading(false);
    }
  };

  // Simulated Action: Enrich / Scrape digital footprint
  const handleEnrichCandidate = async () => {
    if (!cand) return;
    setEnriching(true);
    try {
      const linkedin = cand.socialLinks?.portfolio || `https://linkedin.com/in/${cand.name.toLowerCase().replace(/ /g, "-")}`;
      
      const payload: Partial<Candidato> = {
        linkedin_url: linkedin
      };

      const res = await actualizarCandidatoAPI(cand.id, payload);
      if (!res.success) {
        throw new Error(res.message || "Error al guardar el enriquecimiento.");
      }

      // Local storage sync
      const raw = localStorage.getItem("azul_ats_discovery_candidates");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SourcedCandidate[];
          const updated = parsed.map(c => {
            if (c.id === id) {
              return {
                ...c,
                socialLinks: {
                  github: c.socialLinks?.github || `https://github.com/${c.name.toLowerCase().replace(/ /g, "")}`,
                  portfolio: linkedin
                }
              };
            }
            return c;
          });
          localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(updated));
          setCandidates(updated);
        } catch (_) {}
      }

      await fetchBackendData();
      alert("Huella digital enriquecida! Enlaces de LinkedIn y Github actualizados en el backend.");
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al enriquecer candidato.");
    } finally {
      setEnriching(false);
    }
  };

  // Simulated Action: Copy Outreach message template
  const handleCopyOutreach = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOutreach(true);
    setTimeout(() => setCopiedOutreach(false), 2000);
  };

  // Switch outreach variation template
  const handleToggleOutreachVariation = async () => {
    if (!cand) return;
    const newVariation: "A" | "B" = cand.outreachVariation === "A" ? "B" : "A";
    
    try {
      setLoading(true);
      if (cand.pipeId) {
        const payload = {
          f1_descubrimiento: {
            ...(cand as any).f1_descubrimiento,
            outreach: {
              ...(cand as any).f1_descubrimiento?.outreach,
              variante_enviada: newVariation,
              fecha_envio: new Date().toISOString()
            }
          }
        };
        const res = await actualizarPipelineAPI(cand.pipeId, payload);
        if (!res.success) {
          throw new Error(res.message || "Error al actualizar la variante de outreach.");
        }
      }

      // Local storage sync
      const raw = localStorage.getItem("azul_ats_discovery_candidates");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SourcedCandidate[];
          const updated = parsed.map(c => {
            if (c.id === id) {
              return {
                ...c,
                outreachVariation: newVariation
              };
            }
            return c;
          });
          localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(updated));
          setCandidates(updated);
        } catch (_) {}
      }

      await fetchBackendData();
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error al cambiar la variante de outreach.");
    } finally {
      setLoading(false);
    }
  };

  // Launch Semantic Dialog analysis
  const handleSemanticMatch = async () => {
    if (!cand) return;
    setIsSemanticOpen(true);
    setIsAnalyzingSemantic(true);
    try {
      const fallbackInfo = SEMANTIC_MATCH_DB[cand.name] || getDynamicMatchResult(cand);
      const liveResult = await analyzeSemanticMatchLive(
        cand.name,
        cand.role,
        cand.client,
        cand.location,
        cand.motivationNote || "",
        fallbackInfo.score
      );
      setSemanticResult(liveResult);

      if (cand.pipeId) {
        const payload = {
          f1_descubrimiento: {
            ...(cand as any).f1_descubrimiento,
            analisis_semantico: {
              origen: liveResult.source || "Gemini AI",
              fit_score: liveResult.score,
              fortalezas: liveResult.positives,
              debilidades: liveResult.negatives,
              recomendaciones: liveResult.recommendations.join(". ")
            }
          }
        };
        const res = await actualizarPipelineAPI(cand.pipeId, payload);
        if (res.success) {
          console.log("[Semantic Match] Persistido en el backend de forma física.");
        }
      }

      // Local storage sync
      const raw = localStorage.getItem("azul_ats_discovery_candidates");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SourcedCandidate[];
          const updated = parsed.map(c => {
            if (c.id === id) {
              return {
                ...c,
                score: liveResult.score
              };
            }
            return c;
          });
          localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(updated));
          setCandidates(updated);
        } catch (_) {}
      }

      await fetchBackendData();
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingSemantic(false);
    }
  };

  // Generate outreach message live using Gemini AI
  const handleGenerateOutreachLive = async () => {
    if (!cand) return;
    setIsGeneratingOutreach(true);
    try {
      const result = await generateOutreachMessageLive(
        cand.name,
        cand.role,
        cand.client,
        cand.outreachVariation
      );
      const isA = cand.outreachVariation === "A";
      const customA = isA ? result.message : cand.customOutreachA;
      const customB = !isA ? result.message : cand.customOutreachB;

      if (cand.pipeId) {
        const payload = {
          f1_descubrimiento: {
            ...(cand as any).f1_descubrimiento,
            outreach: {
              ...(cand as any).f1_descubrimiento?.outreach,
              variante_enviada: cand.outreachVariation,
              fecha_envio: new Date().toISOString()
            },
            outreach_custom: {
              customOutreachA: customA,
              customOutreachB: customB
            }
          }
        };
        const res = await actualizarPipelineAPI(cand.pipeId, payload);
        if (!res.success) {
          throw new Error(res.message || "Error al persistir el outreach en el backend.");
        }
      }

      // Local storage sync
      const raw = localStorage.getItem("azul_ats_discovery_candidates");
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as SourcedCandidate[];
          const updated = parsed.map(c => {
            if (c.id === id) {
              return {
                ...c,
                customOutreachA: customA,
                customOutreachB: customB
              };
            }
            return c;
          });
          localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(updated));
          setCandidates(updated);
        } catch (_) {}
      }

      await fetchBackendData();
    } catch (e: any) {
      console.error(e);
      alert(e.message || "Error al generar outreach con IA.");
    } finally {
      setIsGeneratingOutreach(false);
    }
  };

  // WhatsApp Triage System simulation
  const handleOpenTriage = () => {
    if (!cand) return;
    setTriageOpen(true);
    let initialLogs = [
      { sender: "bot", text: `[AzulATS WhatsApp Bot]: Hola ${cand.name}, somos del equipo de sourcing. Estamos revisando tu perfil y nos encanta de cara al puesto de ${cand.role}.` }
    ];

    if (cand.missingField === "salario") {
      initialLogs.push({ sender: "bot", text: "Para avanzar a la fase técnica, ¿podrías indicarnos tu rango de pretensiones salariales anuales?" });
    } else if (cand.missingField === "cv") {
      initialLogs.push({ sender: "bot", text: "Vemos que tu archivo de CV adjunto no se procesó correctamente en tu postulación. ¿Podrías enviarnos un PDF actualizado?" });
    } else {
      initialLogs.push({ sender: "bot", text: "¿Tendrías disponibilidad para responder un par de preguntas de screening rápido?" });
    }
    setChatMessages(initialLogs as any);
  };

  const handleSendChatMessage = () => {
    if (!chatInput.trim() || !cand) return;
    const userMsg = { sender: "user", text: chatInput } as const;
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    setTimeout(() => {
      let replyText = "";
      if (cand.missingField === "salario") {
        replyText = `Candidato (${cand.name}): "Hola. Sí, mis pretensiones salariales están en torno a los 46.000€ - 50.000€ brutos anuales, según modalidad de teletrabajo. Un saludo."`;
      } else if (cand.missingField === "cv") {
        replyText = `Candidato (${cand.name}): "¡Hola! Por supuesto, adjunto el PDF actualizado con mi última experiencia. [CV_${cand.name.replace(/ /g, "_")}_2026.pdf]"`;
      } else {
        replyText = `Candidato (${cand.name}): "Hola, de acuerdo. Quedo atento a la llamada para coordinar."`;
      }
      setChatMessages(prev => [...prev, { sender: "bot", text: replyText }]);
    }, 800);
  };

  const applyTriageResolution = () => {
    if (!cand) return;
    handleTransitionState("02_contactado", {
      motivationNote: cand.motivationNote ? `${cand.motivationNote} • Bloqueo resuelto vía Triage Bot.` : "Bloqueo resuelto vía WhatsApp Triage Bot."
    });
    setTriageOpen(false);
  };

  // Rejection modal simulation
  const handleConfirmRejection = () => {
    if (!cand) return;
    handleTransitionState("04_rechazado", {
      rejectionReason: customRejectionReason
    });
    setRejectingId(null);
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-[#101415] flex items-center justify-center text-white">
        <RefreshCw className="w-8 h-8 text-[#6bd8cb] animate-spin" />
      </div>
    );
  }

  if (!cand) {
    return (
      <div className="min-h-screen bg-[#101415] flex flex-col items-center justify-center text-white space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-400" />
        <h2 className="text-lg font-bold">{error ? "Error al cargar candidato" : "Candidato no encontrado"}</h2>
        <p className="text-xs text-[#879391] max-w-md text-center">
          {error || `El ID solicitado "${id}" no corresponde a un perfil registrado.`}
        </p>
        <div className="flex gap-2">
          {error && (
            <button 
              onClick={() => fetchBackendData()}
              className="px-4 py-2 bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 rounded-xl text-xs hover:bg-[#6bd8cb] hover:text-black transition-all font-bold"
            >
              Reintentar Conexión
            </button>
          )}
          <Link href="/descubrimiento" className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-[#6bd8cb] hover:text-black transition-all">
            Volver a F1 Descubrimiento
          </Link>
        </div>
      </div>
    );
  }


  const activeOutreachMsg = cand.outreachVariation === "A" ? cand.customOutreachA : cand.customOutreachB;
  const statusLabels = {
    "01_nuevo": "01 - Nuevo en Revisión",
    "02_contactado": "02 - Bloqueado / Pendiente",
    "03_bloqueado": "03 - En Duda a Confirmar",
    "04_rechazado": "04 - Rechazado en Fase Inicial"
  };

  const statusColors = {
    "01_nuevo": "text-indigo-400 border-indigo-500/20 bg-indigo-500/5",
    "02_contactado": "text-[#6bd8cb] border-[#6bd8cb]/20 bg-[#6bd8cb]/5",
    "03_bloqueado": "text-amber-400 border-amber-500/20 bg-amber-500/5",
    "04_rechazado": "text-rose-400 border-rose-500/20 bg-rose-500/5"
  };

  return (
    <main className="min-h-screen bg-[#101415] text-[#e0e3e5] px-4 md:px-8 py-6 selection:bg-[#6bd8cb] selection:text-stone-900">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Navigation & Actions Header */}
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <Link 
            href="/descubrimiento"
            className="flex items-center gap-2 text-xs font-bold text-[#879391] hover:text-[#6bd8cb] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a F1 Descubrimiento</span>
          </Link>

          <div className="flex items-center gap-2">
            <span title="ID de vista para prompts de desarrollo" className="text-[9px] font-mono text-[#6bd8cb]/80 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full select-all cursor-help uppercase tracking-wider font-semibold">
              ID: P-DIS-02
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

            {!isEditing ? (
              <button 
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:border-[#6bd8cb]/40 bg-[#15181a]/50 text-xs font-bold flex items-center gap-1.5 hover:text-[#6bd8cb] transition-all cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 text-[#6bd8cb]" />
                <span>Editar Candidatura</span>
              </button>
            ) : (
            <div className="flex gap-2">
              <button 
                onClick={handleSave}
                className="px-3.5 py-1.5 rounded-xl bg-[#6bd8cb] hover:bg-[#6bd8cb]/95 text-stone-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Cambios</span>
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  syncEditForm(cand);
                }}
                className="px-3.5 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            </div>
          )}
        </div>
        </div>

        {/* Detail Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Area: F1 Discovery Card */}
          <div className="lg:col-span-2 space-y-6">

            {/* Tarjeta Banner Glassmorphic de Búsqueda Relacionada (Destacado) */}
            <div className="glass-panel rounded-3xl p-5 border border-[#6bd8cb]/30 bg-gradient-to-r from-[#6bd8cb]/10 via-[#15181a] to-[#15181a] relative overflow-hidden shadow-lg shadow-[#6bd8cb]/5">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-[#6bd8cb]/15 border border-[#6bd8cb]/30 text-[#6bd8cb] shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 text-left">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider text-[#6bd8cb] font-bold block">
                        Búsqueda Relacionada al Pipeline
                      </span>
                      {activeBusquedaObj?.codigo_busqueda && (
                        <span className="px-2 py-0.5 rounded-md bg-[#6bd8cb]/20 border border-[#6bd8cb]/30 text-[#6bd8cb] font-mono text-[10px] font-bold select-all">
                          {activeBusquedaObj.codigo_busqueda}
                        </span>
                      )}
                      {activeBusquedaObj?.estado && (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                          {activeBusquedaObj.estado}
                        </span>
                      )}
                    </div>
                    <h2 className="text-base font-extrabold text-white tracking-tight">
                      {activeBusquedaObj?.perfil_busqueda || cand.role}
                    </h2>
                    <p className="text-xs text-[#c4c1fb] font-medium flex items-center gap-2 flex-wrap">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-[#c4c1fb]/70" />
                        Cliente: <strong className="text-white">{activeBusquedaObj?.cliente || cand.client}</strong>
                      </span>
                      {activeBusquedaObj?.ubicacion && (
                        <>
                          <span className="text-white/20">•</span>
                          <span className="flex items-center gap-1 text-[#879391]">
                            <MapPin className="w-3.5 h-3.5 text-[#6bd8cb]" />
                            {activeBusquedaObj.ubicacion}
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                </div>

                <Link
                  href="/busquedas"
                  className="px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-[#6bd8cb]/15 hover:border-[#6bd8cb]/40 hover:text-[#6bd8cb] text-xs font-bold text-white transition-all flex items-center gap-1.5 shrink-0 self-start sm:self-auto cursor-pointer"
                  title="Ver todas las búsquedas o expediente de búsqueda"
                >
                  <span>Ver Búsquedas</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>

            <div className="glass-panel rounded-3xl p-6 border border-white/10 relative overflow-hidden space-y-6">
              
              {/* Header Info */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono text-[#879391] uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/5">
                    {cand.id} • F1 Descubrimiento
                  </span>
                  
                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <label className="block text-[10px] uppercase font-bold text-white/40">Nombre del Candidato</label>
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="bg-white/5 border border-white/10 p-2 text-sm rounded-xl text-white w-full max-w-md focus:border-[#6bd8cb] focus:outline-none"
                      />
                    </div>
                  ) : (
                    <h1 className="text-xl font-bold text-white tracking-tight">{cand.name}</h1>
                  )}
                </div>

                {/* Score and Status indicators */}
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1 rounded-full border text-xs font-bold ${statusColors[cand.phase1State]}`}>
                    {statusLabels[cand.phase1State]}
                  </span>
                  <div className="px-3 py-1 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                    Fit: {isEditing ? (
                      <input 
                        type="number"
                        min="0"
                        max="100"
                        value={editScore}
                        onChange={(e) => setEditScore(Number(e.target.value))}
                        className="bg-transparent border-b border-emerald-500/50 w-10 text-center font-bold text-emerald-400 focus:outline-none"
                      />
                    ) : (
                      `${cand.score}%`
                    )}
                  </div>
                </div>
              </div>

              {/* Recruitment details metadata */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  
                  {/* Position Profile */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Puesto Vacante</span>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value)}
                        className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-white">
                        <span className="font-semibold">{cand.role}</span>
                      </div>
                    )}
                  </div>

                  {/* Client */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Cliente</span>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editClient}
                        onChange={(e) => setEditClient(e.target.value)}
                        className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[#c4c1fb]">
                        <Building2 className="w-4 h-4 text-[#c4c1fb]/70" />
                        <span>{cand.client}</span>
                      </div>
                    )}
                  </div>

                  {/* Location */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Ubicación</span>
                    {isEditing ? (
                      <input 
                        type="text"
                        value={editLocation}
                        onChange={(e) => setEditLocation(e.target.value)}
                        className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none"
                      />
                    ) : (
                      <div className="flex items-center gap-2 text-xs text-[#879391]">
                        <MapPin className="w-4 h-4 text-[#6bd8cb]/70" />
                        <span>{cand.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Canal de Ingreso (Sourcing) */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block flex items-center gap-1">
                      <Share2 className="w-3.5 h-3.5 text-[#6bd8cb]" />
                      Canal de Ingreso (Sourcing)
                    </span>
                    {isEditing ? (
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

                {/* Sourcing notes & block metrics */}
                <div className="space-y-4">
                  {/* Recruiter Notes / Notas Descubrimiento (Destacado Visualmente) */}
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-[#6bd8cb] font-bold block flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-[#6bd8cb]" />
                      Notas Descubrimiento
                    </span>
                    {isEditing ? (
                      <textarea
                        value={editRecruiterNotes}
                        onChange={(e) => setEditRecruiterNotes(e.target.value)}
                        rows={3}
                        placeholder="Escribe notas de descubrimiento para esta fase..."
                        className="bg-[#6bd8cb]/5 border border-[#6bd8cb]/30 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none resize-none"
                      />
                    ) : (
                      <div className="p-3 bg-[#6bd8cb]/10 border border-[#6bd8cb]/25 rounded-xl text-xs text-white leading-relaxed font-medium shadow-sm">
                        {cand.recruiterNotes ? cand.recruiterNotes : <span className="italic text-[#879391]">Sin notas de descubrimiento asignadas.</span>}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Notas iniciales</span>
                    {isEditing ? (
                      <textarea
                        value={editMotivation}
                        onChange={(e) => setEditMotivation(e.target.value)}
                        rows={3}
                        className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none resize-none"
                      />
                    ) : (
                      <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs text-[#879391] leading-relaxed italic">
                        {cand.motivationNote ? `"${cand.motivationNote}"` : "Ninguna nota registrada hasta ahora."}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 text-[10px] text-[#879391] border-t border-white/5 pt-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#c4c1fb]" />
                      Registro: {cand.lastChangeDate}
                    </span>
                    <span>•</span>
                    <span>TTFME: {cand.ttfme}</span>
                  </div>
                </div>
              </div>

              {/* Status details warning panels */}
              {cand.phase1State === "03_bloqueado" && (
                <div className="p-4 border border-amber-500/25 bg-amber-500/5 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>Candidatura Bloqueada por Información Faltante</span>
                  </div>
                  {isEditing ? (
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold text-amber-300">Motivo del Bloqueo</label>
                      <input 
                        type="text"
                        value={editBlockReason}
                        onChange={(e) => setEditBlockReason(e.target.value)}
                        className="bg-white/5 border border-amber-500/35 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb]"
                      />
                    </div>
                  ) : (
                    <p className="text-xs text-amber-200/90 leading-relaxed italic font-medium">
                      Motivo: "{cand.blockReason || "Sin especificar"}"
                    </p>
                  )}
                  
                  {!isEditing && (
                    <button
                      onClick={handleOpenTriage}
                      className="px-3.5 py-1.5 mt-1 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold transition-all text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Lanzar Triage WhatsApp Bot</span>
                    </button>
                  )}
                </div>
              )}

              {(cand.phase1State === "04_rechazado" || cand.rejectionReason || isEditing) && (
                <div className="p-4 border border-rose-500/25 bg-rose-500/5 rounded-2xl space-y-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                      <Ban className="w-4 h-4 shrink-0" />
                      <span>Resolución & Motivo de Rechazo / Descarte</span>
                    </div>
                    {cand.lastChangeDate && (
                      <span className="text-[10px] text-rose-300/70 font-mono">
                        {cand.lastChangeDate}
                      </span>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <label className="block text-[10px] uppercase font-bold text-rose-300">
                        Motivo del Rechazo / Descarte (Resolución)
                      </label>
                      <div className="space-y-2">
                        <select 
                          value={["Presupuesto", "Falta de Skills Técnicos", "Nivel de Inglés", "Cultura", "Oferta Declinada", "No cumple barra mínima"].includes(editRejectionReason) ? editRejectionReason : "Otro"}
                          onChange={(e) => {
                            if (e.target.value !== "Otro") {
                              setEditRejectionReason(e.target.value);
                            }
                          }}
                          className="bg-[#15181a] border border-rose-500/35 p-2 text-xs rounded-lg text-white w-full focus:border-rose-400 focus:outline-none"
                        >
                          <option value="Presupuesto">Presupuesto</option>
                          <option value="Falta de Skills Técnicos">Falta de Skills Técnicos</option>
                          <option value="Nivel de Inglés">Nivel de Inglés</option>
                          <option value="Cultura">Cultura</option>
                          <option value="Oferta Declinada">Oferta Declinada</option>
                          <option value="No cumple barra mínima">No cumple barra mínima</option>
                          <option value="Otro">Otro motivo (Personalizado...)</option>
                        </select>
                        <input
                          type="text"
                          value={editRejectionReason}
                          onChange={(e) => setEditRejectionReason(e.target.value)}
                          placeholder="Escribe o edita el motivo detallado de rechazo..."
                          className="bg-[#15181a] border border-rose-500/35 p-2 text-xs rounded-lg text-white w-full focus:border-rose-400 focus:outline-none"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-rose-200/90 flex items-center gap-2">
                        <span className="font-semibold text-rose-300">Motivo:</span>
                        <span className="font-mono bg-rose-950/60 text-rose-200 px-2.5 py-1 rounded-md border border-rose-500/20 text-xs">
                          {cand.rejectionReason || editRejectionReason || "Sin especificar"}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Social footprint */}
              <div className="border-t border-white/5 pt-5 space-y-3">
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">Enlaces Sociales & Redes</h3>
                
                {isEditing ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 block">GitHub URL</label>
                      <input 
                        type="text"
                        value={editGithub}
                        onChange={(e) => setEditGithub(e.target.value)}
                        className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full"
                        placeholder="https://github.com/..."
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-white/40 block">Portfolio URL</label>
                      <input 
                        type="text"
                        value={editPortfolio}
                        onChange={(e) => setEditPortfolio(e.target.value)}
                        className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full"
                        placeholder="https://..."
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {cand.socialLinks?.github ? (
                      <a 
                        href={cand.socialLinks.github} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 rounded-xl hover:bg-[#6bd8cb] hover:text-[#101415] text-[#6bd8cb] text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <GitFork className="w-4 h-4" />
                        <span>GitHub Profile</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-[#879391] italic bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                        GitHub sin enriquecer
                      </span>
                    )}

                    {cand.socialLinks?.portfolio ? (
                      <a 
                        href={cand.socialLinks.portfolio} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 border border-[#c4c1fb]/20 bg-[#c4c1fb]/5 rounded-xl hover:bg-[#c4c1fb] hover:text-[#101415] text-[#c4c1fb] text-xs font-bold transition-all flex items-center gap-1.5"
                      >
                        <Globe className="w-4 h-4" />
                        <span>Portafolio / Web</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </a>
                    ) : (
                      <span className="text-xs text-[#879391] italic bg-white/5 px-3 py-1.5 rounded-xl border border-white/5">
                        Portfolio sin descubrir
                      </span>
                    )}

                    {!cand.socialLinks?.github && !isEditing && (
                      <button
                        onClick={handleEnrichCandidate}
                        disabled={enriching}
                        className="p-2 border border-dashed border-[#6bd8cb]/35 bg-[#6bd8cb]/5 hover:bg-[#6bd8cb]/20 text-[#6bd8cb] text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer rounded-xl"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${enriching ? "animate-spin" : ""}`} />
                        <span>{enriching ? "Escaneando..." : "Descubrir Huella Digital"}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Acordeón Glassmorphic de Expediente Postulante (P-TAL-02) */}
              <div className="border-t border-white/10 pt-5 space-y-3 text-left">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <button
                    onClick={() => setIsTalentoAccordionOpen(!isTalentoAccordionOpen)}
                    className="flex items-center gap-2 text-left cursor-pointer group focus:outline-none"
                  >
                    <div className="p-1.5 rounded-lg bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb] group-hover:bg-[#6bd8cb] group-hover:text-stone-950 transition-all">
                      <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isTalentoAccordionOpen ? "rotate-90" : ""}`} />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-white uppercase tracking-wider group-hover:text-[#6bd8cb] transition-colors flex items-center gap-2 flex-wrap">
                        <span>Ficha Completa del Postulante (P-TAL-02)</span>
                        <span className="text-[9px] font-mono bg-white/5 text-[#879391] px-2 py-0.5 rounded-full border border-white/10">
                          {isTalentoAccordionOpen ? "Ocultar" : "Ver Expediente"}
                        </span>
                      </h3>
                      <p className="text-[10px] text-[#879391]">
                        Perfil del postulante (Skills, Inglés, Contacto, Resumen y Rubros)
                      </p>
                    </div>
                  </button>

                  {!isTalentoAccordionOpen && (
                    <div className="flex items-center gap-2 flex-wrap self-end sm:self-auto">
                      {cand.nivel_ingles && (
                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300">
                          Inglés: {cand.nivel_ingles}
                        </span>
                      )}
                      {cand.email && (
                        <a
                          href={`mailto:${cand.email}`}
                          className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 hover:text-white transition-all text-xs"
                          title={`Email: ${cand.email}`}
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {cand.telefono_movil && (
                        <span
                          className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 text-xs"
                          title={`Teléfono: ${cand.telefono_movil}`}
                        >
                          <Phone className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Vista previa reducida de Habilidades Clave en modo colapsado */}
                {!isTalentoAccordionOpen && cand.skills_principales && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {cand.skills_principales.split(",").map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] font-medium text-[#6bd8cb] bg-[#6bd8cb]/10 px-2.5 py-0.5 rounded-lg border border-[#6bd8cb]/20"
                      >
                        {skill.trim()}
                      </span>
                    ))}
                  </div>
                )}

                {/* Panel Completo Desplegado P-TAL-02 */}
                {isTalentoAccordionOpen && (
                  <div className="p-4 rounded-2xl bg-stone-950/40 border border-white/10 space-y-4 text-left">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      
                      {/* Email */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">Correo Electrónico</span>
                        {isEditing ? (
                          <input
                            type="email"
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-white font-medium">
                            <Mail className="w-3.5 h-3.5 text-[#6bd8cb]" />
                            {cand.email ? (
                              <a href={`mailto:${cand.email}`} className="hover:underline">{cand.email}</a>
                            ) : (
                              <span className="text-white/40 italic">No especificado</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Teléfono Móvil */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">Teléfono Móvil</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editTelefono}
                            onChange={(e) => setEditTelefono(e.target.value)}
                            className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none"
                          />
                        ) : (
                          <div className="flex items-center gap-2 text-white font-medium">
                            <Phone className="w-3.5 h-3.5 text-[#6bd8cb]" />
                            <span>{cand.telefono_movil || "No especificado"}</span>
                          </div>
                        )}
                      </div>

                      {/* Nivel de Inglés */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">Nivel de Inglés</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editNivelIngles}
                            onChange={(e) => setEditNivelIngles(e.target.value)}
                            placeholder="Ej: B2, C1, Nativo"
                            className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none"
                          />
                        ) : (
                          <span className="text-white font-medium">{cand.nivel_ingles || "No especificado"}</span>
                        )}
                      </div>

                      {/* Otros Idiomas */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">Otros Idiomas</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editOtrosIdiomas}
                            onChange={(e) => setEditOtrosIdiomas(e.target.value)}
                            placeholder="Ej: Francés, Alemán"
                            className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none"
                          />
                        ) : (
                          <span className="text-white font-medium">{cand.otros_idiomas || "No especificados"}</span>
                        )}
                      </div>

                      {/* Origen del candidato & Estado Revisión */}
                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">Origen del Perfil</span>
                        <span className="text-white font-medium">{cand.origen || "Postulación Directa"}</span>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] uppercase font-bold text-white/40 block">Estado Revisión General</span>
                        <span className="text-indigo-300 font-medium">{cand.estado_revision || "Pendiente"}</span>
                      </div>
                    </div>

                    {/* Habilidades Clave */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-[#6bd8cb] block">Habilidades Clave</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editSkills}
                          onChange={(e) => setEditSkills(e.target.value)}
                          placeholder="Etiquetas separadas por comas (ej: React, TypeScript, Node.js)"
                          className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none"
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {cand.skills_principales ? (
                            cand.skills_principales.split(",").map((s, idx) => (
                              <span key={idx} className="text-xs font-bold text-[#6bd8cb] bg-[#6bd8cb]/10 px-2.5 py-1 rounded-xl border border-[#6bd8cb]/20">
                                {s.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-white/40 italic">Sin habilidades clave registradas</span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Resumen Profesional */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-white/40 block">Resumen Profesional (IA / Extraído)</span>
                      {isEditing ? (
                        <textarea
                          value={editResumen}
                          onChange={(e) => setEditResumen(e.target.value)}
                          rows={3}
                          placeholder="Resumen del candidato..."
                          className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none resize-none"
                        />
                      ) : (
                        <p className="text-xs text-white/80 leading-relaxed font-medium bg-white/5 p-3 rounded-xl border border-white/5">
                          {cand.resumen || "Sin resumen profesional disponible."}
                        </p>
                      )}
                    </div>

                    {/* Rubros / Sectores */}
                    <div className="space-y-1">
                      <span className="text-[10px] uppercase font-bold text-white/40 block">Rubros y Sectores Clave</span>
                      {isEditing ? (
                        <input
                          type="text"
                          value={editRubros}
                          onChange={(e) => setEditRubros(e.target.value)}
                          placeholder="Ej: Banca, Telecom, Seguros"
                          className="bg-white/5 border border-white/10 p-2 text-xs rounded-lg text-white w-full focus:border-[#6bd8cb] focus:outline-none"
                        />
                      ) : (
                        <span className="text-xs text-white font-medium">{cand.rubros || "Sin especificar"}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Outreach message testing A/B section */}
              {cand.phase1State !== "04_rechazado" && (
                <div className="border-t border-white/5 pt-5 space-y-3 text-left">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Mensaje outreach personalizado
                    </h3>
                    <button 
                      onClick={handleToggleOutreachVariation}
                      className="text-[#6bd8cb] hover:underline text-xs font-bold flex items-center gap-1"
                    >
                      <span>Variante actual: {cand.outreachVariation}</span>
                      <span className="text-[#879391] font-normal">(Alternar A/B)</span>
                    </button>
                  </div>

                  <div className="p-3 bg-stone-950/45 border border-white/5 rounded-2xl space-y-2">
                    <p className="text-xs text-[#e0e3e5] leading-relaxed">
                      {activeOutreachMsg}
                    </p>
                    <div className="flex justify-between items-center border-t border-white/5 pt-2">
                      <button
                        onClick={handleGenerateOutreachLive}
                        disabled={isGeneratingOutreach}
                        className="text-xs text-[#c4c1fb] hover:text-white transition-colors flex items-center gap-1.5 font-bold cursor-pointer disabled:opacity-50"
                        title="Reescribir plantilla de mensaje usando IA Gemini y datos del perfil"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${isGeneratingOutreach ? "animate-spin text-purple-400" : "text-[#c4c1fb]"}`} />
                        <span>{isGeneratingOutreach ? "Escribiendo..." : "Redactar con IA"}</span>
                      </button>
                      <button
                        onClick={() => handleCopyOutreach(activeOutreachMsg)}
                        className="text-xs text-[#6bd8cb] hover:text-white transition-colors flex items-center gap-1.5 font-bold cursor-pointer"
                      >
                        {copiedOutreach ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedOutreach ? "Copiado!" : "Copiar mensaje"}</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                                    {meeting.fase || "F1 - Descubrimiento"}
                                  </span>
                                  <span>{meeting.objetivo || "Reunión de Descubrimiento"}</span>
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

            {/* Sección de Datos de Pipeline */}
            {activePipelineItem && (
              <div className="glass-panel rounded-3xl p-6 border border-white/10 text-left space-y-5">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-white/5">
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                      Datos del Pipeline de Reclutamiento
                    </h3>
                    <p className="text-[10px] text-[#879391] mt-0.5">
                      Información técnica de la relación Candidato - Búsqueda
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-[#6bd8cb] bg-[#6bd8cb]/10 px-2.5 py-1 rounded-xl border border-[#6bd8cb]/20 font-bold self-start sm:self-auto">
                    ID PIPELINE: {activePipelineItem.id}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="space-y-1 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block font-sans">ID Búsqueda Activa</span>
                    <span className="font-mono text-white/80 select-all">
                      {activeBusquedaObj?.codigo_busqueda 
                        ? `${activeBusquedaObj.codigo_busqueda} (${activePipelineItem.claves_conexion.id_busqueda})` 
                        : activePipelineItem.claves_conexion.id_busqueda}
                    </span>
                  </div>
                  <div className="space-y-1 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block font-sans">ID Postulante</span>
                    <span className="font-mono text-white/80 select-all">{activePipelineItem.claves_conexion.id_candidato}</span>
                  </div>
                  <div className="space-y-1 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block font-sans">Estado en Pipeline</span>
                    <span className="text-emerald-400 font-bold block text-sm mt-0.5 font-sans">{activePipelineItem.flujo.estado_actual}</span>
                  </div>
                  <div className="space-y-1 p-3 bg-white/5 border border-white/5 rounded-2xl">
                    <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold block font-sans">Última Modificación</span>
                    <span className="text-white/80 block mt-0.5 font-sans">
                      {activePipelineItem.flujo.fecha_ultimo_cambio 
                        ? new Date(activePipelineItem.flujo.fecha_ultimo_cambio).toLocaleString() 
                        : "No especificado"}
                    </span>
                  </div>
                </div>

                {/* Historial de transiciones de estado */}
                {activePipelineItem.flujo.historial_estados && activePipelineItem.flujo.historial_estados.length > 0 ? (
                  <div className="pt-4 border-t border-white/5 space-y-4">
                    <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">
                      Historial y Trazabilidad de Estados (SLA)
                    </span>
                    <div className="relative pl-6 border-l border-white/10 space-y-5 ml-2 pt-1 pb-1">
                      {activePipelineItem.flujo.historial_estados.map((entry, idx) => (
                        <div key={idx} className="relative space-y-1">
                          
                          {/* Punto conector */}
                          <div className={`absolute -left-[29.5px] top-1 w-2.5 h-2.5 rounded-full border border-[#101415] shadow-sm ${
                            idx === 0 
                              ? "bg-emerald-400 ring-4 ring-emerald-400/20" 
                              : "bg-[#879391]"
                          }`}></div>
                          
                          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-1">
                            <span className={`text-xs font-bold ${
                              idx === 0 ? "text-white" : "text-white/60"
                            }`}>
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

          </div>

          {/* Right Area: Interactive Actions Sidebar */}
          <div className="space-y-6">

            {/* Screening Inteligente Panel (IA) */}
            {(() => {
              const resList = activePipelineItem?.resultado_screening || 
                (activePipelineItem as any)?.resultadoScreening || 
                (activePipelineItem as any)?.f1_descubrimiento?.resultado_screening || 
                (cand as any)?.resultado_screening ||
                [];

              const effectiveCriterios = (criteriosBusqueda && criteriosBusqueda.length > 0)
                ? criteriosBusqueda
                : resList.map((r: any, idx: number) => ({
                    id: r.id_criterio || `crit-${idx}`,
                    pregunta: r.pregunta || `Criterio de Evaluación ${idx + 1}`,
                    tipo: r.es_knockout ? "knockout" : "deseable",
                    peso: r.puntaje_obtenido || 20
                  }));

              return (
                <ScreeningPanel
                  pipelineId={activePipelineItem?.id || cand?.pipeId || id}
                  criteriosBusqueda={effectiveCriterios}
                  resultadoScreening={resList}
                  fitScore={
                    activePipelineItem?.fit_score_screening ?? 
                    (activePipelineItem as any)?.fit_score ??
                    (activePipelineItem as any)?.f1_descubrimiento?.fit_score_screening ??
                    0
                  }
                  tieneKnockout={
                    activePipelineItem?.tiene_knockout ?? 
                    (activePipelineItem as any)?.tieneKnockout ??
                    (activePipelineItem as any)?.f1_descubrimiento?.tiene_knockout ??
                    false
                  }
                  fechaModificacion={
                    activePipelineItem?.fecha_modificacion_screening || 
                    (activePipelineItem as any)?.fecha_modificacion ||
                    (activePipelineItem as any)?.f1_descubrimiento?.fecha_modificacion_screening
                  }
                  onEvaluarClick={() => setIsEvalModalOpen(true)}
                />
              );
            })()}
            
            {/* Semantic diagnostics and quick actions container */}
            <div className="glass-panel rounded-3xl p-6 border border-white/10 space-y-5 text-left">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider pb-2 border-b border-white/5">
                Acciones de Pipeline F1
              </h3>

              {/* Semantic Matching Action */}
              <div className="space-y-2">
                <span className="text-[10px] uppercase font-bold text-[#879391] block">Inteligencia Artificial</span>
                <button
                  onClick={handleSemanticMatch}
                  className="w-full py-2.5 rounded-xl border border-[#c4c1fb]/20 bg-[#c4c1fb]/5 hover:bg-[#c4c1fb]/15 hover:text-white transition-all text-xs font-bold text-[#c4c1fb] flex items-center justify-center gap-2 cursor-pointer shadow shadow-[#4338ca]/5"
                >
                  <Cpu className="w-4 h-4 animate-pulse text-[#c4c1fb]" />
                  <span>Motor de Matching Semántico</span>
                </button>
              </div>

              {/* State Transitions Group */}
              <div className="space-y-2 border-t border-white/5 pt-4">
                <span className="text-[10px] uppercase font-bold text-[#879391] block">Movilidad y Estados</span>
                <div className="grid grid-cols-1 gap-2">
                  
                  {cand.phase1State === "01_nuevo" && (
                    <button
                      onClick={() => handleTransitionState("02_contactado")}
                      title="A 02 - Bloqueado / Pendiente"
                      className="px-3.5 py-2.5 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 hover:bg-[#6bd8cb] hover:text-stone-950 text-[#6bd8cb] font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow transition-all cursor-pointer"
                    >
                      <ChevronsRight className="w-4 h-4 shrink-0" />
                      <span>Avanzar estado</span>
                    </button>
                  )}

                  {cand.phase1State === "02_contactado" && (
                    <button
                      onClick={() => handleTransitionState("03_bloqueado", { 
                        blockReason: "Esperando confirmación pretensiones de sueldo y CV",
                        missingField: "salario"
                      })}
                      title="A 03 - En Duda a Confirmar"
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 hover:text-stone-950 text-amber-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ChevronsRight className="w-4 h-4 shrink-0" />
                      <span>Avanzar estado</span>
                    </button>
                  )}

                  {cand.phase1State === "03_bloqueado" && (
                    <button
                      onClick={() => handleTransitionState("04_rechazado", {
                        rejectionReason: "Falta de información en aclaración"
                      })}
                      title="A 04 - Rechazado en Fase Inicial"
                      className="px-3.5 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500 hover:text-white text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <ChevronsRight className="w-4 h-4 shrink-0" />
                      <span>Avanzar estado</span>
                    </button>
                  )}



                  {/* Action: Transfer / Move beyond phase 1 (Disponible desde cualquier estado) */}
                  <button
                    onClick={() => setIsAdvanceModalOpen(true)}
                    className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500 hover:text-stone-950 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                    title="Avanzar a Fase 2 Evaluación"
                  >
                    <UserCheck className="w-4 h-4 shrink-0" />
                    <span>Avanzar Fase</span>
                  </button>

                  {cand.phase1State !== "04_rechazado" && (
                    <button
                      onClick={() => setRejectingId(cand.id)}
                      className="px-3.5 py-2.5 rounded-xl border border-white/5 bg-white/5 hover:border-rose-500/30 hover:bg-rose-500/10 text-[#879391] hover:text-rose-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Ban className="w-4 h-4" />
                      <span>Rechazar Candidato</span>
                    </button>
                  )}

                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      {/* --- MODAL DE RECHAZO --- */}
      {rejectingId && (
        <div className="fixed inset-0 bg-[#101415]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl overflow-hidden border border-white/10 p-5 space-y-4 text-left">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-rose-400">
                <Ban className="w-4 h-4 text-rose-400" />
                <span>Confirmar Rechazo Temprano</span>
              </h3>
              <p className="text-[10px] text-[#879391] mt-1">
                Selecciona la justificación del descarte del perfil del candidato.
              </p>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] uppercase font-bold text-[#879391]">Motivo de descarte</label>
              <select
                value={customRejectionReason}
                onChange={(e) => setCustomRejectionReason(e.target.value)}
                className="w-full bg-[#15181a] border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:border-rose-400"
              >
                <option value="Presupuesto">Presupuesto</option>
                <option value="Falta de Skills Técnicos">Falta de Skills Técnicos</option>
                <option value="Nivel de Inglés">Nivel de Inglés</option>
                <option value="Cultura">Cultura</option>
                <option value="Oferta Declinada">Oferta Declinada</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                onClick={() => setRejectingId(null)}
                className="px-3.5 py-1.5 rounded-lg border border-white/10 text-xs font-bold hover:bg-white/5 text-[#879391] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmRejection}
                className="px-3.5 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-stone-950 font-bold text-xs cursor-pointer"
              >
                Confirmar Descarte
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ANALISIS SEMANTICO MODAL --- */}
      {isSemanticOpen && (
        <div className="fixed inset-0 bg-[#101415]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 p-6 space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#c4c1fb]" />
                <Sparkles className="w-3.5 h-3.5 text-[#6bd8cb] animate-pulse" />
                <span>Análisis Semántico de Inteligencia Artificial</span>
              </h3>
              <button
                onClick={() => setIsSemanticOpen(false)}
                className="text-white/40 hover:text-white transition-all text-xs font-bold cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {isAnalyzingSemantic ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <RefreshCw className="w-8 h-8 text-[#6bd8cb] animate-spin" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider animate-pulse">Analizando Compatibilidad Semántica...</h4>
                  <p className="text-[10px] text-[#879391] mt-1">
                    Procesando CV de {cand.name} vs perfil de {cand.role} en {cand.client}...
                  </p>
                </div>
              </div>
             ) : (() => {
              const info = semanticResult || SEMANTIC_MATCH_DB[cand.name] || getDynamicMatchResult(cand);
              const scoreColor = info.score >= 90 ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/5" : "text-amber-400 border-amber-500/25 bg-amber-500/5";
              return (
                <div className="space-y-4">
                  
                  {/* Summary card */}
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white">{cand.name}</h4>
                      <p className="text-[10px] text-[#879391] mt-0.5">Búsqueda: {cand.role} ({cand.client})</p>
                      {info.source && (
                        <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[8.5px] font-bold ${
                          info.source === "Gemini AI"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                            : "bg-[#879391]/10 text-[#879391]/80 border border-white/5"
                        }`}>
                          {info.source === "Gemini AI" ? "✨ Gemini AI Live" : "📋 Mock local"}
                        </span>
                      )}
                    </div>
                    <div className={`flex flex-col items-center justify-center p-2 px-3 border rounded-xl ${scoreColor}`}>
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-0.5">Fit AI</span>
                      <span className="text-lg font-bold font-mono">{info.score}%</span>
                    </div>
                  </div>

                  {/* Bullet points mapping */}
                  <div className="grid grid-cols-1 gap-3">
                    
                    {/* Strengths */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Puntos Positivos</span>
                      </h5>
                      <ul className="space-y-1 pl-4 list-disc text-[10px] text-[#879391] leading-relaxed">
                        {info.positives.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Risks/Gaps */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <h5 className="text-[10px] font-bold text-[#c4c1fb] uppercase tracking-wide flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-[#c4c1fb]" />
                        <span>Puntos Negativos / Gaps</span>
                      </h5>
                      <ul className="space-y-1 pl-4 list-disc text-[10px] text-[#879391] leading-relaxed">
                        {info.negatives.map((n, idx) => (
                          <li key={idx}>{n}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Recomendaciones</span>
                      </h5>
                      <ul className="space-y-1 pl-4 list-disc text-[10px] text-[#879391] leading-relaxed">
                        {info.recommendations.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>

                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- MOCK TRIAGE WHATSAPP CHAT MODAL --- */}
      {triageOpen && (
        <div className="fixed inset-0 bg-[#101415]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 flex flex-col h-[500px]">
            
            <div className="bg-[#15181a] p-4 border-b border-white/10 flex justify-between items-center text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0d9488]/10 border border-[#0d9488]/20 flex items-center justify-center text-[#6bd8cb]">
                  <span className="font-bold font-mono">WA</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Chat de Triage: WhatsApp Bot</h3>
                  <p className="text-[10px] text-[#879391]">Destrabando canal para {cand.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setTriageOpen(false)}
                className="text-[#879391] hover:text-white text-xs font-bold font-mono bg-white/5 p-1 px-2.5 rounded-lg border border-white/5 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Chat Logs */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 text-left text-xs bg-stone-950/20">
              {chatMessages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`max-w-[85%] rounded-2xl p-3 leading-relaxed shadow-sm ${
                    msg.sender === "user" 
                      ? "bg-[#0d9488] text-white rounded-tr-none" 
                      : "bg-[#1d2022] text-[#e0e3e5] rounded-tl-none border border-white/5"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="p-4 bg-[#15181a] border-t border-white/10 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe la respuesta del bot o candidato..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChatMessage()}
                  className="flex-grow bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#879391] focus:outline-none focus:border-[#6bd8cb]"
                />
                <button
                  onClick={handleSendChatMessage}
                  className="px-4 py-2.5 rounded-xl bg-[#6bd8cb] text-[#101415] hover:bg-[#6bd8cb]/95 font-bold text-xs flex items-center justify-center cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-[#879391]">
                  Una vez confirmados los datos requeridos, presione:
                </span>
                
                <button
                  onClick={applyTriageResolution}
                  className="px-3.5 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold transition-all text-[10px] flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Destrabar & Mover</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Emergente Mejorado: Confirmar Cambio de Fase a Evaluación */}
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
                ¿Avanzar a Fase 2 (Evaluación Interna)?
              </h3>
              <p className="text-xs text-[#879391] leading-relaxed">
                Estás a punto de avanzar el expediente de <strong className="text-white">{cand.name}</strong> a <strong className="text-[#6bd8cb]">Fase 2 (Evaluación Interna - Módulo de Selección)</strong>.
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

      {/* --- MODAL DE CREAR / EDITAR REUNIÓN (FASE 1) --- */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 bg-[#101415]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-md rounded-3xl overflow-hidden border border-white/10 p-6 space-y-5 text-left">
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#6bd8cb]" />
                <span>{editingMeeting ? "Editar Reunión (Fase 1)" : "Nueva Reunión (Fase 1)"}</span>
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
                  placeholder="Ej: Screening de encaje cultural y expectativas"
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
                  Fase 1 • Descubrimiento
                </p>
              </div>
            </div>

            <p className="text-xs text-[#e0e3e5] leading-relaxed">
              ¿Estás seguro de que deseas eliminar esta reunión de la fase de descubrimiento? Esta acción actualizará el pipeline.
            </p>

            <div className="flex justify-end gap-2 pt-3 border-t border-white/5">
              <button
                onClick={() => setDeletingMeetingId(null)}
                className="px-4 py-2 rounded-xl border border-white/10 text-xs font-bold hover:bg-white/5 text-[#879391] cursor-pointer transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmDeleteMeetingAction}
                disabled={savingMeeting}
                className="px-4 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-stone-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-md shadow-rose-500/20"
              >
                {savingMeeting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{savingMeeting ? "Eliminando..." : "Eliminar Reunión"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Inferencia IA de Screening */}
      <EvaluarScreeningModal
        isOpen={isEvalModalOpen}
        onClose={() => setIsEvalModalOpen(false)}
        pipelineId={activePipelineItem?.id || cand?.pipeId || id}
        candidateName={cand?.name || ""}
        busquedaName={activeBusquedaObj?.perfil_busqueda ? `${activeBusquedaObj.perfil_busqueda} (${activeBusquedaObj.cliente})` : (cand?.role || "Búsqueda activa")}
        criteriosBusqueda={criteriosBusqueda}
        hasCv={Boolean(cand?.url_cv)}
        onSuccess={() => fetchBackendData(true)}
      />

    </main>
  );
}
