import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function loginWithKeyboard(username, password) {
  return new Promise((resolve, reject) => {
    const __dirname = fileURLToPath(new URL('.', import.meta.url));
    const pythonScript = join(__dirname, 'riot_login.py');
    
    const py = spawn('python', [pythonScript, username, password], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    py.stdout.on('data', (data) => {
      const output = data.toString().trim();
      stdout += output + '\n';
      console.log(`   ${output}`);
    });
    
    py.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    py.on('close', (code) => {
      if (code !== 0) {
        const errorMsg = stderr || `Python script exited with code ${code}`;
        return reject(new Error(`Error en login automático: ${errorMsg}`));
      }
      
      console.log('   Credenciales enviadas al Riot Client.');
      resolve();
    });
    
    py.on('error', (err) => {
      reject(new Error(`Error al ejecutar Python: ${err.message}. Asegúrate de que Python esté instalado y en PATH.`));
    });
  });
}
