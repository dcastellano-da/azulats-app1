import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('P-TAL-01: Lista Detallada - Columna y Ordenamiento por Origen del Perfil', () => {
  const mockCandidatos = [
    {
      id: 'cand-001',
      nombre_completo: 'Diego Lozano',
      email: 'diego@example.com',
      puesto: 'Software Architect',
      origen: 'Directo ATS',
      createdAt: '2026-07-20T10:00:00Z',
      estado_revision: 'Pendiente'
    },
    {
      id: 'cand-002',
      nombre_completo: 'María Belmonte',
      email: 'maria@example.com',
      puesto: 'UX Research Lead',
      origen: 'LinkedIn InMail',
      createdAt: '2026-07-18T14:30:00Z',
      estado_revision: 'Revisado'
    },
    {
      id: 'cand-003',
      nombre_completo: 'Javier Galdón',
      email: 'javier@example.com',
      puesto: 'Senior React Developer',
      origen: 'Referido',
      createdAt: '2026-07-15T09:15:00Z',
      estado_revision: 'Seleccionado'
    },
    {
      id: 'cand-004',
      nombre_completo: 'Carlos Tejera',
      email: 'carlos@example.com',
      puesto: 'Data Engineer',
      origen: 'Headhunting',
      createdAt: '2026-07-14T11:20:00Z',
      estado_revision: 'Pendiente'
    }
  ];

  // Helper sorting function replicating sortedCandidatos logic from src/app/talento/page.tsx
  const sortCandidatos = (list, sortField, sortDirection = 'asc') => {
    return [...list].sort((a, b) => {
      if (!sortField) return 0;
      let aVal = '';
      let bVal = '';

      switch (sortField) {
        case 'origen':
          aVal = a.origen || '';
          bVal = b.origen || '';
          break;
        case 'nombre':
          aVal = a.nombre_completo || '';
          bVal = b.nombre_completo || '';
          break;
        default:
          return 0;
      }

      if (typeof aVal === 'string') {
        const cmp = aVal.localeCompare(bVal);
        return sortDirection === 'asc' ? cmp : -cmp;
      }
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });
  };

  test('Debería ordenar candidatos por Origen del Perfil en orden ascendente', () => {
    const sorted = sortCandidatos(mockCandidatos, 'origen', 'asc');
    const origenes = sorted.map(c => c.origen);
    assert.deepStrictEqual(origenes, [
      'Directo ATS',
      'Headhunting',
      'LinkedIn InMail',
      'Referido'
    ]);
  });

  test('Debería ordenar candidatos por Origen del Perfil en orden descendente', () => {
    const sorted = sortCandidatos(mockCandidatos, 'origen', 'desc');
    const origenes = sorted.map(c => c.origen);
    assert.deepStrictEqual(origenes, [
      'Referido',
      'LinkedIn InMail',
      'Headhunting',
      'Directo ATS'
    ]);
  });

  test('Debería manejar correctamente candidatos sin origen (fallback a valor vacío en ordenamiento)', () => {
    const candidatosSinOrigen = [
      { id: '1', nombre_completo: 'Ana', origen: 'Portal Empleo' },
      { id: '2', nombre_completo: 'Bernardo', origen: null },
      { id: '3', nombre_completo: 'Clara', origen: 'Manual' }
    ];

    const sortedAsc = sortCandidatos(candidatosSinOrigen, 'origen', 'asc');
    assert.strictEqual(sortedAsc[0].id, '2'); // null / vacío al inicio en asc
    assert.strictEqual(sortedAsc[1].origen, 'Manual');
    assert.strictEqual(sortedAsc[2].origen, 'Portal Empleo');

    const sortedDesc = sortCandidatos(candidatosSinOrigen, 'origen', 'desc');
    assert.strictEqual(sortedDesc[0].origen, 'Portal Empleo');
    assert.strictEqual(sortedDesc[1].origen, 'Manual');
    assert.strictEqual(sortedDesc[2].id, '2'); // null / vacío al final en desc
  });
});
