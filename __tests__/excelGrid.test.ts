import { parseScheduleGrid } from '../src/domain/excelGrid';
import { Course } from '../src/types';

test('Excel 网格解析: 星期列 × 大节行 → 课程', () => {
  const grid = [
    ['学生个人课表', '', '', '', '', '', '', ''],
    ['学年学期：2026-2027-1       班级：通信241', '', '', '', '', '', '', ''],
    ['', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    ['第一大节', '通信网络基础\n张老师\n1-12([周])[01-02节]\n四教B413', '数据结构\n李老师\n1-8([周])[01-02节]\n二西102', '', '', '', '', ''],
    ['第二大节', '数字信号处理\n王老师\n1-13([周])[03-04节]\n三教一合', '', '', '', '通信电子线路\n刘老师\n1-12([周])[03-04节]\n东二502', '通信网络基础\n张老师\n1-12([周])[03-04节]\n四教B310', '', ''],
    ['第三大节', '', '', '', '习思\n赵老师\n1-16([周])[05-06节]\n西二601', '数据结构\n李老师\n1-8([周])[05-06节]\n东二503', '党史\n孙老师\n1-5([周])[05-06节]\n东阶五合', '党史\n孙老师\n1-5([周])[05-06节]\n东阶六合'],
  ];
  const { courses, semesterName } = parseScheduleGrid(grid);
  expect(semesterName).toBe('2026-2027-1');
  expect(courses.length).toBeGreaterThan(0);
  const first = courses.find((c) => c.name === '通信网络基础' && c.weekday === 1)!;
  expect(first.bigPeriod).toBe(1);
  expect(first.teacher).toBe('张老师');
  expect(first.room).toBe('四教B413');
  expect((first.weeksRule as any).type).toBe('custom');
  const sat = courses.find((c) => c.name === '党史' && c.weekday === 6)!;
  expect(sat.bigPeriod).toBe(3);
});
