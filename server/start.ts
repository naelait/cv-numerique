import { execSync } from 'node:child_process';

const PORT = Number(process.env.PORT ?? 3001);

function listeningPidsWindows(port: number): string[] {
  let output = '';
  try {
    output = execSync('netstat -ano', { encoding: 'utf8' });
  } catch {
    return [];
  }

  const pids = new Set<string>();
  for (const line of output.split(/\r?\n/)) {
    if (!line.includes('LISTENING')) continue;
    // Match :3001 but not :30010
    if (!new RegExp(`:${port}\\s`).test(line)) continue;
    const parts = line.trim().split(/\s+/);
    const pid = parts.at(-1);
    if (pid && /^\d+$/.test(pid) && pid !== '0') pids.add(pid);
  }
  return [...pids];
}

function freePort(port: number): void {
  if (process.platform === 'win32') {
    for (const pid of listeningPidsWindows(port)) {
      console.log(`Freeing port ${port} (PID ${pid})…`);
      try {
        execSync(`taskkill /PID ${pid} /F /T`, { stdio: 'ignore' });
      } catch {
        // already gone
      }
    }
    return;
  }

  try {
    execSync(`fuser -k ${port}/tcp`, { stdio: 'ignore' });
  } catch {
    // ignore
  }
}

async function main(): Promise<void> {
  freePort(PORT);
  // Windows needs a beat after taskkill before the socket is reusable
  await new Promise((r) => setTimeout(r, 1200));
  await import('./index.ts');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
