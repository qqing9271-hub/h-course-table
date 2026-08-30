import { PeriodTime } from './types';

export const APP_NAME = 'H课程表';
export const APP_VERSION = '1.0.0';
export const DEFAULT_PERIODS_PER_DAY = 10; // 默认10小节
export const SMALL_PERIODS_PER_BIG = 2;   // 两小节=一大节 -> 5大节
export const DEFAULT_PERIOD_TIMES: PeriodTime[] = [
  { start: '08:00', end: '09:35' },
  { start: '10:00', end: '11:35' },
  { start: '13:30', end: '15:05' },
  { start: '15:30', end: '17:05' },
  { start: '18:30', end: '20:05' },
];
