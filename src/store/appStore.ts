import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Course, Plan, Note, Semester, ScheduleSetting } from '../types';
import { defaultScheduleSetting } from '../domain/schedule';
import {
  createPlan,
  movePlan as movePlanFn,
  setCompleted as setCompletedFn,
  writeReview as writeReviewFn,
} from '../domain/plans';
import { restoreFromBackup } from '../domain/backup';

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
  setting: ScheduleSetting;
  courses: Course[];
  plans: Plan[];
  notes: Note[];
  backups: BackupRecord[];
  setSemester: (s: Semester | null) => void;
  setSetting: (s: ScheduleSetting) => void;
  addCourse: (c: Course) => void;
  updateCourse: (c: Course) => void;
  removeCourse: (id: string) => void;
  importCourses: (cs: Course[]) => void;
  addPlan: (date: string, title: string, content?: string) => void;
  movePlanAction: (id: string, board: Plan['board']) => void;
  completePlan: (id: string, done: boolean) => void;
  addReview: (id: string, review: string) => void;
  addNote: (n: Note) => void;
  removeNote: (id: string) => void;
  manualBackup: () => void;
  restoreBackup: (data: BackupDataLike) => void;
  resetAll: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      semester: null,
      setting: defaultScheduleSetting(),
      courses: [],
      plans: [],
      notes: [],
      backups: [],
      setSemester: (s) => set({ semester: s }),
      setSetting: (s) => set({ setting: s }),
      addCourse: (c) => set((st) => ({ courses: [...st.courses, c] })),
      updateCourse: (c) =>
        set((st) => ({ courses: st.courses.map((x) => (x.id === c.id ? c : x)) })),
      removeCourse: (id) => set((st) => ({ courses: st.courses.filter((x) => x.id !== id) })),
      importCourses: (cs) => set((st) => ({ courses: [...st.courses, ...cs] })),
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
          setting: defaultScheduleSetting(),
          courses: [],
          plans: [],
          notes: [],
          backups: [],
        }),
    }),
    {
      name: 'h-course-table',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
