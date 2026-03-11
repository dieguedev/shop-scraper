import { readFileSync, existsSync, statSync, unlinkSync } from 'node:fs';
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

export function readLockfileIfExists(lolInstallPath) {
  const lockfilePath = join(lolInstallPath, LOCKFILE_NAME);

  if (!existsSync(lockfilePath)) {
    return null;
  }

  try {
    const content = readFileSync(lockfilePath, 'utf-8');
    if (content.trim().length > 0) {
      return parseLockfile(content);
    }
  } catch (err) {
    console.error('Error al leer lockfile:', err.message);
  }

  return null;
}

export function waitForLockfile(lolInstallPath, waitForNew = false) {
  const lockfilePath = join(lolInstallPath, LOCKFILE_NAME);

  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    let initialMtime = null;

    if (waitForNew && existsSync(lockfilePath)) {
      try {
        initialMtime = statSync(lockfilePath).mtimeMs;
        console.log('   Esperando a que el lockfile se actualice...');
      } catch {
        // Ignorar error
      }
    }

    const check = () => {
      if (existsSync(lockfilePath)) {
        try {
          const content = readFileSync(lockfilePath, 'utf-8');
          if (content.trim().length > 0) {
            if (waitForNew && initialMtime !== null) {
              const currentMtime = statSync(lockfilePath).mtimeMs;
              if (currentMtime <= initialMtime) {
                console.log(`   Lockfile no actualizado aún... (${Math.round((Date.now() - startTime) / 1000)}s)`);
                setTimeout(check, POLL_INTERVAL_MS);
                return;
              }
            }
            
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
