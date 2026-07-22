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
            return { value: 'mock-auth-token-pipeline-2' };
          }
        };
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

describe('Descubrimiento - Capa de Escritura de Pipeline - Etapa 2', () => {
  let crearPipelineAPI;
  let actualizarPipelineAPI;
  let eliminarPipelineAPI;

  before(async () => {
    // Import actions dynamically after patching require
    const module = await import('../src/actions/pipeline.ts');
    crearPipelineAPI = module.crearPipelineAPI;
    actualizarPipelineAPI = module.actualizarPipelineAPI;
    eliminarPipelineAPI = module.eliminarPipelineAPI;
  });

  test('crearPipelineAPI debería enviar correctamente id_busqueda e id_candidato al backend', async () => {
    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'http://localhost:8080/api/v1/pipeline');
      assert.strictEqual(options.method, 'POST');
      assert.strictEqual(options.headers['Authorization'], 'Bearer mock-auth-token-pipeline-2');
      assert.strictEqual(options.headers['Content-Type'], 'application/json');

      const body = JSON.parse(options.body);
      assert.strictEqual(body.id_busqueda, 'REQ-010');
      assert.strictEqual(body.id_candidato, 'C-500');

      return {
        status: 201,
        json: async () => ({
          status: 'success',
          data: {
            id: 'mock-new-pipe-id',
            claves_conexion: {
              id_busqueda: 'REQ-010',
              id_candidato: 'C-500'
            }
          }
        })
      };
    };

    const response = await crearPipelineAPI('REQ-010', 'C-500');
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.data.id, 'mock-new-pipe-id');
  });

  test('actualizarPipelineAPI debería enviar modificaciones dinámicas por ID', async () => {
    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'http://localhost:8080/api/v1/pipeline/pipe-edit-id');
      assert.strictEqual(options.method, 'PATCH');
      assert.strictEqual(options.headers['Authorization'], 'Bearer mock-auth-token-pipeline-2');
      assert.strictEqual(options.headers['Content-Type'], 'application/json');

      const body = JSON.parse(options.body);
      assert.strictEqual(body.estado_actual, '02 - Selección en Marcha');
      assert.deepStrictEqual(body.cierre, { motivo_rechazo: null, fecha_cierre: null });

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          data: {
            id: 'pipe-edit-id',
            flujo: {
              estado_actual: '02 - Selección en Marcha'
            }
          }
        })
      };
    };

    const response = await actualizarPipelineAPI('pipe-edit-id', {
      estado_actual: '02 - Selección en Marcha',
      cierre: { motivo_rechazo: null, fecha_cierre: null }
    });
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.flujo.estado_actual, '02 - Selección en Marcha');
  });

  test('eliminarPipelineAPI debería invocar el endpoint DELETE correspondiente', async () => {
    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'http://localhost:8080/api/v1/pipeline/pipe-delete-id');
      assert.strictEqual(options.method, 'DELETE');
      assert.strictEqual(options.headers['Authorization'], 'Bearer mock-auth-token-pipeline-2');

      return {
        status: 200,
        json: async () => ({
          status: 'success'
        })
      };
    };

    const response = await eliminarPipelineAPI('pipe-delete-id');
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.status, 200);
  });

  test('crearPipelineAPI debería retornar 400 si faltan parámetros', async () => {
    const response = await crearPipelineAPI('', 'C-500');
    assert.strictEqual(response.success, false);
    assert.strictEqual(response.status, 400);
  });

  test('actualizarPipelineAPI debería retornar 400 si falta el ID', async () => {
    const response = await actualizarPipelineAPI('', { estado_actual: '01_nuevo' });
    assert.strictEqual(response.success, false);
    assert.strictEqual(response.status, 400);
  });

  test('eliminarPipelineAPI debería retornar 400 si falta el ID', async () => {
    const response = await eliminarPipelineAPI('');
    assert.strictEqual(response.success, false);
    assert.strictEqual(response.status, 400);
  });
});
