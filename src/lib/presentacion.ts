import type { PipelineItem } from "@/actions/pipeline";
import type { Candidato } from "@/actions/candidatos";
import type { Busqueda } from "@/actions/busquedas";

export interface PresentacionCandidate {
  id: string;
  pipeId?: string;
  busqObj?: Busqueda;
  searchId?: string;
  searchCode?: string;
  searchRole?: string;
  searchClient?: string;
  name: string;
  role: string;
  client: string;
  location: string;
  score: number; // Fit rating 0-100
  currentPhase: "09_shortlist" | "10_entrevista_cliente" | "11_standby";
  entryDate: string; // ISO string to check WIP blockage times
  cNPS?: number; // Candidate Net Promoter Score [1-10]
  lastActivity: string;
  experienceYears: number;
  contactNumber: string;
  email: string;
  initialNotes?: string;
  f1Notes?: string;
  f2Notes?: string;
  f3Notes?: string;
  recruiterNotes?: string;
  url_cv?: string;
  canal_ingreso?: string | null;
  reuniones?: any[] | null;
}

export const mapPipelineToPresentacionCandidates = (
  pipelineItems: PipelineItem[],
  candidatosList: Candidato[],
  busquedasList: Busqueda[]
): PresentacionCandidate[] => {
  const candMap = new Map(candidatosList.map(c => [c.id, c]));
  const busqMap = new Map<string, Busqueda>();
  busquedasList.forEach(b => {
    if (b.id) busqMap.set(b.id, b);
    if (b.id_busqueda) busqMap.set(b.id_busqueda, b);
    if (b.codigo_busqueda) busqMap.set(b.codigo_busqueda, b);
  });

  const result: PresentacionCandidate[] = [];

  for (const pipe of pipelineItems) {
    const cand = candMap.get(pipe.claves_conexion?.id_candidato);
    const busq = busqMap.get(pipe.claves_conexion?.id_busqueda);

    const stateStr = (pipe.flujo?.estado_actual || "").toLowerCase();

    // Map pipeline states to Presentacion phases (09_shortlist, 10_entrevista_cliente, 11_standby)
    let currentPhase: PresentacionCandidate["currentPhase"] | null = null;
    if (stateStr.includes("09") || stateStr.includes("shortlist") || stateStr.includes("presentado") || stateStr.includes("enviado")) {
      currentPhase = "09_shortlist";
    } else if (stateStr.includes("10") || stateStr.includes("entrevista") || stateStr.includes("cliente")) {
      currentPhase = "10_entrevista_cliente";
    } else if (stateStr.includes("11") || stateStr.includes("standby") || stateStr.includes("back-up") || stateStr.includes("backup")) {
      currentPhase = "11_standby";
    }

    if (!currentPhase) {
      continue;
    }

    const candName = cand?.nombre_completo || "Candidato";
    const role = cand?.puesto || busq?.perfil_busqueda || "Especialista Tech";
    const client = busq?.cliente || "Cliente";
    const location = cand?.ubicacion || "España / Remoto";
    const score = pipe.f1_descubrimiento?.analisis_semantico?.fit_score ?? pipe.f2_evaluacion?.puntaje_tecnico ?? pipe.evaluacion?.puntaje_tecnico ?? 87;
    const entryDate = pipe.flujo?.fecha_ultimo_cambio || pipe.createdAt || new Date().toISOString();
    const email = cand?.email || "candidato@email.com";
    const contactNumber = cand?.telefono_movil || "+34 600 000 000";

    const initialNotes = cand?.notas_iniciales || "";
    const f1Notes = pipe.f1_descubrimiento?.notas_reclutador || "";
    const f2Notes = pipe.f2_evaluacion?.notas_reclutador || pipe.evaluacion?.notas_reclutador || "";
    const f3Notes = (pipe as any)?.f3_presentacion?.notas_reclutador || 
                    (pipe as any)?.presentacion?.notas_reclutador || 
                    (pipe as any)?.f3_cliente?.notas_reclutador || 
                    (pipe as any)?.f3?.notas_reclutador || "";

    result.push({
      id: cand ? cand.id : pipe.claves_conexion?.id_candidato || pipe.id,
      pipeId: pipe.id,
      busqObj: busq,
      searchId: busq?.id_busqueda || busq?.id || pipe.claves_conexion?.id_busqueda,
      searchCode: busq?.codigo_busqueda,
      searchRole: busq?.perfil_busqueda,
      searchClient: busq?.cliente,
      name: candName,
      role,
      client,
      location,
      score,
      currentPhase,
      entryDate,
      cNPS: 9,
      lastActivity: pipe.flujo?.fecha_ultimo_cambio 
        ? `Último cambio: ${new Date(pipe.flujo.fecha_ultimo_cambio).toLocaleDateString("es-ES")}` 
        : "Registro de presentación sincronizado desde backend",
      experienceYears: 5,
      contactNumber,
      email,
      initialNotes,
      f1Notes,
      f2Notes,
      f3Notes,
      recruiterNotes: f3Notes || f2Notes,
      url_cv: cand?.url_cv || undefined,
      canal_ingreso: cand?.canal_ingreso || null
    });
  }

  return result;
};


// Initial mock dataset for Presentacion page
export const INITIAL_PRESENTACION_CANDIDATES: PresentacionCandidate[] = [
  {
    id: "CAND-081",
    name: "Alejandro Sanz Gómez",
    role: "Frontend Dev (React/Node)",
    client: "Inditex S.A.",
    location: "A Coruña, España / Remoto",
    score: 87,
    currentPhase: "09_shortlist",
    entryDate: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(), // 40 hours ago
    cNPS: 9,
    lastActivity: "CV y Briefing enviado al Hiring Manager de Inditex S.A.",
    experienceYears: 4.5,
    contactNumber: "+34 654 987 321",
    email: "alejandro.sanz@gmail.com"
  },
  {
    id: "CAND-082",
    name: "Marta Sánchez Rey",
    role: "Product Manager Tech",
    client: "Telefónica S.A.",
    location: "Madrid, España / Remoto",
    score: 93,
    currentPhase: "09_shortlist",
    entryDate: new Date(Date.now() - 56 * 60 * 60 * 1000).toISOString(), // 56 hours ago (SLA overload warning > 48h)
    cNPS: 10,
    lastActivity: "Expediente enviado a Telefónica S.A. Esperando confirmación de agenda.",
    experienceYears: 6.0,
    contactNumber: "+34 612 345 678",
    email: "marta.sanchez@telefonica.net"
  },
  {
    id: "CAND-091",
    name: "Javier Bardem Costa",
    role: "Software Architect Rust",
    client: "SEAT S.A.",
    location: "Barcelona, España",
    score: 95,
    currentPhase: "10_entrevista_cliente",
    entryDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 72 hours ago
    cNPS: 8,
    lastActivity: "Entrevista técnica completada con el equipo automotriz de SEAT S.A.",
    experienceYears: 9.0,
    contactNumber: "+34 600 789 456",
    email: "javier.rust@architect.io"
  },
  {
    id: "CAND-092",
    name: "Elena Fuertes Gil",
    role: "SecOps Specialist",
    client: "Banco Santander",
    location: "Madrid, España / Remoto",
    score: 82,
    currentPhase: "10_entrevista_cliente",
    entryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    cNPS: 7,
    lastActivity: "Segunda ronda de entrevista agendada con el Director de Ciberseguridad.",
    experienceYears: 5.0,
    contactNumber: "+34 689 123 456",
    email: "elena.fuertes.security@gmail.com"
  },
  {
    id: "CAND-101",
    name: "Roberto Gómez Ruiz",
    role: "Frontend Dev (React/Node)",
    client: "Inditex S.A.",
    location: "Madrid, España / Remoto",
    score: 78,
    currentPhase: "11_standby",
    entryDate: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    cNPS: 5,
    lastActivity: "Candidato colocado en Stand-by tras entrevista por Inditex S.A. Evalúan perfiles alternativos.",
    experienceYears: 3.0,
    contactNumber: "+34 677 333 444",
    email: "roberto.rgomez@hotmail.com"
  }
];

// Helper calculations for Metrics Stage 3
export interface PresentacionKPIs {
  blockageTimeHours: number; // Avg hours candidates wait in 09_shortlist and 11_standby
  avgCNPS: number;
  calibrationAccuracy: number; // Percentage of candidates interviewed (09) or in standby (10) out of total shortlist candidates
  activeWipCount: number;
  isWipOverloaded: boolean;
}

export function calculatePresentacionKPIs(candidates: PresentacionCandidate[]): PresentacionKPIs {
  // All candidates in presentacion are active WIP. Let's count them.
  const activeWipCount = candidates.length;
  const isWipOverloaded = activeWipCount > 10;

  // 1. Average Blockage Time: candidates waiting for feedback (09_shortlist or 11_standby)
  const blockageCandidates = candidates.filter(
    (c) => c.currentPhase === "09_shortlist" || c.currentPhase === "11_standby"
  );
  
  const now = new Date();
  let totalHours = 0;
  blockageCandidates.forEach((c) => {
    const entry = new Date(c.entryDate);
    const diffMs = now.getTime() - entry.getTime();
    if (diffMs > 0) {
      totalHours += diffMs / (1000 * 60 * 60);
    }
  });

  const blockageTimeHours = blockageCandidates.length > 0 ? Math.round((totalHours / blockageCandidates.length) * 10) / 10 : 0;

  // 2. Average cNPS (Candidates with cNPS field)
  const candidatesWithNps = candidates.filter((c) => typeof c.cNPS === "number");
  const sumNps = candidatesWithNps.reduce((acc, c) => acc + (c.cNPS || 0), 0);
  const avgCNPS = candidatesWithNps.length > 0 ? Math.round((sumNps / candidatesWithNps.length) * 10) / 10 : 0;

  // 3. Calibration Accuracy: (10_entrevista_cliente + 11_standby) / Total candidates
  const acceptedToInterview = candidates.filter(
    (c) => c.currentPhase === "10_entrevista_cliente" || c.currentPhase === "11_standby"
  ).length;

  const calibrationAccuracy = activeWipCount > 0 ? Math.round((acceptedToInterview / activeWipCount) * 100) : 0;

  return {
    blockageTimeHours,
    avgCNPS,
    calibrationAccuracy,
    activeWipCount,
    isWipOverloaded
  };
}
