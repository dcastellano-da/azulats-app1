import { test, describe, before } from 'node:test';
import assert from 'node:assert';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

// Set environment variables before module loader
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
            return { value: 'mock-auth-token-pipeline-1' };
          }
        };
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

describe('Descubrimiento - Capa de Lectura de Pipeline - Etapa 1', () => {
  let getPipelineAPI;

  before(async () => {
    // Import action dynamically after patching require
    const module = await import('../src/actions/pipeline.ts');
    getPipelineAPI = module.getPipelineAPI;
  });

  test('Debería retornar los items del pipeline asociados a un id_busqueda con autorregulación y autenticación correcta', async () => {
    global.fetch = async (url, options) => {
      const authHeader = options.headers['Authorization'];
      assert.strictEqual(authHeader, 'Bearer mock-auth-token-pipeline-1');
      assert.strictEqual(url, 'http://localhost:8080/api/v1/pipeline?id_busqueda=REQ-001');

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          total: 2,
          data: [
            {
              id: 'pipe-item-1',
              claves_conexion: {
                id_busqueda: 'REQ-001',
                id_candidato: 'C-301'
              },
              flujo: {
                estado_actual: '01 - Nuevo (Para Revisión)',
                fecha_ultimo_cambio: '2026-07-20T00:10:00.000Z',
                historial_estados: [
                  { estado: '01 - Nuevo (Para Revisión)', timestamp: '2026-07-20T00:10:00.000Z' }
                ]
              },
              f1_descubrimiento: {
                analisis_semantico: {
                  fit_score: 95,
                  fortalezas: ['TypeScript', 'Rust'],
                  debilidades: ['No cloud experience'],
                  recomendaciones: 'Avanzar'
                },
                outreach: {
                  variante_enviada: 'A',
                  fecha_envio: '2026-07-21T00:10:00.000Z'
                }
              },
              createdAt: '2026-07-20T00:10:00.000Z',
              updatedAt: '2026-07-21T00:10:00.000Z'
            }
          ]
        })
      };
    };

    const response = await getPipelineAPI('REQ-001');
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.data.length, 1);

    const item = response.data[0];
    assert.strictEqual(item.id, 'pipe-item-1');
    assert.strictEqual(item.claves_conexion.id_busqueda, 'REQ-001');
    assert.strictEqual(item.claves_conexion.id_candidato, 'C-301');
    assert.strictEqual(item.flujo.estado_actual, '01 - Nuevo (Para Revisión)');
    assert.strictEqual(item.f1_descubrimiento.analisis_semantico.fit_score, 95);
  });

  test('Debería retornar un error 400 Bad Request si el id_busqueda no es provisto', async () => {
    const response = await getPipelineAPI('');
    assert.strictEqual(response.success, false);
    assert.strictEqual(response.status, 400);
    assert.match(response.message, /El identificador de búsqueda/);
  });

  test('Debería manejar correctamente las respuestas de error del backend (por ejemplo, error 500)', async () => {
    global.fetch = async (url, options) => {
      return {
        status: 500,
        json: async () => ({
          status: 'error',
          message: 'Error interno de base de datos'
        })
      };
    };

    const response = await getPipelineAPI('REQ-001');
    assert.strictEqual(response.success, false);
    assert.strictEqual(response.status, 500);
    assert.match(response.message, /Error interno/);
  });
});
