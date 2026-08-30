import { Course, WeeksRule } from '../src/types';
import {
  defaultScheduleSetting,
  bigPeriodGroups,
  courseOccursOnWeek,
  coursesOnDay,
  buildDayTimeline,
  buildWeekGrid,
} from '../src/domain/schedule';
import { DEFAULT_PERIOD_TIMES } from '../src/constants';

test('AC-S02: 默认一天 10 小节(5 大节)，两小节=一大节，含默认时间', () => {
  const s = defaultScheduleSetting();
  expect(s.periodsPerDay).toBe(10);
  expect(s.bigPeriodSize).toBe(2);
  expect(s.periodTimes).toEqual(DEFAULT_PERIOD_TIMES);
  const groups = bigPeriodGroups(s.periodsPerDay, s.bigPeriodSize);
  expect(groups).toHaveLength(5);
  expect(groups[0].smalls).toEqual([1, 2]);
});

test('AC-S02: 可自定义节数与小组大小', () => {
  const groups = bigPeriodGroups(10, 2);
  expect(groups).toHaveLength(5);
  const groups3 = bigPeriodGroups(6, 3);
  expect(groups3).toHaveLength(2);
  expect(groups3[0].smalls).toEqual([1, 2, 3]);
});

test('周次规则: all/odd/even/custom', () => {
  const all: WeeksRule = { type: 'all' };
  const odd: WeeksRule = { type: 'odd' };
  const even: WeeksRule = { type: 'even' };
  const custom: WeeksRule = { type: 'custom', weeks: [1, 3, 5] };
  expect(courseOccursOnWeek(all, 2)).toBe(true);
  expect(courseOccursOnWeek(odd, 3)).toBe(true);
  expect(courseOccursOnWeek(odd, 4)).toBe(false);
  expect(courseOccursOnWeek(even, 4)).toBe(true);
  expect(courseOccursOnWeek(custom, 3)).toBe(true);
  expect(courseOccursOnWeek(custom, 2)).toBe(false);
});

test('AC-C01: 按星期与周次过滤当天课程', () => {
  const courses: Course[] = [
    { id: 'c1', name: '高数', weekday: 1, bigPeriod: 1, weeksRule: { type: 'all' } },
    { id: 'c2', name: '单双周课', weekday: 1, bigPeriod: 2, weeksRule: { type: 'odd' } },
    { id: 'c3', name: '英语', weekday: 2, bigPeriod: 1, weeksRule: { type: 'all' } },
  ];
  const day1 = coursesOnDay(courses, 1, 3);
  expect(day1.map((c) => c.name)).toEqual(['高数', '单双周课']);
  const day1even = coursesOnDay(courses, 1, 4);
  expect(day1even.map((c) => c.name)).toEqual(['高数']);
});

test('AC-C02: 生成日时间线，含空大节', () => {
  const courses: Course[] = [
    { id: 'c1', name: '高数', weekday: 1, bigPeriod: 1, weeksRule: { type: 'all' } },
    { id: 'c2', name: '英语', weekday: 1, bigPeriod: 3, weeksRule: { type: 'all' } },
  ];
  const tl = buildDayTimeline(courses, 1, 2, 10, 2);
  expect(tl).toHaveLength(5);
  expect(tl[0].courses.map((c) => c.name)).toEqual(['高数']);
  expect(tl[1].courses).toEqual([]);
  expect(tl[2].courses.map((c) => c.name)).toEqual(['英语']);
});

test('首页周网格: 行为节次、列为星期，含每大节时间', () => {
  const s = defaultScheduleSetting();
  const courses: Course[] = [
    { id: 'c1', name: '高数', weekday: 1, bigPeriod: 1, weeksRule: { type: 'all' } },
    { id: 'c2', name: '英语', weekday: 7, bigPeriod: 2, weeksRule: { type: 'all' } },
  ];
  const grid = buildWeekGrid(courses, 2, s, [1, 2, 3, 4, 5, 6, 7]);
  expect(grid).toHaveLength(5);
  expect(grid[0].start).toBe('08:00');
  expect(grid[0].end).toBe('09:35');
  expect(grid[0].cells.find((c) => c.day === 1)?.courses.map((x) => x.name)).toEqual(['高数']);
  expect(grid[1].cells.find((c) => c.day === 7)?.courses.map((x) => x.name)).toEqual(['英语']);
});
