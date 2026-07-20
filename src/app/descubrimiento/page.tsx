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
  Filter,
  Contact,
  Settings,
  Sparkles,
  AlertCircle,
  HelpCircle,
  Clock,
  ExternalLink,
  MessageSquare,
  GitFork,
  Globe,
  Plus,
  Send,
  FileText,
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
  Minimize2
} from "lucide-react";
import { analyzeSemanticMatchLive, generateBooleanQueryLive, SemanticMatchResult } from "@/lib/gemini";

// Candidate interface for Phase 1
interface SourcedCandidate {
  id: string;
  name: string;
  role: string;
  client: string;
  location: string;
  phase1State: "01_nuevo" | "02_contactado" | "03_bloqueado" | "04_rechazado";
  score: number;
  lastChangeDate: string;
  ttfme: string; // Time to First Meaningful Engagement
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
      "Falta de experiencia concreta operando sistemas fintech de alta latencia."
    ],
    recommendations: [
      "Iniciar contacto telefónico para aclarar expectativa salarial y flexibilidad antes de agendar entrevista formal.",
      "Descartar si se ratifica en el mínimo de 65.000€ intransigentes."
    ]
  },
  "María Belmonte": {
    score: 91,
    positives: [
      "Impecable bagaje conceptual en testeos y analíticas A/B cuantitativas y cualitativas.",
      "Habilidades comunicativas superiores y excelente liderazgo UX en Retail global.",
      "Enfoque directo a métricas de retención y conversión."
    ],
    negatives: [
      "Ubicación presencial en La Coruña cuando el cliente prioriza Madrid.",
      "Manejo superficial de lenguajes de maquetación (HTML/CSS)."
    ],
    recommendations: [
      "Confirmar predisposición a viajar o traslados temporales.",
      "Contrastar portafolio centrado en metodologías de User Research."
    ]
  },
  "Elena Montes": {
    score: 97,
    positives: [
      "Excepcional portafolio UX/UI enfocado en e-commerce y sectores afines en Inditex.",
      "Profundo dominio de Figma, prototipado avanzado y arquitectura de la información.",
      "Disponibilidad de incorporación inmediata y residencia en Madrid."
    ],
    negatives: [
      "Conocimientos técnicos de programación en frameworks React limitados.",
      "Poca experiencia en entornos puramente ágiles tipo Spotify squads."
    ],
    recommendations: [
      "Avanzar velozmente a fase de revisión de portafolio visual con equipo de diseño.",
      "Indagar sobre su método preferido para colaborar con desarrolladores front-end."
    ]
  },
  "Victor Rueda": {
    score: 83,
    positives: [
      "Diseñador de interacción experto enfocado en arquetipos de usuario e interacción de flujos.",
      "Conocimientos profundos sobre metodologías cuantitativas y optimización heurística.",
      "Excelentes soft-skills demostrados."
    ],
    negatives: [
      "Competencias menores en diseño de layouts estéticos sumamente detallados.",
      "Sin experiencia previa con marcas masivas/escalas de tráfico global."
    ],
    recommendations: [
      "Focalizar screening inicial en diseño de interacción y flujos lógicos.",
      "Analizar ejercicios pasados de wireframing y user journeys de baja fidelidad."
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

// Global mockup active searches
const ACTIVE_BUSQUEDAS = [
  { id: "REQ-001", client: "Telefónica S.A.", role: "Senior React Developer" },
  { id: "REQ-002", client: "SEAT S.A.", role: "Software Architect Rust" },
  { id: "REQ-003", client: "Banco Santander", role: "Cloud Security Expert" },
  { id: "REQ-004", client: "Inditex S.A.", role: "UX/UI Designer" },
  { id: "REQ-005", client: "Mercadona S.A.", role: "Backend Python Developer" },
  { id: "REQ-006", client: "Amadeus España", role: "Frontend React Native Developer" }
];

const INITIAL_SOURCED_CANDIDATES: SourcedCandidate[] = [
    {
      id: "C-301",
      name: "Diego Lozano",
      role: "Software Architect Rust",
      client: "SEAT S.A.",
      location: "Barcelona / Remoto",
      phase1State: "01_nuevo",
      score: 94,
      lastChangeDate: "Hace 2 horas",
      ttfme: "--",
      outreachVariation: "A",
      customOutreachA: "Hola Diego, vi tu excelente trabajo en el repositorio de WebAssembly para sistemas embebidos de SEAT. Nos entusiasma tu perfil para liderar la arquitectura en...",
      customOutreachB: "Hola Diego, estamos buscando un Arquitecto Rust para SEAT. ¿Te interesaría conocer los detalles del puesto?",
      motivationNote: "Interesado en metodologías ágiles y arquitecturas edge de baja latencia."
    },
    {
      id: "C-302",
      name: "María Belmonte",
      role: "UX Research Lead",
      client: "Inditex S.A.",
      location: "La Coruña / Híbrido",
      phase1State: "02_contactado",
      score: 91,
      lastChangeDate: "Hace 1 día",
      ttfme: "1.2d",
      outreachVariation: "A",
      customOutreachA: "Hola María, tu investigación sobre diseño centrado en el usuario de retail digital es asombrosa. En Inditex queremos invitarte a liderar el... ",
      customOutreachB: "Hola María, hay una posición abierta de UX Research Lead en Inditex. ¿Hablamos esta semana?",
      motivationNote: "Especialista en e-commerce y testeos A/B a gran escala.",
      socialLinks: {
        portfolio: "https://mariabelmonte.design"
      }
    },
    {
      id: "C-303",
      name: "Carlos Tejera",
      role: "Principal Data Engineer",
      client: "Telefónica S.A.",
      location: "Madrid / Remoto España",
      phase1State: "03_bloqueado",
      score: 87,
      lastChangeDate: "Hace 3 días",
      ttfme: "2.1d",
      outreachVariation: "A",
      customOutreachA: "Hola Carlos, tus aportes en Spark y lagos de datos híbridos son notables en la comunidad de BigData España. En Telefónica buscamos tu expertise para...",
      customOutreachB: "Hola Carlos, ¿cómo estás? Te contacto por una vacante de Data Engineer para Telefónica. Avísame si estás disponible.",
      blockReason: "Falta pretensión salarial",
      missingField: "salario",
      motivationNote: "Lidera comunidades locales de Cassandra y Kafka.",
      socialLinks: {
        github: "https://github.com/ctejera-data",
        stackoverflow: "https://stackoverflow.com/users/ctejera"
      }
    },
    {
      id: "C-304",
      name: "Marta Galiano",
      role: "DevOps / SRE Lead",
      client: "Banco Santander",
      location: "Madrid / Presencial",
      phase1State: "03_bloqueado",
      score: 96,
      lastChangeDate: "Hace 12 horas",
      ttfme: "1.8d",
      outreachVariation: "B",
      customOutreachA: "Hola Marta, sigo tus artículos sobre Kubernetes y seguridad multinube. En Santander estamos construyendo la nueva división sandbox de Cloud Sec...",
      customOutreachB: "Hola Marta, ¿qué tal? Vimos tu experiencia como DevOps en finanzas. Nos gustaría ver si encajas en el equipo de Cloud de Santander. ¿Revisamos?",
      blockReason: "Falta CV PDF actualizado",
      missingField: "cv",
      motivationNote: "Certificada en GCP Cloud Security Professional y CKA."
    },
    {
      id: "C-305",
      name: "Alberto Ruiz",
      role: "Backend Python Developer",
      client: "Mercadona S.A.",
      location: "Valencia / Híbrido",
      phase1State: "04_rechazado",
      score: 79,
      lastChangeDate: "Hace 4 días",
      ttfme: "1.0d",
      outreachVariation: "B",
      customOutreachA: "Hola Alberto, tu perfil en microservicios Django encaja excelente con el backend de logística de Mercadona. Te gustaría...",
      customOutreachB: "Hola Alberto, buscamos desarrollador backend Django para Mercadona. ¿Tienes interés en escuchar la oferta?",
      rejectionReason: "Presupuesto",
      motivationNote: "Pretensiones salariales fuera de rango (65.000€ vs tope de 52.000€)."
    },
    {
      id: "C-306",
      name: "Lucía Pousa",
      role: "Frontend React Native Developer",
      client: "Amadeus España",
      location: "Madrid / Remoto",
      phase1State: "04_rechazado",
      score: 82,
      lastChangeDate: "Hace 2 días",
      ttfme: "1.5d",
      outreachVariation: "A",
      customOutreachA: "Hola Lucía, vi tu app móvil open-source de reserva de billetes. En Amadeus estamos estructurando el equipo NextGen Mobile y...",
      customOutreachB: "Hola Lucía, ¿te interesa un cambio? Buscamos desarrollador React Native en Amadeus España. Avísame si comentamos.",
      rejectionReason: "Nivel de Inglés",
      motivationNote: "El puesto exige nivel C1 fluido conversación. Candidata cuenta con B1/B2."
    }
];

export default function DescubrimientoPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  // States
  const [candidates, setCandidates] = useState<SourcedCandidate[]>([]);
  const [candidatesLoaded, setCandidatesLoaded] = useState(false);

  useEffect(() => {
    const raw = localStorage.getItem("azul_ats_discovery_candidates");
    if (raw) {
      try {
        setCandidates(JSON.parse(raw));
      } catch (e) {
        setCandidates(INITIAL_SOURCED_CANDIDATES);
      }
    } else {
      setCandidates(INITIAL_SOURCED_CANDIDATES);
      localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(INITIAL_SOURCED_CANDIDATES));
    }
    setCandidatesLoaded(true);
  }, []);

  useEffect(() => {
    if (candidatesLoaded) {
      localStorage.setItem("azul_ats_discovery_candidates", JSON.stringify(candidates));
    }
  }, [candidates, candidatesLoaded]);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSearch, setSelectedSearch] = useState("Todos");
  const [copiedOutreachId, setCopiedOutreachId] = useState<string | null>(null);
  const [activeMetricHelp, setActiveMetricHelp] = useState<string | null>(null);

  // States for interactive simulations
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  
  // Triage Bot Dialog State
  const [triageCand, setTriageCand] = useState<SourcedCandidate | null>(null);
  const [chatMessages, setChatMessages] = useState<{ sender: "user" | "bot"; text: string }[]>([]);
  const [inputText, setInputText] = useState("");

  // Ingest Inteligente State (Parser LLM)
  const [isIngestOpen, setIsIngestOpen] = useState(false);
  const [ingestCvText, setIngestCvText] = useState("");
  const [ingestJobId, setIngestJobId] = useState("REQ-001");
  const [parsingCv, setParsingCv] = useState(false);

  // Boolean & X-Ray Search State
  const [isBooleanSearchOpen, setIsBooleanSearchOpen] = useState(false);
  const [booleanKeywords, setBooleanKeywords] = useState("");
  const [booleanExclude, setBooleanExclude] = useState("");
  const [booleanLocation, setBooleanLocation] = useState("");
  const [booleanJobId, setBooleanJobId] = useState("REQ-002");
  const [booleanOutputString, setBooleanOutputString] = useState("");
  const [xrayOutputString, setXrayOutputString] = useState("");
  const [isGeneratingQueries, setIsGeneratingQueries] = useState(false);
  const [simulatedImportDone, setSimulatedImportDone] = useState(false);
  const [copiedBoolean, setCopiedBoolean] = useState(false);
  const [copiedXray, setCopiedXray] = useState(false);
  const [booleanSource, setBooleanSource] = useState<"Gemini AI" | "Mock Database" | null>(null);

  // Semantic Matching Engine State
  const [isSemanticOpen, setIsSemanticOpen] = useState(false);
  const [semanticCandidate, setSemanticCandidate] = useState<SourcedCandidate | null>(null);
  const [isAnalyzingSemantic, setIsAnalyzingSemantic] = useState(false);
  const [semanticResult, setSemanticResult] = useState<SemanticMatchResult | null>(null);

  // List View and Status Filter State
  const [viewMode, setViewMode] = useState<"kanban" | "lista">("kanban");
  const [filterStatus, setFilterStatus] = useState<string>("Todos");
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isFullScreen, setIsFullScreen] = useState(false);

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortField(null);
        setSortDirection("asc");
      }
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Rejection Reason Prompt State
  const [pendingRejectionCand, setPendingRejectionCand] = useState<{ id: string } | null>(null);

  // Client-side authentication protection
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

  // --- Handlers for mock functionalities ---

  // Move candidate to state helper
  const handleTransitionState = (id: string, nextState: SourcedCandidate["phase1State"], customFieldUpdates: Partial<SourcedCandidate> = {}) => {
    setCandidates((prev) => 
      prev.map((c) => {
        if (c.id === id) {
          // Clear blocker details if leaving 03_bloqueado
          const updates: Partial<SourcedCandidate> = { ...customFieldUpdates };
          if (c.phase1State === "03_bloqueado" && nextState !== "03_bloqueado") {
            updates.blockReason = undefined;
            updates.missingField = undefined;
          }
          // Clear rejection reason if leaving 04_rechazado
          if (c.phase1State === "04_rechazado" && nextState !== "04_rechazado") {
            updates.rejectionReason = undefined;
          }
          return {
            ...c,
            phase1State: nextState,
            lastChangeDate: "Ahora mismo",
            ...updates
          };
        }
        return c;
      })
    );
  };

  // Launch Rejection Flow
  const triggerRejectionFlow = (id: string) => {
    setPendingRejectionCand({ id });
  };

  // Resolve Rejection Reason
  const submitRejection = (reason: string) => {
    if (!pendingRejectionCand) return;
    handleTransitionState(pendingRejectionCand.id, "04_rechazado", {
      rejectionReason: reason
    });
    setPendingRejectionCand(null);
  };

  // Enriquecedor de Huella Digital (Digital Footprint Enrichment)
  const handleEnrichCandidate = (id: string, name: string) => {
    setEnrichingId(id);
    
    // Simulate API scraping delayed reaction
    setTimeout(() => {
      setCandidates((prev) => 
        prev.map((c) => {
          if (c.id === id) {
            const domain = name.toLowerCase().replace(/\s/g, "");
            return {
              ...c,
              score: Math.min(100, c.score + 2), // Boost score by 2% due to clean matching metadata
              socialLinks: {
                github: `https://github.com/${domain}`,
                stackoverflow: `https://stackoverflow.com/users/${domain}`,
                portfolio: `https://${domain}.dev`
              }
            };
          }
          return c;
        })
      );
      setEnrichingId(null);
    }, 1500);
  };

  // Triage Bot Dialog (WhatsApp Simulation)
  const openTriageDialog = (cand: SourcedCandidate) => {
    setTriageCand(cand);
    let initialGreeting = "";
    if (cand.missingField === "salario") {
      initialGreeting = `Recruiter Bot: "Hola Carlos, te contactamos de Azul ATS. Para poder continuar, ¿nos podrías confirmar tu expectativa salarial anual bruta aproximada para este puesto en España?"`;
    } else if (cand.missingField === "cv") {
      initialGreeting = `Recruiter Bot: "Hola Marta, te escribimos de Azul ATS sobre la vacante de Santander. Necesitamos tu CV actualizado en PDF para completar el perfil. ¿Nos lo podrías pasar por aquí?"`;
    } else {
      initialGreeting = `Recruiter Bot: "Hola, te contactamos de Azul ATS. Nos gustaría validar un dato pendiente para continuar con el proceso. ¿Tiene un momento?"`;
    }

    setChatMessages([
      { sender: "bot", text: initialGreeting }
    ]);
  };

  const handleSendChatMessage = () => {
    if (!inputText.trim() || !triageCand) return;

    const userMsg = inputText.trim();
    setChatMessages((prev) => [...prev, { sender: "user", text: userMsg }]);
    setInputText("");

    // Simulate Candidate automated reply
    setTimeout(() => {
      let replyText = "";
      if (triageCand.missingField === "salario") {
        replyText = `Candidato (${triageCand.name}): "Hola. Sí, mis pretensiones salariales están en torno a los 46.000€ - 50.000€ brutos anuales, según modalidad de teletrabajo. Un saludo."`;
      } else if (triageCand.missingField === "cv") {
        replyText = `Candidato (${triageCand.name}): "¡Hola! Por supuesto, adjunto el PDF actualizado con mi última experiencia en Microservicios y AWS. [CV_Marta_Galiano_2026.pdf]"`;
      } else {
        replyText = `Candidato (${triageCand.name}): "Hola, de acuerdo. Quedo atento a la llamada para coordinar."`;
      }

      setChatMessages((prev) => [
        ...prev,
        { sender: "bot", text: replyText }
      ]);
    }, 1000);
  };

  // Apply Triage Resolution
  const applyTriageResolution = () => {
    if (!triageCand) return;
    // Fast destrabar: move from Bloqueado to Contactado (and clear blockers)
    handleTransitionState(triageCand.id, "02_contactado", {
      motivationNote: triageCand.motivationNote ? `${triageCand.motivationNote} • Bloqueo resuelto vía Triage Bot.` : "Bloqueo resuelto vía WhatsApp Triage Bot."
    });
    setTriageCand(null);
  };

  // Parser LLM CV Upload Simulation
  const handleIngestSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ingestCvText.trim()) return;

    setParsingCv(true);

    const selectedSearchObj = ACTIVE_BUSQUEDAS.find((b) => b.id === ingestJobId);
    const client = selectedSearchObj?.client || "Telefónica S.A.";
    const role = selectedSearchObj?.role || "Senior React Developer";

    // Simulate LLM parsing process
    setTimeout(() => {
      const cvTextLower = ingestCvText.toLowerCase();
      
      let name = "Candidato Autoparsed";
      if (cvTextLower.includes("diego") || cvTextLower.includes("javier")) {
        name = "Javier Galdón";
      } else if (cvTextLower.includes("lucia") || cvTextLower.includes("ana")) {
        name = "Ana Belén Silva";
      } else {
        const lines = ingestCvText.split("\n");
        if (lines[0] && lines[0].length < 30) {
          name = lines[0];
        } else {
          name = "Clara Valenzuela";
        }
      }

      let score = 85 + Math.floor(Math.random() * 12);

      const newCand: SourcedCandidate = {
        id: `C-${300 + candidates.length + 1}`,
        name,
        role,
        client,
        location: "Madrid / Remoto",
        phase1State: "01_nuevo",
        score,
        lastChangeDate: "Recién Ingestado",
        ttfme: "--",
        outreachVariation: "A",
        customOutreachA: `Hola ${name.split(" ")[0]}, analicé tu CV mediante nuestro parser avanzado LLM. Tu experiencia se alinea perfectamente con la posición en ${client}...`,
        customOutreachB: `Estimado/a ${name.split(" ")[0]}, ¿te gustaría comentar la vacante de ${role} en ${client}?`,
        motivationNote: "CV extraído automáticamente usando Parser LLM de Azul ATS."
      };

      setCandidates((prev) => [newCand, ...prev]);
      setParsingCv(false);
      setIsIngestOpen(false);
      setIngestCvText("");
    }, 1800);
  };

  // Copy Outreach Message
  const handleCopyOutreach = (id: string, text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        setCopiedOutreachId(id);
        setTimeout(() => setCopiedOutreachId(null), 2000);
      });
  };

  // Toggle outreach variation
  const toggleOutreachVariation = (id: string) => {
    setCandidates((prev) => 
      prev.map((c) => {
        if (c.id === id) {
          return {
            ...c,
            outreachVariation: c.outreachVariation === "A" ? "B" : "A"
          };
        }
        return c;
      })
    );
  };

  const handleSemanticMatch = async (cad: SourcedCandidate) => {
    setSemanticCandidate(cad);
    setIsSemanticOpen(true);
    setIsAnalyzingSemantic(true);
    try {
      const fallbackInfo = SEMANTIC_MATCH_DB[cad.name] || getDynamicMatchResult(cad);
      const liveResult = await analyzeSemanticMatchLive(
        cad.name,
        cad.role,
        cad.client,
        cad.location,
        cad.motivationNote || "",
        fallbackInfo.score
      );
      setSemanticResult(liveResult);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAnalyzingSemantic(false);
    }
  };

  const handleGenerateQueries = async () => {
    if (!booleanKeywords.trim()) return;
    setIsGeneratingQueries(true);
    try {
      const selectedReq = ACTIVE_BUSQUEDAS.find((b) => b.id === booleanJobId) || ACTIVE_BUSQUEDAS[1];
      const resultObj = await generateBooleanQueryLive(
        booleanKeywords,
        booleanExclude,
        booleanLocation,
        `${selectedReq.role} (${selectedReq.client})`
      );
      setBooleanOutputString(resultObj.query);
      setBooleanSource(resultObj.source);
      
      const keywordsArray = booleanKeywords.split(",").map(k => k.trim()).filter(Boolean);
      let xrayStr = `site:linkedin.com/in/ OR site:linkedin.com/pub/ -intitle:profiles -inurl:dir`;
      keywordsArray.forEach(k => {
        xrayStr += ` "${k}"`;
      });
      if (booleanLocation.trim()) {
        xrayStr += ` "${booleanLocation.trim()}"`;
      }
      if (booleanExclude.trim()) {
        const excludesArray = booleanExclude.split(",").map(e => e.trim()).filter(Boolean);
        excludesArray.forEach(e => {
          xrayStr += ` -"${e}"`;
        });
      }
      setXrayOutputString(xrayStr);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingQueries(false);
    }
  };

  const handleSimulatedImport = () => {
    const selectedSe = ACTIVE_BUSQUEDAS.find((b) => b.id === booleanJobId) || ACTIVE_BUSQUEDAS[1];
    const client = selectedSe.client;
    const role = selectedSe.role;

    // Create 2 mock candidates
    const score1 = 88 + Math.floor(Math.random() * 11);
    const score2 = 82 + Math.floor(Math.random() * 12);
    
    // Choose names according to role
    let name1 = "Marta Galiano";
    let name2 = "Javier Galdón";
    let note1 = "Perfil senior importado mediante herramienta AI Search X-Ray.";
    let note2 = "Experiencia sólida verificada en la combinación tecnológica especificada en la query.";

    if (role.toLowerCase().includes("design") || role.toLowerCase().includes("ux")) {
      name1 = "Elena Montes";
      name2 = "Victor Rueda";
      note1 = "Portafolio excepcional en Behance/Dribbble. Importado de LinkedIn vía X-Ray.";
    }

    const c1: SourcedCandidate = {
      id: `C-${300 + candidates.length + 1}`,
      name: name1,
      role: role,
      client: client,
      location: booleanLocation.trim() || "Madrid / Híbrido",
      phase1State: "01_nuevo",
      score: score1,
      lastChangeDate: "Ahora mismo (X-Ray)",
      ttfme: "--",
      outreachVariation: "A",
      customOutreachA: `Hola ${name1.split(" ")[0]}, localicé tu perfil en LinkedIn usando nuestra búsqueda X-Ray. Con base en tu expertise en ${booleanKeywords}, vemos un fit increíble para ${client}...`,
      customOutreachB: `Hola ${name1.split(" ")[0]}, cómo estás? Identificamos tu perfil avanzado en nuestro buscador y nos gustaría comentarte la posición de ${role} en ${client}.`,
      motivationNote: note1
    };

    const c2: SourcedCandidate = {
      id: `C-${300 + candidates.length + 2}`,
      name: name2,
      role: role,
      client: client,
      location: booleanLocation.trim() || "Madrid / Híbrido",
      phase1State: "01_nuevo",
      score: score2,
      lastChangeDate: "Ahora mismo (X-Ray)",
      ttfme: "--",
      outreachVariation: "B",
      customOutreachA: `Hola ${name2.split(" ")[0]}, un gusto conectar. Mediante nuestra herramienta de sourcing automatizada detectamos tu trayectoria vinculada a ${booleanKeywords}...`,
      customOutreachB: `Hola ${name2.split(" ")[0]}, ¿te interesaría evaluar una nueva opción en ${client} como ${role}?`,
      motivationNote: note2
    };

    setCandidates((prev) => [c1, c2, ...prev]);
    setSimulatedImportDone(true);
    setTimeout(() => {
      setIsBooleanSearchOpen(false);
      setSimulatedImportDone(false);
      setBooleanKeywords("");
      setBooleanExclude("");
      setBooleanLocation("");
      setBooleanOutputString("");
      setXrayOutputString("");
      setBooleanSource(null);
    }, 1500);
  };

  const handleCopyBoolean = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedBoolean(true);
    setTimeout(() => setCopiedBoolean(false), 2000);
  };

  const handleCopyXray = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedXray(true);
    setTimeout(() => setCopiedXray(false), 2000);
  };

  // Filter candidates list
  const filteredCandidates = candidates.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.client.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSearchFilter = 
      selectedSearch === "Todos" || `${c.client} - ${c.role}` === selectedSearch;

    return matchesSearch && matchesSearchFilter;
  });

  // Computed status filtered list for the detailed list view
  const listFilteredCandidates = filteredCandidates.filter((c) => {
    if (filterStatus === "Todos") return true;
    return c.phase1State === filterStatus;
  });

  // Sorted candidates list for detailed table list view
  const sortedListCandidates = [...listFilteredCandidates].sort((a, b) => {
    if (!sortField) return 0;
    let valA: any = "";
    let valB: any = "";

    if (sortField === "name") {
      valA = a.name.toLowerCase();
      valB = b.name.toLowerCase();
    } else if (sortField === "score") {
      valA = a.score;
      valB = b.score;
    } else if (sortField === "position") {
      valA = `${a.client} - ${a.role}`.toLowerCase();
      valB = `${b.client} - ${b.role}`.toLowerCase();
    } else if (sortField === "location") {
      valA = a.location.toLowerCase();
      valB = b.location.toLowerCase();
    } else if (sortField === "status") {
      valA = a.phase1State.toLowerCase();
      valB = b.phase1State.toLowerCase();
    } else if (sortField === "notes") {
      const noteA = (a.blockReason || a.missingField || a.motivationNote || "").toLowerCase();
      const noteB = (b.blockReason || b.missingField || b.motivationNote || "").toLowerCase();
      valA = noteA;
      valB = noteB;
    }

    if (valA < valB) return sortDirection === "asc" ? -1 : 1;
    if (valA > valB) return sortDirection === "asc" ? 1 : -1;
    return 0;
  });

  // Calculate Metrics
  const countNuevo = candidates.filter(c => c.phase1State === "01_nuevo").length;
  const countContactado = candidates.filter(c => c.phase1State === "02_contactado").length;
  const countBloqueado = candidates.filter(c => c.phase1State === "03_bloqueado").length;
  const countRechazado = candidates.filter(c => c.phase1State === "04_rechazado").length;
  const totalSourced = candidates.length;

  const rejectionRate = totalSourced > 0 ? Math.round((countRechazado / totalSourced) * 100) : 0;
  
  // Custom Drag & Drop Handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData("text/plain", id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetCol: SourcedCandidate["phase1State"]) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    if (!id) return;

    if (targetCol === "04_rechazado") {
      triggerRejectionFlow(id);
    } else {
      handleTransitionState(id, targetCol);
    }
  };

  // --- LOCAL HELPER SUBCOMPONENTS (Pre-return definition) ---

  function RenderCandidateCard({ cad }: { cad: SourcedCandidate }) {
    const activeOutreachMsg = cad.outreachVariation === "A" ? cad.customOutreachA : cad.customOutreachB;

    return (
      <div
        draggable
        onDragStart={(e) => handleDragStart(e, cad.id)}
        className="p-4 rounded-xl border border-white/10 bg-[#15181a]/40 hover:bg-[#15181a]/95 hover:border-white/20 transition-all duration-200 group flex flex-col space-y-3.5 relative overflow-hidden cursor-grab active:cursor-grabbing"
      >
        {/* Top fit assessment & metadata info */}
        <div className="flex justify-between items-start">
          <span className="text-[9px] font-mono text-[#879391]">{cad.id}</span>
          <div className="flex items-center gap-1.5">
            {/* Last Change Timer Icon */}
            <span className="text-[9px] text-[#879391] flex items-center gap-1">
              <Clock className="w-2.5 h-2.5 text-[#c4c1fb]" />
              {cad.lastChangeDate}
            </span>
            
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              cad.score >= 90 
                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                : "bg-[#6bd8cb]/10 text-[#6bd8cb] border border-[#6bd8cb]/20"
            }`}>
              Fit: {cad.score}%
            </span>
          </div>
        </div>

        {/* Basic information */}
        <div>
          <h3 className="text-xs font-bold text-white tracking-tight group-hover:text-[#6bd8cb] transition-colors">
            {cad.name}
          </h3>
          <p className="text-[10px] text-[#c4c1fb] mt-0.5 font-medium">{cad.role}</p>
        </div>

        {/* Sub-block detailing meta tags */}
        <div className="space-y-1.5 pt-1.5 border-t border-white/5 text-[9px] text-[#879391]">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#c4c1fb]/60" />
            <span className="truncate">{cad.client}</span>
          </div>
          <div className="flex items-center gap-1.5 font-medium">
            <MapPin className="w-3.5 h-3.5 text-[#6bd8cb]/60" />
            <span>{cad.location}</span>
          </div>
        </div>

        {/* Motivation and auto parsed details */}
        {cad.motivationNote && (
          <div className="text-[9px] leading-relaxed p-2 rounded bg-white/5 border border-white/5 text-[#879391]">
            <span className="text-white/40 block uppercase font-bold text-[8px] mb-0.5">
              Notas de Sourcing:
            </span>
            <p className="italic">"{cad.motivationNote}"</p>
          </div>
        )}

        {/* Social details if enriched */}
        {cad.socialLinks && (Object.keys(cad.socialLinks).length > 0) && (
          <div className="flex items-center gap-2 pt-1">
            {cad.socialLinks.github && (
              <a 
                href={cad.socialLinks.github} 
                target="_blank" 
                rel="noreferrer"
                className="p-1 px-1.5 text-[8px] font-bold text-[#6bd8cb] border border-[#6bd8cb]/10 bg-[#6bd8cb]/5 rounded hover:bg-[#6bd8cb] hover:text-[#101415] transition-all flex items-center gap-1"
              >
                <GitFork className="w-2.5 h-2.5" />
                GitHub
              </a>
            )}
            {cad.socialLinks.portfolio && (
              <a 
                href={cad.socialLinks.portfolio} 
                target="_blank" 
                rel="noreferrer"
                className="p-1 px-1.5 text-[8px] font-bold text-[#c4c1fb] border border-[#c4c1fb]/10 bg-[#c4c1fb]/5 rounded hover:bg-[#c4c1fb] hover:text-[#101415] transition-all flex items-center gap-1"
              >
                <Globe className="w-2.5 h-2.5" />
                Portfolio
              </a>
            )}
          </div>
        )}

        {/* Show block warning detail */}
        {cad.phase1State === "03_bloqueado" && (
          <div className="p-2 border border-amber-500/25 bg-amber-500/5 rounded-lg flex flex-col gap-1.5 text-[9px] text-amber-200">
            <div className="flex items-center gap-1 font-bold">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>Pendiente:</span>
            </div>
            <p className="italic">"{cad.blockReason}"</p>
            
            {/* Trigger triage simulator */}
            <button
              onClick={() => openTriageDialog(cad)}
              className="w-full py-1 mt-1 rounded bg-amber-500 text-stone-950 hover:bg-amber-400 transition-all font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Lanzar Triage Bot</span>
            </button>
          </div>
        )}

        {/* Show rejection reason if discarded */}
        {cad.phase1State === "04_rechazado" && (
          <div className="p-2 border border-rose-500/25 bg-rose-500/5 rounded-lg flex flex-col gap-1 text-[9px] text-rose-200">
            <div className="flex items-center gap-1 font-bold text-rose-400">
              <Ban className="w-3.5 h-3.5 shrink-0" />
              <span>Motivo de Rechazo:</span>
            </div>
            <span className="font-mono bg-rose-950/20 px-1 py-0.5 rounded border border-rose-500/10 text-center uppercase tracking-wide">
              {cad.rejectionReason || "No clasificado"}
            </span>
          </div>
        )}

        {/* --- Message Outreach Preview Tool block --- */}
        {cad.phase1State !== "04_rechazado" && (
          <div className="p-2 rounded bg-black/40 border border-white/5 space-y-1">
            <div className="flex justify-between items-center text-[8px] font-bold tracking-wider text-white/40 uppercase">
              <span>Mensaje de Acercamiento</span>
              <div className="flex gap-1.5 items-center">
                <button
                  onClick={() => toggleOutreachVariation(cad.id)}
                  className="text-[#6bd8cb] hover:underline"
                >
                  Variante {cad.outreachVariation} (A/B)
                </button>
              </div>
            </div>
            <p className="text-[8px] text-[#879391] leading-relaxed truncate">
              {activeOutreachMsg}
            </p>
            <div className="flex justify-between items-center pt-1">
              <button
                onClick={() => handleCopyOutreach(cad.id, activeOutreachMsg)}
                className="text-[8px] text-[#6bd8cb] hover:underline flex items-center gap-1 font-bold"
              >
                {copiedOutreachId === cad.id ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                <span>{copiedOutreachId === cad.id ? "Copiado!" : "Copiar plantilla"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Semantic Matching Tool Button */}
        <div className="pt-1.5 pb-1">
          <button
            onClick={() => handleSemanticMatch(cad)}
            className="w-full py-1.5 rounded-xl border border-[#c4c1fb]/20 bg-[#c4c1fb]/5 hover:bg-[#c4c1fb]/15 hover:text-white transition-all text-[9.5px] font-bold text-[#c4c1fb] flex items-center justify-center gap-1.5 cursor-pointer shadow shadow-[#4338ca]/5"
          >
            <Cpu className="w-3.5 h-3.5 animate-pulse text-[#c4c1fb]" />
            <span>Motor de Matching Semántico</span>
          </button>
        </div>

        {/* Foot card actions */}
        <div className="flex gap-1.5 pt-2 border-t border-white/5">
          {/* Detalles button */}
          <Link
            href={`/descubrimiento/${cad.id}`}
            className="px-2 py-1 rounded border border-[#c4c1fb]/20 bg-[#c4c1fb]/5 hover:bg-[#c4c1fb] hover:text-[#101415] text-[9px] font-bold text-[#c4c1fb] transition-all flex items-center justify-center gap-1 cursor-pointer shrink-0"
            title="Ver detalles completos del candidato"
          >
            <span>Detalles</span>
          </Link>
          {/* Enrich foot trigger if links are not fully loaded */}
          {!cad.socialLinks?.github && cad.phase1State !== "04_rechazado" && (
            <button
              onClick={() => handleEnrichCandidate(cad.id, cad.name)}
              disabled={enrichingId === cad.id}
              className="px-2 py-1 flex-grow rounded border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 hover:bg-[#6bd8cb] hover:text-[#101415] disabled:bg-white/5 disabled:text-[#879391] text-[9px] font-bold text-[#6bd8cb] transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <RefreshCw className={`w-3 h-3 ${enrichingId === cad.id ? "animate-spin" : ""}`} />
              <span>{enrichingId === cad.id ? "Scraping..." : "Enriquecer"}</span>
            </button>
          )}

          {/* Move columns buttons quick access */}
          {cad.phase1State === "01_nuevo" && (
            <button
              onClick={() => handleTransitionState(cad.id, "02_contactado")}
              className="px-2 py-1 rounded bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 hover:bg-[#6bd8cb]/35 text-[#6bd8cb] font-bold text-[9px] flex items-center justify-center gap-0.5 flex-grow cursor-pointer"
            >
              <span>Contactar</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {cad.phase1State === "02_contactado" && (
            <button
              onClick={() => handleTransitionState(cad.id, "03_bloqueado", { 
                blockReason: "Esperando confirmación pretensiones de sueldo y CV",
                missingField: "salario"
              })}
              className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 text-amber-400 font-bold text-[9px] flex items-center justify-center gap-0.5 flex-grow cursor-pointer"
            >
              <span>Bloquear</span>
            </button>
          )}

          {/* Action: Transfer / Move beyond phase 1 */}
          {(cad.phase1State === "02_contactado" || cad.phase1State === "01_nuevo") && (
            <button
              onClick={() => alert(`El candidato ${cad.name} ha avanzado a Fase 2 (Evaluación Interna - Módulo Selección).`)}
              className="px-1.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-stone-950 font-bold text-[9px] flex items-center justify-center gap-0.5 shrink-0 cursor-pointer"
              title="Avanzar candidato a Filtrados Fase 2"
            >
              <UserCheck className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Discard early candidate */}
          {cad.phase1State !== "04_rechazado" && (
            <button
              onClick={() => triggerRejectionFlow(cad.id)}
              className="p-1 rounded border border-white/5 bg-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-[#879391] hover:text-red-400 text-[9px] transition-all flex items-center justify-center cursor-pointer"
              title="Rechazar en Fase Inicial"
            >
              <Ban className="w-3 h-3" />
            </button>
          )}

          {/* Re-active Candidate if discarded */}
          {cad.phase1State === "04_rechazado" && (
            <button
              onClick={() => handleTransitionState(cad.id, "01_nuevo")}
              className="px-2 py-1 rounded bg-[#6bd8cb]/15 border border-[#6bd8cb]/20 text-[#6bd8cb] hover:bg-[#6bd8cb] hover:text-stone-950 font-bold text-[9px] flex-grow text-center transition-all cursor-pointer"
            >
              Reactivar en Backlog
            </button>
          )}
        </div>
      </div>
    );
  }

  function RenderColumnEmptyText({ text }: { text: string }) {
    return (
      <div className="h-40 flex flex-col items-center justify-center border border-dashed border-white/5 rounded-xl p-4 text-center">
        <span className="text-[10px] text-white/20 uppercase tracking-widest font-bold">
          {text}
        </span>
      </div>
    );
  }

  const renderSortIcon = (field: string) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-white/20 transition-colors group-hover:text-white/40 ml-1.5 inline-block" />;
    }
    if (sortDirection === "asc") {
      return <ChevronUp className="w-3.5 h-3.5 text-[#6bd8cb] ml-1.5 inline-block" />;
    }
    return <ChevronDown className="w-3.5 h-3.5 text-[#6bd8cb] ml-1.5 inline-block" />;
  };

  // --- MAIN LAYOUT RENDER ---
  return (
    <div className={`relative min-h-screen bg-[#101415] text-white transition-all duration-300 overflow-x-hidden ${isFullScreen ? 'p-4' : 'p-6 md:p-8'}`}>
      {/* Background ambient radial blurs consistent with Stitch */}
      <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-[#0d9488]/10 blur-[80px] pointer-events-none"></div>
      <div className="absolute bottom-32 right-32 w-80 h-80 rounded-full bg-[#c4c1fb]/5 blur-[100px] pointer-events-none"></div>

      <div className={`relative z-10 mx-auto transition-all duration-300 ${isFullScreen ? 'max-w-none space-y-4 px-2' : 'max-w-7xl space-y-8'}`}>
        
        {/* Navigation Banner Header */}
        {!isFullScreen && (
          <header className="flex flex-col md:flex-row justify-between md:items-center gap-6 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-[#0d9488] to-[#c4c1fb] flex items-center justify-center shadow-lg shadow-[#0d9488]/20">
              <Compass className="w-6 h-6 text-[#101415]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Fase 1: Atracción & Sourcing
                </span>
                <span className="text-[10px] font-bold text-white/40">Ref: Descubrimiento Inicial</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-0.5">
                Pipeline de Descubrimiento
              </h1>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#c4c1fb] hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Ver Dashboard</span>
            </Link>

            <Link
              href="/busquedas"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#6bd8cb] hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4" />
              <span>Búsquedas</span>
            </Link>

            {/*
            <Link
              href="/reclutamiento"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-amber-400 hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>Reclutamiento</span>
            </Link>
            */}

            <Link
              href="/talento"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#6bd8cb] hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <Contact className="w-4 h-4" />
              <span>Postulantes</span>
            </Link>

            <Link
              href="/configuracion"
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-white/5 text-xs text-[#c4c1fb] hover:bg-white/10 hover:text-white transition-all duration-200 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              <span>Ajustes</span>
            </Link>

            <div className="h-6 w-[1px] bg-white/10 mx-1 hidden md:block"></div>

            {/* Búsquedas Booleanas y X-Ray Button */}
            <button
              onClick={() => setIsBooleanSearchOpen(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#101415] bg-[#c4c1fb] hover:bg-[#c4c1fb]/90 hover:glow-btn transition-all shadow-md shadow-[#4338ca]/15 cursor-pointer"
            >
              <Search className="w-4 h-4" />
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Boolean & X-Ray AI</span>
            </button>

            {/* Ingesta Inteligente Action Button */}
            <button
              onClick={() => setIsIngestOpen(true)}
              className="flex items-center gap-2 px-4.5 py-2.5 rounded-xl text-xs font-bold text-[#101415] bg-[#6bd8cb] hover:bg-[#6bd8cb]/90 hover:glow-btn transition-all shadow-md shadow-[#0d9488]/15 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>Parser Ingesta CV</span>
            </button>
          </div>
        </header>
        )}

        {!isFullScreen && (
          <>
            {/* --- Phase Sourcing Metrics Summary Block --- */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <div className="glass-panel p-5 rounded-3xl backdrop-blur-md border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold text-left">
                TTFME Promedio
              </span>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'ttfme' ? null : 'ttfme')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-white">1.8 días</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                -4.2h vs Sprint ant.
              </span>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Clock className="w-16 h-16" />
            </div>

            {/* Help Overlay */}
            {activeMetricHelp === 'ttfme' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-[#6bd8cb] uppercase tracking-wider">TTFME Promedio</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Mide el tiempo medio transcurrido desde la ingesta de un candidato hasta que se establece el primer contacto interactivo de valor (triage).
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: Σ(F.Contacto - F.Ingesta) / NºContactados
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 rounded-3xl backdrop-blur-md border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold text-left">
                Outreach Personalization
              </span>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'outreach' ? null : 'outreach')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-[#c4c1fb]">76.4%</span>
              <span className="text-[10px] text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded border border-[#6bd8cb]/20">
                Variante A (Ef: 88%)
              </span>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Sparkles className="w-16 h-16" />
            </div>

            {/* Help Overlay */}
            {activeMetricHelp === 'outreach' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-[#6bd8cb] uppercase tracking-wider">Outreach A/B</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Proporción de candidatos contactados con plantillas personalizadas y optimizadas con A/B testing basadas en su huella digital.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: (Outreach Personalizado / Total Contactados) * 100
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 rounded-3xl backdrop-blur-md border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold text-left">
                Tasa de Rechazo Inicial
              </span>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'rejection' ? null : 'rejection')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-orange-400">{rejectionRate}%</span>
              <span className="text-[10px] text-white/50 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                {countRechazado} descartes
              </span>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Ban className="w-16 h-16" />
            </div>

            {/* Help Overlay */}
            {activeMetricHelp === 'rejection' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-[#6bd8cb] uppercase tracking-wider">Tasa de Rechazo</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Porcentaje de perfiles descartados de forma temprana en fase 1 (por filtros técnicos u otros motivos detectados en triage).
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: (Rechazados Fase 1 / Total Registrados Fase 1) * 100
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="glass-panel p-5 rounded-3xl backdrop-blur-md border border-white/10 relative overflow-hidden flex flex-col justify-between h-[110px] min-h-[110px]">
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold text-left">
                Total Sourced Backlog
              </span>
              <button 
                onClick={() => setActiveMetricHelp(activeMetricHelp === 'backlog' ? null : 'backlog')}
                className="relative z-10 text-white/40 hover:text-white transition-all cursor-pointer font-bold text-[9px] flex items-center justify-center w-4 h-4 rounded-full border border-white/10 bg-white/5 hover:bg-white/15 shadow-sm"
                title="Ver fórmula y explicación"
              >
                ?
              </button>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-2xl font-black text-white">{totalSourced}</span>
              <span className="text-[10px] text-[#6bd8cb] bg-[#6bd8cb]/10 px-2 py-0.5 rounded">
                Acumulado Completo
              </span>
            </div>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Users className="w-16 h-16" />
            </div>

            {/* Help Overlay */}
            {activeMetricHelp === 'backlog' && (
              <div className="absolute inset-0 bg-[#141819]/95 backdrop-blur-sm p-4 rounded-3xl flex flex-col justify-between z-20 border border-white/10 animate-fadeIn">
                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center pb-1 border-b border-white/10">
                    <span className="text-[9px] font-bold text-[#6bd8cb] uppercase tracking-wider">Total Backlog</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setActiveMetricHelp(null); }}
                      className="text-white/40 hover:text-white font-bold text-[9px] cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                  <p className="text-[8.5px] text-white/80 leading-normal">
                    Volumen histórico total de perfiles de talento identificados y guardados en el reservorio de la primera fase de atracción.
                  </p>
                  <p className="text-[7.5px] text-[#c4c1fb] font-mono tracking-tight pt-1">
                    Fórmula: Suma directa de perfiles en Fase 1
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
          </>
        )}

        {/* Filter controls panel */}
        <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md flex flex-col xl:flex-row gap-4 justify-between items-center text-left">
          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto items-center">
            {/* Search Input */}
            <div className="relative w-full md:max-w-xs xl:w-72">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-[#879391]" />
              <input
                type="text"
                placeholder="Buscar por candidato, rol o empresa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-[#879391] focus:border-[#6bd8cb] focus:ring-2 focus:ring-[#6bd8cb]/15 focus:outline-none transition-all"
              />
            </div>

            {/* Active search select */}
            <div className="flex items-center gap-2 w-full md:w-auto">
              <span className="text-xs text-[#879391] whitespace-nowrap">Búsqueda:</span>
              <select
                value={selectedSearch}
                onChange={(e) => setSelectedSearch(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb] cursor-pointer w-full md:w-auto"
              >
                <option value="Todos" className="bg-[#15181a]">Todas las Búsquedas</option>
                {ACTIVE_BUSQUEDAS.map((b) => (
                  <option key={b.id} value={`${b.client} - ${b.role}`} className="bg-[#15181a] text-white">
                    {b.client} - {b.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Additional Status Filter (only shown in List View) */}
            {viewMode === "lista" && (
              <div className="flex items-center gap-2 w-full md:w-auto animate-fadeIn shrink-0">
                <span className="text-xs text-[#c4c1fb] whitespace-nowrap font-medium">Estado Cand.:</span>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="bg-white/5 border border-[#c4c1fb]/20 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#6bd8cb] cursor-pointer w-full md:w-auto"
                >
                  <option value="Todos" className="bg-[#15181a]">Todos los Estados</option>
                  <option value="01_nuevo" className="bg-[#15181a]">01 - Nuevo (Para Revisión)</option>
                  <option value="02_contactado" className="bg-[#15181a]">02 - Contactado (En Espera)</option>
                  <option value="03_bloqueado" className="bg-[#15181a]">03 - Bloqueado / Pendiente</option>
                  <option value="04_rechazado" className="bg-[#15181a]">04 - Rechazado en Fase Inicial</option>
                </select>
              </div>
            )}
          </div>

          {/* Toggle buttons for Kanban vs List view mode & Fullscreen */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-center">
            <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 select-none">
              <button
                onClick={() => setViewMode("kanban")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === "kanban"
                    ? "bg-[#6bd8cb] text-[#101415] shadow shadow-[#0d9488]/10"
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
                    ? "bg-[#6bd8cb] text-[#101415] shadow shadow-[#0d9488]/10"
                    : "text-[#879391] hover:text-white"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Lista Detallada</span>
              </button>
            </div>

            <button
              onClick={() => setIsFullScreen(!isFullScreen)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                isFullScreen
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/25"
                  : "bg-white/5 border-white/10 text-[#c4c1fb]/80 hover:bg-white/10 hover:text-white"
              }`}
              title={isFullScreen ? "Salir de pantalla completa" : "Maximizar pantalla"}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Salir</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Maximizar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* --- View Mode Condition --- */}
        {viewMode === "kanban" ? (
          /* --- Kanban Board Grid --- */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
            
            {/* COLUMN 1: Nuevo */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "01_nuevo")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-indigo-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide">01 - Nuevo (Para Revisión)</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Sourced backlog inicial</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#c4c1fb]">
                  {countNuevo}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.phase1State === "01_nuevo").map((cad) => (
                  <RenderCandidateCard key={cad.id} cad={cad} />
                ))}
                {countNuevo === 0 && <RenderColumnEmptyText text="Sin perfiles nuevos" />}
              </div>
            </div>

            {/* COLUMN 2: Contactado */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "02_contactado")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-[#6bd8cb] text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide">02 - Contactado (En Espera)</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Esperando respuesta outreach</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[#6bd8cb]">
                  {countContactado}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.phase1State === "02_contactado").map((cad) => (
                  <RenderCandidateCard key={cad.id} cad={cad} />
                ))}
                {countContactado === 0 && <RenderColumnEmptyText text="Sin contactos en espera" />}
              </div>
            </div>

            {/* COLUMN 3: Bloqueado */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "03_bloqueado")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-amber-400 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide">03 - Bloqueado / Pendiente</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Dependencia o datos críticos</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-amber-400">
                  {countBloqueado}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.phase1State === "03_bloqueado").map((cad) => (
                  <RenderCandidateCard key={cad.id} cad={cad} />
                ))}
                {countBloqueado === 0 && <RenderColumnEmptyText text="Sin dependencias" />}
              </div>
            </div>

            {/* COLUMN 4: Rechazado */}
            <div 
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "04_rechazado")}
              className="rounded-2xl border border-white/10 bg-white/[0.01] backdrop-blur-md flex flex-col p-4 space-y-4 min-h-[600px] border-t-[4px] border-t-rose-500 text-left"
            >
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white tracking-wide">04 - Rechazado (Fase Inicial)</span>
                  <span className="text-[10px] text-[#879391] mt-0.5">Descartes tempraneros</span>
                </div>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-rose-500">
                  {countRechazado}
                </span>
              </div>

              <div className="flex-grow space-y-3.5 overflow-y-auto">
                {filteredCandidates.filter(c => c.phase1State === "04_rechazado").map((cad) => (
                  <RenderCandidateCard key={cad.id} cad={cad} />
                ))}
                {countRechazado === 0 && <RenderColumnEmptyText text="Sin descartados" />}
              </div>
            </div>

          </div>
        ) : (
          /* --- Premium Glassmorphism Table List View --- */
          <div className="glass-panel rounded-3xl overflow-hidden border border-white/10 text-left animate-fadeIn">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-[#161a1b]/60 text-[10px] uppercase font-bold tracking-wider text-[#c4c1fb]">
                    <th 
                      onClick={() => handleSort("name")}
                      className="py-4 px-5 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group"
                    >
                      <div className="flex items-center">
                        <span>Candidato</span>
                        {renderSortIcon("name")}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("score")}
                      className="py-4 px-5 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group"
                    >
                      <div className="flex items-center">
                        <span>Compatibilidad AI</span>
                        {renderSortIcon("score")}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("position")}
                      className="py-4 px-5 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group"
                    >
                      <div className="flex items-center">
                        <span>Posición Asignada</span>
                        {renderSortIcon("position")}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("location")}
                      className="py-4 px-5 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group"
                    >
                      <div className="flex items-center">
                        <span>Ubicación</span>
                        {renderSortIcon("location")}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("status")}
                      className="py-4 px-5 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group"
                    >
                      <div className="flex items-center">
                        <span>Estado</span>
                        {renderSortIcon("status")}
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort("notes")}
                      className="py-4 px-5 cursor-pointer hover:bg-white/[0.03] hover:text-white select-none transition-colors group"
                    >
                      <div className="flex items-center">
                        <span>Notas / Gaps</span>
                        {renderSortIcon("notes")}
                      </div>
                    </th>
                    <th className="py-4 px-5 text-center select-none text-[#c4c1fb]/50">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-[11px] text-white">
                  {sortedListCandidates.map((cad) => {
                    let statusLabel = "";
                    let statusColor = "";
                    if (cad.phase1State === "01_nuevo") {
                      statusLabel = "01 - Nuevo (Para Revisión)";
                      statusColor = "text-indigo-400 bg-indigo-500/10 border-indigo-500/20";
                    } else if (cad.phase1State === "02_contactado") {
                      statusLabel = "02 - Contactado (En Espera)";
                      statusColor = "text-[#6bd8cb] bg-[#6bd8cb]/10 border-[#6bd8cb]/20";
                    } else if (cad.phase1State === "03_bloqueado") {
                      statusLabel = "03 - Bloqueado / Pendiente";
                      statusColor = "text-amber-400 bg-amber-500/10 border-amber-500/20";
                    } else if (cad.phase1State === "04_rechazado") {
                      statusLabel = "04 - Rechazado en Fase Inicial";
                      statusColor = "text-rose-400 bg-rose-500/10 border-rose-500/20";
                    }

                    const fitColor = cad.score >= 90
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                      : "text-amber-400 bg-amber-500/10 border-amber-500/20";

                    return (
                      <tr 
                        key={cad.id}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        {/* Candidate info */}
                        <td className="py-4 px-5 font-bold text-white">
                          <div className="flex flex-col">
                            <span className="text-white text-xs">{cad.name}</span>
                            {cad.socialLinks && (Object.keys(cad.socialLinks).length > 0) && (
                              <div className="flex gap-2 mt-1">
                                {cad.socialLinks.github && (
                                  <a href={cad.socialLinks.github} target="_blank" rel="noreferrer" className="text-[9px] text-[#6bd8cb] hover:underline flex items-center gap-0.5">
                                    <GitFork className="w-2.5 h-2.5" /> github
                                  </a>
                                )}
                                {cad.socialLinks.portfolio && (
                                  <a href={cad.socialLinks.portfolio} target="_blank" rel="noreferrer" className="text-[9px] text-[#c4c1fb] hover:underline flex items-center gap-0.5">
                                    <Globe className="w-2.5 h-2.5" /> portfolio
                                  </a>
                                )}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Compatibility */}
                        <td className="py-4 px-5">
                          <span className={`px-2 py-0.5 rounded border text-[10px] font-bold font-mono ${fitColor}`}>
                            {cad.score}% Fit AI
                          </span>
                        </td>

                        {/* Target position */}
                        <td className="py-4 px-5">
                          <div className="flex flex-col text-left">
                            <span className="font-semibold text-white">{cad.role}</span>
                            <span className="text-[10px] text-[#879391] mt-0.5">{cad.client}</span>
                          </div>
                        </td>

                        {/* Location */}
                        <td className="py-4 px-5 text-[#879391] font-medium">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#6bd8cb]/60" />
                            <span>{cad.location}</span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-5">
                          <span className={`px-2.5 py-1 rounded-full border text-[9px] font-bold ${statusColor}`}>
                            {statusLabel}
                          </span>
                        </td>

                        {/* Gaps/Notes */}
                        <td className="py-4 px-5 max-w-[200px] truncate">
                          {cad.phase1State === "03_bloqueado" ? (
                            <div className="flex items-center gap-1 text-amber-200">
                              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span className="italic text-[10px] truncate">"{cad.blockReason}"</span>
                            </div>
                          ) : cad.phase1State === "04_rechazado" ? (
                            <div className="flex flex-col text-left">
                              <span className="text-rose-400 font-mono text-[9px] uppercase tracking-wide">
                                Descartado: {cad.rejectionReason}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[#879391] italic text-[9.5px]">
                              {cad.motivationNote ? `"${cad.motivationNote}"` : "--"}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-center gap-2 text-[10px]">
                            {/* Detalles View Link */}
                            <Link
                              href={`/descubrimiento/${cad.id}`}
                              className="px-2.5 py-1 rounded border border-[#6bd8cb]/20 bg-[#6bd8cb]/5 text-[#6bd8cb] font-bold hover:bg-[#6bd8cb] hover:text-stone-900 transition-all flex items-center gap-1 text-[10px] cursor-pointer shrink-0"
                              title="Información detallada del candidato"
                            >
                              <span>Detalles</span>
                            </Link>
                            {/* AI Semantic Fit Dialog */}
                            <button
                              onClick={() => handleSemanticMatch(cad)}
                              className="px-2.5 py-1 rounded border border-[#c4c1fb]/20 bg-[#c4c1fb]/5 text-[#c4c1fb] font-bold hover:bg-[#c4c1fb] hover:text-stone-900 transition-all flex items-center gap-1 text-[10px] cursor-pointer"
                              title="Diagnóstico Motor Semántico AI"
                            >
                              <Cpu className="w-3.5 h-3.5 text-[#c4c1fb] animate-pulse" />
                              <span>Ficha AI</span>
                            </button>

                            {cad.phase1State === "01_nuevo" && (
                              <button
                                onClick={() => handleTransitionState(cad.id, "02_contactado")}
                                className="px-2 py-1 rounded bg-[#6bd8cb]/10 border border-[#6bd8cb]/20 text-[#6bd8cb] font-bold hover:bg-[#6bd8cb] hover:text-stone-950 transition-all text-[10px] cursor-pointer"
                              >
                                Contactar
                              </button>
                            )}

                            {cad.phase1State === "02_contactado" && (
                              <button
                                onClick={() => handleTransitionState(cad.id, "03_bloqueado", { 
                                  blockReason: "Esperando confirmación pretensiones de sueldo y CV",
                                  missingField: "salario"
                                })}
                                className="px-2 py-1 rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 font-bold hover:bg-amber-500 hover:text-stone-950 transition-all text-[10px] cursor-pointer"
                              >
                                Bloquear
                              </button>
                            )}

                            {cad.phase1State === "03_bloqueado" && (
                              <button
                                onClick={() => openTriageDialog(cad)}
                                className="px-2 py-1 rounded bg-amber-500 text-stone-950 font-bold hover:bg-amber-400 transition-all text-[10px] flex items-center gap-0.5 cursor-pointer"
                              >
                                <MessageSquare className="w-3.5 h-3.5" />
                                <span>Triage</span>
                              </button>
                            )}

                            {cad.phase1State === "04_rechazado" && (
                              <button
                                onClick={() => handleTransitionState(cad.id, "01_nuevo")}
                                className="px-2 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-all text-[10px] cursor-pointer"
                              >
                                Reactivar
                              </button>
                            )}

                            {(cad.phase1State === "01_nuevo" || cad.phase1State === "02_contactado") && (
                              <button
                                onClick={() => alert(`El candidato ${cad.name} ha avanzado a Fase 2 (Evaluación Interna).`)}
                                className="p-1 px-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-stone-950 transition-all cursor-pointer"
                                title="Avanzar candidato a Filtrados Fase 2"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {cad.phase1State !== "04_rechazado" && (
                              <button
                                onClick={() => triggerRejectionFlow(cad.id)}
                                className="p-1.5 rounded border border-white/5 bg-white/5 hover:border-red-500/30 hover:bg-red-500/10 text-[#879391] hover:text-red-400 transition-all cursor-pointer"
                                title="Rechazar Candidate"
                              >
                                <Ban className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {sortedListCandidates.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[#879391] font-bold text-xs uppercase tracking-wider">
                        No hay perfiles que coincidan con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>

      {/* --- MOCK DIALOG/MODAL: TRIAGE BOT DIALOGUE (WA Simulation) --- */}
      {triageCand && (
        <div className="fixed inset-0 bg-[#101415]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 flex flex-col h-[500px]">
            {/* Header chat info */}
            <div className="bg-[#15181a] p-4.5 border-b border-white/10 flex justify-between items-center text-left">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#0d9488]/10 border border-[#0d9488]/20 flex items-center justify-center text-[#6bd8cb]">
                  <span className="font-bold font-mono">WA</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Chat de Triage: WhatsApp Bot</h3>
                  <p className="text-[10px] text-[#879391]">Destrabando canal para {triageCand.name}</p>
                </div>
              </div>
              <button 
                onClick={() => setTriageCand(null)}
                className="text-[#879391] hover:text-white text-xs font-bold font-mono bg-white/5 p-1 px-2.5 rounded-lg border border-white/5 cursor-pointer"
              >
                Cerrar
              </button>
            </div>

            {/* Chat Messages Log */}
            <div className="flex-grow p-4.5 overflow-y-auto space-y-4 text-left text-xs bg-stone-950/20">
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

            {/* Chat actions bar */}
            <div className="p-4 bg-[#15181a] border-t border-white/10 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Escribe la respuesta del bot o candidato..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
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

              {/* Action buttons list to resolve quickly */}
              <div className="flex justify-between items-center text-xs">
                <span className="text-[10px] text-[#879391]">
                  Una vez confirmados los datos, destrabe el candidato.
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

      {/* --- MOCK DIALOG/MODAL: INGESTA INTELIGENTE (LLM Parser Simulation) --- */}
      {isIngestOpen && (
        <div className="fixed inset-0 bg-[#101415]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form 
            onSubmit={handleIngestSubmit}
            className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 flex flex-col p-6 space-y-4 text-left"
          >
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4.5 h-4.5 text-[#6bd8cb]" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#c4c1fb]">Ingesta Inteligente de CV (Parser LLM)</h3>
              </div>
              <p className="text-[11px] text-[#879391] mt-1">
                Pega el texto crudo de un currículum o perfil de LinkedIn. El sistema utilizará nuestro parser vectorial para asignarle un fit semántico y registrarlo en las columnas.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Vacante / Búsqueda Asociada</label>
                <select
                  value={ingestJobId}
                  onChange={(e) => setIngestJobId(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-[#6bd8cb]"
                >
                  {ACTIVE_BUSQUEDAS.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#15181a] text-white">
                      {b.id} - {b.role} ({b.client})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-white/50 font-bold uppercase tracking-wider">Texto del Currículum (OCR Raw Text)</label>
                <textarea
                  rows={6}
                  required
                  placeholder="Ej: JAVIER GALDÓN - ARQUITECTO RUST & C++ - Madrid. Ingeniero sénior con experto en WebAssembly, rust compiler, crates..."
                  value={ingestCvText}
                  onChange={(e) => setIngestCvText(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-[#879391] focus:outline-none focus:border-[#6bd8cb] resize-none"
                />
              </div>
            </div>

            {/* Quick autocomplete demo buttons */}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIngestCvText(`JAVIER GALDÓN\nSenior Rust Software Architect\nExperiencia: 8 años construyendo motores de compilación y compilando a WASM para SEAT.\nSkills: Rust, WebAssembly, C++.\nContacto: javier.galdon@example.es`)}
                className="px-2.5 py-1 rounded bg-[#c4c1fb]/10 hover:bg-[#c4c1fb]/20 border border-[#c4c1fb]/15 text-[9px] text-[#c4c1fb] font-bold transition-all cursor-pointer"
              >
                Cargar Demo (Rust Architect)
              </button>
              <button
                type="button"
                onClick={() => setIngestCvText(`ANA BELÉN SILVA\nUI/UX Specialist & Frontend Developer\nMadrid / Remoto. Expert en Figma, React y desarrollo web responsivo para Telefónica.\nGitHub: anasilva-ux`)}
                className="px-2.5 py-1 rounded bg-[#c4c1fb]/10 hover:bg-[#c4c1fb]/20 border border-[#c4c1fb]/15 text-[9px] text-[#c4c1fb] font-bold transition-all cursor-pointer"
              >
                Cargar Demo (UI/UX Designer)
              </button>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setIsIngestOpen(false)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={parsingCv}
                className="px-4 py-2 bg-[#6bd8cb] hover:bg-[#6bd8cb]/90 text-stone-950 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {parsingCv ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Procesando CV...</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5" />
                    <span>Guardar y Procesar</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MOCK DIALOG/MODAL: REJECTION REASON PROMPT --- */}
      {pendingRejectionCand && (
        <div className="fixed inset-0 bg-[#101415]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-sm rounded-3xl overflow-hidden border border-white/10 p-6 space-y-4 text-left">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-400" />
                Especificar Motivo de Rechazo
              </h3>
              <p className="text-[10px] text-[#879391] mt-1">
                Por favor, elige el motivo principal para archivar al candidato en la Fase Inicial de descubrimiento.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              {[
                "Presupuesto",
                "Falta de Skills Técnicos",
                "Nivel de Inglés",
                "Cultura",
                "Oferta Declinada",
                "No responde al contacto"
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => submitRejection(reason)}
                  className="w-full p-2.5 text-xs text-left bg-white/5 hover:bg-rose-500/10 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 rounded-xl transition-all font-bold cursor-pointer"
                >
                  {reason}
                </button>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/5">
              <button
                type="button"
                onClick={() => setPendingRejectionCand(null)}
                className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-bold cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MOCK DIALOG/MODAL: SEMANTIC MATCHING MOTOR --- */}
      {isSemanticOpen && semanticCandidate && (
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
                className="text-white/40 hover:text-white transition-all text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            {isAnalyzingSemantic ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-4 text-center">
                <RefreshCw className="w-8 h-8 text-[#6bd8cb] animate-spin" />
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Analizando Compatibilidad Semántica...</h4>
                  <p className="text-[10px] text-[#879391] mt-1">
                    Procesando CV de {semanticCandidate.name} contra requiere {semanticCandidate.role} en {semanticCandidate.client}...
                  </p>
                </div>
              </div>
            ) : (() => {
              const info = semanticResult || SEMANTIC_MATCH_DB[semanticCandidate.name] || getDynamicMatchResult(semanticCandidate);
              const scoreColor = info.score >= 90 ? "text-emerald-400 border-emerald-500/25 bg-emerald-500/5" : "text-amber-400 border-amber-500/25 bg-amber-500/5";
              return (
                <div className="space-y-4">
                  {/* Candidate target search details */}
                  <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div>
                      <h4 className="text-xs font-bold text-white">{semanticCandidate.name}</h4>
                      <p className="text-[10px] text-[#879391] mt-0.5">Búsqueda: {semanticCandidate.role} ({semanticCandidate.client})</p>
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
                    
                    {/* Score badge */}
                    <div className={`flex flex-col items-center justify-center p-2 px-3 border rounded-xl ${scoreColor}`}>
                      <span className="text-[9px] font-bold text-white/50 uppercase tracking-wider mb-0.5">Fit AI</span>
                      <span className="text-lg font-bold font-mono">{info.score}%</span>
                    </div>
                  </div>

                  {/* Bullet points section */}
                  <div className="grid grid-cols-1 gap-3">
                    {/* Positive Points */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Puntos Positivos / Fortalezas</span>
                      </h5>
                      <ul className="space-y-1 pl-4.5 list-disc text-[10px] text-[#879391] leading-relaxed">
                        {info.positives.map((p, idx) => (
                          <li key={idx}>{p}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Negative Points */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <h5 className="text-[10px] font-bold text-[#c4c1fb] uppercase tracking-wide flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-[#c4c1fb]" />
                        <span>Puntos Negativos / Gaps Identificados</span>
                      </h5>
                      <ul className="space-y-1 pl-4.5 list-disc text-[10px] text-[#879391] leading-relaxed">
                        {info.negatives.map((n, idx) => (
                          <li key={idx}>{n}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Recommendations */}
                    <div className="space-y-1.5 pt-2 border-t border-white/5">
                      <h5 className="text-[10px] font-bold text-blue-400 uppercase tracking-wide flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>Recomendaciones del Motor</span>
                      </h5>
                      <ul className="space-y-1 pl-4.5 list-disc text-[10px] text-[#879391] leading-relaxed">
                        {info.recommendations.map((r, idx) => (
                          <li key={idx}>{r}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Actions inside modal */}
                  <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                    {semanticCandidate.phase1State !== "04_rechazado" && (
                      <button
                        type="button"
                        onClick={() => {
                          triggerRejectionFlow(semanticCandidate.id);
                          setIsSemanticOpen(false);
                        }}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-stone-950 border border-rose-500/20 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                      >
                        Archivar / Descartar
                      </button>
                    )}
                    {semanticCandidate.phase1State === "01_nuevo" && (
                      <button
                        type="button"
                        onClick={() => {
                          handleTransitionState(semanticCandidate.id, "02_contactado");
                          setIsSemanticOpen(false);
                        }}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 rounded-xl text-[10px] font-bold transition-all cursor-pointer font-bold"
                      >
                        Avanzar a Contactar
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsSemanticOpen(false)}
                      className="px-3 py-1.5 border border-white/10 hover:bg-white/5 rounded-xl text-[10px] font-bold cursor-pointer"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* --- MOCK DIALOG/MODAL: BOOLEAN & X-RAY SEARCH --- */}
      {isBooleanSearchOpen && (
        <div className="fixed inset-0 bg-[#101415]/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl overflow-hidden border border-white/10 p-6 space-y-4 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Search className="w-4 h-4 text-[#c4c1fb]" />
                <Sparkles className="w-3.5 h-3.5 text-[#6bd8cb] animate-pulse" />
                <span>Búsquedas Booleanas y X-Ray AI</span>
              </h3>
              <button
                onClick={() => setIsBooleanSearchOpen(false)}
                className="text-white/40 hover:text-white transition-all text-xs font-bold"
              >
                Cerrar
              </button>
            </div>

            <p className="text-[10px] text-[#879391]">
              Construye strings de búsqueda booleanas profesionales o consultas X-Ray de manera inteligente y simula la ingesta del talento localizado en la web.
            </p>

            {/* Form inputs */}
            <div className="space-y-3">
              {/* Autocomplete templates */}
              <div className="flex flex-wrap gap-2 pb-1">
                <span className="text-[9px] text-[#879391] flex items-center">Precargar:</span>
                <button
                  type="button"
                  onClick={() => {
                    setBooleanKeywords("Rust, WebAssembly, C++");
                    setBooleanExclude("Junior, Intern");
                    setBooleanLocation("Barcelona");
                    setBooleanJobId("REQ-002");
                  }}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white hover:bg-white/10 transition-all cursor-pointer font-bold"
                >
                  Rust Architect
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setBooleanKeywords("Figma, Design System, UI");
                    setBooleanExclude("Manager, Lead");
                    setBooleanLocation("Madrid");
                    setBooleanJobId("REQ-004");
                  }}
                  className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[9px] text-white hover:bg-white/10 transition-all cursor-pointer font-bold"
                >
                  UX Designer
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Palabras Clave (Separar por comas)</label>
                  <input
                    type="text"
                    placeholder="Ej: React, Node, Tailwind"
                    value={booleanKeywords}
                    onChange={(e) => setBooleanKeywords(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#879391] outline-none focus:border-[#c4c1fb]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Excluir términos (Separar por comas)</label>
                  <input
                    type="text"
                    placeholder="Ej: Junior, Manager"
                    value={booleanExclude}
                    onChange={(e) => setBooleanExclude(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#879391] outline-none focus:border-[#c4c1fb]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Ciudad / Ubicación</label>
                  <input
                    type="text"
                    placeholder="Ej: Madrid, Remoto, Barcelona"
                    value={booleanLocation}
                    onChange={(e) => setBooleanLocation(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-[#879391] outline-none focus:border-[#c4c1fb]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-white/50 font-bold uppercase tracking-wider">Asociar a Búsqueda Activa</label>
                  <select
                    value={booleanJobId}
                    onChange={(e) => setBooleanJobId(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white outline-none cursor-pointer focus:border-[#c4c1fb]"
                  >
                    {ACTIVE_BUSQUEDAS.map((b) => (
                      <option key={b.id} value={b.id} className="bg-[#15181a] text-white">
                        {b.id} - {b.role} ({b.client})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateQueries}
                disabled={!booleanKeywords.trim() || isGeneratingQueries}
                className="w-full py-2 bg-[#c4c1fb] text-stone-950 hover:bg-[#c4c1fb]/90 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md shadow-[#4338ca]/15"
              >
                {isGeneratingQueries ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Calculando Query IA...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar Query Inteligente (IA)</span>
                  </>
                )}
              </button>
            </div>

            {/* Generated queries display */}
            {(booleanOutputString || xrayOutputString) && (
              <div className="space-y-3 pt-3 border-t border-white/5 animate-fadeIn">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                      <span>✓ String Booleana Sugerida</span>
                      {booleanSource && (
                        <span className={`px-1.5 py-0.5 rounded text-[7.5px] font-extrabold ${
                          booleanSource === "Gemini AI"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25"
                            : "bg-[#879391]/10 text-[#879391]/80 border border-white/5"
                        }`}>
                          {booleanSource === "Gemini AI" ? "✨ GEMINI LIVE" : "📋 MOCK"}
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyBoolean(booleanOutputString)}
                      className="text-[9.5px] text-[#6bd8cb] hover:underline font-bold cursor-pointer"
                    >
                      {copiedBoolean ? "¡Copiado!" : "Copiar String"}
                    </button>
                  </div>
                  <div className="bg-[#101415] border border-white/5 rounded-xl p-2.5 font-mono text-[9px] text-white/90 whitespace-pre-wrap break-all select-all">
                    {booleanOutputString}
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                      <span>✓ String X-Ray (LinkedIn / Google)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => handleCopyXray(xrayOutputString)}
                      className="text-[9.5px] text-[#6bd8cb] hover:underline font-bold cursor-pointer"
                    >
                      {copiedXray ? "¡Copiado!" : "Copiar Query"}
                    </button>
                  </div>
                  <div className="bg-[#101415] border border-white/5 rounded-xl p-2.5 font-mono text-[9px] text-white/90 whitespace-pre-wrap break-all select-all">
                    {xrayOutputString}
                  </div>
                </div>

                {/* Simulated Import action */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleSimulatedImport}
                    disabled={simulatedImportDone}
                    className="w-full py-2.5 bg-[#6bd8cb] hover:bg-[#6bd8cb]/90 text-stone-950 disabled:bg-[#101415] disabled:text-emerald-400 disabled:border disabled:border-emerald-500/10 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    {simulatedImportDone ? (
                      <>
                        <span>¡2 Candidatos Importados Exitosamente a columna 'Nuevo'!</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Simular Importación de Candidatos Encontrados</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
