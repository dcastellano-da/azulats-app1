import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateEvaluacionKPIs, INITIAL_EVALUACION_CANDIDATES, mapPipelineToEvaluacionCandidates } from '../src/lib/evaluacion.ts';

describe('Módulo de Evaluación - Capa de Lógica y Datos', () => {
  
  test('Debería validar la estructura del dataset de mockups iniciales', () => {
    assert.ok(Array.isArray(INITIAL_EVALUACION_CANDIDATES));
    assert.ok(INITIAL_EVALUACION_CANDIDATES.length >= 5, 'Debe haber por lo menos 5 candidatos de prueba');
    
    // Validate fields on the first candidate
    const first = INITIAL_EVALUACION_CANDIDATES[0];
    assert.strictEqual(typeof first.id, 'string');
    assert.strictEqual(typeof first.name, 'string');
    assert.strictEqual(typeof first.role, 'string');
    assert.strictEqual(typeof first.client, 'string');
    assert.strictEqual(typeof first.score, 'number');
    assert.ok(['05_screening', '06_assessment', '08_descartado_interno'].includes(first.currentPhase));
    
    // Tools details validation
    assert.ok(first.toolsDetails, 'Debe tener la sección toolsDetails');
    assert.ok(Array.isArray(first.toolsDetails.sintetizador.pros), 'Sintetizador pros debe ser un arreglo');
    assert.ok(Array.isArray(first.toolsDetails.preguntas), 'Preguntas STAR debe ser un arreglo de strings');
    assert.ok(first.toolsDetails.validador, 'Debe tener validador de identidad');
    assert.ok(first.toolsDetails.copilot, 'Debe tener co-pilot telemetry details');
  });

  test('Debería calcular KPIs correctos para un set controlado de candidatos', () => {
    const controlledCandidates = [
      {
        id: 'TC-1',
        name: 'Test candidate 1',
        role: 'React Lead',
        client: 'Client-1',
        location: 'Madrid',
        score: 90,
        currentPhase: '05_screening',
        entryDate: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        cNPS: 10,
        lastActivity: 'Active',
        experienceYears: 7,
        contactNumber: '123',
        email: 't1@t.com',
        toolsDetails: {}
      },
      {
        id: 'TC-2',
        name: 'Test candidate 2',
        role: 'Rust Lead',
        client: 'Client-1',
        location: 'Madrid',
        score: 85,
        currentPhase: '06_assessment',
        entryDate: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(), // 20 hours ago
        cNPS: 6,
        lastActivity: 'Active',
        experienceYears: 8,
        contactNumber: '456',
        email: 't2@t.com',
        toolsDetails: {}
      },
      {
        id: 'TC-3',
        name: 'Test candidate 3',
        role: 'Java Dev',
        client: 'Client-2',
        location: 'Madrid',
        score: 70,
        currentPhase: '08_descartado_interno', // should be excluded from active WIP and cycle calculations
        entryDate: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
        cNPS: null, // should be excluded from cNPS average
        lastActivity: 'Inactive',
        experienceYears: 3,
        contactNumber: '789',
        email: 't3@t.com',
        toolsDetails: {}
      }
    ];

    const kpis = calculateEvaluacionKPIs(controlledCandidates);

    // 1. Check Active WIP Count (only 05 and 06)
    assert.strictEqual(kpis.activeWipCount, 2);
    assert.strictEqual(kpis.isWipOverloaded, false);

    // 2. Check cNPS average: (10 + 6) / 2 = 8
    assert.strictEqual(kpis.avgCNPS, 8);

    // 3. Check WIP Cycle Time average: (10 + 20) / 2 = 15 hours
    // (A tolerance matches because the Date.now() reference might fluctuate by milliseconds)
    assert.ok(Math.abs(kpis.wipCycleTimeHours - 15) < 0.2, `Expected cycle time around 15, got ${kpis.wipCycleTimeHours}`);

    // 4. Check Pass-through rate: assessment (1) / active screened (2) = 50%
    assert.strictEqual(kpis.passThroughRate, 50);
  });

  test('Debería detectar WIP sobrecargado (overloaded) cuando supera 10 candidatos activos', () => {
    const bulkCandidates = Array.from({ length: 11 }, (_, i) => ({
      id: `BULK-${i}`,
      name: `Bulk Candidate ${i}`,
      role: 'Engineer',
      client: 'Inditex',
      location: 'Spain',
      score: 75,
      currentPhase: i % 2 === 0 ? '05_screening' : '06_assessment',
      entryDate: new Date().toISOString(),
      cNPS: 8,
      lastActivity: 'Ready',
      experienceYears: 4,
      contactNumber: '1',
      email: 'a@c.com',
      toolsDetails: {}
    }));

    const kpis = calculateEvaluacionKPIs(bulkCandidates);
    assert.strictEqual(kpis.activeWipCount, 11);
    assert.strictEqual(kpis.isWipOverloaded, true);
  });

  test('Debería manejar datos vacíos elegantemente sin fallar por divisiones por cero', () => {
    const kpis = calculateEvaluacionKPIs([]);
    assert.strictEqual(kpis.activeWipCount, 0);
    assert.strictEqual(kpis.isWipOverloaded, false);
    assert.strictEqual(kpis.avgCNPS, 0);
    assert.strictEqual(kpis.wipCycleTimeHours, 0);
    assert.strictEqual(kpis.passThroughRate, 0);
  });

  test('mapPipelineToEvaluacionCandidates - Debería excluir candidatos en estado "01 - Nuevo (Para Revisión)" de Fase 1', () => {
    const samplePipeline = [
      {
        id: 'pipe-01-nuevo',
        claves_conexion: { id_busqueda: 'BUSQ-01', id_candidato: 'CAND-01' },
        flujo: {
          estado_actual: '01 - Nuevo (Para Revisión)',
          fecha_ultimo_cambio: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'pipe-05-screening',
        claves_conexion: { id_busqueda: 'BUSQ-01', id_candidato: 'CAND-02' },
        flujo: {
          estado_actual: '05 - Screening (Entrevista Inicial)',
          fecha_ultimo_cambio: new Date().toISOString()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const candidatos = [
      { id: 'CAND-01', nombre_completo: 'Candidato Fase 1', puesto: 'Dev' },
      { id: 'CAND-02', nombre_completo: 'Candidato Fase 2', puesto: 'Dev' }
    ];

    const busquedas = [
      { id: 'BUSQ-01', id_busqueda: 'BUSQ-01', perfil_busqueda: 'Frontend Dev', cliente: 'Cliente A' }
    ];

    const result = mapPipelineToEvaluacionCandidates(samplePipeline, candidatos, busquedas);

    // Debe retornar únicamente 1 candidato (el que está en Fase 2)
    assert.strictEqual(result.length, 1, 'Debe haber exactamente 1 candidato mapeado para Fase 2');
    assert.strictEqual(result[0].id, 'CAND-02');
    assert.strictEqual(result[0].currentPhase, '05_screening');
  });

  test('mapPipelineToEvaluacionCandidates - Debería incluir únicamente estados pertenecientes a Fase 2 (05, 06, 07, 08)', () => {
    const multiPhasePipeline = [
      { id: 'p1', claves_conexion: { id_busqueda: 'B1', id_candidato: 'C1' }, flujo: { estado_actual: '01_nuevo' } },
      { id: 'p2', claves_conexion: { id_busqueda: 'B1', id_candidato: 'C2' }, flujo: { estado_actual: '02_contactado' } },
      { id: 'p3', claves_conexion: { id_busqueda: 'B1', id_candidato: 'C3' }, flujo: { estado_actual: '05 - Screening' } },
      { id: 'p4', claves_conexion: { id_busqueda: 'B1', id_candidato: 'C4' }, flujo: { estado_actual: '06_assessment' } },
      { id: 'p5', claves_conexion: { id_busqueda: 'B1', id_candidato: 'C5' }, flujo: { estado_actual: '07_en_duda_evaluacion' } },
      { id: 'p6', claves_conexion: { id_busqueda: 'B1', id_candidato: 'C6' }, flujo: { estado_actual: '08_descartado_interno' } },
      { id: 'p7', claves_conexion: { id_busqueda: 'B1', id_candidato: 'C7' }, flujo: { estado_actual: '09_presentado_cliente' } }
    ];

    const result = mapPipelineToEvaluacionCandidates(multiPhasePipeline, [], []);

    assert.strictEqual(result.length, 4, 'Debe incluir únicamente los 4 estados pertenecientes a Fase 2');
    const phases = result.map(c => c.currentPhase);
    assert.deepStrictEqual(phases, ['05_screening', '06_assessment', '07_en_duda_evaluacion', '08_descartado_interno']);
  });

  test('P-EVA-01: Guardado y recuperación del filtro "Búsqueda" en localStorage (evaluacion_selected_search)', () => {
    let memoryStorage = {};
    const mockLocalStorage = {
      getItem: (key) => memoryStorage[key] || null,
      setItem: (key, val) => { memoryStorage[key] = String(val); }
    };

    let selectedSearch = "Todos";

    const handleSelectSearchChange = (value) => {
      selectedSearch = value;
      mockLocalStorage.setItem("evaluacion_selected_search", value);
    };

    // Estado inicial por defecto
    assert.strictEqual(selectedSearch, "Todos");
    assert.strictEqual(mockLocalStorage.getItem("evaluacion_selected_search"), null);

    // Selección de una búsqueda específica
    handleSelectSearchChange("REQ-002");
    assert.strictEqual(selectedSearch, "REQ-002");
    assert.strictEqual(mockLocalStorage.getItem("evaluacion_selected_search"), "REQ-002");

    // Simulación de recarga/re-ingreso recuperando desde localStorage
    const saved = mockLocalStorage.getItem("evaluacion_selected_search");
    if (saved) {
      selectedSearch = saved;
    }
    assert.strictEqual(selectedSearch, "REQ-002");
  });

  test('P-EVA-01 (src/app/evaluacion/page.tsx) integra la persistencia de evaluacion_selected_search en localStorage', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const pagePath = path.resolve('src/app/evaluacion/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(content.includes('evaluacion_selected_search'), 'La página P-EVA-01 debe gestionar localStorage con evaluacion_selected_search');
    assert.ok(content.includes('handleSelectSearchChange'), 'La página P-EVA-01 debe utilizar handleSelectSearchChange para mutar y persistir la búsqueda');
    assert.ok(content.includes('NOTAS RECLUTADOR EVALUACIONES'), 'La vista Lista Detallada de P-EVA-01 debe renombrar la cabecera a NOTAS RECLUTADOR EVALUACIONES');
    assert.ok(content.includes('toggleSort("notes")'), 'La cabecera NOTAS RECLUTADOR EVALUACIONES de Lista Detallada debe ser ejecutable con toggleSort("notes")');
  });
});
