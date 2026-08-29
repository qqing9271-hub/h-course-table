import { shouldAutoBackup, pruneBackups, AUTO_BACKUP_INTERVAL_MS, MAX_AUTO_BACKUPS } from '../src/domain/backup';

test('AC-B01: 无上次备份时应自动备份', () => {
  expect(shouldAutoBackup(null, Date.now())).toBe(true);
});
test('AC-B01: 未到间隔不自动备份', () => {
  const last = new Date(Date.now() - 1000).toISOString();
  expect(shouldAutoBackup(last, Date.now(), AUTO_BACKUP_INTERVAL_MS)).toBe(false);
});
test('AC-B01: 超过间隔应自动备份', () => {
  const last = new Date(Date.now() - AUTO_BACKUP_INTERVAL_MS - 1).toISOString();
  expect(shouldAutoBackup(last, Date.now(), AUTO_BACKUP_INTERVAL_MS)).toBe(true);
});
test('AC-B01: 只保留最近 30 份自动备份，保留长期备份', () => {
  const mk = (id: string, keep = false) => ({ id, createdAt: new Date().toISOString(), type: 'auto' as const, keepForever: keep });
  const arr: ReturnType<typeof mk>[] = [];
  for (let i = 0; i < MAX_AUTO_BACKUPS + 5; i++) arr.push(mk('a' + i));
  arr.push(mk('forever', true));
  const pruned = pruneBackups(arr, MAX_AUTO_BACKUPS);
  expect(pruned).toHaveLength(MAX_AUTO_BACKUPS + 1);
  expect(pruned.some((b) => b.id === 'forever')).toBe(true);
  expect(pruned.some((b) => b.id === 'a0')).toBe(false);
});
