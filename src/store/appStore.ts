import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { Course, Plan, Note, Semester, ScheduleSetting } from '../types';
import { defaultScheduleSetting } from '../domain/schedule';
import {
  createPlan,
  movePlan as movePlanFn,
  setCompleted as setCompletedFn,
  writeReview as writeReviewFn,
} from '../domain/plans';
import { restoreFromBackup, shouldAutoBackup, pruneBackups, MAX_AUTO_BACKUPS } from '../domain/backup';
import { upsertSemester, removeSemesterFromList } from '../domain/semesters';

export interface BackupRecord {
  id: string;
  createdAt: string;
  type: 'auto' | 'manual';
  keepForever: boolean;
}

export type BackupDataLike = {
  courses: Course[];
  plans: Plan[];
  notes: Note[];
  semester?: Semester;
  setting?: ScheduleSetting;
};

interface AppState {
  semester: Semester | null;
  semesters: Semester[];
  activeSemesterId: string | null;
  setting: ScheduleSetting;
  courses: Course[];
  plans: Plan[];
  notes: Note[];
  backups: BackupRecord[];
  lastAutoBackupAt?: string;
  setSemester: (s: Semester | null) => void;
  addSemester: (s: Semester) => void;
  removeSemesterAction: (id: string) => void;
  setActiveSemester: (id: string) => void;
  setSetting: (s: ScheduleSetting) => void;
  addCourse: (c: Course) => void;
  updateCourse: (c: Course) => void;
  removeCourse: (id: string) => void;
  importCourses: (cs: Course[]) => void;
  replaceCourses: (cs: Course[]) => void;
  replaceCoursesForSemester: (cs: Course[], semesterId: string) => void;
  addPlan: (date: string, title: string, content?: string) => void;
  movePlanAction: (id: string, board: Plan['board']) => void;
  completePlan: (id: string, done: boolean) => void;
  addReview: (id: string, review: string) => void;
  addNote: (n: Note) => void;
  removeNote: (id: string) => void;
  manualBackup: () => void;
  maybeAutoBackup: () => void;
  restoreBackup: (data: BackupDataLike) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      semester: null,
      semesters: [],
      activeSemesterId: null,
      setting: defaultScheduleSetting(),
      courses: [],
      plans: [],
      notes: [],
      backups: [],
      lastAutoBackupAt: undefined,
      setSemester: (s) =>
        set((st) => ({
          semester: s,
          semesters: s ? upsertSemester(st.semesters, s) : st.semesters,
          activeSemesterId: s ? s.id : null,
        })),
      addSemester: (s) =>
        set((st) => ({
          semesters: upsertSemester(st.semesters, s),
          semester: s,
          activeSemesterId: s.id,
        })),
      removeSemesterAction: (id) =>
        set((st) => {
          const semesters = removeSemesterFromList(st.semesters, id);
          const next = st.activeSemesterId === id ? (semesters[0] ?? null) : st.semester;
          return { semesters, semester: next, activeSemesterId: next ? next.id : null };
        }),
      setActiveSemester: (id) =>
        set((st) => {
          const s = st.semesters.find((x) => x.id === id) ?? null;
          return { semester: s, activeSemesterId: id };
        }),
      setSetting: (s) => set({ setting: s }),
      addCourse: (c) => set((st) => ({ courses: [...st.courses, c] })),
      updateCourse: (c) =>
        set((st) => ({ courses: st.courses.map((x) => (x.id === c.id ? c : x)) })),
      removeCourse: (id) => set((st) => ({ courses: st.courses.filter((x) => x.id !== id) })),
      importCourses: (cs) => set((st) => ({ courses: [...st.courses, ...cs] })),
      replaceCourses: (cs) => set({ courses: cs }),
      replaceCoursesForSemester: (cs, semesterId) =>
        set((st) => ({
          courses: [
            ...st.courses.filter((c) => c.semesterId && c.semesterId !== semesterId),
            ...cs.map((c) => ({ ...c, semesterId })),
          ],
        })),
      addPlan: (date, title, content) =>
        set((st) => ({ plans: [...st.plans, createPlan(date, title, content)] })),
      movePlanAction: (id, board) => set((st) => ({ plans: movePlanFn(st.plans, id, board) })),
      completePlan: (id, done) => set((st) => ({ plans: setCompletedFn(st.plans, id, done) })),
      addReview: (id, review) => set((st) => ({ plans: writeReviewFn(st.plans, id, review) })),
      addNote: (n) => set((st) => ({ notes: [...st.notes, n] })),
      removeNote: (id) => set((st) => ({ notes: st.notes.filter((x) => x.id !== id) })),
      manualBackup: () => {
        const st = get();
        const rec: BackupRecord = {
          id: 'bk' + Date.now(),
          createdAt: new Date().toISOString(),
          type: 'manual',
          keepForever: false,
        };
        set((s) => ({ backups: [...s.backups, rec] }));
      },
      maybeAutoBackup: () => {
        const st = get();
        const now = Date.now();
        if (!shouldAutoBackup(st.lastAutoBackupAt ?? null, now)) return;
        const rec: BackupRecord = {
          id: 'auto' + now,
          createdAt: new Date(now).toISOString(),
          type: 'auto',
          keepForever: false,
        };
        const backups = pruneBackups([...st.backups, rec], MAX_AUTO_BACKUPS);
        set({ backups, lastAutoBackupAt: new Date(now).toISOString() });
      },
      restoreBackup: (data) => {
        const restored = restoreFromBackup(data);
        set({
          courses: restored.courses,
          plans: restored.plans,
          notes: restored.notes,
          semester: restored.semester ?? null,
          setting: restored.setting ?? defaultScheduleSetting(),
        });
      },
      resetAll: () =>
        set({
          semester: null,
          semesters: [],
          activeSemesterId: null,
          setting: defaultScheduleSetting(),
          courses: [],
          plans: [],
          notes: [],
          backups: [],
          lastAutoBackupAt: undefined,
        }),
    }),
    {
      name: 'h-course-table',
      storage: createJSONStorage(() =>
        Platform.OS === 'web' ? ((globalThis as any).localStorage as any) : AsyncStorage,
      ),
      merge: (persistedState: unknown, currentState: AppState): AppState => {
        const p = (persistedState ?? {}) as Partial<AppState>;
        const semesters: Semester[] =
          p.semesters && p.semesters.length ? p.semesters : p.semester ? [p.semester] : [];
        const activeId = p.activeSemesterId ?? semesters[0]?.id ?? null;
        const sem = semesters.find((s) => s.id === activeId) ?? null;
        const courses: Course[] = (p.courses ?? []).map((c) =>
          c.semesterId ? c : { ...c, semesterId: activeId ?? undefined },
        );
        return {
          ...currentState,
          ...p,
          semesters,
          activeSemesterId: activeId,
          semester: sem,
          setting: { ...defaultScheduleSetting(), ...(p.setting ?? {}) },
          courses,
        };
      },
    },
  ),
);
