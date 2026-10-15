import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import './prepare-public.mjs';

// The former generator has been retired: it would overwrite the new homepage.
const root = fileURLToPath(new URL('../', import.meta.url));
for (const [file, args] of [
  ['node_modules/typescript/bin/tsc', ['--noEmit']],
  ['node_modules/vite/bin/vite.js', ['build']],
  ['scripts/package-site.mjs', []],
  ['scripts/check-site.mjs', []],
]) {
  execFileSync(process.execPath, [resolve(root, file), ...args], { cwd: root, stdio: 'inherit' });
}
