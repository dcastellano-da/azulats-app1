import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('P-CIE-02: Verificación de eliminación de la sección Facilidades de Cierre e IA — F4', () => {
  const pCie02Path = path.resolve('src/app/cierre/[id]/page.tsx');

  test('P-CIE-02: El archivo page.tsx debe existir', () => {
    assert.strictEqual(fs.existsSync(pCie02Path), true, 'page.tsx de P-CIE-02 debe existir');
  });

  test('P-CIE-02: No debe incluir el título ni la sección Facilidades de Cierre e IA — F4', () => {
    const content = fs.readFileSync(pCie02Path, 'utf8');
    assert.strictEqual(
      content.includes('Facilidades de Cierre e IA — F4'), 
      false, 
      'P-CIE-02 no debe renderizar el título de la sección Facilidades de Cierre e IA — F4'
    );
  });

  test('P-CIE-02: No debe incluir las funciones de simulación local ni estados eliminados', () => {
    const content = fs.readFileSync(pCie02Path, 'utf8');

    assert.strictEqual(content.includes('runPredictiveEngine'), false, 'runPredictiveEngine no debe existir en P-CIE-02');
    assert.strictEqual(content.includes('recalculateOfferSimulator'), false, 'recalculateOfferSimulator no debe existir en P-CIE-02');
    assert.strictEqual(content.includes('generateDraftContract'), false, 'generateDraftContract no debe existir en P-CIE-02');
    assert.strictEqual(content.includes('generateEmpathyFeedback'), false, 'generateEmpathyFeedback no debe existir en P-CIE-02');
    assert.strictEqual(content.includes('triggerPreOnboardingCadence'), false, 'triggerPreOnboardingCadence no debe existir en P-CIE-02');
    assert.strictEqual(content.includes('DiagTab'), false, 'El tipo DiagTab no debe existir en P-CIE-02');
  });

  test('P-CIE-02: Debe conservar la funcionalidad de backend (notas, reuniones, transiciones) y ScreeningAccordionSection', () => {
    const content = fs.readFileSync(pCie02Path, 'utf8');

    assert.ok(content.includes('handleSaveNotes'), 'P-CIE-02 debe conservar handleSaveNotes');
    assert.ok(content.includes('handleSaveMeeting'), 'P-CIE-02 debe conservar handleSaveMeeting');
    assert.ok(content.includes('handleTransitionState'), 'P-CIE-02 debe conservar handleTransitionState');
    assert.ok(content.includes('confirmHireProcessAction'), 'P-CIE-02 debe conservar confirmHireProcessAction');
    assert.ok(content.includes('ScreeningAccordionSection'), 'P-CIE-02 debe conservar ScreeningAccordionSection');
  });
});
