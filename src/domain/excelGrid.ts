import { Course, WeeksRule } from '../types';

const DAY_HEADERS = ['星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'];
const PERIOD_LABELS: Record<string, number> = {
  '第一大节': 1, '第二大节': 2, '第三大节': 3, '第四大节': 4, '第五大节': 5, '第六大节': 6,
};

function clean(s: string): string { return String(s ?? '').replace(/\s+/g, ' ').trim(); }
function noSpace(s: string): string { return String(s ?? '').replace(/\s+/g, ''); }

function weeksFromField(field: string): WeeksRule {
  let s = clean(field);
  if (!s) return { type: 'all' };
  if (s.includes('周')) {
    const idx = s.indexOf('(');
    const before = idx >= 0 ? s.slice(0, idx) : s;
    const m = before.match(/[\d,\-]+/);
    if (!m) return { type: 'all' };
    return customFrom(m[0]);
  }
  const idx = s.lastIndexOf(')');
  if (idx >= 0) s = s.slice(idx + 1);
  const m = s.match(/[\d,\-]+/);
  if (!m) return { type: 'all' };
  return customFrom(m[0]);
}

function customFrom(body: string): WeeksRule {
  const weeks: number[] = [];
  for (const part of body.split(',')) {
    const p = part.trim();
    if (!p) continue;
    if (p.includes('-')) {
      const [a, b] = p.split('-').map(Number);
      for (let w = a; w <= b; w++) if (w >= 1) weeks.push(w);
    } else {
      const n = Number(p);
      if (n >= 1) weeks.push(n);
    }
  }
  return weeks.length ? { type: 'custom', weeks } : { type: 'all' };
}

function parseCellCourses(raw: string, weekday: number, bigPeriod: number): Course[] {
  const segs = raw.split(/\r?\n/).map((s) => s.trim()).filter(Boolean);
  if (!segs.length) return [];
  const isSlash = segs.some((s) => s.includes('/'));
  const out: Course[] = [];
  if (isSlash) {
    for (const seg of segs) {
      const parts = seg.split('/');
      const name = clean(parts[0] || '');
      if (!name) continue;
      out.push({
        id: 'x' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '-' + out.length,
        name,
        teacher: clean(parts[3] || '') || undefined,
        room: clean(parts[2] || '') || undefined,
        weekday,
        bigPeriod,
        weeksRule: weeksFromField(parts[1] || ''),
      });
    }
  } else {
    for (let i = 0; i < segs.length; i += 4) {
      const name = clean(segs[i] || '');
      if (!name) continue;
      out.push({
        id: 'x' + Date.now() + '-' + Math.random().toString(36).slice(2, 6) + '-' + out.length,
        name,
        teacher: clean(segs[i + 1] || '') || undefined,
        room: clean(segs[i + 3] || '') || undefined,
        weekday,
        bigPeriod,
        weeksRule: weeksFromField(segs[i + 2] || ''),
      });
    }
  }
  return out;
}

export function parseScheduleGrid(grid: string[][]): { courses: Course[]; semesterName?: string } {
  const courses: Course[] = [];
  let semesterName: string | undefined;
  const dayCol: Record<number, number> = {};

  for (let r = 0; r < grid.length; r++) {
    const row = (grid[r] || []).map(String);
    const joined = row.join(' ');
    const mSem = joined.match(/(20\d{2}-\d{4}[-—]?\d?)/);
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
    let bigPeriod = PERIOD_LABELS[label];
    if (!bigPeriod) {
      const m = label.match(/^第\s*(\d+)\s*[-—–~]\s*(\d+)\s*节$/);
      if (m) bigPeriod = Math.ceil(parseInt(m[1], 10) / 2);
    }
    if (!bigPeriod) continue;
    for (let c = 0; c < row.length; c++) {
      const day = dayCol[c];
      if (!day) continue;
      const raw = String(row[c] ?? '').trim();
      if (!raw || raw === '无') continue;
      courses.push(...parseCellCourses(raw, day, bigPeriod));
    }
  }
  return { courses, semesterName };
}