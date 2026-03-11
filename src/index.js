import 'dotenv/config';
import { launchClient } from './launchClient.js';
import { waitForLockfile } from './readLockfile.js';
import { loginWithKeyboard } from './riotClient.js';
import { getStoreFeatured, extractSkinSales } from './lcuApi.js';
import { upsertSkinSales } from './supabase.js';

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

  console.log('1. Lanzando el Riot Client...');
  await launchClient(RIOT_CLIENT_PATH);

  console.log('2. Iniciando sesión (teclado automático)...');
  await loginWithKeyboard(RIOT_USERNAME, RIOT_PASSWORD);

  console.log('3. Esperando a que League of Legends arranque...');
  const { port, password } = await waitForLockfile(LOL_INSTALL_PATH);
  console.log(`   Lockfile leído — puerto: ${port}`);

  console.log('4. Obteniendo datos de la tienda via LCU API...');
  const storeData = await getStoreFeatured(port, password);

  const skins = extractSkinSales(storeData);
  console.log(`   ${skins.length} skins en oferta encontradas.`);
  skins.forEach(s => console.log(`   - ${s.name}: ${s.original_rp} → ${s.sale_rp} RP (-${s.percent_off}%)`));

  console.log('5. Subiendo datos a Supabase...');
  await upsertSkinSales(SUPABASE_URL, SUPABASE_KEY, skins);

  console.log('Hecho.');
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
