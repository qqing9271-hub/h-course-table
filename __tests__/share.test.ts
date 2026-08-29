import { Course } from '../src/types';
import { serializeSchedule, parseSchedule, mapExcelRows } from '../src/domain/share';

const courses: Course[] = [
  { id: 'c1', name: '高数', weekday: 1, bigPeriod: 1, weeksRule: { type: 'all' } },
];

test('AC-SH01: 序列化与解析课程表往返一致', () => {
  const json = serializeSchedule({ courses });
  const parsed = parseSchedule(json);
  expect(parsed.courses).toEqual(courses);
});

test('AC-SH01: 无效课程表数据解析抛错', () => {
  expect(() => parseSchedule('{"foo":1}')).toThrow();
});

test('AC-E01: Excel 行按列映射成课程', () => {
  const rows = [
    { '课程名': '高数', '教师': '张老师', '教室': 'A101', '星期': '周一', '节次': '1', '周次': '全部', '学分': '3' },
    { '课程名': '英语', '教师': '李老师', '教室': 'B202', '星期': '3', '节次': '2', '周次': '单' },
  ];
  const mapped = mapExcelRows(rows);
  expect(mapped).toHaveLength(2);
  expect(mapped[0]).toMatchObject({ name: '高数', teacher: '张老师', room: 'A101', weekday: 1, bigPeriod: 1 });
  expect(mapped[1].weeksRule).toEqual({ type: 'odd' });
});
