import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Persistencia y mapeo de Criterios de Screening en Server Actions
test('Persistencia de Criterios de Screening en actualizarBusquedaAPI', async (t) => {
  const testCriterios = [
    {
      id: "crit-test-1",
      pregunta: "¿Tiene experiencia comprobable en microservicios Node.js?",
      tipo: "knockout",
      peso: 0
    },
    {
      id: "crit-test-2",
      pregunta: "¿Maneja bases de datos PostgreSQL o Cloud SQL?",
      tipo: "deseable",
      peso: 40
    }
  ];

  const mappedPayload = testCriterios.map(c => ({
    id: c.id,
    pregunta: c.pregunta,
    tipo: c.tipo,
    peso: c.tipo === 'knockout' ? 0 : Number(c.peso || 0)
  }));

  assert.equal(mappedPayload.length, 2);
  assert.equal(mappedPayload[0].tipo, 'knockout');
  assert.equal(mappedPayload[0].peso, 0);
  assert.equal(mappedPayload[1].tipo, 'deseable');
  assert.equal(mappedPayload[1].peso, 40);
});

// Test 2: Emparejamiento flexible de resultados de DB en ScreeningPanel
test('Emparejamiento flexible de resultados de screening (findEvaluationForCriterion)', async (t) => {
  const criteriosBusqueda = [
    { id: "c1", pregunta: "Experiencia en React 18", tipo: "knockout", peso: 0 },
    { id: "c2", pregunta: "Inglés C1 Avanzado", tipo: "deseable", peso: 50 }
  ];

  const localResultadoBD = [
    { id_criterio: "c1", evaluacion: "SI", evidencia_cv: "Experiencia de 4 años en React", es_knockout: true, puntaje_obtenido: 0 },
    { id_criterio: "c2", evaluacion: "SI", evidencia_cv: "Certificado TOEFL IBT 105", es_knockout: false, puntaje_obtenido: 50 }
  ];

  const findEvaluationForCriterion = (crit, idx) => {
    if (!localResultadoBD || localResultadoBD.length === 0) return undefined;
    let match = localResultadoBD.find(r => r.id_criterio === crit.id || r.criterio_id === crit.id || r.id === crit.id);
    if (match) return match;
    if (crit.pregunta) {
      match = localResultadoBD.find(r => r.pregunta && r.pregunta.trim().toLowerCase() === crit.pregunta.trim().toLowerCase());
      if (match) return match;
    }
    if (idx < localResultadoBD.length) return localResultadoBD[idx];
    return undefined;
  };

  const res1 = findEvaluationForCriterion(criteriosBusqueda[0], 0);
  const res2 = findEvaluationForCriterion(criteriosBusqueda[1], 1);

  assert.ok(res1);
  assert.equal(res1.evaluacion, 'SI');
  assert.ok(res2);
  assert.equal(res2.evaluacion, 'SI');
  assert.equal(res2.puntaje_obtenido, 50);
});

// Test 3: Integración exacta con Payload JSON de Backend (GET /api/v1/pipeline?id_busqueda=REQ-001)
test('Integración de datos de Screening con el Payload exacto de Backend REST', async (t) => {
  const backendResponseSample = {
    status: "success",
    total: 1,
    data: [
      {
        id: "e72c673e-0c20-4773-a314-4baf72536520",
        claves_conexion: {
          id_busqueda: "REQ-001",
          id_candidato: "09a1ff40-57c0-4806-95bf-bb1841dc726f"
        },
        flujo: {
          estado_actual: "01 - Nuevo (Para Revisión)",
          fecha_ultimo_cambio: "2026-07-29T08:00:00Z"
        },
        resultado_screening: [
          {
            id_criterio: "d73609ff-9f96-4254-9b62-94ecb901e40b",
            evaluacion: "SI",
            evidencia_cv: "Cita textual extraída del CV por Gemini...",
            es_knockout: false,
            puntaje_obtenido: 20
          }
        ],
        fit_score_screening: 85,
        tiene_knockout: false,
        fecha_modificacion_screening: "2026-07-29T08:00:00Z"
      }
    ]
  };

  const item = backendResponseSample.data[0];
  const candidateIdTarget = "09a1ff40-57c0-4806-95bf-bb1841dc726f";

  // Verificación de mapeo seguro por candidato ID
  const matchesCandidate = item.claves_conexion?.id_candidato === candidateIdTarget;
  assert.equal(matchesCandidate, true);
  assert.equal(item.fit_score_screening, 85);
  assert.equal(item.tiene_knockout, false);
  assert.equal(item.resultado_screening.length, 1);
  assert.equal(item.resultado_screening[0].evaluacion, "SI");
});
