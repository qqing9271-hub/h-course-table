import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useAppStore } from '../store/appStore';
import { currentWeek, isBeforeSemester, isAfterSemester, parseDate } from '../domain/semester';
import { buildDayTimeline, buildWeekGrid } from '../domain/schedule';
import { coursesForSemester } from '../domain/semesters';
import CourseEditModal from '../components/CourseEditModal';
import TodayPlanScreen from './TodayPlanScreen';
import { Course } from '../types';

const WEEK_NAMES = ['', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];

function localDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + day;
}
function weekdayOne(d: Date): number {
  return ((d.getDay() + 6) % 7) + 1;
}

export default function HomeScreen({ goTo }: { goTo: (tab: string) => void }) {
  const { semester, setting, courses: allCourses, setSetting, addCourse, updateCourse } = useAppStore();
  const courses = coursesForSemester(allCourses, semester?.id);
  const [view, setView] = useState<'day' | 'week'>('day');
  const [editCell, setEditCell] = useState<{ weekday: number; bigPeriod: number; course?: Course } | null>(null);
  const today = new Date();
  const dstr = localDateStr(today);
  const rawWeek = semester ? currentWeek(semester, dstr) : 0;
  const validWeek = Number.isFinite(rawWeek) ? rawWeek : 0;
  const before = semester ? isBeforeSemester(semester, dstr) : false;
  const after = semester ? isAfterSemester(semester, dstr) : false;
  const inSemester = !!semester && validWeek >= 1 && !before && !after;
  let displayDate = today;
  if (semester && !inSemester) {
    const sd = parseDate(semester.startDate);
    if (!isNaN(sd.getTime())) displayDate = sd;
  }
  const displayDstr = localDateStr(displayDate);
  const displayWd = weekdayOne(displayDate);
  const displayWeek = inSemester ? validWeek : 1;
  let weekText = '未设置学期';
  if (semester) {
    if (inSemester) weekText = '第 ' + validWeek + ' 周';
    else if (before) weekText = '未开学';
    else if (after) weekText = '已结束';
  }
  const dayCount = setting.showWeekend ? 7 : 5;
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);
  const dayTimeline = buildDayTimeline(courses, displayWd, displayWeek, setting.periodsPerDay, setting.bigPeriodSize);
  const weekGrid = buildWeekGrid(courses, displayWeek, setting, days);

  function renderDay() {
    return (
      <View>
        {dayTimeline.map((slot) => {
          const pt = setting.periodTimes[slot.bigIndex - 1];
          return (
            <TouchableOpacity key={slot.bigIndex} style={styles.slot} onPress={() => setEditCell({ weekday: displayWd, bigPeriod: slot.bigIndex, course: slot.courses[0] })}>
              <Text style={styles.slotLabel}>{'第 ' + slot.bigIndex + ' 大节' + (pt && pt.start ? '  ' + pt.start + '-' + pt.end : '')}</Text>
              {slot.courses.length === 0 ? <Text style={styles.empty}>（无课，点击添加）</Text> : slot.courses.map((c) => (
                <View key={c.id} style={styles.course}>
                  <Text style={styles.courseName}>{c.name}</Text>
                  <Text style={styles.courseMeta}>{c.teacher ? c.teacher : ''}{c.room ? ' ' + c.room : ''}</Text>
                </View>
              ))}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  function renderWeek() {
    return (
      <View>
        <View style={styles.gridHeader}>
          <View style={styles.timeCol} />
          {days.map((d) => (<View key={d} style={styles.gridHeadCell}><Text style={styles.gridHeadTxt}>{WEEK_NAMES[d]}</Text></View>))}
        </View>
        {weekGrid.map((row) => (
          <View key={row.bigPeriod} style={styles.gridRow}>
            <View style={styles.timeCol}>
              <Text style={styles.timeTxt}>{String(row.bigPeriod)}</Text>
              <Text style={styles.timeSmall}>{row.start ? row.start + '-' + row.end : ''}</Text>
            </View>
            {row.cells.map((cell) => (
              <TouchableOpacity key={cell.day} style={styles.gridCell} onPress={() => setEditCell({ weekday: cell.day, bigPeriod: row.bigPeriod, course: cell.courses[0] })}>
                {cell.courses.map((c) => (
                  <View key={c.id} style={styles.course}>
                    <Text style={styles.courseName}>{c.name}</Text>
                    <Text style={styles.courseMeta}>{c.room ? c.room : ''}</Text>
                  </View>
                ))}
                {cell.courses.length === 0 ? <Text style={styles.empty}>+</Text> : null}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.date}>{displayDstr}</Text>
          <Text style={styles.sub}>{semester ? semester.name + ' · ' + weekText : '未设置学期'}</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.checkRow} onPress={() => setSetting({ ...setting, showWeekend: !setting.showWeekend })}>
            <View style={[styles.checkbox, setting.showWeekend && styles.checkboxOn]}>{setting.showWeekend ? <Text style={styles.checkMark}>✓</Text> : null}</View>
            <Text style={styles.checkTxt}>显示周六日</Text>
          </TouchableOpacity>
        </View>
      </View>

      {before || after ? <Text style={styles.warn}>{before ? '未开学，已显示开学第一天' : '学期已结束'}</Text> : null}

      <View style={styles.toggle}>
        <TouchableOpacity onPress={() => setView('day')} style={[styles.togBtn, view === 'day' && styles.togActive]}><Text>当日</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setView('week')} style={[styles.togBtn, view === 'week' && styles.togActive]}><Text>一周</Text></TouchableOpacity>
      </View>

      <Text style={styles.sectionTitle}>课程表（点击格子可添加/编辑课程）</Text>
      {view === 'day' ? renderDay() : renderWeek()}

      <Text style={styles.sectionTitle}>编辑课表：直接在下面格子点击选择时间段添加课程；节数/时间/导入导出在「课表」页</Text>

      <TodayPlanScreen />

      {editCell ? (
        <CourseEditModal
          visible={!!editCell}
          semesterId={semester?.id}
          weekday={editCell.weekday}
          bigPeriod={editCell.bigPeriod}
          course={editCell.course}
          onClose={() => setEditCell(null)}
          onSave={(c) => { if (editCell.course) updateCourse(c); else addCourse(c); setEditCell(null); }}
        />
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 40, paddingHorizontal: 12, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  headerLeft: { flex: 1 },
  headerRight: { alignItems: 'flex-end' },
  date: { fontSize: 24, fontWeight: '700' },
  sub: { color: '#666', marginTop: 4 },
  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 1, borderColor: '#999', alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  checkboxOn: { backgroundColor: '#4a90e2', borderColor: '#4a90e2' },
  checkMark: { color: '#fff', fontSize: 12 },
  checkTxt: { color: '#444', fontSize: 13 },
  toggle: { flexDirection: 'row', marginBottom: 8 },
  togBtn: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 8, backgroundColor: '#ddd', marginRight: 8 },
  togActive: { backgroundColor: '#4a90e2' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#555', marginTop: 8, marginBottom: 6 },
  slot: { backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8 },
  slotLabel: { color: '#888', fontSize: 12, marginBottom: 4 },
  empty: { color: '#bbb' },
  course: { marginTop: 4 },
  courseName: { fontSize: 16, fontWeight: '600' },
  courseMeta: { color: '#666', fontSize: 12 },
  warn: { color: '#c00', marginBottom: 8 },
  gridHeader: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, paddingVertical: 6 },
  gridHeadCell: { flex: 1, alignItems: 'center' },
  gridHeadTxt: { fontWeight: '700', fontSize: 13 },
  gridRow: { flexDirection: 'row', backgroundColor: '#fff', borderRadius: 8, marginTop: 4, padding: 4, minHeight: 64 },
  timeCol: { width: 70, justifyContent: 'center', alignItems: 'center', paddingRight: 4 },
  timeTxt: { fontWeight: '700', fontSize: 14 },
  timeSmall: { fontSize: 10, color: '#888', textAlign: 'center' },
  gridCell: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
});
