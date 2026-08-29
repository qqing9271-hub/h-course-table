import { Semester } from '../src/types';
import { currentWeek, isBeforeSemester, isAfterSemester } from '../src/domain/semester';

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
  // 2026-09-01 起 20 周 -> 结束约 2027-01-19
  expect(isAfterSemester(sem, '2026-12-31')).toBe(false); // 仍在学期内
  expect(isAfterSemester(sem, '2027-01-20')).toBe(true);  // 已结束
  expect(isAfterSemester(sem, '2026-09-15')).toBe(false);
});
