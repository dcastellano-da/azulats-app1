import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
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
          get: (_name) => {
            return { value: 'mock-auth-token-pipeline-3' };
          }
        };
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

describe('Descubrimiento - Detalle & Sincronización IA - Etapa 3', () => {
  let getCandidatosAPI;
  let actualizarCandidatoAPI;
  let actualizarPipelineAPI;

  before(async () => {
    const candidatosModule = await import('../src/actions/candidatos.ts');
    getCandidatosAPI = candidatosModule.getCandidatosAPI;
    actualizarCandidatoAPI = candidatosModule.actualizarCandidatoAPI;

    const pipelineModule = await import('../src/actions/pipeline.ts');
    actualizarPipelineAPI = pipelineModule.actualizarPipelineAPI;
  });

  test('getCandidatosAPI debería recuperar correctamente la lista de candidatos', async () => {
    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'http://localhost:8080/api/v1/candidatos');
      assert.strictEqual(options.method, 'GET');
      assert.strictEqual(options.headers['Authorization'], 'Bearer mock-auth-token-pipeline-3');

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          data: [
            {
              id: 'cand-001',
              nombre_completo: 'Carlos Sourcing',
              puesto_postulacion: 'Recruiter IT'
            }
          ]
        })
      };
    };

    const res = await getCandidatosAPI();
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data[0].id, 'cand-001');
    assert.strictEqual(res.data[0].nombre_completo, 'Carlos Sourcing');
  });

  test('actualizarCandidatoAPI debería enviar PATCH con campos modificables al backend', async () => {
    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'http://localhost:8080/api/v1/candidatos/cand-001');
      assert.strictEqual(options.method, 'PATCH');
      assert.strictEqual(options.headers['Authorization'], 'Bearer mock-auth-token-pipeline-3');
      assert.strictEqual(options.headers['Content-Type'], 'application/json');

      const body = JSON.parse(options.body);
      assert.strictEqual(body.nombre_completo, 'Carlos Sourcing Modernizado');
      assert.strictEqual(body.linkedin_url, 'https://linkedin.com/in/carlossourcing');

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          data: {
            id: 'cand-001',
            nombre_completo: 'Carlos Sourcing Modernizado',
            linkedin_url: 'https://linkedin.com/in/carlossourcing'
          }
        })
      };
    };

    const res = await actualizarCandidatoAPI('cand-001', {
      nombre_completo: 'Carlos Sourcing Modernizado',
      linkedin_url: 'https://linkedin.com/in/carlossourcing'
    });
    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 200);
  });

  test('actualizarCandidatoAPI debería prevenir la mutación de campos prohibidos', async () => {
    // ID y Consentimiento no deben modificarse conforme a la Mutability Matrix
    const res = await actualizarCandidatoAPI('cand-001', {
      id: 'cand-hack',
      nombre_completo: 'Intruso'
    });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.status, 400);
    assert.match(res.message, /Acceso denegado/i);
  });

  test('actualizarPipelineAPI debería guardar fisicamente el Match Semántico de Gemini AI', async () => {
    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'http://localhost:8080/api/v1/pipeline/pipe-001');
      assert.strictEqual(options.method, 'PATCH');
      assert.strictEqual(options.headers['Authorization'], 'Bearer mock-auth-token-pipeline-3');

      const body = JSON.parse(options.body);
      assert.strictEqual(body.f1_descubrimiento.analisis_semantico.fit_score, 88);
      assert.strictEqual(body.f1_descubrimiento.analisis_semantico.origen, 'Gemini AI');
      assert.deepStrictEqual(body.f1_descubrimiento.analisis_semantico.fortalezas, ['Conocimientos en React', 'Buena comunicación']);

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          data: body
        })
      };
    };

    const res = await actualizarPipelineAPI('pipe-001', {
      f1_descubrimiento: {
        analisis_semantico: {
          origen: 'Gemini AI',
          fit_score: 88,
          fortalezas: ['Conocimientos en React', 'Buena comunicación'],
          debilidades: ['Falta Certificación AWS'],
          recomendaciones: 'Proceder a videollamada'
        }
      }
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.f1_descubrimiento.analisis_semantico.fit_score, 88);
  });

  test('actualizarPipelineAPI debería guardar el outreach personalizado en el backend', async () => {
    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'http://localhost:8080/api/v1/pipeline/pipe-002');
      assert.strictEqual(options.method, 'PATCH');

      const body = JSON.parse(options.body);
      assert.strictEqual(body.f1_descubrimiento.outreach.variante_enviada, 'B');
      assert.strictEqual(body.f1_descubrimiento.outreach_custom.customOutreachB, 'Mensaje personalizado por AI para canal rápido');

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          data: body
        })
      };
    };

    const res = await actualizarPipelineAPI('pipe-002', {
      f1_descubrimiento: {
        outreach: {
          variante_enviada: 'B',
          fecha_envio: '2026-07-22T12:00:00Z'
        },
        outreach_custom: {
          customOutreachA: 'Hola, saludos formales.',
          customOutreachB: 'Mensaje personalizado por AI para canal rápido'
        }
      }
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.data.f1_descubrimiento.outreach.variante_enviada, 'B');
  });
});
