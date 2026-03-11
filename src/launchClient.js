import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

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

export function launchLeagueOfLegends(lolInstallPath) {
  return new Promise((resolve, reject) => {
    const leagueClientPath = join(lolInstallPath, 'LeagueClient.exe');
    
    if (!existsSync(leagueClientPath)) {
      return reject(new Error(`No se encontró LeagueClient.exe en: ${leagueClientPath}`));
    }

    console.log(`   Lanzando: ${leagueClientPath}`);
    const child = exec(`"${leagueClientPath}"`, {
      windowsHide: false,
    });

    child.on('error', (err) => reject(err));

    setTimeout(() => resolve(child), 3000);
  });
}
