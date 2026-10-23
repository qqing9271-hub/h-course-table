import { Semester } from '../types';

export function parseDate(s: string): Date {
  return new Date(s + 'T00:00:00');
}

export function currentWeek(semester: Semester, today: string): number {
  const start = parseDate(semester.startDate);
  const d = parseDate(today);
  if (isNaN(start.getTime()) || isNaN(d.getTime())) return 0;
  const diffDays = Math.round((d.getTime() - start.getTime()) / 86400000);
  if (diffDays < 0) return 0; // 未开学
  return Math.floor(diffDays / 7) + 1;
}

export function isBeforeSemester(semester: Semester, today: string): boolean {
  const s = parseDate(semester.startDate);
  const d = parseDate(today);
  if (isNaN(s.getTime()) || isNaN(d.getTime())) return false;
  return d < s;
}

/** 返回 dateStr 所在周（周一起）各天的“几月几日”文案，长度 dayCount */
export function weekDayLabels(dateStr: string, dayCount: number): string[] {
  const n = dayCount > 0 ? Math.floor(dayCount) : 0;
  const base = parseDate(dateStr);
  if (isNaN(base.getTime()) || n === 0) return Array.from({ length: n }, () => '');
  const mondayOffset = (base.getDay() + 6) % 7; // 0 = 周一
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getTime());
    d.setDate(d.getDate() - mondayOffset + i);
    out.push(d.getMonth() + 1 + '月' + d.getDate() + '日');
  }
  return out;
}

export function isAfterSemester(semester: Semester, today: string): boolean {
  const s = parseDate(semester.startDate);
  const d = parseDate(today);
  if (isNaN(s.getTime()) || isNaN(d.getTime())) return false;
  const end = new Date(s);
  end.setDate(end.getDate() + semester.totalWeeks * 7);
  return d >= end;
}