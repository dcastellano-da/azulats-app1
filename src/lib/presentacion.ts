export interface PresentacionCandidate {
  id: string;
  name: string;
  role: string;
  client: string;
  location: string;
  score: number; // Fit rating 0-100
  currentPhase: "08_shortlist" | "09_entrevista_cliente" | "10_standby";
  entryDate: string; // ISO string to check WIP blockage times
  cNPS?: number; // Candidate Net Promoter Score [1-10]
  lastActivity: string;
  experienceYears: number;
  contactNumber: string;
  email: string;
  toolsDetails: {
    analitica: {
      transcriptSnippets: { speaker: string; text: string }[];
      sentimentScore: number; // 0 to 100
      globalSentiment: "Positivo" | "Neutro" | "Negativo";
      salaryAlert: boolean;
      salaryRequested: string;
      salaryOffered: string;
      microExpressionsDetected: string[];
    };
    traductor: {
      originalCVText: string;
      translatedCVText: string;
      cvTranslated: boolean;
    };
    briefing: {
      generated: boolean;
      content: string;
    };
    agenda: {
      suggestedSlots: string[];
      recruiterSlotSelected?: string;
      isScheduled: boolean;
    };
    tracker: {
      hoursSinceSent: number;
      slaExceeded: boolean;
      totalRemindersSent: number;
      lastReminderTime?: string;
    };
  };
}

// Initial mock dataset for Presentacion page
export const INITIAL_PRESENTACION_CANDIDATES: PresentacionCandidate[] = [
  {
    id: "CAND-081",
    name: "Alejandro Sanz Gómez",
    role: "Frontend Dev (React/Node)",
    client: "Inditex S.A.",
    location: "A Coruña, España / Remoto",
    score: 87,
    currentPhase: "08_shortlist",
    entryDate: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(), // 40 hours ago
    cNPS: 9,
    lastActivity: "CV y Briefing enviado al Hiring Manager de Inditex S.A.",
    experienceYears: 4.5,
    contactNumber: "+34 654 987 321",
    email: "alejandro.sanz@gmail.com",
    toolsDetails: {
      analitica: {
        transcriptSnippets: [
          { speaker: "Candidato", text: "Busco proyectos con Next.js y arquitecturas modulares." },
          { speaker: "Reclutador", text: "Perfecto, Inditex usa esa tecnología en sus paneles internos." }
        ],
        sentimentScore: 88,
        globalSentiment: "Positivo",
        salaryAlert: false,
        salaryRequested: "45.000 € brutos/año",
        salaryOffered: "48.000 € brutos/año maximum",
        microExpressionsDetected: ["Entusiasmo al hablar de Next.js", "Tranquilidad y seguridad"]
      },
      traductor: {
        originalCVText: "Desarrollador Frontend con más de 4 años de experiencia en React y TypeScript.",
        translatedCVText: "Classified Summary: Frontend Developer with over 4 years of experience in React and TypeScript. Proven expertise in responsive web modules and state management.",
        cvTranslated: false
      },
      briefing: {
        generated: true,
        content: "El candidato Alejandro Sanz Gómez se presenta para la posición de Frontend Dev. Cuenta con 4.5 años de experiencia técnica sólida en React/TypeScript con Next.js.\n\nPosee excelentes habilidades blandas de comunicación estructurada y trabajo colaborativo para coordinar con equipos de diseño UI/UX en Figma.\n\nSus expectativas de compensación (45k€) encajan adecuadamente dentro de la banda salarial máxima autorizada por Inditex S.A (48k€), reduciendo el riesgo financiero de retención temprana."
      },
      agenda: {
        suggestedSlots: [
          "Miércoles 22 Julio - 10:00h CEST",
          "Miércoles 22 Julio - 11:30h CEST",
          "Jueves 23 Julio - 16:00h CEST"
        ],
        isScheduled: false
      },
      tracker: {
        hoursSinceSent: 40,
        slaExceeded: false,
        totalRemindersSent: 0
      }
    }
  },
  {
    id: "CAND-082",
    name: "Marta Sánchez Rey",
    role: "Product Manager Tech",
    client: "Telefónica S.A.",
    location: "Madrid, España / Remoto",
    score: 93,
    currentPhase: "08_shortlist",
    entryDate: new Date(Date.now() - 56 * 60 * 60 * 1000).toISOString(), // 56 hours ago (SLA overload warning > 48h)
    cNPS: 10,
    lastActivity: "Expediente enviado a Telefónica S.A. Esperando confirmación de agenda.",
    experienceYears: 6.0,
    contactNumber: "+34 612 345 678",
    email: "marta.sanchez@telefonica.net",
    toolsDetails: {
      analitica: {
        transcriptSnippets: [
          { speaker: "Candidata", text: "He gestionado lanzamientos de productos de gran envergadura." },
          { speaker: "Reclutador", text: "Excelente, aquí liderarás el equipo de core infrastructure." }
        ],
        sentimentScore: 91,
        globalSentiment: "Positivo",
        salaryAlert: true, // Requested > Offered
        salaryRequested: "65.000 € brutos/año",
        salaryOffered: "60.000 € brutos/año",
        microExpressionsDetected: ["Inquietud al tocar el tema salarial", "Seguridad laboral alta"]
      },
      traductor: {
        originalCVText: "Directora de Producto con foco en automatización ágil y arquitectura en la nube.",
        translatedCVText: "Classified Summary: Technical Product Manager with focus on Agile automation and Cloud Architecture. Lead multidisciplinary engineering squads to establish core deliverables.",
        cvTranslated: false
      },
      briefing: {
        generated: false,
        content: ""
      },
      agenda: {
        suggestedSlots: [
          "Jueves 23 Julio - 09:30h CEST",
          "Viernes 24 Julio - 11:00h CEST"
        ],
        isScheduled: false
      },
      tracker: {
        hoursSinceSent: 56,
        slaExceeded: true,
        totalRemindersSent: 0
      }
    }
  },
  {
    id: "CAND-091",
    name: "Javier Bardem Costa",
    role: "Software Architect Rust",
    client: "SEAT S.A.",
    location: "Barcelona, España",
    score: 95,
    currentPhase: "09_entrevista_cliente",
    entryDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 72 hours ago
    cNPS: 8,
    lastActivity: "Entrevista técnica completada con el equipo automotriz de SEAT S.A.",
    experienceYears: 9.0,
    contactNumber: "+34 600 789 456",
    email: "javier.rust@architect.io",
    toolsDetails: {
      analitica: {
        transcriptSnippets: [
          { speaker: "Hiring Manager", text: "Javier, tu prueba de Rust fue excelente a nivel asíncrono." },
          { speaker: "Javier", text: "Muchas gracias, logré optimizar el runtime a bajo nivel." }
        ],
        sentimentScore: 96,
        globalSentiment: "Positivo",
        salaryAlert: false,
        salaryRequested: "80.000 € brutos/año",
        salaryOffered: "80.000 € brutos/año",
        microExpressionsDetected: ["Sintonía con el entrevistador", "Gesticulación manual descriptiva"]
      },
      traductor: {
        originalCVText: "Arquitecto de Software Rust y sistemas distribuidos en automoción.",
        translatedCVText: "Classified Summary: Rust Software Architect with specialization in distributed automotive telemetry and concurrency pipelines.",
        cvTranslated: true
      },
      briefing: {
        generated: true,
        content: "El candidato Javier Bardem Costa califica excelsamente para SEAT S.A. como Arquitecto de Rust.\n\nDemuestra liderazgo robusto y habilidades para la estructuración de Architecture Decision Records en equipos de tamaño medio.\n\nTotal alineación salarial en el tope de la banda presupuestada (80k€/anual)."
      },
      agenda: {
        suggestedSlots: [],
        recruiterSlotSelected: "Lunes 20 Julio - 10:00h CEST",
        isScheduled: true
      },
      tracker: {
        hoursSinceSent: 72,
        slaExceeded: true,
        totalRemindersSent: 2,
        lastReminderTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      }
    }
  },
  {
    id: "CAND-092",
    name: "Elena Fuertes Gil",
    role: "SecOps Specialist",
    client: "Banco Santander",
    location: "Madrid, España / Remoto",
    score: 82,
    currentPhase: "09_entrevista_cliente",
    entryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    cNPS: 7,
    lastActivity: "Segunda ronda de entrevista agendada con el Director de Ciberseguridad.",
    experienceYears: 5.0,
    contactNumber: "+34 689 123 456",
    email: "elena.fuertes.security@gmail.com",
    toolsDetails: {
      analitica: {
        transcriptSnippets: [
          { speaker: "Hiring Manager", text: "¿Cómo auditas accesos root temporales en GCP?" },
          { speaker: "Elena", text: "Normalmente implemento políticas estrictas de IAM y logs en Cloud Trail." }
        ],
        sentimentScore: 72,
        globalSentiment: "Neutro",
        salaryAlert: false,
        salaryRequested: "55.000 € brutos/año",
        salaryOffered: "58.000 € brutos/año",
        microExpressionsDetected: ["Micro-duda al responder sobre GCP vs AWS"]
      },
      traductor: {
        originalCVText: "Especialista en seguridad SecOps con certificación CISSP.",
        translatedCVText: "Classified Summary: SecOps Specialist with active CISSP Certification. Strong focus on vulnerability scanning audits in GCP/AWS.",
        cvTranslated: false
      },
      briefing: {
        generated: true,
        content: "Elena Fuertes posee sólidos conocimientos SecOps y cumplimiento bancario que encajan perfectamente con el Banco Santander.\n\nDemuestra habilidades comunicativas claras orientadas a procesos corporativos estructurados.\n\nExpectativa económica totalmente alineada de manera favorable a la banda admitida del cliente."
      },
      agenda: {
        suggestedSlots: [
          "Lunes 27 Julio - 12:00h CEST",
          "Martes 28 Julio - 10:00h CEST"
        ],
        isScheduled: false
      },
      tracker: {
        hoursSinceSent: 24,
        slaExceeded: false,
        totalRemindersSent: 0
      }
    }
  },
  {
    id: "CAND-101",
    name: "Roberto Gómez Ruiz",
    role: "Frontend Dev (React/Node)",
    client: "Inditex S.A.",
    location: "Madrid, España / Remoto",
    score: 78,
    currentPhase: "10_standby",
    entryDate: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    cNPS: 5,
    lastActivity: "Candidato colocado en Stand-by tras entrevista por Inditex S.A. Evalúan perfiles alternativos.",
    experienceYears: 3.0,
    contactNumber: "+34 677 333 444",
    email: "roberto.rgomez@hotmail.com",
    toolsDetails: {
      analitica: {
        transcriptSnippets: [
          { speaker: "Entrevistador", text: "¿Tienes experiencia con micro-frontends en producción?" },
          { speaker: "Roberto", text: "No, he leído la documentación pero no he tenido oportunidad en ambientes reales." }
        ],
        sentimentScore: 60,
        globalSentiment: "Neutro",
        salaryAlert: false,
        salaryRequested: "40.000 € brutos/año",
        salaryOffered: "48.000 € brutos/año",
        microExpressionsDetected: ["Inseguridad al admitir falta de micro-frontends"]
      },
      traductor: {
        originalCVText: "Desarrollador web Frontend junior con conocimientos iniciales de Node.js.",
        translatedCVText: "Classified Summary: Web Developer Frontend with React foundation and basic Node.js support. Motivated to learn enterprise guidelines.",
        cvTranslated: true
      },
      briefing: {
        generated: true,
        content: "Roberto posee buena aptitud académica y potencial de desarrollo técnico en React.\n\nBrecha técnico-productiva: Requiere supervisión en arquitecturas concurrentes y optimizaciones Node.\n\nSLA financiero inmejorable al solicitar 40k€ frente al presupuesto cliente de 48k€."
      },
      agenda: {
        suggestedSlots: [],
        recruiterSlotSelected: "Jueves 16 Julio - 11:00h CEST",
        isScheduled: true
      },
      tracker: {
        hoursSinceSent: 96,
        slaExceeded: true,
        totalRemindersSent: 1,
        lastReminderTime: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
      }
    }
  }
];

// Helper calculations for Metrics Stage 3
export interface PresentacionKPIs {
  blockageTimeHours: number; // Avg hours candidates wait in 08_shortlist and 10_standby
  avgCNPS: number;
  calibrationAccuracy: number; // Percentage of candidates interviewed (09) or in standby (10) out of total shortlist candidates
  activeWipCount: number;
  isWipOverloaded: boolean;
}

export function calculatePresentacionKPIs(candidates: PresentacionCandidate[]): PresentacionKPIs {
  // All candidates in presentacion are active WIP. Let's count them.
  const activeWipCount = candidates.length;
  const isWipOverloaded = activeWipCount > 10;

  // 1. Average Blockage Time: candidates waiting for feedback (08_shortlist or 10_standby)
  const blockageCandidates = candidates.filter(
    (c) => c.currentPhase === "08_shortlist" || c.currentPhase === "10_standby"
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

  // 3. Calibration Accuracy: (09_entrevista_cliente + 10_standby) / Total candidates
  const acceptedToInterview = candidates.filter(
    (c) => c.currentPhase === "09_entrevista_cliente" || c.currentPhase === "10_standby"
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
