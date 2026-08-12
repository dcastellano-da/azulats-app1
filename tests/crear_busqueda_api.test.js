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

describe('Creación de Búsquedas API (Server Action crearBusquedaAPI)', () => {
  let crearBusquedaAPI;
  let originalFetch;
  let originalEnvMocks;
  let originalEnvUrl;
  let originalAtsUrl;

  before(async () => {
    originalFetch = globalThis.fetch;
    originalEnvMocks = process.env.NEXT_PUBLIC_USE_MOCKS;
    originalEnvUrl = process.env.NEXT_PUBLIC_API_URL;
    originalAtsUrl = process.env.NEXT_PUBLIC_ATS_API_URL;

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
    if (originalEnvUrl !== undefined) {
      process.env.NEXT_PUBLIC_API_URL = originalEnvUrl;
    } else {
      delete process.env.NEXT_PUBLIC_API_URL;
    }
    if (originalAtsUrl !== undefined) {
      process.env.NEXT_PUBLIC_ATS_API_URL = originalAtsUrl;
    } else {
      delete process.env.NEXT_PUBLIC_ATS_API_URL;
    }
  });

  test('a) Con NEXT_PUBLIC_USE_MOCKS="true", retorna datos estáticos mock sin llamar a la red', async () => {
    process.env.NEXT_PUBLIC_USE_MOCKS = "true";

    let fetchCalled = false;
    globalThis.fetch = async () => {
      fetchCalled = true;
      throw new Error("fetch no debe invocarse cuando NEXT_PUBLIC_USE_MOCKS es true");
    };

    const mockPayload = {
      cliente: "Empresa Test Mocks S.A.",
      perfil_busqueda: "Staff Engineer Mocks",
      estado_fase: "Abierta",
      responsable_operativo: "Ana Tester",
      responsable_validacion: "Carlos Reviewer",
      fecha_inicio_objetivo: "2026-09-01",
      seniority: "Senior",
      modalidad: "Remoto"
    };

    const res = await crearBusquedaAPI(mockPayload);

    assert.equal(fetchCalled, false, "Network fetch should not be called when mocks flag is true");
    assert.equal(res.status, 201);
    assert.equal(res.success, true);
    assert.ok(res.message.includes("Modo Mock"));
    assert.equal(res.data.cliente, "Empresa Test Mocks S.A.");
    assert.equal(res.data.perfil_busqueda, "Staff Engineer Mocks");
  });

  test('b) Con NEXT_PUBLIC_USE_MOCKS inactivo, realiza la petición HTTP POST a Cloud Run (NEXT_PUBLIC_ATS_API_URL) con payload correcto', async () => {
    delete process.env.NEXT_PUBLIC_USE_MOCKS;
    const testCloudRunUrl = "https://backend-cloudrun-test.a.run.app";
    process.env.NEXT_PUBLIC_ATS_API_URL = testCloudRunUrl;

    let capturedUrl = "";
    let capturedOptions = null;

    globalThis.fetch = async (url, options) => {
      capturedUrl = url;
      capturedOptions = options;
      return {
        status: 201,
        json: async () => ({
          status: "success",
          message: "Búsqueda creada exitosamente en Cloud Run",
          data: { id: "REQ-CLOUDRUN-001" }
        })
      };
    };

    const realPayload = {
      cliente: "Cloud Run Client",
      perfil_busqueda: "Frontend Architect",
      estado_fase: "evaluacion_tecnica",
      responsable_operativo: "Daniel C.",
      responsable_validacion: "Elena P.",
      fecha_inicio_objetivo: "2026-10-01",
      seniority: "Lead",
      skills_excluyentes: ["Next.js", "TypeScript"],
      skills_deseables: ["TailwindCSS"],
      nivel_ingles_req: "C1",
      modalidad: "Remoto",
      presupuesto_max: "70.000€",
      prioridad: "Alta",
      link_job_description: "https://example.com/jd"
    };

    const res = await crearBusquedaAPI(realPayload);

    assert.equal(capturedUrl, `${testCloudRunUrl}/api/v1/busquedas`);
    assert.equal(capturedOptions.method, "POST");
    assert.equal(capturedOptions.headers["Content-Type"], "application/json");
    assert.equal(capturedOptions.headers["Authorization"], "Bearer mock-token-recruiter");

    const parsedBody = JSON.parse(capturedOptions.body);
    assert.equal(parsedBody.identificacion.cliente, "Cloud Run Client");
    assert.equal(parsedBody.identificacion.hiring_manager, "Daniel C.");
    assert.equal(parsedBody.perfil_tecnico.rol_solicitado, "Frontend Architect");
    assert.equal(parsedBody.perfil_tecnico.seniority, "Lead");
    assert.deepEqual(parsedBody.perfil_tecnico.skills_excluyentes, ["Next.js", "TypeScript"]);

    assert.equal(res.status, 201);
    assert.equal(res.success, true);
  });
});
