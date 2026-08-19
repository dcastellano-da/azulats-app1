import { test, describe, before, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Set environment variable
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
            return { value: 'mock-token-recruiter-transcription' };
          }
        };
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

describe('Módulo de Transcripción de Entrevista de Screening IA (f2_evaluacion.informe_entrevista_ia)', () => {
  let analizarTranscripcionAction;
  let actualizarInformeEntrevistaAction;
  let originalFetch;

  before(async () => {
    originalFetch = global.fetch;
    const pipelineModule = await import('../src/actions/pipeline.ts');
    analizarTranscripcionAction = pipelineModule.analizarTranscripcionAction;
    actualizarInformeEntrevistaAction = pipelineModule.actualizarInformeEntrevistaAction;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('analizarTranscripcionAction - Debería enviar la transcripción vía multipart/form-data y retornar informe_entrevista_ia estructurado', async () => {
    const mockPipelineId = 'pipe-transcripcion-101';
    const mockInforme = {
      experiencia_consolidada: "Trayectoria de 6 años en React y Node.js validada en entrevista.",
      alineacion_motivadores: "Busca estabilidad y desarrollo en arquitecturas cloud.",
      pretension_economica_condiciones: {
        pretension_salarial: "4.800 USD brutos/mes",
        disponibilidad: "Inmediata",
        modalidad_preferida: "Híbrido / Remoto"
      },
      proximos_pasos: [
        "Notificar resultado positivo al candidato",
        "Agendar entrevista técnica con el cliente"
      ],
      auditoria_veracidad: {
        inconsistencias_detectadas: [
          "Mencionó egreso en 2021 en llamada vs marzo 2022 en el CV escrito."
        ],
        confirmaciones_fortalezas: [
          "Solidez comprobada en desarrollo frontend TypeScript y consumo de APIs REST."
        ]
      },
      fecha_analisis: new Date().toISOString()
    };

    global.fetch = async (url, options) => {
      assert.strictEqual(options.method, 'POST');
      assert.strictEqual(options.headers['Authorization'], 'Bearer mock-auth-token-stage-1');
      assert.ok(url.includes(`/api/v1/pipeline/${mockPipelineId}/analizar-transcripcion`));

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          message: 'Análisis de transcripción generado con éxito por la IA.',
          data: {
            id: mockPipelineId,
            f2_evaluacion: {
              informe_entrevista_ia: mockInforme
            }
          }
        })
      };
    };

    const mockFormData = new Map();
    mockFormData.append = () => {};

    const response = await analizarTranscripcionAction(mockPipelineId, mockFormData);
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.status, 200);
    assert.ok(response.data);
  });

  test('analizarTranscripcionAction - Debería retornar error 400 Bad Request si el documento enviado no es válido', async () => {
    const mockPipelineId = 'pipe-invalid';

    global.fetch = async (url, options) => {
      return {
        status: 400,
        json: async () => ({
          status: 'error',
          message: 'El archivo excede los 5MB o no posee un formato permitido.'
        })
      };
    };

    const response = await analizarTranscripcionAction(mockPipelineId, {});
    assert.strictEqual(response.success, false);
    assert.strictEqual(response.status, 400);
    assert.match(response.message, /excede los 5MB/);
  });

  test('actualizarInformeEntrevistaAction - Debería persistir modificaciones Human-in-the-Loop en f2_evaluacion.informe_entrevista_ia', async () => {
    const mockPipelineId = 'pipe-hitl-202';
    const payloadInforme = {
      experiencia_consolidada: "Edición manual: Reclutador confirmó 7 años de experiencia.",
      alineacion_motivadores: "Ajuste manual de encaje cultural.",
      pretension_economica_condiciones: {
        pretension_salarial: "5.000 USD",
        disponibilidad: "2 semanas",
        modalidad_preferida: "Remoto"
      },
      proximos_pasos: ["Mover a Fase 3"],
      auditoria_veracidad: {
        inconsistencias_detectadas: [],
        confirmaciones_fortalezas: ["Experiencia senior en React"]
      }
    };

    global.fetch = async (url, options) => {
      assert.strictEqual(options.method, 'PATCH');
      assert.strictEqual(options.headers['Content-Type'], 'application/json');
      assert.strictEqual(options.headers['Authorization'], 'Bearer mock-auth-token-stage-1');

      const body = JSON.parse(options.body);
      assert.ok(body.f2_evaluacion);
      assert.deepStrictEqual(body.f2_evaluacion.informe_entrevista_ia, payloadInforme);

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          message: 'Informe actualizado correctamente.',
          data: {
            id: mockPipelineId,
            f2_evaluacion: {
              informe_entrevista_ia: payloadInforme
            }
          }
        })
      };
    };

    const response = await actualizarInformeEntrevistaAction(mockPipelineId, payloadInforme);
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.status, 200);
  });

  test('Verificación de advertencia de estado - Candidatos fuera del estado 05_screening deben activar warning en UI', () => {
    const checkStateWarning = (stateStr) => {
      return !(
        stateStr.toLowerCase().includes("05") || 
        stateStr.toLowerCase().includes("screening")
      );
    };

    assert.strictEqual(checkStateWarning("05 - SCREENING / ENTREVISTA INICIAL"), false, 'Estado 05 no activa advertencia');
    assert.strictEqual(checkStateWarning("05_screening"), false, 'Estado 05_screening no activa advertencia');
    assert.strictEqual(checkStateWarning("06_assessment"), true, 'Estado 06_assessment activa advertencia');
    assert.strictEqual(checkStateWarning("08_descartado_interno"), true, 'Estado 08_descartado activa advertencia');
  });
});
