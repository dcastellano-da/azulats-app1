import test from "node:test";
import assert from "node:assert/strict";
import { mapPipelineToPresentacionCandidates } from "../src/lib/presentacion.ts";
import { mapPipelineToCierreCandidates } from "../src/lib/cierre.ts";

test("Integración Global de Pantallas: Indexación multiclave de busqMap", async (t) => {
  await t.test("mapPipelineToPresentacionCandidates resuelve búsquedas por id_busqueda o codigo_busqueda", () => {
    const mockBusquedas = [
      {
        id_busqueda: "firestore-uuid-999",
        codigo_busqueda: "REQ-HUMAN-999",
        cliente: "Empresa Test",
        perfil_busqueda: "Arquitecto Cloud",
        estado_sla: { estado_busqueda: "Abierta" }
      }
    ];

    const mockCandidatos = [
      {
        id: "cand-123",
        identificacion: { nombre_completo: "Ana Gómez" }
      }
    ];

    const mockPipeline = [
      {
        id: "pipe-100",
        claves_conexion: {
          id_busqueda: "firestore-uuid-999",
          id_candidato: "cand-123"
        },
        flujo: {
          estado_actual: "09_shortlist"
        }
      },
      {
        id: "pipe-101",
        claves_conexion: {
          id_busqueda: "REQ-HUMAN-999",
          id_candidato: "cand-123"
        },
        flujo: {
          estado_actual: "10_entrevista_cliente"
        }
      }
    ];

    const result = mapPipelineToPresentacionCandidates(mockPipeline, mockCandidatos, mockBusquedas);
    
    assert.equal(result.length, 2);
    assert.equal(result[0].role, "Arquitecto Cloud");
    assert.equal(result[0].client, "Empresa Test");
    assert.equal(result[0].searchId, "firestore-uuid-999");
    assert.equal(result[1].role, "Arquitecto Cloud");
    assert.equal(result[1].client, "Empresa Test");
  });

  await t.test("mapPipelineToCierreCandidates resuelve búsquedas por id_busqueda o codigo_busqueda", () => {
    const mockBusquedas = [
      {
        id_busqueda: "firestore-uuid-888",
        codigo_busqueda: "REQ-HUMAN-888",
        cliente: "Banco Central",
        perfil_busqueda: "Lead DevOps",
        estado_sla: { estado_busqueda: "Cerrada" }
      }
    ];

    const mockCandidatos = [
      {
        id: "cand-456",
        identificacion: { nombre_completo: "Carlos Ruiz" }
      }
    ];

    const mockPipeline = [
      {
        id: "pipe-200",
        claves_conexion: {
          id_busqueda: "firestore-uuid-888",
          id_candidato: "cand-456"
        },
        flujo: {
          estado_actual: "13_contratado"
        }
      }
    ];

    const result = mapPipelineToCierreCandidates(mockPipeline, mockCandidatos, mockBusquedas);
    
    assert.equal(result.length, 1);
    assert.equal(result[0].role, "Lead DevOps");
    assert.equal(result[0].client, "Banco Central");
    assert.equal(result[0].searchId, "firestore-uuid-888");
  });

  await t.test("Coincidencia de filtro por Búsqueda cuando cand.puesto difiere de busq.perfil_busqueda", () => {
    const busq = {
      id_busqueda: "sWFxhFJxgnD3ttTPH8E0",
      codigo_busqueda: "sWFxhFJxgnD3ttTPH8E0",
      cliente: "CLIENTE PRUEBA",
      perfil_busqueda: "Desarrollador iOS Nativo (PRUEBA!)"
    };

    const cand = {
      id: "c5995018",
      name: "Eva Ballesteros Carrasco",
      puesto: "No especificado"
    };

    const mappedCandidate = {
      searchId: busq.id_busqueda,
      searchCode: busq.codigo_busqueda,
      searchRole: busq.perfil_busqueda,
      searchClient: busq.cliente,
      name: cand.name,
      role: cand.puesto, // "No especificado"
      client: busq.cliente // "CLIENTE PRUEBA"
    };

    const selectedSearchStr = `${busq.cliente} - ${busq.perfil_busqueda}`; // "CLIENTE PRUEBA - Desarrollador iOS Nativo (PRUEBA!)"
    
    const searchRoleCombined = `${mappedCandidate.searchClient || mappedCandidate.client} - ${mappedCandidate.searchRole || mappedCandidate.role}`;
    const matches = 
      selectedSearchStr === "Todos" ||
      mappedCandidate.searchId === selectedSearchStr ||
      mappedCandidate.searchCode === selectedSearchStr ||
      searchRoleCombined === selectedSearchStr ||
      `${mappedCandidate.client} - ${mappedCandidate.role}` === selectedSearchStr;

    assert.equal(matches, true, "El candidato debe coincidir con el filtro de búsqueda seleccionada aunque su puesto sea 'No especificado'");
  });
});
