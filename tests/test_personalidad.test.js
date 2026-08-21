import { test, describe } from 'node:test';
import assert from 'node:assert';
import { mapPipelineToEvaluacionCandidates } from '../src/lib/evaluacion.ts';

describe('Cognitive Fit Vision (CFV) - V3 (Test de Personalidad)', () => {
  
  test('Debería mapear correctamente f2_evaluacion.test_personalidad en mapPipelineToEvaluacionCandidates', () => {
    const mockPipeline = [
      {
        id: 'pipe-cfv-001',
        claves_conexion: {
          id_busqueda: 'BUSQ-01',
          id_candidato: 'CAND-01'
        },
        flujo: {
          estado_actual: '05 - Screening',
          fecha_ultimo_cambio: new Date().toISOString()
        },
        f2_evaluacion: {
          test_personalidad: {
            arquetipo_codigo: 'ENTJ-A',
            arquetipo_nombre: 'Comandante',
            dimensiones: {
              dim_mente: 35,
              dim_energia: 78,
              dim_naturaleza: 82,
              dim_tactica: 90,
              dim_identidad: 85
            },
            analisis_encaje: 'Demuestra alta capacidad de liderazgo y orientación estratégica.',
            fecha_analisis: '2026-08-21T19:25:00.000Z'
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const candidatos = [
      { id: 'CAND-01', nombre_completo: 'Carlos Mendoza', puesto: 'Engineering Lead' }
    ];

    const busquedas = [
      { id: 'BUSQ-01', id_busqueda: 'BUSQ-01', perfil_busqueda: 'Engineering Lead', cliente: 'Azul Corp' }
    ];

    const mapped = mapPipelineToEvaluacionCandidates(mockPipeline, candidatos, busquedas);

    assert.strictEqual(mapped.length, 1);
    const candidate = mapped[0];
    assert.ok(candidate.test_personalidad, 'El candidato mapeado debe poseer el objeto test_personalidad');
    assert.strictEqual(candidate.test_personalidad.arquetipo_codigo, 'ENTJ-A');
    assert.strictEqual(candidate.test_personalidad.arquetipo_nombre, 'Comandante');
    assert.strictEqual(candidate.test_personalidad.dimensiones.dim_mente, 35);
    assert.strictEqual(candidate.test_personalidad.dimensiones.dim_tactica, 90);
    assert.strictEqual(candidate.test_personalidad.analisis_encaje, 'Demuestra alta capacidad de liderazgo y orientación estratégica.');
  });

  test('Debería validar la presencia de las Server Actions para el Test de Personalidad en pipeline.ts', async () => {
    const pipelineActions = await import('../src/actions/pipeline.ts');

    assert.strictEqual(typeof pipelineActions.analizarTestPersonalidadAction, 'function', 'debe exportar analizarTestPersonalidadAction');
    assert.strictEqual(typeof pipelineActions.actualizarTestPersonalidadAction, 'function', 'debe exportar actualizarTestPersonalidadAction');
  });

  test('Debería verificar que los componentes y la vista P-EVA-01 contienen las referencias al modulo Cognitive Fit Vision', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    // 1. Verificar evaluacion/page.tsx
    const evalPageContent = await fs.readFile(path.resolve('src/app/evaluacion/page.tsx'), 'utf-8');
    assert.ok(evalPageContent.includes('test_personalidad'), 'P-EVA-01 debe integrar la vista test_personalidad');
    assert.ok(evalPageContent.includes('TestPersonalidadTable'), 'P-EVA-01 debe integrar TestPersonalidadTable');
    assert.ok(evalPageContent.includes('AnalizarTestPersonalidadModal'), 'P-EVA-01 debe integrar AnalizarTestPersonalidadModal');

    // 1b. Verificar renderizado de test_personalidad en tarjetas Kanban (KanbanCard)
    const kanbanSection = evalPageContent.substring(evalPageContent.indexOf('function KanbanCard'));
    assert.ok(kanbanSection.includes('cad.test_personalidad'), 'KanbanCard debe renderizar cad.test_personalidad');
    assert.ok(kanbanSection.includes('arquetipo_codigo'), 'KanbanCard debe mostrar el código de arquetipo del test de personalidad');
    assert.ok(kanbanSection.includes('analisis_encaje'), 'KanbanCard debe mostrar el extracto del análisis de encaje cultural');

    // 2. Verificar evaluacion/[id]/page.tsx
    const detailPageContent = await fs.readFile(path.resolve('src/app/evaluacion/[id]/page.tsx'), 'utf-8');
    assert.ok(detailPageContent.includes('TestPersonalidadCard'), 'P-EVA-02 debe integrar TestPersonalidadCard');
    assert.ok(detailPageContent.includes('AnalizarTestPersonalidadModal'), 'P-EVA-02 debe integrar AnalizarTestPersonalidadModal');

    // 3. Verificar TestPersonalidadTable.tsx
    const tableContent = await fs.readFile(path.resolve('src/components/evaluacion/TestPersonalidadTable.tsx'), 'utf-8');
    assert.ok(tableContent.includes('DensitySelector'), 'TestPersonalidadTable debe soportar DensitySelector');
    assert.ok(tableContent.includes('arquetipo_codigo'), 'TestPersonalidadTable debe renderizar arquetipo_codigo');

    // 4. Verificar TestPersonalidadCard.tsx (Human-in-the-loop y barras bivalentes)
    const cardContent = await fs.readFile(path.resolve('src/app/components/TestPersonalidadCard.tsx'), 'utf-8');
    assert.ok(cardContent.includes('actualizarTestPersonalidadAction'), 'TestPersonalidadCard debe utilizar actualizarTestPersonalidadAction para edicion');
    assert.ok(cardContent.includes('Extravertido'), 'TestPersonalidadCard debe incluir etiquetas bivalentes');
    assert.ok(cardContent.includes('Introvertido'), 'TestPersonalidadCard debe incluir etiquetas bivalentes');
  });
});
