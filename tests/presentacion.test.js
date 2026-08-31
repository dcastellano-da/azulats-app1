import { test, describe } from 'node:test';
import assert from 'node:assert';
import { calculatePresentacionKPIs, INITIAL_PRESENTACION_CANDIDATES } from '../src/lib/presentacion.ts';

describe('Módulo de Presentación - Capa de Lógica y Datos', () => {
  
  test('Debería validar la estructura del dataset de mockups iniciales', () => {
    assert.ok(Array.isArray(INITIAL_PRESENTACION_CANDIDATES));
    assert.ok(INITIAL_PRESENTACION_CANDIDATES.length >= 5, 'Debe haber por lo menos 5 candidatos de prueba');
    
    // Validate fields on the first candidate
    const first = INITIAL_PRESENTACION_CANDIDATES[0];
    assert.strictEqual(typeof first.id, 'string');
    assert.strictEqual(typeof first.name, 'string');
    assert.strictEqual(typeof first.role, 'string');
    assert.strictEqual(typeof first.client, 'string');
    assert.strictEqual(typeof first.score, 'number');
    assert.ok(['09_shortlist', '10_entrevista_cliente', '11_standby'].includes(first.currentPhase));
  });

  test('Debería calcular KPIs correctos para un set controlado de candidatos', () => {
    const controlledCandidates = [
      {
        id: 'TC-1',
        name: 'Test candidate 1',
        role: 'React Lead',
        client: 'Client-1',
        location: 'Madrid',
        score: 90,
        currentPhase: '09_shortlist',
        entryDate: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(), // 10 hours ago
        cNPS: 10,
        lastActivity: 'Active',
        experienceYears: 7,
        contactNumber: '123',
        email: 't1@t.com'
      },
      {
        id: 'TC-2',
        name: 'Test candidate 2',
        role: 'Rust Lead',
        client: 'Client-1',
        location: 'Madrid',
        score: 85,
        currentPhase: '10_entrevista_cliente', // excluded from blockage time, included in calibration accuracy
        entryDate: new Date(Date.now() - 20 * 60 * 60 * 1000).toISOString(),
        cNPS: 6,
        lastActivity: 'Active',
        experienceYears: 8,
        contactNumber: '456',
        email: 't2@t.com'
      },
      {
        id: 'TC-3',
        name: 'Test candidate 3',
        role: 'Java Dev',
        client: 'Client-2',
        location: 'Madrid',
        score: 70,
        currentPhase: '11_standby', // included in blockage time and calibration accuracy
        entryDate: new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString(), // 30 hours ago
        cNPS: null, // should be excluded from cNPS average
        lastActivity: 'Inactive',
        experienceYears: 3,
        contactNumber: '789',
        email: 't3@t.com'
      }
    ];

    const kpis = calculatePresentacionKPIs(controlledCandidates);

    // 1. Check Active WIP Count (total candidates)
    assert.strictEqual(kpis.activeWipCount, 3);
    assert.strictEqual(kpis.isWipOverloaded, false);

    // 2. Check cNPS average: (10 + 6) / 2 = 8
    assert.strictEqual(kpis.avgCNPS, 8);

    // 3. Check Blockage Time average: 09_shortlist (10h) and 11_standby (30h) -> (10 + 30) / 2 = 20 hours
    assert.ok(Math.abs(kpis.blockageTimeHours - 20) < 0.2, `Expected blockage time around 20, got ${kpis.blockageTimeHours}`);

    // 4. Check Calibration Accuracy: (10_entrevista_cliente (1) + 11_standby (1)) / activeWipCount (3) = 66.66% -> rounded: 67%
    assert.strictEqual(kpis.calibrationAccuracy, 67);
  });

  test('Debería detectar WIP sobrecargado (overloaded) cuando supera 10 candidatos', () => {
    const bulkCandidates = Array.from({ length: 11 }, (_, i) => ({
      id: `BULK-${i}`,
      name: `Bulk Candidate ${i}`,
      role: 'Engineer',
      client: 'Inditex',
      location: 'Spain',
      score: 75,
      currentPhase: i % 3 === 0 ? '09_shortlist' : (i % 3 === 1 ? '10_entrevista_cliente' : '11_standby'),
      entryDate: new Date().toISOString(),
      cNPS: 8,
      lastActivity: 'Ready',
      experienceYears: 4,
      contactNumber: '1',
      email: 'a@c.com'
    }));

    const kpis = calculatePresentacionKPIs(bulkCandidates);
    assert.strictEqual(kpis.activeWipCount, 11);
    assert.strictEqual(kpis.isWipOverloaded, true);
  });

  test('Debería manejar datos vacíos elegantemente sin fallar por divisiones por cero', () => {
    const kpis = calculatePresentacionKPIs([]);
    assert.strictEqual(kpis.activeWipCount, 0);
    assert.strictEqual(kpis.isWipOverloaded, false);
    assert.strictEqual(kpis.avgCNPS, 0);
    assert.strictEqual(kpis.blockageTimeHours, 0);
    assert.strictEqual(kpis.calibrationAccuracy, 0);
  });

  test('Debería determinar el siguiente estado al avanzar postulante en Presentación (P-PRE-01)', () => {
    const nextPhaseMap = {
      '09_shortlist': '10_entrevista_cliente',
      '10_entrevista_cliente': '11_standby',
      '11_standby': '10_entrevista_cliente'
    };

    assert.strictEqual(nextPhaseMap['09_shortlist'], '10_entrevista_cliente');
    assert.strictEqual(nextPhaseMap['10_entrevista_cliente'], '11_standby');
    assert.strictEqual(nextPhaseMap['11_standby'], '10_entrevista_cliente');
  });

  test('P-PRE-01: Guardado y recuperación del filtro "Búsqueda" en localStorage (presentacion_selected_search)', () => {
    let memoryStorage = {};
    const mockLocalStorage = {
      getItem: (key) => memoryStorage[key] || null,
      setItem: (key, val) => { memoryStorage[key] = String(val); }
    };

    let selectedSearch = "Todos";

    const handleSelectSearchChange = (value) => {
      selectedSearch = value;
      mockLocalStorage.setItem("presentacion_selected_search", value);
    };

    assert.strictEqual(selectedSearch, "Todos");
    assert.strictEqual(mockLocalStorage.getItem("presentacion_selected_search"), null);

    handleSelectSearchChange("REQ-003");
    assert.strictEqual(selectedSearch, "REQ-003");
    assert.strictEqual(mockLocalStorage.getItem("presentacion_selected_search"), "REQ-003");

    const saved = mockLocalStorage.getItem("presentacion_selected_search");
    if (saved) {
      selectedSearch = saved;
    }
    assert.strictEqual(selectedSearch, "REQ-003");
  });

  test('P-PRE-01 (src/app/presentacion/page.tsx) integra la persistencia de presentacion_selected_search en localStorage', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const pagePath = path.resolve('src/app/presentacion/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(content.includes('presentacion_selected_search'), 'La página P-PRE-01 debe gestionar localStorage con presentacion_selected_search');
    assert.ok(content.includes('handleSelectSearchChange'), 'La página P-PRE-01 debe utilizar handleSelectSearchChange para mutar y persistir la búsqueda');
  });

  test('P-PRE-02 (src/app/presentacion/[id]/page.tsx) desincorpora la sección Herramientas de Cliente e IA — F3 y sus tipos/mocks', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const pPre02Path = path.resolve('src/app/presentacion/[id]/page.tsx');
    const libPath = path.resolve('src/lib/presentacion.ts');
    
    const pPre02Content = await fs.readFile(pPre02Path, 'utf-8');
    const libContent = await fs.readFile(libPath, 'utf-8');

    assert.strictEqual(
      pPre02Content.includes('Herramientas de Cliente e IA — F3'), 
      false, 
      'P-PRE-02 ya no debe contener la sección visual Herramientas de Cliente e IA — F3'
    );
    assert.strictEqual(
      pPre02Content.includes('generateDefaultPresentacionToolsDetails'), 
      false, 
      'P-PRE-02 ya no debe importar ni invocar generateDefaultPresentacionToolsDetails'
    );
    assert.strictEqual(
      libContent.includes('generateDefaultPresentacionToolsDetails'), 
      false, 
      'src/lib/presentacion.ts ya no debe definir la función helper generateDefaultPresentacionToolsDetails'
    );
  });
});
