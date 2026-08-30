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

export function isAfterSemester(semester: Semester, today: string): boolean {
  const s = parseDate(semester.startDate);
  const d = parseDate(today);
  if (isNaN(s.getTime()) || isNaN(d.getTime())) return false;
  const end = new Date(s);
  end.setDate(end.getDate() + semester.totalWeeks * 7);
  return d >= end;
}