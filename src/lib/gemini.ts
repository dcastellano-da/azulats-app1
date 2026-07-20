/**
 * Client-side Google Gemini API connector for live AI-driven talent sourcing.
 * Utilizes the free tier gemini-1.5-flash model.
 * Falls back gracefully to pre-programmed high-fidelity mocks upon any rate-limit or key issues.
 */

export interface SemanticMatchResult {
  score: number;
  positives: string[];
  negatives: string[];
  recommendations: string[];
  source?: "Gemini AI" | "Mock Database";
}

export interface OutreachGenerationResult {
  message: string;
  source?: "Gemini AI" | "Mock Database";
}

// Read API keys from env
const getGeminiApiKey = (): string | null => {
  if (typeof window === "undefined") return null;
  // Try custom Gemini Key first, then fallback to Firebase Web client key that might have API access
  return (
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    null
  );
};

/**
 * Call generic generate content from Gemini 1.5 Flash
 */
async function callGeminiRaw(prompt: string, expectJson: boolean = false): Promise<string> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("No Gemini or Firebase API key found in application variables.");
  }

  const model = "gemini-1.5-flash";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const payload: any = {
    contents: [
      {
        parts: [
          {
            text: prompt
          }
        ]
      }
    ],
    generationConfig: {}
  };

  if (expectJson) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API HTTP Error ${response.status}: ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error("Invalid or empty response format from Gemini API candidates.");
  }

  return text;
}

/**
 * Perform semantic matching of a candidate's CV details against a job vacancy profile.
 */
export async function analyzeSemanticMatchLive(
  candidateName: string,
  candidateRole: string,
  candidateClient: string,
  candidateLocation: string,
  motivationNote: string,
  fallbackScore: number
): Promise<SemanticMatchResult> {
  try {
    const prompt = `
      Eres un Agente Seleccionador de Talento Senior (Sourcing Optimizer).
      Analiza la compatibilidad (Fit Score) de este candidato prospecto contra la búsqueda de empleo activa.
      
      DATOS DEL CANDIDATO:
      - Nombre: ${candidateName}
      - Puesto postulado / CV: ${candidateRole}
      - Empresa / Cliente destino: ${candidateClient}
      - Ubicación: ${candidateLocation}
      - Notas adicionales / Motivación: ${motivationNote || "No especificada"}

      REQUERIMIENTO:
      Determina un porcentaje de ajuste del 1 al 100 y elabora los puntos positivos (fortalezas), negativos (gaps de skills/experiencia) y recomendaciones tácticas (siguientes pasos de selección).

      DEBES responder ÚNICAMENTE con un objeto JSON estructurado con el siguiente esquema exacto:
      {
        "score": number, (entre 40 y 99 según tus criterios)
        "positives": string[], (agrega exactamente 3 puntos concisos en español)
        "negatives": string[], (agrega exactamente 2 puntos concisos en español)
        "recommendations": string[] (agrega exactamente 2 puntos concisos en español)
      }
    `;

    const jsonText = await callGeminiRaw(prompt, true);
    const parsed = JSON.parse(jsonText.trim());
    return {
      score: typeof parsed.score === "number" ? parsed.score : fallbackScore,
      positives: Array.isArray(parsed.positives) ? parsed.positives : [],
      negatives: Array.isArray(parsed.negatives) ? parsed.negatives : [],
      recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
      source: "Gemini AI"
    };
  } catch (error) {
    console.warn("Falling back to simulated diagnostic due to Gemini API failure:", error);
    return {
      score: fallbackScore,
      positives: [
        `Demuestra aptitud e interés inicial para cubrir la posición de ${candidateRole} en ${candidateClient}.`,
        `Familiaridad técnica y disponibilidad en la zona de ${candidateLocation}.`,
        `Encaje inicial positivo con los requerimientos generales del cliente.`
      ],
      negatives: [
        `Es necesario validar en entrevista profunda los skills específicos con las herramientas de ${candidateClient}.`,
        `Gaps puntuales reportados en el backlog con respecto a certificaciones complementarias.`
      ],
      recommendations: [
        `Agendar videollamada corta de 15 minutos para validar expectativas y motivaciones.`,
        `Solicitar ejemplos de repositorios de código o proyectos reales en los que haya participado.`
      ],
      source: "Mock Database"
    };
  }
}

/**
 * Generate a personalized cold outreach message for email or LinkedIn in Spanish.
 */
export async function generateOutreachMessageLive(
  candidateName: string,
  candidateRole: string,
  candidateClient: string,
  outreachVariation: "A" | "B"
): Promise<OutreachGenerationResult> {
  try {
    const tone = outreachVariation === "A" ? "formal e inspirador enfocado en retos técnicos" : "corto, directo y ágil para canal informal";
    const prompt = `
      Eres un Headhunter Senior. Crea un mensaje personalizado de acercamiento (outreach) en ESPAÑOL.
      Nombre candidato: ${candidateName}
      Puesto vacante: ${candidateRole}
      Cliente: ${candidateClient}
      Estilo de tono: ${tone}

      REQUISITOS DEL MENSAJE:
      - Menciona expresamente el puesto y al cliente.
      - Agrega una frase para captar la atención según el estilo de tono.
      - Keep it short: máximo 120 palabras.
      - Sin placeholders vacíos como [Nombre], debes usar directamente los datos dados.

      Devuelve ÚNICAMENTE el texto plano del mensaje redactado.
    `;

    const messageText = await callGeminiRaw(prompt, false);
    return {
      message: messageText.trim(),
      source: "Gemini AI"
    };
  } catch (error) {
    console.warn("Outreach personalization fell back to mock template:", error);
    
    const fallbackMessage = outreachVariation === "A"
      ? `Hola ${candidateName}, observé con atención tu trayectoria en ${candidateRole}. En ${candidateClient} nos apasiona empoderar a talentos como tú para liderar hitos de alto rendimiento. ¿Tendrías 10 minutos esta semana para charlar sobre nuevos horizontes?`
      : `¡Hola ${candidateName}! Qué tal. Contáctame si te interesa explorar un rol genial de ${candidateRole} para el equipo clave de ${candidateClient}. Cuéntame cuándo te queda cómodo charlar.`;

    return {
      message: fallbackMessage,
      source: "Mock Database"
    };
  }
}

/**
 * Generate an optimized complex Boolean and X-Ray search query.
 */
export async function generateBooleanQueryLive(
  keywords: string,
  excludes: string,
  location: string,
  jobTitle: string
): Promise<{ query: string; source: "Gemini AI" | "Mock Database" }> {
  try {
    const prompt = `
      Eres un Ingeniero de Sourcing de Talento con experiencia en reclutamiento técnico.
      Genera una string de búsqueda booleana optimizada (con operadores AND, OR, NOT) y consultas X-Ray avanzadas para motores de búsqueda (Google/LinkedIn) basadas en los siguientes criterios:

      CRITERIOS:
      - Palabras clave requeridas (keywords): ${keywords}
      - Exclusiones críticas (NOT): ${excludes || "Ninguna"}
      - Ubicación deseada: ${location || "Cualquiera"}
      - Título del Puesto/Referencia: ${jobTitle}

      REQUISITOS DE SALIDA:
      - Devuelve una combinación elegante de string booleana optimizada para LinkedIn
      - Debe incluir paréntesis correctos y operadores en MAYÚSCULAS (AND, OR, NOT).
      - Añade una línea corta que demuestre consultas X-Ray con "site:linkedin.com/in/" o "site:github.com" si aplica.
      - Limita tu respuesta a la string de consulta final lista para ser copiada. Sin explicaciones ni intros.

      Ejemplo de formato esperado:
      (site:linkedin.com/in/ OR site:es.linkedin.com/in/) AND ("Rust" AND "WebAssembly") AND "Barcelona" -("Junior" OR "Intern")
    `;

    const queryText = await callGeminiRaw(prompt, false);
    return {
      query: queryText.trim().replace(/^`+|`+$/g, ""),
      source: "Gemini AI"
    };
  } catch (error) {
    console.warn("Boolean generation fell back to string concatenation logic:", error);
    
    const keywordsArray = keywords.split(",").map(k => k.trim()).filter(Boolean);
    const isWord = (w: string) => w.includes(" ") ? `"${w}"` : w;
    const keywordsJoined = keywordsArray.map(isWord).join(" AND ");
    let booleanStr = `(site:linkedin.com/in/ OR site:es.linkedin.com/in/) AND (${keywordsJoined})`;
    if (location.trim()) {
      booleanStr += ` AND "${location.trim()}"`;
    }
    if (excludes.trim()) {
      const excludesArray = excludes.split(",").map(e => e.trim()).filter(Boolean);
      const excludesJoined = excludesArray.map(isWord).join(" OR ");
      booleanStr += ` -(${excludesJoined})`;
    }
    return {
      query: booleanStr,
      source: "Mock Database"
    };
  }
}

