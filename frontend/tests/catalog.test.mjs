import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';

const compiled = ts.transpileModule(readFileSync(new URL('../src/lib/catalog-state.ts', import.meta.url), 'utf8'), {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 },
}).outputText;
const { parseCatalog, selectEnabled, isEntryEnabled } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const entry = (kind, slug, enabled = true, sort_order = 10) => ({ kind, slug, enabled, sort_order });

test('catalog filters disabled, unknown and opposite-kind records and preserves configured order', () => {
  const entries = parseCatalog({ entries: [entry('tool', 'first', true, 20), entry('tool', 'second', true, 1), entry('tool', 'disabled', false), entry('project', 'first'), entry('tool', 'unknown')] });
  const items = [{ slug: 'first' }, { slug: 'second' }, { slug: 'disabled' }, { slug: 'unregistered' }];
  assert.deepEqual(selectEnabled(items, entries, 'tool').map(item => item.slug), ['second', 'first']);
  assert.equal(isEntryEnabled(entries, 'tool', 'disabled'), false);
  assert.equal(isEntryEnabled(entries, 'tool', 'unregistered'), false);
  assert.deepEqual(selectEnabled(items, [], 'tool'), []);
});

test('malformed catalog never falls back to enabling pages', () => {
  for (const input of [null, {}, { entries: null }, { entries: [entry('other', 'x')] }, { entries: [entry('tool', 'x', 'false')] }, { entries: [entry('tool', 'x', true, -1)] }, { entries: [entry('tool', 'x'), entry('tool', 'x')] }]) {
    assert.throws(() => parseCatalog(input));
  }
});
