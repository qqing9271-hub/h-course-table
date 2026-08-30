import { Course, WeeksRule } from '../types';

const DAY_HEADERS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const PERIOD_LABELS: Record<string, number> = {
  '第一大节': 1, '第二大节': 2, '第三大节': 3, '第四大节': 4, '第五大节': 5, '第六大节': 6,
};

function clean(s: string): string {
  return String(s ?? '').replace(/\s+/g, ' ').trim();
}
function noSpace(s: string): string {
  return String(s ?? '').replace(/\s+/g, '');
}

function parseWeeks(info: string): { rule: WeeksRule } {
  const m = info.match(/([\d,\-]+)\s*\(?\[?周\]?\)?/);
  if (!m) return { rule: { type: 'all' } };
  const body = m[1];
  const weeks: number[] = [];
  for (const part of body.split(',')) {
    const p = part.trim();
    if (!p) continue;
    if (p.includes('-')) {
      const [a, b] = p.split('-').map(Number);
      for (let w = a; w <= b; w++) weeks.push(w);
    } else {
      weeks.push(Number(p));
    }
  }
  return { rule: { type: 'custom', weeks } };
}

export function parseScheduleGrid(grid: string[][]): { courses: Course[]; semesterName?: string } {
  const courses: Course[] = [];
  let semesterName: string | undefined;
  const dayCol: Record<number, number> = {}; // column index -> weekday 1..7

  for (let r = 0; r < grid.length; r++) {
    const row = (grid[r] || []).map(String);
    const joined = row.join(' ');
    const mSem = joined.match(/(20\d{2}-\d{4}-\d)/);
    if (mSem) semesterName = mSem[1];

    if (row.some((s) => noSpace(s).includes('星期一'))) {
      for (let c = 0; c < row.length; c++) {
        const cell = noSpace(row[c]);
        const idx = DAY_HEADERS.findIndex((h) => cell.includes(noSpace(h)));
        if (idx >= 0) dayCol[c] = idx + 1;
      }
    }
  }

  for (let r = 0; r < grid.length; r++) {
    const row = (grid[r] || []).map(String);
    const label = noSpace(row[0] || '');
    const bigPeriod = PERIOD_LABELS[label];
    if (!bigPeriod) continue;
    for (let c = 0; c < row.length; c++) {
      const day = dayCol[c];
      if (!day) continue;
      const raw = String(row[c] ?? '').trim();
      if (!raw || raw === '无') continue;
      const lines = raw.split('\n').map(clean);
      if (!lines[0]) continue;
      const courseName = lines[0];
      const teacher = lines[1] || undefined;
      const room = lines[3] || undefined;
      const weeksInfo = lines[2] || '';
      const { rule } = parseWeeks(weeksInfo);
      courses.push({
        id: 'x' + courses.length,
        name: courseName,
        teacher,
        room,
        weekday: day,
        bigPeriod,
        weeksRule: rule,
      });
    }
  }
  return { courses, semesterName };
}
