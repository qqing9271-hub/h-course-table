import { Plan } from '../src/types';
import { createPlan, movePlan, setCompleted, writeReview, getPlansByDate } from '../src/domain/plans';

test('AC-P01: 创建计划并按板块移动', () => {
  let plans: Plan[] = [createPlan('2026-08-29', '写作业', '数学作业')];
  plans = movePlan(plans, plans[0].id, 'doing');
  expect(plans[0].board).toBe('doing');
  plans = movePlan(plans, plans[0].id, 'done');
  expect(plans[0].board).toBe('done');
});

test('AC-P01: 完成标记与复盘', () => {
  let plans: Plan[] = [createPlan('2026-08-29', '背单词')];
  plans = setCompleted(plans, plans[0].id, true);
  expect(plans[0].completed).toBe(true);
  expect(plans[0].board).toBe('done');
  plans = writeReview(plans, plans[0].id, '完成得不错');
  expect(plans[0].review).toBe('完成得不错');
});

test('AC-P01: 按日期筛选计划并按板块排序', () => {
  const plans: Plan[] = [
    createPlan('2026-08-29', 'A', undefined, 'done'),
    createPlan('2026-08-29', 'B', undefined, 'plan'),
    createPlan('2026-08-29', 'C', undefined, 'doing'),
    createPlan('2026-08-28', '昨天', undefined, 'plan'),
  ];
  const today = getPlansByDate(plans, '2026-08-29');
  expect(today.map((p) => p.title)).toEqual(['B', 'C', 'A']);
});
test('移动一条计划不影响其他计划', () => {
  let plans: Plan[] = [
    createPlan('2026-08-29', 'A'),
    createPlan('2026-08-29', 'B'),
    createPlan('2026-08-29', 'C'),
  ];
  plans = movePlan(plans, plans[1].id, 'doing');
  expect(plans[0].title).toBe('A');
  expect(plans[0].board).toBe('plan');
  expect(plans[1].title).toBe('B');
  expect(plans[1].board).toBe('doing');
  expect(plans[2].title).toBe('C');
  expect(plans[2].board).toBe('plan');
});
