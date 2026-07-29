'use server';

import { cookies } from "next/headers";
import { getApiEndpoint } from "@/utils/api";

export interface Candidato {
  id: string;
  nombre_completo: string;
  email: string;
  linkedin_url: string;
  puesto: string;
  origen: string; // 'Landing Page' | 'Manual'
  acepta_privacidad: boolean;
  estado_revision: 'Pendiente' | 'Revisado' | 'Descartado' | 'Seleccionado';
  url_cv: string;
  createdAt: string;
  updatedAt?: string;
  telefono_movil?: string | null;
  ubicacion?: string | null;
  skills_principales?: string | null;
  nivel_ingles?: string | null;
  otros_idiomas?: string | null;
  notas_iniciales?: string | null;
  resumen?: string | null;
  rubros?: string | null;
  canal_ingreso?: string | null;
}

export interface APIResponse {
  status: number;
  success: boolean;
  message: string;
  data?: any;
}

/**
 * Returns security JWT token from Next.js server cookies.
 */
async function getServerAuthToken(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get("azul_ats_token")?.value;
  if (!token) {
    console.log("[Server Action candidatos] Token de sesión no encontrado en cookie, usando mock-token-recruiter para conectar a Express local puerto 8080");
    return "mock-token-recruiter";
  }
  return token;
}

const apiToFrontendStatus = (apiStatus: string): 'Pendiente' | 'Revisado' | 'Descartado' | 'Seleccionado' => {
  const s = (apiStatus || "").toLowerCase().trim();
  if (s === "pendiente") return "Pendiente";
  if (s === "revisado") return "Revisado";
  if (s === "descartado") return "Descartado";
  if (s === "seleccionado") return "Seleccionado";
  if (apiStatus === "Pendiente" || apiStatus === "Revisado" || apiStatus === "Descartado" || apiStatus === "Seleccionado") {
    return apiStatus as 'Pendiente' | 'Revisado' | 'Descartado' | 'Seleccionado';
  }
  return "Pendiente";
};

/**
 * Server Action: Retrieves all candidates espontáneos.
 * GET /api/v1/candidatos
 */
export async function getCandidatosAPI(): Promise<APIResponse> {
  const fallbackCandidatos: Candidato[] = [
    {
      id: "cand-001",
      nombre_completo: "Diego Lozano",
      email: "diego.lozano@example.com",
      linkedin_url: "https://linkedin.com/in/diegolozano",
      puesto: "Software Architect Rust",
      origen: "Directo ATS",
      acepta_privacidad: true,
      estado_revision: "Pendiente",
      url_cv: "https://storage.googleapis.com/cvs/diego_lozano.pdf",
      createdAt: "2026-07-20T10:00:00Z",
      telefono_movil: "+34 612 345 678",
      ubicacion: "Barcelona / Remoto",
      skills_principales: "Rust, WebAssembly, C++, Embedded Systems",
      nivel_ingles: "B2 Intermedio",
      otros_idiomas: "Español (Nativo), Catalán",
      notas_iniciales: "Candidato con gran visión en sistemas distribuidos de baja latencia.",
      resumen: "Arquitecto de Software con más de 8 años de trayectoria en el sector de movilidad y automoción.",
      rubros: "Automóvil, Telecomunicaciones, SaaS"
    },
    {
      id: "cand-002",
      nombre_completo: "María Belmonte",
      email: "maria.belmonte@example.com",
      linkedin_url: "https://linkedin.com/in/mariabelmonte",
      puesto: "UX Research Lead",
      origen: "LinkedIn InMail",
      acepta_privacidad: true,
      estado_revision: "Revisado",
      url_cv: "https://storage.googleapis.com/cvs/maria_belmonte.pdf",
      createdAt: "2026-07-18T14:30:00Z",
      telefono_movil: "+34 689 012 345",
      ubicacion: "La Coruña / Híbrido",
      skills_principales: "Figma, User Research, Test A/B, Wireframing",
      nivel_ingles: "C1 Avanzado",
      otros_idiomas: "Español (Nativo), Francés",
      notas_iniciales: "Excelente desenvolvimiento en metodologías cualitativas con usuarios finales.",
      resumen: "Líder de Investigación UX en plataformas e-commerce a gran escala.",
      rubros: "Retail, E-commerce, Moda"
    },
    {
      id: "cand-003",
      nombre_completo: "Javier Galdón",
      email: "javier.galdon@example.com",
      linkedin_url: "https://linkedin.com/in/javiergaldon",
      puesto: "Senior React Developer",
      origen: "Referido",
      acepta_privacidad: true,
      estado_revision: "Seleccionado",
      url_cv: "https://storage.googleapis.com/cvs/javier_galdon.pdf",
      createdAt: "2026-07-15T09:15:00Z",
      telefono_movil: "+34 677 889 900",
      ubicacion: "Madrid / Remoto",
      skills_principales: "React, TypeScript, Next.js, TailwindCSS",
      nivel_ingles: "C2 Nativo/Fluido",
      otros_idiomas: "Español",
      notas_iniciales: "Sólido perfil técnico con amplia experiencia en proyectos Fintech.",
      resumen: "Frontend Engineer especialista en arquitectura limpia de componentes React.",
      rubros: "Fintech, Banca"
    },
    {
      id: "cand-004",
      nombre_completo: "Carlos Tejera",
      email: "carlos.tejera@example.com",
      linkedin_url: "https://linkedin.com/in/carlostejera",
      puesto: "Principal Data Engineer",
      origen: "Headhunting",
      acepta_privacidad: true,
      estado_revision: "Pendiente",
      url_cv: "https://storage.googleapis.com/cvs/carlos_tejera.pdf",
      createdAt: "2026-07-14T11:20:00Z",
      telefono_movil: "+34 654 321 987",
      ubicacion: "Madrid / Presencial",
      skills_principales: "Apache Kafka, Cassandra, Python, PySpark",
      nivel_ingles: "B2 Intermedio",
      otros_idiomas: "Español",
      notas_iniciales: "Especialista en pipelines de datos masivos en tiempo real.",
      resumen: "Data Engineer senior con experiencia en sector telco.",
      rubros: "Telecomunicaciones, Big Data"
    },
    {
      id: "cand-005",
      nombre_completo: "Alberto Ruiz",
      email: "alberto.ruiz@example.com",
      linkedin_url: "https://linkedin.com/in/albertoruiz",
      puesto: "Backend Python Developer",
      origen: "Portal Empleo",
      acepta_privacidad: true,
      estado_revision: "Descartado",
      url_cv: "https://storage.googleapis.com/cvs/alberto_ruiz.pdf",
      createdAt: "2026-07-12T16:45:00Z",
      telefono_movil: "+34 633 445 566",
      ubicacion: "Valencia / Remoto",
      skills_principales: "Python, Django, FastAPI, PostgreSQL",
      nivel_ingles: "B1 Inicial",
      otros_idiomas: "Español",
      notas_iniciales: "Pretensiones salariales por encima de la banda presupuestada.",
      resumen: "Desarrollador backend especialista en APIs RESTful.",
      rubros: "SaaS, Software"
    },
    {
      id: "cand-006",
      nombre_completo: "Elena Montes",
      email: "elena.montes@example.com",
      linkedin_url: "https://linkedin.com/in/elenamontes",
      puesto: "UX/UI Designer",
      origen: "Directo ATS",
      acepta_privacidad: true,
      estado_revision: "Revisado",
      url_cv: "https://storage.googleapis.com/cvs/elena_montes.pdf",
      createdAt: "2026-07-10T08:30:00Z",
      telefono_movil: "+34 622 114 433",
      ubicacion: "Madrid / Híbrido",
      skills_principales: "Figma, Sketch, Adobe XD, Design Systems",
      nivel_ingles: "C1 Avanzado",
      otros_idiomas: "Español, Italiano",
      notas_iniciales: "Gran portafolio visual enfocado en e-commerce de moda.",
      resumen: "Diseñadora de interacción con 6 años de experiencia.",
      rubros: "Moda, E-commerce"
    },
    {
      id: "cand-007",
      nombre_completo: "Victor Rueda",
      email: "victor.rueda@example.com",
      linkedin_url: "https://linkedin.com/in/victorrueda",
      puesto: "Interaction Designer",
      origen: "Referido",
      acepta_privacidad: true,
      estado_revision: "Pendiente",
      url_cv: "https://storage.googleapis.com/cvs/victor_rueda.pdf",
      createdAt: "2026-07-09T13:10:00Z",
      telefono_movil: "+34 611 998 877",
      ubicacion: "Sevilla / Remoto",
      skills_principales: "Wireframing, User Journeys, Usability Testing",
      nivel_ingles: "B2 Intermedio",
      otros_idiomas: "Español",
      notas_iniciales: "Perfil muy enfocado en diseño de prototipos rápidos.",
      resumen: "Diseñador UX/UI apasionado por la investigación de usuarios.",
      rubros: "EdTech, Consultoría"
    },
    {
      id: "cand-008",
      nombre_completo: "Marta Galiano",
      email: "marta.galiano@example.com",
      linkedin_url: "https://linkedin.com/in/martagaliano",
      puesto: "Fullstack JS Engineer",
      origen: "LinkedIn InMail",
      acepta_privacidad: true,
      estado_revision: "Seleccionado",
      url_cv: "https://storage.googleapis.com/cvs/marta_galiano.pdf",
      createdAt: "2026-07-08T15:00:00Z",
      telefono_movil: "+34 655 443 322",
      ubicacion: "Bilbao / Híbrido",
      skills_principales: "Node.js, React, GraphQL, Docker",
      nivel_ingles: "C1 Avanzado",
      otros_idiomas: "Español, Euskera",
      notas_iniciales: "Candidata altamente recomendada para liderar squad de frontend.",
      resumen: "Desarrolladora Fullstack con fuerte orientación a arquitecturas servidor.",
      rubros: "Fintech, Insurtech"
    },
    {
      id: "cand-009",
      nombre_completo: "Roberto Soria",
      email: "roberto.soria@example.com",
      linkedin_url: "https://linkedin.com/in/robertosoria",
      puesto: "Cloud Security Expert",
      origen: "Directo ATS",
      acepta_privacidad: true,
      estado_revision: "Pendiente",
      url_cv: "https://storage.googleapis.com/cvs/roberto_soria.pdf",
      createdAt: "2026-07-07T09:40:00Z",
      telefono_movil: "+34 688 776 655",
      ubicacion: "Madrid / Presencial",
      skills_principales: "AWS, GCP, Terraform, Kubernetes Security",
      nivel_ingles: "C1 Avanzado",
      otros_idiomas: "Español",
      notas_iniciales: "Certificado en CISSP y AWS Certified Security Specialist.",
      resumen: "Especialista en ciberseguridad cloud y auditorías de infraestructura.",
      rubros: "Banca, Ciberseguridad"
    },
    {
      id: "cand-010",
      nombre_completo: "Lucía Paredes",
      email: "lucia.paredes@example.com",
      linkedin_url: "https://linkedin.com/in/luciaparedes",
      puesto: "DevOps Engineer",
      origen: "Headhunting",
      acepta_privacidad: true,
      estado_revision: "Revisado",
      url_cv: "https://storage.googleapis.com/cvs/lucia_paredes.pdf",
      createdAt: "2026-07-06T17:15:00Z",
      telefono_movil: "+34 644 332 211",
      ubicacion: "Málaga / Remoto",
      skills_principales: "Kubernetes, Helm, GitHub Actions, Argocd",
      nivel_ingles: "B2 Intermedio",
      otros_idiomas: "Español",
      notas_iniciales: "Experiencia destacada automatizando deployments multicloud.",
      resumen: "Ingeniera DevOps enfocada en entrega continua e infraestructura como código.",
      rubros: "Cloud, SaaS"
    },
    {
      id: "cand-011",
      nombre_completo: "Fernando Ramos",
      email: "fernando.ramos@example.com",
      linkedin_url: "https://linkedin.com/in/fernandoramos",
      puesto: "QA Automation Lead",
      origen: "Portal Empleo",
      acepta_privacidad: true,
      estado_revision: "Pendiente",
      url_cv: "https://storage.googleapis.com/cvs/fernando_ramos.pdf",
      createdAt: "2026-07-05T12:00:00Z",
      telefono_movil: "+34 699 112 233",
      ubicacion: "Zaragoza / Híbrido",
      skills_principales: "Cypress, Playwright, Selenium, Jest",
      nivel_ingles: "B2 Intermedio",
      otros_idiomas: "Español",
      notas_iniciales: "Experto construyendo frameworks E2E desde cero.",
      resumen: "Líder de Calidad de Software con 7 años en pruebas automatizadas.",
      rubros: "Logística, Retail"
    },
    {
      id: "cand-012",
      nombre_completo: "Isabel Carmona",
      email: "isabel.carmona@example.com",
      linkedin_url: "https://linkedin.com/in/isabelcarmona",
      puesto: "Frontend React Native",
      origen: "Referido",
      acepta_privacidad: true,
      estado_revision: "Seleccionado",
      url_cv: "https://storage.googleapis.com/cvs/isabel_carmona.pdf",
      createdAt: "2026-07-04T10:20:00Z",
      telefono_movil: "+34 666 554 433",
      ubicacion: "Barcelona / Remoto",
      skills_principales: "React Native, Expo, Redux, iOS/Android",
      nivel_ingles: "C1 Avanzado",
      otros_idiomas: "Español, Inglés",
      notas_iniciales: "Candidata ideal para la app móvil de fidelización.",
      resumen: "Desarrolladora mobile con apps publicadas en App Store y Google Play.",
      rubros: "Mobile, E-commerce"
    },
    {
      id: "cand-013",
      nombre_completo: "Gabriel Blanco",
      email: "gabriel.blanco@example.com",
      linkedin_url: "https://linkedin.com/in/gabrielblanco",
      puesto: "Scrum Master",
      origen: "Directo ATS",
      acepta_privacidad: true,
      estado_revision: "Revisado",
      url_cv: "https://storage.googleapis.com/cvs/gabriel_blanco.pdf",
      createdAt: "2026-07-03T14:10:00Z",
      telefono_movil: "+34 633 221 100",
      ubicacion: "Madrid / Híbrido",
      skills_principales: "Scrum, Kanban, Jira, Facilitación Agile",
      nivel_ingles: "C1 Avanzado",
      otros_idiomas: "Español",
      notas_iniciales: "Certificación PSM II y amplia experiencia en transformación ágil.",
      resumen: "Agile Coach y Scrum Master liderando equipos multidisciplinares.",
      rubros: "Banca, Salud"
    },
    {
      id: "cand-014",
      nombre_completo: "Patricia Vega",
      email: "patricia.vega@example.com",
      linkedin_url: "https://linkedin.com/in/patriciavega",
      puesto: "Product Manager Tech",
      origen: "LinkedIn InMail",
      acepta_privacidad: true,
      estado_revision: "Pendiente",
      url_cv: "https://storage.googleapis.com/cvs/patricia_vega.pdf",
      createdAt: "2026-07-02T16:00:00Z",
      telefono_movil: "+34 677 334 455",
      ubicacion: "Barcelona / Remoto",
      skills_principales: "Product Roadmap, Analytics, OKRs, User Stories",
      nivel_ingles: "C2 Nativo",
      otros_idiomas: "Español, Alemán",
      notas_iniciales: "Perfil estratégico con background técnico en ingeniería de software.",
      resumen: "Product Manager orientada a métricas de crecimiento y retención.",
      rubros: "SaaS, Marketplace"
    },
    {
      id: "cand-015",
      nombre_completo: "Raúl Ibáñez",
      email: "raul.ibanez@example.com",
      linkedin_url: "https://linkedin.com/in/raulibanez",
      puesto: "Backend Java Specialist",
      origen: "Portal Empleo",
      acepta_privacidad: true,
      estado_revision: "Descartado",
      url_cv: "https://storage.googleapis.com/cvs/raul_ibanez.pdf",
      createdAt: "2026-07-01T11:50:00Z",
      telefono_movil: "+34 655 667 788",
      ubicacion: "Valencia / Presencial",
      skills_principales: "Java 17, Spring Boot, Microservices, Oracle",
      nivel_ingles: "B1 Inicial",
      otros_idiomas: "Español",
      notas_iniciales: "Sin disponibilidad para teletrabajo ni flexibilidad de horarios.",
      resumen: "Ingeniero Backend Java especializado en sistemas legacy bancarios.",
      rubros: "Banca, Seguros"
    },
    {
      id: "cand-016",
      nombre_completo: "Nuria Pastor",
      email: "nuria.pastor@example.com",
      linkedin_url: "https://linkedin.com/in/nuriapastor",
      puesto: "Data Scientist Machine Learning",
      origen: "Headhunting",
      acepta_privacidad: true,
      estado_revision: "Seleccionado",
      url_cv: "https://storage.googleapis.com/cvs/nuria_pastor.pdf",
      createdAt: "2026-06-30T09:00:00Z",
      telefono_movil: "+34 622 889 900",
      ubicacion: "Madrid / Remoto",
      skills_principales: "Python, TensorFlow, Scikit-learn, MLops, SQL",
      nivel_ingles: "C1 Avanzado",
      otros_idiomas: "Español, Catalán",
      notas_iniciales: "Doctorado en Inteligencia Artificial por la UPC.",
      resumen: "Científica de datos experta en modelos predictivos y NLP.",
      rubros: "IA, Salud, Fintech"
    },
    {
      id: "cand-017",
      nombre_completo: "Gonzalo Mayo",
      email: "gonzalo.mayo@example.com",
      linkedin_url: "https://linkedin.com/in/gonzalomayo",
      puesto: "Site Reliability Engineer (SRE)",
      origen: "Referido",
      acepta_privacidad: true,
      estado_revision: "Revisado",
      url_cv: "https://storage.googleapis.com/cvs/gonzalo_mayo.pdf",
      createdAt: "2026-06-29T15:30:00Z",
      telefono_movil: "+34 611 445 566",
      ubicacion: "Málaga / Remoto",
      skills_principales: "Linux, Prometheus, Grafana, Go, Kubernetes",
      nivel_ingles: "C1 Avanzado",
      otros_idiomas: "Español",
      notas_iniciales: "Sólida experiencia gestionando SLIs/SLOs de alta disponibilidad.",
      resumen: "Ingeniero SRE enfocado en resiliencia y observabilidad de sistemas.",
      rubros: "Infraestructura, Cloud"
    },
    {
      id: "cand-018",
      nombre_completo: "Silvia Cordero",
      email: "silvia.cordero@example.com",
      linkedin_url: "https://linkedin.com/in/silviacordero",
      puesto: "Cybersecurity Analyst",
      origen: "Directo ATS",
      acepta_privacidad: true,
      estado_revision: "Pendiente",
      url_cv: "https://storage.googleapis.com/cvs/silvia_cordero.pdf",
      createdAt: "2026-06-28T10:45:00Z",
      telefono_movil: "+34 688 112 233",
      ubicacion: "Madrid / Híbrido",
      skills_principales: "SIEM, SOC, Pentesting, ISO 27001",
      nivel_ingles: "B2 Intermedio",
      otros_idiomas: "Español",
      notas_iniciales: "Certificada en CEH (Certified Ethical Hacker).",
      resumen: "Analista de Ciberseguridad experta en respuesta ante incidentes.",
      rubros: "Seguridad, Consultoría"
    },
    {
      id: "cand-019",
      nombre_completo: "Adrián Collado",
      email: "adrian.collado@example.com",
      linkedin_url: "https://linkedin.com/in/adriancollado",
      puesto: "Golang Backend Developer",
      origen: "LinkedIn InMail",
      acepta_privacidad: true,
      estado_revision: "Pendiente",
      url_cv: "https://storage.googleapis.com/cvs/adrian_collado.pdf",
      createdAt: "2026-06-27T14:20:00Z",
      telefono_movil: "+34 644 990 011",
      ubicacion: "Barcelona / Remoto",
      skills_principales: "Go, gRPC, Protobuf, Microservices, Redis",
      nivel_ingles: "C1 Avanzado",
      otros_idiomas: "Español",
      notas_iniciales: "Experto en arquitecturas orientadas a eventos y microservicios Go.",
      resumen: "Desarrollador backend Go con 5 años de experiencia.",
      rubros: "Fintech, Gaming"
    },
    {
      id: "cand-020",
      nombre_completo: "Beatriz Noguera",
      email: "beatriz.noguera@example.com",
      linkedin_url: "https://linkedin.com/in/beatriznoguera",
      puesto: "Head of Talent Acquisition",
      origen: "Headhunting",
      acepta_privacidad: true,
      estado_revision: "Seleccionado",
      url_cv: "https://storage.googleapis.com/cvs/beatriz_noguera.pdf",
      createdAt: "2026-06-26T17:00:00Z",
      telefono_movil: "+34 699 887 766",
      ubicacion: "Madrid / Híbrido",
      skills_principales: "Tech Recruiting, Employer Branding, ATS management",
      nivel_ingles: "C2 Nativo",
      otros_idiomas: "Español, Inglés",
      notas_iniciales: "Amplio conocimiento en atracción de talento ejecutivo tecnológico.",
      resumen: "Líder de Adquisición de Talento con más de 10 años en empresas de tecnología.",
      rubros: "RRHH, Recruiting, Tech"
    },
    {
      id: "cand-021",
      nombre_completo: "Tomás Alarcón",
      email: "tomas.alarcon@example.com",
      linkedin_url: "https://linkedin.com/in/tomasalarcon",
      puesto: "Angular Senior Developer",
      origen: "Portal Empleo",
      acepta_privacidad: true,
      estado_revision: "Descartado",
      url_cv: "https://storage.googleapis.com/cvs/tomas_alarcon.pdf",
      createdAt: "2026-06-25T11:10:00Z",
      telefono_movil: "+34 633 556 677",
      ubicacion: "Sevilla / Remoto",
      skills_principales: "Angular, RxJS, NgRx, TypeScript",
      nivel_ingles: "B1 Inicial",
      otros_idiomas: "Español",
      notas_iniciales: "Buscaba rol 100% enfocado en React sin interés en proyectos Angular.",
      resumen: "Desarrollador frontend Angular especializado en grandes sistemas corporativos.",
      rubros: "Banca, Energía"
    },
    {
      id: "cand-022",
      nombre_completo: "Clara Viguera",
      email: "clara.viguera@example.com",
      linkedin_url: "https://linkedin.com/in/claraviguera",
      puesto: "Cloud Architect AWS",
      origen: "Referido",
      acepta_privacidad: true,
      estado_revision: "Revisado",
      url_cv: "https://storage.googleapis.com/cvs/claraviguera.pdf",
      createdAt: "2026-06-24T08:50:00Z",
      telefono_movil: "+34 666 443 322",
      ubicacion: "Madrid / Remoto",
      skills_principales: "AWS Solutions Architect Professional, Serverless, Lambda",
      nivel_ingles: "C1 Avanzado",
      otros_idiomas: "Español, Francés",
      notas_iniciales: "Arquitecta certificada con experiencia en migraciones masivas a la nube.",
      resumen: "Arquitecta de Soluciones Cloud con 9 años diseñando plataformas altamente disponibles.",
      rubros: "Cloud, Telecomunicaciones"
    },
    {
      id: "cand-023",
      nombre_completo: "Jaime Perales",
      email: "jaime.perales@example.com",
      linkedin_url: "https://linkedin.com/in/jaimeperales",
      puesto: "iOS Native Developer",
      origen: "Directo ATS",
      acepta_privacidad: true,
      estado_revision: "Pendiente",
      url_cv: "https://storage.googleapis.com/cvs/jaime_perales.pdf",
      createdAt: "2026-06-23T13:40:00Z",
      telefono_movil: "+34 622 778 899",
      ubicacion: "Barcelona / Híbrido",
      skills_principales: "Swift, SwiftUI, Combine, XCTest",
      nivel_ingles: "B2 Intermedio",
      otros_idiomas: "Español, Catalán",
      notas_iniciales: "Desarrollador iOS con portafolio de aplicaciones móviles nativas.",
      resumen: "Ingeniero iOS con pasión por las experiencias de usuario fluidas.",
      rubros: "Mobile, Fintech"
    },
    {
      id: "cand-024",
      nombre_completo: "Sara Escudero",
      email: "sara.escudero@example.com",
      linkedin_url: "https://linkedin.com/in/saraescudero",
      puesto: "Technical Writer & Doc Lead",
      origen: "LinkedIn InMail",
      acepta_privacidad: true,
      estado_revision: "Seleccionado",
      url_cv: "https://storage.googleapis.com/cvs/sara_escudero.pdf",
      createdAt: "2026-06-22T15:15:00Z",
      telefono_movil: "+34 611 223 344",
      ubicacion: "Valencia / Remoto",
      skills_principales: "OpenAPI, Markdown, Docusaurus, API Documentation",
      nivel_ingles: "C2 Nativo",
      otros_idiomas: "Español, Inglés",
      notas_iniciales: "Excelente redactora técnica de documentación pública de desarrolladores.",
      resumen: "Líder de Documentación Técnica para plataformas y APIs de integración.",
      rubros: "SaaS, Developer Tools"
    }
  ];

  try {
    const token = await getServerAuthToken();
    if (token === "mock_session_token_for_docs_generation") {
      return {
        status: 200,
        success: true,
        message: "Candidatos recuperados en modo demostración.",
        data: fallbackCandidatos
      };
    }

    const url = getApiEndpoint("candidatos");
    console.log(`[Candidatos Action] GET a: ${url}`);
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    if (status === 200 && result && result.status === "success" && Array.isArray(result.data)) {
      const candidates: Candidato[] = result.data.map((cand: any) => ({
        id: cand.id || "",
        nombre_completo: cand.nombre_completo || "",
        email: cand.email || "",
        linkedin_url: cand.linkedin_url || "",
        puesto: cand.puesto_postulacion || cand.puesto || "",
        origen: cand.origen || "Landing Page",
        acepta_privacidad: !!cand.acepta_privacidad,
        estado_revision: apiToFrontendStatus(cand.estado_revision),
        url_cv: cand.url_cv || "",
        createdAt: cand.createdAt || new Date().toISOString(),
        updatedAt: cand.updatedAt,
        telefono_movil: cand.telefono_movil || "",
        ubicacion: cand.ubicacion || "",
        skills_principales: cand.skills_principales || "",
        nivel_ingles: cand.nivel_ingles || "",
        otros_idiomas: cand.otros_idiomas || "",
        notas_iniciales: cand.notas_iniciales || "",
        resumen: cand.resumen || "",
        rubros: cand.rubros || "",
        canal_ingreso: cand.canal_ingreso || null
      }));

      return {
        status,
        success: true,
        message: "Candidatos recuperados correctamente del backend.",
        data: candidates
      };
    }

    return {
      status: 200,
      success: true,
      message: "Respuesta de respaldo de candidatos.",
      data: fallbackCandidatos
    };
  } catch (error: any) {
    console.error("[Candidatos Action] Error en getCandidatosAPI:", error);
    return {
      status: 200,
      success: true,
      message: "Respuesta de respaldo de candidatos tras error.",
      data: fallbackCandidatos
    };
  }
}

/**
 * Server Action: Alta manual de perfiles espontáneos.
 * POST /api/v1/candidatos [multipart/form-data]
 */
export async function crearCandidatoAPI(formData: FormData): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return {
        status: 500,
        success: false,
        message: "Error de configuración: NEXT_PUBLIC_API_URL no está definido."
      };
    }

    const nombre = formData.get("nombre_completo")?.toString()?.trim();
    const email = formData.get("email")?.toString()?.trim();
    const puesto = formData.get("puesto")?.toString()?.trim();
    const linkedin = formData.get("linkedin_url")?.toString()?.trim() || "";
    const aceptaPrivacidadStr = formData.get("acepta_privacidad")?.toString();
    const cvFile = formData.get("cv");

    // Nuevos campos opcionales
    const telefono = formData.get("telefono_movil")?.toString()?.trim() || "";
    const ubicacion = formData.get("ubicacion")?.toString()?.trim() || "";
    const skills = formData.get("skills_principales")?.toString()?.trim() || "";
    const ingles = formData.get("nivel_ingles")?.toString()?.trim() || "";
    const otrosIdiomas = formData.get("otros_idiomas")?.toString()?.trim() || "";
    const notas = formData.get("notas_iniciales")?.toString()?.trim() || "";
    const resumen = formData.get("resumen")?.toString()?.trim() || "";
    const rubros = formData.get("rubros")?.toString()?.trim() || "";
    const canalIngreso = formData.get("canal_ingreso")?.toString()?.trim() || "";

    // Server-side validation to enable robust 400 Bad Request simulation
    if (!nombre || !email || !puesto) {
      return {
        status: 400,
        success: false,
        message: "Falta completar campos obligatorios del candidato (nombre_completo, email, puesto)."
      };
    }

    if (aceptaPrivacidadStr !== "true") {
      return {
        status: 400,
        success: false,
        message: "Debe aceptar la política de privacidad y tratamiento de datos personales conforme al RGPD."
      };
    }

    const url = `${apiBaseUrl}/api/v1/candidatos`;
    console.log(`[Candidatos Action] POST multipart/form-data a: ${url}`);
    
    // Construct clean FormData matching backend key names
    const apiFormData = new FormData();
    if (cvFile && typeof cvFile !== "string" && (cvFile as any).size > 0) {
      apiFormData.append("cv", cvFile);
    }
    apiFormData.append("nombre_completo", nombre);
    apiFormData.append("email", email);
    apiFormData.append("puesto_postulacion", puesto);
    if (linkedin) apiFormData.append("linkedin_url", linkedin);
    apiFormData.append("acepta_privacidad", "true");
    
    apiFormData.append("telefono_movil", telefono);
    apiFormData.append("ubicacion", ubicacion);
    apiFormData.append("skills_principales", skills);
    apiFormData.append("nivel_ingles", ingles);
    apiFormData.append("otros_idiomas", otrosIdiomas);
    apiFormData.append("notas_iniciales", notas);
    apiFormData.append("resumen", resumen);
    apiFormData.append("rubros", rubros);
    if (canalIngreso) apiFormData.append("canal_ingreso", canalIngreso);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: apiFormData
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    if (status === 201 || status === 200) {
      const candidate: Candidato = {
        id: result?.data?.id || `new-cand`,
        nombre_completo: nombre,
        email,
        linkedin_url: linkedin,
        puesto,
        origen: "Manual",
        acepta_privacidad: true,
        estado_revision: "Pendiente",
        url_cv: result?.data?.url_cv || "",
        createdAt: new Date().toISOString(),
        telefono_movil: telefono,
        ubicacion: ubicacion,
        skills_principales: skills,
        nivel_ingles: ingles,
        otros_idiomas: otrosIdiomas,
        notas_iniciales: notas,
        resumen: resumen,
        rubros: rubros
      };
      
      return {
        status,
        success: true,
        message: "Candidato registrado correctamente en el sistema.",
        data: candidate
      };
    }

    return {
      status,
      success: false,
      message: result?.message || result?.error || `Error al crear candidato en el backend (Código ${status}).`,
    };
  } catch (error: any) {
    console.error("[Candidatos Action] Error en crearCandidatoAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Update candidate information/status (Mutación Controlada).
 * PATCH /api/v1/candidatos/:id
 */
export async function actualizarCandidatoAPI(id: string, payload: Partial<Candidato>): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return {
        status: 500,
        success: false,
        message: "Error de configuración: NEXT_PUBLIC_API_URL no está definido."
      };
    }

    // Mutability Matrix Safeguard: Do not allow unauthorized modifications
    const forbiddenKeys: Array<keyof Candidato> = ["id", "acepta_privacidad", "origen", "url_cv", "createdAt"];
    const containsForbidden = forbiddenKeys.some(key => key in payload);
    if (containsForbidden) {
      return {
        status: 400,
        success: false,
        message: "Acceso denegado: Intento de modificar metadatos históricos inmutables (ID, Origen, Consentimiento, CV original)."
      };
    }

    const apiPayload: any = {};
    if (payload.nombre_completo !== undefined) apiPayload.nombre_completo = payload.nombre_completo;
    if (payload.email !== undefined) apiPayload.email = payload.email;
    if (payload.linkedin_url !== undefined) apiPayload.linkedin_url = payload.linkedin_url;
    if (payload.puesto !== undefined) apiPayload.puesto_postulacion = payload.puesto;
    if (payload.estado_revision !== undefined) {
      if (payload.estado_revision === "Pendiente") {
        apiPayload.estado_revision = "pendiente";
      } else {
        apiPayload.estado_revision = payload.estado_revision;
      }
    }
    if (payload.telefono_movil !== undefined) apiPayload.telefono_movil = payload.telefono_movil;
    if (payload.ubicacion !== undefined) apiPayload.ubicacion = payload.ubicacion;
    if (payload.skills_principales !== undefined) apiPayload.skills_principales = payload.skills_principales;
    if (payload.nivel_ingles !== undefined) apiPayload.nivel_ingles = payload.nivel_ingles;
    if (payload.otros_idiomas !== undefined) apiPayload.otros_idiomas = payload.otros_idiomas;
    if (payload.notas_iniciales !== undefined) apiPayload.notas_iniciales = payload.notas_iniciales;
    if (payload.resumen !== undefined) apiPayload.resumen = payload.resumen;
    if (payload.rubros !== undefined) apiPayload.rubros = payload.rubros;
    if (payload.canal_ingreso !== undefined) apiPayload.canal_ingreso = payload.canal_ingreso;

    const url = `${apiBaseUrl}/api/v1/candidatos/${id}`;
    console.log(`[Candidatos Action] PATCH a: ${url}`);
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(apiPayload)
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    if (status === 200) {
      return {
        status,
        success: true,
        message: "Candidato actualizado en el backend con éxito.",
        data: {
          id,
          ...payload,
          updatedAt: result?.data?.updatedAt || new Date().toISOString()
        }
      };
    }

    return {
      status,
      success: false,
      message: result?.message || `Error al actualizar candidato en el backend (Código ${status}).`,
    };
  } catch (error: any) {
    console.error("[Candidatos Action] Error en actualizarCandidatoAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Deletes candidate from system.
 * DELETE /api/v1/candidatos/:id
 * @param hardDelete: false for Soft Delete (leads to state: 'Descartado'), true for physical removal of file and document.
 */
export async function eliminarCandidatoAPI(id: string, hardDelete: boolean): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return {
        status: 500,
        success: false,
        message: "Error de configuración: NEXT_PUBLIC_API_URL no está definido."
      };
    }

    // A Soft Delete translates to a PATCH changing status to 'Descartado'
    if (!hardDelete) {
      return await actualizarCandidatoAPI(id, { estado_revision: "Descartado" });
    }

    const url = `${apiBaseUrl}/api/v1/candidatos/${id}`;
    console.log(`[Candidatos Action] DELETE a: ${url}`);
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    if (status === 200) {
      return {
        status,
        success: true,
        message: "Candidato y su CV asociados han sido eliminados de manera física en el sistema.",
        data: result
      };
    }

    return {
      status,
      success: false,
      message: result?.message || `Error al realizar borrado físico en el backend (Código ${status}).`,
    };
  } catch (error: any) {
    console.error("[Candidatos Action] Error en eliminarCandidatoAPI:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

/**
 * Server Action: Importación asistida por Inteligencia Artificial (Genkit + Vertex AI).
 * POST /api/v1/candidatos/importar-ia
 */
export async function importarCandidatoIA_API(formData: FormData): Promise<APIResponse> {
  try {
    const token = await getServerAuthToken();
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;
    if (!apiBaseUrl) {
      return {
        status: 500,
        success: false,
        message: "Error de configuración: NEXT_PUBLIC_API_URL no está definido."
      };
    }

    const cvFile = formData.get("cv");
    if (!cvFile) {
      return {
        status: 400,
        success: false,
        message: "Debe cargar un currículum (archivo PDF, DOC o DOCX)."
      };
    }

    const url = `${apiBaseUrl}/api/v1/candidatos/importar-ia`;
    console.log(`[Candidatos Action] POST (Importar IA) a: ${url}`);
    
    const apiFormData = new FormData();
    apiFormData.append("cv", cvFile);
    
    const notas = formData.get("notas_iniciales")?.toString()?.trim();
    if (notas) {
      apiFormData.append("notas_iniciales", notas);
    }
    const canal = formData.get("canal_ingreso")?.toString()?.trim();
    if (canal) {
      apiFormData.append("canal_ingreso", canal);
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`
      },
      body: apiFormData
    });

    const status = response.status;
    let result: any = null;
    try {
      result = await response.json();
    } catch (_) {}

    if (status === 201 || status === 200) {
      return {
        status,
        success: true,
        message: "Candidato importado y procesado por IA correctamente.",
        data: result?.data
      };
    }

    return {
      status,
      success: false,
      message: result?.message || result?.error || `Error al importar candidato con IA (Código ${status}).`,
    };
  } catch (error: any) {
    console.error("[Candidatos Action] Error en importarCandidatoIA_API:", error);
    return {
      status: 500,
      success: false,
      message: `Error de red al conectar con el backend: ${error.message || error}`
    };
  }
}

