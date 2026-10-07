export type TimestampUnit = 'auto' | 'seconds' | 'milliseconds';
export type DateFields = { year: string; month: string; day: string; hour: string; minute: string; second: string; millisecond: string };
export type Preset = 'now' | 'todayStart' | 'todayEnd' | 'tomorrow' | 'yesterday' | 'monday';
export type Conversion<T> = { value: T; error?: never } | { value?: never; error: string };
const DAY = 86_400_000;
const MAX_TIME = BigInt(8_640_000_000_000_000);

export function parseTimestamp(input: string, requested: TimestampUnit = 'auto'): Conversion<{ milliseconds: number; unit: Exclude<TimestampUnit, 'auto'> }> {
  const raw = input.trim();
  if (!/^[+-]?\d+(?:\.\d+)?$/.test(raw)) return { error: '请输入有效的十进制时间戳。' };
  const unsigned = raw.replace(/^[+-]/, '');
  const [integer, fraction = ''] = unsigned.split('.');
  const digits = integer.replace(/^0+(?=\d)/, '').length;
  const unit = requested === 'auto' ? digits <= 10 ? 'seconds' : 'milliseconds' : requested;
  if (fraction.length > (unit === 'seconds' ? 3 : 0)) return { error: unit === 'seconds' ? '秒时间戳最多支持 3 位小数（毫秒精度）。' : '毫秒时间戳请输入整数。' };
  // Parse as integer milliseconds, avoiding binary floating-point rounding of fractions.
  if (digits > 16) return { error: '时间戳超出支持的日期范围。' };
  let ms = BigInt(integer) * (unit === 'seconds' ? BigInt(1000) : BigInt(1));
  if (unit === 'seconds' && fraction) ms += BigInt(fraction.padEnd(3, '0'));
  if (raw.startsWith('-')) ms = -ms;
  if (ms < -MAX_TIME || ms > MAX_TIME) return { error: '时间戳超出支持的日期范围。' };
  return { value: { milliseconds: Number(ms), unit } };
}

export function dateFields(date: Date): DateFields {
  return { year: String(date.getFullYear()), month: String(date.getMonth() + 1), day: String(date.getDate()), hour: String(date.getHours()), minute: String(date.getMinutes()), second: String(date.getSeconds()), millisecond: String(date.getMilliseconds()) };
}

export function parseLocalDate(fields: DateFields): Conversion<number> {
  const limits = { year: [1, 9999], month: [1, 12], day: [1, 31], hour: [0, 23], minute: [0, 59], second: [0, 59], millisecond: [0, 999] };
  for (const key of Object.keys(limits) as (keyof DateFields)[]) {
    const raw = fields[key].trim(), n = Number(raw), [min, max] = limits[key];
    if (!/^\d+$/.test(raw) || !Number.isInteger(n) || n < min || n > max) return { error: '请填写有效日期：年 1–9999，月 1–12，日 1–31，时 0–23，分秒 0–59，毫秒 0–999。' };
  }
  const n = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, Number(value)])) as Record<keyof DateFields, number>;
  // setFullYear avoids the Date constructor's special interpretation of years 0–99.
  const date = new Date(0);
  date.setFullYear(n.year, n.month - 1, n.day);
  date.setHours(n.hour, n.minute, n.second, n.millisecond);
  const actual = dateFields(date);
  if ((Object.keys(fields) as (keyof DateFields)[]).some(key => Number(actual[key]) !== n[key])) {
    return { error: '该日期不存在，或当地夏令时跳变使该时间不存在。请检查日期和时间。' };
  }
  return { value: date.getTime() };
}

export function presetFields(preset: Preset, now: number): DateFields {
  const date = new Date(now);
  if (preset !== 'now') {
    if (preset === 'tomorrow') date.setDate(date.getDate() + 1);
    if (preset === 'yesterday') date.setDate(date.getDate() - 1);
    if (preset === 'monday') date.setDate(date.getDate() - ((date.getDay() + 6) % 7));
    date.setHours(preset === 'todayEnd' ? 23 : 0, preset === 'todayEnd' ? 59 : 0, preset === 'todayEnd' ? 59 : 0, preset === 'todayEnd' ? 999 : 0);
  }
  return dateFields(date);
}

const leap = (year: number) => year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
const mod7 = (n: number) => ((n % 7) + 7) % 7;
const weeksInYear = (year: number, jan1: number) => jan1 === 4 || (jan1 === 3 && leap(year)) ? 53 : 52;

export function calendarInfo(date: Date, utc = false) {
  const year = utc ? date.getUTCFullYear() : date.getFullYear();
  const month = utc ? date.getUTCMonth() : date.getMonth();
  const day = utc ? date.getUTCDate() : date.getDate();
  const weekday = utc ? date.getUTCDay() : date.getDay();
  const monthDays = [31, leap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  // Calendar arithmetic, not elapsed milliseconds: DST days can be 23 or 25 hours.
  const dayOfYear = monthDays.slice(0, month).reduce((a, b) => a + b, 0) + day;
  const jan1 = mod7(weekday - dayOfYear + 1);
  let weekYear = year, week = Math.floor((dayOfYear - (weekday || 7) + 10) / 7);
  if (week < 1) { weekYear--; week = weeksInYear(weekYear, mod7(jan1 - (leap(weekYear) ? 2 : 1))); }
  else if (week > weeksInYear(year, jan1)) { weekYear++; week = 1; }
  return { dayOfYear, week, weekYear };
}

export function relativeTime(milliseconds: number, now: number): string {
  const difference = now - milliseconds, absolute = Math.abs(difference);
  if (absolute < 1000) return '刚刚';
  const units: [number, string][] = [[365 * DAY, '年'], [30 * DAY, '个月'], [DAY, '天'], [3_600_000, '小时'], [60_000, '分钟'], [1000, '秒']];
  const [size, label] = units.find(([size]) => absolute >= size)!;
  return `${Math.floor(absolute / size)} ${label}${difference > 0 ? '前' : '后'}`;
}

export function formatTimestamp(milliseconds: number) {
  const date = new Date(milliseconds);
  const offset = date.getTimezoneOffset();
  const pad = (n: number, size = 2) => String(n).padStart(size, '0');
  const year = date.getFullYear();
  return {
    milliseconds: String(date.getTime()), seconds: String(Math.floor(date.getTime() / 1000)),
    local: `${year < 0 ? '-' : ''}${pad(Math.abs(year), 4)}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.${pad(date.getMilliseconds(), 3)}`,
    iso: date.toISOString(), utc: date.toUTCString(), rfc2822: date.toUTCString().replace('GMT', '+0000'),
    weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][date.getDay()],
    timezone: `UTC${offset <= 0 ? '+' : '-'}${pad(Math.floor(Math.abs(offset) / 60))}:${pad(Math.abs(offset) % 60)}`,
    ...calendarInfo(date),
  };
}

const zoneFormatters = new Map<string, Intl.DateTimeFormat>();
export function zonedFields(milliseconds: number, zone: string): DateFields {
  if (zone === 'local') return dateFields(new Date(milliseconds));
  let formatter = zoneFormatters.get(zone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-US-u-ca-gregory-nu-latn', { timeZone: zone, era: 'short', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, hourCycle: 'h23' });
    zoneFormatters.set(zone, formatter);
  }
  const p = Object.fromEntries(formatter.formatToParts(new Date(milliseconds)).map(part => [part.type, part.value]));
  return { year: String(p.era === 'BC' ? 1 - Number(p.year) : Number(p.year)), month: p.month, day: p.day, hour: p.hour, minute: p.minute, second: p.second, millisecond: p.fractionalSecond };
}
function utcFromFields(fields: DateFields): number {
  const d = new Date(0);
  d.setUTCFullYear(Number(fields.year), Number(fields.month) - 1, Number(fields.day));
  d.setUTCHours(Number(fields.hour), Number(fields.minute), Number(fields.second), Number(fields.millisecond));
  return d.getTime();
}
function sameFields(a: DateFields, b: DateFields) {
  return (Object.keys(a) as (keyof DateFields)[]).every(key => Number(a[key]) === Number(b[key]));
}
export function parseZonedDate(fields: DateFields, zone: string): Conversion<number> {
  if (zone === 'local') return parseLocalDate(fields);
  const ranges = { year: [1, 9999], month: [1, 12], day: [1, 31], hour: [0, 23], minute: [0, 59], second: [0, 59], millisecond: [0, 999] };
  for (const key of Object.keys(ranges) as (keyof DateFields)[]) {
    const n = Number(fields[key]);
    if (!/^\d+$/.test(fields[key].trim()) || n < ranges[key][0] || n > ranges[key][1]) return { error: '请填写有效的年月日和时间，各字段必须为范围内的整数。' };
  }
  const wall = utcFromFields(fields);
  if (!sameFields(zonedFields(wall, 'UTC'), fields)) return { error: '该日期不存在，请检查月份和天数。' };
  // Discover both sides of a timezone transition; round-trip candidates to reject
  // nonexistent times and consistently choose the earlier instant in an overlap.
  const offsets = new Set<number>();
  for (let hours = -36; hours <= 36; hours += 6) {
    const instant = wall + hours * 3_600_000;
    offsets.add(utcFromFields(zonedFields(instant, zone)) - instant);
  }
  const candidates = [...offsets].map(offset => wall - offset).filter(ms => sameFields(zonedFields(ms, zone), fields));
  return candidates.length ? { value: Math.min(...candidates) } : { error: '该日期不存在，或所选时区的夏令时跳变使该时间不存在。' };
}

export function parseDateString(input: string, zone: string): Conversion<{ milliseconds: number; source: string }> {
  const raw = input.trim();
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{4}/.test(raw)) return { error: '日期格式有歧义，请确认月日顺序并改为 YYYY-MM-DD。' };
  const match = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:?\d{2})?)?$/i.exec(raw);
  if (!match) return { error: '请使用 YYYY-MM-DD HH:mm:ss 或 ISO 8601，可附带 Z、+08:00 等时区，最多保留 3 位毫秒。' };
  const [, year, month, day, hour = '0', minute = '0', second = '0', fraction = '', suffix] = match;
  const fields = { year, month, day, hour, minute, second, millisecond: fraction.padEnd(3, '0') };
  const parsed = parseZonedDate(fields, suffix ? 'UTC' : zone);
  if (parsed.error) return { error: parsed.error };
  let offset = 0;
  if (suffix && suffix.toUpperCase() !== 'Z') {
    const digits = suffix.slice(1).replace(':', '');
    const hours = Number(digits.slice(0, 2)), minutes = Number(digits.slice(2));
    if (hours > 23 || minutes > 59) return { error: '时区偏移无效，小时须为 00–23，分钟须为 00–59。' };
    offset = (hours * 60 + minutes) * 60000 * (suffix.startsWith('-') ? -1 : 1);
  }
  return { value: { milliseconds: parsed.value! - offset, source: suffix ? suffix.toUpperCase() === 'Z' ? '字符串自带 UTC（Z）' : `字符串自带 UTC${suffix}` : `所选时区：${zone === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : zone}` } };
}

export function zonedPreset(preset: Preset, now: number, zone: string): DateFields {
  if (zone === 'local') return presetFields(preset, now);
  const fields = zonedFields(now, zone);
  if (preset === 'now') return fields;
  const date = new Date(utcFromFields(fields));
  if (preset === 'tomorrow') date.setUTCDate(date.getUTCDate() + 1);
  if (preset === 'yesterday') date.setUTCDate(date.getUTCDate() - 1);
  if (preset === 'monday') date.setUTCDate(date.getUTCDate() - ((date.getUTCDay() + 6) % 7));
  date.setUTCHours(preset === 'todayEnd' ? 23 : 0, preset === 'todayEnd' ? 59 : 0, preset === 'todayEnd' ? 59 : 0, preset === 'todayEnd' ? 999 : 0);
  return zonedFields(date.getTime(), 'UTC');
}

export function formatInZone(milliseconds: number, zone: string) {
  const result = formatTimestamp(milliseconds);
  if (zone === 'local') return result;
  const f = zonedFields(milliseconds, zone);
  const pad = (v: string, n = 2) => v.padStart(n, '0');
  const utcWall = utcFromFields(f);
  const offset = (utcWall - milliseconds) / 60000;
  // Use a year with the same Gregorian 400-year cycle for safe local calendar
  // arithmetic even near JavaScript's extreme date range.
  const surrogate = new Date(0);
  surrogate.setUTCFullYear(2000 + ((Number(f.year) % 400) + 400) % 400, Number(f.month) - 1, Number(f.day));
  surrogate.setUTCHours(12, 0, 0, 0);
  const calendar = calendarInfo(surrogate, true);
  const zoneName = new Intl.DateTimeFormat('en-US', { timeZone: zone, timeZoneName: 'longOffset' }).formatToParts(new Date(milliseconds)).find(p => p.type === 'timeZoneName')!.value.replace('GMT', 'UTC');
  return { ...result, local: `${pad(f.year, 4)}-${pad(f.month)}-${pad(f.day)} ${pad(f.hour)}:${pad(f.minute)}:${pad(f.second)}.${pad(f.millisecond, 3)}`, timezone: Number.isFinite(offset) && offset === 0 ? 'UTC+00:00' : zoneName, weekday: ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][surrogate.getUTCDay()], ...calendar, weekYear: Number(f.year) + calendar.weekYear - surrogate.getUTCFullYear() };
}

export type BatchDirection = 'toDate' | 'toTimestamp';
export type BatchRow = { line: number; input: string; error?: string; local?: string; iso?: string; seconds?: string; milliseconds?: string };
export const MAX_BATCH_LINES = 500;
export function convertTimestampBatch(input: string, direction: BatchDirection, zone: string, unit: TimestampUnit = 'auto'): Conversion<BatchRow[]> {
  const lines = input.split(/\r\n|\r|\n/).map((text, index) => ({ text: text.trim(), line: index + 1 })).filter(row => row.text);
  if (!lines.length) return { error: '请先输入需要转换的内容，每行一条。' };
  if (lines.length > MAX_BATCH_LINES) return { error: `每批最多支持 ${MAX_BATCH_LINES} 条非空记录，请分批转换。` };
  return { value: lines.map(({ text, line }) => {
    const parsed = direction === 'toDate' ? parseTimestamp(text, unit) : parseDateString(text, zone);
    if (parsed.error) return { line, input: text, error: parsed.error };
    const time = formatInZone(parsed.value!.milliseconds, zone);
    return { line, input: text, local: time.local, iso: time.iso, seconds: time.seconds, milliseconds: time.milliseconds };
  }) };
}
// Include failed rows and original line numbers in copies, so results cannot be
// mistaken for a fully successful conversion or lose correspondence to the input.
export function formatBatchCopy(rows: BatchRow[]): string {
  return ['行号\t原始输入\t状态\t所选时区时间\tISO 8601\t秒时间戳\t毫秒时间戳', ...rows.map(row => [row.line, row.input.replace(/\t/g, ' '), row.error || '成功', row.local || '', row.iso || '', row.seconds || '', row.milliseconds || ''].join('\t'))].join('\n');
}
