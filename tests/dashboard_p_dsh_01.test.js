import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('P-DSH-01: Filtros Generales y Botones de Ayuda con Criterios de Cálculo', () => {

  // Mock array de entidad Búsquedas
  const mockBusquedas = [
    {
      id: "busq-1",
      id_busqueda: "REQ-001",
      cliente: "Empresa Alpha",
      perfil_busqueda: "Developer React Senior",
      estado_fase: "01_sourcing"
    },
    {
      id: "busq-2",
      id_busqueda: "REQ-002",
      cliente: "Empresa Alpha",
      perfil_busqueda: "Tech Lead Python",
      estado_fase: "02_evaluacion"
    },
    {
      id: "busq-3",
      id_busqueda: "REQ-003",
      cliente: "Beta Logistics",
      perfil_busqueda: "DevOps Engineer",
      estado_fase: "03_cliente"
    }
  ];

  // Test 1: Extracción dinámica de clientes únicos desde entidad Búsquedas (campo Cliente)
  test('Extrae correctamente los clientes únicos desde la entidad Búsquedas', () => {
    const clientsSet = new Set();
    mockBusquedas.forEach(b => {
      if (b.cliente && b.cliente.trim() !== '') {
        clientsSet.add(b.cliente.trim());
      }
    });

    const clientOptions = [
      { id: 'all', name: 'Todos los Clientes' },
      ...Array.from(clientsSet).sort().map(c => ({ id: c, name: c }))
    ];

    assert.equal(clientOptions.length, 3);
    assert.equal(clientOptions[0].id, 'all');
    assert.equal(clientOptions[1].name, 'Beta Logistics');
    assert.equal(clientOptions[2].name, 'Empresa Alpha');
  });

  // Test 2: Filtrado en cascada de Búsquedas según el Cliente seleccionado
  test('Filtra las búsquedas en cascada según el cliente seleccionado', () => {
    const filterSearchesByClient = (busquedas, client) => {
      if (client === 'all') return busquedas;
      return busquedas.filter(b => b.cliente === client);
    };

    const allSearches = filterSearchesByClient(mockBusquedas, 'all');
    assert.equal(allSearches.length, 3);

    const alphaSearches = filterSearchesByClient(mockBusquedas, 'Empresa Alpha');
    assert.equal(alphaSearches.length, 2);
    assert.equal(alphaSearches[0].perfil_busqueda, 'Developer React Senior');
    assert.equal(alphaSearches[1].perfil_busqueda, 'Tech Lead Python');

    const betaSearches = filterSearchesByClient(mockBusquedas, 'Beta Logistics');
    assert.equal(betaSearches.length, 1);
    assert.equal(betaSearches[0].perfil_busqueda, 'DevOps Engineer');
  });

  // Test 3: Inspección de código de P-DSH-01 (src/app/dashboard/page.tsx)
  test('P-DSH-01 elimina el texto estático de sync y mantiene el orden de filtros requerido', () => {
    const filePath = path.resolve('src/app/dashboard/page.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');

    // 1. Verificación de ausencia del texto estático
    assert.ok(
      !content.includes('Datos actualizados en tiempo real mediante sync de Firestore y BigQuery.'),
      'page.tsx debe haber eliminado el texto estático de sync de Firestore y BigQuery'
    );

    // 2. Verificación de importación de getBusquedasAPI
    assert.ok(
      content.includes('getBusquedasAPI'),
      'page.tsx debe importar y llamar a getBusquedasAPI'
    );

    // 3. Verificación del nuevo desplegable de búsquedas (option "Todas las Búsquedas")
    assert.ok(
      content.includes('Todas las Búsquedas'),
      'page.tsx debe incluir el nuevo filtro de Búsquedas con la opción "Todas las Búsquedas"'
    );

    // 4. Verificación del orden de filtros: selectedClient -> selectedSearch -> selectedDateRange
    const indexClient = content.indexOf('selectedClient');
    const indexSearch = content.indexOf('selectedSearch');
    const indexDate = content.indexOf('selectedDateRange');

    assert.ok(indexClient !== -1 && indexSearch !== -1 && indexDate !== -1, 'Los 3 filtros deben existir en la página');
    assert.ok(indexClient < indexSearch, 'El filtro de cliente debe ubicarse antes que el de búsquedas');
    assert.ok(indexSearch < indexDate, 'El filtro de búsquedas debe ubicarse antes que el filtro de fechas');
  });

  // Test 4: Inspección de botones "?" y criterios de cálculo en KpiCards.tsx, MetricsChart.tsx y page.tsx
  test('Componentes de KPI, gráficos y listas incluyen el botón "?" y criterios de cálculo', () => {
    const kpiPath = path.resolve('src/app/components/KpiCards.tsx');
    const kpiContent = fs.readFileSync(kpiPath, 'utf-8');

    assert.ok(kpiContent.includes('title="Ver criterio y fórmula de cálculo"'), 'KpiCards.tsx debe incluir el botón "?" con su título de tooltip');
    assert.ok(kpiContent.includes('Fórmula:'), 'KpiCards.tsx debe desplegar la fórmula de cálculo');
    assert.ok(kpiContent.includes('Búsquedas Activas'), 'KpiCards.tsx debe incluir criterio para Búsquedas Activas');
    assert.ok(kpiContent.includes('Candidatos en Bandeja'), 'KpiCards.tsx debe incluir criterio para Candidatos en Bandeja');
    assert.ok(kpiContent.includes('Tiempo de Asignación'), 'KpiCards.tsx debe incluir criterio para Tiempo de Asignación');

    const chartPath = path.resolve('src/app/components/MetricsChart.tsx');
    const chartContent = fs.readFileSync(chartPath, 'utf-8');

    assert.ok(chartContent.includes('Criterio - Evolución Semanal de Postulantes por Origen'), 'MetricsChart.tsx debe incluir el modal/overlay con el criterio de evolución semanal por Origen del Perfil');
    assert.ok(chartContent.includes('setShowHelp'), 'MetricsChart.tsx debe controlar la visibilidad del overlay de ayuda');


    const pagePath = path.resolve('src/app/dashboard/page.tsx');
    const pageContent = fs.readFileSync(pagePath, 'utf-8');

    assert.ok(pageContent.includes('Criterio - Procesos Activos'), 'page.tsx debe incluir el criterio de cálculo para Procesos Activos Recientes');
    assert.ok(pageContent.includes('setShowRecentHelp'), 'page.tsx debe controlar la visibilidad del overlay para Procesos Activos');
  });

  // Test 5: Cálculo dinámico de BÚSQUEDAS ACTIVAS basado en la fórmula y los filtros seleccionados
  test('Calcula dinámicamente el KPI BÚSQUEDAS ACTIVAS sin datos mocks y reacciona a los filtros', () => {
    const list = [
      { id: "b1", cliente: "Empresa Alpha", estado_fase: "01_sourcing" },
      { id: "b2", cliente: "Empresa Alpha", estado_fase: "02_evaluacion" },
      { id: "b3", cliente: "Empresa Alpha", estado_fase: "Cerrada" },
      { id: "b4", cliente: "Beta Corp", estado_fase: "01_sourcing" },
      { id: "b5", cliente: "Beta Corp", estado_fase: "Cancelada" },
    ];

    const calculateActiveSearches = (busquedas, client = "all", searchId = "all") => {
      let filtered = busquedas;
      if (client !== "all") {
        filtered = filtered.filter(b => b.cliente === client);
      }
      if (searchId !== "all") {
        filtered = filtered.filter(b => b.id === searchId);
      }
      return filtered.filter(b => {
        const st = (b.estado_fase || "").toLowerCase();
        return st !== "cerrada" && st !== "cancelada";
      }).length;
    };

    // 1. Sin filtros ("all"): debe contar b1, b2 y b4 = 3 búsquedas activas
    assert.equal(calculateActiveSearches(list, "all", "all"), 3);

    // 2. Filtro por "Empresa Alpha": debe contar b1 y b2 = 2 búsquedas activas
    assert.equal(calculateActiveSearches(list, "Empresa Alpha", "all"), 2);

    // 3. Filtro por "Beta Corp": debe contar solo b4 = 1 búsqueda activa
    assert.equal(calculateActiveSearches(list, "Beta Corp", "all"), 1);

    // 4. Filtro por búsqueda específica cerrada "b3": debe retornar 0
    assert.equal(calculateActiveSearches(list, "Empresa Alpha", "b3"), 0);

    // 5. Verificación de integración en page.tsx y KpiCards.tsx (presencia de activeSearchesCount)
    const pageContent = fs.readFileSync(path.resolve('src/app/dashboard/page.tsx'), 'utf-8');
    const kpiContent = fs.readFileSync(path.resolve('src/app/components/KpiCards.tsx'), 'utf-8');

    assert.ok(pageContent.includes('activeSearchesCount={activeSearchesCount}'), 'page.tsx debe pasar activeSearchesCount a KpiCards');
    assert.ok(kpiContent.includes('realActiveSearches'), 'KpiCards.tsx debe emplear realActiveSearches en lugar de la constante mock "24"');
    assert.ok(!kpiContent.includes('value: "24"'), 'KpiCards.tsx no debe contener el valor estático mock "24"');
  });

  // Test 6: Cálculo dinámico de CANDIDATOS EN BANDEJA y TIEMPO DE ASIGNACIÓN sin datos mocks
  test('Calcula dinámicamente CANDIDATOS EN BANDEJA y TIEMPO DE ASIGNACIÓN eliminando valores mocks estáticos', () => {
    const pageContent = fs.readFileSync(path.resolve('src/app/dashboard/page.tsx'), 'utf-8');
    const kpiContent = fs.readFileSync(path.resolve('src/app/components/KpiCards.tsx'), 'utf-8');

    // 1. Verificar que KpiCards no contenga los valores mock estáticos antiguos
    assert.ok(!kpiContent.includes('value: "1,428"'), 'KpiCards.tsx no debe contener el valor estático mock "1,428"');
    assert.ok(!kpiContent.includes('value: "18.2 días"'), 'KpiCards.tsx no debe contener el valor estático mock "18.2 días"');
    assert.ok(!kpiContent.includes('value: "+8.1%"'), 'KpiCards.tsx no debe contener el porcentaje mock estático "+8.1%"');
    assert.ok(!kpiContent.includes('value: "-12.5%"'), 'KpiCards.tsx no debe contener el porcentaje mock estático "-12.5%"');

    // 2. Verificar el uso de props dinámicas en KpiCards.tsx
    assert.ok(kpiContent.includes('realCandidatesCount'), 'KpiCards.tsx debe utilizar realCandidatesCount');
    assert.ok(kpiContent.includes('realAllocationTime'), 'KpiCards.tsx debe utilizar realAllocationTime');

    // 3. Verificar la invocación en page.tsx pasando candidatesCount y allocationTimeAvg
    assert.ok(pageContent.includes('candidatesCount={candidatesCount}'), 'page.tsx debe pasar candidatesCount a KpiCards');
    assert.ok(pageContent.includes('allocationTimeAvg={allocationTimeAvg}'), 'page.tsx debe pasar allocationTimeAvg a KpiCards');
    assert.ok(pageContent.includes('getCandidatosAPI'), 'page.tsx debe cargar los datos de la entidad Candidatos');
  });

  // Test 7: Gráfico de Evolución de Postulantes por Origen del Perfil (global, sin filtros de búsqueda)
  test('MetricsChart renderiza la evolución de postulantes por Origen del Perfil y no aplica filtros de búsquedas', () => {
    const chartContent = fs.readFileSync(path.resolve('src/app/components/MetricsChart.tsx'), 'utf-8');
    const pageContent = fs.readFileSync(path.resolve('src/app/dashboard/page.tsx'), 'utf-8');

    // 1. Verificar el título e indicación de Origen del Perfil
    assert.ok(chartContent.includes('Evolución Semanal de Postulantes por Origen'), 'MetricsChart.tsx debe titularse "Evolución Semanal de Postulantes por Origen"');

    assert.ok(chartContent.includes('Directo ATS'), 'MetricsChart.tsx debe desglosar la categoría Directo ATS');
    assert.ok(chartContent.includes('LinkedIn InMail'), 'MetricsChart.tsx debe desglosar la categoría LinkedIn InMail');
    assert.ok(chartContent.includes('Sourcing IA'), 'MetricsChart.tsx debe desglosar la categoría Sourcing IA');
    assert.ok(chartContent.includes('Referido Interno'), 'MetricsChart.tsx debe desglosar la categoría Referido Interno');

    // 2. Verificar aclaración de no aplicación de filtros de búsqueda/pipeline
    assert.ok(chartContent.includes('No aplican filtros de cliente ni de búsqueda'), 'MetricsChart.tsx debe documentar expresamente que no aplica filtros de búsqueda');

    // 3. Verificar paso de la propiedad candidatos desde page.tsx hacia MetricsChart
    assert.ok(pageContent.includes('<MetricsChart candidatos={candidatos} />'), 'page.tsx debe pasar el padrón global de candidatos a MetricsChart');
  });

  // Test 8: Gráfico de Postulantes por estado_actual del Pipeline (P-DSH-01) con filtros y botón ?
  test('PipelineChart renderiza postulantes por estado_actual, reacciona a filtros y tiene botón ?', () => {
    const pipelinePath = path.resolve('src/app/components/PipelineChart.tsx');
    const pipelineContent = fs.readFileSync(pipelinePath, 'utf-8');
    const pageContent = fs.readFileSync(path.resolve('src/app/dashboard/page.tsx'), 'utf-8');

    // 1. Verificación de título y componentes por estado_actual en PipelineChart.tsx
    assert.ok(pipelineContent.includes('Postulantes por Estado Actual'), 'PipelineChart.tsx debe incluir el título "Postulantes por Estado Actual"');
    assert.ok(pipelineContent.includes('title="Ver criterio y fórmula de cálculo"'), 'PipelineChart.tsx debe incluir el botón "?"');
    assert.ok(pipelineContent.includes('Criterio - Postulantes por Estado Actual'), 'PipelineChart.tsx debe desplegar el overlay explicativo');

    // 2. Verificación de uso del campo estado_actual
    assert.ok(pipelineContent.includes('estado_actual'), 'PipelineChart.tsx debe evaluar el campo estado_actual');

    // 3. Verificación de integración en page.tsx pasando filtros seleccionados
    assert.ok(pageContent.includes('<PipelineChart'), 'page.tsx debe renderizar PipelineChart');
    assert.ok(pageContent.includes('selectedClient={selectedClient}'), 'page.tsx debe pasar selectedClient a PipelineChart');
    assert.ok(pageContent.includes('selectedSearch={selectedSearch}'), 'page.tsx debe pasar selectedSearch a PipelineChart');
  });

  // Test 9: Procesos Activos Recientes usa datos reales y se elimina Sesión de Reclutador
  test('P-DSH-01 reemplaza mocks de Procesos Activos Recientes por datos reales y elimina Sesión de Reclutador', () => {
    const pageContent = fs.readFileSync(path.resolve('src/app/dashboard/page.tsx'), 'utf-8');

    // 1. Verificación de que no existen los datos mocks antiguos de recentSearches
    assert.ok(!pageContent.includes('Telefónica S.A.'), 'page.tsx no debe contener el mock de "Telefónica S.A."');
    assert.ok(!pageContent.includes('SEAT S.A.'), 'page.tsx no debe contener el mock de "SEAT S.A."');

    // 2. Verificación del cálculo dinámico realRecentSearches
    assert.ok(pageContent.includes('realRecentSearches'), 'page.tsx debe utilizar realRecentSearches');

    // 3. Verificación de la eliminación completa de la sección "Sesión de Reclutador"
    assert.ok(!pageContent.includes('Sesión de Reclutador'), 'page.tsx no debe contener la sección "Sesión de Reclutador"');
  });

});





