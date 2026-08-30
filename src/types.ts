export type WeeksRule =
  | { type: 'all' }
  | { type: 'odd' }
  | { type: 'even' }
  | { type: 'custom'; weeks: number[] };

export interface Semester {
  id: string;
  name: string;
  startDate: string; // yyyy-mm-dd
  totalWeeks: number;
}

export interface PeriodTime {
  start: string; // HH:mm
  end: string;   // HH:mm
}

export interface ScheduleSetting {
  periodsPerDay: number;
  bigPeriodSize: number; // 两个小节=一大节
  periodTimes: PeriodTime[];
  showWeekend: boolean;
  dayFontSize: number;
  weekFontSize: number;
}

export interface Course {
  id: string;
  semesterId?: string;
  name: string;
  teacher?: string;
  room?: string;
  weekday: number;      // 1=周一 .. 7=周日
  bigPeriod: number;    // 第几大节
  weeksRule: WeeksRule;
  credit?: number;
  note?: string;
  color?: string;
}

export interface Plan {
  id: string;
  date: string; // yyyy-mm-dd
  title: string;
  content?: string;
  time?: string; // HH:mm
  board: 'plan' | 'doing' | 'done';
  completed: boolean;
  review?: string;
}

export interface Note {
  id: string;
  date: string;
  title: string;
  content: string;
}

export interface BackupMeta {
  id: string;
  createdAt: string;
  type: 'auto' | 'manual';
  keepForever: boolean;
}