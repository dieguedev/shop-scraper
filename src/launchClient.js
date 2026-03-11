import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';

export function launchClient(riotClientPath) {
  return new Promise((resolve, reject) => {
    if (!existsSync(riotClientPath)) {
      return reject(new Error(`No se encontró el ejecutable en: ${riotClientPath}`));
    }

    const child = exec(`"${riotClientPath}" --launch-product=league_of_legends --launch-patchline=live`, {
      windowsHide: false,
    });

    child.on('error', (err) => reject(err));

    setTimeout(() => resolve(child), 2000);
  });
}
