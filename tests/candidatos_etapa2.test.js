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
            return { value: 'mock-auth-token-stage-2' };
          }
        };
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

describe('Postulantes - Integración de Campos - Etapa 2 (Escritura y Validación)', () => {
  let crearCandidatoAPI;
  let actualizarCandidatoAPI;

  before(async () => {
    // Import actions dynamically after patching require
    const module = await import('../src/actions/candidatos.ts');
    crearCandidatoAPI = module.crearCandidatoAPI;
    actualizarCandidatoAPI = module.actualizarCandidatoAPI;
  });

  test('crearCandidatoAPI debería enviar correctamente todos los nuevos campos al backend', async () => {
    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'http://localhost:8080/api/v1/candidatos');
      assert.strictEqual(options.method, 'POST');
      assert.strictEqual(options.headers['Authorization'], 'Bearer mock-auth-token-stage-2');

      const body = options.body;
      assert.ok(body instanceof FormData);
      assert.strictEqual(body.get('nombre_completo'), 'Ana Smith');
      assert.strictEqual(body.get('email'), 'ana.smith@example.com');
      assert.strictEqual(body.get('telefono_movil'), '+34600112233');
      assert.strictEqual(body.get('ubicacion'), 'Madrid, España');
      assert.strictEqual(body.get('skills_principales'), 'React, TypeScript, CSS');
      assert.strictEqual(body.get('nivel_ingles'), 'C1');
      assert.strictEqual(body.get('otros_idiomas'), 'Alemán');
      assert.strictEqual(body.get('notas_iniciales'), 'Notas de reclutamiento.');

      return {
        status: 201,
        json: async () => ({
          status: 'success',
          data: {
            id: 'mock-new-cand-id',
            url_cv: 'gs://azul-ats-cv/cv_ana.pdf'
          }
        })
      };
    };

    const mockFormData = new FormData();
    mockFormData.append('nombre_completo', 'Ana Smith');
    mockFormData.append('email', 'ana.smith@example.com');
    mockFormData.append('puesto', 'React Dev');
    // Using a blob helper for FormData node environment
    mockFormData.append('cv', new Blob(['fake-cv'], { type: 'application/pdf' }), 'cv_ana.pdf');
    mockFormData.append('acepta_privacidad', 'true');
    mockFormData.append('telefono_movil', '+34600112233');
    mockFormData.append('ubicacion', 'Madrid, España');
    mockFormData.append('skills_principales', 'React, TypeScript, CSS');
    mockFormData.append('nivel_ingles', 'C1');
    mockFormData.append('otros_idiomas', 'Alemán');
    mockFormData.append('notas_iniciales', 'Notas de reclutamiento.');

    const response = await crearCandidatoAPI(mockFormData);
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.status, 201);
    assert.strictEqual(response.data.id, 'mock-new-cand-id');
    assert.strictEqual(response.data.telefono_movil, '+34600112233');
    assert.strictEqual(response.data.skills_principales, 'React, TypeScript, CSS');
  });

  test('actualizarCandidatoAPI debería actualizar los campos mutables opcionales correspondientes', async () => {
    global.fetch = async (url, options) => {
      assert.strictEqual(url, 'http://localhost:8080/api/v1/candidatos/candidato-edit-id');
      assert.strictEqual(options.method, 'PATCH');
      assert.strictEqual(options.headers['Content-Type'], 'application/json');

      const body = JSON.parse(options.body);
      assert.strictEqual(body.telefono_movil, '+5491199887766');
      assert.strictEqual(body.skills_principales, 'Figma, Tailwind, Next.js');
      assert.strictEqual(body.nivel_ingles, 'B2');
      assert.strictEqual(body.notas_iniciales, 'Anotaciones actualizadas.');

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          data: {
            updatedAt: '2026-07-20T01:00:00.000Z'
          }
        })
      };
    };

    const updatePayload = {
      telefono_movil: '+5491199887766',
      skills_principales: 'Figma, Tailwind, Next.js',
      nivel_ingles: 'B2',
      notas_iniciales: 'Anotaciones actualizadas.'
    };

    const response = await actualizarCandidatoAPI('candidato-edit-id', updatePayload);
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.status, 200);
    assert.strictEqual(response.data.telefono_movil, '+5491199887766');
  });

  test('actualizarCandidatoAPI debería rechazar intentos de modificar metadatos inmutables', async () => {
    const invalidPayload = {
      createdAt: '2026-01-01T00:00:00.000Z'
    };

    const response = await actualizarCandidatoAPI('candidato-edit-id', invalidPayload);
    assert.strictEqual(response.success, false);
    assert.strictEqual(response.status, 400);
    assert.ok(response.message.includes('Acceso denegado'));
  });
});
