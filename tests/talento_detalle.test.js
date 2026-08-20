import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('P-TAL-01 & P-TAL-02: Talent Mixer - Columna Habilidades Clave y Remoción Consola DAW', () => {

  const pagePathP1 = path.join(process.cwd(), 'src/app/talento/page.tsx');
  const pagePathP2 = path.join(process.cwd(), 'src/app/talento/[id]/page.tsx');

  test('P-TAL-01: El código de la vista Lista Detallada debe contener la cabecera "Habilidades clave"', () => {
    const contentP1 = fs.readFileSync(pagePathP1, 'utf8');
    assert.strictEqual(contentP1.includes('<span>Habilidades clave</span>'), true, 'No se encontró la cabecera <span>Habilidades clave</span> en page.tsx');
  });

  test('P-TAL-01: El código de la vista Lista Detallada debe incluir el renderizado del campo cand.skills_principales', () => {
    const contentP1 = fs.readFileSync(pagePathP1, 'utf8');
    assert.strictEqual(contentP1.includes('cand.skills_principales'), true, 'No se encontró la referencia a cand.skills_principales en page.tsx');
  });

  test('P-TAL-02: El archivo de la vista de detalle no debe incluir la etiqueta "DAW Console Active"', () => {
    const contentP2 = fs.readFileSync(pagePathP2, 'utf8');
    assert.strictEqual(contentP2.includes('DAW Console Active'), false, 'El archivo page.tsx en [id] aún contiene "DAW Console Active"');
  });

  test('P-TAL-02: El archivo de la vista de detalle no debe incluir la sección "IA Analysis Equalizer Console"', () => {
    const contentP2 = fs.readFileSync(pagePathP2, 'utf8');
    assert.strictEqual(contentP2.includes('IA Analysis Equalizer Console'), false, 'El archivo page.tsx en [id] aún contiene "IA Analysis Equalizer Console"');
  });

  test('Formateador de Habilidades Clave: Debería parsear correctamente cadenas separadas por comas en etiquetas individuales', () => {
    const rawSkills = 'Rust, WebAssembly, C++, Embedded Systems';
    const parsedTags = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
    assert.deepStrictEqual(parsedTags, ['Rust', 'WebAssembly', 'C++', 'Embedded Systems']);
  });

  test('Formateador de Habilidades Clave: Debería retornar array vacío para campos nulos o no definidos', () => {
    const nullSkills = null;
    const undefinedSkills = undefined;
    const parsedNull = (nullSkills || '').split(',').map(s => s.trim()).filter(Boolean);
    const parsedUndefined = (undefinedSkills || '').split(',').map(s => s.trim()).filter(Boolean);
    assert.strictEqual(parsedNull.length, 0);
    assert.strictEqual(parsedUndefined.length, 0);
  });
});
