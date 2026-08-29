import { Course, Plan, Note, ScheduleSetting, Semester } from '../types';

export interface BackupData {
  version: number;
  exportedAt: string;
  semester?: Semester;
  setting?: ScheduleSetting;
  courses: Course[];
  plans: Plan[];
  notes: Note[];
}

export function createBackupData(input: {
  semester?: Semester;
  setting?: ScheduleSetting;
  courses: Course[];
  plans: Plan[];
  notes: Note[];
}): BackupData {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    semester: input.semester,
    setting: input.setting,
    courses: input.courses,
    plans: input.plans,
    notes: input.notes,
  };
}

export function validateBackup(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!data || typeof data !== 'object') {
    errors.push('备份内容不是有效对象');
    return { valid: false, errors };
  }
  const d = data as Partial<BackupData>;
  if (!Array.isArray(d.courses)) errors.push('缺少 courses 数组');
  if (!Array.isArray(d.plans)) errors.push('缺少 plans 数组');
  if (!Array.isArray(d.notes)) errors.push('缺少 notes 数组');
  return { valid: errors.length === 0, errors };
}

export function restoreFromBackup(data: unknown): BackupData {
  const check = validateBackup(data);
  if (!check.valid) {
    throw new Error('备份无效：' + check.errors.join('；'));
  }
  return data as BackupData;
}
