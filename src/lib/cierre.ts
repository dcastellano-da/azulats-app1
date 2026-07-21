export interface CierreCandidate {
  id: string;
  name: string;
  role: string;
  client: string;
  location: string;
  score: number; // Fit rating 0-100
  currentPhase: "11_oferta_extendida" | "12_contratado" | "13_rechazado_cliente" | "14_candidato_se_baja";
  entryDate: string; // ISO string when candidate entered the phase
  offerDate: string; // ISO string when offer was extended
  closedDate?: string; // ISO string when flow became final (Won/Lost/Drop-out)
  cNPS?: number; // Candidate Net Promoter Score [1-10]
  lastActivity: string;
  experienceYears: number;
  contactNumber: string;
  email: string;
  feedbackStatus: "pendiente" | "entregado_manual" | "automatizado";
  salaryDetails: {
    baseSalary: number; // Yearly gross in Euros
    expectedSalary: number; // Candidate's expected yearly gross
    bonusAnnual: number; // Simulated annual variable bonus
    benefitsValue: number; // Monetized annual corporate benefits
  };
  toolsDetails: {
    predictiveMotor: {
      baseProbability: number;
      adjustedProbability: number;
      riskFactors: string[];
      mitigationActionSelected: boolean;
    };
    feedbackWriter: {
      reasonsForReject: string;
      generatedFeedback: string;
      isSent: boolean;
    };
    contractGenerator: {
      generated: boolean;
      documentUrl?: string;
      contractType: string;
      startDate: string;
    };
    preOnboard: {
      cadenceSteps: { day: string; title: string; status: "sent" | "scheduled"; previewText: string }[];
      ghostingRisk: "Bajo" | "Medio" | "Alto";
    };
  };
}

// Initial mock dataset for closing (Cierre) process
export const INITIAL_CIERRE_CANDIDATES: CierreCandidate[] = [
  {
    id: "CAND-111",
    name: "Alicia Moreno Salvador",
    role: "Frontend Dev (React/Node)",
    client: "Inditex S.A.",
    location: "A Coruña, España / Remoto",
    score: 89,
    currentPhase: "11_oferta_extendida",
    entryDate: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // 36 hours ago
    offerDate: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(),
    lastActivity: "Propuesta formal enviada. Esperando negociación del esquema flexible.",
    experienceYears: 5.0,
    contactNumber: "+34 687 432 109",
    email: "alicia.moreno@gmail.com",
    feedbackStatus: "pendiente",
    salaryDetails: {
      baseSalary: 52000,
      expectedSalary: 54000,
      bonusAnnual: 3000,
      benefitsValue: 1500
    },
    toolsDetails: {
      predictiveMotor: {
        baseProbability: 64,
        adjustedProbability: 64,
        riskFactors: [
          "Contraoferta potencial de su empresa actual.",
          "Distancia geográfica respecto al headquarter central (requiere asegurar 90% remoto)."
        ],
        mitigationActionSelected: false
      },
      feedbackWriter: {
        reasonsForReject: "",
        generatedFeedback: "",
        isSent: false
      },
      contractGenerator: {
        generated: false,
        contractType: "Indefinido - Tiempo Completo",
        startDate: "2026-09-01"
      },
      preOnboard: {
        cadenceSteps: [
          { day: "Día +1", title: "Bienvenida ejecutiva y manual cultural", status: "scheduled", previewText: "Hola Alicia, estamos felices de incorporarte al equipo..." },
          { day: "Día +7", title: "Contacto informal con el Frontend Lead", status: "scheduled", previewText: "Hey Alicia, te comparto nuestro roadmap de Next.js..." }
        ],
        ghostingRisk: "Medio"
      }
    }
  },
  {
    id: "CAND-112",
    name: "Clara Pineda Rivas",
    role: "Product Manager Tech",
    client: "Telefónica S.A.",
    location: "Madrid, España / Híbrido",
    score: 91,
    currentPhase: "11_oferta_extendida",
    entryDate: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(), // 50 hours ago (>48h latency warning)
    offerDate: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
    lastActivity: "Borrador de propuesta extendido verbalmente. Ajustes en variables pendientes.",
    experienceYears: 6.5,
    contactNumber: "+34 611 987 654",
    email: "clara.pineda@telefonica.io",
    feedbackStatus: "pendiente",
    salaryDetails: {
      baseSalary: 62000,
      expectedSalary: 67000,
      bonusAnnual: 2500,
      benefitsValue: 2000
    },
    toolsDetails: {
      predictiveMotor: {
        baseProbability: 55,
        adjustedProbability: 85,
        riskFactors: [
          "Expectativa económica supera banda base en un 8%.",
          "Dudas en el plan de bonificación por hitos comerciales de infraestructura."
        ],
        mitigationActionSelected: true // Adjusted variable bonus to 6000
      },
      feedbackWriter: {
        reasonsForReject: "",
        generatedFeedback: "",
        isSent: false
      },
      contractGenerator: {
        generated: true,
        documentUrl: "/docs/cierre/contrato_clara_pineda.pdf",
        contractType: "Indefinido - Cuadro Técnico",
        startDate: "2026-09-15"
      },
      preOnboard: {
        cadenceSteps: [
          { day: "Día +1", title: "Bienvenida Ejecutiva", status: "scheduled", previewText: "Hola Clara..." }
        ],
        ghostingRisk: "Alto"
      }
    }
  },
  {
    id: "CAND-121",
    name: "Carlos Mendoza Vaca",
    role: "Software Architect Rust",
    client: "SEAT S.A.",
    location: "Barcelona, España / Híbrido",
    score: 96,
    currentPhase: "12_contratado",
    entryDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    offerDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
    closedDate: new Date(Date.now() - 40 * 60 * 60 * 1000).toISOString(), // 32 hours latency
    cNPS: 10,
    lastActivity: "¡Firma de contrato cargada en plataforma! Pre-onboarding iniciado.",
    experienceYears: 10.0,
    contactNumber: "+34 650 900 800",
    email: "carlos.mendoza.rust@gmail.com",
    feedbackStatus: "pendiente",
    salaryDetails: {
      baseSalary: 80000,
      expectedSalary: 80000,
      bonusAnnual: 8000,
      benefitsValue: 3000
    },
    toolsDetails: {
      predictiveMotor: {
        baseProbability: 92,
        adjustedProbability: 92,
        riskFactors: [],
        mitigationActionSelected: false
      },
      feedbackWriter: {
        reasonsForReject: "",
        generatedFeedback: "",
        isSent: false
      },
      contractGenerator: {
        generated: true,
        documentUrl: "/docs/cierre/contrato_carlos_mendoza.pdf",
        contractType: "Indefinido - Alta Dirección",
        startDate: "2026-08-15"
      },
      preOnboard: {
        cadenceSteps: [
          { day: "Día +1", title: "Kit de bienvenida digital enviado", status: "sent", previewText: "¡Hola Carlos! Bienvenido a bordo de SEAT digital..." },
          { day: "Día +3", title: "Asignación de Buddy para Onboarding", status: "sent", previewText: "Tu mentor asignado para las primeras semanas será Joan..." },
          { day: "Día +10", title: "Acceso temprano al repositorio de pruebas", status: "scheduled", previewText: "Hola Carlos, te damos de alta en GitHub..." }
        ],
        ghostingRisk: "Bajo"
      }
    }
  },
  {
    id: "CAND-122",
    name: "Diego Cortina Belmonte",
    role: "Frontend Dev (React/Node)",
    client: "Inditex S.A.",
    location: "Madrid, España / Remoto",
    score: 85,
    currentPhase: "12_contratado",
    entryDate: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    offerDate: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    closedDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 24 hours latency
    cNPS: 9,
    lastActivity: "Contrato firmado electrónicamente vía DocuSign. Transición exitosa.",
    experienceYears: 4.0,
    contactNumber: "+34 676 111 222",
    email: "diego.cortina@yahoo.es",
    feedbackStatus: "pendiente",
    salaryDetails: {
      baseSalary: 45000,
      expectedSalary: 45000,
      bonusAnnual: 2000,
      benefitsValue: 1500
    },
    toolsDetails: {
      predictiveMotor: {
        baseProbability: 80,
        adjustedProbability: 80,
        riskFactors: [],
        mitigationActionSelected: false
      },
      feedbackWriter: {
        reasonsForReject: "",
        generatedFeedback: "",
        isSent: false
      },
      contractGenerator: {
        generated: true,
        documentUrl: "/docs/cierre/contrato_diego_cortina.pdf",
        contractType: "Indefinido - Tiempo Completo",
        startDate: "2026-09-01"
      },
      preOnboard: {
        cadenceSteps: [
          { day: "Día +1", title: "Kit de bienvenida enviado", status: "sent", previewText: "¡Hola Diego! Bienvenido a bordo..." }
        ],
        ghostingRisk: "Bajo"
      }
    }
  },
  {
    id: "CAND-131",
    name: "Sofía Garzón Marín",
    role: "Product Manager Tech",
    client: "Telefónica S.A.",
    location: "Madrid, España",
    score: 79,
    currentPhase: "13_rechazado_cliente",
    entryDate: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    offerDate: new Date(Date.now() - 120 * 60 * 60 * 1000).toISOString(),
    closedDate: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
    lastActivity: "Proceso cerrado. Descartado por el cliente en fase salarial/negociación final.",
    experienceYears: 5.5,
    contactNumber: "+34 644 321 098",
    email: "sofia.garzon@outlook.com",
    feedbackStatus: "entregado_manual", // Counts towards constructive feedback
    salaryDetails: {
      baseSalary: 55000,
      expectedSalary: 64000,
      bonusAnnual: 0,
      benefitsValue: 1000
    },
    toolsDetails: {
      predictiveMotor: {
        baseProbability: 40,
        adjustedProbability: 40,
        riskFactors: ["Desalineación salarial no negociable por parte presupuestaria empresarial."],
        mitigationActionSelected: false
      },
      feedbackWriter: {
        reasonsForReject: "Desestimada al no poder flexibilizar el paquete salarial fijo dentro del tabulador corporativo y faltar experiencia en infraestructura cloud a gran escala.",
        generatedFeedback: "Estimada Sofía,\n\nQueremos agradecerte enormemente tu tiempo en el proceso de selección de Telefónica S.A.\n\nTras evaluar detalladamente las instancias finales, lamentablemente no podemos avanzar con tu contratación en esta ocasión. El cliente requiere un perfil con sólida experiencia en arquitectura cloud a bajo nivel e infraestructura de escala masiva que cumpla estrictamente con la banda presupuestada disponible.\n\nHemos registrado tu perfil para futuras vacantes y valoramos profundamente tu calidad humana y profesional.\n\nRecibe un cordial saludo,\nEquipo de Selección Azul ATS.",
        isSent: true
      },
      contractGenerator: {
        generated: false,
        contractType: "No aplicable",
        startDate: ""
      },
      preOnboard: {
        cadenceSteps: [],
        ghostingRisk: "Bajo"
      }
    }
  },
  {
    id: "CAND-141",
    name: "Bruno Rossi Fittipaldi",
    role: "SecOps Specialist",
    client: "Banco Santander",
    location: "Madrid, España / Remoto",
    score: 88,
    currentPhase: "14_candidato_se_baja",
    entryDate: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
    offerDate: new Date(Date.now() - 144 * 60 * 60 * 1000).toISOString(),
    closedDate: new Date(Date.now() - 100 * 60 * 60 * 1000).toISOString(), // Latency of 44 hours
    lastActivity: "Candidato rechazó la propuesta. Aceptó contraoferta de retención de su empresa actual.",
    experienceYears: 6.0,
    contactNumber: "+34 689 777 666",
    email: "bruno.rossi.secops@gmail.com",
    feedbackStatus: "pendiente",
    salaryDetails: {
      baseSalary: 56000,
      expectedSalary: 55000,
      bonusAnnual: 3000,
      benefitsValue: 2000
    },
    toolsDetails: {
      predictiveMotor: {
        baseProbability: 72,
        adjustedProbability: 72,
        riskFactors: [
          "Empresa actual le comunica contraoferta agresiva para retenerle.",
          "Cercanía familiar al lugar de trabajo actual."
        ],
        mitigationActionSelected: false
      },
      feedbackWriter: {
        reasonsForReject: "Candidato se decanta por contraoferta económica atractiva de retención de su empleador actual (+15% base salarial).",
        generatedFeedback: "Estimado Bruno,\n\nLamentamos que en esta ocasión no te incorpores al Banco Santander, pero comprendemos y apoyamos tu decisión profesional ante una contraoferta robusta de tu empresa actual.\n\nTe deseamos el mejor de los éxitos y mantendremos el contacto para futuras colaboraciones del área de ciberseguridad.\n\nAtentamente,\nAzul ATS.",
        isSent: true
      },
      contractGenerator: {
        generated: false,
        contractType: "No aplicable",
        startDate: ""
      },
      preOnboard: {
        cadenceSteps: [],
        ghostingRisk: "Bajo"
      }
    }
  }
];

export interface CierreKPIs {
  offerAcceptanceRate: number; // Hired(12) / Resolved Hires (Hired(12) + DropOut(14)) * 100
  avgDecisionLatencyHours: number; // Avg latency of offer closure in hours
  feedbackClosureRate: number; // (Manual feedbacks / Lost + DropOuts) * 100
  activeClosingWipCount: number; // Number of active negos (11_oferta_extendida)
  isWipOverloaded: boolean; // True if active negos > 5
}

export function calculateCierreKPIs(candidates: CierreCandidate[]): CierreKPIs {
  // Count active WIP (candidates under offer extension, phase 11)
  const activeClosingWipCount = candidates.filter(c => c.currentPhase === "11_oferta_extendida").length;
  const isWipOverloaded = activeClosingWipCount > 5;

  // 1. Offer Acceptance Rate (OAR) = 12_contratado / (12_contratado + 14_candidato_se_baja) * 100
  const contractedCount = candidates.filter(c => c.currentPhase === "12_contratado").length;
  const dropOutCount = candidates.filter(c => c.currentPhase === "14_candidato_se_baja").length;
  const resolvedOffersCount = contractedCount + dropOutCount;
  const offerAcceptanceRate = resolvedOffersCount > 0 ? Math.round((contractedCount / resolvedOffersCount) * 100) : 0;

  // 2. Average Decision Latency: average hours from offerDate to closedDate for all resolved candidates (12, 13, 14)
  const resolvedCandidates = candidates.filter(
    c => (c.currentPhase === "12_contratado" || c.currentPhase === "13_rechazado_cliente" || c.currentPhase === "14_candidato_se_baja") && c.closedDate
  );
  
  let totalLatencyHours = 0;
  resolvedCandidates.forEach(c => {
    if (c.closedDate) {
      const offer = new Date(c.offerDate);
      const closed = new Date(c.closedDate);
      const diffMs = closed.getTime() - offer.getTime();
      if (diffMs > 0) {
        totalLatencyHours += diffMs / (1000 * 60 * 60);
      }
    }
  });
  
  const avgDecisionLatencyHours = resolvedCandidates.length > 0 
    ? Math.round((totalLatencyHours / resolvedCandidates.length) * 10) / 10 
    : 0;

  // 3. Feedback Closure Rate = (Rejected (13) + Dropouts (14) with feedbackStatus === 'entregado_manual') / Total (13 + 14) * 100
  const rejectedPool = candidates.filter(c => c.currentPhase === "13_rechazado_cliente" || c.currentPhase === "14_candidato_se_baja");
  const manualFeedbackCount = rejectedPool.filter(c => c.feedbackStatus === "entregado_manual").length;
  const feedbackClosureRate = rejectedPool.length > 0 
    ? Math.round((manualFeedbackCount / rejectedPool.length) * 100) 
    : 0;

  return {
    offerAcceptanceRate,
    avgDecisionLatencyHours,
    feedbackClosureRate,
    activeClosingWipCount,
    isWipOverloaded
  };
}
