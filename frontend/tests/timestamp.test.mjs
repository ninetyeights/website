import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source = readFileSync(new URL('../src/lib/timestamp.ts', import.meta.url), 'utf8');
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } }).outputText;
const { convertTimestampBatch, formatBatchCopy, MAX_BATCH_LINES, parseTimestamp, parseLocalDate, parseZonedDate, parseDateString, formatInZone, zonedFields, zonedPreset, dateFields, presetFields, calendarInfo, relativeTime, formatTimestamp } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);
const originalTZ = process.env.TZ;
test.after(() => { if (originalTZ === undefined) delete process.env.TZ; else process.env.TZ = originalTZ; });
const fields = (overrides = {}) => ({ year: '2024', month: '2', day: '29', hour: '12', minute: '34', second: '56', millisecond: '789', ...overrides });

test('seconds and milliseconds detection, overrides, signs and exact fractional precision', () => {
  for (const [input, unit, expected] of [['0', 'auto', 0], ['-1', 'auto', -1000], ['1700000000', 'auto', 1700000000000], ['1700000000123', 'auto', 1700000000123], ['123', 'milliseconds', 123], ['10000000000', 'seconds', 10000000000000], ['  +0001700000000.123 ', 'auto', 1700000000123], ['-0.001', 'seconds', -1], ['1.001', 'seconds', 1001]]) assert.equal(parseTimestamp(input, unit).value.milliseconds, expected);
});

test('invalid numeric inputs and date overflow are rejected', () => {
  for (const input of ['', ' ', 'abc', 'Infinity', 'NaN', '0x10', '1e9', '1,000', '1.0001', '9999999999999999999999']) assert(parseTimestamp(input).error, input);
  assert(parseTimestamp('1.1', 'milliseconds').error);
  for (const sign of ['', '-']) {
    assert.equal(parseTimestamp(sign + '8640000000000000', 'milliseconds').value.milliseconds, Number(sign + '8640000000000000'));
    assert(parseTimestamp(sign + '8640000000000001', 'milliseconds').error);
  }
});

test('local date validates leap years, month lengths, empty and out-of-range fields', () => {
  process.env.TZ = 'UTC';
  assert.equal(formatTimestamp(parseLocalDate(fields()).value).iso, '2024-02-29T12:34:56.789Z');
  for (const override of [{ year: '2023' }, { year: '1900' }, { month: '4', day: '31' }, { month: '13' }, { day: '0' }, { hour: '24' }, { minute: '60' }, { second: '-1' }, { millisecond: '1000' }, { year: '' }, { year: '10000' }, { year: '0' }, { month: '2.5' }, { day: ' ' }]) assert(parseLocalDate(fields(override)).error, JSON.stringify(override));
  assert(parseLocalDate(fields({ year: '2000' })).value);
});

test('years before 100 and pre-epoch timestamps retain the actual year', () => {
  process.env.TZ = 'UTC';
  assert.equal(formatTimestamp(parseLocalDate(fields({ year: '0099', month: '1', day: '1' })).value).iso, '0099-01-01T12:34:56.789Z');
  assert.equal(formatTimestamp(-1).seconds, '-1');
  assert.equal(formatTimestamp(-1).iso, '1969-12-31T23:59:59.999Z');
});

test('ISO weeks correctly cross both year boundaries', () => {
  process.env.TZ = 'UTC';
  for (const [day, year, week, ordinal] of [['2021-01-01', 2020, 53, 1], ['2021-01-04', 2021, 1, 4], ['2018-12-31', 2019, 1, 365], ['2020-12-31', 2020, 53, 366], ['2023-01-01', 2022, 52, 1], ['2024-12-30', 2025, 1, 365]]) assert.deepEqual(calendarInfo(new Date(day + 'T12:00:00Z')), { dayOfYear: ordinal, week, weekYear: year });
});

test('local calendar calculations and presets survive daylight saving transitions', () => {
  process.env.TZ = 'America/New_York';
  assert.equal(calendarInfo(new Date('2024-03-11T04:00:00Z')).dayOfYear, 71);
  assert(parseLocalDate(fields({ month: '3', day: '10', hour: '2', minute: '30' })).error);
  const duplicate = parseLocalDate(fields({ month: '11', day: '3', hour: '1', minute: '30', second: '0', millisecond: '0' }));
  assert.equal(new Date(duplicate.value).toISOString(), '2024-11-03T05:30:00.000Z');
  const now = Date.parse('2024-03-10T16:00:00Z');
  assert.equal(parseLocalDate(presetFields('tomorrow', now)).value - parseLocalDate(presetFields('todayStart', now)).value, 23 * 3600000);
  assert.equal(formatTimestamp(now).timezone, 'UTC-04:00');
  assert.equal(formatTimestamp(Date.parse('2024-01-01T12:00:00Z')).timezone, 'UTC-05:00');
});

test('all presets retain calendar meaning and milliseconds', () => {
  process.env.TZ = 'Asia/Shanghai';
  const now = Date.parse('2024-12-31T13:22:33.456Z');
  assert.deepEqual(presetFields('now', now), dateFields(new Date(now)));
  assert.deepEqual(presetFields('todayEnd', now), fields({ year: '2024', month: '12', day: '31', hour: '23', minute: '59', second: '59', millisecond: '999' }));
  assert.equal(presetFields('tomorrow', now).year, '2025');
  assert.equal(presetFields('tomorrow', now).day, '1');
  assert.equal(presetFields('yesterday', now).day, '30');
  assert.equal(presetFields('monday', now).day, '30');
  assert.equal(presetFields('todayStart', now).hour, '0');
  assert.equal(formatTimestamp(now).timezone, 'UTC+08:00');
});

test('relative times distinguish future and past at each boundary', () => {
  const now = 2000000000000;
  assert.equal(relativeTime(now + 999, now), '刚刚');
  for (const [delta, text] of [[1000, '1 秒'], [60000, '1 分钟'], [3600000, '1 小时'], [86400000, '1 天'], [2592000000, '1 个月'], [31536000000, '1 年']]) {
    assert.equal(relativeTime(now - delta, now), text + '前');
    assert.equal(relativeTime(now + delta, now), text + '后');
  }
});

test('formats retain UTC, numeric offsets and date boundaries in multiple timezones', () => {
  for (const zone of ['UTC', 'Asia/Shanghai', 'Asia/Kathmandu', 'America/New_York']) {
    process.env.TZ = zone;
    const result = formatTimestamp(0);
    assert.equal(result.iso, '1970-01-01T00:00:00.000Z');
    assert.equal(result.rfc2822, 'Thu, 01 Jan 1970 00:00:00 +0000');
    assert.equal(parseLocalDate(dateFields(new Date(0))).value, 0);
    for (const ms of [-8640000000000000, 8640000000000000]) { const edge = formatTimestamp(ms); assert(Number.isFinite(edge.dayOfYear)); assert(edge.week >= 1 && edge.week <= 53); }
  }
  process.env.TZ = 'Asia/Kathmandu';
  assert.equal(formatTimestamp(Date.parse('2024-01-01T00:00:00Z')).timezone, 'UTC+05:45');
});


test('explicit zones parse independently of host timezone and handle DST gaps and folds', () => {
  for (const host of ['UTC', 'Asia/Shanghai', 'America/New_York']) {
    process.env.TZ = host;
    const f = fields({ year: '2024', month: '3', day: '10', hour: '2', minute: '30', second: '0', millisecond: '0' });
    assert.equal(new Date(parseZonedDate(f, 'UTC').value).toISOString(), '2024-03-10T02:30:00.000Z');
    assert(parseZonedDate(f, 'America/New_York').error);
    assert.equal(new Date(parseZonedDate({ ...f, month: '11', day: '3', hour: '1' }, 'America/New_York').value).toISOString(), '2024-11-03T05:30:00.000Z');
    assert(parseZonedDate(fields({ year: '2023' }), 'UTC').error);
    assert.equal(new Date(parseZonedDate(fields({ year: '0099', day: '28' }), 'UTC').value).toISOString(), '0099-02-28T12:34:56.789Z');
  }
});

test('pasted dates honor explicit offsets and validate calendar and ambiguous formats', () => {
  const cases = [
    ['2026-09-27 15:30:00', 'Asia/Shanghai', '2026-09-27T07:30:00.000Z'],
    ['2026-09-27T15:30:00Z', 'Asia/Shanghai', '2026-09-27T15:30:00.000Z'],
    ['2026-09-27T15:30:00.12+08:00', 'America/New_York', '2026-09-27T07:30:00.120Z'],
    ['2026-09-27T15:30:00-0430', 'UTC', '2026-09-27T20:00:00.000Z'],
    ['2026-09-27', 'Asia/Kolkata', '2026-09-26T18:30:00.000Z'],
    ['2024-03-10T02:30:00Z', 'America/New_York', '2024-03-10T02:30:00.000Z'],
  ];
  for (const [text, zone, iso] of cases) assert.equal(new Date(parseDateString(text, zone).value.milliseconds).toISOString(), iso);
  for (const text of ['2023-02-29T12:00:00Z', '2024-04-31', '2024-01-01T24:00:00', '2024-01-01T12:00:60', '2024-01-01T12:00:00.1234Z', '2024-01-01T12:00:00+24:00', '2024-01-01T12:00:00+01:60', '01/02/2026', '', 'tomorrow']) assert(parseDateString(text, 'UTC').error, text);
  assert.match(parseDateString('01/02/2026', 'UTC').error, /歧义/);
});

test('zoned output, ISO weeks, presets and round-trips use the selected calendar', () => {
  process.env.TZ = 'America/New_York';
  const ms = Date.parse('2024-12-31T20:00:00.123Z');
  assert.equal(formatInZone(ms, 'Asia/Shanghai').local, '2025-01-01 04:00:00.123');
  assert.equal(formatInZone(ms, 'Asia/Shanghai').dayOfYear, 1);
  assert.equal(formatInZone(ms, 'Asia/Shanghai').weekYear, 2025);
  assert.equal(formatInZone(ms, 'Asia/Kolkata').timezone, 'UTC+05:30');
  assert.equal(new Date(parseZonedDate(zonedPreset('todayStart', ms, 'Asia/Shanghai'), 'Asia/Shanghai').value).toISOString(), '2024-12-31T16:00:00.000Z');
  for (const zone of ['UTC', 'Asia/Shanghai', 'Asia/Kolkata', 'America/New_York', 'Europe/London', 'Australia/Sydney']) {
    for (const instant of [0, ms, Date.parse('2024-06-15T12:34:56.789Z')]) assert.equal(parseZonedDate(zonedFields(instant, zone), zone).value, instant);
  }
});


test('batch conversion preserves original line numbers and isolates invalid records', () => {
  const rows = convertTimestampBatch(' 0 \r\n\r\nbad\n1700000000123\r-0.001', 'toDate', 'UTC').value;
  assert.deepEqual(rows.map(row => row.line), [1, 3, 4, 5]);
  assert.equal(rows[0].milliseconds, '0');
  assert(rows[1].error);
  assert.equal(rows[2].iso, '2023-11-14T22:13:20.123Z');
  assert.equal(rows[3].milliseconds, '-1');
  assert.equal(convertTimestampBatch('123', 'toDate', 'UTC', 'milliseconds').value[0].milliseconds, '123');
});

test('batch date conversion respects explicit offsets and selected-zone DST validation', () => {
  const rows = convertTimestampBatch('2024-03-10 02:30:00\n2024-03-10T02:30:00Z\n2024-11-03 01:30:00\n2023-02-29', 'toTimestamp', 'America/New_York').value;
  assert(rows[0].error);
  assert.equal(rows[1].iso, '2024-03-10T02:30:00.000Z');
  assert.equal(rows[2].iso, '2024-11-03T05:30:00.000Z');
  assert(rows[3].error);
  assert.equal(convertTimestampBatch('1970-01-01 08:00:00', 'toTimestamp', 'Asia/Shanghai').value[0].milliseconds, '0');
});

test('batch limits reject excess records without truncation and ignore empty lines', () => {
  assert(convertTimestampBatch(' \n\r\n', 'toDate', 'UTC').error);
  assert.equal(convertTimestampBatch('0\n\n'.repeat(MAX_BATCH_LINES), 'toDate', 'UTC').value.length, MAX_BATCH_LINES);
  const excess = convertTimestampBatch('0\n'.repeat(MAX_BATCH_LINES + 1), 'toDate', 'UTC');
  assert(excess.error); assert.equal(excess.value, undefined);
});

test('batch clipboard retains errors, order and stable tab-separated columns', () => {
  const rows = convertTimestampBatch('0\ninvalid\tinput\n-1', 'toDate', 'UTC').value;
  const lines = formatBatchCopy(rows).split('\n');
  assert.equal(lines.length, 4);
  assert(lines.every(line => line.split('\t').length === 7));
  assert.match(lines[1], /1970-01-01T00:00:00.000Z/);
  assert.equal(lines[2].split('\t')[1], 'invalid input');
  assert.equal(lines[2].split('\t')[2], rows[1].error);
  assert.equal(lines[3].split('\t')[0], '3');
});
