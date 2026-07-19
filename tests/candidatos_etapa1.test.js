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
            return { value: 'mock-auth-token-stage-1' };
          }
        };
      }
    };
  }
  return originalRequire.apply(this, arguments);
};

describe('Postulantes - Integración de Campos - Etapa 1 (Lectura)', () => {
  let getCandidatosAPI;

  before(async () => {
    // Import action dynamically after patching require
    const module = await import('../src/actions/candidatos.ts');
    getCandidatosAPI = module.getCandidatosAPI;
  });

  test('Debería retornar candidatos mapeados incluyendo los 6 campos adicionales cuando el backend los provee', async () => {
    global.fetch = async (url, options) => {
      const authHeader = options.headers['Authorization'];
      assert.strictEqual(authHeader, 'Bearer mock-auth-token-stage-1');
      assert.strictEqual(url, 'http://localhost:8080/api/v1/candidatos');

      return {
        status: 200,
        json: async () => ({
          status: 'success',
          data: [
            {
              id: 'candidato-full-fields',
              nombre_completo: 'Laura Rodríguez',
              email: 'laura@company.com',
              linkedin_url: 'https://linkedin.com/in/laurarodriguez',
              puesto_postulacion: 'Líder UI/UX',
              origen: 'Manual',
              acepta_privacidad: true,
              estado_revision: 'seleccionado',
              url_cv: 'gs://azul-ats-cv/laura.pdf',
              createdAt: '2026-07-20T00:10:00.000Z',
              telefono_movil: '+5491122334455',
              ubicacion: 'Buenos Aires, Argentina',
              skills_principales: 'Figma, React, CSS Grid, Design Systems',
              nivel_ingles: 'Avanzado (C1)',
              otros_idiomas: 'Portugués (Intermedio)',
              notas_iniciales: 'Excelente perfil para liderar el equipo de diseño.'
            }
          ]
        })
      };
    };

    const response = await getCandidatosAPI();
    assert.strictEqual(response.success, true);
    assert.strictEqual(response.data.length, 1);

    const cand = response.data[0];
    assert.strictEqual(cand.id, 'candidato-full-fields');
    assert.strictEqual(cand.nombre_completo, 'Laura Rodríguez');
    assert.strictEqual(cand.telefono_movil, '+5491122334455');
    assert.strictEqual(cand.ubicacion, 'Buenos Aires, Argentina');
    assert.strictEqual(cand.skills_principales, 'Figma, React, CSS Grid, Design Systems');
    assert.strictEqual(cand.nivel_ingles, 'Avanzado (C1)');
    assert.strictEqual(cand.otros_idiomas, 'Portugués (Intermedio)');
    assert.strictEqual(cand.notas_iniciales, 'Excelente perfil para liderar el equipo de diseño.');
  });

  test('Debería mapear valores vacíos por defecto cuando los nuevos campos son nulos o vacíos en el backend', async () => {
    global.fetch = async (url, options) => {
      return {
        status: 200,
        json: async () => ({
          status: 'success',
          data: [
            {
              id: 'candidato-null-fields',
              nombre_completo: 'Juan Pérez',
              email: 'juan@perez.com',
              puesto_postulacion: 'Desarrollador Junior',
              url_cv: 'gs://azul-ats-cv/juan.pdf',
              createdAt: '2026-07-20T00:15:00.000Z',
              telefono_movil: null,
              ubicacion: null,
              skills_principales: null,
              nivel_ingles: null,
              otros_idiomas: null,
              notas_iniciales: null
            }
          ]
        })
      };
    };

    const response = await getCandidatosAPI();
    assert.strictEqual(response.success, true);

    const cand = response.data[0];
    assert.strictEqual(cand.telefono_movil, '');
    assert.strictEqual(cand.ubicacion, '');
    assert.strictEqual(cand.skills_principales, '');
    assert.strictEqual(cand.nivel_ingles, '');
    assert.strictEqual(cand.otros_idiomas, '');
    assert.strictEqual(cand.notas_iniciales, '');
  });
});
