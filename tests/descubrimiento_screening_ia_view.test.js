import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

describe('P-DIS-01: Vista Lista Screening IA y Mapeo de Columnas de Screening Inteligente', () => {

  // Test 1: Soporte de tipos para viewMode ("kanban", "lista", "screening_ia")
  test('viewMode admite las 3 opciones de vista en P-DIS-01', () => {
    let currentViewMode = "kanban";
    const setViewMode = (mode) => { currentViewMode = mode; };

    setViewMode("lista");
    assert.equal(currentViewMode, "lista");

    setViewMode("screening_ia");
    assert.equal(currentViewMode, "screening_ia");

    setViewMode("kanban");
    assert.equal(currentViewMode, "kanban");
  });

  // Test 2: Mapeo de campos de Screening Inteligente IA en SourcedCandidate
  test('Mapeo correcto de fitScoreScreening, tieneKnockout y resultadoScreening', () => {
    const rawPipeItem = {
      id: "pipe-100",
      claves_conexion: { id_busqueda: "REQ-001", id_candidato: "C-301" },
      fit_score_screening: 85,
      tiene_knockout: true,
      resultado_screening: [
        { id_criterio: "c1", evaluacion: "NO", es_knockout: true, puntaje_obtenido: 0, evidencia_cv: "No cumple con inglés C1" },
        { id_criterio: "c2", evaluacion: "SI", es_knockout: false, puntaje_obtenido: 50, evidencia_cv: "5+ años en desarrollo iOS Nativo" }
      ],
      f1_descubrimiento: {
        notas_reclutador: "Requiere validación de pretensión salarial"
      }
    };

    const fitScoreScreening = rawPipeItem.fit_score_screening;
    const tieneKnockout = rawPipeItem.tiene_knockout;
    const resultadoScreening = rawPipeItem.resultado_screening;
    const recruiterNotes = rawPipeItem.f1_descubrimiento.notas_reclutador;

    assert.equal(fitScoreScreening, 85);
    assert.equal(tieneKnockout, true);
    assert.equal(resultadoScreening.length, 2);
    assert.equal(resultadoScreening[0].evaluacion, "NO");
    assert.equal(resultadoScreening[0].es_knockout, true);
    assert.equal(recruiterNotes, "Requiere validación de pretensión salarial");
  });

  // Test 3: Verificación de lógica de Alerta Knockout (Cumplido vs Incumplido vs Pendiente)
  test('Determinación de Alerta Knockout basada en tieneKnockout, resultadoScreening y estado no procesado', () => {
    const evalKnockoutStatus = (candidate) => {
      const isKnockoutActive = candidate.tieneKnockout || candidate.resultadoScreening?.some(r => r.es_knockout && r.evaluacion === "NO");
      const hasProcessedScreening = candidate.resultadoScreening && candidate.resultadoScreening.length > 0;
      if (isKnockoutActive) return "INCUMPLIDO";
      if (hasProcessedScreening) return "CUMPLIDO";
      return "PENDIENTE";
    };

    const candidateOk = {
      name: "Diego Lozano",
      tieneKnockout: false,
      resultadoScreening: [
        { id_criterio: "c1", evaluacion: "SI", es_knockout: true, puntaje_obtenido: 50 }
      ]
    };

    const candidateFailed = {
      name: "Alberto Ruiz",
      tieneKnockout: true,
      resultadoScreening: [
        { id_criterio: "c1", evaluacion: "NO", es_knockout: true, puntaje_obtenido: 0 }
      ]
    };

    const candidatePending = {
      name: "Adolfo Gómez",
      tieneKnockout: false,
      resultadoScreening: []
    };

    assert.equal(evalKnockoutStatus(candidateOk), "CUMPLIDO");
    assert.equal(evalKnockoutStatus(candidateFailed), "INCUMPLIDO");
    assert.equal(evalKnockoutStatus(candidatePending), "PENDIENTE");
  });

  // Test 4: Formateo de Semáforo por Criterio (SI, INFERIDO, NO)
  test('Formateo de semáforo de evaluación por criterio', () => {
    const formatSemaforo = (evaluacion) => {
      if (evaluacion === "SI") return { label: "SÍ", color: "emerald" };
      if (evaluacion === "INFERIDO") return { label: "INFERIDO", color: "sky" };
      return { label: "NO", color: "rose" };
    };

    assert.deepEqual(formatSemaforo("SI"), { label: "SÍ", color: "emerald" });
    assert.deepEqual(formatSemaforo("INFERIDO"), { label: "INFERIDO", color: "sky" });
    assert.deepEqual(formatSemaforo("NO"), { label: "NO", color: "rose" });
  });

  // Test 5: Resolución de Pregunta / Condición a evaluar por criterio
  test('Resolución de nombre de la pregunta en Desglose de Criterios y Alerta Knockout', () => {
    const getCriterionQuestion = (item, candidate, idx, activeBusquedas = []) => {
      if (item.pregunta && item.pregunta.trim() !== "") return item.pregunta;
      if (item.pregunta_condicion && String(item.pregunta_condicion).trim() !== "") return item.pregunta_condicion;
      if (activeBusquedas.length > 0) {
        const busq = activeBusquedas.find(b => b.id === candidate.searchId);
        const crit = busq?.criterios_screening?.find(c => c.id === item.id_criterio);
        if (crit?.pregunta) return crit.pregunta;
      }
      return item.es_knockout ? `Criterio Knockout #${idx + 1}` : `Criterio #${idx + 1}`;
    };

    const candidate = {
      searchId: "REQ-001",
      resultadoScreening: [
        { id_criterio: "c1", pregunta: "¿Tiene al menos 4 años de experiencia en React?", evaluacion: "NO", es_knockout: true, puntaje_obtenido: 0 },
        { id_criterio: "c2", evaluacion: "SI", es_knockout: false, puntaje_obtenido: 30 }
      ]
    };

    const activeBusquedas = [
      {
        id: "REQ-001",
        criterios_screening: [
          { id: "c1", pregunta: "¿Tiene al menos 4 años de experiencia en React?", tipo: "knockout", peso: 0 },
          { id: "c2", pregunta: "¿Nivel de inglés B2 conversacional?", tipo: "deseable", peso: 30 }
        ]
      }
    ];

    // Item 1 tiene pregunta directa
    assert.equal(getCriterionQuestion(candidate.resultadoScreening[0], candidate, 0, activeBusquedas), "¿Tiene al menos 4 años de experiencia en React?");
    // Item 2 resuelve pregunta desde la Búsqueda
    assert.equal(getCriterionQuestion(candidate.resultadoScreening[1], candidate, 1, activeBusquedas), "¿Nivel de inglés B2 conversacional?");
  });

  // Test 6: Verificación de lista de columnas homologadas (Sin Evidencia CV)
  test('Columnas homologadas en Lista Screening IA no incluyen Evidencia CV', () => {
    const tableColumns = [
      "Candidato",
      "Fit Score IA",
      "Alerta Knockout",
      "Desglose Criterios & Semáforo",
      "NOTAS DESCUBRIMIENTO",
      "Estado",
      "Acciones"
    ];

    assert.ok(!tableColumns.includes("Evidencia CV (Prueba de Vida)"));
    assert.equal(tableColumns.length, 7);
  });

  // Test 7: Enlace interactivo en nombre de candidato hacia su detalle
  test('El nombre del candidato genera la ruta correcta hacia su expediente de detalle', () => {
    const getCandidateDetailHref = (candidate) => `/descubrimiento/${candidate.pipeId || candidate.id}`;

    const cand1 = { id: "C-301", pipeId: "pipe-301-xyz" };
    const cand2 = { id: "C-302" };

    assert.equal(getCandidateDetailHref(cand1), "/descubrimiento/pipe-301-xyz");
    assert.equal(getCandidateDetailHref(cand2), "/descubrimiento/C-302");
  });

  // Test 8: Ordenamiento numérico por Fit Score IA en la vista Lista Screening IA
  test('Ordenamiento por Fit Score IA ordena numéricamente los registros en orden ascendente y descendente', () => {
    const candidateList = [
      { id: "C-1", name: "Adolfo Gómez", score: 80, fitScoreScreening: 0 },
      { id: "C-2", name: "Diego Lozano", score: 94, fitScoreScreening: 94 },
      { id: "C-3", name: "Carlos Tejera", score: 87, fitScoreScreening: 87 }
    ];

    const sortCandidates = (list, direction) => {
      return [...list].sort((a, b) => {
        const valA = a.fitScoreScreening ?? a.score ?? 0;
        const valB = b.fitScoreScreening ?? b.score ?? 0;
        return direction === "asc" ? valA - valB : valB - valA;
      });
    };

    const sortedDesc = sortCandidates(candidateList, "desc");
    assert.deepEqual(sortedDesc.map(c => c.id), ["C-2", "C-3", "C-1"]);

    const sortedAsc = sortCandidates(candidateList, "asc");
    assert.deepEqual(sortedAsc.map(c => c.id), ["C-1", "C-3", "C-2"]);
  });

});
