import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
let root;
try {
  root = dirname(require.resolve('braces/package.json'));
} catch (error) {
  if (error.code === 'MODULE_NOT_FOUND' && (process.env.npm_config_omit || '').split(/\s+/).includes('dev')) {
    console.log('braces is absent from this install with development dependencies omitted.');
    process.exit(0);
  }
  throw error;
}
const patch = JSON.parse(readFileSync(new URL('../patches/braces-3.0.3.json', import.meta.url), 'utf8'));
const digest = (data) => createHash('sha256').update(data).digest('hex');
if (JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')).version !== patch.version) {
  throw new Error('braces version changed: review the upstream fix and remove or update the temporary patch.');
}
// Validate every file before writing any; unexpected upstream contents must fail installation.
for (const file of patch.files) {
  let current;
  try { current = readFileSync(join(root, file.path), 'utf8'); } catch (error) {
    if (error.code !== 'ENOENT' || file.before !== null) throw error;
  }
  if (current !== file.after && (file.before === null ? current !== undefined : digest(current) !== file.before)) {
    throw new Error(`Unexpected braces file ${file.path}; refusing to apply temporary patch.`);
  }
}
for (const file of patch.files) writeFileSync(join(root, file.path), file.after);
console.log('Applied temporary braces 3.0.3 nesting protection (GHSA-vfj7-8cjw-p6xm).');
