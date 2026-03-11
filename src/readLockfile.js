import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const LOCKFILE_NAME = 'lockfile';
const POLL_INTERVAL_MS = 3000;
const MAX_WAIT_MS = 120_000;

export function parseLockfile(content) {
  const parts = content.trim().split(':');

  if (parts.length < 5) {
    throw new Error(`Formato de lockfile inválido: ${content}`);
  }

  const [processName, processId, port, password, protocol] = parts;

  return { processName, processId, port, password, protocol };
}

export function waitForLockfile(lolInstallPath) {
  const lockfilePath = join(lolInstallPath, LOCKFILE_NAME);

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const check = () => {
      if (existsSync(lockfilePath)) {
        try {
          const content = readFileSync(lockfilePath, 'utf-8');
          if (content.trim().length > 0) {
            console.log(`Lockfile encontrado en: ${lockfilePath}`);
            return resolve(parseLockfile(content));
          }
        } catch {
          // El archivo puede estar siendo escrito todavía
        }
      }

      if (Date.now() - startTime > MAX_WAIT_MS) {
        return reject(new Error(`Timeout: el lockfile no apareció después de ${MAX_WAIT_MS / 1000}s`));
      }

      console.log(`Esperando lockfile... (${Math.round((Date.now() - startTime) / 1000)}s)`);
      setTimeout(check, POLL_INTERVAL_MS);
    };

    check();
  });
}
