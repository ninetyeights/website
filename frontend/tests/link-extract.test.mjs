import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/link-extract.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { extractLinks, formatLinks, DEFAULT_LINK_OPTIONS: defaults } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const extract = (input, patch = {}) => extractLinks(input, { ...defaults, format: 'text', ...patch });

test('prose punctuation, balanced parentheses, order and default preservation', () => {
  const data = extract('看 https://example.com/a_(b)?q=1#x。还有（https://example.org/path/）。重复 https://example.com/a_(b)?q=1#x');
  assert.deepEqual(data.results.map(row => row.href), ['https://example.com/a_(b)?q=1#x', 'https://example.org/path/']);
  assert.equal(data.duplicates, 1); assert.equal(data.results[0].count, 2);
  assert.equal(extract('https://e.test/a https://e.test/a/ https://e.test/a?q=1').results.length, 3);
  assert.equal(extract('https://e.test https://e.test', { dedupe: false }).results.length, 2);
});
test('markdown inline, reference, collapsed, shortcut, escaped brackets and code/image exclusions', () => {
  const input = '[A](https://e.test/a_(b) "title") [B][id] [id][] [id] [a\\]b](/relative)\n[id]: https://e.test/ref\n![image](https://e.test/image.png) `https://e.test/code`\n```\nhttps://e.test/fenced\n```\n<https://e.test/auto>';
  const rows = extract(input, { format: 'markdown' }).results;
  assert.deepEqual(rows.map(row => row.href), ['https://e.test/a_(b)', 'https://e.test/ref', '/relative', 'https://e.test/auto']);
  assert.equal(rows[1].count, 3); assert.equal(rows[2].title, 'a]b'); assert(rows[2].relative);
});
test('base resolution, domain, ID and explicit cleanup operate independently', () => {
  const input = '[user](../users/123/?x=1#info) [network](//cdn.test/a)';
  const rows = extract(input, { format: 'markdown', base: 'https://example.com/folder/' }).results;
  assert.equal(rows[0].href, 'https://example.com/users/123/?x=1#info'); assert.equal(rows[0].pathEnd, '123');
  assert.equal(rows[1].href, 'https://cdn.test/a');
  const cleaned = extract(input, { format: 'markdown', base: 'https://example.com/folder/', trimSlash: true, removeQuery: true, removeHash: true }).results[0];
  assert.equal(cleaned.href, 'https://example.com/users/123'); assert.equal(cleaned.original, '../users/123/?x=1#info');
  assert.throws(() => extract('https://e.test', { base: 'not a URL' }), /基础网址/);
});
test('optional contacts and www recognition, blocked schemes and relative records', () => {
  assert.equal(extract('www.example.com mailto:a@example.com tel:+123').results.length, 0);
  assert.deepEqual(extract('www.example.com mailto:a@example.com tel:+123', { www: true, contacts: true }).results.map(row => row.href), ['https://www.example.com', 'mailto:a@example.com', 'tel:+123']);
  const data = extract('[x](javascript:alert(1)) [y](data:text/plain,hi) [z](#section)', { format: 'markdown' });
  assert.equal(data.skipped, 2); assert.equal(data.results[0].href, '#section'); assert(data.results[0].relative);
});
test('legacy plain rows select last URL or keep fallback text and duplicates', () => {
  const data = extract('https://e.test/a https://e.test/b\nno link\nhttps://e.test/b', { format: 'auto', table: 'last', fallback: true, dedupe: false });
  assert.deepEqual(data.results.map(row => row.href), ['https://e.test/b', 'no link', 'https://e.test/b']);
  assert.equal(data.results[1].domain, '行内文本'); assert.equal(data.results[0].pathEnd, 'b');
});
test('field selection, CSV escaping and spreadsheet formula protection', () => {
  const rows = extract('[=SUM(1)](https://e.test/a)', { format: 'markdown' }).results;
  const fields = { title: true, href: true, pathEnd: false };
  assert.equal(formatLinks(rows, 'links', fields), 'https://e.test/a');
  assert.equal(formatLinks(rows, 'columns', fields), "'=SUM(1)\thttps://e.test/a");
  assert.match(formatLinks(rows, 'csv', fields), /"'=SUM\(1\)"/);
  assert.equal(formatLinks(rows, 'columns', { title: false, href: false, pathEnd: true }), 'a');
  assert.equal(formatLinks(rows, 'csv', { title: false, href: false, pathEnd: false }), '');
  assert.equal(formatLinks(rows, 'markdown', fields), '[=SUM(1)](<https://e.test/a>)');
});
test('large inputs and result sets are accepted without truncation', () => {
  assert.equal(extract('x'.repeat(500001)).results.length, 0);
  const data = extract('https://e.test\n'.repeat(5001), { dedupe: false });
  assert.equal(data.results.length, 5001);
  assert.equal(data.found, 5001);
  assert.equal(extract('['.repeat(100000), { format: 'markdown' }).results.length, 0);
});
