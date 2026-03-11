import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export async function killProcess(processName) {
  try {
    console.log(`   Cerrando proceso: ${processName}...`);
    await execAsync(`taskkill /IM "${processName}" /F /T`, {
      windowsHide: true,
    });
    console.log(`   ✓ ${processName} cerrado correctamente`);
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('no se encontró')) {
      console.log(`   (${processName} ya no estaba en ejecución)`);
    } else {
      console.error(`   Error al cerrar ${processName}:`, err.message);
    }
  }
}
