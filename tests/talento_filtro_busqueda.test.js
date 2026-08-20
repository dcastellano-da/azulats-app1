import { test, describe } from 'node:test';
import assert from 'node:assert';

describe('P-TAL-01: Talent Mixer - Filtro de Candidatos por Nombre, Rol, Email, Habilidades Clave y Notas Iniciales', () => {
  const mockCandidatos = [
    {
      id: 'cand-001',
      nombre_completo: 'Diego Lozano',
      email: 'diego.lozano@example.com',
      puesto: 'Software Architect Rust',
      skills_principales: 'Rust, WebAssembly, C++, Embedded Systems',
      notas_iniciales: 'Candidato con gran visión en sistemas distribuidos de baja latencia.',
      estado_revision: 'Pendiente'
    },
    {
      id: 'cand-002',
      nombre_completo: 'María Belmonte',
      email: 'maria.belmonte@example.com',
      puesto: 'UX Research Lead',
      skills_principales: 'Figma, User Research, Test A/B, Wireframing',
      notas_iniciales: 'Perfil senior especializado en metodologías ágiles de diseño.',
      estado_revision: 'Revisado'
    },
    {
      id: 'cand-003',
      nombre_completo: 'Javier Galdón',
      email: 'javier.galdon@example.com',
      puesto: 'Frontend Developer',
      skills_principales: 'React, TypeScript, Next.js, Tailwind CSS',
      notas_iniciales: null,
      estado_revision: 'Seleccionado'
    },
    {
      id: 'cand-004',
      nombre_completo: 'Ana Martínez',
      email: 'ana.martinez@example.com',
      puesto: 'DevOps Specialist',
      skills_principales: null,
      notas_iniciales: undefined,
      estado_revision: 'Descartado'
    }
  ];

  // Helper filter function replicating the logic in src/app/talento/page.tsx
  const filterCandidatos = (candidatos, searchTerm, selectedEstado = 'Todos') => {
    return candidatos.filter(c => {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        (c.nombre_completo || "").toLowerCase().includes(term) ||
        (c.puesto || "").toLowerCase().includes(term) ||
        (c.email || "").toLowerCase().includes(term) ||
        (c.skills_principales || "").toLowerCase().includes(term) ||
        (c.notas_iniciales || "").toLowerCase().includes(term);

      const matchesEstado = 
        selectedEstado === "Todos" || c.estado_revision === selectedEstado;

      return matchesSearch && matchesEstado;
    });
  };

  test('Debería filtrar candidatos por coincidencia en Nombre Completo', () => {
    const result = filterCandidatos(mockCandidatos, 'María');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'cand-002');
  });

  test('Debería filtrar candidatos por coincidencia en Puesto / Rol', () => {
    const result = filterCandidatos(mockCandidatos, 'Architect');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'cand-001');
  });

  test('Debería filtrar candidatos por coincidencia en Email', () => {
    const result = filterCandidatos(mockCandidatos, 'javier.galdon');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'cand-003');
  });

  test('Debería filtrar candidatos por palabras clave en Habilidades Clave (skills_principales)', () => {
    const result = filterCandidatos(mockCandidatos, 'WebAssembly');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'cand-001');
  });

  test('Debería filtrar por Habilidades Clave de forma insensible a mayúsculas y minúsculas', () => {
    const result = filterCandidatos(mockCandidatos, 'figma');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'cand-002');
  });

  test('Debería manejar correctamente candidatos con skills_principales nulas o no definidas (null / undefined)', () => {
    assert.doesNotThrow(() => {
      const result = filterCandidatos(mockCandidatos, 'Docker');
      assert.strictEqual(result.length, 0);
    });
  });

  test('Debería combinar adecuadamente la búsqueda en Habilidades Clave con el filtro de Estado de Revisión', () => {
    // 'TypeScript' pertenece a cand-003 (Seleccionado)
    const matchSeleccionado = filterCandidatos(mockCandidatos, 'TypeScript', 'Seleccionado');
    assert.strictEqual(matchSeleccionado.length, 1);
    assert.strictEqual(matchSeleccionado[0].id, 'cand-003');

    // Mismo término pero filtrando por estado 'Pendiente' -> 0 coincidencias
    const matchPendiente = filterCandidatos(mockCandidatos, 'TypeScript', 'Pendiente');
    assert.strictEqual(matchPendiente.length, 0);
  });

  test('Debería filtrar candidatos por palabras clave en Notas Iniciales', () => {
    const result = filterCandidatos(mockCandidatos, 'sistemas distribuidos');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'cand-001');
  });

  test('Debería filtrar por Notas Iniciales de forma insensible a mayúsculas y minúsculas', () => {
    const result = filterCandidatos(mockCandidatos, 'DISEÑO');
    assert.strictEqual(result.length, 1);
    assert.strictEqual(result[0].id, 'cand-002');
  });

  test('Debería manejar correctamente candidatos con notas_iniciales nulas o no definidas (null / undefined)', () => {
    // Probar búsqueda de un término que no existe para asegurar que no se produzcan excepciones TypeError
    assert.doesNotThrow(() => {
      const result = filterCandidatos(mockCandidatos, 'no-existente');
      assert.strictEqual(result.length, 0);
    });
  });

  test('Debería combinar adecuadamente la búsqueda en Notas Iniciales con el filtro de Estado de Revisión', () => {
    // 'sistemas distribuidos' pertenece a cand-001 (Pendiente)
    const matchPendiente = filterCandidatos(mockCandidatos, 'sistemas distribuidos', 'Pendiente');
    assert.strictEqual(matchPendiente.length, 1);
    assert.strictEqual(matchPendiente[0].id, 'cand-001');

    // Mismo término pero filtrando por estado 'Revisado' -> 0 coincidencias
    const matchRevisado = filterCandidatos(mockCandidatos, 'sistemas distribuidos', 'Revisado');
    assert.strictEqual(matchRevisado.length, 0);
  });
});
