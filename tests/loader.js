import { pathToFileURL } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const projectRoot = process.cwd();

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/headers') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,export async function cookies(){ return { get: () => ({ value: "mock-auth-token-stage-1" }) }; }'
    };
  }
  if (specifier === 'next/cache') {
    return {
      shortCircuit: true,
      url: 'data:text/javascript,export function revalidatePath(){}; export function revalidateTag(){};'
    };
  }
  if (specifier.startsWith('next/')) {
    const subpath = specifier.slice(5);
    const targetFile = path.join(projectRoot, `node_modules/next/${subpath}.js`);
    if (fs.existsSync(targetFile)) {
      return {
        shortCircuit: true,
        url: pathToFileURL(targetFile).href
      };
    }
  }
  if (specifier.startsWith('@/')) {
    const relPath = specifier.slice(2);
    const basePath = path.join(projectRoot, 'src', relPath);
    for (const ext of ['', '.ts', '.tsx', '.js', '.jsx', '/index.ts', '/index.tsx', '/index.js']) {
      const fullPath = basePath + ext;
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        return {
          shortCircuit: true,
          url: pathToFileURL(fullPath).href
        };
      }
    }
  }
  return nextResolve(specifier, context);
}
