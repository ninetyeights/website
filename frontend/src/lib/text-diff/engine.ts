import type { MappedText } from './normalization';

export type Mode = 'auto' | 'character' | 'word' | 'line';
export type Token = { value: string; start: number; end: number };
export type Run = { kind: 'equal' | 'delete' | 'insert'; left: number; right: number };
export type Budget = { remaining: number; coarse: boolean };

export function tokenize(mapped: MappedText, mode: Exclude<Mode, 'auto'>): Token[] {
  const segments = mode === 'line'
    ? Array.from(mapped.text.matchAll(/[^\r\n]*(?:\r\n|\r|\n)|[^\r\n]+$/gu), m => ({ segment: m[0], index: m.index }))
    : Array.from(new Intl.Segmenter('und', { granularity: mode === 'word' ? 'word' : 'grapheme' }).segment(mapped.text));
  return segments.map(({ segment, index }) => ({
    value: segment, start: mapped.starts[index], end: mapped.ends[index + segment.length - 1],
  }));
}

// Trim shared edges first. A bounded LCS table gives deterministic matches and
// bounded memory even for unrelated inputs. The service discloses coarse output.
export function diffTokens(left: Token[], right: Token[], budget: Budget): Run[] {
  const runs: Run[] = [];
  const push = (kind: Run['kind'], a: number, b: number) => {
    if (!a && !b) return;
    const last = runs.at(-1);
    if (last?.kind === kind) { last.left += a; last.right += b; }
    else runs.push({ kind, left: a, right: b });
  };
  let prefix = 0;
  while (prefix < left.length && prefix < right.length && left[prefix].value === right[prefix].value) prefix++;
  let suffix = 0;
  while (suffix < left.length - prefix && suffix < right.length - prefix && left[left.length - 1 - suffix].value === right[right.length - 1 - suffix].value) suffix++;
  push('equal', prefix, prefix);
  const n = left.length - prefix - suffix, m = right.length - prefix - suffix;
  if (!n || !m) { push('delete', n, 0); push('insert', 0, m); }
  else if ((n + 1) * (m + 1) > budget.remaining) {
    budget.coarse = true;
    push('delete', n, 0); push('insert', 0, m);
  } else {
    budget.remaining -= (n + 1) * (m + 1);
    const width = m + 1;
    const table = new Uint32Array((n + 1) * width);
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) {
      table[i * width + j] = left[prefix + i].value === right[prefix + j].value
        ? table[(i + 1) * width + j + 1] + 1
        : Math.max(table[(i + 1) * width + j], table[i * width + j + 1]);
    }
    let i = 0, j = 0;
    while (i < n || j < m) {
      if (i < n && j < m && left[prefix + i].value === right[prefix + j].value) { push('equal', 1, 1); i++; j++; }
      else if (i < n && (j === m || table[(i + 1) * width + j] >= table[i * width + j + 1])) { push('delete', 1, 0); i++; }
      else { push('insert', 0, 1); j++; }
    }
  }
  push('equal', suffix, suffix);
  return runs;
}
