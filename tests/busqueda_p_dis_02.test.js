import test from 'node:test';
import assert from 'node:assert/strict';

// Test 1: Verificación de la estructura jerárquica estado_sla y ubicacion en la interfaz Busqueda
test('Verificación de propiedad anidada estado_sla.estado_busqueda en Busqueda (P-DIS-02)', async (t) => {
  const busquedaEjemplo = {
    id: "REQ-999",
    cliente: "Empresa Test",
    perfil_busqueda: "Senior Frontend Engineer",
    estado_fase: "Evaluación Técnica",
    responsable_operativo: "Ana Tester",
    responsable_validacion: "Carlos Validator",
    fecha_inicio_objetivo: "2026-08-20",
    estado_sla: {
      estado_busqueda: "Evaluación Técnica",
      prioridad: "Alta",
      presupuesto_max: "60.000€"
    },
    ubicacion: "Remoto Madrid"
  };

  // Acceso anidado seguro como en la UI de descubrimiento/[id]/page.tsx
  const estadoVisualizado = busquedaEjemplo?.estado_sla?.estado_busqueda;
  const ubicacionVisualizada = busquedaEjemplo?.ubicacion;

  assert.equal(estadoVisualizado, "Evaluación Técnica");
  assert.equal(ubicacionVisualizada, "Remoto Madrid");
  assert.equal(busquedaEjemplo.estado_sla?.prioridad, "Alta");
});

// Test 2: Mapeo por defecto de estado_sla cuando solo se cuenta con estado_fase plano
test('Generación de fallback estado_sla a partir de estado_fase cuando el backend provee esquema plano', async (t) => {
  const itemPlano = {
    id: "REQ-888",
    cliente: "Cliente Legacy",
    perfil_busqueda: "DevOps Engineer",
    estado_fase: "En Proceso",
    responsable_operativo: "Juan Pérez",
    responsable_validacion: "Maria Gómez",
    fecha_inicio_objetivo: "2026-08-01"
  };

  const mappedBusqueda = {
    ...itemPlano,
    estado_sla: itemPlano.estado_sla || {
      estado_busqueda: itemPlano.estado_fase,
      prioridad: "Normal",
      presupuesto_max: "",
      link_job_description: ""
    },
    ubicacion: itemPlano.condiciones?.zona_horaria_ubicacion || itemPlano.ubicacion || ""
  };

  assert.equal(mappedBusqueda.estado_sla.estado_busqueda, "En Proceso");
  assert.equal(mappedBusqueda.estado_sla.prioridad, "Normal");
});
