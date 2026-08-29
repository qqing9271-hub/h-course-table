import { Course, ScheduleSetting, WeeksRule } from '../types';

export const DEFAULT_PERIODS_PER_DAY = 8;
export const DEFAULT_BIG_PERIOD_SIZE = 2;

export function defaultScheduleSetting(): ScheduleSetting {
  return {
    periodsPerDay: DEFAULT_PERIODS_PER_DAY,
    bigPeriodSize: DEFAULT_BIG_PERIOD_SIZE,
    periodTimes: [],
    showWeekend: true,
  };
}

// 把一天的小节按“两小节=一大节”分组
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
