import { Course, ScheduleSetting, Semester, WeeksRule } from '../types';

export function serializeSchedule(input: {
  semester?: Semester;
  setting?: ScheduleSetting;
  courses: Course[];
}): string {
  return JSON.stringify({
    app: 'H课程表',
    version: 1,
    exportedAt: new Date().toISOString(),
    semester: input.semester,
    setting: input.setting,
    courses: input.courses,
  });
}

export function parseSchedule(json: string): {
  semester?: Semester;
  setting?: ScheduleSetting;
  courses: Course[];
} {
  const data = JSON.parse(json);
  if (!data || !Array.isArray(data.courses)) {
    throw new Error('课程表数据无效');
  }
  return { semester: data.semester, setting: data.setting, courses: data.courses };
}

// Excel 列映射：字段 -> 表头名（默认中英文兼容）
export const DEFAULT_COLUMN_MAPPING: Record<string, string> = {
  name: '课程名',
  teacher: '教师',
  room: '教室',
  weekday: '星期',
  bigPeriod: '节次',
  weeksRule: '周次',
  credit: '学分',
};

function parseWeekday(value: string): number {
  const map: Record<string, number> = { '一': 1, '1': 1, '周一': 1, '二': 2, '2': 2, '三': 3, '3': 3, '四': 4, '4': 4, '五': 5, '5': 5, '六': 6, '6': 6, '日': 7, '天': 7, '7': 7 };
  const v = String(value ?? '').trim();
  if (map[v]) return map[v];
  const num = parseInt(v, 10);
  if (num >= 1 && num <= 7) return num;
  return 1;
}

function parseWeeksRule(value: string): WeeksRule {
  const v = String(value ?? '').trim();
  if (v.includes('双')) return { type: 'even' };
  if (v.includes('单')) return { type: 'odd' };
  return { type: 'all' };
}

export function mapExcelRows(
  rows: Record<string, unknown>[],
  mapping: Record<string, string> = DEFAULT_COLUMN_MAPPING,
): Course[] {
  return rows.map((row, idx) => {
    const get = (field: string) => String(row[mapping[field] ?? ''] ?? '').trim();
    const name = get('name');
    const bigPeriod = parseInt(get('bigPeriod') || '1', 10);
    return {
      id: 'x' + idx,
      name,
      teacher: get('teacher') || undefined,
      room: get('room') || undefined,
      weekday: parseWeekday(get('weekday')),
      bigPeriod,
      weeksRule: parseWeeksRule(get('weeksRule')),
      credit: get('credit') ? parseFloat(get('credit')) : undefined,
    };
  });
}
