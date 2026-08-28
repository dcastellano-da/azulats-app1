import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs/promises';
import path from 'node:path';

describe('Generación de Ficha Técnica de Presentación a Cliente a PDF (Dossier V2)', () => {

  test('Debería exportar la Server Action generarFichaPdfAction en pipeline.ts', async () => {
    const pipelineActions = await import('../src/actions/pipeline.ts');
    assert.strictEqual(typeof pipelineActions.generarFichaPdfAction, 'function', 'debe exportar generarFichaPdfAction');
  });

  test('generarFichaPdfAction en modo mock debería retornar un binario PDF simulado en Base64', async () => {
    process.env.NEXT_PUBLIC_USE_MOCKS = "true";
    const pipelineActions = await import('../src/actions/pipeline.ts');
    
    const res = await pipelineActions.generarFichaPdfAction('pipe-test-pdf-001', {
      incluir_resumen_ia: true,
      incluir_test_personalidad: true,
      incluir_pretension_salarial: true,
      incluir_notas_assessment: true,
      incluir_bitacora: true,
      incluir_trayectoria: true,
      anonimizar_candidato: false
    });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.success, true);
    assert.ok(res.data, 'Debe incluir el string en Base64 del documento PDF');
    assert.strictEqual(res.contentType, 'application/pdf');
  });

  test('Debería verificar que GenerarFichaPdfModal.tsx contempla Branding de Agencia (P-CFG-01) y sello Powered by Azul ATS', async () => {
    const modalPath = path.resolve('src/app/components/GenerarFichaPdfModal.tsx');
    const content = await fs.readFile(modalPath, 'utf-8');

    assert.ok(content.includes('P-CFG-01'), 'El modal debe hacer referencia explícita al Branding de Agencia P-CFG-01');
    assert.ok(content.includes('Powered by Azul ATS'), 'El modal debe visualizar el sello Powered by Azul ATS');
    assert.ok(content.includes('localStorage'), 'El modal debe persistir preferencias en localStorage');
    assert.ok(content.includes('ats_ficha_pdf_preferences'), 'El modal debe usar la clave ats_ficha_pdf_preferences');
    assert.ok(content.includes('Ficha_Tecnica_'), 'El modal debe generar el nombre con el patrón Ficha_Tecnica_[Nombre]_[Puesto].pdf');
    assert.ok(content.includes('URL.createObjectURL'), 'El modal debe descargar mediante URL.createObjectURL');
  });

  test('Debería verificar que evaluacion/[id]/page.tsx integra el botón Generar Ficha (PDF) y el modal', async () => {
    const pagePath = path.resolve('src/app/evaluacion/[id]/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(content.includes('GenerarFichaPdfModal'), 'evaluacion/[id] debe importar e integrar GenerarFichaPdfModal');
    assert.ok(content.includes('Generar Ficha (PDF)'), 'evaluacion/[id] debe contar con el botón Generar Ficha (PDF)');
    assert.ok(content.includes('isFichaPdfModalOpen'), 'evaluacion/[id] debe manejar el estado isFichaPdfModalOpen');
  });

  test('Debería verificar que presentacion/[id]/page.tsx integra el botón Generar Ficha (PDF) y el modal', async () => {
    const pagePath = path.resolve('src/app/presentacion/[id]/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(content.includes('GenerarFichaPdfModal'), 'presentacion/[id] debe importar e integrar GenerarFichaPdfModal');
    assert.ok(content.includes('Generar Ficha (PDF)'), 'presentacion/[id] debe contar con el botón Generar Ficha (PDF)');
    assert.ok(content.includes('isFichaPdfModalOpen'), 'presentacion/[id] debe manejar el estado isFichaPdfModalOpen');
  });

  test('Debería verificar que cierre/[id]/page.tsx integra el botón Generar Ficha (PDF) y el modal', async () => {
    const pagePath = path.resolve('src/app/cierre/[id]/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(content.includes('GenerarFichaPdfModal'), 'cierre/[id] debe importar e integrar GenerarFichaPdfModal');
    assert.ok(content.includes('Generar Ficha (PDF)'), 'cierre/[id] debe contar con el botón Generar Ficha (PDF)');
    assert.ok(content.includes('isFichaPdfModalOpen'), 'cierre/[id] debe manejar el estado isFichaPdfModalOpen');
  });

  test('Debería verificar que talento/[id]/page.tsx integra el botón Generar Ficha (PDF) y el modal', async () => {
    const pagePath = path.resolve('src/app/talento/[id]/page.tsx');
    const content = await fs.readFile(pagePath, 'utf-8');

    assert.ok(content.includes('GenerarFichaPdfModal'), 'talento/[id] debe importar e integrar GenerarFichaPdfModal');
    assert.ok(content.includes('Generar Ficha (PDF)'), 'talento/[id] debe contar con el botón Generar Ficha (PDF)');
    assert.ok(content.includes('isFichaPdfModalOpen'), 'talento/[id] debe manejar el estado isFichaPdfModalOpen');
  });

});
