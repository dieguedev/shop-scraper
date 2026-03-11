import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export async function isProcessRunning(processName) {
  try {
    const { stdout } = await execAsync(`tasklist /FI "IMAGENAME eq ${processName}" /NH`, {
      windowsHide: true,
    });

    return stdout.toLowerCase().includes(processName.toLowerCase());
  } catch (err) {
    console.error(`Error al verificar proceso ${processName}:`, err.message);
    return false;
  }
}
