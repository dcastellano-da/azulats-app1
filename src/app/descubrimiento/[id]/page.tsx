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
  X
} from "lucide-react";
import { analyzeSemanticMatchLive, generateOutreachMessageLive, SemanticMatchResult } from "@/lib/gemini";

interface SourcedCandidate {
  id: string;
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
  socialLinks?: {
    github?: string;
    stackoverflow?: string;
    portfolio?: string;
  };
  rejectionReason?: string;
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

export default function SourcedCandidateDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [candidates, setCandidates] = useState<SourcedCandidate[]>([]);
  const [cand, setCand] = useState<SourcedCandidate | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editClient, setEditClient] = useState("");
  const [editLocation, setEditLocation] = useState("");
  const [editMotivation, setEditMotivation] = useState("");
  const [editScore, setEditScore] = useState(80);
  const [editGithub, setEditGithub] = useState("");
  const [editPortfolio, setEditPortfolio] = useState("");
  const [editBlockReason, setEditBlockReason] = useState("");
  const [editRejectionReason, setEditRejectionReason] = useState("");

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

  // Auth Guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Load from localStorage
  useEffect(() => {
    const raw = localStorage.getItem("azul_ats_discovery_candidates");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as SourcedCandidate[];
        setCandidates(parsed);
        const found = parsed.find(c => c.id === id);
        if (found) {
          setCand(found);
          syncEditForm(found);
        } else {
          setCand(null);
        }
      } catch (e) {
        console.error("Error reading localStorage", e);
      }
    }
    setLoading(false);
  }, [id]);

  const syncEditForm = (c: SourcedCandidate) => {
    setEditName(c.name || "");
    setEditRole(c.role || "");
    setEditClient(c.client || "");
    setEditLocation(c.location || "");
    setEditMotivation(c.motivationNote || "");
    setEditScore(c.score || 80);
    setEditGithub(c.socialLinks?.github || "");
    setEditPortfolio(c.socialLinks?.portfolio || "");
    setEditBlockReason(c.blockReason || "");
    setEditRejectionReason(c.rejectionReason || "");
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

  const handleSave = () => {
    if (!editName.trim() || !editRole.trim() || !editClient.trim()) {
      alert("El nombre, puesto y cliente son campos obligatorios.");
      return;
    }

    const updated = candidates.map(c => {
      if (c.id === id) {
        return {
          ...c,
          name: editName.trim(),
          role: editRole.trim(),
          client: editClient.trim(),
          location: editLocation.trim(),
          motivationNote: editMotivation.trim(),
          score: Number(editScore),
          socialLinks: {
            ...c.socialLinks,
            github: editGithub.trim() || undefined,
            portfolio: editPortfolio.trim() || undefined
          },
          blockReason: c.phase1State === "03_bloqueado" ? editBlockReason.trim() : c.blockReason,
          rejectionReason: c.phase1State === "04_rechazado" ? editRejectionReason : c.rejectionReason,
          lastChangeDate: "Recién editado"
        };
      }
      return c;
    });

    handleUpdateCandidatesList(updated);
    setIsEditing(false);
  };

  const handleTransitionState = (newState: SourcedCandidate["phase1State"], params?: Partial<SourcedCandidate>) => {
    const updated = candidates.map(c => {
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
    handleUpdateCandidatesList(updated);
  };

  // Simulated Action: Enrich / Scrape digital footprint
  const handleEnrichCandidate = () => {
    if (!cand) return;
    setEnriching(true);
    setTimeout(() => {
      const updated = candidates.map(c => {
        if (c.id === id) {
          return {
            ...c,
            socialLinks: {
              ...c.socialLinks,
              github: c.socialLinks?.github || `https://github.com/${c.name.toLowerCase().replace(/ /g, "")}`,
              portfolio: c.socialLinks?.portfolio || `https://${c.name.toLowerCase().replace(/ /g, "")}.dev`
            }
          };
        }
        return c;
      });
      handleUpdateCandidatesList(updated);
      setEnriching(false);
      alert("Huella digital enriquecida! Enlaces de portafolio y Github generados con Inteligencia Artificial.");
    }, 1200);
  };

  // Simulated Action: Copy Outreach message template
  const handleCopyOutreach = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedOutreach(true);
    setTimeout(() => setCopiedOutreach(false), 2000);
  };

  // Switch outreach variation template
  const handleToggleOutreachVariation = () => {
    if (!cand) return;
    const updated = candidates.map(c => {
      if (c.id === id) {
        return {
          ...c,
          outreachVariation: (c.outreachVariation === "A" ? "B" : "A") as "A" | "B"
        };
      }
      return c;
    });
    handleUpdateCandidatesList(updated);
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
      const updated = candidates.map(c => {
        if (c.id === id) {
          const isA = c.outreachVariation === "A";
          return {
            ...c,
            customOutreachA: isA ? result.message : c.customOutreachA,
            customOutreachB: !isA ? result.message : c.customOutreachB
          };
        }
        return c;
      });
      handleUpdateCandidatesList(updated);
    } catch (e) {
      console.error(e);
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
        <h2 className="text-lg font-bold">Candidato no encontrado</h2>
        <p className="text-xs text-[#879391]">El ID solicitado "{id}" no corresponde a un perfil registrado.</p>
        <Link href="/descubrimiento" className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-xs hover:bg-[#6bd8cb] hover:text-black transition-all">
          Volver a F1 Descubrimiento
        </Link>
      </div>
    );
  }

  const activeOutreachMsg = cand.outreachVariation === "A" ? cand.customOutreachA : cand.customOutreachB;
  const statusLabels = {
    "01_nuevo": "01 - Nuevo (Para Revisión)",
    "02_contactado": "02 - Contactado",
    "03_bloqueado": "03 - Bloqueado / Pendientes",
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

        {/* Detail Body */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Area: F1 Discovery Card */}
          <div className="lg:col-span-2 space-y-6">
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

                </div>

                {/* Sourcing notes & block metrics */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider text-white/30 font-bold block">Notas de Sourcing / Motivación</span>
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

              {cand.phase1State === "04_rechazado" && (
                <div className="p-4 border border-rose-500/25 bg-rose-500/5 rounded-2xl space-y-2 text-left">
                  <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
                    <Ban className="w-4 h-4 shrink-0" />
                    <span>Candidato Descartado en Fase Inicial</span>
                  </div>
                  {isEditing ? (
                    <div className="space-y-1">
                      <label className="block text-[9px] uppercase font-bold text-rose-300">Motivo del Rechazo</label>
                      <select 
                        value={editRejectionReason}
                        onChange={(e) => setEditRejectionReason(e.target.value)}
                        className="bg-[#15181a] border border-rose-500/35 p-2 text-xs rounded-lg text-white w-full"
                      >
                        <option value="Presupuesto">Presupuesto</option>
                        <option value="Falta de Skills Técnicos">Falta de Skills Técnicos</option>
                        <option value="Nivel de Inglés">Nivel de Inglés</option>
                        <option value="Cultura">Cultura</option>
                        <option value="Oferta Declinada">Oferta Declinada</option>
                      </select>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-200/90">
                      Motivo: <span className="font-mono bg-rose-950/45 px-2 py-0.5 rounded border border-rose-500/10 uppercase tracking-wide text-[10px]">{cand.rejectionReason || "Sin especificar"}</span>
                    </p>
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
          </div>

          {/* Right Area: Interactive Actions Sidebar */}
          <div className="space-y-6">
            
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
                      className="px-3.5 py-2.5 rounded-xl bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 hover:bg-[#6bd8cb] hover:text-stone-950 text-[#6bd8cb] font-bold text-xs flex items-center justify-center gap-1 hover:shadow transition-all cursor-pointer"
                    >
                      <span>Marcar como Contactado</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}

                  {cand.phase1State === "02_contactado" && (
                    <button
                      onClick={() => handleTransitionState("03_bloqueado", { 
                        blockReason: "Esperando confirmación pretensiones de sueldo y CV",
                        missingField: "salario"
                      })}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500 hover:text-stone-950 text-amber-400 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                    >
                      <span>Bloquear Candidatura</span>
                    </button>
                  )}

                  {cand.phase1State === "03_bloqueado" && (
                    <button
                      onClick={handleOpenTriage}
                      className="px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0 shadow"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>Resolver con Triage Bot</span>
                    </button>
                  )}

                  {cand.phase1State === "04_rechazado" && (
                    <button
                      onClick={() => handleTransitionState("01_nuevo")}
                      className="px-3.5 py-2.5 rounded-xl bg-[#6bd8cb]/15 border border-[#6bd8cb]/20 text-[#6bd8cb] hover:bg-[#6bd8cb] hover:text-stone-950 font-bold text-xs text-center transition-all cursor-pointer"
                    >
                      Reactivar en Backlog (Nuevo)
                    </button>
                  )}

                  {(cand.phase1State === "02_contactado" || cand.phase1State === "01_nuevo") && (
                    <button
                      onClick={() => alert(`El candidato ${cand.name} ha avanzado a Fase 2 (Evaluación Interna - Módulo de Selección).`)}
                      className="px-3.5 py-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/20 hover:bg-emerald-500 hover:text-stone-950 text-emerald-400 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
                      title="Avanzar candidato a Filtrados Fase 2"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Avanzar a Selección (Fase 2)</span>
                    </button>
                  )}

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

    </main>
  );
}
