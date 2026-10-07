export type InputFormat = 'auto' | 'text' | 'html' | 'markdown';
export type TableMode = 'all' | 'first' | 'last';
export type LinkOptions = { format: InputFormat; table: TableMode; fallback: boolean; dedupe: boolean; www: boolean; contacts: boolean; base: string; trimSlash: boolean; removeQuery: boolean; removeHash: boolean };
export const DEFAULT_LINK_OPTIONS: LinkOptions = { format: 'auto', table: 'all', fallback: false, dedupe: true, www: false, contacts: false, base: '', trimSlash: false, removeQuery: false, removeHash: false };
export type Candidate = { href: string; title: string; source: string; text?: boolean };
export type ExtractedLink = Candidate & { original: string; domain: string; pathEnd: string; relative: boolean; count: number };

function trimProse(value: string) {
  let result = value.replace(/[.,;:!?，。；：！？、]+$/u, '');
  for (const [left, right] of [['(', ')'], ['[', ']'], ['{', '}']]) {
    while (result.endsWith(right) && result.split(right).length > result.split(left).length) result = result.slice(0, -1);
  }
  return result;
}
export function textLinks(text: string, options: Pick<LinkOptions, 'www' | 'contacts'>): Candidate[] {
  const pattern = /(?:https?:\/\/|www\.|mailto:|tel:)[^\s<>"'`\u0000-\u001f，。；！？、（）【】]+/giu;
  return [...text.matchAll(pattern)].filter(match => {
    const before = text[(match.index ?? 0) - 1];
    return (!before || !/[\w@]/.test(before)) && (options.www || !/^www\./i.test(match[0])) && (options.contacts || !/^(mailto|tel):/i.test(match[0]));
  }).map(match => ({ href: trimProse(match[0]), title: '', source: '文本' }));
}

// Scan balanced brackets rather than using a greedy whole-document regex.
function closing(text: string, start: number, left: string, right: string) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '\\') { i++; continue; }
    if (text[i] === left) depth++;
    if (text[i] === right && --depth === 0) return i;
    if (text[i] !== right && text[i] !== left) continue;
  }
  return -1;
}
const unescapeMarkdown = (value: string) => value.replace(/\\([!"#$%&'()*+,\-./:;<=>?@[\]\\^_`{|}~])/g, '$1');
const referenceKey = (value: string) => unescapeMarkdown(value).trim().replace(/\s+/g, ' ').toLowerCase();
function destination(value: string) {
  const input = value.trim();
  if (input.startsWith('<')) { const end = input.indexOf('>'); return end < 0 ? '' : unescapeMarkdown(input.slice(1, end)); }
  const match = /^(?:\\.|[^\s])*/.exec(input);
  return unescapeMarkdown(match?.[0] ?? '');
}
export function markdownLinks(input: string, options: LinkOptions): Candidate[] {
  // Code examples and images are not hyperlinks. Keep newlines for references.
  let fence = '';
  const text = input.split('\n').map(line => {
    const marker = /^ {0,3}(`{3,}|~{3,})/.exec(line)?.[1];
    if (fence) { if (marker && marker[0] === fence[0] && marker.length >= fence.length) fence = ''; return ''; }
    if (marker) { fence = marker; return ''; }
    return line;
  }).join('\n').replace(/(`+)[\s\S]*?\1/g, '');
  const references = new Map<string, string>();
  const body = text.replace(/^ {0,3}\[([^\]\n]+)\]:[ \t]*(.+)$/gm, (_, name: string, value: string) => {
    const key = referenceKey(name);
    if (!references.has(key)) references.set(key, destination(value));
    return '';
  });
  const results: Candidate[] = [];
  let plain = '';
  const flush = () => { results.push(...textLinks(plain, options)); plain = ''; };
  for (let i = 0; i < body.length; i++) {
    if (body[i] === '\\' && i + 1 < body.length) { plain += body[i + 1]; i++; continue; }
    const image = body[i] === '!' && body[i + 1] === '[';
    const start = image ? i + 1 : i;
    if (body[start] !== '[') { plain += body[i]; continue; }
    const end = closing(body, start, '[', ']');
    if (end < 0) { plain += body.slice(i); break; }
    const title = unescapeMarkdown(body.slice(start + 1, end));
    let href = '', consumed = end;
    if (body[end + 1] === '(') {
      const finish = closing(body, end + 1, '(', ')');
      if (finish < 0) { plain += body.slice(i); break; }
      if (finish >= 0) { href = destination(body.slice(end + 2, finish)); consumed = finish; }
    } else if (body[end + 1] === '[') {
      const finish = closing(body, end + 1, '[', ']');
      if (finish >= 0) { href = references.get(referenceKey(body.slice(end + 2, finish) || title)) ?? ''; consumed = finish; }
    } else href = references.get(referenceKey(title)) ?? '';
    if (href || image) {
      flush(); if (!image && href) results.push({ href, title, source: 'Markdown' }); i = consumed;
    } else { plain += body.slice(i, end + 1); i = end; }
  }
  flush(); return results;
}

export function htmlLinks(input: string, options: LinkOptions): Candidate[] {
  // Template content remains inert: never mount pasted markup, run scripts, or
  // load image/iframe resources. Read literal href, not the host page's base URL.
  const template = document.createElement('template');
  template.innerHTML = input;
  const root = template.content;
  root.querySelectorAll('script,style,iframe,object,embed,template,noscript').forEach(node => node.remove());
  const anchor = (el: Element, source: string): Candidate => ({ href: el.getAttribute('href') ?? '', title: el.textContent?.trim().replace(/\s+/g, ' ') ?? '', source });
  const rows = [...root.querySelectorAll('tr')].filter(row => !row.parentElement?.closest('tr'));
  if (options.table !== 'all' || options.fallback) {
    const containers = rows.length ? rows : [root];
    return containers.flatMap((row, index) => {
      const links = [...row.querySelectorAll('a[href]')].map(el => anchor(el, rows.length ? `表格第 ${index + 1} 行` : 'HTML'));
      if (links.length) return options.table === 'first' ? links.slice(0, 1) : options.table === 'last' ? links.slice(-1) : links;
      const text = row.textContent?.trim().replace(/\s+/g, ' ') ?? '';
      return options.fallback && text ? [{ href: text, title: '', source: rows.length ? `表格第 ${index + 1} 行` : 'HTML', text: true }] : [];
    });
  }
  const results: Candidate[] = [];
  const walk = (node: Node) => {
    if (node.nodeType === Node.ELEMENT_NODE && (node as Element).tagName === 'A') { results.push(anchor(node as Element, 'HTML')); return; }
    if (node.nodeType === Node.TEXT_NODE) { results.push(...textLinks(node.textContent ?? '', options)); return; }
    node.childNodes.forEach(walk);
  };
  root.childNodes.forEach(walk); return results;
}

export function organize(candidates: Candidate[], options: LinkOptions) {
  let base: URL | undefined;
  if (options.base.trim()) {
    try { base = new URL(options.base.trim()); if (!['http:', 'https:'].includes(base.protocol)) throw new Error(); }
    catch { throw new Error('基础网址须为完整的 http:// 或 https:// 地址。'); }
  }
  const results: ExtractedLink[] = [], seen = new Map<string, ExtractedLink>();
  let skipped = 0, duplicates = 0;
  for (const candidate of candidates) {
    const original = candidate.href.trim();
    let href = original, relative = false, domain = '', pathEnd = '';
    if (!original) { skipped++; continue; }
    const scheme = /^([a-z][a-z\d+.-]*):/i.exec(href)?.[1].toLowerCase();
    const plainText = !!candidate.text && !scheme && !/^(?:www\.|[/?#]|\.\.?\/)/i.test(href);
    if (plainText) { domain = '行内文本'; pathEnd = original.split(/[?#]/)[0].replace(/\/+$/, '').split('/').pop() ?? ''; }
    else {
      if (scheme && !['http', 'https', ...(options.contacts ? ['mailto', 'tel'] : [])].includes(scheme)) { skipped++; continue; }
      if (/[\s\u0000-\u001f\u007f]/.test(href)) { skipped++; continue; }
      if (/^www\./i.test(href)) {
        if (!options.www && !candidate.text) { skipped++; continue; }
        href = `https://${href}`;
      }
      relative = !/^[a-z][a-z\d+.-]*:/i.test(href);
      try {
        if (relative && base) { href = new URL(href, base).href; relative = false; }
        const parsed = new URL(href, relative ? 'https://relative.invalid/' : undefined);
        if (!['http:', 'https:', ...(options.contacts ? ['mailto:', 'tel:'] : [])].includes(parsed.protocol)) { skipped++; continue; }
        domain = relative ? '未解析相对地址' : parsed.hostname || parsed.protocol.slice(0, -1);
        pathEnd = ['http:', 'https:'].includes(parsed.protocol) ? parsed.pathname.replace(/\/+$/, '').split('/').pop() ?? '' : '';
      } catch { skipped++; continue; }
      if (options.removeHash) href = href.split('#')[0];
      if (options.removeQuery) href = href.replace(/\?[^#]*/, '');
      if (options.trimSlash) {
        // Only alter path suffixes, never the slashes in https:// or //host.
        href = href.replace(/^(https?:\/\/[^/?#]+|\/\/[^/?#]+)?([^?#]*)([?#].*)?$/i, (_, authority = '', path: string, suffix = '') => authority + path.replace(/\/+$/, '') + suffix);
        if (!href) href = '/';
      }
    }
    const key = `${plainText ? 'text' : 'link'}:${href}`;
    const existing = seen.get(key);
    if (existing) { duplicates++; if (options.dedupe) { existing.count++; continue; } }
    const row = { ...candidate, text: plainText, href, original, relative, domain, pathEnd, count: 1 };
    seen.set(key, row); results.push(row);
  }
  return { results, skipped, duplicates };
}
export function extractLinks(input: string, options: LinkOptions) {
  const format = options.format === 'auto' ? /<(?:!doctype\b|!--|\/?[a-z][a-z\d-]*(?:\s[^<>]*|\/?)>)/i.test(input) ? 'html' : options.fallback ? 'text' : 'markdown' : options.format;
  let candidates = format === 'html' ? htmlLinks(input, options) : format === 'markdown' ? markdownLinks(input, options) : textLinks(input, options);
  if (format === 'text' && options.fallback) candidates = input.split(/\r?\n/).filter(line => line.trim()).flatMap((line, i) => {
    const links = textLinks(line, options);
    return links.length ? options.table === 'first' ? links.slice(0, 1) : options.table === 'last' ? links.slice(-1) : links : [{ href: line.trim(), title: '', source: `第 ${i + 1} 行`, text: true }];
  });
  return { ...organize(candidates, options), format, found: candidates.length };
}
export type OutputFormat = 'links' | 'columns' | 'markdown' | 'csv';
export type OutputFields = { title: boolean; href: boolean; pathEnd: boolean };
export function formatLinks(rows: ExtractedLink[], format: OutputFormat, fields: OutputFields): string {
  if (format === 'links') return rows.map(row => row.href).join('\n');
  if (format === 'markdown') return rows.map(row => row.text ? row.href : `[${(row.title || row.href).replace(/[\\[\]]/g, '\\$&').replace(/[\r\n]/g, ' ')}](<${row.href.replace(/</g, '%3C').replace(/>/g, '%3E')}>)`).join('\n');
  const keys = (['title', 'href', 'pathEnd'] as const).filter(key => fields[key]);
  if (!keys.length) return '';
  const labels = { title: '链接文字', href: '链接', pathEnd: '路径末段' };
  const cell = (value: string) => {
    // Prevent spreadsheet formulas in pasted/exported user-controlled cells.
    const safe = /^[\s]*[=+@-]/.test(value) ? `'${value}` : value;
    return format === 'csv' ? `"${safe.replace(/"/g, '""')}"` : safe.replace(/[\t\r\n]/g, ' ');
  };
  const lines = rows.map(row => keys.map(key => cell(row[key])).join(format === 'csv' ? ',' : '\t'));
  return (format === 'csv' ? [keys.map(key => cell(labels[key])).join(','), ...lines] : lines).join('\n');
}
