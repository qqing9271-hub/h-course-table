import { allWeeks, oddWeeks, evenWeeks, toggleWeeks, invertWeeks, ruleFromWeeks } from '../src/domain/weeks';

test('周数选择: 全部/单/双', () => {
  expect(allWeeks(4)).toEqual([1, 2, 3, 4]);
  expect(oddWeeks(6)).toEqual([1, 3, 5]);
  expect(evenWeeks(6)).toEqual([2, 4, 6]);
});

test('周数选择: 切换与反选', () => {
  let w = toggleWeeks([1, 3], 2);
  expect(w).toEqual([1, 2, 3]);
  w = toggleWeeks(w, 1);
  expect(w).toEqual([2, 3]);
  expect(invertWeeks([1, 3], 4)).toEqual([2, 4]);
});

test('周数选择: 模式判断', () => {
  expect(ruleFromWeeks(allWeeks(25), 25)).toBe('all');
  expect(ruleFromWeeks(oddWeeks(25), 25)).toBe('odd');
  expect(ruleFromWeeks(evenWeeks(25), 25)).toBe('even');
  expect(ruleFromWeeks([1, 3, 5], 25)).toBe('custom');
});
