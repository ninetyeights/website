import { PASSWORD_WORDS } from './password-words';

export type PasswordMode = 'random' | 'words' | 'pin';
export type PasswordOptions = {
  mode: PasswordMode; length: number; upper: boolean; lower: boolean; numbers: boolean; symbols: boolean;
  customSymbols: string; excludeConfusing: boolean; requireAll: boolean;
  wordCount: number; separator: string; capitalize: boolean; addNumber: boolean;
  pinLength: number; avoidRepeat: boolean; avoidSequential: boolean; count: number;
};
export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  mode: 'random', length: 16, upper: true, lower: true, numbers: true, symbols: true,
  customSymbols: '!@#$%^&*()_+-=[]{}|;:,.<>?', excludeConfusing: false, requireAll: true,
  wordCount: 6, separator: '-', capitalize: false, addNumber: false,
  pinLength: 6, avoidRepeat: false, avoidSequential: false, count: 1,
};
export const WORD_COUNT = PASSWORD_WORDS.length;
const DIGITS = '0123456789';
const SYMBOLS = /^[!-/:-@[-`{-~]+$/;
export type FillRandom = (bytes: Uint8Array) => void;

// Rejection sampling avoids modulo bias. A bounded retry fails closed if an
// injected or broken random source continually returns unusable bytes.
export function randomBelow(max: bigint, fill: FillRandom): bigint {
  if (max < BigInt(1)) throw new Error('随机范围无效。');
  if (max === BigInt(1)) return BigInt(0);
  const bits = (max - BigInt(1)).toString(2).length;
  const bytes = new Uint8Array(Math.ceil(bits / 8));
  for (let attempt = 0; attempt < 128; attempt++) {
    fill(bytes);
    bytes[0] &= 255 >>> (bytes.length * 8 - bits);
    let value = BigInt(0);
    for (const byte of bytes) value = (value << BigInt(8)) | BigInt(byte);
    if (value < max) return value;
  }
  throw new Error('安全随机源异常，请重试。');
}
function systemRandom(): FillRandom {
  if (!globalThis.crypto?.getRandomValues) throw new Error('当前浏览器无法提供安全随机数，请使用支持 Web Crypto 的浏览器。');
  const buffer = new Uint8Array(4096);
  let offset = buffer.length;
  return bytes => {
    for (let i = 0; i < bytes.length; i++) {
      if (offset === buffer.length) { globalThis.crypto.getRandomValues(buffer); offset = 0; }
      bytes[i] = buffer[offset++];
    }
  };
}
function integer(value: number, min: number, max: number, label: string) {
  if (!Number.isInteger(value) || value < min || value > max) throw new Error(`${label}须为 ${min}–${max} 的整数。`);
}
export function entropyBits(count: bigint): number {
  if (count < BigInt(1)) return 0;
  const bits = count.toString(2).length;
  const shift = Math.max(0, bits - 53);
  return Math.log2(Number(count >> BigInt(shift))) + shift;
}
type Plan = { combinations: bigint; poolSize: number; generate: (fill: FillRandom) => string };
function plan(options: PasswordOptions): Plan {
  const o = options;
  integer(o.count, 1, 500, '生成数量');
  if (o.mode === 'words') {
    integer(o.wordCount, 3, 15, '单词数量');
    if (!['-', '.', '_', ' '].includes(o.separator)) throw new Error('请选择支持的单词分隔符。');
    const combinations = BigInt(WORD_COUNT) ** BigInt(o.wordCount) * (o.capitalize ? BigInt(2) ** BigInt(o.wordCount) : BigInt(1)) * (o.addNumber ? BigInt(100) : BigInt(1));
    return { combinations, poolSize: WORD_COUNT, generate: fill => {
      const words = Array.from({ length: o.wordCount }, () => {
        const word = PASSWORD_WORDS[Number(randomBelow(BigInt(WORD_COUNT), fill))];
        return o.capitalize && randomBelow(BigInt(2), fill) === BigInt(1) ? word[0].toUpperCase() + word.slice(1) : word;
      });
      return words.join(o.separator) + (o.addNumber ? String(randomBelow(BigInt(100), fill)).padStart(2, '0') : '');
    } };
  }
  if (o.mode === 'pin') {
    integer(o.pinLength, 4, 12, 'PIN 位数');
    const allowed = (previous: number, digit: number) => previous === 10 || ((!o.avoidRepeat || digit !== previous) && (!o.avoidSequential || Math.abs(previous - digit) !== 1));
    const ways: bigint[][] = [Array(11).fill(BigInt(1))];
    for (let left = 1; left <= o.pinLength; left++) ways.push(Array.from({ length: 11 }, (_, prev) => [...DIGITS].reduce((sum, _, digit) => sum + (allowed(prev, digit) ? ways[left - 1][digit] : BigInt(0)), BigInt(0))));
    return { combinations: ways[o.pinLength][10], poolSize: 10, generate: fill => {
      let previous = 10, output = '';
      for (let left = o.pinLength; left > 0; left--) {
        let choice = randomBelow(ways[left][previous], fill);
        for (let digit = 0; digit < 10; digit++) {
          if (!allowed(previous, digit)) continue;
          const weight = ways[left - 1][digit];
          if (choice < weight) { output += digit; previous = digit; break; }
          choice -= weight;
        }
      }
      return output;
    } };
  }
  if (o.mode !== 'random') throw new Error('密码模式无效。');
  integer(o.length, 8, 128, '密码长度');
  if (o.symbols && (!SYMBOLS.test(o.customSymbols) || o.customSymbols.length > 128)) throw new Error('自定义符号须为英文半角标点，不能为空或包含空格、字母、数字。');
  const groups = [o.upper ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' : '', o.lower ? 'abcdefghijklmnopqrstuvwxyz' : '', o.numbers ? DIGITS : '', o.symbols ? [...new Set(o.customSymbols)].join('') : ''].filter(Boolean).map(chars => [...chars].filter(c => !o.excludeConfusing || !'0O1lI'.includes(c)).join(''));
  if (!groups.length || groups.some(group => !group.length)) throw new Error('请至少选择一种有效字符。');
  const fullMask = (1 << groups.length) - 1;
  // Count suffixes by the categories still missing. Weighted sampling makes
  // every allowed complete password equally likely, even with requireAll.
  const ways: bigint[][] = [Array.from({ length: fullMask + 1 }, (_, missing) => missing === 0 || !o.requireAll ? BigInt(1) : BigInt(0))];
  for (let left = 1; left <= o.length; left++) ways.push(Array.from({ length: fullMask + 1 }, (_, missing) => groups.reduce((sum, chars, group) => sum + BigInt(chars.length) * ways[left - 1][missing & ~(1 << group)], BigInt(0))));
  const combinations = ways[o.length][fullMask];
  return { combinations, poolSize: groups.reduce((sum, chars) => sum + chars.length, 0), generate: fill => {
    let missing = fullMask, output = '';
    for (let left = o.length; left > 0; left--) {
      let choice = randomBelow(ways[left][missing], fill);
      for (let group = 0; group < groups.length; group++) {
        const next = missing & ~(1 << group), suffixes = ways[left - 1][next];
        const weight = BigInt(groups[group].length) * suffixes;
        if (choice < weight) { output += groups[group][Number(choice / suffixes)]; missing = next; break; }
        choice -= weight;
      }
    }
    return output;
  } };
}
export function analyzePasswordOptions(options: PasswordOptions) {
  try {
    const result = plan(options), bits = entropyBits(result.combinations);
    return { bits, combinations: result.combinations, poolSize: result.poolSize, label: bits < 30 ? '较低' : bits < 50 ? '中等' : bits < 70 ? '较高' : '高', error: '' };
  } catch (error) { return { bits: 0, combinations: BigInt(0), poolSize: 0, label: '无效配置', error: error instanceof Error ? error.message : '配置无效。' }; }
}
export function generatePasswords(options: PasswordOptions, fill?: FillRandom): string[] {
  const prepared = plan(options), random = fill ?? systemRandom();
  return Array.from({ length: options.count }, () => prepared.generate(random));
}
