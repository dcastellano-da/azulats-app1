import { test, describe } from 'node:test';
import assert from 'node:assert';

// Mock helper function replicating hasExistingScreening logic for M-IMP-02
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

describe('M-IMP-02: Opción Screening Inteligente IA, Persistencia de Búsqueda y Redirección a P-DIS-02', () => {

  test('hasExistingScreening en M-IMP-02 debería detectar correctamente si el candidato ingestado posee screening', () => {
    const candConScreening = {
      id: 'cand-201',
      nombre_completo: 'Patricia Ramos',
      fit_score_screening: 92
    };

    const candSinScreening = {
      id: 'cand-202',
      nombre_completo: 'Esteban Quito',
      puesto: 'DevOps Specialist'
    };

    assert.strictEqual(hasExistingScreening(candConScreening), true);
    assert.strictEqual(hasExistingScreening(candSinScreening), false);
  });

  test('localStorage debería guardar y recuperar la opción descubrimiento_auto_screening_enabled en M-IMP-02', () => {
    const mockStorage = createMockLocalStorage();

    // Inicialmente nulo
    assert.strictEqual(mockStorage.getItem('descubrimiento_auto_screening_enabled'), null);

    // Guardar opción true
    mockStorage.setItem('descubrimiento_auto_screening_enabled', true);
    assert.strictEqual(mockStorage.getItem('descubrimiento_auto_screening_enabled'), 'true');

    // Guardar opción false
    mockStorage.setItem('descubrimiento_auto_screening_enabled', false);
    assert.strictEqual(mockStorage.getItem('descubrimiento_auto_screening_enabled'), 'false');
  });

  test('localStorage debería guardar y recuperar la búsqueda seleccionada descubrimiento_last_selected_search_id', () => {
    const mockStorage = createMockLocalStorage();
    const searchId = 'search-777';

    // Inicialmente nulo
    assert.strictEqual(mockStorage.getItem('descubrimiento_last_selected_search_id'), null);

    // Guardar ID de búsqueda activa elegida
    mockStorage.setItem('descubrimiento_last_selected_search_id', searchId);
    assert.strictEqual(mockStorage.getItem('descubrimiento_last_selected_search_id'), 'search-777');

    const searchesList = [
      { id: 'search-100', role: 'UX Designer', client: 'Fintech Corp' },
      { id: 'search-777', role: 'Lead Architect', client: 'Automotive AI' }
    ];

    const restoredId = mockStorage.getItem('descubrimiento_last_selected_search_id');
    const selected = searchesList.find(s => s.id === restoredId) || searchesList[0];

    assert.strictEqual(selected.id, 'search-777');
    assert.strictEqual(selected.role, 'Lead Architect');
  });

  test('M-IMP-02: Al finalizar con screening inactivo debería redirigir incondicionalmente a P-DIS-02 (/descubrimiento/[createdPipelineId])', () => {
    let pushedRoute = null;
    let closed = false;
    const mockRouter = {
      push: (route) => { pushedRoute = route; }
    };
    const mockOnClose = () => { closed = true; };
    
    const autoScreeningEnabled = false;
    const createdPipelineId = 'pipe-created-5544';

    // Simulated handleFinish logic when autoScreeningEnabled === false
    const handleFinish = () => {
      if (autoScreeningEnabled && createdPipelineId) {
        return;
      }
      mockOnClose();
      if (createdPipelineId) {
        mockRouter.push(`/descubrimiento/${createdPipelineId}`);
      }
    };

    handleFinish();

    assert.strictEqual(closed, true);
    assert.strictEqual(pushedRoute, '/descubrimiento/pipe-created-5544');
  });

  test('M-IMP-02: Al finalizar con screening activo debería recuperar criterios de screening (con fallback a API si no vienen en props) y abrir M-SCR-01', async () => {
    let evalModalOpened = false;
    let evalModalProps = null;

    const autoScreeningEnabled = true;
    const createdPipelineId = 'pipe-created-9988';
    const selectedSearchId = 'busqueda-ios-01';
    const candidateName = 'Alex Cedano';

    // Simulated searches list missing criterios_screening
    const searchesProps = [
      { id: 'busqueda-ios-01', role: 'Desarrollador IOS Nativo', client: 'CLIENTE PRUEBA' }
    ];

    // Simulated backend search with criterios_screening
    const mockApiSearches = [
      {
        id: 'busqueda-ios-01',
        perfil_busqueda: 'Desarrollador IOS Nativo',
        cliente: 'CLIENTE PRUEBA',
        criterios_screening: [
          { id: 'c1', pregunta: '¿Tiene al menos 3 años desarrollando en Swift / iOS nativo?', peso: 50, es_knockout: true }
        ]
      }
    ];

    const handleFinish = async () => {
      if (autoScreeningEnabled && createdPipelineId) {
        const activeSearchObj = searchesProps.find(s => s.id === selectedSearchId);
        let searchCriterios = activeSearchObj?.criterios_screening;

        if (!searchCriterios || searchCriterios.length === 0) {
          const matchBusq = mockApiSearches.find(b => b.id === selectedSearchId);
          if (matchBusq?.criterios_screening) {
            searchCriterios = matchBusq.criterios_screening;
          }
        }

        evalModalOpened = true;
        evalModalProps = {
          pipelineId: createdPipelineId,
          candidateName,
          criteriosBusqueda: searchCriterios || []
        };
      }
    };

    await handleFinish();

    assert.strictEqual(evalModalOpened, true);
    assert.strictEqual(evalModalProps.criteriosBusqueda.length, 1);
    assert.strictEqual(evalModalProps.criteriosBusqueda[0].id, 'c1');
    assert.strictEqual(evalModalProps.criteriosBusqueda[0].es_knockout, true);
  });

});
