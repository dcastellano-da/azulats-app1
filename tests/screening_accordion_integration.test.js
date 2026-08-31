import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('Integración de Sección Desplegable Screening Inteligente IA en P-EVA-02, P-PRE-02 y P-CIE-02', () => {
  const componentPath = path.join(process.cwd(), 'src/app/components/ScreeningAccordionSection.tsx');
  const pEva02Path = path.join(process.cwd(), 'src/app/evaluacion/[id]/page.tsx');
  const pPre02Path = path.join(process.cwd(), 'src/app/presentacion/[id]/page.tsx');
  const pCie02Path = path.join(process.cwd(), 'src/app/cierre/[id]/page.tsx');

  test('Componente ScreeningAccordionSection debe existir y manejar el estado de acordeón y modales', () => {
    assert.strictEqual(fs.existsSync(componentPath), true, 'ScreeningAccordionSection.tsx debe existir');
    const content = fs.readFileSync(componentPath, 'utf8');

    assert.ok(content.includes('ScreeningPanel'), 'Debe incluir la integración de ScreeningPanel');
    assert.ok(content.includes('EvaluarScreeningModal'), 'Debe incluir la integración de EvaluarScreeningModal');
    assert.ok(content.includes('Screening Inteligente IA (Fase 1 / P-DIS-02)'), 'Debe contener el título representativo de la sección');
    assert.ok(content.includes('Fit Score:'), 'Debe desplegar el badge de Fit Score en vista resumen');
    assert.ok(content.includes('Knockout'), 'Debe desplegar la alerta Knockout cuando esté activa');
    assert.ok(content.includes('isOpen'), 'Debe gestionar el estado de apertura/colapso isOpen');
  });

  test('P-EVA-02: Debe importar e integrar ScreeningAccordionSection tras las herramientas de Fase 2', () => {
    assert.strictEqual(fs.existsSync(pEva02Path), true, 'page.tsx de P-EVA-02 debe existir');
    const content = fs.readFileSync(pEva02Path, 'utf8');

    assert.ok(content.includes('ScreeningAccordionSection'), 'P-EVA-02 debe importar e integrar ScreeningAccordionSection');
    assert.ok(content.includes('criteriosBusqueda'), 'P-EVA-02 debe gestionar el estado criteriosBusqueda');
    
    // Check order: ScreeningAccordionSection comes inside lg:col-span-2
    const accordionIdx = content.indexOf('<ScreeningAccordionSection');
    const mainColIdx = content.indexOf('lg:col-span-2');
    const sidebarIdx = content.indexOf('SIDEBAR (col-span-1)');

    assert.ok(accordionIdx > mainColIdx, 'ScreeningAccordionSection debe estar dentro de la columna principal');
    assert.ok(accordionIdx < sidebarIdx, 'ScreeningAccordionSection debe estar ubicada antes del sidebar, al final de la columna principal');
  });

  test('P-PRE-02: Debe importar e integrar ScreeningAccordionSection tras las herramientas de Fase 3', () => {
    assert.strictEqual(fs.existsSync(pPre02Path), true, 'page.tsx de P-PRE-02 debe existir');
    const content = fs.readFileSync(pPre02Path, 'utf8');

    assert.ok(content.includes('ScreeningAccordionSection'), 'P-PRE-02 debe importar e integrar ScreeningAccordionSection');
    assert.ok(content.includes('criteriosBusqueda'), 'P-PRE-02 debe gestionar el estado criteriosBusqueda');

    const accordionIdx = content.indexOf('<ScreeningAccordionSection');
    const mainColIdx = content.indexOf('lg:col-span-2');
    const sidebarIdx = content.indexOf('SIDEBAR (col-span-1)');

    assert.ok(accordionIdx > mainColIdx, 'ScreeningAccordionSection debe estar dentro de la columna principal en P-PRE-02');
    assert.ok(accordionIdx < sidebarIdx, 'ScreeningAccordionSection debe estar ubicada antes del sidebar en P-PRE-02');
  });

  test('P-CIE-02: Debe importar e integrar ScreeningAccordionSection en la columna principal de P-CIE-02', () => {
    assert.strictEqual(fs.existsSync(pCie02Path), true, 'page.tsx de P-CIE-02 debe existir');
    const content = fs.readFileSync(pCie02Path, 'utf8');

    assert.ok(content.includes('ScreeningAccordionSection'), 'P-CIE-02 debe importar e integrar ScreeningAccordionSection');
    assert.ok(content.includes('criteriosBusqueda'), 'P-CIE-02 debe gestionar el estado criteriosBusqueda');

    const accordionIdx = content.indexOf('<ScreeningAccordionSection');
    const mainColIdx = content.indexOf('lg:col-span-2');
    const sidebarIdx = content.indexOf('SIDEBAR (col-span-1)');

    assert.ok(accordionIdx > mainColIdx, 'ScreeningAccordionSection debe estar dentro de la columna principal en P-CIE-02');
    assert.ok(accordionIdx < sidebarIdx, 'ScreeningAccordionSection debe estar ubicada antes del sidebar en P-CIE-02');
  });
});
