import { test, describe, before, afterEach } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import { mapPipelineToEvaluacionCandidates } from '../src/lib/evaluacion.ts';

const require = createRequire(import.meta.url);

process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8080';

// Mock next/headers
const Module = require('node:module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'next/headers') {
    return {
      cookies: async () => {
        return {
          get: (name) => {
            return { value: 'mock-token-assessment-manual' };
          }
        };
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

describe('Módulo de Assessment Técnico Manual (f2_evaluacion.assessment_manual)', () => {
  let actualizarAssessmentManualAction;
  let originalFetch;

  before(async () => {
    originalFetch = global.fetch;
    const pipelineModule = await import('../src/actions/pipeline.ts');
    actualizarAssessmentManualAction = pipelineModule.actualizarAssessmentManualAction;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('mapPipelineToEvaluacionCandidates - Debería mapear f2_evaluacion.assessment_manual en todos los estados de Fase 2 (05 al 08)', () => {
    const mockPipeline = [
      {
        id: 'pipe-05',
        claves_conexion: { id_candidato: 'CAND-05', id_busqueda: 'REQ-01' },
        flujo: { estado_actual: '05 - Screening', fecha_ultimo_cambio: '2026-08-27T10:00:00Z' },
        f2_evaluacion: {
          assessment_manual: {
            resumen_texto: 'Fortalezas en arquitectura frontend. Veredicto: Apto.',
            fecha_evaluacion: '2026-08-27T10:15:00.000Z'
          }
        }
      },
      {
        id: 'pipe-06',
        claves_conexion: { id_candidato: 'CAND-06', id_busqueda: 'REQ-01' },
        flujo: { estado_actual: '06 - Prueba / Assessment Técnico', fecha_ultimo_cambio: '2026-08-27T11:00:00Z' },
        f2_evaluacion: {
          assessment_manual: {
            resumen_texto: 'Excelente dominio de TypeScript y Live Coding limpio.',
            fecha_evaluacion: '2026-08-27T11:30:00.000Z'
          }
        }
      },
      {
        id: 'pipe-07',
        claves_conexion: { id_candidato: 'CAND-07', id_busqueda: 'REQ-01' },
        flujo: { estado_actual: '07 - En Duda Evaluación', fecha_ultimo_cambio: '2026-08-27T12:00:00Z' },
        f2_evaluacion: {
          assessment_manual: {
            resumen_texto: 'Dudas en algoritmos complejos pero buena comunicación.',
            fecha_evaluacion: '2026-08-27T12:20:00.000Z'
          }
        }
      },
      {
        id: 'pipe-08',
        claves_conexion: { id_candidato: 'CAND-08', id_busqueda: 'REQ-01' },
        flujo: { estado_actual: '08 - Descartado (Interno)', fecha_ultimo_cambio: '2026-08-27T13:00:00Z' },
        f2_evaluacion: {
          assessment_manual: {
            resumen_texto: 'No alcanzó el estándar mínimo en live coding.',
            fecha_evaluacion: '2026-08-27T13:10:00.000Z'
          }
        }
      }
    ];

    const mapped = mapPipelineToEvaluacionCandidates(mockPipeline, [], []);
    assert.strictEqual(mapped.length, 4);

    mapped.forEach((cad, idx) => {
      assert.ok(cad.assessment_manual, `Candidato ${cad.id} debe tener assessment_manual`);
      assert.ok(cad.assessment_manual.resumen_texto, `Candidato ${cad.id} debe tener resumen_texto`);
      assert.ok(cad.assessment_manual.fecha_evaluacion, `Candidato ${cad.id} debe tener fecha_evaluacion`);
    });
  });

  test('actualizarAssessmentManualAction - Debería enviar PATCH /api/v1/pipeline/:id con payload inmutable (sin fecha del cliente)', async () => {
    const pipelineId = 'pipe-assessment-999';
    const resumenTexto = 'Candidato demuestra nivel Senior sobresaliente en desarrollo React y Node.js.';

    let requestUrl = '';
    let requestMethod = '';
    let requestHeaders = {};
    let requestBody = null;

    global.fetch = async (url, options) => {
      requestUrl = url;
      requestMethod = options.method;
      requestHeaders = options.headers;
      requestBody = JSON.parse(options.body);

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          data: {
            id: pipelineId,
            f2_evaluacion: {
              assessment_manual: {
                resumen_texto: resumenTexto,
                fecha_evaluacion: '2026-08-27T18:00:00.000Z' // Inyectada por el backend
              }
            }
          }
        })
      };
    };

    const res = await actualizarAssessmentManualAction(pipelineId, resumenTexto);

    assert.strictEqual(res.success, true);
    assert.strictEqual(requestMethod, 'PATCH');
    assert.strictEqual(requestUrl, 'http://localhost:8080/api/v1/pipeline/pipe-assessment-999');
    assert.ok(requestHeaders['Authorization'].startsWith('Bearer '), 'Authorization header debe ser un token Bearer');
    
    // Regla de Inmutabilidad Temporal: El payload HTTP enviado por el cliente NO contiene fecha_evaluacion
    assert.ok(requestBody.f2_evaluacion);
    assert.ok(requestBody.f2_evaluacion.assessment_manual);
    assert.strictEqual(requestBody.f2_evaluacion.assessment_manual.resumen_texto, resumenTexto);
    assert.strictEqual(requestBody.f2_evaluacion.assessment_manual.fecha_evaluacion, undefined, 'La fecha_evaluacion no debe ser enviada por el cliente');
  });

  test('actualizarAssessmentManualAction - Fail-Fast: Retorna error en fallo de red/HTTP sin alterar estado', async () => {
    const pipelineId = 'pipe-fail-fast-001';
    const resumenTexto = 'Evaluación técnica interrumpida por falla de red.';

    global.fetch = async () => {
      return {
        status: 500,
        json: async () => ({
          status: 'error',
          message: 'Error interno en servidor Firestore'
        })
      };
    };

    const res = await actualizarAssessmentManualAction(pipelineId, resumenTexto);

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 500);
    assert.ok(res.message.includes('Error interno'), 'Debería transmitir el mensaje de error para activar el Toast en frontend');
  });

  test('Debería verificar la integración de AssessmentManualCard en P-EVA-02 (src/app/evaluacion/[id]/page.tsx)', () => {
    const detailContent = readFileSync('./src/app/evaluacion/[id]/page.tsx', 'utf8');
    assert.ok(detailContent.includes('AssessmentManualCard'), 'P-EVA-02 debe importar e integrar AssessmentManualCard');
    assert.ok(detailContent.includes('assessmentManual'), 'P-EVA-02 debe gestionar el estado assessmentManual');
  });

  test('Debería verificar la integración en Kanban y Lista Detallada de P-EVA-01 (src/app/evaluacion/page.tsx)', () => {
    const evalContent = readFileSync('./src/app/evaluacion/page.tsx', 'utf8');
    assert.ok(evalContent.includes('cad.assessment_manual'), 'P-EVA-01 debe verificar cad.assessment_manual');
    assert.ok(evalContent.includes('Assessment Técnico'), 'P-EVA-01 debe incluir la cabecera y sección Assessment Técnico');
    assert.ok(evalContent.includes('HelpCircle'), 'P-EVA-01 debe incluir el botón ? para desplegar el resumen completo');
  });
});
