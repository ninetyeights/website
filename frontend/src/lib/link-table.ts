import { htmlLinks, textLinks, organize, type LinkOptions, type ExtractedLink, type OutputFields } from './link-extract';

export type TableCell = { text: string; links: ExtractedLink[] };
export type LinkTable = { cells: TableCell[][]; width: number; skipped: number; merged: number };
const empty = (): TableCell => ({ text: '', links: [] });
export const TABLE_LIMITS = { rows: 10_000, columns: 256, cells: 50_000, inputLength: 2_000_000 } as const;
const capacityError = () => new Error('表格超出容量限制：最多 10000 行、256 列，展开并补齐空位后最多 50000 个单元格。请缩小复制选区后重试。');
function checkSize(rows: number, columns: number) {
  if (rows > TABLE_LIMITS.rows || columns > TABLE_LIMITS.columns || rows * columns > TABLE_LIMITS.cells) throw capacityError();
}
function checkInput(input: string) {
  if (input.length > TABLE_LIMITS.inputLength) throw new Error('表格内容过大：最多 200 万个字符。请缩小复制选区后重试。');
}

// Spreadsheet TSV allows quotes around cells containing tabs or line breaks.
// One final row separator terminates the last row; further empty rows are kept.
export function parseTableText(input: string): string[][] {
  checkInput(input);
  if (!input) return [];
  const rows: string[][] = []; let row: string[] = [], cell = '', quoted = false, closed = false;
  let width = 0;
  const pushCell = () => {
    width = Math.max(width, row.length + 1);
    checkSize(rows.length + 1, width);
    row.push(cell); cell = ''; closed = false;
  };
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (quoted) {
      if (c === '"') { if (input[i + 1] === '"') { cell += '"'; i++; } else { quoted = false; closed = true; } }
      else cell += c;
    } else if (c === '\t') pushCell();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && input[i + 1] === '\n') i++;
      pushCell(); rows.push(row); row = [];
    } else if (c === '"' && !cell && !closed) quoted = true;
    else { if (closed) throw new Error('表格文本的引号格式不完整，请重新复制，或使用 HTML 表格内容。'); cell += c; }
  }
  if (quoted) throw new Error('表格文本中有未闭合的单元格引号，请重新复制。');
  if (cell || row.length || !/[\r\n]$/.test(input)) { pushCell(); rows.push(row); }
  return rows;
}
export function extractLinkTable(input: string, options: LinkOptions): LinkTable {
  checkInput(input);
  // Validate base even if all cells are empty or ordinary text.
  organize([], options);
  let skipped = 0, merged = 0;
  const convert = (text: string, html?: string): TableCell => {
    const candidates = html === undefined ? textLinks(text, options) : htmlLinks(html, { ...options, table: 'all', fallback: false });
    const parsed = organize(candidates, { ...options, dedupe: false });
    skipped += parsed.skipped;
    const links = options.table === 'first' ? parsed.results.slice(0, 1) : options.table === 'last' ? parsed.results.slice(-1) : parsed.results;
    return { text, links };
  };
  let cells: TableCell[][];
  if (options.format === 'markdown') throw new Error('表格布局支持 HTML 表格或 Tab 分隔文本，请切换输入格式。');
  const html = options.format === 'html' || (options.format === 'auto' && /<table\b/i.test(input));
  if (html && input) {
    const template = document.createElement('template'); template.innerHTML = input;
    const root = template.content;
    root.querySelectorAll('script,style,iframe,object,embed,template,noscript').forEach(node => node.remove());
    const tables = [...root.querySelectorAll('table')];
    if (tables.length !== 1) throw new Error(tables.length ? '检测到多个或嵌套表格，请一次复制一个连续表格选区。' : '没有找到 HTML 表格，请粘贴表格或切换为普通文本。');
    const rows = [...tables[0].querySelectorAll('tr')];
    checkSize(rows.length, 1);
    cells = Array.from({ length: rows.length }, () => []);
    let width = 0;
    const occupied = new Set<string>();
    rows.forEach((row, r) => {
      let column = 0;
      for (const node of [...row.children].filter(node => ['TD', 'TH'].includes(node.tagName))) {
        while (occupied.has(`${r}:${column}`)) column++;
        const span = (name: string) => {
          const raw = node.getAttribute(name);
          if (raw === null) return 1;
          if (!/^\d+$/.test(raw) || !Number.isSafeInteger(Number(raw))) throw new Error('合并单元格范围无效，请重新复制表格。');
          return Number(raw);
        };
        const colspan = span('colspan'), declared = span('rowspan'), rowspan = declared === 0 ? rows.length - r : declared;
        if (colspan > TABLE_LIMITS.columns || rowspan > TABLE_LIMITS.rows) throw capacityError();
        if (colspan < 1 || rowspan < 1 || r + rowspan > rows.length) throw new Error('合并单元格超出复制的表格范围，请复制完整选区。');
        width = Math.max(width, column + colspan);
        checkSize(rows.length, width);
        for (let rr = r; rr < r + rowspan; rr++) for (let cc = column; cc < column + colspan; cc++) {
          const key = `${rr}:${cc}`;
          if (occupied.has(key)) throw new Error('合并单元格相互重叠，无法确定行列位置。');
          occupied.add(key); cells[rr][cc] = empty();
        }
        if (rowspan > 1 || colspan > 1) merged++;
        const clone = node.cloneNode(true) as Element;
        clone.querySelectorAll('br').forEach(br => br.replaceWith('\n'));
        cells[r][column] = convert(clone.textContent ?? '', node.innerHTML);
        column += colspan;
      }
    });
  } else cells = parseTableText(input).map(row => row.map(text => convert(text)));
  const width = cells.reduce((max, row) => Math.max(max, row.length), 0);
  checkSize(cells.length, width);
  cells = cells.map(row => Array.from({ length: width }, (_, c) => row[c] ?? empty()));
  return { cells, width, skipped, merged };
}
export function tableValues(table: LinkTable, fields: OutputFields, keepText: boolean): string[][] {
  const keys = (['title', 'href', 'pathEnd'] as const).filter(key => fields[key]);
  if (!keys.length) return [];
  return table.cells.map(row => row.flatMap(cell => keys.map((key, i) => cell.links.length ? cell.links.map(link => link[key]).join('\n') : keepText && i === 0 ? cell.text : '')));
}
const safe = (value: string) => /^\s*[=+@-]/.test(value) ? `'${value}` : value;
export function formatTable(values: string[][], csv = false): string {
  return values.map(row => row.map(value => {
    const text = safe(value);
    return (row.length === 1 && !text) || /["\t\r\n,]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
  }).join(csv ? ',' : '\t')).join('\r\n');
}
export function tableClipboardHtml(values: string[][]): string {
  const escape = (value: string) => safe(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/\r\n|\r|\n/g, '<br>');
  return `<table>${values.map(row => `<tr>${row.map(value => `<td>${escape(value)}</td>`).join('')}</tr>`).join('')}</table>`;
}
