import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('P-DIS-02: Búsqueda Relacionada Destacada e Integración No Invasiva de Expediente P-TAL-02', () => {

  const pagePathPDis02 = path.join(process.cwd(), 'src/app/descubrimiento/[id]/page.tsx');

  test('P-DIS-02: El archivo debe contener la cabecera destacada de Búsqueda Relacionada al Pipeline', () => {
    const content = fs.readFileSync(pagePathPDis02, 'utf8');
    assert.strictEqual(content.includes('Búsqueda Relacionada al Pipeline'), true, 'No se encontró el texto "Búsqueda Relacionada al Pipeline"');
    assert.strictEqual(content.includes('activeBusquedaObj?.codigo_busqueda'), true, 'No se encontró la referencia a activeBusquedaObj?.codigo_busqueda');
  });

  test('P-DIS-02: El archivo debe incluir la sección de acordeón de Ficha Completa del Postulante (P-TAL-02)', () => {
    const content = fs.readFileSync(pagePathPDis02, 'utf8');
    assert.strictEqual(content.includes('Ficha Completa del Postulante (P-TAL-02)'), true, 'No se encontró la cabecera del acordeón "Ficha Completa del Postulante (P-TAL-02)"');
    assert.strictEqual(content.includes('isTalentoAccordionOpen'), true, 'No se encontró el estado de control de acordeón isTalentoAccordionOpen');
  });

  test('P-DIS-02: El archivo debe incluir los campos de candidato de P-TAL-02 (email, telefono_movil, skills_principales, nivel_ingles, resumen, rubros)', () => {
    const content = fs.readFileSync(pagePathPDis02, 'utf8');
    assert.strictEqual(content.includes('cand.email'), true, 'No se encontró cand.email en P-DIS-02');
    assert.strictEqual(content.includes('cand.telefono_movil'), true, 'No se encontró cand.telefono_movil en P-DIS-02');
    assert.strictEqual(content.includes('cand.skills_principales'), true, 'No se encontró cand.skills_principales en P-DIS-02');
    assert.strictEqual(content.includes('cand.nivel_ingles'), true, 'No se encontró cand.nivel_ingles en P-DIS-02');
    assert.strictEqual(content.includes('cand.resumen'), true, 'No se encontró cand.resumen en P-DIS-02');
    assert.strictEqual(content.includes('cand.rubros'), true, 'No se encontró cand.rubros en P-DIS-02');
  });

  test('Formateador de Habilidades Clave: Debería convertir correctamente la cadena en etiquetas separadas por comas', () => {
    const rawSkills = 'TypeScript, React, Next.js, Node.js';
    const tags = rawSkills.split(',').map(s => s.trim()).filter(Boolean);
    assert.deepStrictEqual(tags, ['TypeScript', 'React', 'Next.js', 'Node.js']);
  });
});
