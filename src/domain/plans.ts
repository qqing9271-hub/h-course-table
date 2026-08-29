import { Plan } from '../types';

let seq = 0;

export function createPlan(
  date: string,
  title: string,
  content?: string,
  board: Plan['board'] = 'plan',
): Plan {
  seq += 1;
  return { id: 'p' + seq, date, title, content, board, completed: false };
}

export function movePlan(plans: Plan[], id: string, board: Plan['board']): Plan[] {
  return plans.map((p) => (p.id === id ? { ...p, board } : p));
}

export function setCompleted(plans: Plan[], id: string, completed: boolean): Plan[] {
  return plans.map((p) =>
    p.id === id ? { ...p, completed, board: completed ? 'done' : p.board } : p,
  );
}

export function writeReview(plans: Plan[], id: string, review: string): Plan[] {
  return plans.map((p) => (p.id === id ? { ...p, review } : p));
}

export function getPlansByDate(plans: Plan[], date: string): Plan[] {
  const order: Record<Plan['board'], number> = { plan: 0, doing: 1, done: 2 };
  return plans
    .filter((p) => p.date === date)
    .sort((a, b) => order[a.board] - order[b.board]);
}
