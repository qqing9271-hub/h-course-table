import { PeriodTime } from './types';

export const APP_NAME = 'H课程表';
export const APP_VERSION = '1.0.0';
export const DEFAULT_PERIODS_PER_DAY = 10; // 默认10小节
export const SMALL_PERIODS_PER_BIG = 2;   // 两小节=一大节 -> 5大节
export const DEFAULT_PERIOD_TIMES: PeriodTime[] = [
  { start: '08:00', end: '08:45' },
  { start: '08:50', end: '09:35' },
  { start: '10:00', end: '10:45' },
  { start: '10:50', end: '11:35' },
  { start: '13:30', end: '14:15' },
  { start: '14:20', end: '15:05' },
  { start: '15:30', end: '16:15' },
  { start: '16:20', end: '17:05' },
  { start: '18:30', end: '19:05' },
  { start: '19:10', end: '20:05' },
];