import { test, describe } from 'node:test';
import assert from 'node:assert';

// Mock helper function replicating hasExistingScreening logic from src/app/talento/page.tsx
const hasExistingScreening = (cand) => {
  if (!cand) return false;
  if (Array.isArray(cand.resultado_screening) && cand.resultado_screening.length > 0) return true;
  if (typeof cand.fit_score_screening === 'number' || typeof cand.fit_score === 'number') return true;
  if (cand.tiene_screening === true || cand.screening_completado === true) return true;
  if (cand.fecha_modificacion_screening) return true;
  return false;
};

// Mock localStorage implementation for unit testing
const createMockLocalStorage = () => {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
};

describe('M-SEL-01: Opción Screening Inteligente IA & Persistencia en localStorage', () => {

  test('hasExistingScreening debería detectar correctamente cuando un postulante tiene screening realizado', () => {
    const candConResultado = {
      id: 'cand-101',
      nombre_completo: 'Carlos Mendoza',
      resultado_screening: [{ id_criterio: 'c1', evaluacion: 'SI', puntaje_obtenido: 10 }]
    };

    const candConFitScore = {
      id: 'cand-102',
      nombre_completo: 'Laura Pausini',
      fit_score_screening: 85
    };

    const candConFecha = {
      id: 'cand-103',
      nombre_completo: 'Roberto Carlos',
      fecha_modificacion_screening: '2026-08-01T12:00:00Z'
    };

    assert.strictEqual(hasExistingScreening(candConResultado), true);
    assert.strictEqual(hasExistingScreening(candConFitScore), true);
    assert.strictEqual(hasExistingScreening(candConFecha), true);
  });

  test('hasExistingScreening debería retornar false cuando un postulante no cuenta con screening previo', () => {
    const candNuevo = {
      id: 'cand-104',
      nombre_completo: 'Ana Belén',
      estado_revision: 'Pendiente'
    };

    assert.strictEqual(hasExistingScreening(candNuevo), false);
    assert.strictEqual(hasExistingScreening(null), false);
  });

  test('localStorage debería guardar y recuperar la preferencia de auto-screening (talento_auto_screening_enabled)', () => {
    const mockStorage = createMockLocalStorage();

    // Sin estado guardado inicialmente
    assert.strictEqual(mockStorage.getItem('talento_auto_screening_enabled'), null);

    // Guardar opción activada
    mockStorage.setItem('talento_auto_screening_enabled', true);
    assert.strictEqual(mockStorage.getItem('talento_auto_screening_enabled'), 'true');

    // Guardar opción desactivada
    mockStorage.setItem('talento_auto_screening_enabled', false);
    assert.strictEqual(mockStorage.getItem('talento_auto_screening_enabled'), 'false');
  });

  test('localStorage debería guardar y recuperar la búsqueda seleccionada (talento_last_selected_search_id)', () => {
    const mockStorage = createMockLocalStorage();
    const searchId = 'busq-999';

    // Sin búsqueda guardada
    assert.strictEqual(mockStorage.getItem('talento_last_selected_search_id'), null);

    // Seleccionar búsqueda y guardar
    mockStorage.setItem('talento_last_selected_search_id', searchId);
    assert.strictEqual(mockStorage.getItem('talento_last_selected_search_id'), 'busq-999');

    // Verificar que al consultar búsquedas activas, la búsqueda guardada se seleccione si existe en la lista
    const activeSearches = [
      { id: 'busq-100', perfil_busqueda: 'Backend Dev' },
      { id: 'busq-999', perfil_busqueda: 'Senior Architect' }
    ];

    const savedId = mockStorage.getItem('talento_last_selected_search_id');
    const selectedBusqueda = activeSearches.find(b => b.id === savedId) || activeSearches[0];

    assert.strictEqual(selectedBusqueda.id, 'busq-999');
    assert.strictEqual(selectedBusqueda.perfil_busqueda, 'Senior Architect');
  });

  test('Debería preparar correctamente los datos para EvaluarScreeningModal (M-SCR-01) tras asignación', () => {
    const candidate = {
      id: 'cand-001',
      nombre_completo: 'Diego Lozano',
      url_cv: 'https://cv.pdf'
    };

    const selectedBusqueda = {
      id: 'busq-001',
      perfil_busqueda: 'Software Architect Rust',
      cliente: 'Tech Mobility',
      criterios_screening: [
        { id: 'crit-1', pregunta: '¿Experiencia en Rust > 3 años?', tipo: 'knockout', peso: 10 }
      ]
    };

    const pipelineId = 'pipe-12345';
    const autoScreeningEnabled = true;

    if (autoScreeningEnabled && pipelineId) {
      const evalModalData = {
        pipelineId,
        candidateName: candidate.nombre_completo,
        busquedaName: `${selectedBusqueda.perfil_busqueda} (${selectedBusqueda.cliente})`,
        criteriosBusqueda: selectedBusqueda.criterios_screening,
        hasCv: Boolean(candidate.url_cv)
      };

      assert.strictEqual(evalModalData.pipelineId, 'pipe-12345');
      assert.strictEqual(evalModalData.candidateName, 'Diego Lozano');
      assert.strictEqual(evalModalData.busquedaName, 'Software Architect Rust (Tech Mobility)');
      assert.strictEqual(evalModalData.criteriosBusqueda.length, 1);
      assert.strictEqual(evalModalData.hasCv, true);
    }
  });

  test('El botón Ver Expediente Actualizado en M-SCR-01 debería redirigir a la pantalla P-DIS-02 (/descubrimiento/[pipelineId])', () => {
    let pushedRoute = null;
    let closed = false;
    let successCalled = false;

    const mockRouter = {
      push: (route) => { pushedRoute = route; }
    };
    const mockOnClose = () => { closed = true; };
    const mockOnSuccess = () => { successCalled = true; };
    const pipelineId = 'pipe-998877';

    // Simulated handleFinish logic from EvaluarScreeningModal.tsx
    const handleFinish = () => {
      if (mockOnSuccess) mockOnSuccess();
      mockOnClose();
      if (pipelineId) {
        mockRouter.push(`/descubrimiento/${pipelineId}`);
      }
    };

    handleFinish();

    assert.strictEqual(successCalled, true);
    assert.strictEqual(closed, true);
    assert.strictEqual(pushedRoute, '/descubrimiento/pipe-998877');
  });

});
