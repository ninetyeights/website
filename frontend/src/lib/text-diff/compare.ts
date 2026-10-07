import { normalize, type IgnoreOptions } from './normalization';
import { diffTokens, tokenize, type Mode, type Budget, type Token } from './engine';
export type { Mode } from './engine';
export type CompareOptions = IgnoreOptions & { mode: Mode };
export const defaultOptions: CompareOptions = { mode: 'auto', ignoreCase: false, ignoreSpaces: false, collapseSpaces: false, ignoreNewlines: false, trim: false };
export const MAX_LENGTH = 100_000;
export type Operation = {
  type: 'equal' | 'insert' | 'delete' | 'replace';
  leftRange: [number, number]; rightRange: [number, number];
  leftText: string; rightText: string; difference?: number;
  detail?: Operation[];
};
export type CompareResult = {
  mode: Exclude<Mode, 'auto'>; identical: boolean; exactIdentical: boolean; coarse: boolean;
  leftLength: number; rightLength: number; differenceCount: number; similarity: number;
  statistics: { insert: number; delete: number; replace: number };
  operations: Operation[]; blocks: Operation[][];
};

function operations(left: string, right: string, opts: CompareOptions, mode: Exclude<Mode, 'auto'>, budget: Budget): Operation[] {
  const a = normalize(left, opts), b = normalize(right, opts);
  const make = (type: Operation['type'], l0: number, l1: number, r0: number, r1: number): Operation => ({ type, leftRange: [l0, l1], rightRange: [r0, r1], leftText: left.slice(l0, l1), rightText: right.slice(r0, r1) });
  if (a.text === b.text) return [make('equal', 0, left.length, 0, right.length)];
  const at = tokenize(a, mode), bt = tokenize(b, mode);
  const boundary = (tokens: Token[], i: number, source: string) => i === 0 ? 0 : i === tokens.length ? source.length : tokens[i].start;
  const runs = diffTokens(at, bt, budget);
  const output: Operation[] = [];
  let ai = 0, bi = 0;
  for (let i = 0; i < runs.length; i++) {
    const run = runs[i];
    const a0 = boundary(at, ai, left), b0 = boundary(bt, bi, right);
    const equal = run.kind === 'equal';
    const previousAi = ai, previousBi = bi;
    ai += run.left; bi += run.right;
    while (!equal && runs[i + 1] && runs[i + 1].kind !== 'equal') { ai += runs[++i].left; bi += runs[i].right; }
    const a1 = ai === at.length ? left.length : boundary(at, ai, left);
    const b1 = bi === bt.length ? right.length : boundary(bt, bi, right);
    const type = equal ? 'equal' : ai === previousAi ? 'insert' : bi === previousBi ? 'delete' : 'replace';
    output.push(make(type, a0, a1, b0, b1));
  }
  return output;
}

// Equal lines delimit display blocks. Each pair of blocks shares a height in the
// renderer, so an insertion cannot shift all subsequent anchors out of alignment.
function toBlocks(ops: Operation[]): Operation[][] {
  const blocks: Operation[][] = [];
  let current: Operation[] = [];
  for (const op of ops) {
    if (op.type !== 'equal') { current.push(op); continue; }
    const left = op.leftText.match(/[^\r\n]*(?:\r\n|\r|\n)|[^\r\n]+$/gu) ?? [];
    const right = op.rightText.match(/[^\r\n]*(?:\r\n|\r|\n)|[^\r\n]+$/gu) ?? [];
    if (left.length !== right.length || !left.length) { current.push(op); continue; }
    let l = op.leftRange[0], r = op.rightRange[0];
    for (let i = 0; i < left.length; i++) {
      // Keep the first boundary beside a change precise; batch long equal runs
      // so newline-heavy input cannot create 100,000 separate rendered rows.
      const count = current.length ? 1 : Math.min(20, left.length - i);
      const leftText = left.slice(i, i + count).join(''), rightText = right.slice(i, i + count).join('');
      current.push({ ...op, leftText, rightText, leftRange: [l, l + leftText.length], rightRange: [r, r + rightText.length] });
      l += leftText.length; r += rightText.length;
      i += count - 1;
      if (/[\r\n]$/u.test(leftText) && /[\r\n]$/u.test(rightText)) { blocks.push(current); current = []; }
    }
  }
  if (current.length) blocks.push(current);
  return blocks;
}

export function compare(left: string, right: string, options: Partial<CompareOptions> = {}): CompareResult {
  if (left.length > MAX_LENGTH || right.length > MAX_LENGTH) throw new Error('每侧最多支持 100,000 个字符，请分段比较。');
  const opts = { ...defaultOptions, ...options };
  const mode = opts.mode === 'auto' ? /[\r\n]/u.test(left + right) ? 'line' : /\p{Script=Han}/u.test(left + right) || left.length + right.length < 120 ? 'character' : 'word' : opts.mode;
  const budget = { remaining: 4_000_000, coarse: false };
  const ops = operations(left, right, opts, mode, budget);
  const statistics = { insert: 0, delete: 0, replace: 0 };
  let differenceCount = 0;
  for (const op of ops) if (op.type !== 'equal') {
    op.difference = differenceCount++;
    statistics[op.type]++;
    if (mode === 'line' && op.type === 'replace') op.detail = operations(op.leftText, op.rightText, opts, 'character', budget);
  }
  const normalizedLeft = normalize(left, opts), normalizedRight = normalize(right, opts);
  const matchedLength = (starts: number[], side: 'leftRange' | 'rightRange') => {
    let index = 0, matched = 0;
    for (const offset of starts) {
      while (index < ops.length - 1 && offset >= ops[index][side][1]) index++;
      if (ops[index]?.type === 'equal') matched++;
    }
    return matched;
  };
  const equalLength = matchedLength(normalizedLeft.starts, 'leftRange') + matchedLength(normalizedRight.starts, 'rightRange');
  const totalLength = normalizedLeft.text.length + normalizedRight.text.length;
  return {
    mode, identical: differenceCount === 0, exactIdentical: left === right, coarse: budget.coarse,
    leftLength: left.length, rightLength: right.length, differenceCount,
    similarity: totalLength ? Math.round(1000 * equalLength / totalLength) / 10 : 100,
    statistics, operations: ops, blocks: toBlocks(ops),
  };
}

export function formatResult(result: CompareResult): string {
  return result.operations.map(op => op.type === 'equal' ? op.rightText : `${op.leftText ? `[-${op.leftText}-]` : ''}${op.rightText ? `[+${op.rightText}+]` : ''}`).join('');
}
