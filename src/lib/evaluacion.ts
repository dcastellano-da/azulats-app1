export interface EvaluacionCandidate {
  id: string;
  name: string;
  role: string;
  client: string;
  location: string;
  score: number; // Fit rating 0-100
  currentPhase: "05_screening" | "06_assessment" | "07_descartado_interno";
  entryDate: string; // ISO string to check WIP bottleneck times
  cNPS?: number; // Candidate Net Promoter Score [1-10]
  lastActivity: string;
  experienceYears: number;
  contactNumber: string;
  email: string;
  toolsDetails: {
    sintetizador: {
      pros: string[];
      contras: string[];
      riesgos: string[];
    };
    inconsistencias: {
      hasGaps: boolean;
      gaps: { period: string; duration: string; description: string }[];
      overlaps: string[];
    };
    preguntas: string[];
    validador: {
      ip: string;
      location: string;
      envStatus: string;
      verificationStatus: "success" | "pending" | "fail";
      screenshotUrl?: string;
    };
    copilot: {
      activeSession: boolean;
      difficultyLevel: "Junior" | "Middle" | "Senior" | "Lead";
      completionRate: number; // e.g. 85 / 100
      effortScore: number; // capacity vs estimated points match rating (1-5)
      languageUsed: string;
      summary: string;
    };
  };
}

// Initial mock dataset for Evaluacion page
export const INITIAL_EVALUACION_CANDIDATES: EvaluacionCandidate[] = [
  {
    id: "CAND-051",
    name: "Alejandro Sanz Gómez",
    role: "Frontend Dev (React/Node)",
    client: "Inditex S.A.",
    location: "A Coruña, España / Remoto",
    score: 87,
    currentPhase: "05_screening",
    entryDate: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(), // 40 hours ago (under 48h limit)
    cNPS: 9,
    lastActivity: "Entrevista telefónica agendada para mañana a las 10:00 AM.",
    experienceYears: 4.5,
    contactNumber: "+34 654 987 321",
    email: "alejandro.sanz@gmail.com",
    toolsDetails: {
      sintetizador: {
        pros: [
          "Sólida experiencia con React 18 y TypeScript en ambientes productivos.",
          "Capacidad comunicativa fluida y empática.",
          "Portafolio con proyectos web responsive optimizados."
        ],
        contras: [
          "Poco bagaje trabajando en arquitecturas cloud complejas basadas en microservicios."
        ],
        riesgos: [
          "Pretensiones económicas ligeramente por encima de la media presupuestaria inicial, requerirá negociación."
        ]
      },
      inconsistencias: {
        hasGaps: false,
        gaps: [],
        overlaps: []
      },
      preguntas: [
        "¿Cómo manejas el estado global en aplicaciones de gran escala (¿Redux Toolkit, Zustand o Context API?) y en qué casos prefieres uno sobre otro?",
        "Describe un reto performance crítico que hayas solucionado en React y cómo mediste el impacto del cambio.",
        "¿Cuál ha sido tu experiencia coordinando con diseñadores UI/UX sobre entregables de Figma complejos?"
      ],
      validador: {
        ip: "82.164.23.45",
        location: "A Coruña, España",
        envStatus: "Ambiente limpio verificado. Sin señales de software de asistencia remota activa.",
        verificationStatus: "success",
        screenshotUrl: "/docs/manual/login_page.png" // Mocked image reference
      },
      copilot: {
        activeSession: true,
        difficultyLevel: "Middle",
        completionRate: 92,
        effortScore: 4.5,
        languageUsed: "TypeScript / React",
        summary: "Alejandro completó la sesión de Live Coding con un excelente nivel de modularidad. Identificó rápidamente un bug semántico en el componente renderizado y lo arregló aplicando hooks óptimos de memoria."
      }
    }
  },
  {
    id: "CAND-052",
    name: "Marta Sánchez Rey",
    role: "Product Manager Tech",
    client: "Telefónica S.A.",
    location: "Madrid, España / Remoto",
    score: 93,
    currentPhase: "05_screening",
    entryDate: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(), // 12 hours ago
    cNPS: 10,
    lastActivity: "Screening inicial completado. Feedback del cNPS estelar.",
    experienceYears: 6.0,
    contactNumber: "+34 612 345 678",
    email: "marta.sanchez@telefonica.net",
    toolsDetails: {
      sintetizador: {
        pros: [
          "Excelente dominio de metodologías ágiles (Scrum, Kanban) y métricas de negocio.",
          "Historial liderando equipos multidisciplinares de ingeniería.",
          "Familiaridad con pipelines de CI/CD orientados a negocio."
        ],
        contras: [
          "Poco background técnico en backend de nivel de infraestructura pura."
        ],
        riesgos: [
          "Ninguno a nivel cultural. Encaja perfectamente en la barra senior de Telefónica."
        ]
      },
      inconsistencias: {
        hasGaps: true,
        gaps: [
          {
            period: "Ene 2023 - Ago 2023",
            duration: "8 meses",
            description: "Transición laboral sin registro de empleo formal. Candidata menciona haber realizado un viaje sabático académico."
          }
        ],
        overlaps: []
      },
      preguntas: [
        "Cuéntanos sobre una situación real donde tuviste que priorizar features conflictivas sugeridas por los stakeholders clave de una cuenta crítica. ¿Qué frameworks de priorización utilizaste?",
        "¿Cómo manejas la resolución de bloqueos técnicos profundos entre desarrollo y la visión estratégica del cliente?",
        "Define brevemente tu métrica favorita para monitorear la salud de entrega de un producto digital y cómo influye en tu planeación."
      ],
      validador: {
        ip: "213.60.101.4",
        location: "Madrid, España",
        envStatus: "Detección de segundo monitor activo durante el screening asíncrono. Validado por reclutadora como monitor alterno de notas.",
        verificationStatus: "success"
      },
      copilot: {
        activeSession: false,
        difficultyLevel: "Senior",
        completionRate: 0,
        effortScore: 0,
        languageUsed: "Ninguno",
        summary: "Aún no ha agendado la sesión colaborativa en vivo de Product Design."
      }
    }
  },
  {
    id: "CAND-061",
    name: "Javier Bardem Costa",
    role: "Software Architect Rust",
    client: "SEAT S.A.",
    location: "Barcelona, España",
    score: 95,
    currentPhase: "06_assessment",
    entryDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 72 hours ago (Warning: Cycle bottlenecks!)
    cNPS: 8,
    lastActivity: "Desafío técnico en Rust enviado. Esperando entrega para revisión.",
    experienceYears: 9.0,
    contactNumber: "+34 600 789 456",
    email: "javier.rust@architect.io",
    toolsDetails: {
      sintetizador: {
        pros: [
          "Uno de los perfiles de Rust más calificados del ecosistema local.",
          "Amplia experiencia en sistemas embebidos automotrices y concurrencia.",
          "Capacidad demostrada de liderazgo constructivo y mentoría."
        ],
        contras: [
          "Preferencia marcada por trabajar de forma 100% presencial en la sede de Barcelona, lo que reduce flexibilidad."
        ],
        riesgos: [
          "WIP Cycle prolongado (72 horas) debido a retrasos en la respuesta de su assessment técnico."
        ]
      },
      inconsistencias: {
        hasGaps: false,
        gaps: [],
        overlaps: [
          "Superposición de 3 meses entre Feb 2021 y Abr 2021 en dos consultores diferentes. Candidato aclara que fue un traspaso estructurado de proyectos compartidos (freelance)."
        ]
      },
      preguntas: [
        "¿Cuáles son tus estrategias preferidas en Rust para optimizar concurrencia segura y evitar race conditions en sistemas distribuidos?",
        "Explica los pros y contras del recolector de basura de otros lenguajes contra el sistema de borrow checker de Rust en una aplicación embebida de automoción.",
        "¿Cómo documentas decisiones de arquitectura críticas (por ejemplo, mediante Architecture Decision Records) para equipos medianos?"
      ],
      validador: {
        ip: "77.209.112.5",
        location: "Barcelona, España",
        envStatus: "Verificado. Mismo entorno e IP que durante la llamada inicial.",
        verificationStatus: "success"
      },
      copilot: {
        activeSession: true,
        difficultyLevel: "Lead",
        completionRate: 98,
        effortScore: 5.0,
        languageUsed: "Rust / WebAssembly",
        summary: "El candidato demostró una maestría absoluta del lenguaje Rust. Creó una libreta de optimización segura sobre memoria asíncrona reduciendo latencias en un 44%. Co-pilot estimó esfuerzo sobresaliente."
      }
    }
  },
  {
    id: "CAND-062",
    name: "Elena Fuertes Gil",
    role: "SecOps Specialist",
    client: "Banco Santander",
    location: "Madrid, España / Remoto",
    score: 82,
    currentPhase: "06_assessment",
    entryDate: new Date(Date.now() - 56 * 60 * 60 * 1000).toISOString(), // 56 hours ago (Warning: Cycle bottlenecks!)
    cNPS: 7,
    lastActivity: "Test psicométrico completado. Evaluación de seguridad en curso.",
    experienceYears: 5.0,
    contactNumber: "+34 689 123 456",
    email: "elena.fuertes.security@gmail.com",
    toolsDetails: {
      sintetizador: {
        pros: [
          "Certificación oficial CISSP vigente.",
          "Experiencia en automatización de análisis de vulnerabilidades en nubes AWS y GCP.",
          "Fuertes dotes en auditoría y cumplimiento normativo bancario."
        ],
        contras: [
          "Conocimientos moderados en desarrollo nativo de scripts complejos en Python/Go."
        ],
        riesgos: [
          "Ha tenido algunos desencuentros pasados en la adaptabilidad a entornos ágiles rápidos, prefiere ambientes tradicionales corporativos estructurados."
        ]
      },
      inconsistencias: {
        hasGaps: true,
        gaps: [
          {
            period: "Nov 2021 - Feb 2022",
            duration: "3 meses",
            description: "Hueco entre contratos. Candidata reporta periodo en transición de búsqueda activa."
          }
        ],
        overlaps: []
      },
      preguntas: [
        "¿Cómo integrarías escaneos de SAST/DAST directamente en un pipeline moderno Gitlab CI en un entorno bancario seguro?",
        "Define tu estrategia para procesar y responder ante un incidente de Zero-Day reportado internamente en producción.",
        "¿Cuál ha sido tu mayor aprendizaje mitigando ataques de escalada de privilegios en nubes públicas?"
      ],
      validador: {
        ip: "192.168.1.189", // Local IP simulated
        location: "Alcobendas, España",
        envStatus: "Detección de entrada de comandos por teclado con patrones sospechosos. La tasa de copiado-pegado superó el 30%, alertando posible consultor de terceros.",
        verificationStatus: "fail"
      },
      copilot: {
        activeSession: true,
        difficultyLevel: "Middle",
        completionRate: 45,
        effortScore: 2.0,
        languageUsed: "YAML / Bash Scripting",
        summary: "La candidata completó sólo el 45% de la sesión de codificación reactiva. Tuvo dificultades severas diseñando las especificaciones de seguridad YAML y se desconectó de forma intempestiva."
      }
    }
  },
  {
    id: "CAND-071",
    name: "Roberto Gómez Ruiz",
    role: "Frontend Dev (React/Node)",
    client: "Inditex S.A.",
    location: "Madrid, España / Remoto",
    score: 68,
    currentPhase: "07_descartado_interno",
    entryDate: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    cNPS: 5,
    lastActivity: "Descartado internamente. Brecha de habilidades técnicas alta.",
    experienceYears: 2.0,
    contactNumber: "+34 677 333 444",
    email: "roberto.rgomez@hotmail.com",
    toolsDetails: {
      sintetizador: {
        pros: [
          "Mención académica meritoria.",
          "Muchas ganas de aprender y buena actitud."
        ],
        contras: [
          "Habilidades débiles en CSS Grid y precomputación Node.js.",
          "Falta de experiencia en equipos formales de producto de nivel enterprise."
        ],
        riesgos: [
          "No cumple con la barra técnica requerida para el puesto senior de Inditex S.A. Presupuesto inferior al aspirado."
        ]
      },
      inconsistencias: {
        hasGaps: false,
        gaps: [],
        overlaps: []
      },
      preguntas: [
        "Explica la diferencia técnica clave entre el Server-Side Rendering (SSR) y Static Site Generation (SSG) en Next.js.",
        "¿Cómo manejas la carga diferida (lazy loading) e importaciones dinámicas en componentes React?",
        "¿Qué estrategias de diseño web adaptativo dominas para soportar navegadores legados?"
      ],
      validador: {
        ip: "80.201.2.33",
        location: "Toledo, España",
        envStatus: "Verificado. Cumple protocolos.",
        verificationStatus: "success"
      },
      copilot: {
        activeSession: true,
        difficultyLevel: "Junior",
        completionRate: 30,
        effortScore: 1.5,
        languageUsed: "TypeScript / Next.js",
        summary: "Completó con dificultad el 30% del ejercicio. Cargar los estados asíncronos congeló el runtime del renderizado al generar un stack-overflow por hooks mal implementados. Calificado como junior inicial."
      }
    }
  }
];

// Helper calculations for Metrics
export interface EvaluacionKPIs {
  wipCycleTimeHours: number;
  avgCNPS: number;
  passThroughRate: number;
  activeWipCount: number;
  isWipOverloaded: boolean;
}

export function calculateEvaluacionKPIs(candidates: EvaluacionCandidate[]): EvaluacionKPIs {
  // WIP Count represents candidates who are actively in screening (05) or assessment (06).
  const wipCandidates = candidates.filter(
    (c) => c.currentPhase === "05_screening" || c.currentPhase === "06_assessment"
  );
  
  const activeWipCount = wipCandidates.length;
  const isWipOverloaded = activeWipCount > 10;

  // 1. WIP Cycle Time Calculation (Average differences from entryDate to now, in hours)
  const now = new Date();
  let totalHours = 0;
  wipCandidates.forEach((c) => {
    const entry = new Date(c.entryDate);
    const diffMs = now.getTime() - entry.getTime();
    if (diffMs > 0) {
      totalHours += diffMs / (1000 * 60 * 60);
    }
  });
  
  const wipCycleTimeHours = activeWipCount > 0 ? Math.round((totalHours / activeWipCount) * 10) / 10 : 0;

  // 2. Average cNPS (Candidates with cNPS field)
  const candidatesWithNps = candidates.filter((c) => typeof c.cNPS === "number");
  const sumNps = candidatesWithNps.reduce((acc, c) => acc + (c.cNPS || 0), 0);
  const avgCNPS = candidatesWithNps.length > 0 ? Math.round((sumNps / candidatesWithNps.length) * 10) / 10 : 0;

  // 3. Pass-through Rate: (Assessment candidates + Non-discarded) / Total active
  // Since we don't have a final client submission state yet in Phase 2, candidates in 06 (Assessment)
  // or those who have stayed active represent their pass-through ability.
  // Formula: Percentage of candidates evaluated (06 + any sent beyond) out of all non-discarded (05 + 06).
  const totalScreened = candidates.filter(
    (c) => c.currentPhase === "05_screening" || c.currentPhase === "06_assessment"
  ).length;
  
  const passedToAssessment = candidates.filter((c) => c.currentPhase === "06_assessment").length;
  const passThroughRate = totalScreened > 0 ? Math.round((passedToAssessment / totalScreened) * 100) : 0;

  return {
    wipCycleTimeHours,
    avgCNPS,
    passThroughRate,
    activeWipCount,
    isWipOverloaded
  };
}
