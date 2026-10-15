import { cp, mkdir } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const publicRoot = new URL('public/', root);
await mkdir(publicRoot, { recursive: true });
await cp(new URL('assets/', root), new URL('assets/', publicRoot), { recursive: true });
await cp(new URL('favicon.ico', root), new URL('favicon.ico', publicRoot));
