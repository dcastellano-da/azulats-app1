import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculatePresentacionKPIs, INITIAL_PRESENTACION_CANDIDATES } from '../src/lib/presentacion.ts';

describe('Módulo de Presentación - Capa de Lógica y Datos', () => {
  
  test('Debería validar la estructura del dataset de mockups iniciales', () => {
    assert.ok(Array.isArray(INITIAL_PRESENTACION_CANDIDATES));
    assert.ok(INITIAL_PRESENTACION_CANDIDATES.length >= 5, 'Debe haber por lo menos 5 candidatos de prueba');
    
    // Validate fields on the first candidate
    const first = INITIAL_PRESENTACION_CANDIDATES[0];
    assert.strictEqual(typeof first.id, 'string');
    assert.strictEqual(typeof first.name, 'string');
    assert.strictEqual(typeof first.role, 'string');
    assert.strictEqual(typeof first.client, 'string');
    assert.strictEqual(typeof first.score, 'number');
    assert.ok(['08_shortlist', '09_entrevista_cliente', '10_standby'].includes(first.currentPhase));
    
    // Tools details validation
    assert.ok(first.toolsDetails, 'Debe tener la sección toolsDetails');
    assert.ok(first.toolsDetails.analitica, 'Debe tener analítica de Zoom');
    assert.ok(first.toolsDetails.traductor, 'Debe tener traductor');
    assert.ok(first.toolsDetails.briefing, 'Debe tener briefing ejecutivo');
    assert.ok(first.toolsDetails.agenda, 'Debe tener agenda');
    assert.ok(first.toolsDetails.tracker, 'Debe tener tracker de SLA');
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
        currentPhase: '08_shortlist',
        entryDate: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        cNPS: 10,
        lastActivity: 'Active',
        experienceYears: 7,
        contactNumber: '123',
        email: 't1@t.com',
        toolsDetails: {
          analitica: {
            transcriptSnippets: [],
            sentimentScore: 90,
            globalSentiment: 'Positivo',
            salaryAlert: false,
            salaryRequested: '',
            salaryOffered: '',
            microExpressionsDetected: []
          },
          traductor: { originalCVText: '', translatedCVText: '', cvTranslated: false },
          briefing: { generated: false, content: '' },
          agenda: { suggestedSlots: [], isScheduled: false },
          tracker: { hoursSinceSent: 10, slaExceeded: false, totalRemindersSent: 0 }
        }
      },
      {
        id: 'TC-2',
        name: 'Test candidate 2',
        role: 'Rust Lead',
        client: 'Client-1',
        location: 'Madrid',
        score: 85,
        currentPhase: '09_entrevista_cliente', // excluded from blockage time, included in calibration accuracy
        entryDate: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        cNPS: 6,
        lastActivity: 'Active',
        experienceYears: 8,
        contactNumber: '456',
        email: 't2@t.com',
        toolsDetails: {
          analitica: {
            transcriptSnippets: [],
            sentimentScore: 85,
            globalSentiment: 'Positivo',
            salaryAlert: false,
            salaryRequested: '',
            salaryOffered: '',
            microExpressionsDetected: []
          },
          traductor: { originalCVText: '', translatedCVText: '', cvTranslated: false },
          briefing: { generated: false, content: '' },
          agenda: { suggestedSlots: [], isScheduled: false },
          tracker: { hoursSinceSent: 20, slaExceeded: false, totalRemindersSent: 0 }
        }
      },
      {
        id: 'TC-3',
        name: 'Test candidate 3',
        role: 'Java Dev',
        client: 'Client-2',
        location: 'Madrid',
        score: 70,
        currentPhase: '10_standby', // included in blockage time and calibration accuracy
        entryDate: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
        cNPS: null, // should be excluded from cNPS average
        lastActivity: 'Inactive',
        experienceYears: 3,
        contactNumber: '789',
        email: 't3@t.com',
        toolsDetails: {
          analitica: {
            transcriptSnippets: [],
            sentimentScore: 70,
            globalSentiment: 'Neutro',
            salaryAlert: false,
            salaryRequested: '',
            salaryOffered: '',
            microExpressionsDetected: []
          },
          traductor: { originalCVText: '', translatedCVText: '', cvTranslated: false },
          briefing: { generated: false, content: '' },
          agenda: { suggestedSlots: [], isScheduled: false },
          tracker: { hoursSinceSent: 30, slaExceeded: false, totalRemindersSent: 0 }
        }
      }
    ];

    const kpis = calculatePresentacionKPIs(controlledCandidates);

    // 1. Check Active WIP Count (total candidates)
    assert.strictEqual(kpis.activeWipCount, 3);
    assert.strictEqual(kpis.isWipOverloaded, false);

    // 2. Check cNPS average: (10 + 6) / 2 = 8
    assert.strictEqual(kpis.avgCNPS, 8);

    // 3. Check Blockage Time average: 08_shortlist (10h) and 10_standby (30h) -> (10 + 30) / 2 = 20 hours
    assert.ok(Math.abs(kpis.blockageTimeHours - 20) < 0.2, `Expected blockage time around 20, got ${kpis.blockageTimeHours}`);

    // 4. Check Calibration Accuracy: (09_entrevista_cliente (1) + 10_standby (1)) / activeWipCount (3) = 66.66% -> rounded: 67%
    assert.strictEqual(kpis.calibrationAccuracy, 67);
  });

  test('Debería detectar WIP sobrecargado (overloaded) cuando supera 10 candidatos', () => {
    const bulkCandidates = Array.from({ length: 11 }, (_, i) => ({
      id: `BULK-${i}`,
      name: `Bulk Candidate ${i}`,
      role: 'Engineer',
      client: 'Inditex',
      location: 'Spain',
      score: 75,
      currentPhase: i % 3 === 0 ? '08_shortlist' : (i % 3 === 1 ? '09_entrevista_cliente' : '10_standby'),
      entryDate: new Date().toISOString(),
      cNPS: 8,
      lastActivity: 'Ready',
      experienceYears: 4,
      contactNumber: '1',
      email: 'a@c.com',
      toolsDetails: {
        analitica: {
          transcriptSnippets: [],
          sentimentScore: 75,
          globalSentiment: 'Positivo',
          salaryAlert: false,
          salaryRequested: '',
          salaryOffered: '',
          microExpressionsDetected: []
        },
        traductor: { originalCVText: '', translatedCVText: '', cvTranslated: false },
        briefing: { generated: false, content: '' },
        agenda: { suggestedSlots: [], isScheduled: false },
        tracker: { hoursSinceSent: 0, slaExceeded: false, totalRemindersSent: 0 }
      }
    }));

    const kpis = calculatePresentacionKPIs(bulkCandidates);
    assert.strictEqual(kpis.activeWipCount, 11);
    assert.strictEqual(kpis.isWipOverloaded, true);
  });

  test('Debería manejar datos vacíos elegantemente sin fallar por divisiones por cero', () => {
    const kpis = calculatePresentacionKPIs([]);
    assert.strictEqual(kpis.activeWipCount, 0);
    assert.strictEqual(kpis.isWipOverloaded, false);
    assert.strictEqual(kpis.avgCNPS, 0);
    assert.strictEqual(kpis.blockageTimeHours, 0);
    assert.strictEqual(kpis.calibrationAccuracy, 0);
  });
});
