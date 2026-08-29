import { createBackupData, validateBackup, restoreFromBackup } from '../src/domain/backup';

test('AC-B01: 有效备份校验通过', () => {
  const data = createBackupData({ courses: [], plans: [], notes: [] });
  expect(validateBackup(data).valid).toBe(true);
});

test('AC-B01: 缺字段的无效备份被拒绝', () => {
  const r = validateBackup({ courses: [], plans: [] });
  expect(r.valid).toBe(false);
  expect(r.errors.join()).toContain('notes');
});

test('AC-B01: 恢复前校验，无效备份抛错', () => {
  expect(() => restoreFromBackup({ courses: [] })).toThrow();
  const data = createBackupData({ courses: [], plans: [], notes: [] });
  expect(restoreFromBackup(data).courses).toEqual([]);
});
