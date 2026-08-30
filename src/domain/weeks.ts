export type WeekMode = 'all' | 'odd' | 'even' | 'custom';

export function allWeeks(max: number): number[] {
  return Array.from({ length: max }, (_, i) => i + 1);
}
export function oddWeeks(max: number): number[] {
  return allWeeks(max).filter((w) => w % 2 === 1);
}
export function evenWeeks(max: number): number[] {
  return allWeeks(max).filter((w) => w % 2 === 0);
}
export function toggleWeeks(weeks: number[], w: number): number[] {
  return weeks.includes(w) ? weeks.filter((x) => x !== w) : [...weeks, w].sort((a, b) => a - b);
}
export function invertWeeks(weeks: number[], max: number): number[] {
  return allWeeks(max).filter((w) => !weeks.includes(w));
}
export function weeksEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) return false;
  const sa = [...a].sort((x, y) => x - y);
  const sb = [...b].sort((x, y) => x - y);
  return sa.every((v, i) => v === sb[i]);
}
export function ruleFromWeeks(weeks: number[], max: number): WeekMode {
  if (weeksEqual(weeks, allWeeks(max))) return 'all';
  if (weeksEqual(weeks, oddWeeks(max))) return 'odd';
  if (weeksEqual(weeks, evenWeeks(max))) return 'even';
  return 'custom';
}
