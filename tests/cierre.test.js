import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculateCierreKPIs, INITIAL_CIERRE_CANDIDATES } from '../src/lib/cierre.ts';

describe('Módulo de Cierre (F4 Cierre) - Capa de Lógica y Datos', () => {
  
  test('Debería validar la estructura del dataset de mockups iniciales de cierre', () => {
    assert.ok(Array.isArray(INITIAL_CIERRE_CANDIDATES));
    assert.ok(INITIAL_CIERRE_CANDIDATES.length >= 6, 'Debe haber por lo menos 6 candidatos de prueba iniciales');
    
    // Validate fields on the first candidate
    const first = INITIAL_CIERRE_CANDIDATES[0];
    assert.strictEqual(typeof first.id, 'string');
    assert.strictEqual(typeof first.name, 'string');
    assert.strictEqual(typeof first.role, 'string');
    assert.strictEqual(typeof first.client, 'string');
    assert.strictEqual(typeof first.score, 'number');
    assert.ok(
      ['11_oferta_extendida', '12_contratado', '13_rechazado_cliente', '14_candidato_se_baja'].includes(first.currentPhase),
      'Fase actual no válida'
    );
    
    // Verify salaryDetails is populated
    assert.ok(first.salaryDetails, 'Debe tener detalles salariales');
    assert.strictEqual(typeof first.salaryDetails.baseSalary, 'number');
    assert.strictEqual(typeof first.salaryDetails.expectedSalary, 'number');

    // Tools details validation matches CierreCandidate interface
    assert.ok(first.toolsDetails, 'Debe tener la sección toolsDetails');
    assert.ok(first.toolsDetails.predictiveMotor, 'Debe tener predictiveMotor');
    assert.ok(first.toolsDetails.feedbackWriter, 'Debe tener feedbackWriter');
    assert.ok(first.toolsDetails.contractGenerator, 'Debe tener contractGenerator');
    assert.ok(first.toolsDetails.preOnboard, 'Debe tener preOnboard');
  });

  test('Debería calcular KPIs correctos para un set controlado de candidatos en la fase post-cierre', () => {
    const controlledCandidates = [
      {
        id: 'TC-C1',
        name: 'Alicia Test',
        role: 'Frontend Dev',
        client: 'Client-1',
        location: 'Madrid',
        score: 90,
        currentPhase: '11_oferta_extendida', // Active Negos
        entryDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        offerDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        lastActivity: 'Negotiating',
        experienceYears: 5,
        contactNumber: '111',
        email: 'alicia@test.com',
        feedbackStatus: 'pendiente',
        salaryDetails: { baseSalary: 50000, expectedSalary: 55000, bonusAnnual: 2000, benefitsValue: 1000 },
        toolsDetails: {
          predictiveMotor: { baseProbability: 80, adjustedProbability: 80, riskFactors: [], mitigationActionSelected: false },
          feedbackWriter: { reasonsForReject: '', generatedFeedback: '', isSent: false },
          contractGenerator: { generated: false, contractType: 'Indefinido', startDate: '2026-09-01' },
          preOnboard: { cadenceSteps: [], ghostingRisk: 'Bajo' }
        }
      },
      {
        id: 'TC-C2',
        name: 'Carlos Hired',
        role: 'Architect',
        client: 'Client-1',
        location: 'Madrid',
        score: 95,
        currentPhase: '12_contratado', // Hired candidate
        entryDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        offerDate: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
        closedDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Latency = 24 hours
        lastActivity: 'Hired',
        experienceYears: 10,
        contactNumber: '222',
        email: 'carlos@test.com',
        feedbackStatus: 'pendiente',
        salaryDetails: { baseSalary: 70000, expectedSalary: 70000, bonusAnnual: 5000, benefitsValue: 2000 },
        toolsDetails: {
          predictiveMotor: { baseProbability: 95, adjustedProbability: 95, riskFactors: [], mitigationActionSelected: false },
          feedbackWriter: { reasonsForReject: '', generatedFeedback: '', isSent: false },
          contractGenerator: { generated: true, contractType: 'Indefinido', startDate: '2026-08-01' },
          preOnboard: { cadenceSteps: [], ghostingRisk: 'Bajo' }
        }
      },
      {
        id: 'TC-C3',
        name: 'Sofía Rejected',
        role: 'Manager',
        client: 'Client-1',
        location: 'Madrid',
        score: 80,
        currentPhase: '13_rechazado_cliente', // Lost candidate
        entryDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        offerDate: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(),
        closedDate: new Date(Date.now() - 36 * 60 * 60 * 1000).toISOString(), // Latency = 36 hours
        lastActivity: 'Rejected',
        experienceYears: 6,
        contactNumber: '333',
        email: 'sofia@test.com',
        feedbackStatus: 'entregado_manual', // Counts as constructive manual feedback delivered
        salaryDetails: { baseSalary: 60000, expectedSalary: 68000, bonusAnnual: 0, benefitsValue: 1000 },
        toolsDetails: {
          predictiveMotor: { baseProbability: 50, adjustedProbability: 50, riskFactors: [], mitigationActionSelected: false },
          feedbackWriter: { reasonsForReject: 'Too high salary expectations', generatedFeedback: 'Sorry...', isSent: true },
          contractGenerator: { generated: false, contractType: 'N/A', startDate: '' },
          preOnboard: { cadenceSteps: [], ghostingRisk: 'Bajo' }
        }
      },
      {
        id: 'TC-C4',
        name: 'Bruno Dropout',
        role: 'Specialist',
        client: 'Client-2',
        location: 'Madrid',
        score: 85,
        currentPhase: '14_candidato_se_baja', // Drop-out
        entryDate: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
        offerDate: new Date(Date.now() - 96 * 60 * 60 * 1000).toISOString(),
        closedDate: new Date(Date.now() - 66 * 60 * 60 * 1000).toISOString(), // Latency = 30 hours
        lastActivity: 'Drop out',
        experienceYears: 8,
        contactNumber: '444',
        email: 'bruno@test.com',
        feedbackStatus: 'pendiente', // Excluded from constructive manual feedback count
        salaryDetails: { baseSalary: 55000, expectedSalary: 52000, bonusAnnual: 1000, benefitsValue: 500 },
        toolsDetails: {
          predictiveMotor: { baseProbability: 70, adjustedProbability: 70, riskFactors: [], mitigationActionSelected: false },
          feedbackWriter: { reasonsForReject: 'Took alternative offer', generatedFeedback: 'Good luck...', isSent: true },
          contractGenerator: { generated: false, contractType: 'N/A', startDate: '' },
          preOnboard: { cadenceSteps: [], ghostingRisk: 'Bajo' }
        }
      }
    ];

    const kpis = calculateCierreKPIs(controlledCandidates);

    // 1. Active Closing WIP Count: only TC-C1 is '11_oferta_extendida'
    assert.strictEqual(kpis.activeClosingWipCount, 1);
    assert.strictEqual(kpis.isWipOverloaded, false);

    // 2. Offer Acceptance Rate (OAR) = Hired(12) / (Hired(12) + DropOut(14)) * 100
    // TC-C2 is '12_contratado' (1), TC-C4 is '14_candidato_se_baja' (1).
    // OAR = 1 / (1 + 1) * 100 = 50%
    assert.strictEqual(kpis.offerAcceptanceRate, 50);

    // 3. Average Decision Latency: Hired(TC-C2: 24h) + Rejected(TC-C3: 36h) + Dropout(TC-C4: 30h)
    // Average Latency = (24 + 36 + 30) / 3 = 90 / 3 = 30 hours
    assert.ok(Math.abs(kpis.avgDecisionLatencyHours - 30) < 0.1, `Expected decision latency to be around 30h, got ${kpis.avgDecisionLatencyHours}`);

    // 4. Feedback Closure Rate = (Rejected (TC-C3) + Dropouts (TC-C4) with feedbackStatus === 'entregado_manual') / total (13 + 14) * 100
    // Total (13 + 14) is TC-C3 and TC-C4 = 2.
    // 'entregado_manual' count is TC-C3 = 1.
    // Feedback Closure Rate = 1 / 2 * 100 = 50%
    assert.strictEqual(kpis.feedbackClosureRate, 50);
  });

  test('Debería detectar WIP sobrecargado (overloaded) cuando supera 5 candidatos activos en negociación de oferta', () => {
    const overloadedCandidates = Array.from({ length: 6 }, (_, i) => ({
      id: `OV-${i}`,
      name: `Overloaded Candidate ${i}`,
      role: 'Engineer',
      client: 'Inditex S.A.',
      location: 'Madrid',
      score: 80,
      currentPhase: '11_oferta_extendida', // All active WIP
      entryDate: new Date().toISOString(),
      offerDate: new Date().toISOString(),
      lastActivity: 'Interviewing',
      experienceYears: 4,
      contactNumber: '123',
      email: `ov-${i}@test.com`,
      feedbackStatus: 'pendiente',
      salaryDetails: { baseSalary: 45000, expectedSalary: 45000, bonusAnnual: 0, benefitsValue: 0 },
      toolsDetails: {
        predictiveMotor: { baseProbability: 70, adjustedProbability: 70, riskFactors: [], mitigationActionSelected: false },
        feedbackWriter: { reasonsForReject: '', generatedFeedback: '', isSent: false },
        contractGenerator: { generated: false, contractType: 'Indefinido', startDate: '' },
        preOnboard: { cadenceSteps: [], ghostingRisk: 'Bajo' }
      }
    }));

    const kpis = calculateCierreKPIs(overloadedCandidates);
    assert.strictEqual(kpis.activeClosingWipCount, 6);
    assert.strictEqual(kpis.isWipOverloaded, true, 'WIP de cierre debería marcarse como sobrecargado (> 5 ofertas en negociación)');
  });

  test('Debería manejar conjuntos vacíos de candidatos elegantemente', () => {
    const kpis = calculateCierreKPIs([]);
    assert.strictEqual(kpis.activeClosingWipCount, 0);
    assert.strictEqual(kpis.isWipOverloaded, false);
    assert.strictEqual(kpis.offerAcceptanceRate, 0);
    assert.strictEqual(kpis.avgDecisionLatencyHours, 0);
    assert.strictEqual(kpis.feedbackClosureRate, 0);
  });
});
