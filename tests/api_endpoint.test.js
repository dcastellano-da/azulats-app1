import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { getApiEndpoint } from '../src/utils/api.ts';

describe('Normalización de Endpoints API (getApiEndpoint)', () => {
  test('a) Normaliza URL cuando NEXT_PUBLIC_API_URL incluye /api/v1', () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    const originalAtsEnv = process.env.NEXT_PUBLIC_ATS_API_URL;

    try {
      delete process.env.NEXT_PUBLIC_ATS_API_URL;
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080/api/v1";

      assert.equal(
        getApiEndpoint("candidatos/importar-ia"),
        "http://localhost:8080/api/v1/candidatos/importar-ia"
      );

      assert.equal(
        getApiEndpoint("/candidatos/importar-ia"),
        "http://localhost:8080/api/v1/candidatos/importar-ia"
      );

      assert.equal(
        getApiEndpoint("api/v1/candidatos/importar-ia"),
        "http://localhost:8080/api/v1/candidatos/importar-ia"
      );

      assert.equal(
        getApiEndpoint("candidatos/cand_123/cv?token=xyz"),
        "http://localhost:8080/api/v1/candidatos/cand_123/cv?token=xyz"
      );
    } finally {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
      process.env.NEXT_PUBLIC_ATS_API_URL = originalAtsEnv;
    }
  });

  test('b) Normaliza URL cuando la variable de entorno carece del sufijo /api/v1', () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    const originalAtsEnv = process.env.NEXT_PUBLIC_ATS_API_URL;

    try {
      delete process.env.NEXT_PUBLIC_ATS_API_URL;
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080";

      assert.equal(
        getApiEndpoint("candidatos/importar-ia"),
        "http://localhost:8080/api/v1/candidatos/importar-ia"
      );

      assert.equal(
        getApiEndpoint("api/v1/candidatos/importar-ia"),
        "http://localhost:8080/api/v1/candidatos/importar-ia"
      );
    } finally {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
      process.env.NEXT_PUBLIC_ATS_API_URL = originalAtsEnv;
    }
  });

  test('c) Da prioridad a NEXT_PUBLIC_ATS_API_URL sobre NEXT_PUBLIC_API_URL', () => {
    const originalEnv = process.env.NEXT_PUBLIC_API_URL;
    const originalAtsEnv = process.env.NEXT_PUBLIC_ATS_API_URL;

    try {
      process.env.NEXT_PUBLIC_API_URL = "http://localhost:8080/api/v1";
      process.env.NEXT_PUBLIC_ATS_API_URL = "https://api.cloudrun.app";

      assert.equal(
        getApiEndpoint("candidatos"),
        "https://api.cloudrun.app/api/v1/candidatos"
      );
    } finally {
      process.env.NEXT_PUBLIC_API_URL = originalEnv;
      process.env.NEXT_PUBLIC_ATS_API_URL = originalAtsEnv;
    }
  });
});
