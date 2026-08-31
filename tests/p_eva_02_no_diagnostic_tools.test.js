import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('P-EVA-02: Verificación de eliminación de Herramientas de Diagnóstico IA — F2', () => {

  test('La vista page.tsx de P-EVA-02 no debe incluir la sección Herramientas de Diagnóstico IA — F2 ni sus subcomponentes', () => {
    const pagePath = path.join(process.cwd(), 'src/app/evaluacion/[id]/page.tsx');
    assert.ok(fs.existsSync(pagePath), 'page.tsx de P-EVA-02 debe existir');

    const content = fs.readFileSync(pagePath, 'utf8');

    // Aserciones de eliminación
    assert.strictEqual(
      content.includes('Herramientas de Diagnóstico IA — F2'),
      false,
      'No debe existir la sección "Herramientas de Diagnóstico IA — F2"'
    );
    assert.strictEqual(
      content.includes('generateDefaultToolsDetails'),
      false,
      'No debe existir la función generateDefaultToolsDetails'
    );
    assert.strictEqual(
      content.includes('DiagTab'),
      false,
      'No debe existir el tipo DiagTab'
    );
    assert.strictEqual(
      content.includes('Detector Crono'),
      false,
      'No debe existir la pestaña Detector Crono'
    );
    assert.strictEqual(
      content.includes('Preguntas STAR'),
      false,
      'No debe existir la pestaña Preguntas STAR'
    );
    assert.strictEqual(
      content.includes('Validador ID'),
      false,
      'No debe existir la pestaña Validador ID'
    );
  });

  test('La librería lib/evaluacion.ts no debe incluir la función generateDefaultToolsDetails', () => {
    const libPath = path.join(process.cwd(), 'src/lib/evaluacion.ts');
    assert.ok(fs.existsSync(libPath), 'lib/evaluacion.ts debe existir');

    const content = fs.readFileSync(libPath, 'utf8');
    assert.strictEqual(
      content.includes('generateDefaultToolsDetails'),
      false,
      'lib/evaluacion.ts no debe exportar generateDefaultToolsDetails'
    );
  });
});
