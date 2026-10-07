import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const compile = text => 'data:text/javascript;base64,' + Buffer.from(ts.transpileModule(text, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText).toString('base64');
const lib = compile(readFileSync(new URL('../src/lib/link-extract.ts', import.meta.url), 'utf8'));
const { DEFAULT_LINK_OPTIONS } = await import(lib);
const source = readFileSync(new URL('../src/lib/link-table.ts', import.meta.url), 'utf8').replace("'./link-extract'", JSON.stringify(lib));
const { parseTableText, extractLinkTable, tableValues, formatTable, tableClipboardHtml } = await import(compile(source));
const options = { ...DEFAULT_LINK_OPTIONS, format: 'text', fallback: true };
const fields = { title: false, href: true, pathEnd: false };
test('single cell, horizontal, vertical, sparse rectangles and final empty columns keep their positions', () => {
  for (const input of ['A', 'A\tB\tC', 'A\nB\nC', 'A\t\tB\n\t\t\nC\tD\t', '\t\n\t']) {
    const expected = parseTableText(input);
    const width = Math.max(...expected.map(row => row.length));
    const table = extractLinkTable(input, options);
    assert.deepEqual(tableValues(table, fields, true), expected.map(row => [...row, ...Array(width - row.length).fill('')]));
  }
  assert.deepEqual(parseTableText('A\r\n\r\n'), [['A'], ['']]);
  assert.deepEqual(parseTableText(''), []);
});
test('quoted cells with tabs, newlines and quotes round-trip as spreadsheet TSV', () => {
  const values = [['a\nb', 'a\tb', '"quoted"', ''], ['', '中文', 'a,b', '']];
  assert.deepEqual(parseTableText(formatTable(values)), values);
  assert.deepEqual(parseTableText(formatTable([['A'], [''], ['']])), [['A'], [''], ['']]);
  assert.throws(() => parseTableText('"unclosed'), /未闭合/);
  assert.throws(() => parseTableText('"closed"x'), /引号格式/);
});
test('duplicate links, mixed plain URLs and text, field expansion, cell-level selection', () => {
  const input = 'https://e.test/1\t\thttps://e.test/1\ntext\thttps://e.test/2 https://e.test/3\t';
  const table = extractLinkTable(input, options);
  assert.deepEqual(tableValues(table, fields, true), [['https://e.test/1', '', 'https://e.test/1'], ['text', 'https://e.test/2\nhttps://e.test/3', '']]);
  assert.equal(tableValues(table, fields, false)[1][0], '');
  const expanded = tableValues(table, {title:true,href:true,pathEnd:true}, true);
  assert(expanded.every(row => row.length === 9));
  assert.deepEqual(expanded[0].slice(0,6), ['', 'https://e.test/1', '1', '', '', '']);
  assert.equal(tableValues(extractLinkTable(input, {...options,table:'last'}),fields,true)[1][1], 'https://e.test/3');
});
test('export escapes HTML and spreadsheet formulas, and large tables retain all cells', () => {
  const values = [['=SUM(1)', '<img src=x>', 'a\nb']];
  assert.match(formatTable(values), /^'=SUM/);
  const html = tableClipboardHtml(values);
  assert(html.includes('&lt;img src=x&gt;')); assert(!html.includes('<img')); assert(html.includes('a<br>b'));
  assert.equal(extractLinkTable('\t'.repeat(255), options).width, 256);
  assert.equal(extractLinkTable('x'.repeat(500001), options).cells[0][0].text.length, 500001);
  const table = extractLinkTable(Array.from({ length: 5001 }, (_, i) => `https://e.test/${i}`).join('\n'), options);
  assert.equal(table.cells.length, 5001);
  assert.equal(table.cells[5000][0].links[0].href, 'https://e.test/5000');
});

test('capacity boundaries include trailing blanks and rectangular padding', () => {
  assert.equal(parseTableText('x\n'.repeat(10000)).length, 10000);
  assert.throws(() => parseTableText('x\n'.repeat(10001)), /容量限制/);
  assert.throws(() => parseTableText('\t'.repeat(256)), /容量限制/);
  const row = Array(250).fill('x').join('\t');
  assert.equal(parseTableText(Array(200).fill(row).join('\n')).length, 200);
  assert.throws(() => parseTableText(Array(201).fill(row).join('\n')), /容量限制/);
  assert.throws(() => parseTableText(row + '\n'.repeat(201)), /容量限制/);
  assert.equal(parseTableText('x'.repeat(2000000))[0][0].length, 2000000);
  assert.throws(() => parseTableText('x'.repeat(2000001)), /内容过大/);
  assert.throws(() => extractLinkTable('x'.repeat(2000001), options), /内容过大/);
});
