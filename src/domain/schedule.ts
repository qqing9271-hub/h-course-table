import { Course, ScheduleSetting, WeeksRule, PeriodTime } from '../types';
import { DEFAULT_PERIODS_PER_DAY, DEFAULT_PERIOD_TIMES } from '../constants';

export const DEFAULT_PERIODS_PER_DAY_SCHEDULE = DEFAULT_PERIODS_PER_DAY;
export const DEFAULT_BIG_PERIOD_SIZE = 2;

export function defaultScheduleSetting(): ScheduleSetting {
  return {
    periodsPerDay: DEFAULT_PERIODS_PER_DAY,
    bigPeriodSize: DEFAULT_BIG_PERIOD_SIZE,
    periodTimes: DEFAULT_PERIOD_TIMES,
    showWeekend: true,
  };
}

export function bigPeriodGroups(
  periodsPerDay: number,
  bigPeriodSize: number,
): { bigIndex: number; smalls: number[] }[] {
  const groups: { bigIndex: number; smalls: number[] }[] = [];
  for (let i = 1; i <= periodsPerDay; i += bigPeriodSize) {
    const smalls: number[] = [];
    for (let k = 0; k < bigPeriodSize && i + k <= periodsPerDay; k++) {
      smalls.push(i + k);
    }
    groups.push({ bigIndex: Math.floor((i - 1) / bigPeriodSize) + 1, smalls });
  }
  return groups;
}

export function courseOccursOnWeek(rule: WeeksRule, week: number): boolean {
  switch (rule.type) {
    case 'all':
      return true;
    case 'odd':
      return week % 2 === 1;
    case 'even':
      return week % 2 === 0;
    case 'custom':
      return rule.weeks.includes(week);
  }
}

export function coursesOnDay(courses: Course[], weekday: number, week: number): Course[] {
  return courses.filter(
    (c) => c.weekday === weekday && courseOccursOnWeek(c.weeksRule, week),
  );
}

export function buildDayTimeline(
  courses: Course[],
  weekday: number,
  week: number,
  periodsPerDay: number,
  bigPeriodSize: number,
): { bigIndex: number; courses: Course[] }[] {
  const groups = bigPeriodGroups(periodsPerDay, bigPeriodSize);
  const dayCourses = coursesOnDay(courses, weekday, week);
  return groups.map((g) => ({
    bigIndex: g.bigIndex,
    courses: dayCourses.filter((c) => c.bigPeriod === g.bigIndex),
  }));
}

export interface WeekGridRow {
  bigPeriod: number;
  start?: string;
  end?: string;
  cells: { day: number; courses: Course[] }[];
}

export function buildWeekGrid(
  courses: Course[],
  week: number,
  setting: ScheduleSetting,
  days: number[],
): WeekGridRow[] {
  const groups = bigPeriodGroups(setting.periodsPerDay, setting.bigPeriodSize);
  return groups.map((g) => {
    const pt = setting.periodTimes[g.bigIndex - 1];
    return {
      bigPeriod: g.bigIndex,
      start: pt?.start,
      end: pt?.end,
      cells: days.map((day) => ({
        day,
        courses: coursesOnDay(courses, day, week).filter((c) => c.bigPeriod === g.bigIndex),
      })),
    };
  });
}
