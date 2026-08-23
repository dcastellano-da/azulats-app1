import { test, describe } from 'node:test';
import assert from 'node:assert';
import { mapPipelineToEvaluacionCandidates } from '../src/lib/evaluacion.ts';

describe('Lista Entrevista (Smart Scorecard - Entrevista de Screening) - P-EVA-01', () => {

  test('Debería mapear correctamente f2_evaluacion.informe_entrevista_ia en mapPipelineToEvaluacionCandidates', () => {
    const mockPipeline = [
      {
        id: 'pipe-entr-001',
        claves_conexion: {
          id_busqueda: 'BUSQ-01',
          id_candidato: 'CAND-01'
        },
        flujo: {
          estado_actual: '05 - Screening',
          fecha_ultimo_cambio: new Date().toISOString()
        },
        f2_evaluacion: {
          informe_entrevista_ia: {
            experiencia_consolidada: '8+ años desarrollando arquitecturas cloud en microservicios AWS/GCP.',
            alineacion_motivadores: 'Busca rol con alto impacto técnico y ambiente híbrido.',
            pretension_economica_condiciones: {
              pretension_salarial: '5.000 EUR brutos/mes',
              disponibilidad: 'Inmediata',
              modalidad_preferida: 'Híbrido'
            },
            auditoria_veracidad: {
              inconsistencias_detectadas: ['Overlapping entreInditex y Telefónica en 2023'],
              confirmaciones_fortalezas: ['Inglés C1 verificado en conversación']
            },
            proximos_pasos: ['Agendar prueba técnica'],
            fecha_analisis: '2026-08-23T20:00:00.000Z'
          }
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    const candidatos = [
      { id: 'CAND-01', nombre_completo: 'Laura Fernández', puesto: 'Cloud Architect' }
    ];

    const busquedas = [
      { id: 'BUSQ-01', id_busqueda: 'BUSQ-01', perfil_busqueda: 'Cloud Architect', cliente: 'Banco Santander' }
    ];

    const mapped = mapPipelineToEvaluacionCandidates(mockPipeline, candidatos, busquedas);

    assert.strictEqual(mapped.length, 1);
    const candidate = mapped[0];
    assert.ok(candidate.informe_entrevista_ia, 'El candidato mapeado debe poseer el objeto informe_entrevista_ia');
    assert.strictEqual(candidate.informe_entrevista_ia.experiencia_consolidada, '8+ años desarrollando arquitecturas cloud en microservicios AWS/GCP.');
    assert.strictEqual(candidate.informe_entrevista_ia.alineacion_motivadores, 'Busca rol con alto impacto técnico y ambiente híbrido.');
    assert.strictEqual(candidate.informe_entrevista_ia.pretension_economica_condiciones.pretension_salarial, '5.000 EUR brutos/mes');
    assert.strictEqual(candidate.informe_entrevista_ia.auditoria_veracidad.inconsistencias_detectadas.length, 1);
  });

  test('Debería verificar que EntrevistaTable.tsx posee los componentes, densidad y popovers requeridos', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const tableContent = await fs.readFile(path.resolve('src/components/evaluacion/EntrevistaTable.tsx'), 'utf-8');
    assert.ok(tableContent.includes('Experiencia Consolidada'), 'EntrevistaTable debe incluir la columna Experiencia Consolidada');
    assert.ok(tableContent.includes('Alineación y Motivadores'), 'EntrevistaTable debe incluir la columna Alineación y Motivadores');
    assert.ok(tableContent.includes('Pretensión y Condiciones'), 'EntrevistaTable debe incluir la columna Pretensión y Condiciones');
    assert.ok(tableContent.includes('Auditoría de Veracidad'), 'EntrevistaTable debe incluir la columna Auditoría de Veracidad');
    assert.ok(tableContent.includes('NOTAS RECLUTADOR EVALUACIONES'), 'EntrevistaTable debe incluir la columna NOTAS RECLUTADOR EVALUACIONES');
    assert.ok(tableContent.includes('HelpCircle'), 'EntrevistaTable debe utilizar HelpCircle (?) para el desplegable popover en hover');
    assert.ok(tableContent.includes('handleSort'), 'EntrevistaTable debe invocar handleSort en cabeceras');
    assert.ok(tableContent.includes('onOpenTranscriptModal'), 'EntrevistaTable debe disparar onOpenTranscriptModal');
  });

  test('Debería verificar la integración de Lista Entrevista en P-EVA-01 (page.tsx)', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const evalPageContent = await fs.readFile(path.resolve('src/app/evaluacion/page.tsx'), 'utf-8');
    assert.ok(evalPageContent.includes('lista_entrevista'), 'P-EVA-01 (page.tsx) debe soportar el estado viewMode "lista_entrevista"');
    assert.ok(evalPageContent.includes('EntrevistaTable'), 'P-EVA-01 (page.tsx) debe importar e integrar EntrevistaTable');
    assert.ok(evalPageContent.includes('AnalizarTranscripcionModal'), 'P-EVA-01 (page.tsx) debe integrar AnalizarTranscripcionModal');
    
    // Verificar orden del botón: a continuación de "Lista detallada"
    const listaDetalladaIdx = evalPageContent.indexOf('<span>Lista detallada</span>');
    const listaEntrevistaIdx = evalPageContent.indexOf('<span>Lista Entrevista</span>');
    const listaTestIdx = evalPageContent.indexOf('<span>Lista Test Personalidad</span>');

    assert.ok(listaDetalladaIdx !== -1, 'Boton Lista detallada debe existir');
    assert.ok(listaEntrevistaIdx !== -1, 'Boton Lista Entrevista debe existir');
    assert.ok(listaTestIdx !== -1, 'Boton Lista Test Personalidad debe existir');
    assert.ok(listaDetalladaIdx < listaEntrevistaIdx, 'El botón Lista Entrevista debe estar a continuación de Lista detallada');
    assert.ok(listaEntrevistaIdx < listaTestIdx, 'El botón Lista Entrevista debe preceder a Lista Test Personalidad');
  });

  test('Debería verificar que page.tsx de P-EVA-01 soporta ordenamiento por columnas de entrevista de screening', async () => {
    const fs = await import('node:fs/promises');
    const path = await import('node:path');

    const evalPageContent = await fs.readFile(path.resolve('src/app/evaluacion/page.tsx'), 'utf-8');
    assert.ok(evalPageContent.includes('sortField === "exp_entrevista"'), 'page.tsx debe soportar ordenamiento por exp_entrevista');
    assert.ok(evalPageContent.includes('sortField === "alig_entrevista"'), 'page.tsx debe soportar ordenamiento por alig_entrevista');
    assert.ok(evalPageContent.includes('sortField === "pretension"'), 'page.tsx debe soportar ordenamiento por pretension');
    assert.ok(evalPageContent.includes('sortField === "auditoria"'), 'page.tsx debe soportar ordenamiento por auditoria');
  });

});
