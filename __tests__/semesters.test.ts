import { Course, Semester } from '../src/types';
import { coursesForSemester, upsertSemester, removeSemesterFromList } from '../src/domain/semesters';

const s1: Semester = { id: 's1', name: '2026-2027-1', startDate: '2026-09-01', totalWeeks: 20 };
const s2: Semester = { id: 's2', name: '2027-2028-1', startDate: '2027-09-01', totalWeeks: 20 };
const courses: Course[] = [
  { id: 'c1', name: '高数', semesterId: 's1', weekday: 1, bigPeriod: 1, weeksRule: { type: 'all' } },
  { id: 'c2', name: '英语', semesterId: 's2', weekday: 1, bigPeriod: 1, weeksRule: { type: 'all' } },
  { id: 'c3', name: '旧课', weekday: 2, bigPeriod: 1, weeksRule: { type: 'all' } },
];

test('多学期: 课程按学期严格过滤', () => {
  expect(coursesForSemester(courses, 's1').map((c) => c.name)).toEqual(['高数']);
  expect(coursesForSemester(courses, 's2').map((c) => c.name)).toEqual(['英语']);
  expect(coursesForSemester(courses, null)).toEqual([]);
});

test('多学期: 增/改/删学期', () => {
  let list = upsertSemester([], s1);
  expect(list).toHaveLength(1);
  list = upsertSemester(list, { ...s1, totalWeeks: 18 });
  expect(list[0].totalWeeks).toBe(18);
  list = upsertSemester(list, s2);
  expect(list).toHaveLength(2);
  list = removeSemesterFromList(list, 's1');
  expect(list.map((s) => s.id)).toEqual(['s2']);
});
