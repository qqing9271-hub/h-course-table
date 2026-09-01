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
test('兼容“第1-2节”节次标签的课表', () => {
  const grid = [
    ['课表', '', '', '', '', '', '', ''],
    ['学年学期：2026-2027-1', '', '', '', '', '', '', ''],
    ['', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    ['第1-2节', '高数\n张老师\n1-18([周])[01-02节]\n历史楼206', '', '', '', '', '', ''],
    ['第3-4节', '', '英语\n李老师\n2,4,6([周])[03-04节]\n二教301', '', '', '', '', ''],
    ['第9-10节', '', '', '', '体育\n王老师\n1-9([周])[09-10节]\n操场', '', '', ''],
  ];
  const { courses } = parseScheduleGrid(grid);
  expect(courses).toHaveLength(3);
  const g = courses.find((c) => c.name === '高数')!;
  expect(g.bigPeriod).toBe(1);
  expect(g.room).toBe('历史楼206');
  const y = courses.find((c) => c.name === '英语')!;
  expect(y.bigPeriod).toBe(2);
  expect(y.weekday).toBe(2);
  const t = courses.find((c) => c.name === '体育')!;
  expect(t.bigPeriod).toBe(5);
});
test('兼容斜杠分隔+一格多门课(\r\n)格式', () => {
  const grid = [
    ['2026-2027学1学期', '2026-2027学1学期', '', '2024通信工程01课表', '', '', '', '', ''],
    ['节次', '', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'],
    ['第1-2节', '', '通信原理/(1-2节)1-16节/新华校区 3219/周老师/通信原理-0003/29', '', '', '', '', '', ''],
    ['第3-4节', '', '', '嵌入式系统及应用/(3-4节)1-16节/宁大校区 1513/李老师/嵌入式系统-0001/29', '', '', '', '', ''],
    ['第5-6节', '', '人工智能导论/(5-6节)1-16节/宁大校区 1617/王老师/人工智能导论-0003/52\r\n电力电子电路/(5-6节)5-11节/宁大校区 1613/赵老师/电力电子电路-0003/29', '', '', '', '', '', ''],
  ];
  const { courses, semesterName } = parseScheduleGrid(grid);
  expect(semesterName).toBe('2026-2027');
  const c1 = courses.find((c) => c.name === '通信原理')!;
  expect(c1.weekday).toBe(1);
  expect(c1.bigPeriod).toBe(1);
  expect(c1.room).toContain('3219');
  expect(c1.teacher).toBe('周老师');
  const c2 = courses.find((c) => c.name === '嵌入式系统及应用')!;
  expect(c2.weekday).toBe(2);
  const multi = courses.filter((c) => c.name === '人工智能导论' || c.name === '电力电子电路');
  expect(multi.length).toBe(2);
});