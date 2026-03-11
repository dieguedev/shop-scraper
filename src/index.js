import 'dotenv/config';
import { launchClient } from './launchClient.js';
import { waitForLockfile, readLockfileIfExists } from './readLockfile.js';
import { loginWithKeyboard } from './riotClient.js';
import { getStoreFeatured, extractSkinSales } from './lcuApi.js';
import { upsertSkinSales } from './supabase.js';
import { isProcessRunning } from './processChecker.js';
import { killProcess } from './processKiller.js';

const {
  SUPABASE_URL,
  SUPABASE_KEY,
  LOL_INSTALL_PATH = 'C:/Riot Games/League of Legends',
  RIOT_CLIENT_PATH = 'C:/Riot Games/Riot Client/RiotClientServices.exe',
  RIOT_USERNAME,
  RIOT_PASSWORD,
} = process.env;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_KEY) {
    throw new Error('Faltan SUPABASE_URL o SUPABASE_KEY en el .env');
  }
  if (!RIOT_USERNAME || !RIOT_PASSWORD) {
    throw new Error('Faltan RIOT_USERNAME o RIOT_PASSWORD en el .env');
  }

  let shouldCloseLol = false;

  console.log('0. Verificando estado de procesos...');
  const lolRunning = await isProcessRunning('LeagueClient.exe');
  const riotClientRunning = await isProcessRunning('RiotClientServices.exe');

  if (lolRunning) {
    console.log('   ⚠️ League of Legends ya está activo.');
    console.log('   → Obteniendo datos sin cerrar el juego (puede que estés jugando).');
    shouldCloseLol = false;

    const lockfileData = readLockfileIfExists(LOL_INSTALL_PATH);
    if (!lockfileData) {
      throw new Error('League está corriendo pero no se pudo leer el lockfile');
    }
    var { port, password } = lockfileData;
  } else {
    if (riotClientRunning) {
      console.log('   Riot Client detectado en segundo plano.');
    } else {
      console.log('   Ningún proceso activo.');
    }
    
    console.log('1. Lanzando el Riot Client...');
    await launchClient(RIOT_CLIENT_PATH);
    
    console.log('2. Iniciando sesión (teclado automático)...');
    await loginWithKeyboard(RIOT_USERNAME, RIOT_PASSWORD);
    shouldCloseLol = true;

    console.log('3. Esperando a que League of Legends arranque...');
    var { port, password } = await waitForLockfile(LOL_INSTALL_PATH, true);
    console.log(`   Lockfile leído — puerto: ${port}`);
  }

  console.log('4. Obteniendo datos de la tienda via LCU API...');
  const storeData = await getStoreFeatured(port, password);

  const skins = extractSkinSales(storeData);
  console.log(`   ${skins.length} skins en oferta encontradas.`);
  skins.forEach(s => console.log(`   - ${s.name}: ${s.original_rp} → ${s.sale_rp} RP (-${s.percent_off}%)`));

  console.log('5. Subiendo datos a Supabase...');
  await upsertSkinSales(SUPABASE_URL, SUPABASE_KEY, skins);

  if (shouldCloseLol) {
    console.log('6. Cerrando League of Legends (iniciado por el script)...');
    await killProcess('LeagueClient.exe');
    await killProcess('RiotClientServices.exe');
  } else {
    console.log('6. League se mantiene abierto (estaba activo antes del script).');
  }

  console.log('Hecho.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
