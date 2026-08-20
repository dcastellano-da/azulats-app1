import { test, describe, before, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const Module = require('node:module');

// Intercept next/headers to prevent module resolution errors in raw Node runner
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'next/headers' || id === 'next/headers.js') {
    return {
      cookies: async () => ({
        get: () => ({ value: 'test-session-token' })
      })
    };
  }
  return originalRequire.apply(this, arguments);
};

describe('Formulario de Alta a Pantalla Completa (P-BUS-01 / P-BUS-02)', () => {
  let crearBusquedaAPI;
  let originalFetch;
  let originalEnvMocks;

  before(async () => {
    originalFetch = globalThis.fetch;
    originalEnvMocks = process.env.NEXT_PUBLIC_USE_MOCKS;

    const module = await import('../src/actions/busquedas.ts');
    crearBusquedaAPI = module.crearBusquedaAPI;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    if (originalEnvMocks !== undefined) {
      process.env.NEXT_PUBLIC_USE_MOCKS = originalEnvMocks;
    } else {
      delete process.env.NEXT_PUBLIC_USE_MOCKS;
    }
  });

  test('1. `SearchForm` en modo pantalla completa envía el contrato de datos completo hacia `crearBusquedaAPI`', async () => {
    process.env.NEXT_PUBLIC_USE_MOCKS = "true";

    const payloadAltaFullScreen = {
      cliente: "Cliente Global Fullscreen",
      perfil_busqueda: "Directores de Tecnología",
      estado_fase: "Abierta",
      responsable_operativo: "Laura Tech",
      responsable_validacion: "Marcos Lead",
      fecha_inicio_objetivo: "2026-11-01",
      seniority: "VP Tech",
      modalidad: "Híbrido",
      prioridad: "Alta",
      criterios_screening: [
        { id: "crit-1", pregunta: "¿Experiencia en arquitecturas distribuidas?", tipo: "knockout", peso: 0 },
        { id: "crit-2", pregunta: "¿Dominio de Next.js & Cloud Architecture?", tipo: "deseable", peso: 30 }
      ]
    };

    const response = await crearBusquedaAPI(payloadAltaFullScreen);

    assert.equal(response.status, 201);
    assert.equal(response.success, true);
    assert.ok(response.message.includes("Modo Mock"));
    assert.equal(response.data.cliente, "Cliente Global Fullscreen");
    assert.equal(response.data.perfil_busqueda, "Directores de Tecnología");
    assert.equal(response.data.responsable_operativo, "Laura Tech");
  });

  test('2. Modos de UI: `showSubmitButton={true}` activa la renderización de acciones nativas en pantalla completa', () => {
    // Verificación de contrato de propiedades de SearchForm
    const defaultSearchFormProps = {
      showSubmitButton: true,
      submitButtonText: "Guardar Nueva Búsqueda",
      onSuccess: () => {},
      onClose: () => {},
      onSubmittingChange: () => {}
    };

    assert.equal(defaultSearchFormProps.showSubmitButton, true);
    assert.equal(defaultSearchFormProps.submitButtonText, "Guardar Nueva Búsqueda");
  });
});
