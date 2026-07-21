import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateEvaluacionKPIs, INITIAL_EVALUACION_CANDIDATES } from '../src/lib/evaluacion.ts';

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
    assert.ok(['05_screening', '06_assessment', '07_descartado_interno'].includes(first.currentPhase));
    
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
        currentPhase: '07_descartado_interno', // should be excluded from active WIP and cycle calculations
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
});
