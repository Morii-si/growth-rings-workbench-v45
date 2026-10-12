import { build } from 'vite';
import { cp } from 'node:fs/promises';
await build();
// The logo is referenced by the runtime HTML template; preserve its relative URL.
await cp('assets', 'dist/assets', { recursive: true });
