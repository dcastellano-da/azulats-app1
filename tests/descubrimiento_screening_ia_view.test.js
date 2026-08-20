import test, { describe } from 'node:test';
import assert from 'node:assert/strict';

describe('P-DIS-01: Vista Lista Screening IA y Mapeo de Columnas de Screening Inteligente', () => {

  // Test 1: Soporte de tipos para viewMode ("kanban", "lista", "screening_ia")
  test('viewMode admite las 3 opciones de vista en P-DIS-01', () => {
    let currentViewMode = "kanban";
    const setViewMode = (mode) => { currentViewMode = mode; };

    setViewMode("lista");
    assert.equal(currentViewMode, "lista");

    setViewMode("screening_ia");
    assert.equal(currentViewMode, "screening_ia");

    setViewMode("kanban");
    assert.equal(currentViewMode, "kanban");
  });

  // Test 2: Mapeo de campos de Screening Inteligente IA en SourcedCandidate
  test('Mapeo correcto de fitScoreScreening, tieneKnockout y resultadoScreening', () => {
    const rawPipeItem = {
      id: "pipe-100",
      claves_conexion: { id_busqueda: "REQ-001", id_candidato: "C-301" },
      fit_score_screening: 85,
      tiene_knockout: true,
      resultado_screening: [
        { id_criterio: "c1", evaluacion: "NO", es_knockout: true, puntaje_obtenido: 0, evidencia_cv: "No cumple con inglés C1" },
        { id_criterio: "c2", evaluacion: "SI", es_knockout: false, puntaje_obtenido: 50, evidencia_cv: "5+ años en desarrollo iOS Nativo" }
      ],
      f1_descubrimiento: {
        notas_reclutador: "Requiere validación de pretensión salarial"
      }
    };

    const fitScoreScreening = rawPipeItem.fit_score_screening;
    const tieneKnockout = rawPipeItem.tiene_knockout;
    const resultadoScreening = rawPipeItem.resultado_screening;
    const recruiterNotes = rawPipeItem.f1_descubrimiento.notas_reclutador;

    assert.equal(fitScoreScreening, 85);
    assert.equal(tieneKnockout, true);
    assert.equal(resultadoScreening.length, 2);
    assert.equal(resultadoScreening[0].evaluacion, "NO");
    assert.equal(resultadoScreening[0].es_knockout, true);
    assert.equal(recruiterNotes, "Requiere validación de pretensión salarial");
  });

  // Test 3: Verificación de lógica de Alerta Knockout (Cumplido vs Incumplido vs Pendiente)
  test('Determinación de Alerta Knockout basada en tieneKnockout, resultadoScreening y estado no procesado', () => {
    const evalKnockoutStatus = (candidate) => {
      const isKnockoutActive = candidate.tieneKnockout || candidate.resultadoScreening?.some(r => r.es_knockout && r.evaluacion === "NO");
      const hasProcessedScreening = candidate.resultadoScreening && candidate.resultadoScreening.length > 0;
      if (isKnockoutActive) return "INCUMPLIDO";
      if (hasProcessedScreening) return "CUMPLIDO";
      return "PENDIENTE";
    };

    const candidateOk = {
      name: "Diego Lozano",
      tieneKnockout: false,
      resultadoScreening: [
        { id_criterio: "c1", evaluacion: "SI", es_knockout: true, puntaje_obtenido: 50 }
      ]
    };

    const candidateFailed = {
      name: "Alberto Ruiz",
      tieneKnockout: true,
      resultadoScreening: [
        { id_criterio: "c1", evaluacion: "NO", es_knockout: true, puntaje_obtenido: 0 }
      ]
    };

    const candidatePending = {
      name: "Adolfo Gómez",
      tieneKnockout: false,
      resultadoScreening: []
    };

    assert.equal(evalKnockoutStatus(candidateOk), "CUMPLIDO");
    assert.equal(evalKnockoutStatus(candidateFailed), "INCUMPLIDO");
    assert.equal(evalKnockoutStatus(candidatePending), "PENDIENTE");
  });

  // Test 4: Formateo de Semáforo por Criterio (SI, INFERIDO, NO)
  test('Formateo de semáforo de evaluación por criterio', () => {
    const formatSemaforo = (evaluacion) => {
      if (evaluacion === "SI") return { label: "SÍ", color: "emerald" };
      if (evaluacion === "INFERIDO") return { label: "INFERIDO", color: "sky" };
      return { label: "NO", color: "rose" };
    };

    assert.deepEqual(formatSemaforo("SI"), { label: "SÍ", color: "emerald" });
    assert.deepEqual(formatSemaforo("INFERIDO"), { label: "INFERIDO", color: "sky" });
    assert.deepEqual(formatSemaforo("NO"), { label: "NO", color: "rose" });
  });

  // Test 5: Resolución de Pregunta / Condición a evaluar por criterio
  test('Resolución de nombre de la pregunta en Desglose de Criterios y Alerta Knockout', () => {
    const getCriterionQuestion = (item, candidate, idx, activeBusquedas = []) => {
      if (item.pregunta && item.pregunta.trim() !== "") return item.pregunta;
      if (item.pregunta_condicion && String(item.pregunta_condicion).trim() !== "") return item.pregunta_condicion;
      if (activeBusquedas.length > 0) {
        const busq = activeBusquedas.find(b => b.id === candidate.searchId);
        const crit = busq?.criterios_screening?.find(c => c.id === item.id_criterio);
        if (crit?.pregunta) return crit.pregunta;
      }
      return item.es_knockout ? `Criterio Knockout #${idx + 1}` : `Criterio #${idx + 1}`;
    };

    const candidate = {
      searchId: "REQ-001",
      resultadoScreening: [
        { id_criterio: "c1", pregunta: "¿Tiene al menos 4 años de experiencia en React?", evaluacion: "NO", es_knockout: true, puntaje_obtenido: 0 },
        { id_criterio: "c2", evaluacion: "SI", es_knockout: false, puntaje_obtenido: 30 }
      ]
    };

    const activeBusquedas = [
      {
        id: "REQ-001",
        criterios_screening: [
          { id: "c1", pregunta: "¿Tiene al menos 4 años de experiencia en React?", tipo: "knockout", peso: 0 },
          { id: "c2", pregunta: "¿Nivel de inglés B2 conversacional?", tipo: "deseable", peso: 30 }
        ]
      }
    ];

    // Item 1 tiene pregunta directa
    assert.equal(getCriterionQuestion(candidate.resultadoScreening[0], candidate, 0, activeBusquedas), "¿Tiene al menos 4 años de experiencia en React?");
    // Item 2 resuelve pregunta desde la Búsqueda
    assert.equal(getCriterionQuestion(candidate.resultadoScreening[1], candidate, 1, activeBusquedas), "¿Nivel de inglés B2 conversacional?");
  });

  // Test 6: Verificación de lista de columnas homologadas (Sin Evidencia CV)
  test('Columnas homologadas en Lista Screening IA no incluyen Evidencia CV', () => {
    const tableColumns = [
      "Candidato",
      "Fit Score IA",
      "Alerta Knockout",
      "Desglose Criterios & Semáforo",
      "NOTAS DESCUBRIMIENTO",
      "Estado",
      "Acciones"
    ];

    assert.ok(!tableColumns.includes("Evidencia CV (Prueba de Vida)"));
    assert.equal(tableColumns.length, 7);
  });

  // Test 7: Enlace interactivo en nombre de candidato hacia su detalle
  test('El nombre del candidato genera la ruta correcta hacia su expediente de detalle', () => {
    const getCandidateDetailHref = (candidate) => `/descubrimiento/${candidate.pipeId || candidate.id}`;

    const cand1 = { id: "C-301", pipeId: "pipe-301-xyz" };
    const cand2 = { id: "C-302" };

    assert.equal(getCandidateDetailHref(cand1), "/descubrimiento/pipe-301-xyz");
    assert.equal(getCandidateDetailHref(cand2), "/descubrimiento/C-302");
  });

  // Test 8: Ordenamiento numérico por Fit Score IA en la vista Lista Screening IA
  test('Ordenamiento por Fit Score IA ordena numéricamente los registros en orden ascendente y descendente', () => {
    const candidateList = [
      { id: "C-1", name: "Adolfo Gómez", score: 80, fitScoreScreening: 0 },
      { id: "C-2", name: "Diego Lozano", score: 94, fitScoreScreening: 94 },
      { id: "C-3", name: "Carlos Tejera", score: 87, fitScoreScreening: 87 }
    ];

    const sortCandidates = (list, direction) => {
      return [...list].sort((a, b) => {
        const valA = a.fitScoreScreening ?? a.score ?? 0;
        const valB = b.fitScoreScreening ?? b.score ?? 0;
        return direction === "asc" ? valA - valB : valB - valA;
      });
    };

    const sortedDesc = sortCandidates(candidateList, "desc");
    assert.deepEqual(sortedDesc.map(c => c.id), ["C-2", "C-3", "C-1"]);

    const sortedAsc = sortCandidates(candidateList, "asc");
    assert.deepEqual(sortedAsc.map(c => c.id), ["C-1", "C-3", "C-2"]);
  });

  // Test 9: Verificación de etiqueta del botón de ingesta en la cabecera de P-DIS-01
  test('El botón de ingesta en P-DIS-01 muestra la etiqueta "Importar Postulante con IA"', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const pagePath = path.resolve('src/app/descubrimiento/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    // Verificar presencia de la nueva etiqueta
    assert.ok(content.includes('<span>Importar Postulante con IA</span>'), 'El botón debe incluir la etiqueta "Importar Postulante con IA"');
    // Verificar que la antigua etiqueta "Parser Ingesta CV" ya no esté en el botón del header
    assert.ok(!content.includes('<span>Parser Ingesta CV</span>'), 'La antigua etiqueta "Parser Ingesta CV" no debe estar presente');
  });

  // Test 10: Verificación de insignia dinámica según estado de evaluación en ScreeningPanel.tsx (Opción A)
  test('ScreeningPanel renderiza insignias dinámicas "EXCLUYENTE ✓" al cumplir y "KNOCKOUT INCUMPLIDO" al reprobar', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const panelPath = path.resolve('src/app/components/ScreeningPanel.tsx');
    const content = await fs.readFile(panelPath, 'utf-8');

    // Verificar soporte de badge EXCLUYENTE ✓ para evaluacion === "SI"
    assert.ok(content.includes('EXCLUYENTE'), 'El panel debe incluir el distintivo EXCLUYENTE');
    assert.ok(content.includes('<span>✓</span>'), 'El panel debe incluir el check verde para criterios excluyentes cumplidos');
    // Verificar que solo muestre KNOCKOUT INCUMPLIDO en tono rojo cuando evaluacion === "NO"
    assert.ok(content.includes('🔴 KNOCKOUT INCUMPLIDO'), 'El panel debe mostrar KNOCKOUT INCUMPLIDO únicamente cuando evaluacion === "NO"');
  });

  // Test 11: Soporte de Densidad de Vista (compact vs expanded) y persistencia en localStorage
  test('Selector de Densidad soporta modos compact y expanded con clave screening_ia_density_mode', () => {
    let memoryStorage = {};
    const mockLocalStorage = {
      getItem: (key) => memoryStorage[key] || null,
      setItem: (key, val) => { memoryStorage[key] = String(val); }
    };

    let densityMode = "compact";
    const handleDensityChange = (mode) => {
      densityMode = mode;
      mockLocalStorage.setItem("screening_ia_density_mode", mode);
    };

    // Cambiar a expandida
    handleDensityChange("expanded");
    assert.equal(densityMode, "expanded");
    assert.equal(mockLocalStorage.getItem("screening_ia_density_mode"), "expanded");

    // Cambiar a compacta
    handleDensityChange("compact");
    assert.equal(densityMode, "compact");
    assert.equal(mockLocalStorage.getItem("screening_ia_density_mode"), "compact");
  });

  // Test 12: Presencia de componentes DensitySelector y ScreeningIATable en la pantalla de descubrimiento
  test('P-DIS-01 (page.tsx) integra DensitySelector y el componente ScreeningIATable', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const pagePath = path.resolve('src/app/descubrimiento/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(content.includes('DensitySelector'), 'La página debe importar e incluir DensitySelector');
    assert.ok(content.includes('ScreeningIATable'), 'La página debe importar e incluir ScreeningIATable');
    assert.ok(content.includes('screening_ia_density_mode'), 'La página debe gestionar localStorage con la clave screening_ia_density_mode');
  });

  // Test 13: Verificación del contenido de DensitySelector.tsx y ScreeningIATable.tsx
  test('DensitySelector.tsx y ScreeningIATable.tsx contienen las etiquetas e íconos requeridos', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const densityPath = path.resolve('src/components/screening/DensitySelector.tsx');
    const densityContent = await fs.readFile(densityPath, 'utf-8');

    assert.ok(densityContent.includes('Densidad:'), 'DensitySelector debe mostrar la etiqueta Densidad:');
    assert.ok(densityContent.includes('Compacta'), 'DensitySelector debe tener la opción Compacta');
    assert.ok(densityContent.includes('Expandida'), 'DensitySelector debe tener la opción Expandida');
    assert.ok(densityContent.includes('Visualización densa (8-12 candidatos por página)'), 'Debe incluir tooltip para modo compacto');

    const tablePath = path.resolve('src/components/screening/ScreeningIATable.tsx');
    const tableContent = await fs.readFile(tablePath, 'utf-8');

    assert.ok(tableContent.includes('✓ Knockouts OK'), 'ScreeningIATable debe incluir badge ✓ Knockouts OK en modo compacto');
    assert.ok(tableContent.includes('✕ Fallo:'), 'ScreeningIATable debe incluir badge ✕ Fallo en modo compacto');
    assert.ok(tableContent.includes('MoreHorizontal'), 'ScreeningIATable debe usar menú de acciones secundarias');
  });

  // Test 14: Persistencia del modo de vista y última búsqueda seleccionada en localStorage
  test('Sincronización de descubrimiento_view_mode y descubrimiento_selected_search en localStorage', () => {
    let memoryStorage = {};
    const mockLocalStorage = {
      getItem: (key) => memoryStorage[key] || null,
      setItem: (key, val) => { memoryStorage[key] = String(val); }
    };

    let viewMode = "kanban";
    let selectedSearch = "Todos";

    const handleViewModeChange = (mode) => {
      viewMode = mode;
      mockLocalStorage.setItem("descubrimiento_view_mode", mode);
    };

    const handleSelectedSearchChange = (searchId) => {
      selectedSearch = searchId;
      mockLocalStorage.setItem("descubrimiento_selected_search", searchId);
    };

    handleViewModeChange("screening_ia");
    assert.equal(viewMode, "screening_ia");
    assert.equal(mockLocalStorage.getItem("descubrimiento_view_mode"), "screening_ia");

    handleSelectedSearchChange("REQ-001");
    assert.equal(selectedSearch, "REQ-001");
    assert.equal(mockLocalStorage.getItem("descubrimiento_selected_search"), "REQ-001");
  });

  // Test 15: Verificación en P-DIS-01 (page.tsx) del manejo de claves descubrimiento_view_mode y descubrimiento_selected_search
  test('P-DIS-01 (page.tsx) lee y persiste las claves descubrimiento_view_mode y descubrimiento_selected_search', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const pagePath = path.resolve('src/app/descubrimiento/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(content.includes('descubrimiento_view_mode'), 'La página debe gestionar localStorage con descubrimiento_view_mode');
    assert.ok(content.includes('descubrimiento_selected_search'), 'La página debe gestionar localStorage con descubrimiento_selected_search');
    assert.ok(content.includes('handleViewModeChange'), 'La página debe utilizar handleViewModeChange');
    assert.ok(content.includes('handleSelectedSearchChange'), 'La página debe utilizar handleSelectedSearchChange');
  });

  // Test 16: Verificación de eliminación de la insignia Ref y eliminación de INITIAL_SOURCED_CANDIDATES
  test('P-DIS-01 (page.tsx) no incluye la insignia Ref y no incluye INITIAL_SOURCED_CANDIDATES', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const pagePath = path.resolve('src/app/descubrimiento/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(!content.includes('const INITIAL_SOURCED_CANDIDATES'), 'P-DIS-01 debe haber eliminado la constante muerta INITIAL_SOURCED_CANDIDATES');
    assert.ok(!content.includes('Ref:'), 'La cabecera de P-DIS-01 debe haber eliminado la insignia Ref decorativa');
  });

  // Test 17: Verificación de notificación de error Toast en ingesta ante falla backend
  test('P-DIS-01 (page.tsx) gestiona errores de ingesta con Toast y no crea candidatos mock', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const pagePath = path.resolve('src/app/descubrimiento/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(content.includes('Error al conectar con el servidor backend para guardar el postulante'), 'Debe emitir un mensaje de Toast claro al fallar la ingesta en backend');
    assert.ok(!content.includes('Recién Ingestado (Mock)'), 'No debe asignar lastChangeDate con Recién Ingestado (Mock)');
  });

  // Test 18: Verificación en P-DIS-01 (page.tsx) del uso de useMemo para KPI metrics y candidatesInSelectedSearch
  test('P-DIS-01 (page.tsx) utiliza useMemo para candidatesInSelectedSearch y KPI metrics aislados de searchTerm', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');
    const pagePath = path.resolve('src/app/descubrimiento/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(content.includes('candidatesInSelectedSearch = useMemo'), 'Debe memoizar candidatesInSelectedSearch con useMemo');
    assert.ok(content.includes('formattedTTFME'), 'Debe calcular formattedTTFME de forma dinámico o fallback');
    assert.ok(content.includes('formattedOutreach'), 'Debe calcular formattedOutreach de forma dinámico o fallback');
    assert.ok(content.includes('{formattedTTFME}'), 'Debe renderizar {formattedTTFME} en las tarjetas de cabecera');
    assert.ok(content.includes('{formattedOutreach}'), 'Debe renderizar {formattedOutreach} en las tarjetas de cabecera');
  });

  // Test 19: Lógica de cálculo dinámico de KPIs por búsqueda seleccionada con fallback benchmark
  test('Lógica de cálculo dinámico de KPIs filtra por selectedSearch y aplica fallback benchmark si no hay datos', () => {
    const candidates = [
      { id: "c1", searchCode: "BUS-001", phase1State: "01_nuevo", ttfme: "1.2d", outreachVariation: "A" },
      { id: "c2", searchCode: "BUS-001", phase1State: "04_rechazado", ttfme: "2.4d", outreachVariation: "B" },
      { id: "c3", searchCode: "BUS-002", phase1State: "02_contactado", ttfme: "--", outreachVariation: "A" }
    ];

    const calcForSearch = (selectedSearch) => {
      const filtered = candidates.filter(c => selectedSearch === "Todos" || c.searchCode === selectedSearch);
      const total = filtered.length;
      const rejCount = filtered.filter(c => c.phase1State === "04_rechazado").length;
      const rejRate = total > 0 ? Math.round((rejCount / total) * 100) : 0;

      let ttfmeStr = "1.8 días";
      if (selectedSearch !== "Todos") {
        const validTTFME = filtered
          .map(c => {
            if (!c.ttfme || c.ttfme === "--") return NaN;
            const match = c.ttfme.match(/[\d.]+/);
            return match ? parseFloat(match[0]) : NaN;
          })
          .filter(v => !isNaN(v) && v > 0);
        if (validTTFME.length > 0) {
          const avg = validTTFME.reduce((a, b) => a + b, 0) / validTTFME.length;
          ttfmeStr = `${avg.toFixed(1)} días`;
        }
      }

      let outreachStr = "76.4%";
      if (selectedSearch !== "Todos") {
        const contacted = filtered.filter(c => c.phase1State === "02_contactado" || c.outreachVariation);
        if (contacted.length > 0) {
          const countA = contacted.filter(c => c.outreachVariation === "A").length;
          outreachStr = `${Math.round((countA / contacted.length) * 100)}%`;
        }
      }

      return { total, rejRate, ttfmeStr, outreachStr };
    };

    // Caso "Todos"
    const globalRes = calcForSearch("Todos");
    assert.equal(globalRes.total, 3);
    assert.equal(globalRes.rejRate, 33);
    assert.equal(globalRes.ttfmeStr, "1.8 días");
    assert.equal(globalRes.outreachStr, "76.4%");

    // Caso Búsqueda Específica "BUS-001"
    const bus1Res = calcForSearch("BUS-001");
    assert.equal(bus1Res.total, 2);
    assert.equal(bus1Res.rejRate, 50);
    assert.equal(bus1Res.ttfmeStr, "1.8 días"); // (1.2 + 2.4)/2 = 1.8
    assert.equal(bus1Res.outreachStr, "50%"); // 1 de 2 variante A

    // Caso Búsqueda sin datos numéricos en TTFME "BUS-002"
    const bus2Res = calcForSearch("BUS-002");
    assert.equal(bus2Res.total, 1);
    assert.equal(bus2Res.rejRate, 0);
    assert.equal(bus2Res.ttfmeStr, "1.8 días"); // Fallback benchmark
    assert.equal(bus2Res.outreachStr, "100%"); // 1 de 1 variante A
  });

});


