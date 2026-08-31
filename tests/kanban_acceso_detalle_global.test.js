import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Vistas Kanban: Verificación de Acceso Dual a Detalles del Postulante (P-TAL-01/02, P-DIS-01/02, P-EVA-01/02, P-PRE-01/02, P-CIE-01/02)', () => {

  const pathTalento = path.join(process.cwd(), 'src/app/talento/page.tsx');
  const pathDescubrimiento = path.join(process.cwd(), 'src/app/descubrimiento/page.tsx');
  const pathEvaluacion = path.join(process.cwd(), 'src/app/evaluacion/page.tsx');
  const pathPresentacion = path.join(process.cwd(), 'src/app/presentacion/page.tsx');
  const pathCierre = path.join(process.cwd(), 'src/app/cierre/page.tsx');

  test('P-TAL-01: El código del Kanban debe contener el nombre del candidato envuelto en Link a /talento/[id]', () => {
    const content = fs.readFileSync(pathTalento, 'utf8');
    assert.strictEqual(content.includes('href={`/talento/${cand.id}`}'), true, 'No se encontró el enlace al detalle en P-TAL-01');
    assert.strictEqual(content.includes('{cand.nombre_completo}'), true, 'No se encontró cand.nombre_completo en P-TAL-01');
  });

  test('P-TAL-01: El botón de Detalles debe incluir las clases de destacado primario turquesa acentuado y ChevronRight', () => {
    const content = fs.readFileSync(pathTalento, 'utf8');
    assert.strictEqual(content.includes('bg-[#6bd8cb]/10'), true, 'No se encontró bg-[#6bd8cb]/10 en P-TAL-01');
    assert.strictEqual(content.includes('text-[#6bd8cb]'), true, 'No se encontró text-[#6bd8cb] en P-TAL-01');
    assert.strictEqual(content.includes('ChevronRight'), true, 'No se encontró ChevronRight en P-TAL-01');
  });

  test('P-DIS-01: El código del Kanban debe tener el nombre del candidato envuelto en Link a /descubrimiento/[id]', () => {
    const content = fs.readFileSync(pathDescubrimiento, 'utf8');
    assert.strictEqual(content.includes('href={`/descubrimiento/${cad.pipeId || cad.id}`}'), true, 'No se encontró el enlace al expediente en P-DIS-01');
  });

  test('P-DIS-01: El botón de Detalles debe tener el estilo primario acentuado y ChevronRight', () => {
    const content = fs.readFileSync(pathDescubrimiento, 'utf8');
    assert.strictEqual(content.includes('bg-[#6bd8cb]/10'), true, 'No se encontró bg-[#6bd8cb]/10 en P-DIS-01');
    assert.strictEqual(content.includes('text-[#6bd8cb]'), true, 'No se encontró text-[#6bd8cb] en P-DIS-01');
    assert.strictEqual(content.includes('ChevronRight'), true, 'No se encontró ChevronRight en P-DIS-01');
  });

  test('P-EVA-01: El nombre del candidato debe ser un elemento interactivo para ver expediente P-EVA-02', () => {
    const content = fs.readFileSync(pathEvaluacion, 'utf8');
    assert.strictEqual(content.includes('onSelect(cad)'), true, 'No se encontró la invocación onSelect(cad) en P-EVA-01');
  });

  test('P-EVA-01: El botón de Detalles debe poseer la paleta acentuada turquesa y el icono ChevronRight (->)', () => {
    const content = fs.readFileSync(pathEvaluacion, 'utf8');
    assert.strictEqual(content.includes('bg-[#6bd8cb]/10'), true, 'No se encontró bg-[#6bd8cb]/10 en P-EVA-01');
    assert.strictEqual(content.includes('text-[#6bd8cb]'), true, 'No se encontró text-[#6bd8cb] en P-EVA-01');
    assert.strictEqual(content.includes('ChevronRight'), true, 'No se encontró ChevronRight en P-EVA-01');
  });

  test('P-PRE-01: El nombre del candidato debe permitir navegar al detalle P-PRE-02', () => {
    const content = fs.readFileSync(pathPresentacion, 'utf8');
    assert.strictEqual(content.includes('onSelect(cad)'), true, 'No se encontró onSelect(cad) en P-PRE-01');
  });

  test('P-PRE-01: El botón de Detalles debe incorporar el estilo destacado primario y ChevronRight (->)', () => {
    const content = fs.readFileSync(pathPresentacion, 'utf8');
    assert.strictEqual(content.includes('bg-[#6bd8cb]/10'), true, 'No se encontró bg-[#6bd8cb]/10 en P-PRE-01');
    assert.strictEqual(content.includes('text-[#6bd8cb]'), true, 'No se encontró text-[#6bd8cb] en P-PRE-01');
    assert.strictEqual(content.includes('ChevronRight'), true, 'No se encontró ChevronRight en P-PRE-01');
  });

  test('P-CIE-01: El nombre del candidato debe activar onSelect(cad) para P-CIE-02', () => {
    const content = fs.readFileSync(pathCierre, 'utf8');
    assert.strictEqual(content.includes('onSelect(cad)'), true, 'No se encontró onSelect(cad) en P-CIE-01');
  });

  test('P-CIE-01: El botón de Detalles debe incluir el estilo primario acentuado y ChevronRight (->)', () => {
    const content = fs.readFileSync(pathCierre, 'utf8');
    assert.strictEqual(content.includes('bg-[#6bd8cb]/10'), true, 'No se encontró bg-[#6bd8cb]/10 en P-CIE-01');
    assert.strictEqual(content.includes('text-[#6bd8cb]'), true, 'No se encontró text-[#6bd8cb] en P-CIE-01');
    assert.strictEqual(content.includes('ChevronRight'), true, 'No se encontró ChevronRight en P-CIE-01');
  });
});
