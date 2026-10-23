import { Semester } from '../src/types';
import { currentWeek, isBeforeSemester, isAfterSemester, weekDayLabels, weekdayName } from '../src/domain/semester';

const sem: Semester = { id: 's1', name: '2026 秋', startDate: '2026-09-01', totalWeeks: 20 };

test('AC-S01: 开学日当天为第 1 周', () => {
  expect(currentWeek(sem, '2026-09-01')).toBe(1);
});
test('AC-S01: 开学后第 8 天为第 2 周', () => {
  expect(currentWeek(sem, '2026-09-08')).toBe(2);
});
test('AC-S01: 未开学返回 0', () => {
  expect(currentWeek(sem, '2026-08-31')).toBe(0);
  expect(isBeforeSemester(sem, '2026-08-31')).toBe(true);
});
test('AC-S01: 超过总周数判定学期结束', () => {
  expect(isAfterSemester(sem, '2026-12-31')).toBe(false);
  expect(isAfterSemester(sem, '2027-01-20')).toBe(true);
});
test('AC-S03: 日期旁边显示正确的周几', () => {
  expect(weekdayName('2026-10-19')).toBe('周一');
  expect(weekdayName('2026-10-23')).toBe('周五');
  expect(weekdayName('2026-10-24')).toBe('周六');
  expect(weekdayName('2026-10-25')).toBe('周日');
  expect(weekdayName('2027-01-01')).toBe('周五');
});
test('AC-S03: 日期非法时周几为空串（不崩溃）', () => {
  expect(weekdayName('')).toBe('');
  expect(weekdayName('abc')).toBe('');
});
test('AC-S02: 周一~周日下方显示对应的几月几日（以周一为首）', () => {
  // 2026-09-01 是周二 -> 该周周一为 8月31日
  expect(weekDayLabels('2026-09-01', 7)).toEqual([
    '8月31日', '9月1日', '9月2日', '9月3日', '9月4日', '9月5日', '9月6日',
  ]);
});
test('AC-S02: 隐藏周六日时只返回周一到周五的日期', () => {
  expect(weekDayLabels('2026-09-01', 5)).toEqual(['8月31日', '9月1日', '9月2日', '9月3日', '9月4日']);
});
test('AC-S02: 跨月/跨年日期正确进位', () => {
  expect(weekDayLabels('2027-01-01', 7)).toEqual([
    '12月28日', '12月29日', '12月30日', '12月31日', '1月1日', '1月2日', '1月3日',
  ]);
});
test('AC-S02: 传入周日日期时仍以该周周一为第一天', () => {
  expect(weekDayLabels('2026-09-06', 7)[0]).toBe('8月31日');
  expect(weekDayLabels('2026-09-06', 7)[6]).toBe('9月6日');
});
test('AC-S02: 日期非法或天数非正时安全返回空文案', () => {
  expect(weekDayLabels('', 7)).toEqual(['', '', '', '', '', '', '']);
  expect(weekDayLabels('2026-09-01', 0)).toEqual([]);
});
test('AC-S01: 开学日期非法时应返回 0（非 NaN）', () => {
  const bad = { ...sem, startDate: '' };
  expect(currentWeek(bad, '2026-09-01')).toBe(0);
  expect(isBeforeSemester(bad, '2026-09-01')).toBe(false);
});
