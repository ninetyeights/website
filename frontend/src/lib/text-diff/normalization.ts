export type IgnoreOptions = {
  ignoreCase: boolean;
  ignoreSpaces: boolean;
  collapseSpaces: boolean;
  ignoreNewlines: boolean;
  trim: boolean;
};
export type MappedText = { original: string; text: string; starts: number[]; ends: number[] };

// Offsets always refer to the original UTF-16 string, including characters that
// disappear or expand during normalization. Display text is never normalized.
export function normalize(original: string, options: IgnoreOptions): MappedText {
  let text = '';
  const starts: number[] = [], ends: number[] = [];
  const start = options.trim ? original.length - original.trimStart().length : 0;
  const end = options.trim ? original.trimEnd().length : original.length;
  let previousSpace = false;
  for (let i = start; i < end;) {
    const character = String.fromCodePoint(original.codePointAt(i)!);
    const next = i + character.length;
    const newline = /[\r\n\u2028\u2029]/u.test(character);
    const space = !newline && /\s/u.test(character);
    if ((newline && options.ignoreNewlines) || (space && options.ignoreSpaces)) {
      i = next;
      continue;
    }
    if (space && options.collapseSpaces && previousSpace) {
      ends[ends.length - 1] = next;
      i = next;
      continue;
    }
    let value = space && options.collapseSpaces ? ' ' : character;
    if (options.ignoreCase) value = value.toLowerCase();
    text += value;
    for (let j = 0; j < value.length; j++) { starts.push(i); ends.push(next); }
    previousSpace = space;
    i = next;
  }
  return { original, text, starts, ends };
}
