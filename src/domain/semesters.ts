import { Course, Semester } from '../types';

export function coursesForSemester(courses: Course[], semesterId: string | null | undefined): Course[] {
  if (!semesterId) return [];
  return courses.filter((c) => c.semesterId === semesterId);
}

export function upsertSemester(semesters: Semester[], s: Semester): Semester[] {
  const idx = semesters.findIndex((x) => x.id === s.id);
  if (idx < 0) return [...semesters, s];
  const copy = [...semesters];
  copy[idx] = s;
  return copy;
}

export function removeSemesterFromList(semesters: Semester[], id: string): Semester[] {
  return semesters.filter((s) => s.id !== id);
}
